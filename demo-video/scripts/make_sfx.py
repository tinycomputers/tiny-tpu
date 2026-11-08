# Sound-effect kit for the TinyTPU demo. Deterministic (fixed seed), numpy only.
# Every effect is normalised to a known peak so the per-cue volumes in Main.tsx
# stay predictable. Music is produced by make_audio.py and is not touched here.
import wave
import numpy as np

SR = 44100
rng = np.random.default_rng(11)


def t_(n):
    return np.arange(n) / SR


def save(name, x, peak):
    x = x - np.mean(x)
    x = x / np.max(np.abs(x)) * peak
    st = np.stack([x, x], 1)
    with wave.open(f"public/audio/{name}.wav", "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(st, -1, 1) * 32767).astype("<i2").tobytes())


def tv_lp(x, fc):
    """One-pole lowpass with a per-sample cutoff (Hz)."""
    a = 1 - np.exp(-2 * np.pi * fc / SR)
    y = np.zeros_like(x)
    p = 0.0
    for i in range(len(x)):
        p += a[i] * (x[i] - p)
        y[i] = p
    return y


def whoosh(dur, up):
    n = int(dur * SR)
    tt = np.linspace(0, 1, n)
    x = rng.standard_normal(n)
    sweep = tt if up else 1 - tt
    fc = 250 + 6000 * sweep**2
    band = tv_lp(x, fc) - tv_lp(x, fc * 0.2)  # rough band-pass, no rumble
    env = np.sin(np.pi * tt) ** 1.6
    return band * env


def tick():
    n = int(0.045 * SR)
    t = t_(n)
    tone = np.sin(2 * np.pi * 2600 * t) * np.exp(-t / 0.006)
    click = rng.standard_normal(n) * np.exp(-t / 0.0015) * 0.35
    return tone + click


def pop():
    n = int(0.16 * SR)
    t = t_(n)
    f = 380 + 520 * (1 - np.exp(-t / 0.03))
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.05) * (1 - np.exp(-t / 0.002))
    return body + 0.2 * np.sin(2 * ph) * np.exp(-t / 0.02)


def hit():
    n = int(0.8 * SR)
    t = t_(n)
    f = 40 + 90 * np.exp(-t * 18)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.35)
    transient = tv_lp(rng.standard_normal(n), np.full(n, 1800.0)) * np.exp(-t / 0.004)
    return body * 0.9 + transient * 0.25


def riser(d=1.8):
    n = int(d * SR)
    t = t_(n)
    tt = t / d
    f = 180 + 1000 * tt**2.2
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.3 * tt**2
    noise = tv_lp(rng.standard_normal(n), 400 + 6000 * tt**2)
    return tone + noise * tt**1.6 * 0.8


def chime():
    n = int(1.8 * SR)
    t = t_(n)
    parts = [(880, 1.0, 0.9), (1760, 0.5, 0.5), (2640, 0.25, 0.3), (1174.7, 0.35, 0.6)]
    x = np.zeros(n)
    for f, a, dec in parts:
        x += np.sin(2 * np.pi * f * t) * a * np.exp(-t / dec)
    return x * np.minimum(t / 0.002, 1)


def pluck(f, n):
    t = t_(n)
    x = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t) * np.exp(-t / 0.1)
    return x * np.minimum(t / 0.004, 1) * np.exp(-t / 0.3)


def success():
    n = int(1.3 * SR)
    x = np.zeros(n)
    for k, f in enumerate([880.0, 1108.7, 1318.5]):
        s = int(k * 0.09 * SR)
        x[s:] += pluck(f, n - s)
    return x


save("whoosh", whoosh(0.7, True), 0.5)
save("whoosh_down", whoosh(0.6, False), 0.5)
save("pop", pop(), 0.55)
save("tick", tick(), 0.45)
save("hit", hit(), 0.7)
save("riser", riser(), 0.55)
save("chime", chime(), 0.5)
save("success", success(), 0.5)
print("sfx ok")
