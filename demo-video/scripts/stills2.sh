#!/bin/bash
cd "$(dirname "$0")/.."
for f in "$@"; do npx remotion still src/index.ts TinyTPUDemo out/chk2/f$(printf %04d $f).png --frame $f 2>&1 | grep -E "rror|✕"; done
echo ALLDONE
