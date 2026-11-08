# Mitarbeiten

Kurzanleitung für alle, die an achterndiek.net mitentwickeln. Aufbau des Projekts und häufige
Änderungen (Gruppe eintragen, Fotos, Video, Veröffentlichen) stehen im [README](README.md).

## Die drei wichtigsten Regeln

Die verbindlichen Regeln stehen in [CLAUDE.md](CLAUDE.md). Kurzfassung:

1. **Gesichter verpixeln – immer.** Fotos nur über `npm run fotos`, nie Originale einbinden.
2. **Keine personenbezogenen Daten.** Nur Funktionsadressen (`…@achterndiek.net`, Gau- und
   Stammesadressen), keine Namen oder privaten Kontakte. Fotograf heißt „imperator“.
3. **Keine externen Dienste.** Keine CDNs, Google Fonts, Maps, Tracker oder eingebetteten Inhalte –
   alles liegt lokal. Deshalb braucht die Seite kein Cookie-Banner.

## Voraussetzungen

- Python 3 für die lokale Vorschau
- Node.js ≥ 20.9 und `npm install` – nur für das Bild-Skript (sharp)
- ffmpeg – nur für das Header-Video
- Die Originale in `assets/` sind nicht im Repo. Wer Fotos oder das Video neu erzeugen will,
  bekommt sie über die Landesmarkführung.

## Ablauf

1. Repo forken, **eigenen Branch** anlegen (nicht `main`).
2. Ändern und lokal ansehen (`npm start` → <http://localhost:8000>).
3. Pull Request gegen `main` stellen – **ein Thema pro PR** (z. B. nicht URL-Umbau und
   Paket-Update zusammen). Kurz beschreiben, was und warum.
4. Nach dem Review wird per „Squash and merge“ übernommen. Jeder Merge auf `main` geht
   automatisch live.

## Konventionen

- **Kein Build-Schritt, kein Framework.** Reines HTML/CSS, JavaScript nur wo nötig
  (`js/`), ohne Bibliotheken.
- **Keine Inline-Styles oder -Skripte** (`style="…"`, `<style>`, `onclick=…`): Die
  Content-Security-Policy blockiert sie. Klasse in `css/style.css` bzw. Code in `js/` anlegen.
  Details: [docs/SECURITY.md](docs/SECURITY.md).
- **Kopf und Fuß stehen in jeder Seite.** Navigation oder Footer ändern heißt: alle
  HTML-Dateien anpassen (inkl. `404.html`, `impressum.html`, `datenschutz.html`).
- **Links** so schreiben wie in den bestehenden Seiten; auf der `404.html` absolut (`/…`),
  weil sie unter beliebigen Pfaden ausgeliefert wird.
- **CSS:** Farben und Abstände über die Variablen in `:root` (`css/style.css`), keine neuen
  Farbwerte direkt im Code. Aufteilung: `style.css` für alle Seiten, `start.css` und
  `gruppen.css` nur für ihre Seite. Ebenen (`@layer basis, bausteine, seiten, hilfen`) statt
  höherer Spezifität; Handy-Regeln (`@media`) direkt beim Baustein. Jede Datei unter 500 Zeilen.
- **Dunkelmodus:** Farben nur über die Variablen in `:root`. Die Dunkel-Palette steht im Block
  `@media (prefers-color-scheme: dark)` in `css/style.css`. Für Marine als Schriftfarbe
  `--navy-text`, für Buttons `--btn-bg` verwenden. Deichlinien: `class="dike"` (Sand) bzw.
  `class="dike dike--navy"`, ohne `fill`-Attribut. Neue Farben im hellen **und** dunklen Modus prüfen.
- **Barrierefreiheit:** Alt-Texte für Bilder, sprechende Linktexte, Bedienung per Tastatur,
  `prefers-reduced-motion` respektieren.
- **Dateien** unter 500 Zeilen halten; Skripte nach `scripts/`, Doku nach `docs/`.
- **Sprache:** Inhalte, Kommentare und Commit-Nachrichten auf Deutsch.
- **Commits:** kurz, mit Bereich vorn, z. B. `Gruppen: Kontaktadresse für Stamm X`.
- **Abhängigkeiten:** möglichst keine neuen. Versionen fest angeben (kein `^`), Updates als
  eigener PR.

## Vor dem Pull Request prüfen

- [ ] `npm test` läuft ohne Fehler (läuft auf GitHub auch automatisch)
- [ ] Alle geänderten Seiten lokal angesehen – auch in Handy-Breite (ca. 375 px)
- [ ] Keine Fehler in der Browser-Konsole
- [ ] Neue Fotos: Vorschau mit `npm run fotos -- --vorschau <name>` kontrolliert, jedes
      Gesicht verpixelt, Ergebnis in voller Größe angesehen
- [ ] Keine Namen, privaten Adressen oder Telefonnummern
- [ ] Keine externen Ressourcen (Schriften, Skripte, Bilder, iframes)
- [ ] Neue oder umbenannte Seite: Checkliste in [docs/SEO.md](docs/SEO.md#6-pflege-checkliste-bei-änderungen)
      (Titel, Beschreibung, Canonical, Open Graph, `sitemap.xml`)
- [ ] README bzw. Doku angepasst, falls sich Abläufe ändern

## Fragen

Landesmarkführung: <deichgraf@achterndiek.net>
