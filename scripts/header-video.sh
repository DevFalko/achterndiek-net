#!/usr/bin/env bash
# Erzeugt das Hintergrundvideo der Startseite aus den Originalen in assets/.
# Szenen (mit 0,8 s Überblendung):
#   1  Jubiläums-Pfingstlager 2026, die „30“          pfilag30jubi.mp4        10–18 s
#   2  BuLa 2026: Landschaft, Zeltstadt erscheint     bula26/…0248_D.MP4      3–11 s
#   3  BuLa 2026: Zeltstadt von oben, Drehung         bula26/…0229_D.MP4      0–7 s
#   4  BuLa 2026: Festtafeln von oben                 bula26/…0223_D.MP4      7–13 s
#   →  Rückblende auf das erste Bild von Szene 1, damit die Schleife nahtlos ist.
# Szenenwechsel (für js/hero.js): 7,6 s · 14,8 s · 21,0 s · Rückblende ab 26,2 s · Ende 26,76 s
#
# Aufruf: scripts/header-video.sh   (benötigt ffmpeg mit libx264; FFMPEG=… überschreibt den Pfad)
set -euo pipefail
cd "$(dirname "$0")/.."
FFMPEG="${FFMPEG:-ffmpeg}"
A=assets
PF=$A/pfilag30jubi.mp4
B1=$A/bula26/DJI_20260808184711_0248_D.MP4
B2=$A/bula26/DJI_20260808183955_0229_D.MP4
B3=$A/bula26/DJI_20260808183844_0223_D.MP4
X=0.8   # Dauer der Überblendung

render () {  # $1 = Breite, $2 = CRF, $3 = Ausgabedatei
  local W=$1 H=$(( $1 * 9 / 16 / 2 * 2 ))
  local N="scale=${W}:${H}:flags=lanczos,fps=25,format=yuv420p,settb=AVTB,setpts=PTS-STARTPTS"
  "$FFMPEG" -v error -y \
    -ss 10 -t 8   -i "$PF" \
    -ss 3  -t 8   -i "$B1" \
    -ss 0  -t 7   -i "$B2" \
    -ss 7  -t 6   -i "$B3" \
    -ss 10 -t 0.04 -i "$PF" \
    -filter_complex "
      [0:v]$N[a]; [1:v]$N[b]; [2:v]$N[c]; [3:v]$N[d];
      [4:v]$N,tpad=stop_mode=clone:stop_duration=1.5,trim=duration=0.96[e];
      [a][b]xfade=transition=fade:duration=$X:offset=7.2[ab];
      [ab][c]xfade=transition=fade:duration=$X:offset=14.4[abc];
      [abc][d]xfade=transition=fade:duration=$X:offset=20.6[abcd];
      [abcd][e]xfade=transition=fade:duration=$X:offset=25.8,format=yuv420p[out]" \
    -map "[out]" -an -c:v libx264 -preset veryslow -crf "$2" -profile:v high \
    -movflags +faststart -map_metadata -1 "$3"
  echo "$3: $(du -h "$3" | cut -f1)"
}

mkdir -p video
render 1280 32 video/header-720.mp4
render 854  32 video/header-480.mp4
