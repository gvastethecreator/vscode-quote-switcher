import {
  type LiteralTarget,
  type LocatedLiteral,
  type OffsetSelection,
  type TargetCollectionResult,
} from "./model.ts";

export function collectLiteralTargets(
  literals: readonly LocatedLiteral[],
  selections: readonly OffsetSelection[],
): TargetCollectionResult {
  const targetIndexes = new Map<string, { literal: LocatedLiteral; selectionIndexes: number[] }>();

  for (let selectionIndex = 0; selectionIndex < selections.length; selectionIndex += 1) {
    const selection = selections[selectionIndex];
    const start = Math.min(selection.anchor, selection.active);
    const end = Math.max(selection.anchor, selection.active);
    const literal = start === end
      ? locateAtCursor(literals, start)
      : locateSelection(literals, start, end);
    if (!literal) {
      return {
        ok: false,
        reason: start === end ? "no-literal" : "selection-crosses-boundary",
      };
    }
    const key = `${literal.range.start}:${literal.range.end}`;
    const existing = targetIndexes.get(key);
    if (existing) existing.selectionIndexes.push(selectionIndex);
    else targetIndexes.set(key, { literal, selectionIndexes: [selectionIndex] });
  }

  const targets: LiteralTarget[] = [...targetIndexes.values()]
    .sort((left, right) => left.literal.range.start - right.literal.range.start)
    .map(({ literal, selectionIndexes }) => ({ literal, selectionIndexes }));
  for (let index = 1; index < targets.length; index += 1) {
    if (targets[index].literal.range.start < targets[index - 1].literal.range.end) {
      return { ok: false, reason: "overlapping-targets" };
    }
  }
  return { ok: true, targets };
}

function locateAtCursor(literals: readonly LocatedLiteral[], offset: number): LocatedLiteral | undefined {
  const inside = literals.filter(
    (literal) => literal.range.start <= offset && offset < literal.range.end,
  );
  if (inside.length > 0) return smallest(inside);
  const closingBoundary = literals.filter((literal) => literal.range.end === offset);
  return closingBoundary.length === 1 ? closingBoundary[0] : undefined;
}

function locateSelection(
  literals: readonly LocatedLiteral[],
  start: number,
  end: number,
): LocatedLiteral | undefined {
  const containing = literals.filter(
    (literal) => literal.range.start <= start && end <= literal.range.end,
  );
  return containing.length > 0 ? smallest(containing) : undefined;
}

function smallest(literals: readonly LocatedLiteral[]): LocatedLiteral {
  return literals.reduce((selected, candidate) =>
    candidate.range.end - candidate.range.start < selected.range.end - selected.range.start
      ? candidate
      : selected,
  );
}

export function mapOffsetThroughEdits(
  offset: number,
  edits: readonly { readonly range: { readonly start: number; readonly end: number }; readonly text: string }[],
): number {
  let mapped = offset;
  for (const edit of edits) {
    const oldLength = edit.range.end - edit.range.start;
    const newLength = edit.text.length;
    if (offset < edit.range.start) continue;
    if (offset > edit.range.end) {
      mapped += newLength - oldLength;
      continue;
    }
    const relative = Math.max(0, Math.min(oldLength, offset - edit.range.start));
    if (relative === 0) mapped = edit.range.start + accumulatedDeltaBefore(edit, edits);
    else if (relative === oldLength) mapped = edit.range.start + accumulatedDeltaBefore(edit, edits) + newLength;
    else {
      const mappedRelative = Math.min(newLength, Math.round((relative / oldLength) * newLength));
      mapped = edit.range.start + accumulatedDeltaBefore(edit, edits) + mappedRelative;
    }
    break;
  }
  return mapped;
}

function accumulatedDeltaBefore(
  current: { readonly range: { readonly start: number; readonly end: number }; readonly text: string },
  edits: readonly { readonly range: { readonly start: number; readonly end: number }; readonly text: string }[],
): number {
  let delta = 0;
  for (const edit of edits) {
    if (edit === current) break;
    delta += edit.text.length - (edit.range.end - edit.range.start);
  }
  return delta;
}
