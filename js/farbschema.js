// Hell/Dunkel: folgt dem System. Wer umschaltet, dessen Wahl merkt sich nur dieser Browser
// (localStorage, kein Cookie, nichts wird übertragen). Wählt man wieder das, was das System
// vorgibt, wird der Eintrag gelöscht. Synchron im <head> geladen, damit nichts aufblitzt.
(() => {
  const root = document.documentElement;
  const KEY = "farbschema";
  const system = matchMedia("(prefers-color-scheme: dark)");
  const lies = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
  const vorgabe = () => (system.matches ? "dunkel" : "hell");
  let zeige = () => {};

  const anwenden = () => {
    const wahl = lies();
    root.dataset.farbschema = wahl === "hell" || wahl === "dunkel" ? wahl : vorgabe();
    zeige();
  };
  anwenden();
  system.addEventListener("change", anwenden);
  addEventListener("storage", (e) => { if (e.key === KEY) anwenden(); }); // andere Tabs

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.querySelector(".farbschema");
    if (!btn) return;
    zeige = () => btn.setAttribute("aria-pressed", String(root.dataset.farbschema === "dunkel"));
    btn.addEventListener("click", () => {
      const neu = root.dataset.farbschema === "dunkel" ? "hell" : "dunkel";
      try {
        if (neu === vorgabe()) localStorage.removeItem(KEY);
        else localStorage.setItem(KEY, neu);
      } catch { /* Speicher gesperrt: gilt dann nur für diese Seite */ }
      root.dataset.farbschema = neu;
      zeige();
    });
    btn.hidden = false;
    zeige();
  });
})();
