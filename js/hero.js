// Hintergrundvideo der Startseite:
// - startet nicht bei "Bewegung reduzieren" oder aktivem Datensparmodus (dann bleibt das Standbild)
// - lässt sich per Knopf anhalten (Barrierefreiheit)
document.addEventListener("DOMContentLoaded", () => {
  const video = document.querySelector(".hero-video");
  const btn = document.querySelector(".video-toggle");
  if (!video || !btn) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = navigator.connection && navigator.connection.saveData;
  if (reduced || saveData) {
    video.removeAttribute("autoplay");
    video.pause();
    video.querySelectorAll("source").forEach((s) => s.remove());
    video.load(); // zeigt nur noch das Poster
    return;
  }

  // Untertitel passend zur Szene (Zeiten siehe scripts/header-video.sh)
  const caption = document.querySelector(".hero-caption");
  const PFILA = "30 Jahre Achter'n Diek · Jubiläums-Pfingstlager 2026";
  const BULA = "Bundeslager 2026 der CPD";
  const sceneText = (t) => (t < 7.6 || t >= 26.2 ? PFILA : BULA);
  if (caption) {
    video.addEventListener("timeupdate", () => {
      const text = sceneText(video.currentTime);
      if (caption.textContent === text) return;
      caption.classList.add("is-changing");
      setTimeout(() => { caption.textContent = text; caption.classList.remove("is-changing"); }, 250);
    });
  }

  // Knopf zeigt immer den echten Zustand – auch wenn das Handy den Autostart blockiert
  // (z. B. Energiesparmodus): dann steht er auf „abspielen“ und startet das Video per Tipp.
  const zeige = () => {
    btn.setAttribute("aria-pressed", String(video.paused));
    btn.setAttribute("aria-label", video.paused ? "Hintergrundvideo abspielen" : "Hintergrundvideo anhalten");
  };
  video.addEventListener("play", zeige);
  video.addEventListener("pause", zeige);
  btn.hidden = false;
  btn.addEventListener("click", () => (video.paused ? video.play().catch(() => {}) : video.pause()));
  video.play().catch(zeige);
  zeige();
});
