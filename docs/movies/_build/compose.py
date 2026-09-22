import subprocess, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
W,H=1920,1080; FPS=30; X=0.6
FONT="/System/Library/Fonts/Supplemental/AppleSDGothicNeo.ttc"
def font(sz,w=6): return ImageFont.truetype(FONT,sz,index=w)
def run(cmd): subprocess.run(cmd,check=True,capture_output=True)
ABOUT=(240,0,1440,810)  # 소개 페이지: 가운데 1440x810 을 잘라 1.33배 확대

import re
EMO=re.compile("[\U0001F000-\U0001FAFF\U00002600-\U000027BF\U0001F900-\U0001F9FF\u200d\ufe0f\u2B50\u2705\u274C]+ ?")
def caption(name, text, sub=None, accent=(251,191,36)):
    text=EMO.sub("",text).strip(); sub=EMO.sub("",sub).strip() if sub else None
    im=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(im)
    f=font(46); fs=font(28,4)
    tw=d.textlength(text,font=f); sw=d.textlength(sub,font=fs) if sub else 0
    bw=max(tw,sw)+120; bh=112 if sub else 88; x0=(W-bw)/2; y0=H-64-bh
    sh=Image.new("RGBA",(W,H),(0,0,0,0)); ImageDraw.Draw(sh).rounded_rectangle([x0,y0+8,x0+bw,y0+bh+8],26,fill=(0,0,0,160)); im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(18)))
    d.rounded_rectangle([x0,y0,x0+bw,y0+bh],26,fill=(8,8,22,222),outline=accent+(150,),width=2)
    d.rounded_rectangle([x0+18,y0+22,x0+26,y0+bh-22],4,fill=accent+(255,))
    d.text((x0+60,y0+(20 if sub else 21)),text,font=f,fill=(255,255,255,255))
    if sub: d.text((x0+60,y0+72),sub,font=fs,fill=(196,181,253,255))
    p=f"ov/{name}.png"; im.save(p); return p

def badge(name, text, accent=(108,92,231)):  # 왼쪽 위 챕터 배지
    im=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(im); f=font(26)
    tw=d.textlength(text,font=f); d.rounded_rectangle([40,96,40+tw+52,96+54],27,fill=accent+(235,)); d.text((66,108),text,font=f,fill=(255,255,255,255))
    p=f"ov/{name}.png"; im.save(p); return p

def titlecard(name):
    im=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.rectangle([0,0,W,H],fill=(4,4,14,200))
    logo=Image.open("svg/logo.png").convert("RGBA"); logo=logo.resize((150,int(150*logo.height/logo.width))); im.alpha_composite(logo,((W-logo.width)//2,300))
    lines=[("AskBack",font(128),(255,255,255),470),("코드보다 설계 먼저.",font(60),(251,191,36),620),("답은 끝까지 주고, 질문하는 법을 코칭하는 청소년 AI 프로젝트 코치",font(34,4),(196,181,253),710),("askback-omega.vercel.app/about",font(28,4),(150,150,180),775)]
    for t,f,c,y in lines: tw=d.textlength(t,font=f); d.text(((W-tw)/2,y),t,font=f,fill=c+(255,))
    p=f"ov/{name}.png"; im.save(p); return p

def endcard(name):
    im=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.rectangle([0,0,W,H],fill=(4,4,14,250))
    logo=Image.open("svg/logo.png").convert("RGBA"); logo=logo.resize((120,int(120*logo.height/logo.width))); im.alpha_composite(logo,((W-logo.width)//2,250))
    lines=[("AskBack",font(110),(255,255,255),390),("코드보다 설계 먼저.",font(52),(251,191,36),530),("답은 끝까지 · 질문의 폭을 코칭 · 2문 1역 · 10문 리포트 · 기획서.md",font(32,4),(196,181,253),620)]
    for t,f,c,y in lines: tw=d.textlength(t,font=f); d.text(((W-tw)/2,y),t,font=f,fill=c+(255,))
    d.rounded_rectangle([W/2-330,720,W/2+330,806],43,fill=(108,92,231,255))
    f=font(36); t="askback-omega.vercel.app"; tw=d.textlength(t,font=f); d.text(((W-tw)/2,742),t,font=f,fill=(255,255,255,255))
    f=font(26,4); t="가입 없이 바로 시작 · /demo 로 교실 시연"; tw=d.textlength(t,font=f); d.text(((W-tw)/2,840),t,font=f,fill=(150,150,180,255))
    p=f"ov/{name}.png"; im.save(p); return p

def overlays(fc, cur, caps, inputs, k0):
    k=k0
    for (a,b,png) in caps:
        d=b-a; inputs+=["-loop","1","-framerate",str(FPS),"-t",f"{d:.3f}","-i",png]
        fc.append(f"[{k}:v]format=rgba,fade=in:st=0:d=0.4:alpha=1,fade=out:st={max(0,d-0.4):.3f}:d=0.4:alpha=1,setpts=PTS-STARTPTS+{a}/TB[c{k}]")
        fc.append(f"[{cur}][c{k}]overlay=0:0:eof_action=pass[v{k}]"); cur=f"v{k}"; k+=1
    return cur

def seg(out, src, ss, to, dur, caps, crop=None):
    speed=(to-ss)/dur
    inputs=["-ss",str(ss),"-to",str(to),"-i",src]
    cr=f"crop={crop[2]}:{crop[3]}:{crop[0]}:{crop[1]}," if crop else ""
    fc=[f"[0:v]setpts=(PTS-STARTPTS)/{speed:.4f},fps={FPS},{cr}scale={W}:{H}:flags=lanczos,format=yuv420p[v0]"]
    cur=overlays(fc,"v0",caps,inputs,1)
    run(["ffmpeg","-y","-v","error",*inputs,"-filter_complex",";".join(fc),"-map",f"[{cur}]","-t",f"{dur:.3f}","-r",str(FPS),"-c:v","libx264","-preset","fast","-crf","17","-pix_fmt","yuv420p",out])

def vdur(i): return float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f"voice/v{i}.wav"]).decode())

R="rec/"; S=[]  # (file, dur, voice idx or None)
B1=badge("b1","01 · 왜 만들었나",(251,113,133)); B2=badge("b2","02 · 누구에게",(96,165,250)); B3=badge("b3","03 · 어떻게 동작하나",(52,211,153)); B4=badge("b4","04 · 실제 시연",(168,85,247)); B5=badge("b5","05 · 무엇이 남나",(251,191,36))
def add(i,dur,vi): S.append((f"seg/{i}.mp4",dur,vi))
# 0 타이틀 — 히어로 위에
d=vdur(1)+1.6; seg("seg/0.mp4",R+"hero.webm",3.0,3.0+d,d,[(0,4.0,titlecard("t0")),(4.2,d,caption("c0","열린 질문 하나가 — 제품 · 서비스 · 캠페인 · 리서치 · 논문의 설계도로","답은 끝까지 받고, 질문하는 법은 코칭받는다"))],ABOUT); add(0,d,1)
# 1 동기 — 몰래 쓰는 AI → 화이트보드 검문
d=vdur(2)+1.0; seg("seg/1.mp4",R+"gate.webm",4.5,19.0,d,[(0,d,B1),(0.3,4.4,caption("c1a","학생들은 이미 AI를 씁니다 — 다만, 몰래","쓰면 의심받고 · 안 쓰면 뒤처지고 · 잘 쓰는 법은 아무도 안 가르쳐준다",(251,113,133))),(4.6,7.9,caption("c1b","현장의 답 — 특성화고의 ‘화이트보드 검문’","순서도를 그리고 · 핵심을 짚고 · 차별점을 말하면, AI를 써도 인정",(52,211,153))),(8.1,d,caption("c1c","선생님이 묻던 네 가지를, 앱이 매일 대신 묻습니다","순서도 · 핵심 · 차별점 · 실패 조건 — 2시간 검문이 5~30초로"))],ABOUT); add(1,d,2)
# 2 문제 — 인지적 부채
d=vdur(3)+1.0; seg("seg/2.mp4",R+"problem.webm",4.5,13.5,d,[(0,d,B1),(0.3,d,caption("c2","만드는 비용은 0에 가까워졌지만","무엇을, 왜 만들었는지 설명하지 못하는 ‘인지적 부채’가 남는다",(251,113,133)))],ABOUT); add(2,d,3)
# 3 빈칸
d=vdur(4)+1.0; seg("seg/3.mp4",R+"gap.webm",4.5,15.5,d,[(0,d,B1),(0.3,4.4,caption("c3a","아이디어와 코딩 도구 사이, 텅 빈 한 칸","코드는 다른 도구가 뽑는다 — 그 도구에 넣을 ‘설계도’가 없다",(52,211,153))),(4.6,d,caption("c3b","기획 · 알고리즘 · 전체 구조","AskBack은 그 설계도를 학생 스스로 만들게 하는 AI 코치",(52,211,153)))],ABOUT); add(3,d,4)
# 4 페르소나
d=vdur(5)+1.0; seg("seg/4.mp4",R+"who.webm",4.5,18.5,d,[(0,d,B2),(0.3,2.3,caption("c4a","🧑‍🚀 중학생 · 프로젝트 학급","베낀 숫자로 만들고, 돌아가는데 설명을 못 한다 → 직접 잰 내 숫자가 생긴다",(96,165,250))),(2.5,5.0,caption("c4b","👩‍🏫 교사 · 수행평가","30명의 과정을 볼 시간이 없다 → 헤더의 🧩 n/4 와 10문 리포트만 본다",(167,139,250))),(5.2,7.6,caption("c4c","🛠 메이커스페이스 · 코딩 학원","코딩 도구를 열기 전, 기획서 4칸부터",(34,211,238))),(7.8,d,caption("c4d","👨‍👩‍👧 학부모","막아야 하나, 둬야 하나 → 첫 질문과 지금의 질문을 나란히 본다",(52,211,153)))],ABOUT); add(4,d,5)
# 5 원칙
d=vdur(6)+1.0; seg("seg/5.mp4",R+"rules.webm",4.5,13.5,d,[(0,d,B3),(0.3,d,caption("c5","코치가 지키는 세 가지 선","정보는 끝까지, 판단은 네 몫 · 코드 대신 명세 · 억지로 묻지 않는다"))],ABOUT); add(5,d,6)
# 6 사용법 — 세 마디 · 다섯 정거장
d=vdur(7)+1.0; seg("seg/6.mp4",R+"how.webm",4.5,22.5,d,[(0,d,B3),(0.3,3.4,caption("c6a","쓰는 법은 세 마디","묻는다 → 되물음에 답한다 → 적는다",(103,232,249))),(3.6,d,caption("c6b","다섯 정거장을 돌면, 가운데에서 10문 리포트","형식 선택 → 질문 → 명세 + 되묻기 → 이해 확인(2문 1역) → 기획서 채우기",(103,232,249)))],ABOUT); add(6,d,7)
# 7 실제 시연 — 질문 → 답 → 되묻기 (앱 화면 그대로)
d=vdur(8)+1.0; seg("seg/7.mp4",R+"ask.webm",8.0,25.5,d,[(0,d,B4),(0.3,4.0,caption("c7a","평소처럼 묻습니다","“흙 센서값이 400 밑이면 펌프 3초 켜는 코드 짜줘”",(129,140,248))),(4.2,8.6,caption("c7b","답은 끝까지 — 코드 대신 규칙 카드 + 순서도","🫵 네가 정할 것 · 📌 AI가 가정한 것을 나눠 보여 준다",(52,211,153))),(8.8,d,caption("c7c","그리고 답 끝에서 되묻습니다","🙋 “그 400은 어디서 왔어? 직접 재 본 적 있어?”"))]); add(7,d,8)
# 8 되묻기 두 겹 (소개) → 앱의 320·610 · 역질문
d=vdur(9)*0.47; seg("seg/8.mp4",R+"askback.webm",4.5,13.5,d,[(0,d,B3),(0.3,d,caption("c8a","되묻기는 두 겹입니다","🙋 모든 답 끝의 열린 되묻기 · 🧭 질문 두 번마다 2문 1역 역질문",(244,114,182)))],ABOUT); add(8,d,9)
d=vdur(9)*0.53+1.6; seg("seg/9.mp4",R+"rq.webm",6.0,15.5,d,[(0,d,B4),(0.3,3.6,caption("c9a","학생은 직접 잰 숫자로 답합니다","“마른 흙 320 · 젖은 흙 610 — 400은 베낀 숫자였어”",(52,211,153))),(3.9,d,caption("c9b","🧭 2문 1역 역질문 — 실패 조건","“센서가 빠져서 0이 되면, 화분엔 어떤 일이 벌어질까?” · 5초 고르기 · 💡 힌트 3단",(244,114,182)))]); add(9,d,None)
# 9 남는 것 — 기획서.md → 10문 리포트 (앱)
d=vdur(10)*0.5+0.4; seg("seg/10.mp4",R+"output.webm",4.5,12.5,d,[(0,d,B5),(0.3,d,caption("c10a","대화는 휘발되지만, 내 말로 채운 기획서는 남습니다","📝 기획서.md · 🫵 내가 정한 것 · 📌 AI가 가정한 것 → 코딩 도구에 붙여넣기",(244,114,182)))],ABOUT); add(10,d,10)
d=vdur(10)*0.5+1.2; seg("seg/11.mp4",R+"report.webm",11.5,20.0,d,[(0,d,B4),(0.3,d,caption("c11","질문 10개마다 — 늘 같은 8칸 리포트 + 미션 하나","한눈에 · 질문 유형 · 길이 · 실은 것 · 되묻기 · 걸린 곳 · 베스트 질문 · 미션"))]); add(11,d,None)
# 10 같은 3주
d=vdur(11)+1.0; seg("seg/12.mp4",R+"weeks.webm",4.5,14.5,d,[(0,d,B5),(0.3,3.4,caption("c12a","같은 3주, 다른 결말","남은 것: 출처 모를 코드 파일 하나 vs 기획서.md · 리포트 · 전체 기록",(52,211,153))),(3.6,d,caption("c12b","그 3주 동안, 질문이 여섯 단을 오릅니다","시킨다 → 재 온다 → 조건을 싣는다 → 다른 길을 묻는다 → 기준을 세운다 → 남에게 건넨다",(52,211,153)))],ABOUT); add(12,d,11)
# 11 비교 · 2026 지침
d=vdur(12)+1.0; seg("seg/13.mp4",R+"position.webm",5.0,17.5,d,[(0,d,B5),(0.3,4.4,caption("c13a","답은 끝까지 주고, 설계는 학생이 한다","튜터형은 답을 아끼고 · 챗봇은 설계까지 대신한다 — 그 자리는 비어 있었다",(167,139,250))),(4.6,d,caption("c13b","📜 2026 수행평가 AI 활용 지침 — 프롬프트와 개발 과정 표기","평소처럼 묻기만 해도 📁 전체 기록.md 가 증빙으로 쌓인다 · 과정 중심 평가",(52,211,153)))],ABOUT); add(13,d,12)
# 12 엔딩
d=vdur(13)+2.0; seg("seg/14.mp4",R+"closing.webm",5.5,14.5,d,[(0.3,5.6,caption("c14","만드는 비용이 0에 가까워지는 시대","가장 중요한 역량은 ‘무엇을, 왜 만드는가’ — AskBack이 그 질문을 함께합니다")),(5.9,d,endcard("e14"))],(240,200,1440,810)); add(14,d,13)

inputs=[]; fc=[]; cur="0:v"; off=0; starts=[0]
for p,dur,_ in S: inputs+=["-i",p]
for k in range(1,len(S)):
    off+=S[k-1][1]-X; starts.append(off)
    fc.append(f"[{cur}][{k}:v]xfade=transition=fade:duration={X}:offset={off:.3f}[x{k}]"); cur=f"x{k}"
total=off+S[-1][1]
n=len(S); alab=[]; ai=n
for k,(p,dur,vi) in enumerate(S):
    if vi is None: continue
    inputs+=["-i",f"voice/v{vi}.wav"]; ms=int((starts[k]+0.35)*1000)
    fc.append(f"[{ai}:a]volume=1.6,adelay={ms}|{ms}[s{k}]"); alab.append(f"[s{k}]"); ai+=1
inputs+=["-i","music.wav"]
fc.append(f"[{ai}:a]volume=0.16,afade=out:st={total-3:.2f}:d=3[m]")
fc.append("".join(alab)+f"[m]amix=inputs={len(alab)+1}:normalize=0:duration=longest,alimiter=limit=0.95[a]")
run(["ffmpeg","-y","-v","error",*inputs,"-filter_complex",";".join(fc),"-map",f"[{cur}]","-map","[a]","-c:v","libx264","-preset","slow","-crf","18","-pix_fmt","yuv420p","-c:a","aac","-b:a","192k","-movflags","+faststart","-t",f"{total:.3f}","AskBack_intro_2min.mp4"])
print("TOTAL",round(total,1),[round(s,1) for s in starts])
