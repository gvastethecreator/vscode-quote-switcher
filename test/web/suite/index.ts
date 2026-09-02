import * as vscode from "vscode";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export async function run(): Promise<void> {
  const extension = vscode.extensions.getExtension("gvastethecreator.quote-switcher");
  assert(extension, "Quote Switcher was not discovered in the web host.");

  const folder = vscode.workspace.workspaceFolders?.[0];
  assert(folder, "The virtual test workspace did not open.");
  assert(folder.uri.scheme === "vscode-test-web", "The web test is not using a virtual filesystem.");
  const document = await vscode.workspace.openTextDocument(vscode.Uri.joinPath(folder.uri, "fixture.ts"));
  const editor = await vscode.window.showTextDocument(document, { preview: false });
  const offset = document.getText().indexOf("hello") + 2;
  const position = document.positionAt(offset);
  editor.selection = new vscode.Selection(position, position);
  await vscode.commands.executeCommand("quoteSwitcher.cycleQuotes");
  assert(extension.isActive, "Cycle Quotes did not activate Quote Switcher in the web host.");
  assert(document.getText().includes("const greeting = `hello 'world'`;"), "Web cycle changed the value incorrectly.");
  await vscode.commands.executeCommand("undo");
  assert(document.getText().includes(`const greeting = "hello 'world'";`), "Web undo did not restore the source.");
}
