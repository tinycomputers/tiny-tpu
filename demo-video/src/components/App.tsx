import React from 'react';
import {random} from 'remotion';
import {A, B, GOLDEN, N, partial} from '../sim';
import {easedX, playhead} from '../run';
import {C, E, F, accentA, clamp01, ramp, sec, slateA} from '../theme';
import {LOAD0, S, STREAM0, STREAM_END} from '../timeline';
import {Cursor, TinyMark} from './ui';

/* ───────────────────────── window geometry (local coords) ───────────────────────── */
export const WIN = {w: 1720, h: 820, x: 100, y: 70};
const HEAD = 64;
const FOOT = 88;
const BODY_Y = HEAD;
const BODY_H = WIN.h - HEAD - FOOT; // 668

const CELL = 112;
const PITCH = 132;
const GRID_W = PITCH * 4 - (PITCH - CELL);
const GRID_X = 830 - GRID_W / 2;
const GRID_Y = BODY_Y + 56;
const cellX = (j: number) => GRID_X + j * PITCH;
const cellY = (k: number) => GRID_Y + k * PITCH;

const fsmOf = (frame: number, x: number) => {
  if (frame >= S(8)) return x <= 0.01 ? 'IDLE' : x >= 10 ? 'DONE' : x >= 7 ? 'DRAIN' : 'STREAM';
  if (frame < LOAD0) return 'IDLE';
  if (frame < STREAM0) return 'LOAD_WEIGHTS';
  if (x >= 10) return 'DONE';
  if (x >= 7) return 'DRAIN';
  return 'STREAM';
};

const mono = (size: number, color: string, weight = 500): React.CSSProperties => ({
  fontFamily: F.mono,
  fontSize: size,
  color,
  fontWeight: weight,
  fontVariantNumeric: 'tabular-nums',
});

const fmt = (v: number) => (v < 0 ? `−${Math.abs(v)}` : `${v}`);

/* ───────────────────────── header ───────────────────────── */
const Header: React.FC<{frame: number; x: number; level: number}> = ({frame, x, level}) => {
  const fsm = fsmOf(frame, x);
  const col = fsm === 'IDLE' ? C.mute : fsm === 'LOAD_WEIGHTS' ? C.slate : C.accent;
  const tabs = ['L1  Cell', 'L2  Array', 'L3  Tiling'];
  const cyc = Math.min(10, Math.floor(x + 0.0001));
  return (
    <div
      style={{
        position: 'absolute', left: 0, top: 0, width: WIN.w, height: HEAD,
        borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center',
        padding: '0 28px', justifyContent: 'space-between',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 14, width: 420}}>
        <TinyMark size={32} wave={false} />
        <div style={{fontFamily: F.sans, fontWeight: 650, fontSize: 25, letterSpacing: '-0.03em', color: C.text}}>TinyTPU</div>
        <div style={{...mono(14, C.mute), border: `1px solid ${C.border2}`, borderRadius: 6, padding: '3px 8px'}}>4×4 · int8</div>
      </div>
      <div style={{display: 'flex', gap: 6, padding: 5, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12}}>
        {tabs.map((t, i) => {
          const active = Math.round(level) === i + 1;
          return (
            <div
              key={t}
              style={{
                padding: '8px 20px', borderRadius: 8, fontFamily: F.sans, fontWeight: 560, fontSize: 18,
                color: active ? C.text : C.mute, background: active ? C.surface3 : 'transparent',
                boxShadow: active ? `inset 0 0 0 1px ${C.border2}` : 'none', whiteSpace: 'pre',
              }}
            >
              {active && <span style={{display: 'inline-block', width: 7, height: 7, borderRadius: 4, background: C.accent, marginRight: 10, verticalAlign: 'middle', boxShadow: 'none'}} />}
              {t}
            </div>
          );
        })}
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 12, width: 420, justifyContent: 'flex-end'}}>
        <div style={{...mono(16, C.dim), padding: '8px 14px', border: `1px solid ${C.border}`, borderRadius: 10, background: C.surface}}>
          CYCLE <span style={{color: C.text}}>{String(cyc).padStart(2, '0')}</span>
        </div>
        <div
          style={{
            ...mono(16, fsm === 'IDLE' ? C.dim : '#FAF8F3', 600), padding: '8px 14px', borderRadius: 10, letterSpacing: '0.06em',
            background: fsm === 'IDLE' ? C.surface : fsm === 'LOAD_WEIGHTS' ? C.slate : C.accent,
            border: `1px solid ${col}`, boxShadow: fsm === 'IDLE' ? 'none' : `0 0 22px ${fsm === 'LOAD_WEIGHTS' ? slateA(0.35) : accentA(0.35)}`,
            minWidth: 150, textAlign: 'center',
          }}
        >
          {fsm}
        </div>
      </div>
    </div>
  );
};

/* ───────────────────────── matrix cells ───────────────────────── */
const MCell: React.FC<{v: number; shown: number; size: number; accent?: 'sky' | 'lime' | 'white'; glow?: number; typing?: number}> = ({
  v, shown, size, accent = 'white', glow = 0, typing = 0,
}) => {
  const ac = accent === 'sky' ? C.slate : C.text;
  return (
    <div
      style={{
        width: size, height: size, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: glow > 0 ? `rgba(${accent === 'sky' ? '108,184,255' : '198,255,58'},${0.08 + glow * 0.16})` : C.surface2,
        border: `1.5px solid ${typing > 0 ? C.accent : glow > 0 ? (accent === 'sky' ? slateA(0.3 + glow * 0.5) : accentA(0.3 + glow * 0.5)) : C.border}`,
        boxShadow: typing > 0 ? `0 0 0 3px ${accentA(0.18)}` : 'none',
        ...mono(size * 0.4, shown > 0.5 ? ac : C.mute, 560),
        opacity: shown > 0.5 ? 1 : 0.9,
      }}
    >
      {shown > 0.5 ? fmt(v) : '·'}
    </div>
  );
};

const Panel: React.FC<{x: number; w: number; children: React.ReactNode; style?: React.CSSProperties}> = ({x, w, children, style}) => (
  <div style={{position: 'absolute', left: x, top: BODY_Y, width: w, height: BODY_H, ...style}}>{children}</div>
);

const Label: React.FC<{children: React.ReactNode; color?: string; style?: React.CSSProperties}> = ({children, color = C.mute, style}) => (
  <div style={{...mono(15, color, 500), letterSpacing: '0.12em', textTransform: 'uppercase', ...style}}>{children}</div>
);

/* ───────────────────────── left panel: inputs ───────────────────────── */
const T_RUN = () => S(4) + sec(2.95);
const LeftPanel: React.FC<{frame: number; xe: number}> = ({frame, xe}) => {
  const cs = 50;
  const gap = 6;
  const pad = (380 - (cs * 4 + gap * 3)) / 2;
  const runP = ramp(frame, T_RUN(), 8);
  const running = frame >= T_RUN() + 4;
  const done = frame >= STREAM_END;
  const click = ramp(frame, T_RUN(), 14, E.out);
  const mat = (name: 'A' | 'B', top: number, startF: number) => (
    <>
      <Label style={{position: 'absolute', left: pad, top}}>
        Matrix {name} <span style={{color: C.mute, opacity: 0.8}}>· int8</span>
      </Label>
      <div style={{position: 'absolute', left: pad, top: top + 32, display: 'grid', gridTemplateColumns: `repeat(4, ${cs}px)`, gap}}>
        {Array.from({length: 16}).map((_, n) => {
          const i = Math.floor(n / 4);
          const j = n % 4;
          const at = startF + n * 2;
          const shown = frame >= at ? 1 : 0;
          const typing = frame >= at && frame < at + 7 ? 1 : 0;
          let glow = 0;
          if (name === 'A') {
            // A[m][k] launches when its token leaves: col = xe - (m+k) - 1 in [-1.4, -0.4]
            const col = xe - (i + j) - 1;
            glow = frame >= STREAM0 - 5 ? clamp01(1 - Math.abs(col + 0.9) * 1.4) : 0;
          } else {
            const lp = ramp(frame, LOAD0 + i * sec(0.45) + j * 3, 10);
            glow = lp > 0 && lp < 1 ? Math.sin(lp * Math.PI) : 0;
          }
          return <MCell key={n} v={(name === 'A' ? A : B)[i]![j]!} shown={shown} size={cs} accent={name === 'A' ? 'lime' : 'sky'} glow={glow} typing={typing} />;
        })}
      </div>
    </>
  );
  return (
    <Panel x={0} w={380} style={{borderRight: `1px solid ${C.border}`}}>
      {mat('A', 22, S(4) + sec(0.35))}
      {mat('B', 302, S(4) + sec(1.0))}
      <div
        style={{
          position: 'absolute', left: pad, top: 586, width: cs * 4 + gap * 3, height: 56, borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          fontFamily: F.sans, fontWeight: 650, fontSize: 21, letterSpacing: '-0.01em',
          background: running ? C.surface2 : C.text, color: running ? C.dim : C.onAccent,
          border: `1px solid ${running ? C.border2 : C.accent}`,
          boxShadow: running ? 'none' : `0 0 ${24 + Math.sin(frame / 8) * 6}px ${accentA(0.35)}`,
          transform: `scale(${1 - Math.sin(runP * Math.PI) * 0.05})`,
        }}
      >
        {running ? (
          <>
            <span style={{width: 9, height: 9, borderRadius: 5, background: done ? C.accent : C.slate, boxShadow: 'none'}} />
            {done ? 'Complete' : 'Running on RTL'}
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 1.5v13l11-6.5z" fill="currentColor" /></svg>
            Run
          </>
        )}
        {click > 0 && click < 1 && <span style={{position: 'absolute', inset: -2, borderRadius: 16, border: `2px solid ${C.accent}`, opacity: 1 - click, transform: `scale(${1 + click * 0.12})`}} />}
      </div>
    </Panel>
  );
};

/* ───────────────────────── center: the PE grid ───────────────────────── */
const PEGrid: React.FC<{frame: number; xe: number}> = ({frame, xe}) => {
  const ns = Math.round(xe);
  const e = ns - 1;
  const loadedRow = (k: number, j: number) => ramp(frame, LOAD0 + k * sec(0.45) + j * 3, 12, E.back);

  const actAt = (k: number, j: number) => {
    let best = 0;
    for (let m = 0; m < N; m++) {
      const col = xe - (m + k) - 1;
      best = Math.max(best, clamp01(1 - Math.abs(col - j) * 1.5));
    }
    return best;
  };

  // output slots
  const outY = cellY(3) + CELL + 22;
  const outSlot = (j: number) => {
    const m = Math.min(3, Math.floor(xe - j - 4 + 0.0001));
    if (m < 0) return null;
    return {m, fresh: 1 - clamp01(xe - (m + j + 4)) };
  };

  return (
    <>
      <Label style={{position: 'absolute', left: 380, width: 900, top: BODY_Y + 22, textAlign: 'center', fontSize: 14}}>
        weight-stationary · PE[i][j] holds B[i][j]
      </Label>
      <svg width={WIN.w} height={WIN.h} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs>
          <filter id="glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="9" /></filter>
        </defs>
        {/* wires */}
        {Array.from({length: N}).map((_, k) =>
          Array.from({length: N + 1}).map((__, jj) => {
            const j = jj - 1;
            const x0 = j < 0 ? cellX(0) - 70 : cellX(j) + CELL;
            const x1 = cellX(jj < N ? jj : N - 1) + (jj < N ? 0 : CELL + 56);
            const x1b = jj < N ? cellX(jj) : cellX(N - 1) + CELL + 56;
            let lit = 0;
            for (let m = 0; m < N; m++) {
              const col = xe - (m + k) - 1;
              if (col > j - 0.0 && col < jj) lit = Math.max(lit, Math.sin((col - j) * Math.PI));
            }
            const y = cellY(k) + CELL - 24;
            return (
              <g key={`h${k}-${jj}`}>
                <line x1={x0} x2={x1b} y1={y} y2={y} stroke={C.border2} strokeWidth={2} strokeDasharray={j < 0 ? '4 6' : undefined} />
                <line x1={x0} x2={x1b} y1={y} y2={y} stroke={C.text} strokeWidth={2.5} opacity={lit * 0.9} />
              </g>
            );
          }),
        )}
        {Array.from({length: N}).map((_, j) =>
          Array.from({length: N}).map((__, k) => {
            const x = cellX(j) + CELL / 2;
            const y0 = cellY(k) + CELL;
            const y1 = k < N - 1 ? cellY(k + 1) : outY;
            let lit = 0;
            for (let m = 0; m < N; m++) {
              const r = xe - m - j - 1;
              if (r > k && r < k + 1) lit = Math.max(lit, Math.sin((r - k) * Math.PI));
            }
            return (
              <g key={`v${j}-${k}`}>
                <line x1={x} x2={x} y1={y0} y2={y1} stroke={C.border2} strokeWidth={2} />
                <line x1={x} x2={x} y1={y0} y2={y1} stroke={C.accent} strokeWidth={3} opacity={lit} />
              </g>
            );
          }),
        )}
        {/* PEs */}
        {Array.from({length: N}).map((_, k) =>
          Array.from({length: N}).map((__, j) => {
            const x = cellX(j);
            const y = cellY(k);
            const lp = loadedRow(k, j);
            const w = B[k]![j]!;
            const act = actAt(k, j);
            const m = e - k - j;
            const has = m >= 0 && m < N && frame >= STREAM0 - 2;
            const val = has ? partial(m, j, k) : 0;
            const pop = lp > 0 ? 0.86 + 0.14 * Math.min(lp, 1.0) : 0.9;
            const stroke = act > 0.05 ? C.accent : lp > 0.6 ? slateA(0.5) : C.border2;
            return (
              <g key={`pe${k}-${j}`} transform={`translate(${x + CELL / 2} ${y + CELL / 2}) scale(${pop}) translate(${-CELL / 2} ${-CELL / 2})`} opacity={0.35 + 0.65 * Math.min(1, lp + (frame >= LOAD0 ? 0 : 0)) * 1 + (lp >= 1 ? 0 : 0)}>
                <rect width={CELL} height={CELL} rx={18} fill={act > 0.05 ? `rgba(228,87,46,${0.04 + act * 0.07})` : C.surface2} stroke={stroke} strokeWidth={act > 0.05 ? 2 : 1.5} />
                <rect x={10} y={10} width={44} height={26} rx={7} fill={slateA(0.16)} opacity={lp > 0.5 ? 1 : 0} />
                <text x={32} y={29} textAnchor="middle" fontFamily={F.mono} fontSize={17} fontWeight={600} fill={C.slate} opacity={lp > 0.5 ? 1 : 0}>
                  {fmt(w)}
                </text>
                <text x={CELL - 12} y={29} textAnchor="end" fontFamily={F.mono} fontSize={12} fill={C.mute} letterSpacing="0.1em">
                  PE{k}{j}
                </text>
                <text x={CELL / 2} y={66} textAnchor="middle" fontFamily={F.mono} fontSize={34} fontWeight={600} fill={has ? (act > 0.5 ? C.accent : C.text) : C.mute} opacity={has ? 1 : 0.3}>
                  {has ? fmt(val) : '0'}
                </text>
              </g>
            );
          }),
        )}
        {/* output slots */}
        {Array.from({length: N}).map((_, j) => {
          const s = outSlot(j);
          const x = cellX(j) + CELL / 2;
          return (
            <g key={`o${j}`} transform={`translate(${x - 44} ${outY})`}>
              <rect width={88} height={42} rx={11} fill={s ? `rgba(228,87,46,${0.1 + s.fresh * 0.25})` : C.surface} stroke={s ? accentA(0.4 + s.fresh * 0.6) : C.border} strokeWidth={1.5} strokeDasharray={s ? undefined : '4 5'} />
              <text x={44} y={28} textAnchor="middle" fontFamily={F.mono} fontSize={21} fontWeight={600} fill={s ? C.accent : C.mute}>
                {s ? fmt(GOLDEN[s.m]![j]!) : '—'}
              </text>
            </g>
          );
        })}
        {/* activation tokens */}
        {Array.from({length: N}).map((_, k) =>
          Array.from({length: N}).map((__, m) => {
            const col = xe - (m + k) - 1;
            if (col < -1.5 || col > 3.85 || frame < STREAM0 - 40) return null;
            let op = clamp01((col + 1.45) / 0.7);
            if (col > 3.0) op *= clamp01((3.85 - col) / 0.85);
            const x = GRID_X + col * PITCH + CELL / 2;
            const y = cellY(k) + CELL - 24;
            return (
              <g key={`t${k}-${m}`} transform={`translate(${x - 25} ${y - 16})`} opacity={op}>
                <rect width={50} height={32} rx={10} fill={C.text} />
                <text x={25} y={22} textAnchor="middle" fontFamily={F.mono} fontSize={19} fontWeight={700} fill="#FAF8F3">{fmt(A[m]![k]!)}</text>
              </g>
            );
          }),
        )}
        {/* psum packets */}
        {Array.from({length: N}).map((_, j) =>
          Array.from({length: N}).map((__, m) => {
            const r = xe - m - j - 1;
            if (r < 0.02 || r > 3.98) return null;
            const kk = Math.floor(r);
            const fr = r - kk;
            const op = Math.pow(Math.sin(Math.PI * fr), 0.8);
            if (op < 0.04) return null;
            const x = cellX(j) + CELL / 2;
            const y = cellY(kk) + CELL / 2 + fr * PITCH;
            return (
              <g key={`p${j}-${m}`} transform={`translate(${x - 32} ${y - 16})`} opacity={op}>
                <rect width={64} height={32} rx={10} fill={C.accent} />
                <text x={32} y={22} textAnchor="middle" fontFamily={F.mono} fontSize={19} fontWeight={700} fill="#FAF8F3">{fmt(partial(m, j, kk))}</text>
              </g>
            );
          }),
        )}
      </svg>
      <Label style={{position: 'absolute', left: GRID_X - 4, top: outY + 50, fontSize: 13}}>↓ C emerges from the bottom edge</Label>
      <Label style={{position: 'absolute', left: cellX(0) - 150, top: cellY(0) - 30, fontSize: 13, color: C.dim}}>A streams →</Label>
    </>
  );
};

/* ───────────────────────── right panel: results ───────────────────────── */
const macsFired = (ns: number) => {
  let total = 0;
  for (let s = 1; s <= ns; s++)
    for (let k = 0; k < N; k++)
      for (let j = 0; j < N; j++) {
        const m = s - 1 - k - j;
        if (m >= 0 && m < N) total++;
      }
  return total;
};

const RightPanel: React.FC<{frame: number; xe: number; x: number}> = ({frame, xe, x}) => {
  const cs = 62;
  const gap = 8;
  const ns = Math.round(xe);
  const arrived = (i: number, j: number) => xe >= i + j + 4 - 0.001 && frame >= STREAM0;
  let count = 0;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (arrived(i, j)) count++;
  const allDone = count === 16;
  const checkP = ramp(frame, STREAM_END, 12, E.back);
  const rows: [string, string][] = [
    ['MACs fired', `${macsFired(frame >= STREAM0 - 2 || frame >= S(8) ? ns : 0)} / 64`],
    ['Array', '4 × 4 PEs'],
    ['Data', 'int8 → int32'],
  ];
  return (
    <Panel x={1280} w={440} style={{borderLeft: `1px solid ${C.border}`}}>
      <Label style={{position: 'absolute', left: 60, top: 26}}>Result C = A · B</Label>
      <div style={{position: 'absolute', left: 60, top: 58, display: 'grid', gridTemplateColumns: `repeat(4, ${cs}px)`, gap}}>
        {Array.from({length: 16}).map((_, n) => {
          const i = Math.floor(n / 4);
          const j = n % 4;
          const on = arrived(i, j);
          const fresh = on ? 1 - clamp01(xe - (i + j + 4)) : 0;
          return (
            <div
              key={n}
              style={{
                width: cs, height: cs, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: on ? `rgba(228,87,46,${0.07 + fresh * 0.22})` : C.surface,
                border: `1.5px ${on ? 'solid' : 'dashed'} ${on ? accentA(0.35 + fresh * 0.65) : C.border}`,
                ...mono(21, on ? C.accent : C.mute, 600),
                transform: `scale(${1 + fresh * 0.06})`,
              }}
            >
              {on ? fmt(GOLDEN[i]![j]!) : '·'}
            </div>
          );
        })}
      </div>
      {/* golden check */}
      <div style={{position: 'absolute', left: 60, top: 358, width: 4 * cs + 3 * gap, padding: '16px 18px', borderRadius: 14, background: C.surface, border: `1px solid ${allDone && x >= 10 ? accentA(0.5) : C.border}`, display: 'flex', alignItems: 'center', gap: 14}}>
        <div style={{width: 34, height: 34, borderRadius: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', background: allDone && x >= 10 ? C.accent : C.surface3, transform: `scale(${allDone && x >= 10 ? 0.8 + checkP * 0.2 : 1})`}}>
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M3 9.5l4 4 8-9" fill="none" stroke={allDone && x >= 10 ? '#FAF8F3' : C.mute} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div>
          <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 19, color: C.text}}>Matches NumPy</div>
          <div style={mono(14, C.mute)}>{count} / 16 · bit-exact</div>
        </div>
      </div>
      <div style={{position: 'absolute', left: 60, top: 460, width: 4 * cs + 3 * gap}}>
        {rows.map(([a, b]) => (
          <div key={a} style={{display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: `1px solid ${C.border}`}}>
            <span style={mono(16, C.mute)}>{a}</span>
            <span style={mono(16, C.text)}>{b}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
};

/* ───────────────────────── footer: playback controls ───────────────────────── */
const SC_X0 = 372;
const SC_X1 = 1320;
export const ctrlPos = {
  reset: [74, 776], back: [138, 776], play: [212, 776], fwd: [286, 776],
} as const;
const Controls: React.FC<{frame: number; x: number; scrub?: number}> = ({frame, x, scrub}) => {
  const s8 = S(8);
  const press = (t: number) => 1 - clamp01((frame - t) / 9);
  const pr = {
    reset: frame >= s8 ? press(s8 + sec(0.2)) : 0,
    play: frame >= s8 ? Math.max(press(s8 + sec(0.5)), press(s8 + sec(1.05))) : 0,
    fwd: frame >= s8 ? Math.max(press(s8 + sec(1.65)), press(s8 + sec(2.1)), press(s8 + sec(2.55)), press(s8 + sec(3.0))) : 0,
  };
  const playing = (frame >= STREAM0 && frame < STREAM_END) || (frame >= s8 + sec(0.5) && frame < s8 + sec(1.05));
  const pos = scrub ?? x / 10;
  const hx = SC_X0 + pos * (SC_X1 - SC_X0);
  const btn = (cx: number, size: number, glow: number, children: React.ReactNode, hero = false) => (
    <div
      style={{
        position: 'absolute', left: cx - size / 2, top: 776 - size / 2 - (WIN.h - FOOT), width: size, height: size, borderRadius: size * 0.3,
        background: hero ? C.surface3 : C.surface2, border: `1px solid ${glow > 0 ? C.accent : C.border2}`,
        boxShadow: glow > 0 ? `0 0 ${glow * 22}px ${accentA(glow * 0.5)}` : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: glow > 0 ? C.accent : C.text,
        transform: `scale(${1 - glow * 0.08})`,
      }}
    >
      {children}
    </div>
  );
  return (
    <div style={{position: 'absolute', left: 0, top: WIN.h - FOOT, width: WIN.w, height: FOOT, borderTop: `1px solid ${C.border}`, background: '#ECE8DE'}}>
      {btn(74, 46, pr.reset, <svg width="20" height="20" viewBox="0 0 20 20"><path d="M4 10a6 6 0 1 0 2-4.5M4 3v4h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>)}
      {btn(138, 46, 0, <svg width="20" height="20" viewBox="0 0 20 20"><path d="M12 4l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>)}
      {btn(212, 56, pr.play, playing ? <svg width="22" height="22" viewBox="0 0 22 22"><rect x="5" y="4" width="4.5" height="14" rx="1.5" fill="currentColor" /><rect x="12.5" y="4" width="4.5" height="14" rx="1.5" fill="currentColor" /></svg> : <svg width="22" height="22" viewBox="0 0 22 22"><path d="M6 3.5v15l13-7.5z" fill="currentColor" /></svg>, true)}
      {btn(286, 46, pr.fwd, <svg width="20" height="20" viewBox="0 0 20 20"><path d="M8 4l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>)}
      {/* scrubber */}
      <div style={{position: 'absolute', left: SC_X0, top: FOOT / 2 - 3, width: SC_X1 - SC_X0, height: 6, borderRadius: 3, background: C.surface3}} />
      <div style={{position: 'absolute', left: SC_X0, top: FOOT / 2 - 3, width: hx - SC_X0, height: 6, borderRadius: 3, background: C.accent, boxShadow: 'none'}} />
      {Array.from({length: 11}).map((_, i) => (
        <div key={i} style={{position: 'absolute', left: SC_X0 + (i / 10) * (SC_X1 - SC_X0) - 1, top: FOOT / 2 + 14, width: 2, height: 8, background: C.border2}} />
      ))}
      <div style={{position: 'absolute', left: hx - 12, top: FOOT / 2 - 12, width: 24, height: 24, borderRadius: 12, background: C.text, boxShadow: 'none'}} />
      <div style={{position: 'absolute', left: SC_X1 + 36, top: FOOT / 2 - 14, ...mono(16, C.dim)}}>{`CYC ${String(Math.min(10, Math.round(x))).padStart(2, '0')}/10`}</div>
      <div style={{position: 'absolute', right: 28, top: FOOT / 2 - 19, display: 'flex', gap: 6}}>
        {['0.5×', '1×', '2×', '4×'].map((t, i) => (
          <div key={t} style={{...mono(15, i === 1 ? C.text : C.mute, 600), padding: '9px 12px', borderRadius: 9, background: i === 1 ? C.surface3 : 'transparent', border: `1px solid ${i === 1 ? C.border2 : 'transparent'}`}}>{t}</div>
        ))}
      </div>
    </div>
  );
};

/* ───────────────────────── L3: tiling view ───────────────────────── */
const heat = (id: string, i: number) => 0.14 + random(`${id}${i}`) * 0.5;
const Block8: React.FC<{id: string; x: number; y: number; tint: string; hiRow?: number; hiCol?: number; hiC?: string; fill?: (r: number, c: number) => number}> = ({id, x, y, tint, hiRow, hiCol, hiC = C.accent, fill}) => {
  const cell = 28, gap = 4;
  const q = 4 * cell + 3 * gap;
  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({length: 64}).map((_, n) => {
        const r = Math.floor(n / 8), c = n % 8;
        const a = fill ? fill(r, c) : heat(id, n);
        return <rect key={n} x={c * (cell + gap)} y={r * (cell + gap)} width={cell} height={cell} rx={6} fill={tint} opacity={fill ? 0.06 + a * 0.9 : a} />;
      })}
      {hiRow !== undefined && <rect x={-7} y={hiRow * (q + gap) - 7} width={8 * cell + 7 * gap + 14} height={q + 14} rx={12} fill="none" stroke={hiC} strokeWidth={3} />}
      {hiCol !== undefined && <rect x={hiCol * (q + gap) - 7} y={-7} width={q + 14} height={8 * cell + 7 * gap + 14} rx={12} fill="none" stroke={hiC} strokeWidth={3} />}
    </g>
  );
};

const Tiling: React.FC<{frame: number}> = ({frame}) => {
  const s = S(9);
  const t0 = s + sec(0.55);
  const tileDur = sec(0.9);
  const ti = Math.min(3, Math.max(0, Math.floor((frame - t0) / tileDur)));
  const started = frame >= t0;
  const tp = clamp01((frame - t0 - ti * tileDur) / tileDur);
  const tr = ti >> 1, tc = ti & 1;
  const cy = BODY_Y + BODY_H / 2 + 6;
  const top = cy - 126;
  const ax = 225, bx = 567, arrx = 939, cx = 1243;
  const cellQ = 4 * 28 + 3 * 4;
  const doneFill = (r: number, c: number) => {
    const q = (r >> 2) * 2 + (c >> 2);
    const p = frame < t0 ? 0 : q < ti ? 1 : q === ti ? clamp01((tp - 0.35) * 2.2) : 0;
    return p * (0.35 + random(`c${r}${c}`) * 0.65);
  };
  const flash = started ? Math.sin(clamp01(tp) * Math.PI) : 0;
  return (
    <>
      <svg width={WIN.w} height={WIN.h} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <Block8 id="a" x={ax} y={top} tint={C.text} hiRow={started ? tr : undefined} />
        <Block8 id="b" x={bx} y={top} tint={C.slate} hiCol={started ? tc : undefined} hiC={C.slate} />
        <Block8 id="c" x={cx} y={top} tint={C.accent} fill={doneFill} />
        {started && <rect x={cx + tc * (cellQ + 4) - 7} y={top + tr * (cellQ + 4) - 7} width={cellQ + 14} height={cellQ + 14} rx={12} fill="none" stroke={C.accent} strokeWidth={3} opacity={0.4 + flash * 0.6} />}
        <text x={522} y={cy + 14} textAnchor="middle" fontFamily={F.sans} fontSize={44} fontWeight={300} fill={C.mute}>×</text>
        {[879, 1183].map((x) => (
          <g key={x}>
            <line x1={x - 24} x2={x + 22} y1={cy} y2={cy} stroke={C.border2} strokeWidth={3} />
            <path d={`M${x + 14} ${cy - 9}l11 9-11 9`} fill="none" stroke={C.border2} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}
        {/* mini array */}
        <rect x={arrx} y={cy - 92} width={184} height={184} rx={22} fill={C.surface2} stroke={started ? accentA(0.4 + flash * 0.6) : C.border2} strokeWidth={2} />
        {Array.from({length: 16}).map((_, n) => {
          const i = Math.floor(n / 4), j = n % 4;
          const w = started ? clamp01(1 - Math.abs(tp * 7 - (i + j)) * 0.5) : 0;
          return <rect key={n} x={arrx + 17 + j * 41} y={cy - 92 + 17 + i * 41} width={31} height={31} rx={8} fill={w > 0.02 ? `rgba(228,87,46,${0.15 + w * 0.85})` : C.surface3} />;
        })}
      </svg>
      <Label style={{position: 'absolute', left: ax, top: top - 44}}>A · 8×8</Label>
      <Label style={{position: 'absolute', left: bx, top: top - 44}}>B · 8×8</Label>
      <Label style={{position: 'absolute', left: arrx, top: top - 44, color: C.accent}}>4×4 array</Label>
      <Label style={{position: 'absolute', left: cx, top: top - 44}}>C · 8×8</Label>
      <div style={{position: 'absolute', left: 0, width: WIN.w, top: top + 300, textAlign: 'center', fontFamily: F.sans, fontWeight: 560, fontSize: 24, color: C.dim}}>
        <span style={{...mono(22, C.accent, 600), marginRight: 14}}>TILE {started ? ti + 1 : 1} / 4</span>
        one small array · many passes · one big result
      </div>
    </>
  );
};

/* ───────────────────────── the window ───────────────────────── */
export const AppWindow: React.FC<{frame: number}> = ({frame}) => {
  const x = playhead(frame);
  const xe = easedX(x);
  const l3 = ramp(frame, S(9) + sec(0.1), 14, E.inOut);
  const level = l3 > 0.5 ? 3 : 2;
  const tileProg = clamp01((frame - (S(9) + sec(0.55))) / sec(3.6));
  const xl = l3 > 0.5 ? tileProg * 10 : x;
  const l2 = 1 - l3;
  const s8 = S(8);
  // cursor path (window-local)
  const handleX = SC_X0 + (x / 10) * (SC_X1 - SC_X0);
  let cur: {x: number; y: number; click: number; o: number} | null = null;
  const lerp = (a: number, b: number, t: number) => a + (b - a) * E.inOut(clamp01(t));
  if (frame >= S(4) + sec(0.2) && frame < S(4) + sec(3.4)) {
    const f4 = frame - S(4);
    const pts = [
      {t: 0.2, x: 700, y: 330}, {t: 0.45, x: 150, y: 190}, {t: 1.0, x: 220, y: 330}, {t: 1.15, x: 150, y: 470},
      {t: 2.0, x: 240, y: 560}, {t: 2.85, x: 190, y: 640},
    ];
    let p = pts[pts.length - 1]!;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i]!, b = pts[i + 1]!;
      if (f4 >= sec(a.t) && f4 < sec(b.t)) { p = {t: 0, x: lerp(a.x, b.x, (f4 - sec(a.t)) / sec(b.t - a.t)), y: lerp(a.y, b.y, (f4 - sec(a.t)) / sec(b.t - a.t))}; break; }
    }
    cur = {x: p.x + 0, y: p.y + BODY_Y - 0, click: ramp(frame, T_RUN(), 14, E.out), o: ramp(frame, S(4) + sec(0.2), 8) * (1 - ramp(frame, S(4) + sec(3.2), 8, E.in))};
    cur.y = p.y;
  } else if (frame >= s8 - 4 && frame < s8 + sec(5.2)) {
    const f8 = frame - s8;
    const keys = [
      {t: 0, x: 900, y: 620}, {t: 0.2, x: ctrlPos.reset[0] + 10, y: ctrlPos.reset[1] + 8},
      {t: 0.5, x: ctrlPos.play[0] + 10, y: ctrlPos.play[1] + 8}, {t: 1.05, x: ctrlPos.play[0] + 10, y: ctrlPos.play[1] + 8},
      {t: 1.65, x: ctrlPos.fwd[0] + 10, y: ctrlPos.fwd[1] + 8}, {t: 3.0, x: ctrlPos.fwd[0] + 10, y: ctrlPos.fwd[1] + 8},
      {t: 3.45, x: handleX0(7), y: 782}, {t: 4.85, x: handleX0(2), y: 782},
    ];
    let p = keys[keys.length - 1]!;
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i]!, b = keys[i + 1]!;
      if (f8 >= sec(a.t) && f8 < sec(b.t)) { const q = (f8 - sec(a.t)) / Math.max(1, sec(b.t - a.t)); p = {t: 0, x: lerp(a.x, b.x, q), y: lerp(a.y, b.y, q)}; break; }
    }
    const ck = [0.2, 0.5, 1.05, 1.65, 2.1, 2.55, 3.0, 3.45].map((t) => ramp(frame, s8 + sec(t), 14, E.out)).filter((v) => v > 0 && v < 1);
    cur = {x: p.x, y: p.y, click: ck[0] ?? 0, o: ramp(frame, s8, 6) * (1 - ramp(frame, s8 + sec(5.0), 8, E.in))};
  }
  return (
    <div
      style={{
        position: 'absolute', left: 0, top: 0, width: WIN.w, height: WIN.h, borderRadius: 24, overflow: 'hidden',
        background: C.surface, border: `1px solid ${C.border2}`,
        boxShadow: `0 28px 60px ${'rgba(23,21,15,0.14)'}, 0 0 0 1px rgba(23,21,15,0.05)`,
      }}
    >
      <Header frame={frame} x={xl} level={level} />
      <div style={{opacity: l2, position: 'absolute', inset: 0}}>
        <LeftPanel frame={frame} xe={xe} />
        <PEGrid frame={frame} xe={xe} />
        <RightPanel frame={frame} xe={xe} x={x} />
      </div>
      <div style={{opacity: l3, position: 'absolute', inset: 0}}>
        <Tiling frame={frame} />
      </div>
      <Controls frame={frame} x={xl} scrub={l3 > 0 ? tileProg * l3 + (1 - l3) * (x / 10) : undefined} />
      {cur && <Cursor x={cur.x} y={cur.y} opacity={cur.o} click={cur.click} />}
    </div>
  );
};

function handleX0(xc: number) {
  return SC_X0 + (xc / 10) * (SC_X1 - SC_X0);
}
