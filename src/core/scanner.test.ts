import assert from "node:assert/strict";
import test from "node:test";
import { scanLiterals, scanLiteralsBounded } from "./scanner.ts";

test("locates JavaScript strings and templates in source order", () => {
  const source = `\ufeffconst a = 'one';\r\nconst b = "two";\nconst c = \`three\`;`;
  const literals = scanLiterals(source, "javascript");
  assert.deepEqual(
    literals.map((literal) => [literal.delimiter, source.slice(literal.range.start, literal.range.end)]),
    [
      ["single", "'one'"],
      ["double", '"two"'],
      ["template", "`three`"],
    ],
  );
  assert.ok(literals.every((literal) => literal.terminated));
});

test("ignores comments and regex literals without losing later strings", () => {
  const source = String.raw`
    // "line comment"
    const pattern = /["']/gu;
    /* 'block comment' */
    const quotient = 10 / 2;
    const value = "kept // text";
  `;
  const literals = scanLiterals(source, "typescript");
  assert.deepEqual(literals.map((literal) => literal.rawBody), ["kept // text"]);
});

test("treats regex after statement boundaries conservatively", () => {
  const source = `while (ready) { break\n/["']/.test(value); }\nexport default /["']/.test(value);\nconst kept = "yes";`;
  assert.deepEqual(scanLiterals(source, "javascript").map((literal) => literal.rawBody), ["yes"]);
});

test("stops after an unterminated regex instead of targeting ambiguous quotes", () => {
  const source = `const pattern = /unterminated ["']\nconst ambiguous = "no";`;
  assert.deepEqual(scanLiterals(source, "javascript"), []);
});

test("locates import paths, object keys, and escaped delimiters", () => {
  const source = String.raw`import value from "module"; const object = { 'key': "a\\\"b" };`;
  const literals = scanLiterals(source, "javascript");
  assert.deepEqual(literals.map((literal) => literal.rawBody), ["module", "key", String.raw`a\\\"b`]);
});

test("marks active, tagged, nested, and unterminated templates", () => {
  const active = "const x = `outer ${\"inner\"}`; tag`raw`; const broken = `open";
  const literals = scanLiterals(active, "typescript");
  const outer = literals.find((literal) => literal.range.start === active.indexOf("`outer"));
  const inner = literals.find((literal) => literal.rawBody === "inner");
  const tagged = literals.find((literal) => literal.rawBody === "raw");
  const broken = literals.find((literal) => literal.rawBody === "open");
  assert.equal(outer?.hasInterpolation, true);
  assert.equal(inner?.delimiter, "double");
  assert.equal(tagged?.tagged, true);
  assert.equal(broken?.terminated, false);
});

test("conservatively marks expression bodies followed by a template as tagged", () => {
  const source = "const fn = function () {} `value`; class Example {} `other`;";
  const templates = scanLiterals(source, "typescript").filter((literal) => literal.delimiter === "template");
  assert.deepEqual(templates.map((literal) => literal.tagged), [true, true]);
});

test("recognizes Unicode identifier tags", () => {
  const source = "𝒇`math`; café`latin`;";
  const templates = scanLiterals(source, "javascript").filter((literal) => literal.delimiter === "template");
  assert.deepEqual(templates.map((literal) => literal.tagged), [true, true]);
});

test("JSONC skips comments while JSON strings stay double quoted", () => {
  const source = `{// "ignored"\n"key": "value", /* 'ignored' */ "nested": {"x":"y"}}`;
  assert.deepEqual(
    scanLiterals(source, "jsonc").map((literal) => literal.rawBody),
    ["key", "value", "nested", "x", "y"],
  );
});

test("marks conservative directive-like string statements", () => {
  const literals = scanLiterals(`"use strict";\nconst value = "normal";`, "javascript");
  assert.equal(literals[0].directiveLike, true);
  assert.equal(literals[1].directiveLike, false);
});

test("bounds adversarial literal counts", () => {
  const result = scanLiteralsBounded('""'.repeat(10), "javascript", 4);
  assert.equal(result.truncated, true);
  assert.equal(result.literals.length, 4);
});
