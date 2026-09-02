const assert = require("node:assert/strict");
const vscode = require("vscode");

const commands = {
  cycle: "quoteSwitcher.cycleQuotes",
  single: "quoteSwitcher.convertToSingle",
  double: "quoteSwitcher.convertToDouble",
  template: "quoteSwitcher.convertToTemplate",
};

async function openText(content, language = "javascript") {
  const document = await vscode.workspace.openTextDocument({ content, language });
  return vscode.window.showTextDocument(document, { preview: false });
}

function cursorAt(document, needle, delta = 0) {
  const offset = document.getText().indexOf(needle) + delta;
  assert.ok(offset >= delta, `Missing fixture text: ${needle}`);
  const position = document.positionAt(offset);
  return new vscode.Selection(position, position);
}

async function run() {
  const extension = vscode.extensions.getExtension("gvastethecreator.quote-switcher");
  assert.ok(extension, "Quote Switcher was not discovered.");
  assert.deepEqual(extension.packageJSON.extensionKind, ["ui", "workspace"]);
  assert.equal(extension.packageJSON.capabilities.untrustedWorkspaces.supported, true);
  assert.equal(extension.packageJSON.capabilities.virtualWorkspaces.supported, true);

  const editor = await openText(`const first = "one";\nconst second = "two";`);
  editor.selections = [
    cursorAt(editor.document, "one", 1),
    cursorAt(editor.document, "two", 1),
  ];
  await vscode.commands.executeCommand(commands.cycle);
  assert.equal(extension.isActive, true, "Cycle Quotes must lazily activate the extension.");
  const registered = await vscode.commands.getCommands(true);
  for (const id of Object.values(commands)) assert.ok(registered.includes(id), `${id} was not registered.`);
  assert.equal(editor.document.getText(), "const first = `one`;\nconst second = `two`;");
  assert.equal(editor.selections.length, 2);
  assert.equal(editor.document.getText(editor.document.getWordRangeAtPosition(editor.selections[0].active)), "one");
  assert.equal(editor.document.getText(editor.document.getWordRangeAtPosition(editor.selections[1].active)), "two");
  await vscode.commands.executeCommand("undo");
  assert.equal(editor.document.getText(), `const first = "one";\nconst second = "two";`, "One undo must restore every edit.");

  editor.selections = [cursorAt(editor.document, "one", 1), cursorAt(editor.document, "one", 2)];
  await vscode.commands.executeCommand(commands.template);
  assert.equal(editor.document.getText(), "const first = `one`;\nconst second = \"two\";", "Duplicate targets must be edited once.");
  await vscode.commands.executeCommand(commands.double);
  assert.equal(editor.document.getText(), `const first = "one";\nconst second = "two";`);

  const escaped = await openText('const value = "literal ${name} and \\`";');
  escaped.selection = cursorAt(escaped.document, "literal", 2);
  await vscode.commands.executeCommand(commands.template);
  assert.equal(escaped.document.getText(), "const value = `literal \\${name} and \\``;");

  const configEditor = await openText(`const value = "configured";`, "typescript");
  configEditor.selection = cursorAt(configEditor.document, "configured", 2);
  const config = vscode.workspace.getConfiguration("quoteSwitcher", configEditor.document.uri);
  await config.update("typescript.order", ["template", "single", "template", "invalid"], vscode.ConfigurationTarget.Global);
  try {
    await vscode.commands.executeCommand(commands.cycle);
    assert.equal(configEditor.document.getText(), "const value = `configured`;");
  } finally {
    await config.update("typescript.order", undefined, vscode.ConfigurationTarget.Global);
  }

  const json = await openText(`{"message":"hello"}`, "jsonc");
  json.selection = cursorAt(json.document, "hello", 2);
  await vscode.commands.executeCommand(commands.cycle);
  assert.equal(json.document.getText(), `{"message":"hello"}`, "JSON cycle must not produce invalid quotes.");
  await vscode.commands.executeCommand(commands.single);
  assert.equal(json.document.getText(), `{"message":"hello"}`, "Explicit single quotes must be rejected in JSON.");

  const unsafe = await openText("const value = `hello ${name}`;");
  unsafe.selection = cursorAt(unsafe.document, "hello", 2);
  await vscode.commands.executeCommand(commands.double);
  assert.equal(unsafe.document.getText(), "const value = `hello ${name}`;", "Active interpolation must be untouched.");

  const malformedArgs = await openText(`const value = "unchanged";`);
  malformedArgs.selection = cursorAt(malformedArgs.document, "unchanged", 2);
  await vscode.commands.executeCommand(commands.single, { target: "single" });
  assert.equal(malformedArgs.document.getText(), `const value = "unchanged";`);

  const unsupported = await openText(`"plain"`, "plaintext");
  unsupported.selection = cursorAt(unsupported.document, "plain", 2);
  await vscode.commands.executeCommand(commands.cycle);
  assert.equal(unsupported.document.getText(), `"plain"`);

  const scheme = `quote-switcher-test-${Date.now()}`;
  let bytes = new TextEncoder().encode(`const remote = "virtual";`);
  const emitter = new vscode.EventEmitter();
  const provider = {
    createDirectory() {},
    delete() {},
    onDidChangeFile: emitter.event,
    readDirectory() { return []; },
    readFile() { return bytes; },
    rename() {},
    stat() { return { ctime: 0, mtime: 0, size: bytes.length, type: vscode.FileType.File }; },
    watch() { return new vscode.Disposable(() => {}); },
    writeFile(uri, content) {
      bytes = content;
      emitter.fire([{ type: vscode.FileChangeType.Changed, uri }]);
    },
  };
  const registration = vscode.workspace.registerFileSystemProvider(scheme, provider, { isCaseSensitive: true });
  try {
    const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(`${scheme}:/remote.ts`));
    const virtual = await vscode.window.showTextDocument(document, { preview: false });
    virtual.selection = cursorAt(document, "virtual", 2);
    await vscode.commands.executeCommand(commands.single);
    assert.equal(document.getText(), `const remote = 'virtual';`, "Writable non-file documents must work.");
  } finally {
    registration.dispose();
    emitter.dispose();
  }
}

module.exports = { run };
