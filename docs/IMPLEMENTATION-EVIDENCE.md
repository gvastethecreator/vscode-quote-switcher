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
| Media | deterministic icon and tightly cropped native-alpha preview passed |
| Desktop stable | VS Code `1.136.0` Extension Host passed |
| Minimum desktop | VS Code `1.134.0` Extension Host passed |
| Web host | writable virtual-workspace suite passed |
| VSIX inspection | 11 entries passed |
| Installed VSIX | clean-profile install and Extension Host suite passed |
| Product/hub PDR | byte-identical SHA-256 `D0AE5091EAFEFC6D08DAA0F3CC7767AF77A675AD6E50C5E52B0816467CE10087` |

## Frozen artifacts

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `quote-switcher.vsix` | 85,274 | `34CCE2BA93DBF0B9F2CF4016512B138B98BC75F6F3CA6E1C57C95FAABD39429F` |
| `media/icon.png` | 41,219 | `6BC23434FF500EEF63600FD962ECC4D767AB6276998E2525F3B4CA9FAA3B7615` |
| `media/preview.png` | 28,055 | `A2DD3651E534D136E802BE68B1E4383225B28B190C34F9A04BB03001D2D95704` |

## Remaining merge gates

- authorize local commits, branch pushes, pull-request update, and squash merge;
- run the hosted Windows/Linux/macOS, minimum/stable/Insiders, web, and VSIX matrix;
- keep publication work in QSW-023 until separately authorized.
