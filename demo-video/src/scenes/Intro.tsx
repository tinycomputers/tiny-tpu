import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {A, B, GOLDEN} from '../sim';
import {C, E, F, ramp, spr, sec} from '../theme';
import {L} from '../timeline';
import {Pill, Rule, TinyMark} from '../components/ui';

const Kicker: React.FC<{at?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({at = 0, children, style}) => {
  const f = useCurrentFrame();
  const p = ramp(f, at, 16);
  return (
    <div
      style={{
        fontFamily: F.mono, fontSize: 20, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.dim,
        opacity: p, transform: `translateY(${(1 - p) * 10}px)`, ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Headline word that rises out of a clipped line. */
const Word: React.FC<{at: number; italic?: boolean; children: string}> = ({at, italic, children}) => {
  const f = useCurrentFrame();
  const p = spr(f, at);
  return (
    <span style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', paddingBottom: '0.06em', marginRight: '0.22em'}}>
      <span
        style={{
          display: 'inline-block', transform: `translateY(${(1 - p) * 105}%)`,
          fontStyle: italic ? 'italic' : 'normal', color: italic ? C.accent : C.text,
        }}
      >
        {children}
      </span>
    </span>
  );
};

/** Scene 1 — the idea */
export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const out = ramp(f, L(1) - 12, 12, E.in);
  return (
    <AbsoluteFill style={{opacity: 1 - out, justifyContent: 'center', alignItems: 'center'}}>
      <div style={{width: 1500}}>
        <Kicker>01 — The idea</Kicker>
        <div style={{fontFamily: F.serif, fontSize: 150, lineHeight: 1.02, letterSpacing: '-0.015em', color: C.text, marginTop: 30}}>
          <div>
            <Word at={sec(0.3)}>Nearly every</Word>
            <Word at={sec(0.42)}>AI</Word>
            <Word at={sec(0.54)}>model</Word>
          </div>
          <div>
            <Word at={sec(0.9)}>runs</Word>
            <Word at={sec(1.02)}>on</Word>
            <Word at={sec(1.14)} italic>one simple idea.</Word>
          </div>
        </div>
        <div style={{marginTop: 56}}>
          <Rule at={sec(1.9)} width={1500} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Mat: React.FC<{vals: number[][]; at: number; label: string; accent?: boolean; size?: number}> = ({vals, at, label, accent, size = 84}) => {
  const f = useCurrentFrame();
  const n = vals.length;
  const p = ramp(f, at, 16);
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, opacity: p, transform: `translateY(${(1 - p) * 18}px)`}}>
      <div style={{display: 'grid', gridTemplateColumns: `repeat(${n}, ${size}px)`, gap: 10, padding: 18, borderRadius: 16, background: C.surface, border: `1px solid ${C.border}`}}>
        {vals.flat().map((v, i) => {
          const q = ramp(f, at + 4 + i * 2, 14, E.out);
          return (
            <div
              key={i}
              style={{
                width: size, height: size, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: C.surface2, fontFamily: F.mono, fontSize: 32, fontWeight: 500,
                color: accent ? C.accent : C.text, opacity: q, transform: `scale(${0.92 + q * 0.08})`,
              }}
            >
              {v < 0 ? `−${-v}` : v}
            </div>
          );
        })}
      </div>
      <div style={{fontFamily: F.mono, fontSize: 20, letterSpacing: '0.16em', color: accent ? C.accent : C.mute}}>{label}</div>
    </div>
  );
};

/** Scene 2 — matrix multiplication, then the chip */
export const Meet: React.FC = () => {
  const f = useCurrentFrame();
  const pivot = sec(3.3);
  const eqOut = ramp(f, pivot - 8, 14, E.in);
  const chip = ramp(f, pivot + 2, 24, E.out);
  const pins = (): React.ReactNode =>
    Array.from({length: 4}).map((_, i) =>
      (['top', 'bottom', 'left', 'right'] as const).map((side) => {
        const horiz = side === 'top' || side === 'bottom';
        const pos = 82 + i * 72;
        return (
          <div
            key={`${side}${i}`}
            style={{
              position: 'absolute', background: C.mute, borderRadius: 2, width: horiz ? 10 : 30, height: horiz ? 30 : 10,
              ...(horiz ? {left: pos, [side]: -30} : {top: pos, [side]: -30}),
            }}
          />
        );
      }),
    );
  return (
    <AbsoluteFill style={{opacity: ramp(f, 0, 6) * (1 - ramp(f, L(2) - 10, 10, E.in))}}>
      <div style={{position: 'absolute', top: 120, width: '100%', textAlign: 'center'}}>
        <Kicker style={{opacity: 1 - eqOut}}>02 — Matrix multiplication</Kicker>
        <div style={{position: 'absolute', left: 0, right: 0, top: 0}}>
          <Kicker at={pivot}>02 — The TPU</Kicker>
        </div>
      </div>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: 1 - eqOut, transform: `translateY(${eqOut * -30}px)`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 60, marginTop: 40}}>
          <Mat vals={A.slice(0, 3).map((r) => r.slice(0, 3))} at={sec(0.3)} label="A" />
          <div style={{fontFamily: F.serif, fontSize: 110, color: C.mute, opacity: ramp(f, sec(0.9), 12)}}>×</div>
          <Mat vals={B.slice(0, 3).map((r) => r.slice(0, 3))} at={sec(0.6)} label="B" />
          <div style={{fontFamily: F.serif, fontSize: 110, color: C.mute, opacity: ramp(f, sec(1.3), 12)}}>=</div>
          <Mat vals={GOLDEN.slice(0, 3).map((r) => r.slice(0, 3))} at={sec(1.0)} label="C" accent />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: chip, transform: `scale(${0.96 + chip * 0.04})`}}>
        <div style={{position: 'relative', marginTop: 40}}>
          {pins()}
          <div
            style={{
              width: 380, height: 380, borderRadius: 32, background: C.surface, border: `1.5px solid ${C.text}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <TinyMark size={240} t={f} reveal={chip} />
          </div>
        </div>
      </AbsoluteFill>
      <div
        style={{
          position: 'absolute', bottom: 150, width: '100%', textAlign: 'center', fontFamily: F.serif, fontSize: 66,
          color: C.dim, opacity: chip, transform: `translateY(${(1 - chip) * 14}px)`,
        }}
      >
        Built for exactly one thing: <i style={{color: C.text}}>multiplying matrices, fast.</i>
      </div>
    </AbsoluteFill>
  );
};

/** Scene 3 — logo lockup and spec line (window rises in Main) */
export const Logo: React.FC = () => {
  const f = useCurrentFrame();
  const exit = ramp(f, sec(5.4), 14, E.in);
  const up = ramp(f, sec(5.4), 22, E.inOut);
  const mk = spr(f, sec(0.15));
  const wm = spr(f, sec(0.6));
  const tag = spr(f, sec(1.3));
  const specs = ['4×4 systolic array', 'SystemVerilog RTL', 'Verilator → WebAssembly', 'Runs in your browser'];
  return (
    <AbsoluteFill
      style={{opacity: (1 - exit) * ramp(f, 0, 4), transform: `translateY(${-up * 140}px) scale(${1 - up * 0.12})`, justifyContent: 'center', alignItems: 'center'}}
    >
      <Kicker>03 — Meet TinyTPU</Kicker>
      <div style={{display: 'flex', alignItems: 'center', gap: 64, marginTop: 36}}>
        <TinyMark size={230} t={f} reveal={mk} />
        <div
          style={{
            fontFamily: F.sans, fontWeight: 700, fontSize: 200, letterSpacing: '-0.06em', lineHeight: 0.9, color: C.text,
            opacity: wm, transform: `translateY(${(1 - wm) * 30}px)`,
          }}
        >
          TinyTPU
        </div>
      </div>
      <div
        style={{
          fontFamily: F.serif, fontSize: 80, color: C.dim, marginTop: 40, opacity: tag, transform: `translateY(${(1 - tag) * 18}px)`,
        }}
      >
        A TPU you can <i style={{color: C.text}}>watch</i> run.
      </div>
      <div style={{display: 'flex', gap: 14, marginTop: 64}}>
        {specs.map((t, i) => {
          const p = ramp(f, sec(2.2) + i * 6, 18);
          return (
            <div key={t} style={{opacity: p, transform: `translateY(${(1 - p) * 14}px)`}}>
              <Pill>{t}</Pill>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

