// Gruppenseite: Filter (Suche + Gau), „In meiner Nähe“, interaktive Karte, Mail-Vorlagen.
// Ohne JavaScript bleiben alle Gruppen und Kontaktlinks sichtbar; Filter und Karte erscheinen nur mit JS.
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
    const ich = svg.querySelector(".ich");
    if (ich) { ich.setAttribute("r", 7 * s); ich.setAttribute("stroke-width", 4 * s); }
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
    if (!gau || !vis.length) return naehePunkte ? fitPoints(naehePunkte) : zoomTo(FULL);
    fitPoints(vis);
  }

  function fitPoints(vis) {
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
      a.addEventListener("click", (e) => { e.preventDefault(); zeigeGruppe(li); });
    });
    box.hidden = false;
    setViewBox(FULL);
    window.addEventListener("resize", () => setViewBox(vb));
    apply();
  }

  // Zur Gruppe springen: Filter lösen, falls sie gerade ausgeblendet ist, dann hinscrollen
  function zeigeGruppe(li) {
    if (li.hidden) {
      gau = ""; input.value = "";
      chips.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.gau === "")));
      apply();
    }
    li.scrollIntoView({ behavior: "smooth", block: "center" });
    li.classList.remove("flash"); void li.offsetWidth; li.classList.add("flash");
    history.replaceState(null, "", "#" + li.id);
  }

  // ---------- In meiner Nähe ----------
  // Der Standort wird nur nach Klick und mit Zustimmung im Browser abgefragt, nur hier im Gerät
  // zur Entfernungsberechnung genutzt und weder gespeichert noch übertragen.
  const naeheBtn = document.getElementById("naehe-btn");
  const naeheBox = document.getElementById("naehe");
  const naeheStatus = document.getElementById("naehe-status");
  const naeheListe = document.getElementById("naehe-liste");
  const WEIT_KM = 120;
  let naehePunkte = null;

  const km = (lat1, lon1, lat2, lon2) => {
    const r = Math.PI / 180, dLat = (lat2 - lat1) * r, dLon = (lon2 - lon1) * r;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(h));
  };
  const kmText = (d) => (d < 1 ? "unter 1 km" : `ca. ${d < 10 ? d.toFixed(1).replace(".", ",") : Math.round(d)} km`);

  function naeheMeldung(text) {
    naeheListe.replaceChildren();
    naeheStatus.textContent = text;
    naeheBox.hidden = false;
  }

  function naeheZeigen(lat, lon) {
    // Nur Gruppen, die gerade Kinder und Jugendliche aufnehmen (keine reine Älterenarbeit)
    const kandidaten = [...document.querySelectorAll(".group[data-lat]")]
      .filter((li) => !li.querySelector(".note, .type--old"))
      .map((li) => ({ li, d: km(lat, lon, +li.dataset.lat, +li.dataset.lon) }))
      .sort((a, b) => a.d - b.d);
    const top = kandidaten.slice(0, 3);
    if (!top.length || top[0].d > WEIT_KM) {
      naeheMeldung(`Die nächste Gruppe ist rund ${Math.round(top[0]?.d || 0)} km entfernt. Schreib uns gern – vielleicht gibt es etwas in deiner Nähe, oder wir helfen beim Gründen.`);
      naehePunkte = null;
      return;
    }
    naeheStatus.textContent = "Die drei nächsten Kinder- und Jugendgruppen (Luftlinie):";
    naeheListe.replaceChildren(...top.map(({ li, d }) => {
      const a = document.createElement("a");
      a.href = "#" + li.id;
      const b = document.createElement("b");
      b.textContent = `${li.querySelector(".type").textContent} ${li.querySelector("h3").textContent}`;
      const k = document.createElement("span");
      k.className = "km"; k.textContent = kmText(d);
      const s = document.createElement("small");
      s.textContent = li.querySelector(".place")?.textContent || "";
      a.append(b, k, s);
      a.addEventListener("click", (e) => { e.preventDefault(); zeigeGruppe(li); });
      const item = document.createElement("li");
      item.append(a);
      return item;
    }));
    naeheBox.hidden = false;
    // Karte: eigenen Standort markieren und auf ihn und die drei Gruppen zoomen
    if (svg) {
      const p = project(lat, lon);
      let ich = svg.querySelector(".ich");
      if (!ich) {
        ich = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        ich.setAttribute("class", "ich");
        svg.querySelector(".dots").before(ich);
      }
      ich.setAttribute("cx", p.x.toFixed(1)); ich.setAttribute("cy", p.y.toFixed(1));
      naehePunkte = [p, ...top.map(({ li }) => dots.find((d) => d.li === li)).filter(Boolean)];
      if (!gau) fitPoints(naehePunkte);
      setViewBox(vb);
    }
  }

  if (naeheBtn && window.isSecureContext && "geolocation" in navigator) {
    naeheBtn.addEventListener("click", () => {
      naeheBtn.setAttribute("aria-busy", "true");
      naeheMeldung("Standort wird ermittelt …");
      naeheBox.focus({ preventScroll: true });
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          naeheBtn.removeAttribute("aria-busy");
          naeheZeigen(pos.coords.latitude, pos.coords.longitude);
          naeheBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
        },
        (err) => {
          naeheBtn.removeAttribute("aria-busy");
          naeheMeldung(err.code === err.PERMISSION_DENIED
            ? "Standort nicht freigegeben – kein Problem: Gib einfach deinen Ort ins Suchfeld ein oder schau auf die Karte."
            : "Standort konnte nicht ermittelt werden. Gib einfach deinen Ort ins Suchfeld ein oder schau auf die Karte.");
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
      );
    });
    naeheBtn.hidden = false;
  }

  // ---------- Mail-Vorlagen ----------
  // Mail-Links an Gruppen (und an den Gau für eine Gruppe) öffnen mit Betreff und kurzer Vorlage.
  document.querySelectorAll('.group a[href^="mailto:"]').forEach((a) => {
    const li = a.closest(".group");
    const name = `${li.querySelector(".type").textContent} ${li.querySelector("h3").textContent}`;
    const ort = li.querySelector(".place")?.textContent || "";
    const jung = !li.querySelector(".note, .type--old");
    const text = [
      "Hallo,", "",
      `ich interessiere mich für ${name}${ort ? ` (${ort})` : ""}.`,
      jung ? "Wann und wo trefft ihr euch, und kann man einfach mal zum Reinschnuppern vorbeikommen?" : "Wie kann ich Kontakt aufnehmen bzw. mal dazukommen?",
      ...(jung ? ["", "Alter des Kindes bzw. mein Alter: "] : []),
      "", "Viele Grüße", "",
    ].join("\r\n");
    const adresse = a.getAttribute("href").split("?")[0];
    a.href = `${adresse}?subject=${encodeURIComponent(`Anfrage: ${name}`)}&body=${encodeURIComponent(text)}`;
  });

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
