# Asset provenance

## Marketplace icon

- Provider: OpenAI ImageGen
- Generated: 2026-09-02
- Source: `media/source/quote-switcher-imagegen.png`
- Source SHA-256: `128FECB0DAF093399F9CD50E25EF684084C1CD44D0EC1534BE4E63C5E04F8AAF`
- Production output: `media/icon.png`, downsampled directly from the accepted Imagegen PNG at 256 × 256 with alpha preserved
- Production SHA-256: `6BC23434FF500EEF63600FD962ECC4D767AB6276998E2525F3B4CA9FAA3B7615`

Direction: one blue quote form and one violet quote form connected by an amber swap cue. Near-flat, restrained pseudo-Fluent depth, no container, no glow, and a transparent background.

The accepted generated PNG is the production source. No SVG reinterpretation or alternate vector master remains. The source is excluded from the VSIX; the Marketplace consumes `media/icon.png`.

## Marketplace preview

`media/preview.png` is not generated artwork or a UI mockup.

- Source: Quote Switcher 0.1.0 installed in stable VS Code 1.136.1 on Windows, captured at runtime on 2026-09-03.
- Flow: three real selections targeted aligned TypeScript string literals, then `Quote Switcher: Convert to Single Quotes` ran from the native Command Palette.
- Result: all three double-quoted literals became single-quoted literals in one edit while preserving their values.
- Runtime proof: the real before and after editors remain visible side by side.
- Final output: a tightly cropped RGBA before-and-after editor image with a transparent perimeter and rounded transparent corners.
