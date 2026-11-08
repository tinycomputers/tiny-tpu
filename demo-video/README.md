# TinyTPU demo video

The 69-second narrated walkthrough of TinyTPU, built with [Remotion](https://www.remotion.dev). The final cut is committed at [`docs/media/tinytpu-demo.mp4`](../docs/media/tinytpu-demo.mp4).

## Render

```bash
cd demo-video
npm install
npm run studio   # live preview in the browser
npm run render   # writes out/tinytpu-demo.mp4 (1920×1080, 30 fps)
```

## Where every number comes from

The matrix values, partial sums and result on screen are read from a recorded run of the real hardware:

1. `scripts/rtl/tiny_tpu.mjs` and `tiny_tpu.wasm` are the shipped TinyTPU WebAssembly build, compiled from `rtl/` by Verilator and Emscripten.
2. `node scripts/rtl/trace.mjs` runs that WebAssembly on the demo matrices and records every clock cycle into `src/rtl_trace.json`.
3. `python scripts/rtl/verify_numpy.py` checks the recorded result against NumPy: the 16 outputs and the 64 partial sums shown on the PE grid. It fails if any value differs, and writes `src/numpy_golden.json`.
4. `src/sim.ts` only reads those two files and asserts the same facts again when the video loads.

Partial sums are read from the PE psum registers in the trace. Row `m` reaches PE[k][j] at cycle `firstStream + k + j + m`, the diagonal skew.

To regenerate the trace after changing the RTL, run `scripts/rtl/trace.mjs` on a WebAssembly build of that RTL, then `verify_numpy.py`.

## Audio

| Piece | Source | Built by |
|:---|:---|:---|
| Voiceover | `scripts/vo.json` (script), `scripts/raw/` (raw takes) | `scripts/process_vo.sh` trims, EQs, compresses and normalizes each line to −16 LUFS, writes `public/vo/` and `scripts/vo_timed.json` |
| Music bed | generated | `scripts/make_audio.py` (numpy, deterministic) |
| Sound effects | generated | `scripts/make_sfx.py` (numpy, deterministic, normalized to a common peak) |

The raw takes were generated with `edge-tts` using the `en-US-AndrewMultilingualNeural` voice.

## Scene timing

- `src/timeline.ts` sets the scene lengths and derives the voiceover start times from `scripts/vo_timed.json`, so every line lands in its scene.
- `src/Main.tsx` holds the camera path, the audio mix (music ducking under the voice and effect cues), and the scene order.
- The animation runs at a fixed pace of 0.8 s per clock cycle. The recorded trace supplies the values, not the timing.
