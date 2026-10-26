# Asset provenance

## Marketplace icon

- Provider: OpenAI ImageGen
- Generated: 2026-09-03
- Generation ids: style pass `exec-f2728b0d-b2a3-4ebb-b3e2-b37966578ab8`; native-alpha extraction `exec-0ae2ea87-e3c9-4ee8-9275-3893b2bed6ad`
- Raw source: `media/source/quote-switcher-imagegen-raw.png`, SHA-256 `FC58C9274A64195B7D32330086FA64E704CC4F16275A6BD5A403FC4463FD70CC`
- Production source: `media/source/quote-switcher-imagegen.png`, normalized to a thin transparent safety margin without redrawing the generated art; SHA-256 `156BD6840DEB006579B28ABB3F025B72BCB8313DDB939A18BB6F02AEEB7A411C`
- Production output: `media/icon.png`, downsampled directly from the accepted Imagegen PNG at 256 × 256 with alpha preserved
- Production SHA-256: `E1CD4D31277248BA0B408335D2A236B9FAA12C60CF11327EC0E48B705BA201F3`

Direction: aligned graphite and violet quote forms inside two thick curved orange and coral swap arrows. The original color roles remain unchanged; controlled gradients provide compact integrated shadows in the Tag Mate vectorized semi-3D style. No France blue, emerald, plastic, container, glow, or background.

The accepted generated PNG is the production source. No SVG reinterpretation or alternate vector master remains. The source is excluded from the VSIX; the Marketplace consumes `media/icon.png`.

## Marketplace preview

`media/preview.png` is not generated artwork or a UI mockup.

- Source: Quote Switcher 0.1.0 installed in stable VS Code 1.136.1 on Windows, captured at runtime on 2026-09-03.
- Flow: three real selections targeted aligned TypeScript string literals, then `Quote Switcher: Convert to Single Quotes` ran from the native Command Palette.
- Result: all three double-quoted literals became single-quoted literals in one edit while preserving their values.
- Runtime proof: the real before and after editors remain visible side by side.
- Final output: a tightly cropped RGBA before-and-after editor image with a transparent perimeter and rounded transparent corners.
