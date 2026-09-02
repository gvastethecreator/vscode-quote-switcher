import assert from "node:assert/strict";
import test from "node:test";
import { decodeLiteral } from "./decode.ts";
import { encodeValue } from "./encode.ts";
import { type LocatedLiteral, type QuoteKind, type SupportedLanguageId } from "./model.ts";
import { scanLiterals } from "./scanner.ts";
import { cycleLiteral, transformLiteral } from "./transform.ts";

function only(source: string, languageId: SupportedLanguageId = "javascript"): LocatedLiteral {
  const literals = scanLiterals(source, languageId);
  assert.equal(literals.length, 1, `Expected one literal in ${source}`);
  return literals[0];
}

function expression(source: string): LocatedLiteral {
  return only(`const value = ${source};`);
}

test("decodes the supported JavaScript escape subset", () => {
  const literal = only(String.raw`"\b\f\n\r\t\v\0\x41\u0042\u{1f600}\/\\\""`);
  const decoded = decodeLiteral(literal);
  assert.deepEqual(decoded, { ok: true, value: "\b\f\n\r\t\v\0AB😀/\\\"" });
});

test("rejects legacy, identity, incomplete, and line-continuation escapes", () => {
  for (const source of [String.raw`"\1"`, String.raw`"\8"`, String.raw`"\q"`, String.raw`"\x0"`, "\"a\\\nb\""]) {
    const decoded = decodeLiteral(only(source));
    assert.equal(decoded.ok, false, source);
  }
});

test("decodes JSON with strict JSON semantics", () => {
  assert.deepEqual(decodeLiteral(only(String.raw`"a\n\u263a"`, "json")), {
    ok: true,
    value: "a\n☺",
  });
  assert.equal(decodeLiteral(only(String.raw`"\x41"`, "json")).ok, false);
});

test("encodes target delimiters, template interpolation, controls, and lone surrogates", () => {
  assert.equal(encodeValue(`a'b`, "single"), String.raw`'a\'b'`);
  assert.equal(encodeValue('a"b', "double"), String.raw`"a\"b"`);
  assert.equal(encodeValue("${value} `tick`", "template"), "`\\${value} \\`tick\\``");
  assert.equal(encodeValue("\0" + "7\n\ud800", "double"), String.raw`"\x007\n\ud800"`);
});

test("transforms values without semantic drift", () => {
  const fixtures: Array<[string, QuoteKind, string]> = [
    [String.raw`"hello 'world'"`, "single", String.raw`'hello \'world\''`],
    [String.raw`'hello "world"'`, "double", String.raw`"hello \"world\""`],
    ['"literal ${value} and \\`"', "template", "`literal \\${value} and \\``"],
    ["`line 1\nline 2`", "double", String.raw`"line 1\nline 2"`],
  ];
  for (const [source, target, expected] of fixtures) {
    const original = expression(source);
    const originalValue = decodeLiteral(original);
    const result = transformLiteral(original, target);
    assert.equal(result.ok, true, source);
    if (!result.ok || !originalValue.ok) continue;
    assert.equal(result.text, expected);
    const resultValue = decodeLiteral(only(result.text));
    assert.deepEqual(resultValue, originalValue);
  }
});

test("preserves a same-delimiter literal byte for byte", () => {
  const source = String.raw`"\u0041\/"`;
  assert.deepEqual(transformLiteral(only(source), "double"), {
    ok: true,
    text: source,
    target: "double",
    changed: false,
  });
});

test("rejects tagged templates, active substitutions, and directive-to-template conversion", () => {
  const tagged = scanLiterals("tag`raw`", "javascript")[0];
  assert.deepEqual(transformLiteral(tagged, "double"), { ok: false, reason: "tagged-template" });
  const active = scanLiterals("`value ${name}`", "javascript").find((literal) => literal.delimiter === "template");
  assert(active);
  assert.deepEqual(transformLiteral(active, "double"), { ok: false, reason: "active-interpolation" });
  assert.deepEqual(transformLiteral(only('"use strict";'), "template"), {
    ok: false,
    reason: "directive-semantics",
  });
});

test("keeps JSON double quoted and cycles around unsafe template targets", () => {
  assert.deepEqual(transformLiteral(only('"x"', "json"), "single"), {
    ok: false,
    reason: "unsupported-target",
  });
  const directive = only('"use strict";');
  const cycled = cycleLiteral(directive, ["double", "template", "single"]);
  assert.equal(cycled.ok, true);
  if (cycled.ok) assert.equal(cycled.target, "single");
});

test("deterministic generated values preserve semantics through every delimiter", () => {
  let state = 0x5eed1234;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
  const alphabet = ["a", "Z", "'", '"', "`", "$", "{", "}", "\\", "\n", "\r", "\t", "\0", "é", "中", "😀"];
  const delimiters: QuoteKind[] = ["single", "double", "template"];
  for (let iteration = 0; iteration < 1_000; iteration += 1) {
    let value = "";
    const length = Math.floor(random() * 32);
    for (let index = 0; index < length; index += 1) {
      value += alphabet[Math.floor(random() * alphabet.length)];
    }
    for (const sourceKind of delimiters) {
      const source = encodeValue(value, sourceKind);
      const literal = expression(source);
      assert.deepEqual(decodeLiteral(literal), { ok: true, value });
      for (const target of delimiters) {
        const transformed = transformLiteral(literal, target);
        assert.equal(transformed.ok, true);
        if (!transformed.ok) continue;
        const resultLiteral = only(transformed.text);
        assert.deepEqual(decodeLiteral(resultLiteral), { ok: true, value });
        if (target === "template") {
          assert.equal(resultLiteral.hasInterpolation, false);
          assert.equal(/(^|[^\\])\$\{/u.test(transformed.text.slice(1, -1)), false);
        }
      }
    }
  }
});
