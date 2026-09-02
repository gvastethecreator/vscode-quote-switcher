import assert from "node:assert/strict";
import test from "node:test";
import { normalizeQuoteOrder } from "./configuration.ts";
import { scanLiterals } from "./scanner.ts";
import { collectLiteralTargets, mapOffsetThroughEdits } from "./targets.ts";

test("collects cursors and selections, including literal boundaries", () => {
  const source = `const a = "one"; const b = 'two';`;
  const literals = scanLiterals(source, "javascript");
  const result = collectLiteralTargets(literals, [
    { anchor: source.indexOf("one") + 1, active: source.indexOf("one") + 1 },
    { anchor: literals[1].range.start, active: literals[1].range.end },
  ]);
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.targets.map((target) => target.literal.rawBody), ["one", "two"]);
});

test("deduplicates cursors on one literal", () => {
  const source = `const value = "same";`;
  const literals = scanLiterals(source, "typescript");
  const start = literals[0].range.start;
  const result = collectLiteralTargets(literals, [
    { anchor: start, active: start },
    { anchor: start + 2, active: start + 2 },
    { anchor: literals[0].range.end, active: literals[0].range.end },
  ]);
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.targets[0].selectionIndexes, [0, 1, 2]);
});

test("rejects selections crossing literal boundaries", () => {
  const source = `const value = "inside";`;
  const literals = scanLiterals(source, "javascript");
  assert.deepEqual(
    collectLiteralTargets(literals, [{ anchor: literals[0].range.start - 1, active: literals[0].range.end }]),
    { ok: false, reason: "selection-crosses-boundary" },
  );
});

test("selects the nested literal rather than an active outer template", () => {
  const source = "`outer ${\"inner\"}`";
  const literals = scanLiterals(source, "javascript");
  const offset = source.indexOf("inner") + 1;
  const result = collectLiteralTargets(literals, [{ anchor: offset, active: offset }]);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.targets[0].literal.rawBody, "inner");
});

test("maps anchors and active positions across ordered edits", () => {
  const edits = [
    { range: { start: 2, end: 6 }, text: "123456" },
    { range: { start: 10, end: 14 }, text: "x" },
  ];
  assert.equal(mapOffsetThroughEdits(1, edits), 1);
  assert.equal(mapOffsetThroughEdits(4, edits), 5);
  assert.equal(mapOffsetThroughEdits(8, edits), 10);
  assert.equal(mapOffsetThroughEdits(12, edits), 13);
  assert.equal(mapOffsetThroughEdits(20, edits), 19);
});

test("normalizes bounded config arrays", () => {
  assert.deepEqual(normalizeQuoteOrder(["template", "single", "template", "bad", 1]), [
    "template",
    "single",
  ]);
  assert.deepEqual(normalizeQuoteOrder([]), ["single", "double", "template"]);
  assert.deepEqual(normalizeQuoteOrder(new Array(13).fill("single")), ["single", "double", "template"]);
});
