# Changelog

## [0.1.1] - 2026-10-26

- Refreshed README screenshots from the packaged extension running in stable VS Code.
- Fixed: Convert to Template and Cycle refuse positions where a template literal is invalid, such as module specifiers, property keys, enum members, and import attributes.
- Fixed: raw U+2028 and U+2029 inside quoted strings are valid string content.
- Convert Complete Literals in Selected Ranges asks for a target quote style. Every selection must be nonempty and include complete literals. A cut boundary or unsafe target rejects the whole operation. Existing cursor-based commands retain their behavior. Refusals identify the first failing selection and line/column without showing literal text. The command limit is 8,388,608 UTF-16 code units, not 8 MiB of encoded bytes. JSX/TSX remains a separate evaluation.

## 0.1.0 — Local candidate

- Added a Set Defaults command that writes factory settings to user and workspace scope.
- Added semantic quote conversion for JavaScript, TypeScript, JSON, and JSON with Comments.
- Added cycle, single, double, and safe template-literal commands with atomic multi-cursor editing and selection restoration.
- Added bounded literal scanning that excludes comments and regex literals and rejects ambiguous source.
- Added configurable JavaScript and TypeScript cycle order.
- Added desktop, web, virtual-workspace, performance, package, and installed-VSIX verification.
- Added Node and browser bundles with no runtime dependencies, network access, telemetry, or source persistence.
- Replaced scaffold media and documentation with a transparent icon and real VS Code runtime preview.
