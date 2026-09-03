# PDR — Quote Switcher

Repo: `X:\vscode-extensions\vscode-quote-switcher`
Remote: private (`gvastethecreator/vscode-quote-switcher`)
Target release: `0.1.0`

## Status

Release candidate implemented · Priority P1 · Publication requires separate authorization

QSW-001 through QSW-022 are implemented in the product branch. QSW-023 covers registry publication, tag/release creation, public-install verification, and monitoring; it is not authorized by implementation approval.

## Product summary

Quote Switcher changes JavaScript, TypeScript, JSON, and JSONC string delimiters without changing the represented string value. It is intentionally quiet: native commands, one small context-menu entry, no webview, no status item, no formatter behavior, and no success notification.

## Supported contract

| Language | Cycle | Single | Double | Template |
| --- | --- | --- | --- | --- |
| JavaScript | Configured order | Yes | Yes | Safe literals only |
| TypeScript | Configured order | Yes | Yes | Safe literals only |
| JSON | Explains double-quote requirement | No | Safe no-op/validation | No |
| JSON with Comments | Explains double-quote requirement | No | Safe no-op/validation | No |

JSX/TSX attributes, Python, arbitrary language modes, tagged templates, and templates with active substitutions are excluded from `0.1.0`.

## Commands

- `Quote Switcher: Cycle Quotes`
- `Quote Switcher: Convert to Single Quotes`
- `Quote Switcher: Convert to Double Quotes`
- `Quote Switcher: Convert to Template Literal`

Only Cycle Quotes appears in the editor context menu. Conversion commands stay in the Command Palette. No default keybinding is contributed.

## Semantic invariant

Every successful conversion must prove:

```text
decode(original literal) === decode(transformed literal)
```

The pipeline is:

1. scan the active document with the language adapter;
2. resolve every cursor or selection to one literal;
3. reject crossings, overlaps, ambiguity, malformed tokens, or unsafe constructs;
4. decode the supported escape subset;
5. encode for the requested delimiter;
6. decode the generated literal and compare exact UTF-16 string values;
7. apply all planned changes through one editor edit.

No command performs global character replacement.

## Targeting and editing

- Cursor positions may sit on either delimiter or inside the literal.
- Non-empty selections must stay within one literal.
- Multiple cursors may target different literals.
- Repeated cursors on one literal are deduplicated.
- Nested or overlapping target ranges are rejected.
- Any unsafe target cancels the entire command.
- All replacements form one undo step.
- Selection anchors and active positions are restored relative to the edited ranges.
- Surrounding trivia, line endings, and unrelated source remain untouched.

## Safe subset

The release refuses transformations when semantics cannot be proved:

- unterminated or malformed literals;
- tagged templates;
- active `${...}` substitutions;
- legacy octal and decimal escapes;
- unknown/identity escapes;
- line continuations;
- ambiguous unterminated regex contexts;
- selections crossing token boundaries;
- template conversion of directive-like string statements;
- active documents larger than 8 MiB;
- more than 100,000 located literals or 4,096 cursors/selections.

Comments and regex literals are scanned but never returned as quote targets. JSON and JSONC always remain double quoted.

## Configuration

```json
{
  "quoteSwitcher.javascript.order": ["single", "double", "template"],
  "quoteSwitcher.typescript.order": ["single", "double", "template"]
}
```

Each resource-scoped array is capped at 12 entries. Runtime validation ignores unsupported values, removes duplicates while preserving order, and falls back to the default when no valid entry remains. Cycle skips a target that is unsafe for the selected literal.

## Architecture

```text
src/
├─ extension.ts          command registration
├─ commands.ts           command ids and typed actions
├─ editor.ts             VS Code adapter, feedback, atomic edits
└─ core/
   ├─ model.ts           immutable domain and rejection types
   ├─ scanner.ts         bounded JS/TS/JSON/JSONC lexical scanner
   ├─ decode.ts          manual JS decoder and strict JSON decoder
   ├─ encode.ts          delimiter-aware semantic encoder
   ├─ transform.ts       decode/encode/equality pipeline and cycle
   ├─ targets.ts         cursor collection, dedupe, overlap, mapping
   └─ configuration.ts   bounded quote-order normalization
```

The pure core has no `vscode`, Node, DOM, network, filesystem, or process import. Node and browser Extension Host bundles are emitted separately. There are no production npm dependencies.

The bounded scanner decision and conservative behavior are recorded in `docs/adr/0001-bounded-literal-scanner.md`.

## UX

- successful commands are silent;
- one concise warning is shown for a failed invocation, not one per cursor;
- editor focus remains in place;
- Cycle Quotes is the sole editor-context entry;
- native Settings exposes two small quote-order arrays;
- no webview, Tree View, status bar item, color-only state, or custom UI exists.

The README keeps the original quiet support/follow/stars footer.

## Security and privacy

- source text is processed in memory only after an explicit command;
- no workspace scan, file write, storage, telemetry, logger, or network request;
- no `eval`, dynamic code execution, shell, task, terminal, or workspace-controlled regex;
- messages never include literal contents or paths;
- command arguments and configuration are runtime-validated;
- all targets are planned before mutation;
- the package uses a strict files allowlist and is inspected as an archive.

See `docs/security-review.md`.

## Compatibility

| Environment | Target |
| --- | --- |
| Desktop local | Full |
| VS Code Web | Full |
| Virtual Workspace | Full |
| Restricted Mode | Full |
| Remote/WSL/SSH/Codespaces | Full |
| Windows, Linux, macOS | Full |

`extensionKind: ["ui", "workspace"]` allows the local UI host first while remaining remote-capable. The runtime does not depend on URI scheme or workspace trust.

## Performance

- lazy command activation;
- zero idle scan, watcher, or status work;
- linear active-document scan;
- 8 MiB hard command boundary;
- warmed 96 KiB scanner target under 20 ms;
- 1 MiB stress target under 250 ms;
- 5 MiB stress target under 1.2 seconds;
- pathological comment/backslash target under 250 ms;
- each minified runtime bundle below 250 KiB.

The performance script prints measured values and fails the release gate on regression.

## Verification contract

- table-driven scanner, decoder, encoder, configuration, targeting, and mapping tests;
- deterministic 1,000-value semantic property matrix across every delimiter pair;
- desktop Extension Host command, multi-cursor, dedupe, undo, selection, config, malformed-input, JSON, and non-file URI coverage;
- official VS Code web-host coverage in a writable virtual filesystem;
- minimum/current/Insiders and Windows/Linux/macOS hosted matrix;
- production Node/web bundle and performance checks;
- deterministic icon and alpha checks;
- strict VSIX content/security inspection;
- clean-profile installed-VSIX command smoke.

A real VS Code runtime screenshot is required for `media/preview.png`; generated UI mockups are forbidden.

## Assets

`media/source/quote-switcher-imagegen.png` is the accepted native-alpha Imagegen source. `media/icon.png` is a direct 256×256 downsample of those pixels; no SVG reinterpretation remains. `media/preview.png` is the real multi-cursor VS Code runtime capture on a transparent 1200×800 canvas.

## Non-goals

- formatter or linter replacement;
- format-on-save or while-typing conversion;
- whole-file/workspace rewrite;
- regex conversion;
- JSX/TSX attribute rewriting;
- parser/compiler dependency;
- code actions for every string;
- telemetry or source analytics.

## Definition of done

Implementation is complete when product source, hub/product PDRs, tests, Node/web bundles, CI, docs, transparent icon, real runtime preview, inspected VSIX, and clean-profile smoke agree with this contract.

Publication remains incomplete until an explicitly approved frozen candidate is published and verified from public registries.
