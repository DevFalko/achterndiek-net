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

  btn.hidden = false;
  btn.addEventListener("click", () => {
    const paused = btn.getAttribute("aria-pressed") === "true";
    if (paused) video.play(); else video.pause();
    btn.setAttribute("aria-pressed", String(!paused));
    btn.setAttribute("aria-label", paused ? "Hintergrundvideo anhalten" : "Hintergrundvideo abspielen");
  });
});
