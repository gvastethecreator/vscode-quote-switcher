# Asset provenance

## Marketplace icon

- Provider: OpenAI ImageGen
- Generated: 2026-09-02
- Source: `media/source/quote-switcher-imagegen.png`
- Source SHA-256: `128FECB0DAF093399F9CD50E25EF684084C1CD44D0EC1534BE4E63C5E04F8AAF`
- Final vector: hand-cleaned geometric source in `media/icon.svg`
- Production output: `media/icon.png`, rendered at 256 × 256 with alpha preserved
- Production SHA-256: `E33CA2340B5D5D30C137CF66ACAF3874B31C277D41A6EFEA280DCA631C2A195A`

Direction: one blue quote form and one violet quote form connected by an amber swap cue. Near-flat, restrained pseudo-Fluent depth, no container, no glow, and a transparent background.

The generated concept established the single/double quote and swap silhouette. The production vector removes gradients, highlights, and excess volume. Both design sources are excluded from the VSIX; the Marketplace consumes `media/icon.png`.

## Marketplace preview

`media/preview.png` is not generated artwork or a UI mockup.

- Source: VS Code 1.136 Extension Development Host on Windows, captured at runtime on 2026-09-02.
- Flow: three real cursors targeted aligned TypeScript string literals, then `Quote Switcher: Cycle Quotes` ran from the native Command Palette.
- Result: all three double-quoted literals became safe template literals in one edit; `${...}` became `\${...}` and backslash values were preserved.
- Runtime proof: three editor cursors remained; no workbench page error was captured.
- Final output: 1200 × 800 RGBA with a 20 px transparent perimeter and rounded transparent corners.
- Production SHA-256: `04BF54BDFA4864C307DE3095A989A399967B1FFBB7CEF915726DB6CE874D7126`
