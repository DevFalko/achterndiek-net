# Sicherheit – achterndiek.net

Stand: November 2026. Gilt für die Website, das Repository und die Domain.

## Sicherheitslücke melden

Bitte **nicht** öffentlich als Issue, sondern über GitHub:
**Security → Report a vulnerability** im Repository (private Meldung, nur für Maintainer sichtbar).

## Bedrohungsmodell

Die Website ist statisch (HTML, CSS, wenig JavaScript), läuft auf GitHub Pages und hat
**keine Eingabefelder, keine Konten, keine Cookies, kein Tracking und keine Inhalte Dritter**.
Klassische Web-Angriffe (XSS über Eingaben, SQL-Injection, Session-Diebstahl) haben damit kaum
Angriffsfläche. Die realistischen Risiken sind:

| Risiko | Folge | Gegenmaßnahme |
|---|---|---|
| Übernahme des GitHub- oder Host-Europe-Kontos | Seite oder Domain/Mail in fremder Hand | 2FA/Passkey, Registrar-Sperre (Abschnitt „Konten“) |
| Domain zeigt auf GitHub, Pages aber aus | Fremde könnten die Domain mit eigenem Pages-Projekt belegen | Domain bei GitHub verifiziert ✅ |
| Seite nur über http | Manipulation unterwegs (z. B. öffentliches WLAN), „Nicht sicher“ | HTTPS erzwingen (offen, s. u.) |
| Gefälschte Mails mit @achterndiek.net | Phishing an Eltern/Mitglieder | SPF ✅, DMARC (offen), DKIM (prüfen) |
| Eingeschleuster Code (z. B. über einen PR) | Fremde Skripte auf der Seite | Review, Tests, Content-Security-Policy |
| Veraltete Abhängigkeiten (sharp) | Lücken beim lokalen Bild-Skript | Dependabot, Tests |
| Persönliche Daten in Bildern/Repo | Datenschutz | Verpixeln, Metadaten entfernen, Tests (siehe CLAUDE.md) |

## Maßnahmen auf der Website

### Content-Security-Policy

GitHub Pages erlaubt keine eigenen HTTP-Header. Die Policy steht deshalb als `<meta>` in **jeder**
Seite, direkt nach `<meta charset>` (eine Meta-CSP gilt erst ab ihrer Position):

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-src 'none'">
```

- `default-src 'self'` – Skripte, Styles, Bilder, Schriften, Video und `fetch` nur von der eigenen Domain.
  Damit sind auch **Inline-Skripte, `onclick=…` und `style="…"` blockiert**.
- `object-src 'none'`, `base-uri 'self'`, `form-action 'none'`, `frame-src 'none'` – fallen nicht auf
  `default-src` zurück bzw. werden strenger gesetzt.
- JSON-LD (`<script type="application/ld+json">`) ist kein ausführbares Skript und bleibt erlaubt.
- Per JavaScript gesetzte Styles (`element.style.x = …`) sind erlaubt.

**Regeln für Änderungen** (von `tests/security.test.mjs` geprüft):

- keine `style="…"`-Attribute und `<style>`-Blöcke → Klasse in `css/style.css` anlegen
- keine Inline-Skripte und Event-Handler → Code in `js/` und dort `addEventListener`
- keine Ressourcen von fremden Domains (ohnehin Projektregel)
- `img/karte.svg` bleibt reine Grafik (kein Skript, keine Styles, keine Links), weil sie per
  `insertAdjacentHTML` eingefügt wird
- kein `innerHTML`, `eval`, `new Function`; Texte per `textContent`

**Bewusst nicht gesetzt:** `upgrade-insecure-requests` (hätte die Seite lahmgelegt, solange sie nur
über http läuft; nach HTTPS überflüssig, da alle Verweise relativ sind), `frame-ancestors` und
`report-uri` (wirken in einer Meta-CSP nicht).

### Weitere Punkte

- Bilder und Videos ohne Metadaten (EXIF/GPS) – erzeugt nur über `npm run fotos` bzw.
  `scripts/header-video.sh`, geprüft von `tests/fotos.test.mjs`.
- Externe Links nur zu Websites von Gruppen/Verband; `http://`-Links nur, wo die Zielseite kein
  HTTPS kann (derzeit cp-vilsen.de).
- Das Repository ist öffentlich und GitHub Pages liefert **alle** Dateien aus (auch `docs/`,
  `scripts/`, `CLAUDE.md`). `robots.txt` hält nur Suchmaschinen fern. Deshalb gehört nichts
  Internes ins Repo: keine Zugangsdaten, keine Namen, keine Originalfotos (`assets/` ist ignoriert).

### Bewusst nicht umgesetzt

| Maßnahme | Grund |
|---|---|
| Sicherheits-Header (HSTS, X-Frame-Options …) | Auf GitHub Pages nicht möglich; HSTS setzt GitHub selbst bei erzwungenem HTTPS |
| Schutz gegen Einbetten (Clickjacking) | Ohne Header nicht möglich; Seite hat keine Aktionen, Risiko gering |
| Subresource Integrity | Alle Dateien liegen auf derselben Domain |
| Trusted Types | Würde das Einfügen der Karte brechen; Nutzen gering |
| E-Mail-Adressen verschleiern | Funktionsadressen, Spamfilter reicht; Verschleiern schadet der Barrierefreiheit |
| security.txt | Meldeweg über GitHub; Datei bräuchte regelmäßige Pflege (Ablaufdatum) |

## Repository und GitHub

| Einstellung | Wert |
|---|---|
| Ruleset „main-Schutz“ | Kein Force-Push, kein Löschen von `main` – **ohne Ausnahme**. Im Notfall Ruleset kurz deaktivieren. |
| Ruleset „CI“ | Status-Check `test` muss grün sein; Admin darf umgehen (direkte Commits des Owners, GitHub-UI). Wirkt vor allem beim Mergen von PRs. |
| Actions | Nur Actions von GitHub (`actions/*`); Workflow-Token nur Lesen; Actions dürfen keine PRs freigeben; `persist-credentials: false` |
| Fork-PRs | Workflows von Erst-Beitragenden brauchen Freigabe (GitHub-Standard); kein `pull_request_target` |
| Dependabot | Warnungen und Sicherheits-Updates an; monatliche Update-PRs für npm und Actions (`.github/dependabot.yml`) |
| Secret Scanning | an, inkl. Push-Schutz |
| Private Schwachstellenmeldung | an |
| Kosten | 0 € – Actions und Dependabot sind für öffentliche Repos kostenlos |

## Domain und Mail (Host Europe)

| Eintrag | Sollwert | Stand |
|---|---|---|
| `@` A / AAAA | 4 × GitHub Pages (185.199.108–111.153 / 2606:50c0:8000–8003::153) | ✅ |
| `www` CNAME | `devfalko.github.io` | ✅ |
| Wildcard `*` | **keiner** | ✅ |
| `_github-pages-challenge-devfalko` TXT | Verifizierung der Domain bei GitHub | ✅ |
| `@` TXT (SPF) | `v=spf1 mx include:spf.server-he.de -all` | ✅ |
| `_dmarc` TXT | `v=DMARC1; p=quarantine` (ohne Berichtsadresse → keine Berichtsmails) | offen – erst nach Klärung Microsoft 365 und DKIM |
| DKIM | im Host-Europe-KIS aktivieren, falls angeboten | prüfen |
| `@` CAA | `0 issue "letsencrypt.org"` und `0 issuewild ";"` | nach HTTPS |
| `@` TXT `NETORGFT…onmicrosoft.com` | nur behalten, wenn Microsoft 365 genutzt wird | klären |

Hinweise:

- **DMARC ohne DKIM:** Eigene Mails, die über Mailinglisten oder Weiterleitungen beim Empfänger
  laufen, können im Spam landen. Mails, die direkt über Host Europe verschickt werden, sind nicht
  betroffen. Wer doch Berichte möchte: eigene Adresse (z. B. `dmarc@…`) mit Serverfilter in einen
  Ordner, nie die Hauptadresse.
- **CAA:** GitHub Pages nutzt Let's Encrypt. Kommt später ein anderer Dienst mit eigenem
  Zertifikat für die Domain dazu, muss dessen Aussteller ergänzt werden. Der Mailserver ist nicht
  betroffen (Zertifikat für `*.webpack.hosteurope.de`).
- **TTL:** Vor Änderungen an A/AAAA/CNAME die TTL auf 600 s senken, sonst hängen alte Werte bis zu
  einem Tag in Zwischenspeichern (so geschehen beim Umzug zu GitHub Pages).

### HTTPS aktivieren

1. Warten, bis GitHub die Domain als bereit meldet (Settings → Pages: kein Hinweis auf falsche DNS-Einträge;
   per API `pages/health` → `is_https_eligible: true` für `achterndiek.net`).
2. Kommt kein Zertifikat: Custom Domain einmal entfernen und neu eintragen (löst neue Prüfung aus;
   Seite ist dabei wenige Minuten nicht erreichbar; GitHub committet dabei `CNAME` neu → danach `git pull`).
   Höchstens ein- bis zweimal, mit mindestens einem Tag Abstand.
3. Sobald das Zertifikat da ist: **Enforce HTTPS** anhaken. Danach CAA-Einträge setzen.

## Konten (wichtigster Schutz)

- [ ] GitHub: Passkey oder 2FA, Wiederherstellungscodes sicher aufbewahrt
- [ ] Host Europe (KIS): 2FA aktiviert
- [ ] Domain: Transfer-Sperre (Registrar-Lock) aktiv
- [ ] Kontakt-Mail der Konten **nicht** auf @achterndiek.net (sonst kein Zugang, wenn Domain/Mail ausfällt)
- [ ] Mindestens eine zweite Person kennt den Notfallweg (Landesmarkführung)

## Checkliste bei Änderungen

- [ ] `npm test` grün (prüft CSP, Inline-Code, Links, Verpixelung, Metadaten)
- [ ] neue Seite: CSP-Meta direkt nach `<meta charset>` übernehmen (Vorlage: jede bestehende Seite)
- [ ] keine fremden Ressourcen, keine personenbezogenen Daten
- [ ] neue Workflows: `permissions: contents: read`, nur `actions/*`, kein `pull_request_target`
