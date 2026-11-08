// Prüft das Foto-Skript und die veröffentlichten Bilder:
// - Verpixelung funktioniert (auch nach sharp-Updates)
// - jede eingetragene Box ist im veröffentlichten Bild tatsächlich verpixelt
// - keine Metadaten (EXIF/GPS) in den Bildern
// - mit Originalen in assets/: Neuerzeugung liefert dieselben Bilder wie im Repo
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { ROOT, ladeFotos, verpixeln, verarbeite, blockGroesse } from "../scripts/fotos.mjs";

const fotos = await ladeFotos();
const breiten = (f) => f.breiten ?? [800, 1400];
const bild = (f, w) => join(ROOT, "img", `${f.name}-${w}.webp`);

/** Zufallsrauschen als Testbild – maximal viele Details, die verschwinden müssen. */
async function rauschen(W, H) {
  const data = Buffer.alloc(W * H * 3);
  let x = 12345;
  for (let i = 0; i < data.length; i++) { x = (x * 1103515245 + 12345) >>> 0; data[i] = x >>> 24; }
  return sharp(data, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer();
}

/** Anteil benachbarter Pixel (waagerecht) mit nahezu gleicher Helligkeit im Bereich. */
async function glattheit(datei, [x0, y0, x1, y1]) {
  const { data, info } = await sharp(datei).greyscale().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  let glatt = 0, n = 0;
  for (let y = Math.round(y0 * H) + 1; y < Math.round(y1 * H) - 1; y++) {
    for (let x = Math.round(x0 * W) + 1; x < Math.round(x1 * W) - 2; x++) {
      n++;
      if (Math.abs(data[y * W + x] - data[y * W + x + 1]) <= 2) glatt++;
    }
  }
  return glatt / n;
}

test("fotos.json: Einträge und Boxen sind gültig", () => {
  const namen = new Set();
  for (const f of fotos) {
    assert.ok(f.quelle && f.name, "quelle und name sind Pflicht");
    assert.ok(!namen.has(f.name), `${f.name} doppelt`);
    namen.add(f.name);
    for (const b of f.verpixeln ?? []) {
      assert.equal(b.length, 4, `${f.name}: Box braucht [x0, y0, x1, y1]`);
      const [x0, y0, x1, y1] = b;
      assert.ok(b.every((v) => v >= 0 && v <= 1), `${f.name}: Box ${b} außerhalb 0..1`);
      assert.ok(x0 < x1 && y0 < y1, `${f.name}: Box ${b} verdreht`);
    }
    assert.ok(!(f.zuschnitt && f.verpixeln), `${f.name}: Zuschnitt und Verpixeln zusammen wird nicht unterstützt`);
  }
});

test("verpixeln(): Details in der Box verschwinden, außerhalb bleibt alles gleich", async () => {
  const W = 640, H = 400, block = blockGroesse(W); // 8 px
  const box = [0.25, 0.2, 0.5, 0.6]; // 160×160 px, Vielfaches der Kachelgröße
  const vorher = await rauschen(W, H);
  const nachher = await verpixeln(vorher, W, H, [box]);
  const a = await sharp(vorher).removeAlpha().raw().toBuffer();
  const b = await sharp(nachher).removeAlpha().raw().toBuffer();
  const [L, T, R, B] = [box[0] * W, box[1] * H, box[2] * W, box[3] * H];

  let aussenGleich = true;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (x >= L && x < R && y >= T && y < B) continue;
    const i = (y * W + x) * 3;
    if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) aussenGleich = false;
  }
  assert.ok(aussenGleich, "Pixel außerhalb der Box wurden verändert");

  for (let by = T; by < B; by += block) for (let bx = L; bx < R; bx += block) {
    const ref = (by * W + bx) * 3;
    for (let y = by; y < by + block; y++) for (let x = bx; x < bx + block; x++) {
      const i = (y * W + x) * 3;
      for (let c = 0; c < 3; c++) {
        assert.ok(Math.abs(b[i + c] - b[ref + c]) <= 1, `Kachel bei ${bx},${by} ist nicht einfarbig`);
      }
    }
  }
});

test("verpixeln(): Vorschau zeichnet nur Rahmen, verpixelt nicht", async () => {
  const W = 320, H = 200;
  const vorher = await rauschen(W, H);
  const nachher = await sharp(await verpixeln(vorher, W, H, [[0.25, 0.25, 0.75, 0.75]], true)).removeAlpha().raw().toBuffer();
  const mitte = ((H / 2) * W + W / 2) * 3;
  const a = await sharp(vorher).removeAlpha().raw().toBuffer();
  assert.deepEqual([...nachher.subarray(mitte, mitte + 3)], [...a.subarray(mitte, mitte + 3)]);
});

for (const f of fotos) {
  test(`${f.name}: veröffentlichte Bilder existieren, ohne Metadaten`, async () => {
    for (const w of breiten(f)) {
      assert.ok(existsSync(bild(f, w)), `${f.name}-${w}.webp fehlt – npm run fotos ausführen`);
      const m = await sharp(bild(f, w)).metadata();
      assert.equal(m.format, "webp");
      assert.equal(m.width, w);
      assert.equal(m.exif, undefined, "EXIF-Daten (ggf. GPS) im Bild");
      assert.equal(m.xmp, undefined, "XMP-Daten im Bild");
      assert.equal(m.iptc, undefined, "IPTC-Daten im Bild");
    }
  });

  if (f.verpixeln?.length) {
    test(`${f.name}: alle ${f.verpixeln.length} Gesichter sind im veröffentlichten Bild verpixelt`, async () => {
      // an der größten Breite messen – in kleinen Bildern sind die Kacheln nur wenige Pixel groß
      const w = Math.max(...breiten(f));
      for (const box of f.verpixeln) {
        const g = await glattheit(bild(f, w), box);
        // verpixelt: ~0,65–0,85 · normale Bildbereiche: meist < 0,4
        assert.ok(g >= 0.5, `${f.name}-${w}: Box ${box} wirkt nicht verpixelt (Glattheit ${g.toFixed(2)})`);
      }
    });
  }
}

// Nur lokal möglich: Originale liegen nicht im Repo.
const mitOriginalen = fotos.every((f) => existsSync(join(ROOT, "assets", f.quelle)));
test("Neuerzeugung aus den Originalen entspricht den Bildern im Repo", { skip: !mitOriginalen && "Originale in assets/ fehlen", timeout: 300_000 }, async () => {
  const tmp = await mkdtemp(join(tmpdir(), "fotos-"));
  try {
    for (const f of fotos) {
      await verarbeite(f, { zielDir: tmp, log: () => {} });
      for (const w of breiten(f)) {
        const neu = await sharp(join(tmp, `${f.name}-${w}.webp`)).raw().toBuffer({ resolveWithObject: true });
        const alt = await sharp(bild(f, w)).raw().toBuffer({ resolveWithObject: true });
        assert.equal(neu.info.height, alt.info.height, `${f.name}-${w}: andere Bildhöhe`);
        let summe = 0;
        for (let i = 0; i < neu.data.length; i++) summe += Math.abs(neu.data[i] - alt.data[i]);
        const abw = summe / neu.data.length;
        assert.ok(abw < 3, `${f.name}-${w}: weicht im Mittel um ${abw.toFixed(2)} ab – Bild prüfen und ggf. neu erzeugen`);
      }
    }
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});
