#!/usr/bin/env bash
# Rebuilds public/vo/s*.mp3 from the raw takes in scripts/raw/.
# Trims dead air, cleans low end, adds presence, compresses gently and
# normalises every line to the same loudness so the narrator sits clearly
# above the music bed.
set -euo pipefail
cd "$(dirname "$0")/.."

# Leading/trailing silence only: trim the head, reverse, trim the head again
# (the old tail), reverse back. Internal sentence pauses are left untouched.
TRIM="silenceremove=start_periods=1:start_silence=0.08:start_threshold=-45dB"
CHAIN="${TRIM},areverse,${TRIM},areverse,\
afade=t=in:st=0:d=0.02,\
highpass=f=90,\
equalizer=f=250:width_type=o:width=1.2:g=-2,\
equalizer=f=3200:width_type=o:width=1.1:g=2.5,\
acompressor=threshold=-22dB:ratio=3:attack=4:release=90:makeup=3,\
loudnorm=I=-16:TP=-1.5:LRA=7"

for i in $(seq 1 10); do
  ffmpeg -hide_banner -loglevel error -y -i "scripts/raw/s${i}.mp3" \
    -af "$CHAIN" -ar 44100 -ac 1 -c:a libmp3lame -b:a 192k "public/vo/s${i}.mp3"
done
# Record the real clip lengths so the scene timeline uses exact durations.
python3 - <<'PY'
import json, subprocess
p = "scripts/vo_timed.json"
data = json.load(open(p))
for v in data:
    out = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"public/vo/{v['id']}.mp3"]
    ).decode().strip()
    v["dur"] = round(float(out), 3)
json.dump(data, open(p, "w"), indent=1, ensure_ascii=False)
PY
echo "voice lines rebuilt and durations recorded"
