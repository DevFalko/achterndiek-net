// Gruppenseite: Filter (Suche + Gau) und interaktive Karte.
// Ohne JavaScript bleiben alle Gruppen sichtbar; Filter und Karte erscheinen nur mit JS.
document.addEventListener("DOMContentLoaded", () => {
  const bar = document.getElementById("filter");
  const input = document.getElementById("q");
  const chips = bar.querySelectorAll(".chip");
  const sections = document.querySelectorAll(".gau");
  const empty = document.getElementById("empty");
  let gau = "";

  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  // ---------- Karte ----------
  // Projektion muss zu img/karte.svg passen (siehe Kommentar dort / Build-Skript).
  const LON0 = 6.55, LAT1 = 54.95, C = 0.59201, K = 351.9066;
  const FULL = { x: 0, y: 0, w: 1000, h: 880 };
  const project = (lat, lon) => ({ x: (lon - LON0) * C * K, y: (LAT1 - lat) * K });
  const box = document.getElementById("karte-box");
  const mapEl = document.getElementById("karte");
  const tip = document.getElementById("map-tip");
  const dots = []; // { el, li, gau, x, y }
  let svg = null, vb = { ...FULL }, anim = 0;

  function setViewBox(v) {
    vb = v;
    svg.setAttribute("viewBox", `${v.x} ${v.y} ${v.w} ${v.h}`);
    // Punkte und Beschriftung behalten beim Zoomen ihre Bildschirmgröße
    const s = v.w / (mapEl.clientWidth || 600);
    dots.forEach((d) => { const c = d.el.querySelector("circle"); c.setAttribute("r", 7 * s); c.setAttribute("stroke-width", 2 * s); });
    svg.querySelectorAll(".labels text").forEach((t) => (t.style.fontSize = `${13 * s}px`));
  }

  function zoomTo(target) {
    cancelAnimationFrame(anim);
    const from = { ...vb }, t0 = performance.now();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step = (t) => {
      const p = reduce ? 1 : Math.min(1, (t - t0) / 500);
      const e = 1 - Math.pow(1 - p, 3);
      setViewBox({
        x: from.x + (target.x - from.x) * e, y: from.y + (target.y - from.y) * e,
        w: from.w + (target.w - from.w) * e, h: from.h + (target.h - from.h) * e,
      });
      if (p < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  function fitDots() {
    const vis = dots.filter((d) => !d.el.hasAttribute("hidden"));
    if (!gau || !vis.length) return zoomTo(FULL);
    const xs = vis.map((d) => d.x), ys = vis.map((d) => d.y);
    let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const pad = 40;
    let w = Math.max(x1 - x0 + pad * 2, 200), h = w * (FULL.h / FULL.w);
    if (y1 - y0 + pad * 2 > h) { h = y1 - y0 + pad * 2; w = h * (FULL.w / FULL.h); }
    zoomTo({ x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - h / 2, w, h });
  }

  function showTip(d) {
    const r = mapEl.getBoundingClientRect();
    const px = ((d.x - vb.x) / vb.w) * r.width, py = ((d.y - vb.y) / vb.h) * r.height;
    const b = document.createElement("b");
    b.textContent = d.li.querySelector("h3").textContent;
    tip.replaceChildren(b, d.li.querySelector(".place")?.textContent || "");
    tip.style.left = `${Math.min(Math.max(px, 90), r.width - 90)}px`;
    tip.style.top = `${py}px`;
    tip.hidden = false;
  }

  async function initMap() {
    try {
      const res = await fetch("img/karte.svg");
      if (!res.ok) return;
      mapEl.insertAdjacentHTML("afterbegin", await res.text());
    } catch { return; }
    svg = mapEl.querySelector("svg");
    const layer = svg.querySelector(".dots");
    const NS = "http://www.w3.org/2000/svg";
    document.querySelectorAll(".group[data-lat]").forEach((li) => {
      const { x, y } = project(+li.dataset.lat, +li.dataset.lon);
      const g = li.closest(".gau").dataset.gau;
      const a = document.createElementNS(NS, "a");
      a.setAttribute("href", "#" + li.id);
      a.setAttribute("class", "dot dot--" + g);
      a.setAttribute("aria-label", `${li.querySelector("h3").textContent}, ${li.querySelector(".place")?.textContent || ""}`);
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", x.toFixed(1)); c.setAttribute("cy", y.toFixed(1));
      a.appendChild(c);
      layer.appendChild(a);
      const d = { el: a, li, gau: g, x, y };
      dots.push(d);
      a.addEventListener("mouseenter", () => showTip(d));
      a.addEventListener("focus", () => showTip(d));
      a.addEventListener("mouseleave", () => (tip.hidden = true));
      a.addEventListener("blur", () => (tip.hidden = true));
      a.addEventListener("click", (e) => {
        e.preventDefault();
        li.scrollIntoView({ behavior: "smooth", block: "center" });
        li.classList.remove("flash"); void li.offsetWidth; li.classList.add("flash");
        history.replaceState(null, "", "#" + li.id);
      });
    });
    box.hidden = false;
    setViewBox(FULL);
    window.addEventListener("resize", () => setViewBox(vb));
    apply();
  }

  // ---------- Filter ----------
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
    if (svg) {
      dots.forEach((d) => d.el.toggleAttribute("hidden", d.li.hidden));
      fitDots();
    }
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
  initMap();
});
