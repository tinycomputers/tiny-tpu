import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, E, F, W, ramp, spr, sec} from '../theme';
import {L} from '../timeline';
import {TinyMark} from '../components/ui';

export const Finale: React.FC = () => {
  const f = useCurrentFrame();
  const end = L(10);
  const mk = spr(f, sec(0.1));
  const wm = spr(f, sec(0.45));
  const tag = spr(f, sec(1.9));
  const oss = ramp(f, sec(3.5), 20);
  const cta = ramp(f, sec(4.2), 22, E.back);
  const fade = 1 - ramp(f, end - 16, 16, E.in);
  return (
    <AbsoluteFill style={{opacity: fade * ramp(f, 0, 6), justifyContent: 'center', alignItems: 'center'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 52, marginTop: -60}}>
        <TinyMark size={200} t={f} reveal={mk} />
        <div
          style={{
            fontFamily: F.sans, fontWeight: 700, fontSize: 200, letterSpacing: '-0.06em', lineHeight: 0.9, color: C.text,
            opacity: wm, transform: `translateY(${(1 - wm) * 26}px)`,
          }}
        >
          TinyTPU
        </div>
      </div>
      <div style={{fontFamily: F.serif, fontSize: 74, color: C.dim, marginTop: 34, opacity: tag, transform: `translateY(${(1 - tag) * 18}px)`}}>
        A TPU you can <i style={{color: C.text}}>watch</i> run.
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 22, marginTop: 64}}>
        <div
          style={{
            opacity: cta, transform: `scale(${0.96 + cta * 0.04})`, display: 'flex', alignItems: 'center', gap: 16,
            padding: '24px 48px', borderRadius: 14, background: C.text, color: C.onAccent, fontFamily: F.sans, fontWeight: 600,
            fontSize: 42, letterSpacing: '-0.02em',
          }}
        >
          Try it live
          <svg width="36" height="36" viewBox="0 0 40 40">
            <path d="M8 20h24M22 10l10 10-10 10" fill="none" stroke={C.accent} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div
          style={{
            opacity: oss, transform: `translateY(${(1 - oss) * 18}px)`, display: 'flex', alignItems: 'center', gap: 14,
            padding: '22px 36px', borderRadius: 14, border: `1.5px solid ${C.text}`, fontFamily: F.mono, fontSize: 28, color: C.text,
          }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="5" r="2.4" />
            <circle cx="6" cy="19" r="2.4" />
            <circle cx="18" cy="8" r="2.4" />
            <path d="M6 7.4v9.2M18 10.4c0 4-6 3-11.2 6.8" />
          </svg>
          Open source
        </div>
      </div>
      <div style={{position: 'absolute', bottom: 96, width: W, textAlign: 'center', fontFamily: F.mono, fontSize: 26, color: C.mute, opacity: oss, letterSpacing: '0.02em'}}>
        tiny-tpu.vercel.app  ·  github.com/tinycomputers/tiny-tpu
      </div>
    </AbsoluteFill>
  );
};
