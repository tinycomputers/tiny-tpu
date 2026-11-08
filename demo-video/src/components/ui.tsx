import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, E, F, H, W, accentA, clamp01, inkA, ramp} from '../theme';

const tc = (f: number) => {
  const s = Math.floor(f / 30);
  const ff = f % 30;
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}.${String(ff).padStart(2, '0')}`;
};

const Corner: React.FC<{x: number; y: number; d: string}> = ({x, y, d}) => (
  <svg width={24} height={24} style={{position: 'absolute', left: x, top: y}}>
    <path d={d} fill="none" stroke={inkA(0.4)} strokeWidth={1.4} />
  </svg>
);

/** Paper base, faint drafting grid, title-block frame with a running timecode. */
export const Backdrop: React.FC = () => {
  const f = useCurrentFrame();
  const label: React.CSSProperties = {
    position: 'absolute', fontFamily: F.mono, fontSize: 15, letterSpacing: '0.16em', color: C.mute, textTransform: 'uppercase',
  };
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${inkA(0.035)} 1px, transparent 1px), linear-gradient(90deg, ${inkA(0.035)} 1px, transparent 1px)`,
          backgroundSize: '96px 96px',
          backgroundPosition: `${-f * 0.12}px ${-f * 0.08}px`,
        }}
      />
      <Corner x={40} y={40} d="M0 10 V0 H10" />
      <Corner x={W - 64} y={40} d="M14 0 H24 V10" />
      <Corner x={40} y={H - 64} d="M0 14 V24 H10" />
      <Corner x={W - 64} y={H - 64} d="M14 24 H24 V14" />
      <div style={{...label, left: 72, top: 46}}>TinyTPU</div>
      <div style={{...label, right: 72, top: 46}}>Demo · Rev 1</div>
      <div style={{...label, left: 72, bottom: 46}}>4×4 · int8 · weight-stationary</div>
      <div style={{...label, right: 72, bottom: 46, fontVariantNumeric: 'tabular-nums'}}>{tc(f)}</div>
    </AbsoluteFill>
  );
};

/** The TinyTPU mark: 4×4 cells with a diagonal wavefront. Only the wave carries the accent. */
export const TinyMark: React.FC<{size: number; t?: number; reveal?: number; wave?: boolean}> = ({size, t = 0, reveal = 1, wave = true}) => {
  const gap = size * 0.07;
  const cell = (size - gap * 3) / 4;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{overflow: 'visible'}}>
      {Array.from({length: 16}).map((_, n) => {
        const i = Math.floor(n / 4);
        const j = n % 4;
        const d = i + j;
        const r = clamp01(reveal * 7.5 - d * 0.55);
        const rr = E.out(r);
        const w = wave ? clamp01(1 - Math.abs(((t * 0.11) % 12) - d) * 0.55) : 0;
        const onDiag = i === j;
        const fill = w > 0.01 ? accentA(0.18 + w * 0.82) : onDiag ? C.text : C.surface2;
        return (
          <rect
            key={n}
            x={j * (cell + gap) + (cell * (1 - rr)) / 2}
            y={i * (cell + gap) + (cell * (1 - rr)) / 2}
            width={cell * rr}
            height={cell * rr}
            rx={cell * 0.2}
            fill={fill}
            stroke={w > 0.01 || onDiag ? 'none' : C.border2}
            strokeWidth={size * 0.01}
            opacity={rr}
          />
        );
      })}
    </svg>
  );
};

/** Quiet spec pill: hairline outline, mono label. */
export const Pill: React.FC<{children: React.ReactNode; hero?: boolean; style?: React.CSSProperties}> = ({children, hero, style}) => (
  <div
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderRadius: 6,
      fontFamily: F.mono, fontSize: 21, fontWeight: 500, letterSpacing: '0.02em',
      color: hero ? C.onAccent : C.dim, background: hero ? C.text : 'transparent',
      border: `1px solid ${hero ? C.text : C.border2}`, ...style,
    }}
  >
    {children}
  </div>
);

/** Pointer for the playback demo; ink arrow, accent click ripple. */
export const Cursor: React.FC<{x: number; y: number; opacity?: number; click?: number}> = ({x, y, opacity = 1, click = 0}) => (
  <div style={{position: 'absolute', left: x, top: y, opacity, pointerEvents: 'none', zIndex: 50}}>
    {click > 0 && click < 1 && (
      <div
        style={{
          position: 'absolute', left: -26, top: -26, width: 52, height: 52, borderRadius: 26,
          border: `2px solid ${C.accent}`, opacity: 1 - click, transform: `scale(${0.3 + click * 1.1})`,
        }}
      />
    )}
    <svg width="34" height="34" viewBox="0 0 24 24" style={{transform: `scale(${click > 0 && click < 0.25 ? 0.9 : 1})`, filter: 'drop-shadow(0 3px 6px rgba(23,21,15,0.25))'}}>
      <path d="M5 3l14 8-6.2 1.7L10 19 5 3z" fill={C.text} stroke={C.surface} strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  </div>
);

/** Hairline that draws itself in; used under headlines. */
export const Rule: React.FC<{at: number; width: number; dur?: number}> = ({at, width, dur = 22}) => {
  const f = useCurrentFrame();
  return <div style={{height: 1, width, background: C.text, transformOrigin: 'left center', transform: `scaleX(${ramp(f, at, dur, E.inOut)})`}} />;
};
