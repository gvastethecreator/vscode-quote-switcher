import { type DecodeResult, type LocatedLiteral } from "./model.ts";

const HEX = /^[0-9A-Fa-f]+$/u;

export function decodeLiteral(literal: LocatedLiteral): DecodeResult {
  if (!literal.terminated) return { ok: false, reason: "malformed-literal" };
  if (literal.languageId === "json" || literal.languageId === "jsonc") {
    return decodeJsonLiteral(literal);
  }
  return decodeJavaScriptLiteral(literal);
}

function decodeJsonLiteral(literal: LocatedLiteral): DecodeResult {
  if (literal.delimiter !== "double") return { ok: false, reason: "malformed-literal" };
  try {
    const value: unknown = JSON.parse(`"${literal.rawBody}"`);
    return typeof value === "string"
      ? { ok: true, value }
      : { ok: false, reason: "malformed-literal" };
  } catch {
    return { ok: false, reason: "malformed-literal" };
  }
}

function decodeJavaScriptLiteral(literal: LocatedLiteral): DecodeResult {
  const raw = literal.rawBody;
  let value = "";
  for (let index = 0; index < raw.length; index += 1) {
    const character = raw[index];
    if (character !== "\\") {
      if (literal.delimiter !== "template" && isLineTerminator(character)) {
        return { ok: false, reason: "malformed-literal" };
      }
      if (literal.delimiter === "template" && character === "\r") {
        if (raw[index + 1] === "\n") index += 1;
        value += "\n";
      } else {
        value += character;
      }
      continue;
    }

    if (index + 1 >= raw.length) return { ok: false, reason: "malformed-literal" };
    const escaped = raw[++index];
    if (isLineTerminator(escaped)) return { ok: false, reason: "unsafe-escape" };

    switch (escaped) {
      case "'":
      case '"':
      case "\\":
      case "`":
        value += escaped;
        break;
      case "/":
        value += "/";
        break;
      case "b":
        value += "\b";
        break;
      case "f":
        value += "\f";
        break;
      case "n":
        value += "\n";
        break;
      case "r":
        value += "\r";
        break;
      case "t":
        value += "\t";
        break;
      case "v":
        value += "\v";
        break;
      case "0":
        if (isDecimalDigit(raw[index + 1])) return { ok: false, reason: "unsafe-escape" };
        value += "\0";
        break;
      case "x": {
        const digits = raw.slice(index + 1, index + 3);
        if (digits.length !== 2 || !HEX.test(digits)) return { ok: false, reason: "malformed-literal" };
        value += String.fromCharCode(Number.parseInt(digits, 16));
        index += 2;
        break;
      }
      case "u": {
        const unicode = decodeUnicodeEscape(raw, index + 1);
        if (!unicode) return { ok: false, reason: "malformed-literal" };
        value += unicode.value;
        index = unicode.end - 1;
        break;
      }
      case "$":
        if (literal.delimiter !== "template" || raw[index + 1] !== "{") {
          return { ok: false, reason: "unsafe-escape" };
        }
        value += "$";
        break;
      default:
        return { ok: false, reason: "unsafe-escape" };
    }
  }
  return { ok: true, value };
}

function decodeUnicodeEscape(
  raw: string,
  start: number,
): { readonly value: string; readonly end: number } | undefined {
  if (raw[start] === "{") {
    const closing = raw.indexOf("}", start + 1);
    if (closing === -1) return undefined;
    const digits = raw.slice(start + 1, closing);
    if (digits.length < 1 || digits.length > 6 || !HEX.test(digits)) return undefined;
    const point = Number.parseInt(digits, 16);
    if (point > 0x10ffff) return undefined;
    return { value: String.fromCodePoint(point), end: closing + 1 };
  }

  const digits = raw.slice(start, start + 4);
  if (digits.length !== 4 || !HEX.test(digits)) return undefined;
  return { value: String.fromCharCode(Number.parseInt(digits, 16)), end: start + 4 };
}

function isLineTerminator(character: string | undefined): boolean {
  return character === "\n" || character === "\r" || character === "\u2028" || character === "\u2029";
}

function isDecimalDigit(character: string | undefined): boolean {
  return character !== undefined && character >= "0" && character <= "9";
}
