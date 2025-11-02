scripts/video/encode-hero.sh
#!/usr/bin/env bash
set -euo pipefail

MASTER="brand-reel-master.mov"
IN="public/assets/video"
OUT="public/assets/video"
POSTER_OUT="public/assets/images"

mkdir -p "$OUT" "$POSTER_OUT"

# --- H.264 MP4 (great fallback) ---
ffmpeg -y -i "$IN/$MASTER" -vf "scale=1920:-2:flags=lanczos" \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart -an \
  "$OUT/brand-reel-1080p.mp4"

ffmpeg -y -i "$IN/$MASTER" -vf "scale=2560:-2:flags=lanczos" \
  -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -movflags +faststart -an \
  "$OUT/brand-reel-1440p.mp4"

ffmpeg -y -i "$IN/$MASTER" -vf "scale=3840:-2:flags=lanczos" \
  -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -movflags +faststart -an \
  "$OUT/brand-reel-2160p.mp4"

# --- VP9 WebM (excellent size/quality) ---
ffmpeg -y -i "$IN/$MASTER" -vf "scale=1920:-2:flags=lanczos" \
  -c:v libvpx-vp9 -b:v 0 -crf 28 -row-mt 1 -tile-columns 2 -tile-rows 1 -g 240 -an \
  "$OUT/brand-reel-1080p.webm"

ffmpeg -y -i "$IN/$MASTER" -vf "scale=2560:-2:flags=lanczos" \
  -c:v libvpx-vp9 -b:v 0 -crf 29 -row-mt 1 -tile-columns 2 -tile-rows 1 -g 240 -an \
  "$OUT/brand-reel-1440p.webm"

ffmpeg -y -i "$IN/$MASTER" -vf "scale=3840:-2:flags=lanczos" \
  -c:v libvpx-vp9 -b:v 0 -crf 30 -row-mt 1 -tile-columns 2 -tile-rows 1 -g 240 -an \
  "$OUT/brand-reel-2160p.webm"

# --- AV1 WebM (libaom-av1: highest quality, slow) ---
# Tweak -cpu-used for speed/quality (0 = slowest/best, 6 = fast/ok). 3–4 is a good balance.
ffmpeg -y -i "$IN/$MASTER" -vf "scale=1920:-2:flags=lanczos" \
  -c:v libaom-av1 -cpu-used 4 -b:v 0 -crf 28 -pix_fmt yuv420p -g 240 -an \
  "$OUT/brand-reel-1080p-av1.webm"

ffmpeg -y -i "$IN/$MASTER" -vf "scale=2560:-2:flags=lanczos" \
  -c:v libaom-av1 -cpu-used 4 -b:v 0 -crf 29 -pix_fmt yuv420p -g 240 -an \
  "$OUT/brand-reel-1440p-av1.webm"

ffmpeg -y -i "$IN/$MASTER" -vf "scale=3840:-2:flags=lanczos" \
  -c:v libaom-av1 -cpu-used 4 -b:v 0 -crf 30 -pix_fmt yuv420p -g 240 -an \
  "$OUT/brand-reel-2160p-av1.webm"

# Poster (fast paint)
ffmpeg -y -i "$IN/$MASTER" -vf "scale=2560:-2:flags=lanczos" -vframes 1 \
  "$POSTER_OUT/abraham-of-london-banner@2560.webp"

echo "✅ Encodes done."
