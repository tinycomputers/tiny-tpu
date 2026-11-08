import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Backdrop} from './components/ui';
import {AppWindow, WIN} from './components/App';
import {Hook, Logo, Meet} from './scenes/Intro';
import {Truth} from './scenes/Truth';
import {Finale} from './scenes/Finale';
import {C, E, FPS, clamp01, ramp, sec} from './theme';
import {CYC, L, LOAD0, S, STREAM0, STREAM_END, TOTAL, VO} from './timeline';

/* Camera keyframes: focus point (screen coords) + zoom, eased between keys. */
type Cam = {s: number; x: number; y: number};
const CAMS: {t: number; cam: Cam}[] = [
  {t: 0, cam: {s: 1, x: 960, y: 480}},
  {t: S(4) - sec(0.15), cam: {s: 1.16, x: 800, y: 480}},
  {t: S(5) - sec(0.1), cam: {s: 1.07, x: 960, y: 480}},
  {t: S(6) + sec(0.2), cam: {s: 1.1, x: 985, y: 480}},
  {t: S(7) - sec(0.2), cam: {s: 1, x: 960, y: 480}},
  {t: S(8) - sec(0.1), cam: {s: 1.18, x: 960, y: 570}},
  {t: S(9) - sec(0.1), cam: {s: 1, x: 960, y: 480}},
];
const TRANS = sec(1.0);

function camAt(f: number): Cam {
  let cur = CAMS[0]!.cam;
  for (let i = 1; i < CAMS.length; i++) {
    const k = CAMS[i]!;
    const a = CAMS[i - 1]!.cam;
    const p = E.inOut(clamp01((f - k.t) / TRANS));
    if (f >= k.t) cur = {s: a.s + (k.cam.s - a.s) * p, x: a.x + (k.cam.x - a.x) * p, y: a.y + (k.cam.y - a.y) * p};
  }
  return cur;
}

/* Effects are normalised to a common peak in scripts/make_sfx.py; this gain sets their place in the mix. */
const SFX_GAIN = 1.5;

const Sfx: React.FC<{at: number; src: string; vol?: number}> = ({at, src, vol = 0.5}) => (
  <Sequence from={Math.max(0, at)} durationInFrames={sec(2)} layout="none">
    <Audio src={staticFile(`audio/${src}.wav`)} volume={Math.min(1, vol * SFX_GAIN)} />
  </Sequence>
);

/** Music sits well under the narrator, ducks further while they speak, fades in and out. */
const musicVolume = (f: number) => {
  let duck = 0;
  for (const v of VO) duck = Math.max(duck, ramp(f, v.start - 6, 10) * (1 - ramp(f, v.start + v.frames, 14)));
  const base = 0.3 - duck * 0.19;
  const fadeIn = ramp(f, 0, sec(1.5), E.out);
  const fadeOut = 1 - ramp(f, TOTAL - sec(2.6), sec(2.6), E.inOut);
  return base * fadeIn * fadeOut;
};

export const Main: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const wIn = ramp(f, S(3) + sec(5.45), 26, E.out);
  const wOut = ramp(f, S(10) - sec(0.15), 18, E.in);
  const dim = ramp(f, S(7) - 6, 14, E.inOut) * (1 - ramp(f, S(8) - 6, 14, E.inOut));
  const winVis = wIn * (1 - wOut);
  const showWindow = f > S(3) + sec(5.3) && f < S(10) + 2;
  const tx = 960 - cam.s * cam.x;
  const ty = 540 - cam.s * cam.y;
  const rise = (1 - wIn) * 120;

  const T_RUN = S(4) + sec(2.95);
  const sfx: {at: number; src: string; vol?: number}[] = [
    {at: sec(2.0) - 3, src: 'hit', vol: 0.45},
    {at: S(2) - 3, src: 'whoosh', vol: 0.3},
    {at: S(2) + sec(3.3) - 2, src: 'hit', vol: 0.45},
    {at: S(3) + 2, src: 'hit', vol: 0.45},
    {at: S(3) + sec(0.3), src: 'chime', vol: 0.25},
    {at: S(3) + sec(5.4) - 4, src: 'whoosh', vol: 0.35},
    {at: T_RUN - 2, src: 'pop', vol: 0.45},
    ...[0, 1, 2, 3].map((k) => ({at: LOAD0 + sec(0.45) * k - 1, src: 'pop', vol: 0.3})),
    {at: STREAM0 - 3, src: 'whoosh', vol: 0.25},
    {at: STREAM_END, src: 'success', vol: 0.4},
    {at: S(7) - sec(1.5), src: 'riser', vol: 0.3},
    {at: S(7) + 2, src: 'hit', vol: 0.45},
    ...[1.9, 3.0, 4.0, 5.0].map((t) => ({at: S(7) + sec(t) - 3, src: 'whoosh', vol: 0.2})),
    ...[0.2, 0.5, 1.05, 1.65, 2.1, 2.55, 3.0].map((t) => ({at: S(8) + sec(t) - 1, src: 'tick', vol: 0.4})),
    ...[0, 1, 2, 3].map((i) => ({at: S(9) + sec(0.55 + i * 0.9) - 1, src: 'pop', vol: 0.3})),
    {at: S(9) + sec(0.1) - 3, src: 'whoosh', vol: 0.25},
    {at: S(10) + 2, src: 'hit', vol: 0.45},
    {at: S(10) + sec(4.2) - 1, src: 'chime', vol: 0.35},
  ];
  for (let n = 0; n < 8; n++) {
    sfx.push({at: S(4) + sec(0.35) + n * 4, src: 'tick', vol: 0.25});
    sfx.push({at: S(4) + sec(1.0) + n * 4, src: 'tick', vol: 0.25});
  }
  for (let s = 4; s <= 10; s++) sfx.push({at: Math.round(STREAM0 + (s - 1 + 0.78) * CYC * FPS) - 1, src: 'tick', vol: 0.35});

  return (
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden', fontVariantLigatures: 'none'}}>
      <Backdrop />

      <Audio src={staticFile('audio/music.wav')} volume={musicVolume} />
      {VO.map((v) => (
        <Sequence key={v.id} from={v.start} durationInFrames={v.frames + 6} layout="none">
          <Audio src={staticFile(`vo/${v.id}.mp3`)} volume={1} />
        </Sequence>
      ))}
      {sfx.map((s, i) => (
        <Sfx key={i} {...s} />
      ))}

      {showWindow && (
        <div
          style={{
            position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '0 0',
            transform: `translate(${tx}px, ${ty + rise}px) scale(${cam.s})`,
          }}
        >
          <div
            style={{
              position: 'absolute', left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h,
              opacity: winVis * (1 - dim), transform: `scale(${(0.94 + wIn * 0.06) * (1 - dim * 0.04)})`,
              transformOrigin: 'center',
            }}
          >
            <AppWindow frame={f} />
          </div>
        </div>
      )}

      {f < S(2) + 2 && <Hook />}
      {f >= S(2) - 2 && f < S(3) + 2 && (
        <Sequence from={S(2)} durationInFrames={L(2) + 2} layout="none">
          <Meet />
        </Sequence>
      )}
      {f >= S(3) - 2 && f < S(4) + 2 && (
        <Sequence from={S(3)} durationInFrames={L(3) + 2} layout="none">
          <Logo />
        </Sequence>
      )}
      <Sequence from={S(7)} durationInFrames={L(7)} layout="none">
        <Truth />
      </Sequence>
      <Sequence from={S(10)} durationInFrames={L(10)} layout="none">
        <Finale />
      </Sequence>
    </AbsoluteFill>
  );
};


