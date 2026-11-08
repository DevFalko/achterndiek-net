// Fotos für die Website aufbereiten: zuschneiden, Gesichter verpixeln,
// verkleinern, als WebP speichern und alle Metadaten (EXIF/GPS) entfernen.
//
// Aufruf:  npm run fotos            (alle Fotos aus scripts/fotos.json)
//          npm run fotos -- runde   (nur Fotos, deren Name "runde" enthält)
//          npm run fotos -- --vorschau runde   (markiert die Boxen rot, zum Kontrollieren)
//
// Originale liegen in assets/ (nicht im Repo, siehe .gitignore).
import sharp from "sharp";
import { readFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Liest die Foto-Konfiguration aus scripts/fotos.json. */
export async function ladeFotos() {
  return JSON.parse(await readFile(join(ROOT, "scripts/fotos.json"), "utf8")).fotos;
}

/** Kachelgröße der Verpixelung: ~0,6 % der Bildbreite, mindestens 8 px. */
export const blockGroesse = (W) => Math.max(8, Math.round(W * 0.006));

/** Verpixelt die Boxen (relativ 0..1) direkt im Rohbild. */
export async function verpixeln(buf, W, H, boxen, vorschau = false) {
  const block = blockGroesse(W);
  const overlays = [];
  for (const [x0, y0, x1, y1] of boxen) {
    const left = Math.round(x0 * W), top = Math.round(y0 * H);
    const width = Math.min(W - left, Math.round((x1 - x0) * W));
    const height = Math.min(H - top, Math.round((y1 - y0) * H));
    if (vorschau) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="none" stroke="red" stroke-width="${block / 2}"/></svg>`;
      overlays.push({ input: Buffer.from(svg), left, top });
      continue;
    }
    const klein = await sharp(buf).extract({ left, top, width, height })
      .resize(Math.max(1, Math.round(width / block)), Math.max(1, Math.round(height / block)), { kernel: "cubic" })
      .toBuffer();
    const pixel = await sharp(klein).resize(width, height, { kernel: "nearest" }).toBuffer();
    overlays.push({ input: pixel, left, top });
  }
  return overlays.length ? sharp(buf).composite(overlays).toBuffer() : buf;
}

/** Erzeugt alle Größen eines Fotos in zielDir (Standard: img/). */
export async function verarbeite(f, { vorschau = false, zielDir = join(ROOT, "img"), log = console.log } = {}) {
  let img = sharp(join(ROOT, "assets", f.quelle)).rotate();
  let { width: W, height: H } = await img.metadata();
  let buf = await img.toBuffer();
  if (f.zuschnitt) {
    const [x0, y0, x1, y1] = f.zuschnitt;
    const box = { left: Math.round(x0 * W), top: Math.round(y0 * H), width: Math.round((x1 - x0) * W), height: Math.round((y1 - y0) * H) };
    buf = await sharp(buf).extract(box).toBuffer();
    // Verpixel-Boxen beziehen sich auf das Original – hier vereinfacht: bei Zuschnitt keine Boxen verwenden.
    W = box.width; H = box.height;
  }
  if (f.verpixeln?.length) buf = await verpixeln(buf, W, H, f.verpixeln, vorschau);
  if (f.helligkeit) buf = await sharp(buf).modulate({ brightness: f.helligkeit }).toBuffer();

  for (const w of f.breiten ?? [800, 1400]) {
    const ziel = join(zielDir, `${f.name}-${w}.${vorschau ? "vorschau.jpg" : "webp"}`);
    await mkdir(dirname(ziel), { recursive: true });
    const out = sharp(buf).resize(w);
    const info = await (vorschau ? out.jpeg({ quality: 80 }) : out.webp({ quality: 70 })).toFile(ziel);
    log(`${f.name}-${w}: ${info.width}x${info.height}, ${Math.round(info.size / 1024)} KB${f.verpixeln ? `, ${f.verpixeln.length} Bereiche verpixelt` : ""}`);
  }
}

// Nur beim direkten Aufruf (npm run fotos) ausführen, nicht beim Import in Tests.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const vorschau = args.includes("--vorschau");
  const filter = args.find((a) => !a.startsWith("--"));
  for (const f of await ladeFotos()) {
    if (!filter || f.name.includes(filter)) await verarbeite(f, { vorschau });
  }
}
