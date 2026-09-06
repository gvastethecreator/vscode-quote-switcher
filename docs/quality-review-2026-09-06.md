# Quote Switcher — additional quality and competitive review

Review date: 2026-09-06. Baseline: `36ff49e1542833517ec1aa00b2e3dbae99fa8e81` (`main`).

## Status and evidence

This is a review and proposed acceptance contract. It does not implement new commands or claim passing tests. Live work state is in the accompanying PR, not this document. Existing behavior and `docs/PDR.md` are unchanged; later behavior changes must synchronize product and portfolio contracts.

Current ref, AGENTS, command adapter, reset implementation and publication steps were re-read. The adapter and reset retain the previously inspected behavior. No build, Extension Host, browser, VSIX or benchmark ran: local checkout was blocked by DNS and pnpm was unavailable.

Pinned sources: [editor adapter](https://github.com/gvastethecreator/vscode-quote-switcher/blob/36ff49e1542833517ec1aa00b2e3dbae99fa8e81/src/editor.ts), [registration/reset](https://github.com/gvastethecreator/vscode-quote-switcher/blob/36ff49e1542833517ec1aa00b2e3dbae99fa8e81/src/extension.ts), [release](https://github.com/gvastethecreator/vscode-quote-switcher/blob/36ff49e1542833517ec1aa00b2e3dbae99fa8e81/.github/workflows/release.yml).

## Preserve semantic conservatism

The existing command supports JavaScript, TypeScript, JSON and JSONC; it scans on demand, rejects unsafe transformations, handles multiple cursors and applies one editor edit with undo boundaries. Active substitutions, tagged templates and potentially meaningful directives have explicit rejection paths. Those refusals are part of the product's value, not defects to bypass for broader marketing coverage.

[Toggle Quotes](https://marketplace.visualstudio.com/items?itemName=BriteSnow.vscode-toggle-quotes), rechecked on the review date, declares JSX and wider file coverage. A wider language list is not evidence of better semantic preservation. Adopt only extensions that can satisfy the same safety contract.

## Configuration reset: one scope, explicit intent

The current reset writes each inspected default into Global and Workspace when a project is open. It does not restore inheritance, and it does not target a selected folder's overrides. Replace that ambiguous behavior with an explicit choice among available scopes. A reset-to-inheritance removes only the selected scope's overrides; an operation that deliberately pins default values must be named accordingly.

Use resource-scoped configuration for folder settings. Do not silently clear language overrides or other roots. Confirm before writes, serialize updates and report partial failures honestly. Cancelling must change nothing. Reuse a small local policy/adapter pattern rather than a portfolio settings service. Test user, saved-workspace, folder and no-workspace cases.

## Size-limit units are inconsistent

`MAX_DOCUMENT_LENGTH` is compared with `source.length`, which counts UTF-16 code units, while the warning says 8 MiB. This is a verified static units mismatch, not a measured memory exhaustion defect.

Choose and document one contract: either retain a code-unit bound with a correctly worded message, or enforce the stated byte bound without an unnecessary large duplicate allocation. Keep scanner and selection limits explicit and test exact boundary, one-over-boundary, ASCII, accented text and astral characters. If the threshold behavior changes, update the PDR/tests as well as the UI text. Do not claim that source-byte size equals total Extension Host memory.

## Whole-literal conversion inside a selected range

Add a separate explicit command to convert complete literals contained in the selected range. Do not change the current cursor-inside-literal command's meaning. Reuse the existing scanner, target collection and transformation functions; do not use document-wide text replacement.

Define selection boundaries precisely: fully contained literals are candidates; a boundary cutting a literal causes a clear refusal rather than partial editing. Deduplicate targets across overlapping selections. Preserve the current all-or-nothing policy when any candidate is unsafe. A range containing no eligible literals is a no-op with clear feedback. Retain original source order, cursor/selection mapping, JSON double-quote restrictions, directive handling and one logical undo. Do not silently skip an unsafe cursor or change unrelated literals outside the selection.

## JSX/TSX is conditional, not a language-ID toggle

Before enabling React language IDs, build a semantic corpus separating JSX text, quoted attributes, character entities, JavaScript expressions, comments, fragments and nested templates. Attribute quote changes and JavaScript literal changes have different escaping rules. A string inside an expression is not interchangeable with an attribute string.

Demonstrate equivalent represented values and parse structure with an appropriate test-only oracle for supported fixtures. Never evaluate arbitrary workspace code to test correctness. Keep an explicit supported subset and reject ambiguity. Only ship if the corpus and runtime/package cost justify the extra parser surface. Otherwise keep JSX/TSX unsupported with accurate documentation; do not introduce a heavyweight parser stack merely to match a competitor checklist.

## Additional release findings

The inspected GitHub Release job has no checkout or explicit repository context before `gh release`, and no verified-SHA tag target. Its release-existence check is not a tag-ref check and does not distinguish API failures from absence. Publication consumers shown do not explicitly verify downloaded SHA256 sidecars.

Require explicit repository identity, immutable preparation-stage source SHA, tag/ref validation and checksum verification before every publisher. Existing tags must not move; permission/network failures must fail closed. Preserve protected environments and artifact-only defaults. Validate without live publication. References: [GH_REPO](https://cli.github.com/manual/gh_help_environment), [release tag targeting](https://cli.github.com/manual/gh_release_create).

## Required regression evidence

| Scenario | Required outcome |
| --- | --- |
| Multi-cursor batch includes one unsafe literal | No part of the batch is edited. |
| Selected range cuts a literal | Explicit rejection; no guessed boundary expansion. |
| Overlapping/reversed selections | Stable deduplication and selection mapping. |
| Directives, tagged templates and active interpolation | Existing semantics/refusals preserved. |
| JSON/JSONC conversion | No single quotes or template strings introduced. |
| Unicode at the size boundary | Declared units, guard and message agree. |
| JSX attributes/entities versus JS expressions | Separate validated rules; unsupported cases remain rejected. |
| Reset with per-folder and language overrides | Only the explicitly selected scope changes. |
| Undo/redo | One logical action restores text and expected selections. |
| Wrong tag SHA/checksum or denied API | No registry publication or retagging. |

Run the existing core, editor integration, web and installed-VSIX suites, including malformed literals and maximum accepted inputs. Record source SHA, editor version, fixture and artifact hash. Measure first-command cost and bounded scanning on adversarial inputs, not only module load. No numeric runtime or compatibility result is claimed here.

## Exclusions

No formatter replacement, format-on-save feature, global regex substitution, workspace scanner, custom webview, telemetry, code evaluation or automatic broad language enablement. Safe refusal and native single-action editing remain the product boundary.
