# ADR 0001: Bounded literal scanner

Status: accepted for `0.1.0`
Date: 2026-09-02

## Context

Quote Switcher must distinguish JavaScript, TypeScript, JSON, and JSONC string literals from comments, regex literals, and template substitutions. Pulling the TypeScript compiler into both runtime bundles would add a large dependency and broader syntax behavior than the small supported contract needs.

## Decision

Use a linear, browser-safe lexical scanner in `src/core/scanner.ts`.

The scanner:

- recognizes quoted strings, templates, comments, numbers, identifiers, punctuation, and regex contexts needed by the supported languages;
- recursively scans template substitutions so an inner safe string can still be targeted;
- marks the outer template unsafe when it contains active substitution;
- treats uncertain slash syntax conservatively and stops after an unterminated regex;
- emits incomplete literals as typed targets so commands can reject them safely;
- never uses a source-controlled regular expression or executes source.

Decoding and encoding remain separate. A transformed literal is decoded again and compared with the original semantic value before the edit is accepted.

## Consequences

- Node and browser bundles remain small and dependency-free at runtime.
- Scanner work is proportional to active-document length; there is no backtracking or workspace scan.
- JSX/TSX and arbitrary language syntax remain out of scope.
- Ambiguous or unsupported source may be rejected even when a full compiler could interpret it. Safe refusal is preferred to a semantics-changing edit.
- New syntax support requires focused lexical, semantic, performance, desktop, and web fixtures.
