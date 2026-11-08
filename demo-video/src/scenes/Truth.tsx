import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, E, F, W, accentA, clamp01, ramp, sec} from '../theme';
import {L} from '../timeline';
import {GOLDEN, RTL_C} from '../sim';

const CODE = [
  'always_ff @(posedge clk) begin',
  '  psum_out <= psum_in + weight_reg * act_in;',
  '  act_out  <= act_in;',
  'end',
];

const Line: React.FC<{text: string}> = ({text}) => {
  const parts = text.split(/(always_ff|posedge|begin|end|<=)/g);
  return (
    <>
      {parts.map((p, i) => {
        const kw = /^(always_ff|posedge|begin|end)$/.test(p);
        const op = p === '<=';
        return (
          <span key={i} style={{color: kw ? C.slate : op ? C.accent : C.text}}>
            {p}
          </span>
        );
      })}
    </>
  );
};

const Card: React.FC<{w: number; at: number; step: string; title: string; sub: string; hero?: boolean; children?: React.ReactNode}> = ({w, at, step, title, sub, hero, children}) => {
  const f = useCurrentFrame();
  const p = ramp(f, at, 20);
  return (
    <div
      style={{
        width: w, height: 250, borderRadius: 18, padding: 26, boxSizing: 'border-box', opacity: p,
        transform: `translateY(${(1 - p) * 30}px)`, background: C.surface,
        border: `${hero ? 1.5 : 1}px solid ${hero ? C.text : C.border2}`,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}
    >
      <div>
        <div style={{fontFamily: F.mono, fontSize: 17, letterSpacing: '0.16em', color: C.mute}}>{step}</div>
        <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 36, letterSpacing: '-0.03em', color: C.text, marginTop: 8}}>{title}</div>
        <div style={{fontFamily: F.mono, fontSize: 18, color: C.mute, marginTop: 6}}>{sub}</div>
      </div>
      {children}
    </div>
  );
};

export const Truth: React.FC = () => {
  const f = useCurrentFrame();
  const end = L(7);
  const vis = ramp(f, 0, 10) * (1 - ramp(f, end - 12, 12, E.in));
  const head = ramp(f, sec(0.15), 22);
  const codeChars = Math.floor(ramp(f, sec(1.9), 40, E.inOut) * CODE.join('\n').length);
  let remaining = codeChars;
  const lines = CODE.map((l) => {
    const take = Math.max(0, Math.min(l.length, remaining));
    remaining -= l.length + 1;
    return l.slice(0, take);
  });
  const vStart = sec(6.7);
  const arrived = (n: number) => f >= vStart + sec(0.25) + n * 3;
  let cnt = 0;
  for (let n = 0; n < 16; n++) if (arrived(n)) cnt++;
  const done = cnt === 16;
  const ver = ramp(f, vStart - 6, 18);
  const check = ramp(f, vStart + sec(0.25) + 16 * 3 + 4, 16, E.back);
  const pulse = (i: number) => (f * 0.022 + i * 0.3) % 1;
  const mat = (vals: number[][], title: string) => (
    <div>
      <div style={{fontFamily: F.mono, fontSize: 17, letterSpacing: '0.14em', color: C.mute, marginBottom: 12}}>{title}</div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 56px)', gap: 7}}>
        {vals.flat().map((v, n) => {
          const on = arrived(n);
          const fresh = on ? 1 - clamp01((f - (vStart + sec(0.25) + n * 3)) / 14) : 0;
          return (
            <div
              key={n}
              style={{
                width: 56, height: 56, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: on ? accentA(0.05 + fresh * 0.14) : C.surface2,
                border: `1px solid ${on ? accentA(0.4 + fresh * 0.6) : C.border}`,
                fontFamily: F.mono, fontSize: 21, fontWeight: 600, color: on ? C.text : C.mute,
              }}
            >
              {on ? (v < 0 ? `−${-v}` : v) : '·'}
            </div>
          );
        })}
      </div>
    </div>
  );
  const gap = 22;
  return (
    <AbsoluteFill style={{opacity: vis}}>
      <div style={{position: 'absolute', top: 110, width: W, textAlign: 'center', opacity: head, transform: `translateY(${(1 - head) * 20}px)`}}>
        <div style={{fontFamily: F.mono, fontSize: 20, letterSpacing: '0.18em', color: C.dim, textTransform: 'uppercase'}}>07 — Nothing is faked</div>
        <div style={{fontFamily: F.serif, fontSize: 104, lineHeight: 1.05, letterSpacing: '-0.015em', color: C.text, marginTop: 14}}>
          The real RTL, <i style={{color: C.accent}}>live</i> in your browser.
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, top: 380, width: W, display: 'flex', justifyContent: 'center', alignItems: 'center', gap}}>
        <Card w={540} at={sec(1.7)} step="01 · RTL" title="pe.sv" sub="rtl/*.sv · synthesizable" hero>
          <div style={{fontFamily: F.mono, fontSize: 17, lineHeight: '26px', whiteSpace: 'pre', color: C.text}}>
            {lines.map((l, i) => (
              <div key={i}>
                <Line text={l} />
              </div>
            ))}
          </div>
        </Card>
        {[
          {s: '02 · COMPILE', t: 'Verilator', sub: 'verilator --cc', note: 'cycle-accurate C++', at: 3.0},
          {s: '03 · WASM', t: 'WebAssembly', sub: 'tiny_tpu.wasm', note: 'no JS matmul', at: 4.0},
          {s: '04 · UI', t: 'Your browser', sub: 'React + SVG', note: 'reads debug bus', at: 5.0},
        ].map((c, i) => (
          <React.Fragment key={c.t}>
            <div style={{width: 54, height: 1, background: C.border2, position: 'relative', opacity: ramp(f, sec(c.at - 0.3), 12)}}>
              <div style={{position: 'absolute', left: `${pulse(i) * 100}%`, top: -4, width: 9, height: 9, borderRadius: 5, background: C.accent}} />
            </div>
            <Card w={296} at={sec(c.at)} step={c.s} title={c.t} sub={c.sub}>
              <div style={{fontFamily: F.mono, fontSize: 18, color: C.dim, display: 'flex', alignItems: 'center', gap: 10}}>
                <span style={{color: C.accent}}>✓</span>
                {c.note}
              </div>
            </Card>
          </React.Fragment>
        ))}
      </div>
      <div style={{position: 'absolute', left: 0, top: 690, width: W, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 80, opacity: ver, transform: `translateY(${(1 - ver) * 26}px)`}}>
        {mat(RTL_C, 'RTL OUTPUT (WASM)')}
        <div style={{fontFamily: F.serif, fontSize: 80, color: C.mute}}>=</div>
        {mat(GOLDEN, 'NUMPY GOLDEN')}
        <div style={{width: 360, padding: '26px 30px', borderRadius: 18, background: C.text, transform: `scale(${done ? 0.97 + check * 0.03 : 1})`}}>
          <div style={{fontFamily: F.mono, fontWeight: 600, fontSize: 60, color: C.onAccent, letterSpacing: '-0.03em'}}>
            {cnt}
            <span style={{color: C.mute}}> / 16</span>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, fontFamily: F.sans, fontWeight: 500, fontSize: 24, color: C.onAccent, marginTop: 6}}>
            {done && (
              <span style={{width: 26, height: 26, borderRadius: 13, background: C.accent, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16}}>✓</span>
            )}
            {done ? 'bit-exact match' : 'checking outputs…'}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
