import {
  type LocatedLiteral,
  type QuoteKind,
  type SupportedLanguageId,
  isJavaScriptLanguage,
} from "./model.ts";

const EXPRESSION_PREFIX_KEYWORDS = new Set([
  "await",
  "break",
  "case",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "extends",
  "in",
  "instanceof",
  "new",
  "of",
  "return",
  "throw",
  "typeof",
  "void",
  "yield",
]);

const CONTROL_PAREN_KEYWORDS = new Set(["catch", "for", "if", "switch", "while", "with"]);

interface ScanContext {
  canStartRegex: boolean;
  lastToken: TokenSummary | undefined;
  readonly parens: Array<"control" | "normal">;
  readonly braces: Array<"block" | "object">;
}

interface TokenSummary {
  readonly kind: "identifier" | "keyword" | "literal" | "punctuator";
  readonly text: string;
  readonly end: number;
}

interface ScanBoundary {
  readonly stopAtClosingBrace: boolean;
}

interface LiteralCollector {
  readonly literals: LocatedLiteral[];
  readonly maximum: number;
  truncated: boolean;
}

export interface LiteralScanResult {
  readonly literals: readonly LocatedLiteral[];
  readonly truncated: boolean;
}

export function scanLiterals(
  source: string,
  languageId: SupportedLanguageId,
): readonly LocatedLiteral[] {
  return scanLiteralsBounded(source, languageId, Number.MAX_SAFE_INTEGER).literals;
}

export function scanLiteralsBounded(
  source: string,
  languageId: SupportedLanguageId,
  maximum: number,
): LiteralScanResult {
  const collector: LiteralCollector = {
    literals: [],
    maximum: Math.max(1, Math.floor(maximum)),
    truncated: false,
  };
  if (!isJavaScriptLanguage(languageId)) {
    scanJsonLiterals(source, languageId === "jsonc", languageId, collector);
  } else {
    const context: ScanContext = {
      canStartRegex: true,
      lastToken: undefined,
      parens: [],
      braces: [],
    };
    scanJavaScriptRange(source, 0, source.length, languageId, collector, context, {
      stopAtClosingBrace: false,
    });
  }
  collector.literals.sort(
    (left, right) => left.range.start - right.range.start || left.range.end - right.range.end,
  );
  return { literals: collector.literals, truncated: collector.truncated };
}

function scanJsonLiterals(
  source: string,
  allowComments: boolean,
  languageId: Extract<SupportedLanguageId, "json" | "jsonc">,
  collector: LiteralCollector,
): void {
  let index = 0;
  while (index < source.length) {
    const character = source[index];
    if (allowComments && character === "/" && source[index + 1] === "/") {
      index = skipLineComment(source, index + 2, source.length);
      continue;
    }
    if (allowComments && character === "/" && source[index + 1] === "*") {
      index = skipBlockComment(source, index + 2, source.length);
      continue;
    }
    if (character === '"') {
      const scanned = scanQuotedString(source, index, source.length, '"');
      if (!collectLiteral(collector, {
        range: { start: index, end: scanned.end },
        languageId,
        delimiter: "double",
        kind: "string",
        rawBody: source.slice(index + 1, Math.max(index + 1, scanned.bodyEnd)),
        terminated: scanned.terminated,
        hasInterpolation: false,
        tagged: false,
        directiveLike: false,
      })) return;
      index = Math.max(index + 1, scanned.end);
      continue;
    }
    index += 1;
  }
}

function scanJavaScriptRange(
  source: string,
  initialIndex: number,
  limit: number,
  languageId: Extract<SupportedLanguageId, "javascript" | "typescript">,
  collector: LiteralCollector,
  context: ScanContext,
  boundary: ScanBoundary,
): number {
  let index = initialIndex;
  while (index < limit) {
    const character = source[index];

    if (isWhitespace(character)) {
      index += 1;
      continue;
    }

    if (character === "/" && source[index + 1] === "/") {
      index = skipLineComment(source, index + 2, limit);
      continue;
    }
    if (character === "/" && source[index + 1] === "*") {
      index = skipBlockComment(source, index + 2, limit);
      continue;
    }

    if (character === "'" || character === '"') {
      const scanned = scanQuotedString(source, index, limit, character);
      const directiveLike = isDirectiveLike(source, index, scanned.end, context.lastToken);
      if (!collectLiteral(collector, {
        range: { start: index, end: scanned.end },
        languageId,
        delimiter: character === "'" ? "single" : "double",
        kind: "string",
        rawBody: source.slice(index + 1, Math.max(index + 1, scanned.bodyEnd)),
        terminated: scanned.terminated,
        hasInterpolation: false,
        tagged: false,
        directiveLike,
      })) return limit;
      context.lastToken = { kind: "literal", text: character, end: scanned.end };
      context.canStartRegex = false;
      index = Math.max(index + 1, scanned.end);
      continue;
    }

    if (character === "`") {
      // A closing brace can end an expression (object, class, or function) or a
      // statement block. Treat it as a possible tag rather than risk changing
      // a tagged call into a plain string.
      const tagged = !context.canStartRegex || context.lastToken?.text === "}";
      const scanned = scanTemplate(source, index, limit, languageId, collector);
      if (collector.truncated) return limit;
      if (!collectLiteral(collector, {
        range: { start: index, end: scanned.end },
        languageId,
        delimiter: "template",
        kind: "template",
        rawBody: source.slice(index + 1, Math.max(index + 1, scanned.bodyEnd)),
        terminated: scanned.terminated,
        hasInterpolation: scanned.hasInterpolation,
        tagged,
        directiveLike: false,
      })) return limit;
      context.lastToken = { kind: "literal", text: "`", end: scanned.end };
      context.canStartRegex = false;
      index = Math.max(index + 1, scanned.end);
      continue;
    }

    if (character === "/" && context.canStartRegex) {
      const regex = skipRegexLiteral(source, index, limit);
      if (!regex.terminated) return limit;
      context.lastToken = { kind: "literal", text: "/", end: regex.end };
      context.canStartRegex = false;
      index = Math.max(index + 1, regex.end);
      continue;
    }

    if (isIdentifierStartAt(source, index)) {
      const start = index;
      index += codePointLengthAt(source, index);
      while (index < limit && isIdentifierPartAt(source, index)) {
        index += codePointLengthAt(source, index);
      }
      const word = source.slice(start, index);
      const prefix = EXPRESSION_PREFIX_KEYWORDS.has(word);
      context.lastToken = {
        kind: prefix || CONTROL_PAREN_KEYWORDS.has(word) ? "keyword" : "identifier",
        text: word,
        end: index,
      };
      context.canStartRegex = prefix;
      continue;
    }

    if (isDecimalDigit(character) || (character === "." && isDecimalDigit(source[index + 1]))) {
      index = skipNumber(source, index, limit);
      context.lastToken = { kind: "literal", text: "number", end: index };
      context.canStartRegex = false;
      continue;
    }

    if (character === "(") {
      const role = context.lastToken?.kind === "keyword" && CONTROL_PAREN_KEYWORDS.has(context.lastToken.text)
        ? "control"
        : "normal";
      context.parens.push(role);
      context.lastToken = { kind: "punctuator", text: "(", end: index + 1 };
      context.canStartRegex = true;
      index += 1;
      continue;
    }
    if (character === ")") {
      const role = context.parens.pop() ?? "normal";
      context.lastToken = { kind: "punctuator", text: ")", end: index + 1 };
      context.canStartRegex = role === "control";
      index += 1;
      continue;
    }
    if (character === "{") {
      const role = inferBraceRole(context);
      context.braces.push(role);
      context.lastToken = { kind: "punctuator", text: "{", end: index + 1 };
      context.canStartRegex = true;
      index += 1;
      continue;
    }
    if (character === "}") {
      if (boundary.stopAtClosingBrace && context.braces.length === 0) return index;
      const role = context.braces.pop() ?? "block";
      context.lastToken = { kind: "punctuator", text: "}", end: index + 1 };
      context.canStartRegex = role === "block";
      index += 1;
      continue;
    }
    if (character === "[" || character === "," || character === ";" || character === ":" || character === "?") {
      if (character === "[") context.parens.push("normal");
      context.lastToken = { kind: "punctuator", text: character, end: index + 1 };
      context.canStartRegex = true;
      index += 1;
      continue;
    }
    if (character === "]") {
      context.parens.pop();
      context.lastToken = { kind: "punctuator", text: character, end: index + 1 };
      context.canStartRegex = false;
      index += 1;
      continue;
    }
    if (character === ".") {
      context.lastToken = { kind: "punctuator", text: character, end: index + 1 };
      context.canStartRegex = false;
      index += 1;
      continue;
    }
    if ((character === "+" || character === "-") && source[index + 1] === character) {
      context.lastToken = { kind: "punctuator", text: character + character, end: index + 2 };
      context.canStartRegex = false;
      index += 2;
      continue;
    }

    const punctuatorLength = readOperatorLength(source, index);
    context.lastToken = {
      kind: "punctuator",
      text: source.slice(index, index + punctuatorLength),
      end: index + punctuatorLength,
    };
    context.canStartRegex = true;
    index += punctuatorLength;
  }
  return index;
}

interface QuotedScan {
  readonly end: number;
  readonly bodyEnd: number;
  readonly terminated: boolean;
}

function scanQuotedString(source: string, start: number, limit: number, delimiter: "'" | '"'): QuotedScan {
  let index = start + 1;
  while (index < limit) {
    const character = source[index];
    if (character === delimiter) {
      return { end: index + 1, bodyEnd: index, terminated: true };
    }
    if (character === "\\") {
      if (source[index + 1] === "\r" && source[index + 2] === "\n") index += 3;
      else index += Math.min(2, limit - index);
      continue;
    }
    if (isLineTerminator(character)) {
      return { end: index, bodyEnd: index, terminated: false };
    }
    index += 1;
  }
  return { end: limit, bodyEnd: limit, terminated: false };
}

interface TemplateScan extends QuotedScan {
  readonly hasInterpolation: boolean;
}

function scanTemplate(
  source: string,
  start: number,
  limit: number,
  languageId: Extract<SupportedLanguageId, "javascript" | "typescript">,
  collector: LiteralCollector,
): TemplateScan {
  let index = start + 1;
  let hasInterpolation = false;
  while (index < limit) {
    const character = source[index];
    if (character === "\\") {
      if (source[index + 1] === "\r" && source[index + 2] === "\n") index += 3;
      else index += Math.min(2, limit - index);
      continue;
    }
    if (character === "`") {
      return { end: index + 1, bodyEnd: index, terminated: true, hasInterpolation };
    }
    if (character === "$" && source[index + 1] === "{") {
      hasInterpolation = true;
      const expressionContext: ScanContext = {
        canStartRegex: true,
        lastToken: undefined,
        parens: [],
        braces: [],
      };
      const closingBrace = scanJavaScriptRange(
        source,
        index + 2,
        limit,
        languageId,
        collector,
        expressionContext,
        { stopAtClosingBrace: true },
      );
      if (closingBrace >= limit || source[closingBrace] !== "}") {
        return { end: limit, bodyEnd: limit, terminated: false, hasInterpolation };
      }
      index = closingBrace + 1;
      continue;
    }
    index += 1;
  }
  return { end: limit, bodyEnd: limit, terminated: false, hasInterpolation };
}

function collectLiteral(collector: LiteralCollector, literal: LocatedLiteral): boolean {
  if (collector.literals.length >= collector.maximum) {
    collector.truncated = true;
    return false;
  }
  collector.literals.push(literal);
  return true;
}

function skipRegexLiteral(
  source: string,
  start: number,
  limit: number,
): { readonly end: number; readonly terminated: boolean } {
  let index = start + 1;
  let inCharacterClass = false;
  while (index < limit) {
    const character = source[index];
    if (character === "\\") {
      index += Math.min(2, limit - index);
      continue;
    }
    if (isLineTerminator(character)) return { end: index, terminated: false };
    if (character === "[") inCharacterClass = true;
    else if (character === "]") inCharacterClass = false;
    else if (character === "/" && !inCharacterClass) {
      index += 1;
      while (index < limit && isIdentifierPartAt(source, index)) index += codePointLengthAt(source, index);
      return { end: index, terminated: true };
    }
    index += 1;
  }
  return { end: limit, terminated: false };
}

function skipLineComment(source: string, index: number, limit: number): number {
  while (index < limit && !isLineTerminator(source[index])) index += 1;
  return index;
}

function skipBlockComment(source: string, index: number, limit: number): number {
  while (index < limit) {
    if (source[index] === "*" && source[index + 1] === "/") return index + 2;
    index += 1;
  }
  return limit;
}

function skipNumber(source: string, start: number, limit: number): number {
  let index = start;
  while (index < limit && /[0-9A-Fa-f_xXobOBn.eE+-]/u.test(source[index])) index += 1;
  return index;
}

function inferBraceRole(context: ScanContext): "block" | "object" {
  const previous = context.lastToken;
  if (!previous) return "block";
  if (previous.text === ")" && context.canStartRegex) return "block";
  if (previous.text === "else" || previous.text === "do" || previous.text === "try" || previous.text === "finally") {
    return "block";
  }
  if (previous.text === "=>") return "block";
  if (previous.text === "=" || previous.text === "(" || previous.text === "[" || previous.text === "," || previous.text === ":" || previous.text === "return") {
    return "object";
  }
  return context.canStartRegex ? "block" : "block";
}

function isDirectiveLike(
  source: string,
  start: number,
  end: number,
  previous: TokenSummary | undefined,
): boolean {
  const startsStatement = !previous || previous.text === "{" || previous.text === ";";
  if (!startsStatement) return false;
  let index = end;
  while (index < source.length && (source[index] === " " || source[index] === "\t")) index += 1;
  return source[index] === ";" || source[index] === "\r" || source[index] === "\n" || source[index] === "}" || index === source.length;
}

function readOperatorLength(source: string, index: number): number {
  const four = source.slice(index, index + 4);
  if (four === ">>>=") return 4;
  const three = source.slice(index, index + 3);
  if (["===", "!==", ">>>", "**=", "&&=", "||=", "??=", "<<=", ">>="].includes(three)) return 3;
  const two = source.slice(index, index + 2);
  if (["=>", "==", "!=", "<=", ">=", "&&", "||", "??", "?.", "**", "<<", ">>", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^="].includes(two)) return 2;
  return 1;
}

function isWhitespace(character: string | undefined): boolean {
  return character !== undefined && /\s/u.test(character);
}

function isLineTerminator(character: string | undefined): boolean {
  return character === "\n" || character === "\r" || character === "\u2028" || character === "\u2029";
}

function isDecimalDigit(character: string | undefined): boolean {
  return character !== undefined && character >= "0" && character <= "9";
}

function isIdentifierStartAt(source: string, index: number): boolean {
  const character = codePointAt(source, index);
  return character !== undefined && (character === "$" || character === "_" || /[\p{ID_Start}]/u.test(character));
}

function isIdentifierPartAt(source: string, index: number): boolean {
  const character = codePointAt(source, index);
  return character !== undefined && (character === "$" || character === "_" || /[\p{ID_Continue}\u200c\u200d]/u.test(character));
}

function codePointAt(source: string, index: number): string | undefined {
  const point = source.codePointAt(index);
  return point === undefined ? undefined : String.fromCodePoint(point);
}

function codePointLengthAt(source: string, index: number): number {
  const point = source.codePointAt(index);
  return point !== undefined && point > 0xffff ? 2 : 1;
}
