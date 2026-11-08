// Gruppenfilter: Suche nach Ort/Name und Auswahl nach Gau.
// Ohne JavaScript bleiben einfach alle Gruppen sichtbar.
document.addEventListener("DOMContentLoaded", () => {
  const bar = document.getElementById("filter");
  const input = document.getElementById("q");
  const chips = bar.querySelectorAll(".chip");
  const sections = document.querySelectorAll(".gau");
  const empty = document.getElementById("empty");
  let gau = "";

  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  function apply() {
    const q = norm(input.value.trim());
    let total = 0;
    sections.forEach((sec) => {
      const gauMatch = !gau || sec.dataset.gau === gau;
      let visible = 0;
      sec.querySelectorAll(".group").forEach((g) => {
        const show = gauMatch && (!q || norm(g.textContent).includes(q));
        g.hidden = !show;
        if (show) visible++;
      });
      sec.hidden = visible === 0;
      total += visible;
    });
    empty.style.display = total ? "none" : "block";
  }

  chips.forEach((chip) =>
    chip.addEventListener("click", () => {
      gau = chip.dataset.gau;
      chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      apply();
    })
  );
  input.addEventListener("input", apply);
  bar.hidden = false;
});
