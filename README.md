# achterndiek.net

Website der **Landesmark Achter'n Diek** der Christlichen Pfadfinderschaft Deutschlands e.V. (CPD) –
den Pfadfindergruppen in Bremen, Niedersachsen, Hamburg und Schleswig-Holstein.

Live: <https://achterndiek.net> · gehostet mit GitHub Pages

## Grundsätze

- **Schlank:** reines HTML/CSS, wenig JavaScript, kein Build-Schritt, kein Framework.
- **Datenschutzfreundlich:** keine Cookies, kein Tracking, keine externen Dienste
  (Schriften und Karte liegen lokal) – deshalb auch kein Cookie-Banner.
- **Keine personenbezogenen Daten:** nur Funktionsadressen; Gesichter auf Fotos werden
  immer verpixelt. Die verbindlichen Regeln stehen in [CLAUDE.md](CLAUDE.md),
  Hinweise für Entwickler:innen in [CONTRIBUTING.md](CONTRIBUTING.md).

## Aufbau

| Datei / Ordner | Inhalt |
|---|---|
| `index.html` | Startseite mit Hintergrundvideo, Gauen, Jubiläumsgalerie |
| `pfadfinden.html` | „Pfadfinden heute“ – Klischee-Check |
| `gruppen.html` | Alle Gruppen nach Gau, Suche/Filter und interaktive Karte |
| `mitmachen.html` | Stufen, Gruppenstunde/Fahrt/Lager, Siedeln, FAQ |
| `ueber-uns.html` | Landesmark, Chronik, Landesmark-Lied, Deichrat |
| `aeltere.html` | Ältere & Ehemalige, Kreuzpfadfinder, kreuz & quer |
| `cpd.html` | Die CPD (Bund, Bundeshof, Aktionen, Schulung) |
| `fahrtenziele.html` | Häuser und Zeltplätze für Fahrt und Lager (Bundeshof, Häuser in der Region, Buchungstipps) |
| `kontakt.html`, `impressum.html`, `datenschutz.html`, `404.html` | |
| `css/style.css` | Styling aller Seiten (Farben als CSS-Variablen in `:root`, Aufbau im Dateikopf) |
| `css/start.css`, `css/gruppen.css` | Nur Startseite bzw. Gruppenseite (Video-Hero, Bildband, Galerie / Filter, Karte) |
| `js/gruppen.js` | Filter und Karte der Gruppenseite |
| `js/hero.js` | Steuerung des Hintergrundvideos |
| `js/mail.js` | Setzt die kodierten E-Mail-Links zusammen (Schutz vor Scrapern) |
| `img/` | Fahnen, Logo, Karte (`karte.svg`), Fotos (`img/foto/`) |
| `video/` | Hintergrundvideo (Ausschnitt, komprimiert) |
| `fonts/` | Lokale Schriften (Bricolage Grotesque, Source Sans 3) |
| `scripts/` | Bild-Skript und Foto-Konfiguration |
| `assets/` | Originale (Fotos, Videos, Fahnen) – **nicht im Repo** |

Kopf- und Fußbereich sind in jeder HTML-Datei enthalten. Bei Änderungen an der Navigation
alle Seiten anpassen (z. B. mit Suchen & Ersetzen).

## Lokal ansehen

```bash
python3 scripts/server.py
```

Dann <http://localhost:8000> öffnen (oder `npm start`).

## Tests

```bash
npm install   # einmalig
npm test
```

Die Tests liegen in `tests/` und laufen ohne Zusatzpakete (Node-Testrunner):

- **`website.test.mjs`** – interne Links und Anker, Canonical/Open Graph/Sitemap, keine externen
  Ressourcen, Alt-Texte, keine Telefonnummern, gültige Strukturdaten, Kartenpunkte der Gruppen
- **`fotos.test.mjs`** – Verpixelung funktioniert; jede Box aus `scripts/fotos.json` ist im
  veröffentlichten Bild wirklich verpixelt; keine Metadaten (EXIF/GPS). Liegen die Originale in
  `assets/`, wird zusätzlich alles neu erzeugt und mit den Bildern im Repo verglichen – wichtig
  nach einem sharp-Update.
- **`emails.test.mjs`** – keine E-Mail-Adressen im Klartext im HTML, `js/mail.js` eingebunden
  und setzt die Links korrekt zusammen
- **`server.test.mjs`** – lokale Vorschau liefert Adressen ohne `.html` wie GitHub Pages
- **`security.test.mjs`** – Content-Security-Policy in jeder Seite, keine Inline-Styles/-Skripte,
  Karte ohne ausführbaren Inhalt, sichere Workflows

Auf GitHub laufen die Tests bei jedem Push und Pull Request automatisch
(`.github/workflows/tests.yml`, ohne den Vergleich mit den Originalen).

## Häufige Änderungen

### Gruppe hinzufügen oder ändern

In `gruppen.html` im passenden Gau einen Eintrag ergänzen:

```html
<li class="group" id="g-name" data-lat="53.08" data-lon="8.80">
  <span class="type">Stamm</span>          <!-- Stamm, Siedlung, Neuanfang, Jungmannschaft … -->
  <h3>Name</h3>
  <span class="place">Ort / Stadtteil</span>
  <span class="church">Kirchengemeinde</span>
  <span class="links"><a href="https://…">website.de</a><a href="mailto:…">E-Mail</a></span>
</li>
```

- `data-lat`/`data-lon` (Koordinaten, z. B. aus OpenStreetMap) setzen den Punkt auf der Karte automatisch.
- Ohne Kontakt: `<span class="hint">Kontakt über den Gau</span>`.
- Nur Älterenarbeit: `<span class="note">Derzeit nur Älterenarbeit</span>` unter dem Namen.
- Nur Funktionsadressen verwenden, keine privaten.
- Danach `npm run emails` ausführen (siehe unten).

### Fahrtenziel hinzufügen

In `fahrtenziele.html` unter „In der Region“ eine Karte nach dem Muster der vorhandenen ergänzen
(`article.card.ziel` mit Typ · Träger, Name, Ort, kurzer Beschreibung, 3–5 Merkmalen und Link zur
Website des Hauses). Nur Angaben übernehmen, die auf der offiziellen Seite des Hauses stehen; keine
Preise (ändern sich), keine Namen oder Telefonnummern von Ansprechpartnern – auf die Buchungsseite
des Hauses verlinken. Danach das „Stand“-Datum unter den Karten anpassen.

### E-Mail-Adressen eintragen

Adressen stehen im HTML nicht im Klartext, damit Scraper sie nicht einsammeln. Ausnahme ist das
Impressum: Die Pflichtangaben bleiben dort als normaler `mailto:`-Link stehen (`AUSNAHMEN` in
`scripts/emails.mjs`). Neue Adressen
ganz normal als `<a href="mailto:…">…</a>` eintragen (gern mit `?subject=…`) und dann:

```bash
npm run emails             # stellt alle mailto:-Links kodiert um und bindet js/mail.js ein
npm run emails -- --pruefen  # ändert nichts, meldet nur Adressen im Klartext
```

Aus `<a href="mailto:x@y.de">x@y.de</a>` wird
`<a href="kontakt" data-mail="…"><span class="mail-text">x (at) y.de</span></a>`. Im Browser
setzt `js/mail.js` daraus wieder den echten Link und die Adresse zusammen; ohne JavaScript führt
der Link zur Kontaktseite. Der Test `emails.test.mjs` schlägt fehl, solange irgendwo noch eine
Adresse im Klartext steht. (Bots, die JavaScript ausführen, finden die Adressen trotzdem – gegen
einfache Scraper hilft es aber zuverlässig.)

### Fotos hinzufügen

1. Original nach `assets/<ordner>/` legen.
2. Eintrag in `scripts/fotos.json` anlegen (`quelle`, `name`, ggf. `verpixeln`).
3. **Jedes erkennbare Gesicht** als Box `[x0, y0, x1, y1]` (relativ, 0–1) unter `verpixeln` eintragen.
4. Kontrollieren und erzeugen:

   ```bash
   npm install                          # einmalig (installiert sharp)
   npm run fotos -- --vorschau <name>   # rote Boxen zur Kontrolle (*.vorschau.jpg, nicht committen)
   npm run fotos -- <name>              # erzeugt img/<name>-800.webp und -1400.webp
   ```

5. Ergebnis in voller Größe ansehen, dann im HTML mit `srcset` einbinden.

Das Skript verkleinert, verpixelt, speichert als WebP und entfernt alle Metadaten (EXIF/GPS).

### Hintergrundvideo

`video/header-720.mp4` (Desktop) und `header-480.mp4` (Handy) sind eine Schleife aus vier
Drohnenszenen mit Überblendungen (~27 s, H.264, ohne Ton):

1. Jubiläums-Pfingstlager 2026 – die „30“
2. Bundeslager 2026 – Landschaft, die Zeltstadt erscheint
3. Bundeslager 2026 – Zeltstadt von oben
4. Bundeslager 2026 – Festtafeln von oben

Schnitt, Zeiten und Überblendungen stehen in `scripts/header-video.sh` (benötigt ffmpeg):

```bash
scripts/header-video.sh
```

Wer Szenen ändert, muss die Umschaltzeiten des Untertitels in `js/hero.js` anpassen und die
neuen Szenen vorher auf erkennbare Gesichter prüfen (siehe CLAUDE.md).

## Veröffentlichen

Jeder Push auf `main` wird von GitHub Pages automatisch veröffentlicht (ca. 1 Minute).

- Domain: `CNAME` → `achterndiek.net`
- DNS (Host Europe): A/AAAA der Hauptdomain auf die GitHub-Pages-IPs, `www` als CNAME auf
  `devfalko.github.io`. **Keinen** Wildcard-Eintrag (`*.achterndiek.net`) anlegen.
- Mail läuft weiter über Host Europe (MX/SPF nicht anfassen).

## SEO

Strategie, Audit-Ergebnisse, bewusste Entscheidungen und Maßnahmenplan: [docs/SEO.md](docs/SEO.md).
Dort steht auch die Checkliste für neue Seiten (Titel, Beschreibung, Canonical, Open Graph, Sitemap).

## Sicherheit

Bedrohungsmodell, Content-Security-Policy, GitHub-Einstellungen, DNS-Sollzustand (DMARC, CAA) und
Checklisten: [docs/SECURITY.md](docs/SECURITY.md). Sicherheitslücken bitte privat über
GitHub melden (Security → Report a vulnerability).

## Rechtliches

- **Impressum:** Anbieterin ist die CPD e.V.; Angaben aus deren Impressum übernommen.
  Bei Änderungen dort hier nachziehen. Sobald der Trägerverein der Landesmark eingetragen ist,
  kann er Anbieter werden.
- **Bildrechte:** Fotos und Drohnenaufnahmen: imperator. Weiterverwendung nur nach Rücksprache.
- **Landesmark-Lied:** Text & Melodie Torsten Sethmann (1998).

## Kontakt

Landesmarkführung: <deichgraf@achterndiek.net>
