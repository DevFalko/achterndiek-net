// E-Mail-Links zusammensetzen: Im HTML stehen die Adressen nur kodiert (data-mail),
// damit Scraper sie nicht einfach auslesen. Erzeugt werden sie mit `npm run emails`
// (scripts/emails.mjs). Ohne JavaScript führt der Link zur Kontaktseite.
(() => {
  // Umdrehen + ROT13 – kodiert und dekodiert gleichermaßen (wie in scripts/emails.mjs).
  const dekodiere = (s) =>
    [...s].reverse().join("").replace(/[a-z]/gi, (c) => {
      const a = c <= "Z" ? 65 : 97;
      return String.fromCharCode(((c.charCodeAt(0) - a + 13) % 26) + a);
    });

  for (const a of document.querySelectorAll("a[data-mail]")) {
    const ziel = dekodiere(a.dataset.mail);
    a.href = "mailto:" + ziel;
    const text = a.querySelector(".mail-text");
    if (text) text.textContent = decodeURIComponent(ziel.split("?")[0]);
  }
})();
