// 소개 페이지 커스텀 SVG ② — 문제 · 빈칸 · 원칙 · 거울 · 포지셔닝. 직접적인 그림 한 장으로 말한다.
import type { CSSProperties, ReactNode } from "react";

const FONT = { fontFamily: "inherit" } as const;
const at = (s: number): CSSProperties => ({ animationDelay: `${s}s` });

const INK = "#ffffff";
const SUB = "#a8a8c0";
const LINE = "#2c2c46";
const CARD = "#0d0d18";
const SAND = "#17172a";
const GOLD = "#fbbf24";
const MINT = "#34d399";
const SKY = "#67e8f9";
const ROSE = "#fb7185";
const BLUE = "#4f46e5";
const VIOLET = "#a78bfa";

// AI 시대의 기적 — "코드 짜줘" 한 마디에 화면이 뚝딱 나온다
export function MiracleArt() {
  const phone = (x: number, fill: number, d: number) => (
    <g className="stg" style={at(d)}>
      <rect x={x} y="50" width="64" height="112" rx="12" fill={CARD} stroke={VIOLET} strokeWidth="1.800" />
      <rect x={x + 22} y="56" width="20" height="4" rx="2" fill={LINE} />
      {fill > 0 && <rect x={x + 8} y="68" width="48" height="30" rx="5" fill={`${VIOLET}44`} stroke={VIOLET} />}
      {fill > 1 && <><rect x={x + 8} y="104" width="22" height="18" rx="4" fill={SAND} /><rect x={x + 34} y="104" width="22" height="18" rx="4" fill={SAND} /></>}
      {fill > 2 && <rect x={x + 14} y="130" width="36" height="14" rx="7" fill={MINT} className="ab-tw" />}
      {fill === 0 && <path d={`M${x + 12} 72l40 60M${x + 52} 72l-40 60`} stroke={LINE} strokeWidth="1.500" />}
    </g>
  );
  return (
    <svg viewBox="0 0 320 180" aria-hidden className="h-auto w-full" style={FONT}>
      <g className="stg-pop" style={at(0.2)}>
        <rect x="8" y="6" width="104" height="34" rx="12" fill={BLUE} stroke="#818cf8" />
        <path d="M30 39l-4 12 14-12z" fill={BLUE} />
        <text x="60" y="28" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="800">“코드 짜줘.”</text>
      </g>
      {phone(14, 0, 0.5)}{phone(128, 2, 1)}{phone(242, 3, 1.500)}
      {[86, 200].map((x, i) => <g key={x} className="stg" style={at(0.8 + i * 0.5)}><path d={`M${x} 106h28`} stroke={VIOLET} strokeWidth="2.400" strokeLinecap="round" className="ab-dash" /><path d={`M${x + 24} 100l7 6-7 6`} fill="none" stroke={VIOLET} strokeWidth="2.400" strokeLinecap="round" strokeLinejoin="round" /></g>)}
      <g className="stg-pop" style={at(1.8)}>
        <rect x="150" y="10" width="162" height="28" rx="14" fill={`${VIOLET}33`} stroke={VIOLET} />
        <text x="231" y="29" textAnchor="middle" fill="#ddd6fe" fontSize="12" fontWeight="800">&lt;/&gt; AI CODE GENERATION</text>
      </g>
      {[[300, 56], [118, 60], [226, 168]].map(([x, y], i) => <path key={i} d={`M${x} ${y - 6}l2 4.500 4.500 2-4.500 2-2 4.500-2-4.500-4.500-2 4.500-2z`} fill={GOLD} className="ab-tw" style={at(i * 0.4)} />)}
    </svg>
  );
}

// 인지적 부채 — 돌아가는데, 설명을 못 한다
export function DebtArt() {
  return (
    <svg viewBox="0 0 320 180" aria-hidden className="h-auto w-full" style={FONT}>
      <g className="stg" style={at(0.2)}>
        <rect x="150" y="30" width="160" height="104" rx="6" fill={CARD} stroke={SUB} strokeWidth="1.800" transform="skewY(-3)" />
        <g transform="skewY(-3)" fill="none" stroke={ROSE} strokeWidth="1.500" opacity="0.8">
          <rect x="164" y="46" width="34" height="18" rx="3" /><rect x="216" y="42" width="34" height="18" rx="3" /><rect x="262" y="52" width="34" height="18" rx="3" />
          <path d="M232 78l14 12-14 12-14-12z" /><rect x="168" y="96" width="34" height="18" rx="3" /><rect x="262" y="96" width="34" height="18" rx="3" />
          <path d="M198 55h18M250 52h12M232 60v18M218 90h-16M246 90h16M181 64v32" strokeDasharray="3 3" />
        </g>
        <path d="M150 140h160M172 140l-8 30M288 132l8 38" stroke={SUB} strokeWidth="1.800" strokeLinecap="round" />
      </g>
      <g className="stg-pop" style={at(0.8)}>
        <rect x="6" y="4" width="150" height="46" rx="12" fill={CARD} stroke={INK} strokeWidth="1.500" />
        <path d="M96 49l10 16 6-16z" fill={CARD} stroke={INK} strokeWidth="1.500" strokeLinejoin="round" />
        <text x="81" y="24" textAnchor="middle" fill={INK} fontSize="13" fontWeight="800">“센서가 빠지면</text>
        <text x="81" y="41" textAnchor="middle" fill={INK} fontSize="13" fontWeight="800">어떻게 되나요?”</text>
      </g>
      {/* 말문이 막힌 학생 */}
      <g className="stg" style={at(0.5)}>
        <path d="M76 176c0-34 12-50 32-50s32 16 32 50z" fill={BLUE} />
        <path d="M88 150c10 8 30 8 40 0" fill="none" stroke="#1d2f8a" strokeWidth="7" strokeLinecap="round" />
        <circle cx="108" cy="100" r="24" fill="#ffd9b8" />
        <path d="M84 98a24 24 0 0 1 48 0c-10-2-20-8-25-15-5 8-13 13-23 15z" fill="#3b2a1e" />
        <circle cx="99" cy="104" r="2" fill="#2a1a4a" /><circle cx="117" cy="104" r="2" fill="#2a1a4a" />
        <path d="M94 97l8 2M122 97l-8 2" stroke="#2a1a4a" strokeWidth="1.600" strokeLinecap="round" />
        <path d="M102 115q6-4 12 0" fill="none" stroke="#2a1a4a" strokeWidth="1.600" strokeLinecap="round" />
        <path d="M136 84c-3 5-3 8 0 10 3-2 3-5 0-10z" fill={SKY} className="fa-drop" />
      </g>
      <g className="stg-pop" style={at(1.5)}>
        <rect x="20" y="66" width="56" height="28" rx="14" fill={SAND} stroke={ROSE} />
        {[0, 1, 2].map((i) => <circle key={i} cx={36 + i * 12} cy="80" r="3.200" fill={ROSE} className="sc-dot" style={at(i * 0.25)} />)}
      </g>
    </svg>
  );
}

// 텅 빈 공간 — 아이디어와 코딩 도구 사이. AskBack이 그 칸에 내려앉는다.
export function GapArt() {
  const arrow = (x: number) => <path d={`M${x} 150h34l-2-12 22 18-22 18 2-12h-34z`} fill={SUB} />;
  return (
    <svg viewBox="0 0 1000 300" role="img" aria-label="아이디어와 바이브 코딩 도구 사이의 텅 빈 공간에 틴스파크AI가 들어간다" className="h-auto w-full min-w-[720px]" style={FONT}>
      <defs>
        <linearGradient id="gap-orb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={VIOLET} /><stop offset="1" stopColor={BLUE} /></linearGradient>
        <radialGradient id="gap-glow"><stop offset="0" stopColor={MINT} stopOpacity="0.5" /><stop offset="1" stopColor={MINT} stopOpacity="0" /></radialGradient>
      </defs>
      {/* 아이디어 */}
      <rect x="20" y="86" width="180" height="140" rx="18" fill={CARD} stroke={LINE} strokeWidth="2" />
      <g fill="none" stroke={GOLD} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="ab-tw"><path d="M92 146a18 18 0 1 1 36 0c0 8-6 11-7 18h-22c-1-7-7-10-7-18zM102 172h16M110 112v-8M84 122l-6-6M136 122l6-6" /></g>
      <text x="110" y="208" textAnchor="middle" fill={INK} fontSize="18" fontWeight="800">아이디어</text>
      {arrow(208)}
      {/* 텅 빈 공간 */}
      <rect x="276" y="86" width="400" height="140" rx="18" fill="#2a0f1655" stroke={ROSE} strokeWidth="2.400" strokeDasharray="9 8" className="gap-box" />
      <text x="476" y="164" textAnchor="middle" fill={ROSE} fontSize="62" fontWeight="800" opacity="0.5" className="gap-q">?</text>
      <text x="476" y="208" textAnchor="middle" fill={ROSE} fontSize="17" fontWeight="800">텅 빈 공간 — 기획 · 알고리즘 · 구조</text>
      {/* 내려앉는 AskBack */}
      <g className="gap-drop">
        <circle cx="476" cy="130" r="74" fill="url(#gap-glow)" />
        <circle cx="476" cy="130" r="38" fill="url(#gap-orb)" stroke="#c7d2fe" strokeWidth="1.500" />
        <ellipse cx="476" cy="130" rx="56" ry="12" fill="none" stroke={GOLD} strokeWidth="1.800" transform="rotate(-18 476 130)" />
        <path d="M465 121a11 11 0 1 1 16.500 9.500c-4 2.400-5.500 4.200-5.500 8" fill="none" stroke="#fff" strokeWidth="4.600" strokeLinecap="round" />
        <circle cx="476" cy="148" r="3" fill="#fff" />
        <rect x="414" y="34" width="124" height="30" rx="15" fill="#0a261f" stroke={MINT} />
        <text x="476" y="54" textAnchor="middle" fill={MINT} fontSize="15" fontWeight="800">teensparkai ↓</text>
      </g>
      {arrow(684)}
      {/* 코딩 도구 */}
      <rect x="752" y="86" width="150" height="140" rx="18" fill={CARD} stroke={LINE} strokeWidth="2" />
      <rect x="796" y="116" width="62" height="42" rx="6" fill="none" stroke={SKY} strokeWidth="2.600" /><path d="M786 168h82" stroke={SKY} strokeWidth="3" strokeLinecap="round" />
      <text x="827" y="143" textAnchor="middle" fill={SKY} fontSize="16" fontWeight="800">&lt;/&gt;</text>
      <text x="827" y="196" textAnchor="middle" fill={INK} fontSize="15" fontWeight="800">바이브 코딩 도구</text>
      <text x="827" y="214" textAnchor="middle" fill={SUB} fontSize="11.500">Cursor · Claude Code · Replit</text>
      <path d="M908 150h20l-2-10 18 16-18 16 2-10h-20z" fill={SUB} />
      <g className="ab-float"><path d="M972 118c10 8 13 22 10 38h-20c-3-16 0-30 10-38z" fill="#eef0ff" /><circle cx="972" cy="138" r="4.500" fill={BLUE} /><path d="M962 152l-7 10 9-2M982 152l7 10-9-2" fill={ROSE} /><path d="M968 158l4 13 4-13z" fill={GOLD} className="ab-tw" /></g>
      <text x="972" y="208" textAnchor="middle" fill={INK} fontSize="14" fontWeight="800">결과물</text>
      <path d="M276 262h400" stroke={ROSE} strokeWidth="1.500" /><path d="M276 254v16M676 254v16" stroke={ROSE} strokeWidth="1.500" />
      <text x="476" y="288" textAnchor="middle" fill={SUB} fontSize="13">지금은 여기를 AI가 대신 채우거나, 아무도 채우지 않습니다</text>
    </svg>
  );
}

// 세 가지 원칙
export function PrincipleArt({ name }: { name: "boundary" | "spec" | "noforce" }) {
  const art: Record<string, ReactNode> = {
    boundary: (
      <>
        <rect x="30" y="8" width="140" height="44" rx="10" fill={`${VIOLET}33`} stroke={VIOLET} strokeWidth="1.500" className="stg" style={at(0.2)} />
        <text x="100" y="35" textAnchor="middle" fill="#ddd6fe" fontSize="14" fontWeight="800" className="stg" style={at(0.3)}>📌 AI가 가정한 것</text>
        <rect x="30" y="58" width="140" height="64" rx="10" fill="#0a261f" stroke={MINT} strokeWidth="2" className="stg" style={at(0.6)} />
        <text x="100" y="88" textAnchor="middle" fill={MINT} fontSize="15" fontWeight="800" className="stg" style={at(0.7)}>🫵 네가 정할 것</text>
        <text x="100" y="108" textAnchor="middle" fill={SUB} fontSize="11" className="stg" style={at(0.8)}>목표 · 기준 · 선택 · 잴 숫자</text>
      </>
    ),
    spec: (
      <>
        <g className="stg" style={at(0.2)}>
          <rect x="10" y="14" width="78" height="102" rx="8" fill={CARD} stroke={LINE} />
          {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={18 + (i % 3) * 5} y={26 + i * 14} width={[46, 38, 52, 30, 44, 36][i]} height="5" rx="2.500" fill={LINE} />)}
          <path d="M22 32l54 66M76 32l-54 66" stroke={ROSE} strokeWidth="7" strokeLinecap="round" className="draw" pathLength={1} style={at(0.7)} />
        </g>
        <g className="stg" style={at(1)}>
          {["입력", "판단", "출력"].map((t, i) => <g key={t}><rect x="112" y={14 + i * 38} width="62" height="24" rx="7" fill="#0a261f" stroke={MINT} strokeWidth="1.500" /><text x="143" y={31 + i * 38} textAnchor="middle" fill={INK} fontSize="12" fontWeight="700">{t}</text>{i < 2 && <path d={`M143 ${38 + i * 38}v14`} stroke={MINT} strokeWidth="1.800" />}</g>)}
          <path d="M160 100l10 10 22-26" fill="none" stroke={MINT} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" className="draw" pathLength={1} style={at(1.5)} />
        </g>
      </>
    ),
    noforce: (
      <>
        <g className="stg" style={at(0.2)}>
          <path d="M40 6h84l18 18v84H40z" fill={CARD} stroke={SUB} strokeWidth="1.500" strokeLinejoin="round" />
          {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M52 ${24 + i * 10}h${[70, 78, 64, 78, 58, 78, 72, 50][i]}`} stroke={INK} strokeWidth="2.400" strokeLinecap="round" opacity="0.8" className="draw" pathLength={1} style={at(0.3 + i * 0.12)} />)}
        </g>
        <path d="M70 108v10h26" fill="none" stroke={SUB} strokeWidth="1.600" strokeDasharray="3 3" />
        <g className="stg-pop" style={at(1.5)}>
          <rect x="98" y="102" width="98" height="26" rx="13" fill="#2a2108" stroke={GOLD} strokeWidth="1.500" />
          <text x="147" y="120" textAnchor="middle" fill={GOLD} fontSize="12.500" fontWeight="800">🙋 열린 되묻기</text>
        </g>
        <text x="20" y="64" fill={MINT} fontSize="10" fontWeight="800" transform="rotate(-90 20 64)" textAnchor="middle">답은 끝까지</text>
      </>
    ),
  };
  return <svg viewBox="0 0 200 130" aria-hidden className="h-auto w-full" style={FONT}>{art[name]}</svg>;
}

// 10번의 질문마다 비춰 주는 거울 — 질문의 폭 O1→O4 와 여섯 요소 레이더
export function MirrorArt() {
  const cx = 160, cy = 168, R = 76;
  const labels = ["왜", "맥락", "제약", "기준", "검증", "버릴 것"];
  const vals = [0.85, 0.95, 0.55, 0.9, 0.6, 0.35];
  const pt = (i: number, k: number) => { const a = (-90 + i * 60) * (Math.PI / 180); return [cx + Math.cos(a) * R * k, cy + Math.sin(a) * R * k]; };
  const poly = (k: number | number[]) => labels.map((_, i) => pt(i, Array.isArray(k) ? k[i] : k).map((n) => n.toFixed(1)).join(",")).join(" ");
  return (
    <svg viewBox="0 0 320 270" role="img" aria-label="질문의 폭이 O1에서 O4로 자라고, 질문에 실린 여섯 요소를 레이더로 보여 준다" className="h-auto w-full" style={FONT}>
      <path d="M28 30h264" stroke={LINE} strokeWidth="3" strokeLinecap="round" />
      <path d="M28 30h264" stroke={MINT} strokeWidth="3" strokeLinecap="round" className="draw" pathLength={1} style={at(0.3)} />
      {[["O1", "받아쓰기"], ["O2", "코더"], ["O3", "엔지니어"], ["O4", "아키텍트"]].map(([o, t], i) => (
        <g key={o} className="stg" style={at(0.3 + i * 0.35)}>
          <circle cx={28 + i * 88} cy="30" r={i === 3 ? 9 : 6} fill={i === 3 ? GOLD : MINT} className={i === 3 ? "ab-pulse" : undefined} />
          <text x={28 + i * 88} y="56" textAnchor="middle" fill={i === 3 ? GOLD : INK} fontSize="12" fontWeight="800">{o}</text>
          <text x={28 + i * 88} y="71" textAnchor="middle" fill={SUB} fontSize="10">{t}</text>
        </g>
      ))}
      {[1, 0.66, 0.33].map((k) => <polygon key={k} points={poly(k)} fill="none" stroke={LINE} />)}
      {labels.map((l, i) => { const [x, y] = pt(i, 1); const [tx, ty] = pt(i, 1.22); return <g key={l}><path d={`M${cx} ${cy}L${x} ${y}`} stroke={LINE} strokeDasharray="2 4" /><text x={tx} y={ty + 4} textAnchor="middle" fill={SUB} fontSize="11" fontWeight="700">{l}</text></g>; })}
      <polygon points={poly(vals)} fill={`${VIOLET}66`} stroke={VIOLET} strokeWidth="2.400" strokeLinejoin="round" className="grow-c" style={{ transformOrigin: `${cx}px ${cy}px`, ...at(1.2) }} />
      {vals.map((v, i) => { const [x, y] = pt(i, v); return <circle key={i} cx={x} cy={y} r="3.500" fill="#fff" className="stg-pop" style={at(1.8 + i * 0.1)} />; })}
    </svg>
  );
}

// 포지셔닝 — 답을 아끼는가 × 설계를 누가 하는가. 오른쪽 위 한 칸이 비어 있었다.
export function PositionArt() {
  const others = [
    { x: 56, y: 70, w: 210, t: "소크라테스형 튜터", d: "답을 아낀다 → 답답해서 떠난다" },
    { x: 70, y: 268, w: 180, t: "AI 탐지기", d: "과정이 아니라 흔적만 본다" },
    { x: 374, y: 268, w: 220, t: "바이브 코딩 도구 · 일반 챗봇", d: "AI가 대신 설계한다" },
  ];
  return (
    <svg viewBox="0 0 640 400" role="img" aria-label="답을 충실히 주면서 설계는 학생이 하는 자리에 틴스파크AI가 있다" className="h-auto w-full min-w-[560px]" style={FONT}>
      <defs><radialGradient id="pos-glow"><stop offset="0" stopColor={MINT} stopOpacity="0.4" /><stop offset="1" stopColor={MINT} stopOpacity="0" /></radialGradient></defs>
      <path d="M320 36v330M40 200h560" stroke={LINE} strokeWidth="2" />
      <path d="M320 36v330M40 200h560" stroke={VIOLET} strokeWidth="2" className="draw" pathLength={1} />
      <text x="320" y="24" textAnchor="middle" fill={INK} fontSize="14" fontWeight="800">▲ 설계를 학생이 직접 한다</text>
      <text x="320" y="390" textAnchor="middle" fill={SUB} fontSize="13" fontWeight="700">▼ 설계는 AI가 한다</text>
      <text x="44" y="190" fill={SUB} fontSize="13" fontWeight="700">◀ 답을 아낀다</text>
      <text x="596" y="190" textAnchor="end" fill={INK} fontSize="13" fontWeight="800">답을 충실히 준다 ▶</text>
      {others.map((o, i) => (
        <g key={o.t} className="stg" style={at(0.4 + i * 0.3)} opacity="0.75">
          <rect x={o.x} y={o.y} width={o.w} height="62" rx="14" fill={SAND} stroke={LINE} strokeWidth="1.500" />
          <text x={o.x + o.w / 2} y={o.y + 27} textAnchor="middle" fill={INK} fontSize="14" fontWeight="800">{o.t}</text>
          <text x={o.x + o.w / 2} y={o.y + 47} textAnchor="middle" fill={SUB} fontSize="11.500">{o.d}</text>
        </g>
      ))}
      <g className="stg-pop" style={at(1.5)}>
        <ellipse cx="470" cy="106" rx="150" ry="80" fill="url(#pos-glow)" className="ab-pulse" />
        <rect x="350" y="58" width="240" height="96" rx="18" fill="#0a261f" stroke={MINT} strokeWidth="2.500" />
        <text x="470" y="96" textAnchor="middle" fill={MINT} fontSize="26" fontWeight="800">teensparkai</text>
        <text x="470" y="119" textAnchor="middle" fill={INK} fontSize="12.500" fontWeight="700">명세와 답은 끝까지 주되,</text>
        <text x="470" y="138" textAnchor="middle" fill={INK} fontSize="12.500" fontWeight="700">판단과 설계는 학생의 언어로 남긴다</text>
      </g>
      <path d="M594 44l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill={GOLD} className="ab-tw" />
    </svg>
  );
}
