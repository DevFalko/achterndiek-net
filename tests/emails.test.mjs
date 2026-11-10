// Prüft den Schutz der E-Mail-Adressen: kein Klartext im HTML, js/mail.js setzt die Links korrekt zusammen.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import { ROOT, kodiere, umstellen, KLARTEXT } from "../scripts/emails.mjs";

const lies = (f) => readFileSync(join(ROOT, f), "utf8");
const seiten = readdirSync(ROOT).filter((f) => f.endsWith(".html")).sort();

for (const seite of seiten) {
  test(`${seite}: keine E-Mail-Adressen im Klartext`, () => {
    const s = lies(seite);
    assert.deepEqual(s.match(KLARTEXT) ?? [], [], "mailto:-Links eintragen und `npm run emails` ausführen");
    if (s.includes("data-mail=")) {
      assert.match(s, /<script src="js\/mail\.js" defer><\/script>/, "js/mail.js fehlt");
      const mail = s.indexOf("js/mail.js"), gruppen = s.indexOf("js/gruppen.js");
      if (gruppen > 0) assert.ok(mail < gruppen, "js/mail.js muss vor js/gruppen.js geladen werden");
    }
  });
}

test("Kodierung: zweimal angewendet ergibt wieder das Original", () => {
  const ziel = "deichgraf@achterndiek.net?subject=kreuz%20%26%20quer";
  assert.notEqual(kodiere(ziel), ziel);
  assert.equal(kodiere(kodiere(ziel)), ziel);
});

test("umstellen: Link mit Adresse als Text, Link mit Betreff, mehrfacher Lauf", () => {
  const vorher = [
    '<script src="js/farbschema.js"></script>\r\n  <link rel="stylesheet" href="css/style.css">',
    '<a href="mailto:chauken@achterndiek.net">chauken@achterndiek.net</a>',
    '<a class="btn" href="mailto:deichgraf@achterndiek.net?subject=Siedeln">Wir möchten siedeln</a>',
  ].join("\r\n");
  const nachher = umstellen(vorher);
  assert.deepEqual(nachher.match(KLARTEXT) ?? [], []);
  assert.match(nachher, /<script src="js\/farbschema\.js"><\/script>\r\n {2}<script src="js\/mail\.js" defer><\/script>\r\n/);
  assert.match(nachher, /<a href="kontakt" data-mail="[^"]+"><span class="mail-text">chauken \(at\) achterndiek\.net<\/span><\/a>/);
  assert.match(nachher, /<a class="btn" href="kontakt" data-mail="[^"]+">Wir möchten siedeln<\/a>/);
  assert.equal(umstellen(nachher), nachher, "zweiter Lauf darf nichts ändern");
});

test("js/mail.js setzt mailto:-Link und Anzeige zusammen", () => {
  const span = { textContent: "deichgraf (at) achterndiek.net" };
  const mitText = { dataset: { mail: kodiere("deichgraf@achterndiek.net") }, href: "kontakt", querySelector: () => span };
  const mitBetreff = { dataset: { mail: kodiere("deichgraf@achterndiek.net?subject=Siedeln") }, href: "kontakt", querySelector: () => null };
  const document = { querySelectorAll: () => [mitText, mitBetreff] };
  vm.runInNewContext(lies("js/mail.js"), { document });
  assert.equal(mitText.href, "mailto:deichgraf@achterndiek.net");
  assert.equal(span.textContent, "deichgraf@achterndiek.net");
  assert.equal(mitBetreff.href, "mailto:deichgraf@achterndiek.net?subject=Siedeln");
});
