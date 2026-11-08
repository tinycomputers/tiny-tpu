import {E, FPS, clamp01, sec} from './theme';
import {CYC, S, STREAM0} from './timeline';

/** Scripted cycle position for scene 8 (play / pause / step / scrub). Returns null outside scene 8. */
const S8 = () => S(8);
type Key = {t: number; x: number; ease?: boolean};
const scene8Keys = (): Key[] => {
  const s = S8();
  const k = (t: number, x: number): Key => ({t: s + sec(t), x});
  return [
    k(0, 10), k(0.2, 10), k(0.5, 0), // reset
    k(0.5, 0), k(1.05, 3), // play
    k(1.05, 3), k(1.65, 3),
    k(1.65, 3), k(1.95, 4), k(2.1, 4), k(2.4, 5), k(2.55, 5), k(2.85, 6), k(3.0, 6), k(3.3, 7), // steps
    k(3.45, 7), k(4.85, 2), // scrub back
    k(5.6, 2),
  ];
};

export function playhead(frame: number): number {
  const s8 = S8();
  if (frame >= s8) {
    const keys = scene8Keys();
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i]!;
      const b = keys[i + 1]!;
      if (frame >= a.t && frame < b.t) {
        if (b.t === a.t) return b.x;
        const p = (frame - a.t) / (b.t - a.t);
        return a.x + (b.x - a.x) * E.inOut(clamp01(p));
      }
    }
    return keys[keys.length - 1]!.x;
  }
  return Math.min(10, Math.max(0, (frame - STREAM0) / (CYC * FPS)));
}

/** Eased cycle position: each cycle slides then holds so numbers can be read. */
export function easedX(x: number): number {
  if (x >= 10) return 10;
  const n = Math.floor(x);
  const f = x - n;
  return n + E.inOut(clamp01(f / 0.78));
}
