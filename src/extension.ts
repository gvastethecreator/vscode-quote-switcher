import * as vscode from "vscode";
import { COMMAND_ACTIONS } from "./commands.ts";
import { runQuoteCommand } from "./editor.ts";

export function activate(context: vscode.ExtensionContext): void {
  for (const [id, action] of Object.entries(COMMAND_ACTIONS)) {
    context.subscriptions.push(
      vscode.commands.registerCommand(id, (...args: unknown[]) => {
        return runQuoteCommand(action, args);
      }),
    );
  }
}

export function deactivate(): void {}
