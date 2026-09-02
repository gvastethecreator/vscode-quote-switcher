# Quote Switcher — Delivery record

Status: QSW-001 through QSW-022 implemented; QSW-023 separately gated
Repository: `gvastethecreator/vscode-quote-switcher`  
Product phase: `0.1.0` release candidate
Target release: `0.1.0`  
Last reviewed: 2026-09-02

This document began as the ordered implementation plan. The source, tests, docs, media pipeline, Node/web bundles, CI, package inspection, and installed-VSIX harness now implement its contract. `docs/PDR.md` is the final product contract. Registry publication, tag/release creation, public-install verification, and monitoring remain QSW-023 and require separate explicit authorization.

---

## 1. Implemented state

- all four native commands use the semantic transformation pipeline;
- bounded JS/TS/JSON/JSONC scanners exclude comments and regex literals;
- manual escape decoding and delimiter-aware encoding enforce exact value equality;
- multi-cursor targets are deduplicated, validated all-or-nothing, and applied in one undo step;
- resource-scoped quote-order settings are bounded and runtime-validated;
- separate Node and browser bundles activate in desktop and web hosts;
- unit, deterministic property, performance, desktop, web, package, and clean-profile VSIX gates exist;
- README, PDR, ADR, security review, compatibility notes, release procedure, icon provenance, and CI agree with the runtime;
- the transparent icon follows the portfolio visual system; the preview is sourced from the real Extension Development Host.

There are no production dependencies, webviews, telemetry, network calls, filesystem calls, status items, or background scans.

---

## 2. Release outcome

Quote Switcher `0.1.0` provides explicit, local transformations for string literals in:

1. JavaScript;
2. TypeScript;
3. JSON;
4. JSON with Comments.

The release must support:

- cycle the literal under each cursor through valid delimiters;
- convert supported literals to single quotes;
- convert supported literals to double quotes;
- convert safe JavaScript/TypeScript literals to template literals;
- apply multiple edits atomically;
- preserve the represented value exactly for every successful conversion;
- refuse incomplete, ambiguous, or semantics-changing transformations without damaging the document.

JSX/TSX attributes, Python, PHP, Ruby, Rust, arbitrary languages, format-on-save, and whole-file normalization are not part of `0.1.0`.

---

## 3. Product contract

### 3.1 Commands

| Command | JavaScript/TypeScript | JSON/JSONC |
| --- | --- | --- |
| `Quote Switcher: Cycle Quotes` | Cycle through configured safe order. | No destructive conversion; explain that JSON requires double quotes. |
| `Quote Switcher: Convert to Single Quotes` | Supported. | Hidden or safe no-op. |
| `Quote Switcher: Convert to Double Quotes` | Supported. | Supported as normalization only. |
| `Quote Switcher: Convert to Template Literal` | Supported only when semantics can be preserved. | Hidden or safe no-op. |

Successful commands should be silent. Unsupported transformations should produce one concise message per command invocation, not one message per cursor.

### 3.2 Literal targeting

For every selection/cursor:

1. locate the syntactic string literal containing the cursor or selection;
2. reject comments, regex literals, identifiers, import syntax outside literals, and unrelated quote characters;
3. reject a selection that crosses literal boundaries;
4. allow an exact literal selection or a cursor anywhere inside an unambiguous literal;
5. deduplicate multiple cursors targeting the same literal;
6. sort edits by original source range and submit them in one batched editor edit;
7. apply all valid edits atomically through one editor edit;
8. if any targeted literal would make the operation unsafe, default to all-or-nothing for that command.

The all-or-nothing rule avoids a file where only some selected literals changed unexpectedly. A future setting may permit best-effort behavior, but `0.1.0` should remain deterministic.

### 3.3 Semantic preservation

The central invariant is:

```text
decode(original literal) === decode(transformed literal)
```

A transformation is valid only when the adapter can prove this for the supported literal class.

Required handling includes:

- escaping the target delimiter;
- removing unnecessary escaping of the old delimiter only when semantically equivalent;
- preserving literal backslashes;
- preserving control escapes;
- preserving Unicode escapes and their represented value;
- preventing `${...}` interpolation when converting to a template literal;
- escaping backticks in template literals;
- respecting JSON's mandatory double-quoted string syntax;
- preserving source line endings and surrounding trivia.

Do not implement transformations by global character replacement.

### 3.4 Safe subset for `0.1.0`

Successful conversion must be limited to well-understood cases.

Initially reject or preserve without conversion:

- unterminated literals;
- tagged template literals;
- template literals containing active substitutions;
- legacy octal escapes;
- invalid escape sequences accepted only in sloppy JavaScript modes;
- line continuations whose cooked/raw semantics are uncertain;
- JSX attribute strings;
- directive prologues if a conversion could alter tool expectations;
- literals inside malformed syntax where token identity is ambiguous.

A rejected case is not a bug when it is explicitly documented and tested. A successful conversion that changes runtime value is a release blocker.

### 3.5 Cycle order

Defaults:

```json
{
  "quoteSwitcher.javascript.order": ["single", "double", "template"],
  "quoteSwitcher.typescript.order": ["single", "double", "template"]
}
```

Rules:

- validate each configured order;
- remove duplicates while preserving order;
- ignore unsupported delimiters for a language;
- require at least one valid delimiter;
- JSON/JSONC always remain double-quoted;
- a target that cannot safely represent the value is skipped during cycle;
- if no alternate target is safe, leave the document unchanged with concise feedback.

### 3.6 Multi-cursor and undo

- every command produces one undo step;
- duplicate literal targets are edited once;
- overlapping literal ranges are rejected before applying edits;
- cursors/selections should remain meaningfully positioned after edit application;
- mixed EOL files are not normalized;
- the extension never writes files directly and never scans the workspace.

---

## 4. Explicit non-goals

- Prettier or ESLint replacement;
- quote-style linting;
- format-on-save;
- automatic conversion while typing;
- whole-workspace or whole-file rewrites;
- regex literal conversion;
- JSX prop rewriting in `0.1.0`;
- translation/localization tooling;
- AST refactoring outside the active document;
- code actions for every quote;
- telemetry about source code or command targets.

---

## 5. Architecture

Recommended layout:

```text
src/
├─ extension.ts
├─ commands/
│  ├─ cycleQuotes.ts
│  ├─ convertQuotes.ts
│  └─ applyTransformation.ts
├─ core/
│  ├─ model.ts
│  ├─ locate.ts
│  ├─ decode.ts
│  ├─ encode.ts
│  ├─ transform.ts
│  ├─ edits.ts
│  └─ configuration.ts
├─ adapters/
│  ├─ adapter.ts
│  ├─ javascript.ts
│  └─ json.ts
└─ platform/
   ├─ editor.ts
   └─ feedback.ts
```

### 5.1 Domain model

```ts
type QuoteKind = "single" | "double" | "template";

type OffsetRange = {
  start: number;
  end: number;
};

interface LocatedLiteral {
  range: OffsetRange;
  delimiter: QuoteKind;
  rawBody: string;
  languageId: string;
  kind: "string" | "template";
  hasInterpolation: boolean;
}

type TransformResult =
  | { ok: true; text: string; target: QuoteKind }
  | { ok: false; reason: TransformRejection };
```

`TransformRejection` must be an enum/union with stable user-facing mapping, not arbitrary thrown strings.

### 5.2 Language adapter contract

```ts
interface QuoteLanguageAdapter {
  supports(languageId: string): boolean;
  locate(source: string, offset: number): LocatedLiteral | undefined;
  decode(literal: LocatedLiteral): DecodeResult;
  encode(value: DecodedValue, target: QuoteKind): TransformResult;
  allowedTargets(literal: LocatedLiteral): readonly QuoteKind[];
}
```

The pure core must not import `vscode`.

### 5.3 Parsing approach

Start with bounded lexical scanners for the supported language families. The scanner must understand enough syntax to distinguish:

- comments;
- quoted strings;
- template literals;
- regex literals in contexts covered by tests;
- escapes;
- malformed/incomplete tokens.

Do not pull the full TypeScript compiler into the runtime bundle unless a measured prototype proves that it materially improves correctness without unacceptable bundle/startup cost. Record this decision in an ADR if the strategy changes.

### 5.4 Error model

Normal unsupported source is a result, not an exception. Exceptions are reserved for programmer errors or VS Code API failures.

User feedback categories:

- no literal at cursor;
- selection crosses literal boundary;
- target invalid for language;
- semantics cannot be proven safe;
- malformed/incomplete literal;
- conflicting multi-cursor targets.

---

## 6. Manifest and compatibility requirements

### 6.1 Runtime artifacts

Correct the current format mismatch. Recommended arrangement:

- Node: `dist/node/extension.cjs`, CommonJS bundle;
- Web: `dist/web/extension.js`, browser/webworker-compatible single bundle;
- shared source restricted to browser-safe APIs;
- `vscode` external in both bundles.

### 6.2 Activation and menus

Contributed commands provide lazy activation on modern VS Code. If the derived minimum version is below 1.74, add explicit `onCommand:` activation events.

Add `menus.editor/context` entries only for supported language IDs and appropriate editor state. Do not overload the context menu with four always-visible commands. Recommended context menu:

- primary entry: `Cycle Quotes`;
- conversion commands remain in Command Palette unless user testing justifies a submenu.

No default keybinding in the first release unless conflict research identifies a safe cross-platform chord.

### 6.3 Capability matrix

Expected after verification:

| Environment | Target |
| --- | --- |
| Desktop local | Full |
| Remote/WSL/SSH/Codespaces | Full |
| `vscode.dev` / `github.dev` | Full |
| Virtual Workspace | Full |
| Restricted Mode | Full |

No filesystem, process, network, or workspace execution dependency is needed.

Derive `engines.vscode` from APIs actually used. Test the minimum supported release and current stable; do not retain the scaffold's `^1.134.0` without evidence.

---

## 7. Security and privacy

- source text never leaves the active editor process;
- no network requests;
- zero telemetry in `0.1.0`;
- no source text, literal content, file paths, or selection content in logs;
- no persistence in `globalState`, `workspaceState`, storage paths, or temp files;
- command arguments from other extensions are validated at runtime;
- no `eval`, dynamic code execution, or workspace-controlled regex;
- configuration arrays are schema-validated and bounded;
- errors mention language and reason, not literal contents.

Threat tests:

- string containing secrets;
- extremely long single literal;
- crafted backslashes and Unicode escapes;
- hostile multi-cursor overlap;
- invalid configuration values;
- incomplete source while typing;
- external invocation with malformed arguments.

---

## 8. UX and accessibility

- no webview, status item, Tree View, or notification on success;
- commands work fully from keyboard;
- one concise warning for a failed multi-cursor operation;
- use language-specific terminology only where necessary;
- preserve editor focus;
- maintain meaningful cursor positions after edit;
- command titles and descriptions clearly state that represented value is preserved;
- README examples must show escaping before and after, including rejection cases;
- no color-dependent UI.

---

## 9. Performance budget

- lazy activation only;
- no work while idle beyond command registration;
- no workspace scans or file watchers;
- target lookup should be bounded around each cursor where feasible;
- normal command completion under 20 ms for typical files under 1 MiB;
- large generated files must not cause unbounded backtracking;
- runtime bundle target below 250 KiB minified unless a parser decision is explicitly justified;
- memory proportional to active document text and current operation only.

Add stress fixtures for 1 MiB, 5 MiB, and pathological escape/comment sequences. Record timings before release.

---

## 10. Test strategy

### 10.1 Unit fixtures — locator

- single/double strings;
- strings in comments;
- comment markers inside strings;
- regex literals containing quotes;
- import/export strings;
- object keys and values;
- nested template literals;
- escaped delimiters;
- escaped backslashes;
- unterminated tokens;
- cursor on opening/closing delimiter;
- cursor inside content;
- exact and partial selections;
- CRLF/LF;
- BOM;
- Unicode identifiers around literals.

### 10.2 Unit fixtures — semantic conversion

- empty string;
- target delimiter inside value;
- old delimiter unnecessarily escaped;
- even/odd backslash runs;
- `\n`, `\r`, `\t`, `\0`, hex and Unicode escapes;
- literal `${` when converting to template;
- backtick values;
- multiline template values;
- invalid/legacy escapes;
- surrogate pairs and emoji;
- null characters;
- JSON escape rules;
- already-target-delimited values;
- cycle skipping an unsafe target.

### 10.3 Property-based tests

Generate safe Unicode values and valid literals for each supported delimiter, then assert:

1. decoding succeeds;
2. conversion succeeds where promised;
3. decoding the result equals the original value;
4. converting through a complete cycle returns an equivalent value;
5. encode/decode never introduces active template interpolation.

A lightweight property-testing dependency is acceptable only in devDependencies.

### 10.4 Integration tests

- each command activates the extension;
- one edit/undo transaction;
- multiple cursors;
- duplicate target cursors;
- selection restoration;
- JSON commands hidden/rejected correctly;
- unsupported language behavior;
- malformed argument behavior;
- Remote-style/non-file document URI;
- Restricted Mode;
- web extension host.

### 10.5 Package tests

- production Node and web bundles;
- VSIX creation and content inspection;
- clean-profile install;
- command activation in packaged form;
- no source/test fixtures accidentally shipped;
- final bundle contains no Node-only code in browser artifact.

---

## 11. Ordered ticket backlog

Implementation status:

| Tickets | Status |
| --- | --- |
| QSW-001–QSW-022 | Implemented in the release-candidate branch |
| QSW-023 | Not executed; requires explicit publication authorization |

The ticket descriptions below remain the acceptance record.

### Foundation

#### QSW-001 — Align Node/web module formats
Priority: P0  
Depends on: none

Correct the current `type: module` versus CommonJS output mismatch. Establish explicit Node and web artifacts, update manifest, build scripts, `.vscodeignore`, and launch configurations.

Acceptance evidence: built Node artifact activates; browser artifact loads in a web extension host; both are present in the packaged VSIX.

#### QSW-002 — Add desktop and web Extension Host test harnesses
Priority: P0  
Depends on: QSW-001

Add `@vscode/test-electron`, `@vscode/test-web`, fixture workspace, activation test, deterministic CI, and timeouts.

Acceptance evidence: CI detects a broken entry point or missing command registration.

#### QSW-003 — Define literal, target, rejection, and edit domain types
Priority: P0  
Depends on: QSW-001

Create pure immutable types and stable rejection reasons. No `vscode` imports.

Acceptance evidence: exhaustive switches compile and domain tests pass.

#### QSW-004 — Decide and document lexical parsing strategy
Priority: P0  
Depends on: QSW-003

Prototype bounded scanner versus parser dependency. Record correctness, bundle, web, startup, and maintenance impact. Commit an ADR if any runtime parser dependency is selected.

Acceptance evidence: decision backed by representative fixtures and bundle measurements.

### Core implementation

#### QSW-005 — Implement JavaScript/TypeScript literal locator
Priority: P0  
Depends on: QSW-004

Locate safe string/template tokens while excluding comments, regex literals, and malformed ambiguity.

Acceptance evidence: locator fixture matrix passes without regex-only global matching.

#### QSW-006 — Implement JSON/JSONC literal locator
Priority: P0  
Depends on: QSW-004

Recognize valid double-quoted JSON strings and comments in JSONC. Preserve mandatory JSON syntax.

Acceptance evidence: JSON and JSONC fixtures pass; single/template targets are rejected.

#### QSW-007 — Implement JavaScript/TypeScript decoder
Priority: P0  
Depends on: QSW-005

Decode the supported escape subset into a semantic representation while returning explicit rejection for unsafe constructs.

Acceptance evidence: escape and Unicode fixture matrix passes.

#### QSW-008 — Implement JSON decoder
Priority: P0  
Depends on: QSW-006

Decode JSON strings under JSON rules only.

Acceptance evidence: JSON standard escape fixtures and malformed input tests pass.

#### QSW-009 — Implement delimiter-aware encoders
Priority: P0  
Depends on: QSW-007, QSW-008

Encode semantic values for single, double, and safe template targets; protect `${}` and backticks.

Acceptance evidence: decode-after-encode equivalence tests pass.

#### QSW-010 — Implement semantic transformation pipeline
Priority: P0  
Depends on: QSW-009

Combine locate/decode/target/encode/validate into one pure result API. Never throw for normal unsupported source.

Acceptance evidence: table-driven conversions and rejections pass.

#### QSW-011 — Add property-based semantic equivalence suite
Priority: P0  
Depends on: QSW-010

Generate safe values, delimiter combinations, and cycles. Preserve failing seeds as regression fixtures.

Acceptance evidence: deterministic CI run and documented seed policy.

### Editor integration

#### QSW-012 — Implement cursor and selection target collection
Priority: P0  
Depends on: QSW-005, QSW-006

Handle multiple cursors, exact/partial selections, duplicate literals, overlap detection, and all-or-nothing validation.

Acceptance evidence: multi-selection unit and integration tests.

#### QSW-013 — Implement atomic edit application and cursor restoration
Priority: P0  
Depends on: QSW-010, QSW-012

Apply non-overlapping edits in one undo step and retain meaningful selections.

Acceptance evidence: one undo restores the original document for every command.

#### QSW-014 — Implement cycle command
Priority: P0  
Depends on: QSW-013

Read validated per-language order, skip unsafe targets, and provide concise no-op feedback.

Acceptance evidence: full cycle tests for JS/TS and JSON behavior.

#### QSW-015 — Implement explicit conversion commands
Priority: P0  
Depends on: QSW-013

Implement single, double, and template commands with language/target constraints.

Acceptance evidence: command matrix passes in Extension Host.

#### QSW-016 — Add configuration schema and validation
Priority: P1  
Depends on: QSW-014

Contribute bounded, duplicate-safe quote-order settings with descriptions and defaults. Do not expose formatter-like options.

Acceptance evidence: invalid configuration falls back safely and is covered by tests.

#### QSW-017 — Add command contexts and menu design
Priority: P1  
Depends on: QSW-014, QSW-015

Scope context menu to supported language IDs; keep secondary conversions in Command Palette unless usability testing supports a submenu. Record default-keybinding decision.

Acceptance evidence: manual keyboard/context QA and manifest tests.

### Compatibility, safety, and release

#### QSW-018 — Complete desktop integration matrix
Priority: P0  
Depends on: QSW-014 through QSW-017

Test dirty files, untitled files, multiple cursors, Restricted Mode, multi-root, non-file URIs, and minimum/current VS Code.

Acceptance evidence: green integration suite and recorded compatibility result.

#### QSW-019 — Complete web bundle and web-host tests
Priority: P0  
Depends on: QSW-002, QSW-014 through QSW-017

Deliver browser entry, `@vscode/test-web` coverage, and manual `vscode.dev` sideload.

Acceptance evidence: same core behavior in desktop and web hosts.

#### QSW-020 — Security, privacy, and performance review
Priority: P0  
Depends on: QSW-018, QSW-019

Audit source-content handling, configuration boundaries, logs, dependencies, bundle size, and pathological input timings.

Acceptance evidence: committed review checklist; no source persistence or content logging; budget met.

#### QSW-021 — Replace scaffold README and assets
Priority: P1  
Depends on: implemented commands

Document supported languages, examples, rejections, settings, privacy, web support, troubleshooting, and final screenshots. Update CHANGELOG and Marketplace copy.

Acceptance evidence: no placeholder preview or clone/F5-only user instructions remain as the primary experience.

#### QSW-022 — Harden CI, package, and smoke-test VSIX
Priority: P0  
Depends on: QSW-020, QSW-021

Run unit, property, desktop, web, type, production build, VSIX inspection, and clean-profile packaged activation.

Acceptance evidence: release candidate artifact installs and all commands work.

#### QSW-023 — Publish and verify `0.1.0`
Priority: P0  
Depends on: QSW-022

Verify names, publish to Marketplace and Open VSX where compatible, create signed/tagged release notes, install public artifacts, and monitor first reports.

Acceptance evidence: public listings install successfully in desktop and web environments as advertised.

---

## 12. Launch gate

Do not release until:

- every successful transformation passes semantic equivalence tests;
- all unsupported cases fail without document edits;
- one undo restores every multi-cursor command;
- no placeholder source or placeholder test remains;
- Node and browser artifacts match manifest declarations;
- Extension Host tests run in desktop and web;
- minimum VS Code version is derived and tested;
- bundle/startup/pathological-input budgets are measured;
- README claims match the implemented language matrix;
- VSIX is installed and tested from a clean profile;
- no source content is logged, persisted, or transmitted.

---

## 13. Post-`0.1.0` evaluation backlog

Only promote based on demand and a new fixture suite:

- JSX/TSX attribute adapter;
- Python strings;
- normalize selected literals command;
- configurable all-or-nothing versus best-effort multi-cursor mode;
- language-specific orders beyond JS/TS;
- additional adapters for PHP, Ruby, Rust;
- public command API for other extensions.

Do not add format-on-save or linting without changing the product definition.

---

## 14. Primary references

- https://code.visualstudio.com/api
- https://code.visualstudio.com/api/references/extension-manifest
- https://code.visualstudio.com/api/references/activation-events
- https://code.visualstudio.com/api/extension-guides/web-extensions
- https://code.visualstudio.com/api/extension-guides/virtual-workspaces
- https://code.visualstudio.com/api/extension-guides/workspace-trust
- https://code.visualstudio.com/api/advanced-topics/extension-host
- https://code.visualstudio.com/api/working-with-extensions/testing-extension
- https://code.visualstudio.com/api/working-with-extensions/bundling-extension
- https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- https://github.com/microsoft/vscode-extension-samples
- https://github.com/microsoft/vscode-test-web
