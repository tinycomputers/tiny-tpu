# Synthesizes a calm electronic music bed + SFX kit. Deterministic, zero downloads.
import numpy as np, wave, json
SR=44100
rng=np.random.default_rng(7)
def save(name,x,stereo=False):
    x=np.clip(x,-1,1)
    if x.ndim==1: x=np.stack([x,x],1)
    with wave.open(f"public/audio/{name}.wav","wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x*32767).astype('<i2').tobytes())
def env(n,a,r,sr=SR):
    t=np.arange(n)/sr
    return np.minimum(t/a,1)*np.exp(-t/r)
def sine(f,n): return np.sin(2*np.pi*f*np.arange(n)/SR)
def lp(x,k):  # simple one-pole lowpass
    y=np.zeros_like(x); a=k
    for i in range(1,len(x)): y[i]=y[i-1]+a*(x[i]-y[i-1])
    return y

# ---- music: A minor, 100 BPM, 66s
BPM=100; beat=60/BPM; dur=66
N=int(dur*SR); m=np.zeros(N)
def note(f): return 440*2**((f-69)/12)
chords=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]]  # Am F C G
bar=beat*4
nbars=int(dur/bar)+1
for b in range(nbars):
    ch=chords[b%4]; t0=int(b*bar*SR); L=int(bar*SR)
    if t0>=N: break
    seg=np.zeros(L)
    for p in ch:
        for det in (-0.004,0,0.004):
            seg+=sine(note(p-12)*(1+det),L)*0.05
    # pad swell
    tt=np.arange(L)/SR
    seg*=np.minimum(tt/0.8,1)*np.minimum((bar-tt)/0.6,1)
    # bass
    bs=sine(note(ch[0]-24),L)*0.22*env(L,0.01,1.4)
    seg+=bs
    end=min(N,t0+L); m[t0:end]+=seg[:end-t0]
    # plucks (8th arpeggio)
    arp=[ch[0]+12,ch[1]+12,ch[2]+12,ch[1]+24,ch[2]+12,ch[1]+12,ch[0]+24,ch[2]+12]
    for k,p in enumerate(arp):
        s=int((b*bar+k*beat/2)*SR); n=int(0.5*SR)
        if s+n>=N: continue
        f=note(p)
        w=(sine(f,n)+0.4*sine(2*f,n)+0.2*sine(3*f,n))*env(n,0.004,0.12)*0.07
        m[s:s+n]+=w
    # soft kick on beats 1 & 3 (from bar 2)
    if b>=1:
        for k in (0,2):
            s=int((b*bar+k*beat)*SR); n=int(0.35*SR)
            if s+n>=N: continue
            tt=np.arange(n)/SR
            f=50+90*np.exp(-tt*28)
            ph=2*np.pi*np.cumsum(f)/SR
            m[s:s+n]+=np.sin(ph)*np.exp(-tt/0.12)*0.28
    # hats
    if b>=2:
        for k in range(8):
            s=int((b*bar+k*beat/2+beat/4)*SR); n=int(0.06*SR)
            if s+n>=N: continue
            nz=rng.standard_normal(n); nz=nz-lp(nz,0.4)
            m[s:s+n]+=nz*np.exp(-np.arange(n)/SR/0.015)*0.025
# global shape: intro build, outro fade
tt=np.arange(N)/SR
m*=np.minimum(tt/2.5,1)*np.minimum((dur-tt)/3.0,1)
# gentle echo
d=int(beat*0.75*SR); e=np.zeros_like(m); e[d:]=m[:-d]*0.28; m=m+e
m=m/np.max(np.abs(m))*0.85
# stereo widen
L=m.copy(); R=np.roll(m,int(0.0009*SR))
save("music",np.stack([L,R],1))

# ---- sfx
def whoosh(dur=0.7,up=True):
    n=int(dur*SR); nz=rng.standard_normal(n); tt=np.linspace(0,1,n)
    out=np.zeros(n); 
    for i,fc in enumerate(np.linspace(0.02,0.5,1)): pass
    # sweep lowpass via blockwise
    y=np.zeros(n); st=0
    for i in range(1,n):
        a=0.02+0.5*(tt[i] if up else 1-tt[i])**2
        y[i]=y[i-1]+a*(nz[i]-y[i-1])
    y=y*np.sin(np.pi*tt)**2
    return y/np.max(np.abs(y))*0.6
save("whoosh",whoosh(0.7,True)); save("whoosh_down",whoosh(0.6,False))
def pop():
    n=int(0.18*SR); t=np.arange(n)/SR; f=900*np.exp(-t*22)+200
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t/0.05)*0.7
save("pop",pop())
def tick():
    n=int(0.05*SR); t=np.arange(n)/SR
    return (np.sin(2*np.pi*2400*t)*np.exp(-t/0.008))*0.5
save("tick",tick())
def hit():
    n=int(0.9*SR); t=np.arange(n)/SR; f=45+110*np.exp(-t*20)
    x=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t/0.28)
    nz=lp(rng.standard_normal(n),0.3)*np.exp(-t/0.05)*0.4
    return (x*0.9+nz)
save("hit",hit())
def riser(d=1.6):
    n=int(d*SR); t=np.arange(n)/SR; f=200*(1+8*(t/d)**2)
    x=np.sin(2*np.pi*np.cumsum(f)/SR)*0.25
    nz=rng.standard_normal(n); nz=nz-lp(nz,0.1)
    x+=nz*(t/d)**2*0.25
    return x*(t/d)**1.5
save("riser",riser())
def chime():
    n=int(1.6*SR); t=np.arange(n)/SR
    x=sum(sine(f,n)*a for f,a in [(880,.4),(1320,.25),(1760,.15),(2217,.1)])*np.exp(-t/0.5)
    return x*0.5
save("chime",chime())
def success():
    n=int(1.2*SR); x=np.zeros(n)
    for k,p in enumerate([69,73,76,81]):
        s=int(k*0.07*SR); m_=n-s; t=np.arange(m_)/SR
        x[s:]+=(sine(note(p),m_)+0.3*sine(2*note(p),m_))*np.exp(-t/0.35)*0.3
    return x
save("success",success())
print("ok")
