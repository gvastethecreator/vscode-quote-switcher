# Development

Quote Switcher uses pnpm 12, strict TypeScript, and two esbuild bundles. Product strings stay in English. The pure modules under `src/core/` do not import VS Code, Node, or browser globals.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm install` | Install the frozen dependency graph |
| `pnpm test` | Run unit and deterministic semantic-property tests |
| `pnpm run check-types` | Check strict TypeScript types |
| `pnpm run compile` | Build development Node and web bundles |
| `pnpm run package` | Build minified production bundles |
| `pnpm run test:performance` | Check scanner and bundle budgets |
| `pnpm run test:integration` | Run commands in VS Code Desktop |
| `pnpm run test:web` | Run commands in the VS Code web host and virtual filesystem |
| `pnpm run render:media` | Render the accepted raster icon |
| `pnpm run check:media` | Verify icon determinism, dimensions, and real alpha |
| `pnpm run vsix` | Create `quote-switcher.vsix` |
| `pnpm run inspect:vsix` | Inspect package contents and forbidden runtime surfaces |
| `pnpm run test:vsix` | Install the VSIX into a clean profile and run the command suite |
| `pnpm run quality` | Run the local non-host quality gate |

Press F5 to build both runtime bundles and open `test-workspace/` in an Extension Development Host.

## Core contract

Every successful conversion must pass `decode(original) === decode(result)`. The scanner is linear and conservative. A normal unsupported source form returns a typed rejection; it does not throw. Editor integration plans all targets before one `TextEditor.edit` call.

Add a minimal regression fixture when changing scanner or escape behavior. Keep the property seed fixed unless a captured failing seed becomes a named regression case.

See [ADR 0001](adr/0001-bounded-literal-scanner.md), [security review](security-review.md), and [publishing](publishing.md).
