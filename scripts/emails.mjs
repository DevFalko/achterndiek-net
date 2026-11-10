// E-Mail-Adressen vor Scrapern verbergen: macht aus jedem mailto:-Link im HTML einen
// kodierten Link, den erst js/mail.js im Browser wieder zusammensetzt.
//
// Aufruf:  npm run emails                (alle *.html im Hauptordner umstellen, außer AUSNAHMEN)
//          npm run emails -- --pruefen   (nichts ändern, nur Klartext-Adressen melden)
//
// Neue Adresse eintragen: ganz normal <a href="mailto:…">…</a> schreiben, dann `npm run emails`.
// Kodierung: umdrehen + ROT13 – dieselbe Funktion kodiert und dekodiert (siehe js/mail.js).
import { readFile, writeFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Seiten, auf denen Adressen bewusst im Klartext stehen: Im Impressum muss eine E-Mail-Adresse
 *  ohne Umwege erreichbar sein (§ 5 DDG), dort also nicht kodieren. */
export const AUSNAHMEN = ["impressum.html"];

/** Kodiert bzw. dekodiert (beides dasselbe): Zeichen umdrehen, Buchstaben um 13 verschieben. */
export const kodiere = (s) =>
  [...s].reverse().join("").replace(/[a-z]/gi, (c) => {
    const a = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - a + 13) % 26) + a);
  });

/** Für Menschen lesbare Ersatzanzeige ohne JavaScript: name (at) domain. */
export const ersatz = (adresse) => adresse.replace("@", " (at) ");

const ADRESSE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/;
/** Findet Klartext-Adressen und mailto:-Verweise (für --pruefen und die Tests). */
export const KLARTEXT = new RegExp(`mailto:|${ADRESSE.source}`, "g");

const LINK = /<a\b([^>]*?)\shref="mailto:([^"]+)"([^>]*)>([\s\S]*?)<\/a>/g;
const SKRIPT = '<script src="js/mail.js" defer></script>';

/** Stellt alle mailto:-Links einer Seite um und bindet js/mail.js ein. */
export function umstellen(html) {
  let neu = html.replace(LINK, (_, vor, ziel, nach, text) => {
    const mailto = ziel.replace(/&amp;/g, "&");
    const adresse = decodeURIComponent(mailto.split("?")[0]);
    const inhalt = text.trim() === adresse ? `<span class="mail-text">${ersatz(adresse)}</span>` : text;
    return `<a${vor} href="kontakt" data-mail="${kodiere(mailto)}"${nach}>${inhalt}</a>`;
  });
  if (neu.includes("data-mail=") && !neu.includes(SKRIPT)) {
    // Zeilenende übernehmen (unter Windows mit core.autocrlf: \r\n)
    neu = neu.replace(/(<script src="\/?js\/farbschema\.js"><\/script>(\r?\n))([ \t]*)/, `$1$3${SKRIPT}$2$3`);
  }
  return neu;
}

async function main() {
  const pruefen = process.argv.includes("--pruefen");
  const seiten = (await readdir(ROOT)).filter((f) => f.endsWith(".html") && !AUSNAHMEN.includes(f)).sort();
  let funde = 0;
  for (const f of seiten) {
    const alt = await readFile(join(ROOT, f), "utf8");
    if (pruefen) {
      for (const [zeile, inhalt] of alt.split("\n").entries()) {
        for (const m of inhalt.matchAll(KLARTEXT)) {
          console.log(`${f}:${zeile + 1}: ${m[0]}`);
          funde++;
        }
      }
      continue;
    }
    const neu = umstellen(alt);
    if (neu !== alt) {
      await writeFile(join(ROOT, f), neu);
      console.log(`umgestellt: ${f}`);
    }
    const rest = neu.match(KLARTEXT);
    if (rest) {
      console.log(`${f}: noch Klartext übrig (von Hand prüfen): ${[...new Set(rest)].join(", ")}`);
      funde += rest.length;
    }
  }
  if (funde) process.exitCode = 1;
  else if (pruefen) console.log("Keine Adressen im Klartext.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
