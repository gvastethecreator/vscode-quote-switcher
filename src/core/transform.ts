import { decodeLiteral } from "./decode.ts";
import { encodeValue } from "./encode.ts";
import {
  type LocatedLiteral,
  type QuoteKind,
  type TransformResult,
  isJavaScriptLanguage,
} from "./model.ts";
import { scanLiterals } from "./scanner.ts";

export function transformLiteral(literal: LocatedLiteral, target: QuoteKind): TransformResult {
  if (!literal.terminated) return { ok: false, reason: "malformed-literal" };
  if (!isJavaScriptLanguage(literal.languageId) && target !== "double") {
    return { ok: false, reason: "unsupported-target" };
  }
  if (literal.tagged) return { ok: false, reason: "tagged-template" };
  if (literal.hasInterpolation) return { ok: false, reason: "active-interpolation" };
  if (literal.directiveLike && target === "template") {
    return { ok: false, reason: "directive-semantics" };
  }
  if (literal.delimiter === target) {
    return {
      ok: true,
      text: `${delimiter(literal.delimiter)}${literal.rawBody}${delimiter(literal.delimiter)}`,
      target,
      changed: false,
    };
  }

  const decoded = decodeLiteral(literal);
  if (!decoded.ok) return decoded;
  const text = encodeValue(decoded.value, target);
  const verification = decodeGenerated(text, target, literal);
  if (!verification.ok || verification.value !== decoded.value) {
    return { ok: false, reason: "unsafe-escape" };
  }
  if (literal.directiveLike && literal.rawBody.includes("\\")) {
    return { ok: false, reason: "directive-semantics" };
  }
  return { ok: true, text, target, changed: true };
}

export function cycleLiteral(
  literal: LocatedLiteral,
  order: readonly QuoteKind[],
): TransformResult {
  if (!isJavaScriptLanguage(literal.languageId)) {
    return { ok: false, reason: "unsupported-target" };
  }
  if (order.length === 0) return { ok: false, reason: "no-safe-target" };
  const current = order.indexOf(literal.delimiter);
  const start = current === -1 ? 0 : current + 1;
  for (let attempt = 0; attempt < order.length; attempt += 1) {
    const target = order[(start + attempt) % order.length];
    if (target === literal.delimiter) continue;
    const transformed = transformLiteral(literal, target);
    if (transformed.ok) return transformed;
  }
  return { ok: false, reason: "no-safe-target" };
}

function decodeGenerated(text: string, target: QuoteKind, original: LocatedLiteral) {
  const generated = scanLiterals(text, original.languageId).find(
    (literal) => literal.range.start === 0 && literal.range.end === text.length,
  );
  if (
    !generated
    || generated.delimiter !== target
    || generated.hasInterpolation
    || generated.tagged
    || !generated.terminated
  ) {
    return { ok: false, reason: "unsafe-escape" } as const;
  }
  return decodeLiteral(generated);
}

function delimiter(kind: QuoteKind): string {
  if (kind === "single") return "'";
  if (kind === "double") return '"';
  return "`";
}
