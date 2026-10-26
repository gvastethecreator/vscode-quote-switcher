import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { scanLiterals } from "../src/core/scanner.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const typical = buildSource(96 * 1024);
scanLiterals(typical, "typescript");
const typicalMs = measure(() => scanLiterals(typical, "typescript"));
assert.ok(typicalMs < 20, `Typical 96 KiB scan exceeded 20 ms: ${typicalMs.toFixed(2)} ms.`);

const oneMiB = buildSource(1024 * 1024);
const oneMiBMs = measure(() => scanLiterals(oneMiB, "javascript"));
assert.ok(oneMiBMs < 250, `1 MiB scan exceeded 250 ms: ${oneMiBMs.toFixed(2)} ms.`);

const fiveMiB = buildSource(5 * 1024 * 1024);
const fiveMiBMs = measure(() => scanLiterals(fiveMiB, "typescript"));
assert.ok(fiveMiBMs < 1_200, `5 MiB scan exceeded 1.2 s: ${fiveMiBMs.toFixed(2)} ms.`);

const pathological = (`/*${"*\\".repeat(8_192)}*/ const value = "${"\\\\".repeat(8_192)}";\n`).repeat(24);
const pathologicalMs = measure(() => scanLiterals(pathological, "javascript"));
assert.ok(pathologicalMs < 250, `Pathological scan exceeded 250 ms: ${pathologicalMs.toFixed(2)} ms.`);

for (const output of ["dist/node/extension.cjs", "dist/web/extension.cjs"]) {
  const bytes = (await stat(path.join(root, output))).size;
  assert.ok(bytes < 250 * 1024, `${output} exceeds the 250 KiB bundle budget.`);
}

console.log(
  `Performance passed: 96 KiB ${typicalMs.toFixed(2)} ms; 1 MiB ${oneMiBMs.toFixed(2)} ms; `
  + `5 MiB ${fiveMiBMs.toFixed(2)} ms; pathological ${pathologicalMs.toFixed(2)} ms.`,
);

function measure(operation) {
  const started = performance.now();
  operation();
  return performance.now() - started;
}

function buildSource(minimumLength) {
  const line = String.raw`const first = "hello"; const second = /["']/gu; const third = \`safe \${text}\`; // quotes ' "` + "\n";
  return line.repeat(Math.ceil(minimumLength / line.length)).slice(0, minimumLength);
}
