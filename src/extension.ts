import * as vscode from "vscode";
import { COMMAND_ACTIONS } from "./commands.ts";
import { runQuoteCommand } from "./editor.ts";

const SETTING_KEYS = ["javascript.order", "typescript.order"] as const;

async function setDefaultSettings(): Promise<void> {
  const confirm = "Set defaults";
  const choice = await vscode.window.showWarningMessage(
    "Set Quote Switcher defaults for all workspaces?",
    { modal: true },
    confirm,
  );
  if (choice !== confirm) {
    return;
  }
  const configuration = vscode.workspace.getConfiguration("quoteSwitcher");
  const targets: vscode.ConfigurationTarget[] = [vscode.ConfigurationTarget.Global];
  if (vscode.workspace.workspaceFile || vscode.workspace.workspaceFolders?.length) {
    targets.push(vscode.ConfigurationTarget.Workspace);
  }
  for (const key of SETTING_KEYS) {
    const value = configuration.inspect(key)?.defaultValue;
    for (const target of targets) {
      await configuration.update(key, value, target);
    }
  }
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
    vscode.commands.registerCommand("quoteSwitcher.setDefaults", () => setDefaultSettings()),
  );
}

export function deactivate(): void {}
