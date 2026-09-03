# Asset provenance

## Marketplace icon

- Provider: OpenAI ImageGen
- Generated: 2026-09-02
- Generation id: `exec-317dcd10-bc09-4da4-b6a6-6972ab75b8b8`
- Raw source: `media/source/quote-switcher-imagegen-raw.png`, SHA-256 `19F3C10DB63BA9F9A8ADDA868126A3ED3F3FBCBED6F2AF69F4FE0ACB8941A8F7`
- Production source: `media/source/quote-switcher-imagegen.png`, normalized to a thin transparent safety margin without redrawing the generated art; SHA-256 `3D184F4475BF7BEA344AACA96637645681E90140C5DD13254FF6F28F2D99ACEA`
- Production output: `media/icon.png`, downsampled directly from the accepted Imagegen PNG at 256 × 256 with alpha preserved
- Production SHA-256: `749884AF5CFE8D92DDA00264C9ACD0D2E6148B5AB5CE6446B3A48722FF632174`

Direction: aligned graphite and violet quote forms inside two thick curved orange and coral swap arrows. Crisp vectorized 3D, no France blue, emerald, plastic, container, glow, or background.

The accepted generated PNG is the production source. No SVG reinterpretation or alternate vector master remains. The source is excluded from the VSIX; the Marketplace consumes `media/icon.png`.

## Marketplace preview

`media/preview.png` is not generated artwork or a UI mockup.

- Source: Quote Switcher 0.1.0 installed in stable VS Code 1.136.1 on Windows, captured at runtime on 2026-09-03.
- Flow: three real selections targeted aligned TypeScript string literals, then `Quote Switcher: Convert to Single Quotes` ran from the native Command Palette.
- Result: all three double-quoted literals became single-quoted literals in one edit while preserving their values.
- Runtime proof: the real before and after editors remain visible side by side.
- Final output: a tightly cropped RGBA before-and-after editor image with a transparent perimeter and rounded transparent corners.
