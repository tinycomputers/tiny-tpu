import {Easing, interpolate, spring} from 'remotion';

export const W = 1920;
export const H = 1080;
export const FPS = 30;

/**
 * TinyTPU — editorial engineering palette.
 * Warm paper base, ink text, ONE vermilion accent (active compute only),
 * one slate for weights. No glows, no neon, no grain.
 */
export const C = {
  bg: '#F2EFE7',
  surface: '#FAF8F3',
  surface2: '#ECE8DE',
  surface3: '#E2DDD0',
  border: '#D9D3C4',
  border2: '#B3AC9A',
  text: '#17150F',
  dim: '#5B574D',
  mute: '#8E887B',
  accent: '#E4572E',
  slate: '#2F4A6D',
  onAccent: '#FAF8F3',
} as const;

export const accentA = (a: number) => `rgba(228,87,46,${a})`;
export const slateA = (a: number) => `rgba(47,74,109,${a})`;
export const inkA = (a: number) => `rgba(23,21,15,${a})`;

export const F = {
  sans: '"Geist", "Inter", system-ui, sans-serif',
  mono: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
  serif: '"Instrument Serif", Georgia, serif',
};

export const E = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  back: Easing.bezier(0.34, 1.56, 0.64, 1),
};

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Physically based settle from `start`. Damping is set to critical (no overshoot),
 * so hero elements glide into place and stop softly instead of ramping linearly.
 */
export const spr = (frame: number, start: number, stiffness = 180, damping = 27) =>
  frame < start ? 0 : spring({frame: frame - start, fps: FPS, config: {stiffness, damping, mass: 1}});

/** Eased 0..1 ramp over [start, start+dur] frames. */
export const ramp = (frame: number, start: number, dur: number, ease: (t: number) => number = E.out) =>
  interpolate(frame, [start, start + dur], [0, 1], {
    easing: ease,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

/** Visibility window: eased in, then eased out (exit faster than entrance). */
export const inOut = (frame: number, a: number, b: number, inDur = 14, outDur = 9) =>
  ramp(frame, a, inDur) * (1 - ramp(frame, b - outDur, outDur, E.in));

export const sec = (s: number) => Math.round(s * FPS);
