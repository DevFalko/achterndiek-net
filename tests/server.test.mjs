// Prüft die lokale Vorschau (scripts/server.py): Adressen ohne .html wie bei GitHub Pages.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let server, basis;

/** Sucht einen freien Port. */
const freierPort = () => new Promise((ok) => {
  const s = createServer().listen(0, "localhost", () => { const { port } = s.address(); s.close(() => ok(port)); });
});

before(async () => {
  const port = await freierPort();
  basis = `http://localhost:${port}`;
  server = spawn("python3", ["scripts/server.py"], { cwd: ROOT, env: { ...process.env, PORT: String(port) }, stdio: "ignore" });
  for (let i = 0; i < 50; i++) {
    try { await fetch(basis + "/"); return; } catch { await new Promise((r) => setTimeout(r, 100)); }
  }
  throw new Error("Vorschau-Server startet nicht");
});

after(() => server?.kill());

const status = async (pfad, method = "GET") => (await fetch(basis + pfad, { method })).status;

test("Startseite und Seiten ohne .html", async () => {
  assert.equal(await status("/"), 200);
  assert.equal(await status("/gruppen"), 200);
  assert.equal(await status("/gruppen.html"), 200);
});

test("Adressen mit Parametern und HEAD-Anfragen", async () => {
  assert.equal(await status("/gruppen?filter=bremen"), 200);
  assert.equal(await status("/gruppen", "HEAD"), 200);
});

test("liefert den Inhalt der richtigen Seite", async () => {
  const text = await (await fetch(basis + "/kontakt")).text();
  assert.match(text, /<link rel="canonical" href="https:\/\/achterndiek\.net\/kontakt">/);
});

test("unbekannte Seiten und Dateien: 404", async () => {
  assert.equal(await status("/gibt-es-nicht"), 404);
  assert.equal(await status("/../etc/passwd"), 404);
});
