import { type QuoteKind } from "./model.ts";

export function encodeValue(value: string, target: QuoteKind): string {
  const delimiter = delimiterFor(target);
  let body = "";
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    const character = value[index];
    const next = value[index + 1];

    if (character === "\\") body += "\\\\";
    else if (character === delimiter) body += `\\${character}`;
    else if (target === "template" && character === "$" && next === "{") body += "\\$";
    else if (character === "\b") body += "\\b";
    else if (character === "\f") body += "\\f";
    else if (character === "\n") body += "\\n";
    else if (character === "\r") body += "\\r";
    else if (character === "\t") body += "\\t";
    else if (character === "\v") body += "\\v";
    else if (character === "\0") body += isDecimalDigit(next) ? "\\x00" : "\\0";
    else if (code < 0x20 || code === 0x7f) body += `\\x${hex(code, 2)}`;
    else if (code === 0x2028 || code === 0x2029) body += `\\u${hex(code, 4)}`;
    else if (code >= 0xd800 && code <= 0xdbff) {
      const low = value.charCodeAt(index + 1);
      if (low >= 0xdc00 && low <= 0xdfff) {
        body += character + value[index + 1];
        index += 1;
      } else {
        body += `\\u${hex(code, 4)}`;
      }
    } else if (code >= 0xdc00 && code <= 0xdfff) body += `\\u${hex(code, 4)}`;
    else body += character;
  }
  return `${delimiter}${body}${delimiter}`;
}

export function delimiterFor(kind: QuoteKind): "'" | '"' | "`" {
  if (kind === "single") return "'";
  if (kind === "double") return '"';
  return "`";
}

function hex(value: number, width: number): string {
  return value.toString(16).padStart(width, "0");
}

function isDecimalDigit(character: string | undefined): boolean {
  return character !== undefined && character >= "0" && character <= "9";
}
