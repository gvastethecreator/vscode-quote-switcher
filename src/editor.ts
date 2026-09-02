import * as vscode from "vscode";
import { type QuoteCommand } from "./commands.ts";
import { normalizeQuoteOrder } from "./core/configuration.ts";
import {
  type PlannedEdit,
  type TransformRejection,
  isSupportedLanguageId,
} from "./core/model.ts";
import { scanLiteralsBounded } from "./core/scanner.ts";
import { collectLiteralTargets, mapOffsetThroughEdits } from "./core/targets.ts";
import { cycleLiteral, transformLiteral } from "./core/transform.ts";

const MAX_DOCUMENT_LENGTH = 8 * 1024 * 1024;
const MAX_LITERAL_COUNT = 100_000;
const MAX_SELECTION_COUNT = 4_096;

export async function runQuoteCommand(command: QuoteCommand, args: readonly unknown[]): Promise<void> {
  if (args.length !== 0) {
    await warn("invalid-command-arguments");
    return;
  }

  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    await warn("no-literal");
    return;
  }
  const { document } = editor;
  if (!isSupportedLanguageId(document.languageId)) {
    await warn("unsupported-language");
    return;
  }
  if (editor.selections.length > MAX_SELECTION_COUNT) {
    await warn("too-many-selections");
    return;
  }

  const source = document.getText();
  if (source.length > MAX_DOCUMENT_LENGTH) {
    await warn("document-too-large");
    return;
  }

  const scan = scanLiteralsBounded(source, document.languageId, MAX_LITERAL_COUNT);
  if (scan.truncated) {
    await warn("document-too-complex");
    return;
  }
  const originalSelections = editor.selections.map((selection) => ({
    anchor: document.offsetAt(selection.anchor),
    active: document.offsetAt(selection.active),
  }));
  const collected = collectLiteralTargets(scan.literals, originalSelections);
  if (!collected.ok) {
    await warn(collected.reason);
    return;
  }

  const order = command.kind === "cycle"
    ? readQuoteOrder(document.languageId, document.uri)
    : undefined;
  const edits: PlannedEdit[] = [];
  for (const { literal } of collected.targets) {
    const transformed = command.kind === "cycle"
      ? cycleLiteral(literal, order ?? [])
      : transformLiteral(literal, command.target);
    if (!transformed.ok) {
      await warn(transformed.reason);
      return;
    }
    if (transformed.changed) {
      edits.push({
        range: literal.range,
        text: transformed.text,
        sourceLength: literal.range.end - literal.range.start,
      });
    }
  }

  if (edits.length === 0) return;
  edits.sort((left, right) => left.range.start - right.range.start);
  const applied = await editor.edit(
    (builder) => {
      for (const edit of edits) {
        builder.replace(
          new vscode.Range(document.positionAt(edit.range.start), document.positionAt(edit.range.end)),
          edit.text,
        );
      }
    },
    { undoStopBefore: true, undoStopAfter: true },
  );
  if (!applied) {
    void vscode.window.showWarningMessage("Quote Switcher could not apply the editor change.");
    return;
  }

  editor.selections = originalSelections.map(({ anchor, active }) =>
    new vscode.Selection(
      document.positionAt(mapOffsetThroughEdits(anchor, edits)),
      document.positionAt(mapOffsetThroughEdits(active, edits)),
    ),
  );
}

function readQuoteOrder(languageId: "javascript" | "typescript" | "json" | "jsonc", uri: vscode.Uri) {
  if (languageId === "json" || languageId === "jsonc") return ["double"] as const;
  const configured = vscode.workspace
    .getConfiguration("quoteSwitcher", uri)
    .get<unknown>(`${languageId}.order`);
  return normalizeQuoteOrder(configured);
}

function warn(reason: TransformRejection): void {
  const message: Record<TransformRejection, string> = {
    "no-literal": "Place every cursor or selection inside a supported string literal.",
    "selection-crosses-boundary": "A selection crosses a string literal boundary.",
    "unsupported-language": "Quote Switcher supports JavaScript, TypeScript, JSON, and JSON with Comments.",
    "unsupported-target": "JSON strings must use double quotes.",
    "malformed-literal": "Quote Switcher cannot safely transform an incomplete or malformed literal.",
    "unsafe-escape": "Quote Switcher cannot prove this escape sequence is safe to transform.",
    "active-interpolation": "Template literals with active substitutions are left unchanged.",
    "tagged-template": "Tagged template literals are left unchanged.",
    "directive-semantics": "This string may be a directive and is left unchanged.",
    "overlapping-targets": "Selected string literals overlap and cannot be edited safely.",
    "no-safe-target": "No alternate quote style is safe for every selected literal.",
    "document-too-large": "Quote Switcher supports active documents up to 8 MiB.",
    "document-too-complex": "This document contains too many string literals to transform safely.",
    "too-many-selections": "Quote Switcher supports up to 4,096 cursors or selections at once.",
    "invalid-command-arguments": "Quote Switcher commands do not accept arguments.",
  };
  void vscode.window.showWarningMessage(message[reason]);
}
