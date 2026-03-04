#!/usr/bin/env bash
set -euo pipefail

# Simple helper to produce PNGs from the SVG share cards at 1200x630.
# Usage: ./scripts/make-share-card.sh

SRC_DIR="images"
SVG_MAIN="$SRC_DIR/share-card.svg"
SVG_SMALL="$SRC_DIR/share-card-small.svg"
OUT_MAIN="$SRC_DIR/share-card.png"
OUT_SMALL="$SRC_DIR/share-card-small.png"
WIDTH=1200
HEIGHT=630

if command -v magick >/dev/null 2>&1; then
  echo "Using ImageMagick (magick) to convert SVG -> PNG"
  magick convert "$SVG_MAIN" -resize ${WIDTH}x${HEIGHT} -background none "$OUT_MAIN"
  magick convert "$SVG_SMALL" -resize ${WIDTH}x${HEIGHT} -background none "$OUT_SMALL"
  echo "Generated: $OUT_MAIN and $OUT_SMALL"
  exit 0
fi

if command -v convert >/dev/null 2>&1; then
  echo "Using ImageMagick (convert) to convert SVG -> PNG"
  convert "$SVG_MAIN" -resize ${WIDTH}x${HEIGHT} -background none "$OUT_MAIN"
  convert "$SVG_SMALL" -resize ${WIDTH}x${HEIGHT} -background none "$OUT_SMALL"
  echo "Generated: $OUT_MAIN and $OUT_SMALL"
  exit 0
fi

cat <<'EOF'
ImageMagick is not installed or not found in PATH.
Install it and re-run this script.

macOS (Homebrew):
  brew install imagemagick

Ubuntu/Debian:
  sudo apt update && sudo apt install imagemagick

After install, re-run:
  ./scripts/make-share-card.sh

If you prefer to use Node.js/Sharp, install sharp-cli globally and run manually:
  npm install -g sharp-cli
  sharp-cli images/share-card-small.svg -o images/share-card-small.png -r 1200 630
  sharp-cli images/share-card.svg -o images/share-card.png -r 1200 630

EOF

exit 1
