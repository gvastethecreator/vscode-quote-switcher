<div align="center">
  <a href="https://github.com/gvastethecreator/vscode-quote-switcher"><img src="media/icon.png" alt="Quote Switcher" width="128" /></a>

# Quote Switcher

**Change quote style without changing the represented string value**

<p align="center">
  <a href="https://github.com/gvastethecreator/vscode-quote-switcher"><img alt="GitHub" src="https://shieldcn.dev/badge/github.png?variant=outline&size=xs&theme=blue&logo=github" /></a>
  <a href="LICENSE"><img alt="MIT license" src="https://shieldcn.dev/github/license/gvastethecreator/vscode-quote-switcher.png?variant=outline&size=xs" /></a>
  <a href="https://github.com/gvastethecreator/vscode-quote-switcher/actions/workflows/ci.yml"><img alt="CI status" src="https://shieldcn.dev/github/ci/gvastethecreator/vscode-quote-switcher.png?workflow=ci.yml&branch=main&variant=outline&size=xs" /></a>
</p>
</div>

---

Place one or more cursors inside string literals, then run **Quote Switcher: Cycle Quotes**. All selected literals change in one edit and one undo step.

```js
const message = "hello 'world'";
// Cycle Quotes →
const message = `hello 'world'`;
// Cycle Quotes →
const message = 'hello \'world\'';
```

<img src="media/preview.png" alt="Quote Switcher cycling multiple JavaScript string literals in VS Code" width="100%" />

## Commands

- **Cycle Quotes** — use the configured order for JavaScript or TypeScript.
- **Convert to Single Quotes** — JavaScript and TypeScript.
- **Convert to Double Quotes** — JavaScript, TypeScript, JSON, and JSON with Comments.
- **Convert to Template Literal** — safe JavaScript and TypeScript literals only.

Only **Cycle Quotes** appears in the editor context menu. All commands remain available from the Command Palette. No keybinding is claimed by default.

## Safety

Quote Switcher scans the active document only. It ignores comments and regex literals, validates escapes, verifies the decoded value after every conversion, deduplicates repeated cursors, and applies multi-cursor edits atomically.

It leaves source unchanged when safety cannot be proven, including:

- incomplete or malformed literals;
- tagged templates or templates with active `${...}` substitutions;
- legacy octal, identity, or line-continuation escapes;
- selections crossing literal boundaries;
- directive-like strings when a template conversion could change directive behavior.

JSON and JSONC strings always remain double quoted. JSX/TSX, Python, and arbitrary languages are not advertised in `0.1.0`.

## Quote order

```json
{
  "quoteSwitcher.javascript.order": ["single", "double", "template"],
  "quoteSwitcher.typescript.order": ["single", "double", "template"]
}
```

Duplicate or unsupported entries are ignored. An empty or invalid order falls back to the default.

## Compatibility and privacy

Desktop, web, virtual, restricted, and remote workspaces use the same browser-safe core. The extension has no runtime dependency, filesystem access, network request, telemetry, source logging, or stored document content.

---

<p align="center">
  <a href="https://github.com/gvastethecreator/vscode-quote-switcher/stargazers"><img alt="GitHub stars" src="https://shieldcn.dev/github/stars/gvastethecreator/vscode-quote-switcher.png?variant=outline&size=xs" /></a>
  <a href="https://github.com/gvastethecreator"><picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/follow%20me-/gvastethecreator.png?size=xs&amp;logo=github&amp;brand=github&amp;mode=dark"><img alt="Follow gvastethecreator" src="https://shieldcn.dev/badge/follow%20me-/gvastethecreator.png?size=xs&amp;logo=github&amp;brand=github&amp;mode=light"></picture></a>
  <a href="https://github.com/sponsors/gvastethecreator"><picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/support%20this-project.png?size=xs&amp;logo=ri%3APiHeartFill&amp;logoColor=b85a90&amp;brand=github&amp;mode=dark"><img alt="Support this project" src="https://shieldcn.dev/badge/support%20this-project.png?size=xs&amp;logo=ri%3APiHeartFill&amp;logoColor=b85a90&amp;brand=github&amp;mode=light"></picture></a>
</p>
