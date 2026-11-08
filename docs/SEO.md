# SEO-Strategie achterndiek.net

Stand: 08.11.2026 · Grundlage: technischer Audit aller Seiten, Messung der Ladezeiten,
Google-Search-Central-Dokumentation (Title Links, Canonicals, Snippets).

## 1. Ziel und Zielgruppen

Die Website soll vor allem **Familien helfen, eine Pfadfindergruppe in ihrer Nähe zu finden**.
Daraus ergeben sich die Suchanfragen, für die wir gefunden werden wollen:

| Zielgruppe | typische Suche | Zielseite |
|---|---|---|
| Eltern / Kinder | „Pfadfinder Bremen“, „Pfadfinder Kinder Stuhr“, „Pfadfinder Hamburg Langenhorn“ | `gruppen.html` (später: Stammesseiten) |
| Eltern (informierend) | „Pfadfinder werden“, „ab wann Pfadfinder“, „Pfadfinder Kosten“ | `mitmachen.html` |
| Neugierige | „Was machen Pfadfinder“, „Pfadfinder Klischees“ | `pfadfinden.html` |
| Mitglieder / Ehemalige | „Achter'n Diek“, „Achtern Diek“, „CPD Landesmark“, „Kreuzpfadfinder“ | Startseite, `ueber-uns.html`, `aeltere.html` |
| Gemeinden / Gründer | „Pfadfindergruppe gründen“ | `mitmachen.html#siedeln` |

**Was wir bewusst nicht anstreben:** bundesweite Begriffe wie „Pfadfinder“ allein. Dort ranken
große Verbände und Wikipedia; der Aufwand stünde in keinem Verhältnis zum Nutzen.

## 2. Befunde (Audit 08.11.2026)

### Gut – nichts zu tun
- **Ladezeit:** LCP 0,46–0,65 s mobil (Ziel < 2,5 s), CLS 0 – sehr gut.
- Statische Seiten, keine Tracker, kleine Seitengröße.
- Jede Seite hat genau eine `<h1>`, `lang="de"`, beschreibende Alt-Texte, Bildmaße (kein Layout-Springen).
- `sitemap.xml`, `robots.txt`, eigene 404-Seite, Impressum/Datenschutz auf `noindex`.
- Mobile Darstellung, Barrierefreiheit (Skip-Link, Fokus, reduzierte Bewegung).

### Behoben in diesem Schritt
| Problem | Warum relevant | Maßnahme |
|---|---|---|
| Canonical nur auf der Startseite | GitHub Pages liefert jede Seite unter `/x` **und** `/x.html`, bald auch http + https → Duplikate | Absolutes, selbstreferenzierendes `rel=canonical` (https, `.html`) auf jeder Seite |
| Titel generisch („Gruppen – …“) | Titel ist laut Google die wichtigste Info für den Klick | Beschreibende, eindeutige Titel mit Suchbegriff + Markenname |
| Beschreibungen ohne Orte | Snippet entscheidet über Klick | Orte und Zielgruppe in die Beschreibung |
| Open-Graph nur auf der Startseite | Vorschau beim Teilen (WhatsApp, Signal, Instagram) leer | `og:*` + `twitter:card` auf allen Seiten |
| Kein Seitenname für Google | Google zeigt sonst evtl. „achterndiek.net“ statt Namen | `WebSite`-Daten mit `alternateName` (inkl. „Achtern Diek“) |
| Logo als WebP | Für das Organisationslogo ist PNG am robustesten | `img/logo-512.png` in `Organization` |
| Schreibweise „Achtern Diek“ fehlte | Viele tippen ohne Apostroph (siehe Instagram-Name) | Einmal natürlich im Text auf „Über uns“ erwähnt |
| Gruppen-H1 ohne Suchbegriff | H1 ist ein Signal für das Seitenthema | „Finde deine Pfadfindergruppe.“ |

### Offen – siehe Maßnahmenplan
- **HTTPS fehlt noch** (Zertifikat bei GitHub ausstehend).
- Keine Anmeldung in der Google Search Console / Bing Webmaster Tools.
- Kaum externe Links auf die neue Seite.
- Gruppen ohne eigene Website haben im Netz praktisch keine Präsenz.

## 3. Bewusste Entscheidungen (kritisch geprüft)

| Empfehlung aus SEO-Ratgebern | Entscheidung | Begründung |
|---|---|---|
| URLs ohne `.html` („Clean URLs“) | **Nein** | Kein Ranking-Vorteil; GitHub Pages kann nicht serverseitig umleiten; lokale Vorschau würde brechen. Duplikate löst das Canonical. |
| FAQ-Strukturdaten (`FAQPage`) | **Nein** | Google zeigt FAQ-Rich-Results seit 2023 nur noch für Behörden-/Gesundheitsseiten. Kein Nutzen. |
| Breadcrumb-Strukturdaten | **Nein** | Flache Seitenstruktur, kaum Nutzen. |
| Google Business Profile für die Landesmark | **Nein** | Erfordert einen Ort mit Kundenkontakt; eine Landesmark ohne Geschäftsstelle verstößt sonst gegen die Richtlinien. Für einzelne Stämme mit festem Gruppenraum ggf. prüfen (Absprache mit der Kirchengemeinde). |
| `meta keywords` | **Nein** | Wird von Google seit Jahren ignoriert. |
| Keyword-optimierte Überschriften überall | **Nur sparsam** | Die Tonalität („Schreib uns.“) ist Teil der Marke. Google wertet Titel und Inhalt stärker; Suchbegriffe stehen in Titel, Beschreibung und Fließtext. |
| Event-Strukturdaten | **Später** | Erst sinnvoll, wenn Termine gepflegt werden (neue Vereinssoftware). |
| `llms.txt` / „AI-SEO“-Dateien | **Nein** | Kein belegter Nutzen; klare Inhalte und strukturierte Daten helfen auch KI-Suchen. |
| Video-SEO für das Hintergrundvideo | **Nein** | Dekorativ (`aria-hidden`), kein eigenständiger Inhalt. |
| Eigene Seite pro Stadt („Pfadfinder Bremen“, „Pfadfinder Hamburg“ …) mit gleichem Text | **Nein** | Wäre eine „Doorway Page“ – verstößt gegen Googles Spam-Richtlinien. Stattdessen echte Stammesseiten mit eigenem Inhalt (siehe P2). |

## 4. Maßnahmenplan

### P0 – dringend (diese Woche)
| # | Maßnahme | Wer | Status |
|---|---|---|---|
| 1 | HTTPS aktivieren (GitHub-Cache abwarten, Domain einmal neu eintragen, „Enforce HTTPS“) | Falko | offen |
| 2 | **Google Search Console** einrichten: Domain-Property `achterndiek.net`, Bestätigung per DNS-TXT-Eintrag bei Host Europe; `https://achterndiek.net/sitemap.xml` einreichen | Falko | offen (nach 1) |
| 3 | **Bing Webmaster Tools**: Import aus der Search Console (deckt auch DuckDuckGo/Ecosia ab) | Falko | offen (nach 2) |
| 4 | On-Page-Grundlagen (Canonical, Titel, Beschreibungen, OG, Strukturdaten) | – | erledigt |

### P1 – wichtig (nächste Wochen): Verlinkung aus dem eigenen Umfeld
Externe Links sind für eine neue Domain der größte Hebel – und bei uns leicht zu bekommen,
weil sie aus dem eigenen Verband kommen:

| # | Wo | Was |
|---|---|---|
| 5 | **CPDwiki**, Seite „Landesmark Achter'n Diek“ | Weblink auf `https://achterndiek.net` aktualisieren (steht noch auf http/www) |
| 6 | **CPD-Gruppenkarte (uMap)** | Bei Gruppen ohne eigene Website als „Webseite“ `https://achterndiek.net/gruppen.html` eintragen; Landesmark-Eintrag ergänzen |
| 7 | **c-p-d.info** | Bundesredaktion um Link bei „Gruppen“ bzw. Landesmarken bitten |
| 8 | **Gau-Websites** (cpd-bremen.de, gau-holsatia.de) und **Stammes-Websites** | Link „Landesmark Achter'n Diek“ im Footer |
| 9 | **Kirchengemeinden** der Stämme | Auf deren Gruppen-/Jugendseiten auf die Gruppe bzw. `gruppen.html` verlinken lassen |
| 10 | **Instagram** @achtern_diek_cpd | `achterndiek.net` als Link in der Bio |
| 11 | **Familiennetz Bremen** (familiennetz-bremen.de) und vergleichbare Verzeichnisse in Hamburg / Landkreisen | Einträge für die Gruppen anlegen (dort suchen Eltern aktiv) |

### P2 – mittelfristig: Stammesseiten
Für Gruppen **ohne eigene Website** (z. B. St. Ansgar, Klaus Störtebeker, Leif Eriksson,
Konsul Hackfeld, Weiße Rose, Hermen Scroda, Dietrich Bonhoeffer) je eine eigene Unterseite
`gruppen/<name>.html` – das ist dann die einzige Webpräsenz der Gruppe und rankt für
„Pfadfinder + Ort/Stadtteil“.

Voraussetzung, damit es keine dünnen Einheitsseiten werden – je Seite echter, eigener Inhalt:
- Namensgeber und Geschichte (aus dem CPDwiki)
- Ort, Kirchengemeinde, Gruppenraum (ohne Privatadressen)
- welche Stufen es gibt (Meute, Sippen, Ältere), ggf. Gruppenstundentag
- Kontakt (Funktionsadresse), ggf. Foto (verpixelt, siehe CLAUDE.md)
- Strukturdaten `Organization` mit `parentOrganization` und `address` (nur Ort)

**Benötigt von den Gruppen:** Stufen, ggf. Gruppenstundenzeit, Funktionsadresse, Freigabe.

### P3 – später
| # | Maßnahme | Auslöser |
|---|---|---|
| 12 | Termine mit `Event`-Strukturdaten | Vereinssoftware liefert Kalender-Feed |
| 13 | Berichte von Lagern/Aktionen (z. B. Jubiläums-Pfingstlager) als eigene Seiten | Wenn jemand regelmäßig schreibt – sonst lieber nicht (veraltete News schaden mehr) |
| 14 | Datenschutzfreundliche Statistik (z. B. selbst gehostetes, cookieloses Zählen) | Nur falls Bedarf; die Search Console liefert Suchdaten ohne Tracking |

## 5. Erfolg messen

- **Google Search Console** (ab P0/2): Impressionen und Klicks für „Pfadfinder + Ort“,
  „Achter'n Diek“/„Achtern Diek“; Indexierungsstatus aller Seiten; Core Web Vitals.
- **Stichproben** alle 3 Monate: Suche nach „Pfadfinder Bremen“, „Pfadfinder Hamburg“,
  „Pfadfinder Stuhr“, „Achtern Diek“ – wo stehen wir, wo die Stämme?
- **Anfragen** an `deichgraf@` und die Gau-Adressen: „Wie habt ihr uns gefunden?“

## 6. Pflege-Checkliste bei Änderungen

- [ ] Neue Seite: eindeutiger `<title>` (Suchbegriff vorn, „– Achter'n Diek“ hinten),
      eigene `description`, `rel=canonical` (absolut, https), `og:*`-Block – Vorlage: `gruppen.html`
- [ ] Neue Seite in `sitemap.xml` eintragen, `lastmod` bei größeren Änderungen anpassen
- [ ] Interne Links mit sprechendem Text (nicht „hier klicken“)
- [ ] Bilder nur über `npm run fotos` (WebP, Maße, Alt-Text, Gesichter verpixelt)
- [ ] Keine externen Skripte/Dienste einbinden (Datenschutz **und** Ladezeit)
- [ ] Neue Gruppe: Ort und Kirchengemeinde ausschreiben (das sind die Suchbegriffe der Eltern)

## Quellen
- Google Search Central: [Title Links](https://developers.google.com/search/docs/appearance/title-link),
  [Canonicalization](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls),
  [Snippets/Meta Description](https://developers.google.com/search/docs/appearance/snippet),
  [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
