# 순수 파이썬으로 만드는 배경음악 — 100BPM, 밝은 신스 팝. 킥 · 하이햇 · 베이스 · 아르페지오 · 패드
import math, struct, random, sys
SR=44100; BPM=100; BEAT=60/BPM; DUR=float(sys.argv[1]) if len(sys.argv)>1 else 62
N=int(SR*DUR); out=[0.0]*N
def note(f,start,length,amp,wave='saw',decay=3.0,attack=0.01):
    s0=int(start*SR); n=int(length*SR)
    for i in range(n):
        t=i/SR; env=min(1,t/attack)*math.exp(-decay*t)
        ph=2*math.pi*f*t
        if wave=='saw': v=(2*((f*t)%1)-1)*0.5+0.3*math.sin(ph)
        elif wave=='sq': v=(1 if math.sin(ph)>0 else -1)*0.4+0.3*math.sin(ph*2)
        elif wave=='tri': v=2*abs(2*((f*t)%1)-1)-1
        else: v=math.sin(ph)+0.3*math.sin(2*ph)
        j=s0+i
        if j<N: out[j]+=v*env*amp
def kick(start):
    s0=int(start*SR)
    for i in range(int(0.35*SR)):
        t=i/SR; f=160*math.exp(-18*t)+45; env=math.exp(-9*t)
        j=s0+i
        if j<N: out[j]+=math.sin(2*math.pi*f*t)*env*0.9
def hat(start,amp=0.16,dec=45):
    s0=int(start*SR); random.seed(int(start*1000))
    for i in range(int(0.12*SR)):
        t=i/SR; j=s0+i
        if j<N: out[j]+=(random.random()*2-1)*math.exp(-dec*t)*amp
def snare(start):
    s0=int(start*SR); random.seed(7)
    for i in range(int(0.2*SR)):
        t=i/SR; j=s0+i
        if j<N: out[j]+=((random.random()*2-1)*0.6+math.sin(2*math.pi*190*t)*0.5)*math.exp(-22*t)*0.5
# 코드 진행 (Am – F – C – G) 4비트씩
A=lambda m: 440*2**(m/12)
chords=[[-3,0,4],[-4,0,3],[-9,-5,0],[-2,2,5]]  # A C E / F A C / C E G / G B D  (semitones from A4)
bassn=[-27,-28,-21,-26]
bar=BEAT*4; total_bars=int(DUR/bar)+1
for b in range(total_bars):
    t0=b*bar; ch=chords[b%4]
    if t0>DUR: break
    # 패드
    for m in ch: note(A(m)/2,t0,bar*1.05,0.06,'saw',decay=0.6,attack=0.4)
    # 베이스
    for k in range(4):
        note(A(bassn[b%4]),t0+k*BEAT,BEAT*0.9,0.35 if k%2==0 else 0.25,'sq',decay=4)
    # 아르페지오 8분
    arp=[ch[0],ch[1],ch[2],ch[1]+12,ch[2],ch[1],ch[0]+12,ch[2]]
    for k in range(8):
        note(A(arp[k]),t0+k*BEAT/2,BEAT/2,0.16,'tri',decay=6)
    # 드럼
    for k in range(4):
        kick(t0+k*BEAT); hat(t0+k*BEAT+BEAT/2)
        if k in (1,3): snare(t0+k*BEAT)
    if b>=1:
        for k in range(8): hat(t0+k*BEAT/2,0.07,70)
# 마스터: 소프트 클립 + 페이드
mx=max(abs(v) for v in out); out=[v/mx*0.9 for v in out]
def sc(v): return math.tanh(v*1.3)/math.tanh(1.3)
with open('music.wav','wb') as f:
    data=bytearray()
    for i,v in enumerate(out):
        t=i/SR; g=min(1,t/1.5)*min(1,(DUR-t)/3.5)
        s=int(max(-1,min(1,sc(v)*g))*32000); data+=struct.pack('<hh',s,s)
    f.write(b'RIFF'+struct.pack('<I',36+len(data))+b'WAVEfmt '+struct.pack('<IHHIIHH',16,1,2,SR,SR*4,4,16)+b'data'+struct.pack('<I',len(data))+data)
print('music ok',DUR)
