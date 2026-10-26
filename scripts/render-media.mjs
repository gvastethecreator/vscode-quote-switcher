import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const media = path.join(root, "media");
const iconSource = path.join(media, "source", "quote-switcher-imagegen.png");

await sharp(iconSource)
  .ensureAlpha()
  .resize(256, 256, { fit: "contain" })
  .png()
  .toFile(path.join(media, "icon.png"));

const metadata = await sharp(path.join(media, "icon.png")).metadata();
console.log(`icon.png ${metadata.width}x${metadata.height} ${metadata.channels} channels`);
