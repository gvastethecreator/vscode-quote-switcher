# Code map · vscode-quote-switcher

generated: 2026-09-05T04:45:27Z
commit: 8c07334ac044
scope: .

counts: 7 nodes · 8 edges · 0 flows · 0 unknown

## Modules

- `esbuild` · `esbuild.cjs` · interface · Esbuild
  callers: repository (calls)
  callees: external-dependencies (imports)
  tests: (none)
  entry: esbuild.cjs:main

- `external-dependencies` · `esbuild.cjs` · external · External
  callers: esbuild (imports), scripts (imports), src (imports), src-core (imports)
  callees: (none)
  tests: (none)
  entry: esbuild.cjs:esbuild

- `repository` · `package.json` · module · Repository
  callers: (none)
  callees: esbuild (calls), scripts (calls)
  tests: (none)
  entry: package.json:{

- `scripts` · `scripts` · service · Scripts
  callers: repository (calls)
  callees: external-dependencies (imports), src-core (imports)
  tests: (none)
  entry: scripts/build-web-tests.mjs:root

- `src` · `src` · module · Src
  callers: (none)
  callees: external-dependencies (imports), src-core (imports)
  tests: (none)
  entry: src/commands.ts:QuoteCommand

- `src-core` · `src/core` · service · Src
  callers: scripts (imports), src (imports)
  callees: external-dependencies (imports)
  tests: src/core/scanner.test.ts, src/core/targets.test.ts, src/core/transform.test.ts
  entry: src/core/configuration.ts:normalizeQuoteOrder

- `test-workspace` · `test-workspace` · module · Test Workspace
  callers: (none)
  callees: (none)
  tests: (none)
  entry: test-workspace/fixture.ts:greeting

## Edges

- esbuild -> external-dependencies · imports
- repository -> esbuild · calls
- repository -> scripts · calls
- scripts -> external-dependencies · imports
- scripts -> src-core · imports
- src -> external-dependencies · imports
- src -> src-core · imports
- src-core -> external-dependencies · imports

## Unknown

- none

## Flows

- none
