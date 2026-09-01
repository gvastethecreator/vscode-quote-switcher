Repo: `X:\vscode-extensions\vscode-quote-switcher`
Remote: private (`gvastethecreator/vscode-quote-switcher`)

# PDR — Quote Switcher

## Status
Scaffolded · Priority P1

## Product summary

Quote Switcher cycles or normalizes string delimiters safely without changing the represented string value. It is intentionally small: one precise transformation, excellent edge-case handling, and language-aware behavior.

## Opportunity

Toggle-quotes extensions have existed for years, but a modern implementation can be smaller, faster, web-compatible and far more explicit about escaping, language support and invalid contexts.

Category reference:
- https://github.com/BriteSnow/vscode-toggle-quotes

## Core jobs

- cycle the string under cursor between supported quote styles;
- transform selected strings in one command;
- preserve runtime/string content through correct escaping;
- optionally normalize to a configured preferred style.

## MVP languages

Priority:

1. JavaScript
2. TypeScript
3. JSX/TSX where a quoted string is unambiguous
4. JSON/JSONC with double-quote constraints respected
5. Python as a later MVP candidate only if parser/escaping behavior is solid.

Do not advertise generic all-language support.

## Commands

- `Quote Switcher: Cycle Quotes`
- `Quote Switcher: Convert to Single Quotes`
- `Quote Switcher: Convert to Double Quotes`
- `Quote Switcher: Convert to Template Literal` (JS/TS only)

## Example

```js
"hello 'world'"
```

can become:

```js
'hello \'world\''
```

and then:

```js
`hello 'world'`
```

The semantic string value must remain equivalent.

## Critical rules

- locate actual string literals, not arbitrary quote characters in comments;
- preserve value under escaping/unescaping;
- never convert to template literal if interpolation semantics would change unexpectedly;
- understand backticks and `${...}` in JavaScript/TypeScript;
- JSON remains valid JSON: no single-quote conversion;
- multiple selections apply independently and atomically.

## Parsing approach

Use a small language adapter abstraction. Prefer token/syntax information available from lightweight parsers or carefully bounded scanners. Avoid pulling an entire compiler when a robust literal scanner is sufficient.

Transform pipeline:

1. identify literal range and current delimiter;
2. decode only delimiter-relevant escapes under language rules;
3. encode for target delimiter;
4. validate resulting literal constraints;
5. return edit or safe no-op/error.

Keep transform code pure.

## Configuration

Possible settings:

```json
{
  "quoteSwitcher.javascript.order": ["single", "double", "template"],
  "quoteSwitcher.typescript.order": ["single", "double", "template"],
  "quoteSwitcher.json.order": ["double"]
}
```

Avoid formatting settings already owned by Prettier/ESLint. This is an explicit editor command, not a save-time formatter.

## Non-goals

- formatter replacement;
- linting quote style;
- format-on-save;
- rewriting entire files;
- converting JSX attributes unless semantics are proven;
- manipulating regex literals.

## VS Code APIs

- active text editor/document;
- selections/ranges;
- editor/workspace edits;
- commands and keybindings;
- configuration.

## Compatibility

| Environment | Goal |
| --- | --- |
| Desktop | Full |
| Web | Full |
| Virtual Workspace | Full |
| Restricted Mode | Full |
| Remote | Full |

No filesystem or Node dependency should be required.

## Testing

High-value fixture classes:

- escaped delimiter;
- escaped backslash before delimiter;
- unicode escapes;
- multiline/template literals;
- `${}` template interpolation;
- strings inside comments;
- quotes inside regex;
- JSX attributes;
- empty string;
- multiple cursors;
- selection exactly/partially covering a literal;
- invalid/incomplete string while typing;
- CRLF/LF.

Property-style test opportunity: decode original and transformed literal and assert equal semantic value for generated safe cases.

## UX

The extension should be nearly invisible:

- Command Palette commands;
- optional default keybinding only if it avoids common VS Code conflicts;
- editor context menu optional and scoped to relevant languages;
- no status bar;
- no webview;
- no notifications on successful transformation.

## Acceptance criteria

- transformations preserve represented value for supported cases;
- JSON cannot be made syntactically invalid by unsupported quote conversion;
- one undo restores all edits from one command;
- unsupported/incomplete literals are safe no-ops with optional concise feedback;
- no workspace scanning and near-zero idle cost;
- web extension tests pass.

## Post-MVP

- Python adapter;
- PHP/Ruby/Rust adapters based on demand;
- language-specific quote-order settings;
- command to normalize selected literals only.

## Definition of done

Pure transformation suite, integration tests, web-host verification, docs, Marketplace assets and publication pipeline complete.
