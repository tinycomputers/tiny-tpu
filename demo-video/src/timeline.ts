import vo from '../scripts/vo_timed.json';
import {FPS, sec} from './theme';

/** Scene lengths in seconds (each ≥ its voice line + lead + tail). */
const LEN_S = [5.0, 6.2, 9.0, 3.9, 8.0, 7.4, 10.2, 6.0, 6.4, 6.9];
export const VO_LEAD = 0.3;

export const SCENE_LEN = LEN_S.map(sec);
export const SCENE_START = SCENE_LEN.reduce<number[]>((acc, l, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1]! + SCENE_LEN[i - 1]!);
  return acc;
}, []);
export const TOTAL = SCENE_LEN.reduce((a, b) => a + b, 0);

/** 1-indexed scene helpers: S(5) is the start frame of scene 5. */
export const S = (n: number) => SCENE_START[n - 1]!;
export const L = (n: number) => SCENE_LEN[n - 1]!;
export const VO = vo.map((v, i) => ({
  id: v.id,
  text: v.text,
  start: S(i + 1) + sec(VO_LEAD),
  frames: Math.ceil(v.dur * FPS),
}));

// Run clock
export const CYC = 0.8; // seconds per clock cycle
export const LOAD0 = S(5) + sec(0.25);
export const STREAM0 = S(5) + sec(3.0);
export const STREAM_END = STREAM0 + sec(CYC * 10);
