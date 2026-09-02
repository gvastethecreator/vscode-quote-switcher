# Implementation evidence

Release candidate: `0.1.0`
Reviewed: 2026-09-02
Branch: `docs/complete-delivery-plan`

This record covers the local release candidate. Hosted CI, pull-request merge, tag, registry publication, and public-install verification are not inferred from local results.

## Ticket coverage

| Tickets | Implementation evidence |
| --- | --- |
| QSW-001–QSW-002 | Separate minified Node and browser bundles, desktop/web harnesses, explicit package entries, and clean launch profiles. |
| QSW-003–QSW-004 | Pure domain types plus the bounded scanner decision in `docs/adr/0001-bounded-literal-scanner.md`. |
| QSW-005–QSW-006 | JS/TS/JSON/JSONC scanner fixtures cover comments, regex, nested templates, Unicode tags, malformed input, JSONC comments, and literal-count limits. |
| QSW-007–QSW-010 | Manual safe-subset decoders, delimiter-aware encoder, generated-literal rescan, and exact decoded-value comparison. |
| QSW-011 | Deterministic 1,000-value matrix across all source and target delimiter pairs. |
| QSW-012–QSW-013 | Cursor/selection collection, deduplication, overlap rejection, all-or-nothing planning, one editor edit, selection mapping, and one-step undo. |
| QSW-014–QSW-017 | Cycle and explicit conversion commands, bounded resource settings, native command palette, one editor-context action, and no default keybinding or custom view. |
| QSW-018 | Desktop Extension Host coverage on VS Code `1.134.0` and `1.136.0`; current stable covers untitled/dirty documents, multi-cursor, undo, settings, JSON, malformed args, unsupported languages, and a writable non-file URI. |
| QSW-019 | Official VS Code web-host run passes in a writable virtual workspace using the browser bundle. |
| QSW-020 | Security review, zero production dependencies, strict input bounds, package surface inspection, and scanner/bundle performance budgets. |
| QSW-021 | Finished README, changelog, security docs, transparent generated icon, and a real VS Code runtime preview with provenance. |
| QSW-022 | Production build, 11-entry VSIX allowlist inspection, clean-profile VSIX installation, lazy activation, and command smoke pass. |
| QSW-023 | Not executed. Publication, tags, releases, and public-registry verification require separate explicit authorization. |

## Final local gates

| Gate | Result |
| --- | --- |
| Unit and semantic matrix | 26 passed; 0 failed |
| TypeScript | `tsc --noEmit` passed |
| Node/web production bundles | 16,250 bytes / 16,208 bytes |
| Scanner performance | 96 KiB 0.72 ms; 1 MiB 4.91 ms; 5 MiB 22.94 ms; pathological 6.05 ms |
| Media | deterministic icon and native-alpha 1200 × 800 preview passed |
| Desktop stable | VS Code `1.136.0` Extension Host passed |
| Minimum desktop | VS Code `1.134.0` Extension Host passed |
| Web host | writable virtual-workspace suite passed |
| VSIX inspection | 11 entries passed |
| Installed VSIX | clean-profile install and Extension Host suite passed |
| Product/hub PDR | byte-identical SHA-256 `8AD26CAEC415CA5452BCD3A0C890ADFB78E7BA0063027D2C71064C9FF5664981` |

## Frozen artifacts

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `quote-switcher.vsix` | 210,729 | `65151A8DCDC7628320423BEF6344C2473CE67BA7B6D4F55DF581FEFA6D645E9D` |
| `media/icon.png` | 9,271 | `E33CA2340B5D5D30C137CF66ACAF3874B31C277D41A6EFEA280DCA631C2A195A` |
| `media/preview.png` | 196,445 | `04BF54BDFA4864C307DE3095A989A399967B1FFBB7CEF915726DB6CE874D7126` |

## Remaining merge gates

- authorize local commits, branch pushes, pull-request update, and squash merge;
- run the hosted Windows/Linux/macOS, minimum/stable/Insiders, web, and VSIX matrix;
- keep publication work in QSW-023 until separately authorized.
