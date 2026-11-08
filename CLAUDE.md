# Regeln für dieses Repository

Website der CPD-Landesmark Achter'n Diek (achterndiek.net) – siehe README.md.

## Bilder und Videos – Persönlichkeitsschutz (verbindlich)

1. **Gesichter verpixeln – immer.** Auf jedem Foto oder Video, das auf die Website kommt,
   werden alle erkennbaren Gesichter verpixelt. Das gilt auch für Personen im Hintergrund,
   im Profil und auf Gruppenfotos. Nur von hinten oder aus großer Höhe (Drohne) aufgenommene
   Personen, deren Gesicht nicht zu sehen ist, müssen nicht verpixelt werden.
2. **Nie Originale veröffentlichen.** Fotos werden ausschließlich über `npm run fotos`
   (`scripts/fotos.mjs`) erzeugt. Jedes Foto braucht einen Eintrag in `scripts/fotos.json`;
   erkennbare Gesichter werden dort unter `verpixeln` eingetragen.
3. **Vor dem Veröffentlichen prüfen:** mit `npm run fotos -- --vorschau <name>` die Boxen
   kontrollieren und das fertige Bild in voller Größe ansehen. Automatische Gesichtserkennung
   ist unzuverlässig – jedes Bild von Hand durchsehen.
4. **Metadaten entfernen.** Das Skript entfernt EXIF/GPS automatisch; Bilder nicht auf
   anderem Weg einbinden.
5. **Bildnachweis:** Fotos von „imperator“ (Fahrtenname) – niemals den bürgerlichen Namen nennen.

## Personenbezogene Daten

- Auf der Website nur **Funktionsadressen** (z. B. `deichgraf@achterndiek.net`, Gau- und
  Stammesadressen), keine Namen, privaten Mailadressen oder Telefonnummern von Mitgliedern.
- Einzige Ausnahme: die gesetzlichen Pflichtangaben im Impressum (Angaben der CPD e.V.).

## Technik

- Statische Seite ohne Build-Schritt; keine externen Dienste (keine Google Fonts, Maps,
  Tracker, CDNs) – Schriften und Karte liegen lokal.
- Originale liegen in `assets/` und gehören **nicht** ins Repo (`.gitignore`).
- Commits mit `user.email = falko@huebtech.de`.
