import { changeSettings } from "./settingsActions.ts";
import * as vscode from "vscode";
import { COMMAND_ACTIONS } from "./commands.ts";
import { convertSelectedLiterals, runQuoteCommand } from "./editor.ts";

const SETTING_KEYS = ["javascript.order", "typescript.order"] as const;

export async function setDefaultSettings(): Promise<void> {
  await changeSettings("quoteSwitcher", "Quote Switcher", SETTING_KEYS, "defaults", true);
}

export async function resetSettings(): Promise<void> {
  await changeSettings("quoteSwitcher", "Quote Switcher", SETTING_KEYS, "inherit", true);
}

export function activate(context: vscode.ExtensionContext): void {
  for (const [id, action] of Object.entries(COMMAND_ACTIONS)) {
    context.subscriptions.push(
      vscode.commands.registerCommand(id, (...args: unknown[]) => {
        return runQuoteCommand(action, args);
      }),
    );
  }
  context.subscriptions.push(
    vscode.commands.registerCommand("quoteSwitcher.convertSelectedLiterals", (...args: unknown[]) => {
      if (args.length) return runQuoteCommand({ kind: "cycle" }, args);
      return convertSelectedLiterals();
    }),
    vscode.commands.registerCommand("quoteSwitcher.setDefaults", () => setDefaultSettings()),
    vscode.commands.registerCommand("quoteSwitcher.resetSettings", () => resetSettings()),
  );
}

export function deactivate(): void {}
