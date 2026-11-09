// Prüft die HTML-Seiten statisch: Links, Metadaten, keine externen Ressourcen, keine Telefonnummern.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, posix } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://achterndiek.net";
const lies = (f) => readFileSync(join(ROOT, f), "utf8");
const seiten = readdirSync(ROOT).filter((f) => f.endsWith(".html")).sort();
const html = Object.fromEntries(seiten.map((f) => [f, lies(f)]));
const alle = (re, s) => [...s.matchAll(re)].map((m) => m[1]);
const ids = (s) => new Set(alle(/\sid="([^"]+)"/g, s));

/** Löst einen Website-Pfad wie GitHub Pages auf: /x → x.html, /ordner/ → ordner/index.html. */
function datei(pfad) {
  let p = decodeURIComponent(pfad).replace(/^\/+/, "");
  if (p === "" || p.endsWith("/")) p += "index.html";
  if (existsSync(join(ROOT, p)) && statSync(join(ROOT, p)).isFile()) return p;
  if (existsSync(join(ROOT, p + ".html"))) return p + ".html";
  return null;
}

/** Alle internen Verweise einer Seite (href/src/srcset), ohne externe, mailto, tel. */
function verweise(seite) {
  const s = html[seite];
  const roh = [
    ...alle(/\s(?:href|src|poster)="([^"]*)"/g, s),
    ...alle(/\ssrcset="([^"]*)"/g, s).flatMap((v) => v.split(",").map((t) => t.trim().split(/\s+/)[0])),
  ];
  return roh.filter((u) => u && !/^(https?:|mailto:|tel:|data:|\/\/)/.test(u));
}

test("es gibt die erwarteten Seiten", () => {
  for (const f of ["index.html", "gruppen.html", "mitmachen.html", "kontakt.html", "impressum.html", "datenschutz.html", "404.html"]) {
    assert.ok(seiten.includes(f), `${f} fehlt`);
  }
});

for (const seite of seiten) {
  test(`${seite}: Grundgerüst (lang, title, viewport)`, () => {
    const s = html[seite];
    assert.match(s, /<html lang="de">/);
    assert.match(s, /<title>[^<]{5,}<\/title>/);
    assert.match(s, /<meta name="viewport"/);
  });

  test(`${seite}: alle internen Links und Dateien existieren`, () => {
    const basis = "/"; // alle Seiten liegen im Hauptordner
    for (const u of verweise(seite)) {
      const [pfadQuery, anker] = u.split("#");
      const pfad = pfadQuery.split("?")[0];
      if (pfad === "") {
        if (anker) assert.ok(ids(html[seite]).has(anker), `${seite}: Anker #${anker} fehlt`);
        continue;
      }
      const ziel = datei(posix.join(basis, pfad));
      assert.ok(ziel, `${seite}: Verweis „${u}“ zeigt ins Leere`);
      if (anker && ziel.endsWith(".html")) assert.ok(ids(lies(ziel)).has(anker), `${seite}: Anker „${u}“ fehlt in ${ziel}`);
    }
  });

  test(`${seite}: interne Seitenlinks ohne .html`, () => {
    const mitEndung = alle(/\shref="([^"]*\.html(?:#[^"]*)?)"/g, html[seite]).filter((u) => !/^https?:/.test(u));
    assert.deepEqual(mitEndung, [], "Konvention: Seiten ohne .html verlinken (z. B. href=\"gruppen\")");
  });

  test(`${seite}: keine externen Ressourcen (Datenschutz)`, () => {
    const s = html[seite];
    const extern = [
      ...alle(/<(?:script|img|iframe|video|audio|source|embed|object)\b[^>]*\ssrc="((?:https?:)?\/\/[^"]+)"/g, s),
      ...alle(/<link\b(?=[^>]*rel="(?:stylesheet|preload|icon|apple-touch-icon|manifest|modulepreload)")[^>]*href="((?:https?:)?\/\/[^"]+)"/g, s),
    ];
    assert.deepEqual(extern, [], "keine CDNs, Fonts, Tracker o. Ä. einbinden");
  });

  test(`${seite}: Dunkelmodus – color-scheme erklärt, Deichlinien ohne feste Farbe`, () => {
    // Ohne eigene Dunkel-Palette dunkeln Browser die Seite selbst ab (helle Deichlinien, Braun-Grau).
    assert.match(html[seite], /<meta name="color-scheme" content="light dark">/);
    for (const svg of html[seite].match(/<svg class="dike[^>]*>[\s\S]*?<\/svg>/g) || []) {
      assert.doesNotMatch(svg, /\sfill="/, "Deichfarbe per Klasse (dike / dike--navy), nicht per fill-Attribut");
    }
  });

  test(`${seite}: Hell/Dunkel-Umschalter – Skript blockierend vor dem CSS, Button im Header`, () => {
    // Ohne frühes Setzen von data-farbschema würde die Seite kurz hell aufblitzen.
    const s = html[seite];
    const skript = s.search(/<script src="\/?js\/farbschema\.js"><\/script>/);
    assert.ok(skript > 0 && skript < s.search(/<link rel="stylesheet"/), "farbschema.js ohne defer vor dem ersten Stylesheet laden");
    assert.match(s, /<header class="site-header">[\s\S]*<button class="farbschema" type="button" aria-pressed="false" aria-label="[^"]+"[^>]* hidden>[\s\S]*<\/header>/);
  });

  test(`${seite}: Bilder haben Alt-Text`, () => {
    const ohne = (html[seite].match(/<img\b[^>]*>/g) || []).filter((t) => !/\salt="/.test(t));
    assert.deepEqual(ohne, []);
  });

  test(`${seite}: keine Telefonnummern (außer Impressum)`, () => {
    if (seite === "impressum.html") return;
    const text = html[seite].replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ");
    assert.doesNotMatch(html[seite], /href="tel:/);
    assert.doesNotMatch(text, /(?:\+49|\b0)\s?\d{2,5}[\s/-]?\d{3,}[\s-]?\d{2,}/, "nur Funktionsadressen, keine Telefonnummern");
  });

  test(`${seite}: strukturierte Daten sind gültiges JSON`, () => {
    for (const j of alle(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, html[seite])) {
      assert.doesNotThrow(() => JSON.parse(j));
    }
  });

  test(`${seite}: absolute Links auf achterndiek.net existieren`, () => {
    for (const u of alle(/"(https:\/\/achterndiek\.net[^"]*)"/g, html[seite])) {
      assert.ok(datei(new URL(u).pathname), `${u} gibt es nicht`);
    }
  });
}

test("indexierbare Seiten: Canonical, Beschreibung, Open Graph; sonst noindex", () => {
  const titel = new Set();
  for (const seite of seiten) {
    const s = html[seite];
    const canonical = alle(/<link rel="canonical" href="([^"]+)"/g, s)[0];
    if (!canonical) {
      assert.match(s, /<meta name="robots" content="noindex">/, `${seite}: ohne Canonical muss die Seite noindex sein`);
      continue;
    }
    const erwartet = seite === "index.html" ? `${SITE}/` : `${SITE}/${seite.replace(/\.html$/, "")}`;
    assert.equal(canonical, erwartet, `${seite}: Canonical`);
    assert.equal(alle(/<meta property="og:url" content="([^"]+)"/g, s)[0], erwartet, `${seite}: og:url`);
    assert.match(s, /<meta name="description" content="[^"]{50,}"/, `${seite}: Beschreibung fehlt oder ist zu kurz`);
    assert.match(s, /<meta property="og:image" content="https:\/\//, `${seite}: og:image`);
    const t = alle(/<title>([^<]+)<\/title>/g, s)[0];
    assert.ok(!titel.has(t), `${seite}: Titel doppelt`);
    titel.add(t);
  }
});

test("sitemap.xml enthält genau die indexierbaren Seiten", () => {
  const inSitemap = alle(/<loc>([^<]+)<\/loc>/g, lies("sitemap.xml")).sort();
  const canonicals = seiten.flatMap((f) => alle(/<link rel="canonical" href="([^"]+)"/g, html[f])).sort();
  assert.deepEqual(inSitemap, canonicals);
});

test("robots.txt verweist auf die Sitemap", () => {
  assert.match(lies("robots.txt"), new RegExp(`Sitemap: ${SITE}/sitemap.xml`));
});

const cssDateien = readdirSync(join(ROOT, "css")).filter((f) => f.endsWith(".css")).sort();
// Seiten-Stylesheets und wo sie geladen werden (siehe Kopf von css/style.css)
const SEITEN_CSS = { "start.css": "index.html", "gruppen.css": "gruppen.html" };

test("CSS: nur lokale Dateien, kein @import, jede Datei unter 500 Zeilen", () => {
  assert.deepEqual(cssDateien, ["gruppen.css", "start.css", "style.css"], "neue CSS-Datei? SEITEN_CSS und Doku ergänzen");
  for (const f of cssDateien) {
    const css = lies(join("css", f));
    assert.doesNotMatch(css, /@import|url\(["']?(?:https?:)?\/\//, `${f}: @import oder externe Datei`);
    for (const u of alle(/url\(["']?([^"')]+)["']?\)/g, css)) {
      if (!u.startsWith("data:")) assert.ok(existsSync(join(ROOT, "css", u)), `${f}: ${u} fehlt`);
    }
    assert.ok(css.split("\n").length < 500, `${f}: über 500 Zeilen – aufteilen`);
  }
});

test("CSS: Ebenen-Reihenfolge in style.css, Seiten-Stylesheets nur in der Ebene „seiten“", () => {
  assert.match(lies("css/style.css"), /^@layer basis, bausteine, seiten, hilfen;$/m);
  for (const f of Object.keys(SEITEN_CSS)) {
    const ohneKommentare = lies(join("css", f)).replace(/\/\*[\s\S]*?\*\//g, "").trim();
    assert.ok(ohneKommentare.startsWith("@layer seiten {") && ohneKommentare.endsWith("}"), `${f}: alles in @layer seiten { … }`);
  }
});

for (const seite of seiten) {
  test(`${seite}: lädt style.css zuerst und nur die passenden Seiten-Stylesheets`, () => {
    const css = alle(/<link rel="stylesheet" href="\/?css\/([^"]+)"/g, html[seite]);
    assert.equal(css[0], "style.css");
    const erwartet = ["style.css", ...Object.entries(SEITEN_CSS).filter(([, s]) => s === seite).map(([f]) => f)];
    assert.deepEqual(css, erwartet);
  });
}

test("Gruppen: jede Gruppe hat einen Namen, Kartenpunkte liegen in Norddeutschland", () => {
  const gruppen = html["gruppen.html"].match(/<li class="group"[\s\S]*?<\/li>/g) || [];
  assert.ok(gruppen.length >= 10, "zu wenige Gruppen gefunden");
  for (const g of gruppen) {
    const id = alle(/id="([^"]+)"/g, g)[0] ?? alle(/<h3>([^<]+)<\/h3>/g, g)[0];
    assert.match(g, /<h3>[^<]+<\/h3>/, `${id}: Name fehlt`);
    assert.match(g, /class="place"/, `${id}: Ort fehlt`);
    // Jede Gruppe ist direkt erreichbar: eigener Link oder klickbarer Verweis auf Gau/Landesmark
    assert.match(g, /class="(links|hint)">[^]*?<a href=/, `${id}: kein Kontaktlink`);
    if (!g.includes("data-lat")) continue; // überregionale Runden ohne Kartenpunkt
    const lat = Number(alle(/data-lat="([^"]+)"/g, g)[0]);
    const lon = Number(alle(/data-lon="([^"]+)"/g, g)[0]);
    // Norddeutschland: grob Niedersachsen, Bremen, Hamburg, Schleswig-Holstein
    assert.ok(lat > 51 && lat < 55.2 && lon > 6.5 && lon < 11.5, `${id}: Koordinaten ${lat}, ${lon} liegen nicht in Norddeutschland`);
  }
});
