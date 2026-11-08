// Sicherheitsregeln der Website (siehe docs/SECURITY.md):
// Content-Security-Policy in jeder Seite, keine Inline-Skripte/-Styles, saubere Karte, sichere Workflows.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const lies = (f) => readFileSync(join(ROOT, f), "utf8");
const seiten = readdirSync(ROOT).filter((f) => f.endsWith(".html")).sort();

export const CSP = "default-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-src 'none'";

for (const seite of seiten) {
  const s = lies(seite);

  test(`${seite}: Content-Security-Policy steht direkt nach <meta charset>`, () => {
    const kopf = s.slice(0, s.indexOf("</head>"));
    const zeilen = kopf.split("\n").map((z) => z.trim()).filter(Boolean);
    const i = zeilen.findIndex((z) => z.startsWith("<meta charset"));
    assert.ok(i >= 0, "<meta charset> fehlt");
    // Eine Meta-CSP gilt erst ab ihrer Position – davor darf nichts geladen werden.
    assert.equal(zeilen[i + 1], `<meta http-equiv="Content-Security-Policy" content="${CSP}">`);
    assert.equal((s.match(/Content-Security-Policy/g) || []).length, 1, "CSP doppelt");
  });

  test(`${seite}: keine Inline-Styles, -Skripte, Event-Handler oder javascript:-Links`, () => {
    assert.doesNotMatch(s, /\sstyle="/, "style-Attribut – stattdessen CSS-Klasse (CSP blockiert Inline-Styles)");
    assert.doesNotMatch(s, /<style[\s>]/, "<style>-Block – Styles gehören nach css/style.css");
    const skripte = [...s.matchAll(/<script\b([^>]*)>/g)].map((m) => m[1]);
    for (const attr of skripte) {
      assert.ok(/\ssrc="[^"]+"/.test(attr) || /type="application\/ld\+json"/.test(attr), `Inline-Skript <script${attr}>`);
    }
    assert.doesNotMatch(s, /\son[a-z]+\s*=/i, "Event-Handler im HTML (onclick=…) – CSP blockiert sie");
    assert.doesNotMatch(s, /javascript:/i);
  });
}

test("img/karte.svg enthält nichts Ausführbares", () => {
  // Die Karte wird per insertAdjacentHTML eingefügt (js/gruppen.js) – sie muss „dumme“ Grafik bleiben.
  const svg = lies("img/karte.svg");
  assert.doesNotMatch(svg, /<script/i);
  assert.doesNotMatch(svg, /\son[a-z]+\s*=/i, "Event-Handler");
  assert.doesNotMatch(svg, /javascript:/i);
  assert.doesNotMatch(svg, /<foreignObject/i);
  assert.doesNotMatch(svg, /<style|\sstyle=/i, "Styles in der Karte würden von der CSP blockiert");
  assert.doesNotMatch(svg, /(?:xlink:)?href="(?!#)/, "externe Verweise");
});

test("JavaScript: keine gefährlichen DOM-Funktionen außer der Karte", () => {
  for (const f of readdirSync(join(ROOT, "js")).filter((f) => f.endsWith(".js"))) {
    const js = lies(join("js", f));
    assert.doesNotMatch(js, /\binnerHTML\b|\bouterHTML\b|document\.write|\beval\s*\(|new Function\s*\(/, `${f}: unsicheres DOM/Code-Ausführung`);
    assert.doesNotMatch(js, /setAttribute\(\s*["']style["']/, `${f}: style-Attribut wird von der CSP blockiert – element.style nutzen`);
    const html = js.match(/insertAdjacentHTML/g) || [];
    const erlaubt = f === "gruppen.js" ? 1 : 0; // nur das Einfügen von img/karte.svg (eigene Datei, s. o.)
    assert.equal(html.length, erlaubt, `${f}: insertAdjacentHTML nur für die Karte`);
  }
});

test("GitHub Actions: nur Leserechte, kein pull_request_target, keine Zugangsdaten im Checkout", () => {
  for (const f of readdirSync(join(ROOT, ".github/workflows"))) {
    const y = lies(join(".github/workflows", f));
    assert.doesNotMatch(y, /pull_request_target/, `${f}: pull_request_target gibt Fork-PRs Schreibrechte`);
    assert.match(y, /permissions:\s*\n\s*contents:\s*read/, `${f}: permissions: contents: read fehlt`);
    assert.doesNotMatch(y, /\$\{\{\s*github\.event\.(?:pull_request|issue|comment|head_commit)/, `${f}: unsichere Event-Daten im Workflow`);
    for (const m of y.matchAll(/uses:\s*(\S+)/g)) {
      assert.match(m[1], /^actions\//, `${f}: nur Actions von GitHub erlaubt (${m[1]})`);
    }
    if (/actions\/checkout/.test(y)) assert.match(y, /persist-credentials:\s*false/, `${f}: persist-credentials: false fehlt`);
  }
});
