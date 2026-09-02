import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const media = path.join(root, "media");
const svg = await readFile(path.join(media, "icon.svg"));

await sharp(svg, { density: 384 })
  .ensureAlpha()
  .resize(256, 256, { fit: "fill" })
  .png()
  .toFile(path.join(media, "icon.png"));

const previewArgument = process.argv.indexOf("--preview-source");
if (previewArgument !== -1) {
  const input = process.argv[previewArgument + 1];
  if (!input) throw new Error("--preview-source requires a PNG path.");
  const source = await readFile(path.resolve(root, input));
  const previewWidth = 1160;
  const previewHeight = 760;
  const mask = Buffer.from(
    `<svg width="${previewWidth}" height="${previewHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="${previewWidth}" height="${previewHeight}" rx="18" fill="#fff"/></svg>`,
  );
  const rounded = await sharp(source)
    .resize(previewWidth, previewHeight, { fit: "fill" })
    .ensureAlpha()
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: 1200,
      height: 800,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: rounded, left: 20, top: 20 }])
    .png()
    .toFile(path.join(media, "preview.png"));
}

const metadata = await sharp(path.join(media, "icon.png")).metadata();
console.log(`icon.png ${metadata.width}x${metadata.height} ${metadata.channels} channels`);
