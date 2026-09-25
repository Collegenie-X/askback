// 소개 페이지 전용 커스텀 SVG — 색은 askback.css 의 밤하늘 팔레트를 따른다.
// 움직임은 about.css 의 클래스로 준다: .stg(차례로 등장) · .draw(선 그리기) · .grow(자라기) — Reveal 이 화면에 들어올 때 켠다.
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
const PINK = "#f472b6";
const SKY = "#67e8f9";
const ROSE = "#fb7185";
const BLUE = "#4f46e5";

// 선으로 그린 작은 아이콘 한 벌 (24×24). 색은 currentColor 를 따른다.
const GLYPHS: Record<string, ReactNode> = {
  compass: <><circle cx="12" cy="12" r="8.500" /><path d="M15.500 8.500l-2 5-5 2 2-5z" /></>,
  flow: <><rect x="8.500" y="2.500" width="7" height="5" rx="1.500" /><path d="M12 7.500v3M12 10.500l-5.500 3M12 10.500l5.500 3" /><rect x="3" y="13.500" width="7" height="5" rx="1.500" /><rect x="14" y="13.500" width="7" height="5" rx="1.500" /></>,
  blocks: <><rect x="3" y="3.500" width="8" height="7" rx="1.500" /><rect x="13" y="3.500" width="8" height="7" rx="1.500" /><rect x="8" y="13.500" width="8" height="7" rx="1.500" /><path d="M7 10.500v1.500h10v-1.500M12 12v1.500" /></>,
  paper: <><path d="M6.500 3h8l4 4v14h-12z" /><path d="M14.500 3v4h4M9.500 12h6M9.500 15.500h6M9.500 8.500h2" /></>,
  search: <><circle cx="10.500" cy="10.500" r="6.500" /><path d="M15.500 15.500L21 21M8 12.500l2-3 1.500 2 1.500-2.500" /></>,
  clapper: <><path d="M3.500 10h17v10.500h-17z" /><path d="M3.500 10L5 5.500l15.500-2 .5 3.500L3.500 10M8 5.200l2 3.600M13 4.500l2 3.600" /></>,
  browser: <><rect x="3" y="4.500" width="18" height="15" rx="2.500" /><path d="M3 9h18M6 6.800h.01M8.500 6.800h.01M7 13h4v3.500H7zM14 13h3M14 16h3" /></>,
  robot: <><rect x="5" y="8" width="14" height="11" rx="3" /><path d="M12 8V4.500M9.500 13h.01M14.500 13h.01M10 16h4M2.500 12v3M21.500 12v3" /><circle cx="12" cy="3.500" r="1" /></>,
  school: <><path d="M3.500 20.500V10L12 4.500 20.500 10v10.500z" /><path d="M10 20.500v-5h4v5M12 4.500V2.500h3" /></>,
  city: <><path d="M3.500 20.500V9h6v11.500M9.500 20.500V4.500h6.500v16M16 20.500V11h4.500v9.500M2.500 20.500h19" /><path d="M6 12.500h1M6 16h1M12 8.500h1.500M12 12h1.500M12 15.500h1.500" /></>,
  home: <><path d="M3.500 11.500L12 4l8.500 7.500" /><path d="M6 10v10.500h12V10M10 20.500V15h4v5.500" /></>,
  globe: <><circle cx="12" cy="12" r="8.500" /><path d="M3.500 12h17M12 3.500c3 3 3 14 0 17M12 3.500c-3 3-3 14 0 17" /></>,
};

export function Glyph({ name, size = 24 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.700" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
      {GLYPHS[name]}
    </svg>
  );
}

// 단계마다 하나씩 — 고리 두른 작은 행성. 항해의 정거장 표시다.
export function StagePlanet({ color, no, size = 56 }: { color: string; no: string; size?: number }) {
  const id = `sp-${no}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="shrink-0" style={FONT}>
      <defs>
        <radialGradient id={id} cx="0.35" cy="0.3"><stop offset="0" stopColor="#fff" stopOpacity="0.9" /><stop offset="0.35" stopColor={color} /><stop offset="1" stopColor="#07070f" /></radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill={color} opacity="0.12" className="ab-pulse" />
      <ellipse cx="32" cy="32" rx="29" ry="8" fill="none" stroke={color} strokeWidth="1.600" opacity="0.55" transform="rotate(-20 32 32)" />
      <circle cx="32" cy="32" r="17" fill={`url(#${id})`} />
      <path d="M4.700 41.900A29 8 -20 0 0 59.300 22.100" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <text x="32" y="37" textAnchor="middle" fontSize="13" fontWeight="800" fill="#04060f">{no}</text>
      <circle r="2.200" fill="#fff"><animateMotion dur="5s" repeatCount="indefinite" path="M4.700 41.900A29 8 -20 0 0 59.300 22.100A29 8 -20 0 0 4.700 41.900" /></circle>
    </svg>
  );
}

// 작은 순서도 — "흙을 본다 → <400? → 펌프 3초"
export function MiniFlow({ x = 0, y = 0 }: { x?: number; y?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="0" y="8" width="52" height="20" rx="6" fill={SAND} stroke={MINT} />
      <text x="26" y="22" fill={INK} fontSize="10.500" textAnchor="middle">흙을 본다</text>
      <path d="M52 18h14" stroke={MINT} strokeWidth="1.600" className="draw" pathLength={1} />
      <path d="M94 4l24 14-24 14-24-14z" fill={SAND} stroke={MINT} />
      <text x="94" y="22" fill={INK} fontSize="10" textAnchor="middle">&lt;400?</text>
      <path d="M94 32v10" stroke={MINT} strokeWidth="1.600" className="draw" pathLength={1} />
      <rect x="56" y="42" width="76" height="20" rx="6" fill="#0a261f" stroke={MINT} />
      <text x="94" y="56" fill={INK} fontSize="10.500" textAnchor="middle">펌프 3초</text>
    </g>
  );
}

// 히어로 — 글 대신 그림 한 장. “코드 짜줘”가 코치를 지나 되물음이 되고, 설계도 위에서 화분이 자란다.
export interface HeroScene { format: string; ask: string; back: string; expand: string; result: string }
const HERO_DEFAULT: HeroScene = { format: "product", ask: "“코드 짜줘”", back: "“그 400, 왜?”", expand: "“말고 둘 더, 각각 잃는 건?”", result: "📝 네 말로 채운 기획서 한 장" };

// 설계도 위에서 자라는 작품 — 형식마다 다르다. 바닥 중심은 (230, 378).
function HeroPiece({ format }: { format: string }) {
  if (format === "service") return (
    <g>
      <rect x="196" y="282" width="68" height="98" rx="10" fill={CARD} stroke="#60a5fa" strokeWidth="2.200" />
      <rect x="220" y="288" width="20" height="4" rx="2" fill={LINE} />
      <rect x="204" y="300" width="52" height="24" rx="5" fill="#60a5fa33" stroke="#60a5fa" />
      {[0, 1].map((i) => <rect key={i} x={204 + i * 28} y="330" width="24" height="16" rx="4" fill={SAND} className="grow" style={at(0.3 + i * 0.2)} />)}
      <rect x="210" y="354" width="40" height="14" rx="7" fill={MINT} className="ab-tw" />
    </g>
  );
  if (format === "campaign") return (
    <g>
      <rect x="182" y="310" width="96" height="66" rx="8" fill={CARD} stroke="#fb923c" strokeWidth="2.200" />
      <path d="M182 310l6-20 92-8 2 14z" fill="#fb923c" /><path d="M200 289l8 17M226 286l8 18M252 284l8 18" stroke="#0b0b16" strokeWidth="5" />
      <path d="M220 328v30l26-15z" fill="#fb923c" className="ab-pulse" />
    </g>
  );
  if (format === "research") return (
    <g>
      <path d="M186 376h88" stroke={SUB} strokeWidth="2" strokeLinecap="round" />
      {[34, 58, 24, 46].map((hh, i) => <rect key={i} x={192 + i * 20} y={376 - hh} width="14" height={hh} rx="3" fill={i === 1 ? GOLD : MINT} className="grow" style={at(0.2 + i * 0.18)} />)}
      <g className="ab-float"><circle cx="262" cy="300" r="17" fill="#0b0b1699" stroke="#4ade80" strokeWidth="3" /><path d="M274 313l14 15" stroke="#4ade80" strokeWidth="4.500" strokeLinecap="round" /></g>
    </g>
  );
  if (format === "paper") return (
    <g>
      <path d="M192 284h56l20 20v74h-76z" fill={CARD} stroke="#c084fc" strokeWidth="2.200" strokeLinejoin="round" />
      <path d="M248 284v20h20" fill="#2a1030" stroke="#c084fc" strokeWidth="2.200" strokeLinejoin="round" />
      <path d="M202 312h34" stroke="#c084fc" strokeWidth="4" strokeLinecap="round" className="draw" pathLength={1} />
      {[0, 1, 2, 3].map((i) => <path key={i} d={`M202 ${328 + i * 11}h${[56, 48, 56, 36][i]}`} stroke={INK} strokeWidth="2.200" strokeLinecap="round" opacity="0.7" className="draw" pathLength={1} style={at(0.3 + i * 0.15)} />)}
    </g>
  );
  return (
    <g>
      <g className="grow">
        <path d="M230 336c-2-22 2-34 0-52" fill="none" stroke={MINT} strokeWidth="4" strokeLinecap="round" />
        <path d="M230 306c-22 2-34-10-36-28 20-2 34 8 36 28z" fill={MINT} />
        <path d="M230 292c20 0 34-12 34-32-20 0-34 12-34 32z" fill="#6ee7b7" />
      </g>
      <rect x="200" y="332" width="60" height="12" rx="5" fill="#fed7aa" />
      <path d="M205 344h50l-7 34h-36z" fill="url(#ha-pot)" />
      <circle cx="241" cy="360" r="3.500" fill={MINT} className="sc-dot" />
      {[0, 1].map((i) => <circle key={i} cx={216 + i * 9} cy={322} r="2.200" fill={SKY} className="fa-drop" style={at(i * 0.6)} />)}
    </g>
  );
}

// 히어로 그림 — 과정에서 결과로 올라가는 다섯 걸음. scene 이 바뀌면 각 걸음의 예시와 맨 위 결과 카드가 함께 바뀐다.
interface HeroStop {
  n: string;
  x: number;
  y: number;
  color: string;
  title: string;
  line: string;
  lx: number;
  icon: ReactNode;
}

// 걸음 옆에 붙는 작은 팻말 — 걸음 이름 한 줄, 그 장면의 예시 한 줄.
function StopLabel({ stop }: { stop: HeroStop }) {
  const big = stop.line.length <= 12;
  return (
    <g transform={`translate(${stop.lx} ${stop.y - 21})`}>
      <rect width="212" height="42" rx="12" fill={CARD} stroke={stop.color} strokeWidth="1.400" opacity="0.96" />
      <rect width="3.500" height="42" rx="1.800" fill={stop.color} />
      <text x="14" y="17" fill={stop.color} fontSize="11" fontWeight="800">{stop.n} · {stop.title}</text>
      <text key={stop.line} x="14" y="33" fill={INK} fontSize={big ? 13 : 11.5} fontWeight="800" className="swap">{stop.line}</text>
    </g>
  );
}

export function HeroArt({ scene = HERO_DEFAULT }: { scene?: HeroScene }) {
  const code = scene.format === "product" || scene.format === "service";
  const stops: HeroStop[] = [
    {
      n: "1", x: 62, y: 430, color: BLUE, title: "막연한 요청", line: scene.ask, lx: 100,
      icon: code
        ? <path d="M-8-5l-6 5 6 5M8-5l6 5-6 5M3-9l-6 18" />
        : <><rect x="-11" y="-8" width="22" height="16" rx="4" /><path d="M-6-2h12M-6 3h7" /></>,
    },
    {
      n: "2", x: 150, y: 352, color: GOLD, title: "코치가 되묻고", line: scene.back, lx: 188,
      icon: <><path d="M-11-9h22v15h-13l-6 6v-6h-3z" /><path d="M-3-3.500a3.200 3.200 0 1 1 3.200 3.200v1.800" /><path d="M0.200 4.200h.01" /></>,
    },
    {
      n: "3", x: 232, y: 272, color: SKY, title: "한 번 더 넓히고", line: scene.expand, lx: 8,
      icon: <><circle r="4" /><path d="M-11-11l5.500 5.500M11-11l-5.500 5.500M-11 11l5.500-5.500M11 11l-5.500-5.500" /><path d="M-12-6v-6h6M12-6v-6h-6M-12 6v6h6M12 6v6h-6" /></>,
    },
    {
      n: "4", x: 312, y: 194, color: MINT, title: "내 말로 설계", line: "선택 · 이유 · 뺀 것", lx: 72,
      icon: <><rect x="-11" y="-10" width="22" height="20" rx="3.500" /><path d="M-6-4l2.500 2.500L1-6" /><path d="M4-4h5M-6 5h15" /></>,
    },
  ];
  return (
    <svg viewBox="0 0 460 500" role="img" aria-label={`막연한 요청에서 시작해 코치의 되물음과 확장을 거쳐 내 말로 설계하고 ${scene.result} 가 남는 다섯 걸음 그림`} className="h-auto w-full" style={FONT}>
      <defs>
        <linearGradient id="ha-trail" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor={BLUE} /><stop offset="0.5" stopColor={GOLD} /><stop offset="1" stopColor={PINK} /></linearGradient>
        <radialGradient id="ha-glow"><stop offset="0" stopColor="#a78bfa" stopOpacity="0.45" /><stop offset="1" stopColor="#a78bfa" stopOpacity="0" /></radialGradient>
        <radialGradient id="ha-end"><stop offset="0" stopColor={PINK} stopOpacity="0.55" /><stop offset="1" stopColor={PINK} stopOpacity="0" /></radialGradient>
        <linearGradient id="ha-doc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1b1430" /><stop offset="1" stopColor={CARD} /></linearGradient>
      </defs>

      {[[30, 22], [432, 20], [440, 250], [24, 236], [230, 14], [60, 460], [410, 470]].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y - 5}l1.500 3.500 3.500 1.500-3.500 1.500-1.500 3.500-1.500-3.500-3.500-1.500 3.500-1.500z`} fill={i % 2 ? "#ffd98a" : "#c7d2fe"} className="ab-tw" style={at(i * 0.5)} />
      ))}

      {/* 과정 → 결과로 오르는 길 */}
      <ellipse cx="62" cy="430" rx="120" ry="50" fill="url(#ha-glow)" opacity="0.55" />
      <path d="M62 430L150 352L232 272L312 194L386 118" fill="none" stroke="url(#ha-trail)" strokeWidth="3" strokeLinecap="round" strokeDasharray="7 9" className="ab-dash" opacity="0.85" />
      <circle r="4.500" fill="#fff"><animateMotion dur="4.600s" repeatCount="indefinite" path="M62 430L150 352L232 272L312 194L386 118" /></circle>

      {/* 왼쪽 아래는 과정, 오른쪽 위는 결과 */}
      <text x="12" y="488" fill={SUB} fontSize="11.500" fontWeight="800">과정</text>
      <path d="M46 484h18" stroke={SUB} strokeWidth="1.400" strokeDasharray="2 4" />
      <text x="418" y="36" fill={PINK} fontSize="11.500" fontWeight="800" textAnchor="end">결과</text>

      {/* 네 걸음 — 동그란 정거장과 팻말 */}
      {stops.map((s, i) => (
        <g key={s.n} className="stg" style={at(0.2 + i * 0.35)}>
          <StopLabel stop={s} />
          <circle cx={s.x} cy={s.y} r="27" fill={CARD} stroke={s.color} strokeWidth="2" />
          <circle cx={s.x} cy={s.y} r="27" fill={s.color} opacity="0.14" className="ab-pulse" style={at(i * 0.4)} />
          <g transform={`translate(${s.x} ${s.y})`} fill="none" stroke={s.color} strokeWidth="1.800" strokeLinecap="round" strokeLinejoin="round">{s.icon}</g>
          <circle cx={s.x + 21} cy={s.y - 21} r="9.500" fill={s.color} />
          <text x={s.x + 21} y={s.y - 17} fill="#04060f" fontSize="11" fontWeight="800" textAnchor="middle">{s.n}</text>
        </g>
      ))}

      {/* 다섯 걸음째 — 남는 것 */}
      <g className="stg" style={at(1.6)}>
        <circle cx="386" cy="118" r="60" fill="url(#ha-end)" className="ab-pulse" />
        <circle cx="386" cy="118" r="30" fill={CARD} stroke={PINK} strokeWidth="2.200" />
        <ellipse cx="386" cy="118" rx="44" ry="12" fill="none" stroke={GOLD} strokeWidth="1.500" opacity="0.75" transform="rotate(-20 386 118)" />
        <g transform="translate(386 118)" fill="none" stroke={PINK} strokeWidth="1.800" strokeLinecap="round" strokeLinejoin="round">
          <path d="M-9-12h11l7 7v17h-18z" /><path d="M2-12v7h7M-5 1h10M-5 6h10" />
        </g>
        <circle cx="407" cy="97" r="9.500" fill={PINK} />
        <text x="407" y="101" fill="#04060f" fontSize="11" fontWeight="800" textAnchor="middle">5</text>

        {/* 결과 카드 — 그 장면의 작품과 남는 한 줄 */}
        <g className="ab-float" style={at(0.6)}>
          <rect x="24" y="56" width="268" height="94" rx="16" fill="url(#ha-doc)" stroke={PINK} strokeWidth="1.600" />
          <g transform="translate(-68.600 -94.400) scale(0.620)">
            <g key={scene.format} className="swap" style={at(0.9)}><HeroPiece format={scene.format} /></g>
          </g>
          <text x="128" y="84" fill={SUB} fontSize="11" fontWeight="800">남는 것</text>
          <text key={scene.result} x="128" y="107" fill="#fbcfe8" fontSize={scene.result.length > 13 ? 11.500 : 13} fontWeight="800" className="swap" style={at(1.2)}>{scene.result}</text>
          <path d="M128 120h140" stroke={LINE} strokeWidth="1.200" />
          <text x="128" y="138" fill={MINT} fontSize="10.500" fontWeight="800">내가 고른 이유까지 함께</text>
        </g>
        <path d="M296 108c28-2 42 2 56 6" fill="none" stroke={PINK} strokeWidth="1.600" strokeDasharray="2 5" />
      </g>
    </svg>
  );
}

// 누구를 위한 것인가 — 네 고객군의 얼굴
export function PersonaArt({ who }: { who: "student" | "teacher" | "parent" | "school" }) {
  const face = (cx: number, cy: number, r: number, hair: string) => (
    <>
      <circle cx={cx} cy={cy} r={r} fill="#ffd9b8" />
      <path d={`M${cx - r} ${cy - 1}a${r} ${r} 0 0 1 ${2 * r} 0c-${r * 0.7}-${r * 0.2}-${r * 1.2}-${r * 0.7}-${r * 1.4}-${r * 0.9}-${r * 0.2} ${r * 0.5}-${r * 0.4} ${r * 0.8}-${r * 0.6} ${r * 0.9}z`} fill={hair} />
      <g className="ab-blink"><circle cx={cx - r * 0.35} cy={cy + r * 0.15} r={r * 0.09} fill="#2a1a4a" /><circle cx={cx + r * 0.35} cy={cy + r * 0.15} r={r * 0.09} fill="#2a1a4a" /></g>
      <path d={`M${cx - r * 0.25} ${cy + r * 0.5}q${r * 0.25} ${r * 0.22} ${r * 0.5} 0`} fill="none" stroke="#2a1a4a" strokeWidth="1.300" strokeLinecap="round" />
    </>
  );
  return (
    <svg viewBox="0 0 160 110" aria-hidden className="h-auto w-full" style={FONT}>
      {who === "student" && (
        <>
          <ellipse cx="62" cy="100" rx="40" ry="5" fill="#000" opacity="0.3" />
          <g className="ab-float">
            <rect x="40" y="70" width="44" height="30" rx="14" fill="#eef0ff" />
            <circle cx="62" cy="48" r="30" fill="#eef0ff" stroke="#c7d2fe" strokeWidth="1.500" />
            <ellipse cx="62" cy="50" rx="23" ry="21" fill="#1e1b4b" />
            {face(62, 53, 16, "#3b2a1e")}
            <path d="M44 40q6-11 18-12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
            <rect x="28" y="42" width="8" height="16" rx="4" fill={GOLD} /><rect x="88" y="42" width="8" height="16" rx="4" fill={GOLD} />
          </g>
          <g className="stg-pop" style={at(0.5)}>
            <path d="M104 14h40a8 8 0 0 1 8 8v20a8 8 0 0 1-8 8h-24l-10 9v-9h-6a8 8 0 0 1-8-8V22a8 8 0 0 1 8-8z" fill={BLUE} stroke="#818cf8" />
            <text x="124" y="38" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="800">코드 짜줘</text>
          </g>
          <g className="stg-pop" style={at(1.3)}>
            <rect x="106" y="66" width="46" height="24" rx="12" fill="#2a2108" stroke={GOLD} />
            <text x="129" y="83" textAnchor="middle" fill={GOLD} fontSize="12" fontWeight="800">왜 400?</text>
          </g>
        </>
      )}
      {who === "teacher" && (
        <>
          <ellipse cx="56" cy="102" rx="36" ry="5" fill="#000" opacity="0.3" />
          <path d="M26 104c0-22 12-34 30-34s30 12 30 34z" fill="#6c5ce7" />
          {face(56, 46, 22, "#2a1a4a")}
          <g fill="none" stroke="#2a1a4a" strokeWidth="1.600"><circle cx="48" cy="49" r="6" /><circle cx="64" cy="49" r="6" /><path d="M54 49h4" /></g>
          <g className="ab-float">
            <rect x="96" y="18" width="56" height="74" rx="8" fill={CARD} stroke="#6c5ce7" strokeWidth="1.500" />
            <rect x="112" y="13" width="24" height="10" rx="4" fill="#6c5ce7" />
            {[0, 1, 2, 3].map((i) => (
              <g key={i} transform={`translate(104 ${32 + i * 14})`}>
                <circle cx="4" cy="4" r="4" fill="#ffd9b8" />
                <rect x="12" y="1" width="30" height="6" rx="3" fill={SAND} />
                <rect x="12" y="1" width={[30, 22, 8, 15][i]} height="6" rx="3" fill={[MINT, MINT, ROSE, GOLD][i]} className="grow-x" style={at(0.4 + i * 0.2)} />
              </g>
            ))}
          </g>
        </>
      )}
      {who === "parent" && (
        <>
          <ellipse cx="60" cy="102" rx="46" ry="5" fill="#000" opacity="0.3" />
          <path d="M14 104c0-20 11-31 27-31s27 11 27 31z" fill="#22a06b" />
          {face(41, 50, 20, "#5a3a22")}
          <path d="M62 104c0-14 8-22 19-22s19 8 19 22z" fill={BLUE} />
          {face(81, 66, 14, "#3b2a1e")}
          <g className="ab-float">
            <rect x="104" y="20" width="50" height="46" rx="8" fill={CARD} stroke="#22a06b" strokeWidth="1.500" />
            <path d="M111 56l10-8 9 4 16-20" fill="none" stroke={MINT} strokeWidth="2.400" strokeLinecap="round" strokeLinejoin="round" className="draw" pathLength={1} />
            <circle cx="146" cy="32" r="3.500" fill={GOLD} className="stg-pop" style={at(1.4)} />
            <text x="129" y="80" textAnchor="middle" fill={SUB} fontSize="10" fontWeight="700">첫 질문 → 지금</text>
          </g>
        </>
      )}
      {who === "school" && (
        <>
          <ellipse cx="66" cy="102" rx="54" ry="5" fill="#000" opacity="0.3" />
          <path d="M16 100V52l50-30 50 30v48z" fill={CARD} stroke={SKY} strokeWidth="1.500" strokeLinejoin="round" />
          <path d="M66 22V8" stroke={SKY} strokeWidth="1.800" strokeLinecap="round" />
          <path d="M66 8h16l-4 5 4 5H66z" fill={GOLD} className="ab-wave" />
          <circle cx="66" cy="48" r="8" fill="none" stroke={SKY} strokeWidth="1.500" /><path d="M66 43v5l3 2" fill="none" stroke={SKY} strokeWidth="1.500" strokeLinecap="round" />
          {[28, 50, 72, 94].map((x, i) => <rect key={x} x={x} y="66" width="10" height="12" rx="2" fill={i % 2 ? "#ffd98a" : SAND} className={i % 2 ? "ab-tw" : undefined} />)}
          <rect x="58" y="82" width="16" height="18" rx="2" fill={SAND} stroke={SKY} />
          <g className="ab-float">
            <path d="M118 30h24l8 8v34h-32z" fill="#0a261f" stroke={MINT} strokeWidth="1.500" strokeLinejoin="round" />
            <path d="M124 48l4 4 8-9M124 62h18" fill="none" stroke={MINT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="draw" pathLength={1} />
          </g>
        </>
      )}
    </svg>
  );
}

// 왜 필요한가 — 여덟 장면. 왼쪽이 지금의 빈칸, 오른쪽(또는 밝은 쪽)이 AskBack의 장치.
export function SceneArt({ name }: { name: string }) {
  const art: Record<string, ReactNode> = {
    copy: (
      <>
        <rect x="14" y="30" width="50" height="28" rx="7" fill="none" stroke={ROSE} strokeDasharray="3 3" transform="translate(6 -7)" />
        <rect x="14" y="30" width="50" height="28" rx="7" fill="#2a0f16" stroke={ROSE} />
        <text x="39" y="50" textAnchor="middle" fill={ROSE} fontSize="15" fontWeight="800">400?</text>
        <path d="M92 72a30 30 0 0 1 60 0" fill="none" stroke={LINE} strokeWidth="7" strokeLinecap="round" />
        <path d="M92 72a30 30 0 0 1 60 0" fill="none" stroke={MINT} strokeWidth="7" strokeLinecap="round" className="draw" pathLength={1} />
        <g className="sc-swing" style={{ transformOrigin: "122px 72px" }}><path d="M122 72V48" stroke={GOLD} strokeWidth="3" strokeLinecap="round" /></g>
        <circle cx="122" cy="72" r="4.500" fill={GOLD} />
        <text x="92" y="87" textAnchor="middle" fill={SUB} fontSize="10" fontWeight="700">320</text>
        <text x="152" y="87" textAnchor="middle" fill={SUB} fontSize="10" fontWeight="700">610</text>
      </>
    ),
    bomb: (
      <>
        {Array.from({ length: 10 }, (_, i) => {
          const on = i < 3;
          return <rect key={i} x={16 + (i % 5) * 27} y={i < 5 ? 18 : 50} width="21" height="21" rx="5" fill={on ? "#0a261f" : "none"} stroke={on ? MINT : ROSE} strokeDasharray={on ? undefined : "3 3"} opacity={on ? 1 : 0.55} className={on ? "stg-pop" : "ab-tw"} style={at(on ? 0.3 + i * 0.25 : i * 0.3)} />;
        })}
        {[0, 1, 2].map((i) => <text key={i} x={26.500 + i * 27} y="33.500" textAnchor="middle" fill={MINT} fontSize="12" fontWeight="800">{i + 1}</text>)}
        <text x="150" y="80" textAnchor="end" fill={SUB} fontSize="10" fontWeight="700">첫 버전은 셋만</text>
      </>
    ),
    mute: (
      <>
        <g className="sc-spin" style={{ transformOrigin: "40px 48px" }}>
          <circle cx="40" cy="48" r="17" fill="none" stroke={SUB} strokeWidth="7" strokeDasharray="6.700 6.700" />
          <circle cx="40" cy="48" r="12" fill={SAND} stroke={SUB} strokeWidth="2" />
        </g>
        <path d="M76 22h64a8 8 0 0 1 8 8v30a8 8 0 0 1-8 8h-44l-12 10V68a8 8 0 0 1-8-8V30a8 8 0 0 1 8-8z" fill={CARD} stroke={PINK} />
        <text x="84" y="40" fill={PINK} fontSize="10" fontWeight="800">🧭 센서가 빠지면?</text>
        {[0, 1, 2].map((i) => <circle key={i} cx={96 + i * 14} cy="54" r="3.500" fill={INK} className="sc-dot" style={at(i * 0.25)} />)}
      </>
    ),
    redo: (
      <>
        {[0, 1, 2, 3].map((i) => <rect key={i} x="22" y={66 - i * 17} width="44" height="15" rx="4" fill={i === 1 ? "#2a0f16" : SAND} stroke={i === 1 ? ROSE : LINE} />)}
        <path d="M38 52l5 4-3 4 6 3" fill="none" stroke={ROSE} strokeWidth="1.600" strokeLinecap="round" />
        <circle cx="44" cy="56.500" r="15" fill="none" stroke={GOLD} strokeWidth="2" className="ab-pulse" />
        <g transform="translate(96 22)" fill="none" stroke={MINT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="0" y="0" width="52" height="50" rx="8" fill={CARD} stroke={LINE} />
          <text x="8" y="15" fill={MINT} stroke="none" fontSize="9.500" fontWeight="800">확인하는 법</text>
          {[0, 1, 2].map((i) => <path key={i} d={`M8 ${25 + i * 9}l2.500 2.500 4.500-5M20 ${26 + i * 9}h24`} className="draw" pathLength={1} style={at(0.4 + i * 0.4)} />)}
        </g>
      </>
    ),
    chip: (
      <>
        <g opacity="0.4">
          <rect x="98" y="24" width="40" height="40" rx="8" fill="none" stroke={SUB} strokeWidth="2" />
          <path d="M108 14v10M118 14v10M128 14v10M108 64v10M118 64v10M128 64v10M88 34h10M88 44h10M88 54h10M138 34h10M138 44h10M138 54h10" stroke={SUB} strokeWidth="2" strokeLinecap="round" />
          <text x="118" y="49" textAnchor="middle" fill={SUB} fontSize="13" fontWeight="800">AI</text>
        </g>
        <text x="118" y="88" textAnchor="middle" fill={SUB} fontSize="9.500" fontWeight="700">나중에</text>
        <g className="ab-float">
          <rect x="10" y="26" width="72" height="38" rx="9" fill="#2a2108" stroke={GOLD} strokeWidth="1.500" />
          <text x="46" y="42" textAnchor="middle" fill={GOLD} fontSize="9.500" fontWeight="800">규칙 먼저</text>
          <text x="46" y="57" textAnchor="middle" fill={INK} fontSize="10.500" fontWeight="700">3명↑ → 확정</text>
        </g>
      </>
    ),
    judge: (
      <>
        <rect x="46" y="40" width="68" height="28" rx="14" fill={SAND} stroke={LINE} />
        <g className="sc-slide"><circle cx="60" cy="54" r="11" fill={GOLD} /><path d="M55 54l4 4 7-8" fill="none" stroke="#04060f" strokeWidth="2.200" strokeLinecap="round" strokeLinejoin="round" /></g>
        <rect x="8" y="38" width="30" height="28" rx="8" fill="none" stroke={SUB} strokeWidth="1.600" /><circle cx="18" cy="50" r="2" fill={SUB} /><circle cx="28" cy="50" r="2" fill={SUB} /><path d="M18 58h10M23 38v-6" stroke={SUB} strokeWidth="1.600" strokeLinecap="round" />
        <circle cx="137" cy="52" r="15" fill="#ffd9b8" /><path d="M122 51a15 15 0 0 1 30 0c-8-1-14-4-18-9-3 5-7 8-12 9z" fill="#3b2a1e" /><circle cx="132" cy="55" r="1.600" fill="#2a1a4a" /><circle cx="142" cy="55" r="1.600" fill="#2a1a4a" />
        <text x="80" y="26" textAnchor="middle" fill={GOLD} fontSize="10.500" fontWeight="800">🫵 정하는 건 너</text>
      </>
    ),
    nodoc: (
      <>
        {[0, 1, 2].map((i) => <rect key={i} x={i % 2 ? 22 : 10} y={16 + i * 22} width="46" height="16" rx="8" fill={i % 2 ? SAND : BLUE} className="sc-fade" style={at(i * 0.6)} />)}
        <path d="M76 46h16" stroke={SUB} strokeWidth="2" strokeLinecap="round" strokeDasharray="1 5" /><path d="M90 41l6 5-6 5" fill="none" stroke={SUB} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M104 12h32l12 12v56h-44z" fill="#2a1030" stroke={PINK} strokeWidth="1.500" strokeLinejoin="round" />
        <text x="110" y="28" fill={PINK} fontSize="9" fontWeight="800">.md</text>
        {[0, 1, 2, 3].map((i) => <path key={i} d={`M110 ${38 + i * 10}h${[30, 24, 30, 18][i]}`} stroke={i < 2 ? MINT : PINK} strokeWidth="3" strokeLinecap="round" className="draw" pathLength={1} style={at(0.3 + i * 0.35)} />)}
      </>
    ),
    clock: (
      <>
        <text x="10" y="22" fill={SUB} fontSize="9.500" fontWeight="700">학기 말에 한 번</text>
        <path d="M10 34h140" stroke={LINE} strokeWidth="3" strokeLinecap="round" />
        <circle cx="146" cy="34" r="6" fill={ROSE} />
        <text x="10" y="62" fill={GOLD} fontSize="9.500" fontWeight="800">질문 10개마다</text>
        <path d="M10 74h140" stroke={LINE} strokeWidth="3" strokeLinecap="round" />
        {[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={24 + i * 30} cy="74" r="6" fill={GOLD} className="sc-tick" style={at(i * 0.5)} />)}
      </>
    ),
  };
  return <svg viewBox="0 0 160 92" aria-hidden className="h-auto w-full" style={FONT}>{art[name]}</svg>;
}

// 큰 흐름 — 물결 위의 네온 정거장. 묻는다 → 되물음에 답한다 → 적는다 → 도구 → 돌아가는 것. 빛이 길을 따라 흐른다.
export function ThreeStepArt() {
  const wave = "M100 170C200 170 200 90 300 90S400 170 500 170S600 90 700 90S800 170 900 170";
  const nodes = [
    { x: 100, y: 170, c: "#a78bfa", t: "1. 묻는다", d: "어떤 폭이든 평소처럼" },
    { x: 300, y: 90, c: "#22d3ee", t: "2. 되물음에 답한다", d: "직접 재 온 값 · 내 기준" },
    { x: 500, y: 170, c: "#fbbf24", t: "3. 적는다", d: "내 말로 채운 기획서.md" },
    { x: 700, y: 90, c: "#22d3ee", t: "도구에 붙여넣는다", d: "코딩 · 영상 · 문서 도구" },
    { x: 900, y: 170, c: "#34d399", t: "돌아가는 것", d: "설명할 수 있는 작품" },
  ];
  return (
    <svg viewBox="0 0 1000 330" role="img" aria-label="묻는다, 되물음에 답한다, 적는다 세 단계를 지나 도구로 넘어가고, 써 보고 터진 문제는 다시 질문으로 돌아온다" className="h-auto w-full min-w-[760px]" style={FONT}>
      <defs>
        <linearGradient id="ts-wave" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#a78bfa" /><stop offset="0.25" stopColor="#22d3ee" /><stop offset="0.5" stopColor="#fbbf24" /><stop offset="0.75" stopColor="#22d3ee" /><stop offset="1" stopColor="#34d399" /></linearGradient>
        <filter id="ts-blur" x="-10%" y="-60%" width="120%" height="220%"><feGaussianBlur stdDeviation="7" /></filter>
      </defs>
      <path d={wave} fill="none" stroke="url(#ts-wave)" strokeWidth="12" strokeLinecap="round" opacity="0.4" filter="url(#ts-blur)" />
      <path d={wave} fill="none" stroke="url(#ts-wave)" strokeWidth="3.500" strokeLinecap="round" className="draw" pathLength={1} />
      <path d={wave} fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.55" className="wave-flow" />
      {[0, 1.700, 3.400].map((b) => <circle key={b} r="5" fill="#fff" className="neon"><animateMotion dur="5s" begin={`${b}s`} repeatCount="indefinite" path={wave} /></circle>)}

      {nodes.map((n, i) => (
        <g key={n.t} className="stg" style={at(0.3 + i * 0.35)}>
          <circle cx={n.x} cy={n.y} r="46" fill={n.c} opacity="0.14" className="ab-pulse" style={at(i * 0.5)} />
          <circle cx={n.x} cy={n.y} r="34" fill="#0b0b16" stroke={n.c} strokeWidth="2.500" className="neon" style={{ ["--neon" as string]: `${n.c}88` }} />
          <text x={n.x} y={n.y + 68} textAnchor="middle" fill="#fff" fontSize="17" fontWeight="800">{n.t}</text>
          <text x={n.x} y={n.y + 88} textAnchor="middle" fill={SUB} fontSize="12.500">{n.d}</text>
        </g>
      ))}
      {/* 1 말풍선 */}
      <g className="ab-float"><path d="M82 154h36a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H98l-8 7v-7h-8a6 6 0 0 1-6-6v-14a6 6 0 0 1 6-6z" fill="#a78bfa" /><text x="100" y="174" textAnchor="middle" fill="#0b0b16" fontSize="15" fontWeight="800">?</text></g>
      {/* 2 돌아오는 화살표 */}
      <g fill="none" stroke="#22d3ee" strokeWidth="3.600" strokeLinecap="round" strokeLinejoin="round"><path d="M294 80l-10 10 10 10" /><path d="M284 90h22a10 10 0 0 1 0 20h-6" transform="translate(0 -5)" /></g>
      {/* 3 문서 */}
      <g><path d="M486 150h20l9 9v31h-29z" fill="#2a2108" stroke="#fbbf24" strokeWidth="2" strokeLinejoin="round" /><path d="M492 167l3 3 5-6M492 179l3 3 5-6M504 169h6M504 181h6" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></g>
      {/* 도구 */}
      <g><rect x="684" y="76" width="32" height="22" rx="4" fill="none" stroke="#22d3ee" strokeWidth="2.200" /><path d="M678 104h44" stroke="#22d3ee" strokeWidth="2.400" strokeLinecap="round" /><text x="700" y="92" textAnchor="middle" fill="#22d3ee" fontSize="10" fontWeight="800">&lt;/&gt;</text></g>
      {/* 로켓 */}
      <g className="ab-float"><path d="M900 148c9 7 12 18 9 31h-18c-3-13 0-24 9-31z" fill="#ecfdf5" /><circle cx="900" cy="164" r="4" fill="#059669" /><path d="M891 176l-6 8 8-2M909 176l6 8-8-2" fill="#fb7185" /><path d="M897 181l3 10 3-10z" fill="#fbbf24" className="ab-tw" /></g>

      {/* 되돌아오는 길 */}
      <path d="M900 276C900 322 100 322 100 276" fill="none" stroke="#fbbf24" strokeWidth="1.800" strokeDasharray="2 8" strokeLinecap="round" opacity="0.8" />
      <circle r="4.500" fill="#fbbf24" className="neon" style={{ ["--neon" as string]: "#fbbf2488" }}><animateMotion dur="6s" repeatCount="indefinite" path="M900 276C900 322 100 322 100 276" /></circle>
      <text x="500" y="302" textAnchor="middle" fill="#fbbf24" fontSize="13.500" fontWeight="700">↺ 써 보고 터진 문제는 다시 질문으로 — 작게 시작해서 한 단씩</text>
    </svg>
  );
}

// 다섯 형식 — 형식마다 "알고리즘"이 다른 모양이다
export function FormatArt({ name, color }: { name: string; color: string }) {
  const box = (x: number, y: number, w: number, t: string, c = color, d = 0) => (
    <g className="stg" style={at(d)}>
      <rect x={x} y={y} width={w} height="30" rx="9" fill={`${c}22`} stroke={c} strokeWidth="1.500" />
      <text x={x + w / 2} y={y + 20} textAnchor="middle" fill={INK} fontSize="12.500" fontWeight="700">{t}</text>
    </g>
  );
  const wire = (d: string, delay = 0) => (
    <>
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" className="draw" pathLength={1} style={at(delay)} />
      <circle r="3.500" fill="#fff"><animateMotion dur="2.400s" begin={`${delay}s`} repeatCount="indefinite" path={d} /></circle>
    </>
  );
  const art: Record<string, ReactNode> = {
    paper: (
      <>
        <text x="170" y="20" textAnchor="middle" fill={SUB} fontSize="11.500" fontWeight="700">논증 구조 — 주장 · 근거 · 반론</text>
        {box(120, 32, 100, "주장 한 줄", color, 0.2)}
        {wire("M170 62v14M170 76H70v14", 0.5)}{wire("M170 76v14", 0.6)}{wire("M170 76h100v14", 0.7)}
        {box(24, 90, 92, "근거 1", color, 0.8)}{box(124, 90, 92, "근거 2", color, 0.9)}{box(224, 90, 92, "예상 반론", PINK, 1)}
        <text x="170" y="150" textAnchor="middle" fill={SUB} fontSize="11.500" fontWeight="700">확인 절차</text>
        {["바꾸는 것", "재는 것", "비교 기준"].map((t, i) => <g key={t}>{box(24 + i * 100, 158, 92, t, MINT, 1.2 + i * 0.25)}{i < 2 && <text x={120 + i * 100} y="178" textAnchor="middle" fill={MINT} fontSize="13">→</text>}</g>)}
      </>
    ),
    research: (
      <>
        {["수집", "정리", "비교"].map((t, i) => <text key={t} x={62 + i * 108} y="22" textAnchor="middle" fill={color} fontSize="13" fontWeight="800">{i + 1}. {t}</text>)}
        <g className="stg" style={at(0.2)}>{Array.from({ length: 12 }, (_, i) => <circle key={i} cx={32 + (i % 4) * 20} cy={52 + Math.floor(i / 4) * 22} r="7" fill={i % 5 === 2 ? color : SAND} stroke={color} />)}</g>
        {wire("M106 74h20", 0.5)}
        <g className="stg" style={at(0.7)}><rect x="132" y="38" width="76" height="72" rx="8" fill={CARD} stroke={color} />{[0, 1, 2].map((i) => <path key={i} d={`M132 ${56 + i * 18}h76`} stroke={color} opacity="0.5" />)}<path d="M158 38v72M184 38v72" stroke={color} opacity="0.5" /></g>
        {wire("M214 74h20", 1)}
        <g className="stg" style={at(1.2)}><path d="M244 110h72" stroke={SUB} strokeWidth="1.500" />{[44, 66, 30].map((h, i) => <rect key={i} x={250 + i * 22} y={110 - h} width="16" height={h} rx="3" fill={i === 1 ? GOLD : color} className="grow" style={at(1.4 + i * 0.2)} />)}</g>
        <rect x="24" y="140" width="292" height="44" rx="12" fill="#2a2108" stroke={GOLD} className="stg" style={at(1.8)} />
        <text x="170" y="167" textAnchor="middle" fill={GOLD} fontSize="12.500" fontWeight="700" className="stg" style={at(1.9)}>🙋 “이 결과로 누가 무엇을 다르게 결정해?”</text>
      </>
    ),
    campaign: (
      <>
        <text x="170" y="22" textAnchor="middle" fill={SUB} fontSize="11.500" fontWeight="700">30초의 흐름 — 콘티 4컷</text>
        <rect x="12" y="34" width="316" height="96" rx="8" fill="#07070f" stroke={LINE} />
        {Array.from({ length: 14 }, (_, i) => <g key={i}><rect x={20 + i * 22} y="39" width="10" height="6" rx="1.500" fill={LINE} /><rect x={20 + i * 22} y="119" width="10" height="6" rx="1.500" fill={LINE} /></g>)}
        {[["붙잡기", "!"], ["공감", "♥"], ["메시지", "“ ”"], ["행동 요청", "☞"]].map(([t, s], i) => (
          <g key={t} className="stg" style={at(0.2 + i * 0.3)}>
            <rect x={22 + i * 76} y="52" width="68" height="60" rx="6" fill={`${color}22`} stroke={color} strokeWidth="1.500" />
            <text x={56 + i * 76} y="80" textAnchor="middle" fill={color} fontSize="20" fontWeight="800">{s}</text>
            <text x={56 + i * 76} y="104" textAnchor="middle" fill={INK} fontSize="11" fontWeight="700">{t}</text>
          </g>
        ))}
        <g className="fa-play"><path d="M22 46v72" stroke="#fff" strokeWidth="2" /><path d="M17 44h10l-5 7z" fill="#fff" /></g>
        <text x="170" y="156" textAnchor="middle" fill={INK} fontSize="13" fontWeight="700">본 사람이 바꿀 행동은 딱 하나</text>
        <text x="170" y="176" textAnchor="middle" fill={SUB} fontSize="11.500">“4컷 중 하나를 뺀다면? 그 컷의 역할은?”</text>
      </>
    ),
    service: (
      <>
        <text x="170" y="22" textAnchor="middle" fill={SUB} fontSize="11.500" fontWeight="700">처리 규칙 — 입력 → 조건 → 결과</text>
        {["입력", "조건", "결과"].map((t, i) => (
          <g key={t} className="stg" style={at(0.2 + i * 0.4)}>
            <rect x={28 + i * 108} y="34" width="68" height="116" rx="12" fill={CARD} stroke={color} strokeWidth="1.500" />
            <rect x={52 + i * 108} y="40" width="20" height="4" rx="2" fill={LINE} />
            <text x={62 + i * 108} y="172" textAnchor="middle" fill={color} fontSize="13" fontWeight="800">{t}</text>
          </g>
        ))}
        <g className="stg" style={at(0.4)}><rect x="38" y="62" width="48" height="22" rx="8" fill={MINT} /><text x="62" y="77" textAnchor="middle" fill="#04060f" fontSize="10.500" fontWeight="800">맛있다</text><rect x="38" y="92" width="48" height="22" rx="8" fill={SAND} stroke={LINE} /><text x="62" y="107" textAnchor="middle" fill={INK} fontSize="10.500" fontWeight="700">별로다</text></g>
        {wire("M98 92h28", 0.7)}
        <g className="stg" style={at(0.9)}><path d="M170 66l26 26-26 26-26-26z" fill={`${GOLD}22`} stroke={GOLD} strokeWidth="1.500" /><text x="170" y="90" textAnchor="middle" fill={GOLD} fontSize="9.500" fontWeight="800">7일 평균</text><text x="170" y="102" textAnchor="middle" fill={GOLD} fontSize="9.500" fontWeight="800">보다 ↓?</text></g>
        {wire("M206 92h28", 1.1)}
        <g className="stg" style={at(1.3)}>{[22, 38, 16, 30].map((h, i) => <rect key={i} x={254 + i * 12} y={124 - h} width="8" height={h} rx="2" fill={i === 2 ? ROSE : color} className="grow" style={at(1.4 + i * 0.15)} />)}<text x="278" y="70" textAnchor="middle" fill={INK} fontSize="10" fontWeight="700">내일 밥 양</text></g>
      </>
    ),
    product: (
      <>
        <text x="170" y="22" textAnchor="middle" fill={SUB} fontSize="11.500" fontWeight="700">동작 알고리즘 — 입력(센서) → 판단 → 출력</text>
        <g className="stg" style={at(0.2)}><rect x="16" y="50" width="84" height="62" rx="12" fill={CARD} stroke={MINT} strokeWidth="1.500" /><path d="M48 62v26M68 62v26" stroke={MINT} strokeWidth="4" strokeLinecap="round" /><path d="M40 62h36" stroke={MINT} strokeWidth="4" strokeLinecap="round" /><text x="58" y="105" textAnchor="middle" fill={INK} fontSize="11.500" fontWeight="700">흙 센서</text></g>
        {wire("M100 80h28", 0.5)}
        <g className="stg" style={at(0.7)}><rect x="128" y="40" width="84" height="82" rx="12" fill={`${color}1f`} stroke={color} strokeWidth="2" /><text x="170" y="64" textAnchor="middle" fill={color} fontSize="12" fontWeight="800">보드 · 판단</text><text x="170" y="86" textAnchor="middle" fill={INK} fontSize="11" fontWeight="700">400보다 마르면</text><text x="170" y="102" textAnchor="middle" fill={INK} fontSize="11" fontWeight="700">550까지 · 최대 5초</text></g>
        {wire("M212 80h28", 0.9)}
        <g className="stg" style={at(1.1)}><rect x="240" y="50" width="84" height="62" rx="12" fill={CARD} stroke={SKY} strokeWidth="1.500" /><circle cx="282" cy="74" r="12" fill="none" stroke={SKY} strokeWidth="3" strokeDasharray="5 4" className="sc-spin" style={{ transformOrigin: "282px 74px" }} /><text x="282" y="105" textAnchor="middle" fill={INK} fontSize="11.500" fontWeight="700">펌프</text></g>
        {[0, 1, 2].map((i) => <path key={i} d="M0 0c-3 5-3 7 0 9 3-2 3-4 0-9z" fill={SKY} transform={`translate(${268 + i * 14} 118)`} className="fa-drop" style={at(i * 0.4)} />)}
        {wire("M170 160v-38", 1.3)}
        <g className="stg" style={at(1.4)}><rect x="128" y="160" width="84" height="28" rx="9" fill={`${GOLD}22`} stroke={GOLD} strokeWidth="1.500" /><text x="170" y="179" textAnchor="middle" fill={GOLD} fontSize="12" fontWeight="800">⚡ 전원 5V</text></g>
      </>
    ),
  };
  return <svg viewBox="0 0 340 196" role="img" aria-label={`${name} 형식의 설계 그림`} className="h-auto w-full" style={FONT}>{art[name]}</svg>;
}

// 리포트 8칸 — 칸마다 작은 그림
export function ReportMini({ i }: { i: number }) {
  const art: ReactNode[] = [
    <><circle key="a" cx="32" cy="22" r="14" fill="none" stroke={LINE} strokeWidth="5" /><circle key="b" cx="32" cy="22" r="14" fill="none" stroke={MINT} strokeWidth="5" strokeLinecap="round" strokeDasharray="0.700 1" pathLength={1} transform="rotate(-90 32 22)" className="draw-ring" /><text key="c" x="32" y="26" textAnchor="middle" fill={INK} fontSize="10" fontWeight="800">7/10</text></>,
    <>{[[SUB, 18], [SKY, 14], [MINT, 12], [PINK, 8]].map(([c, w], k, a) => <rect key={k} x={6 + a.slice(0, k).reduce((s, v) => s + (v[1] as number), 0)} y="14" width={w as number} height="14" rx="3" fill={c as string} className="grow-x" style={at(0.2 + k * 0.2)} />)}<text x="32" y="38" textAnchor="middle" fill={SUB} fontSize="7.500" fontWeight="700">O1 · O2 · O3 · O4</text></>,
    <>{[10, 16, 14, 24, 30].map((h, k) => <rect key={k} x={10 + k * 9.500} y={36 - h} width="6.500" height={h} rx="2" fill={k > 2 ? GOLD : "#60a5fa"} className="grow" style={at(0.2 + k * 0.15)} />)}</>,
    <>{Array.from({ length: 6 }, (_, k) => <circle key={k} cx={14 + (k % 3) * 18} cy={13 + Math.floor(k / 3) * 18} r="6" fill={k < 4 ? MINT : "none"} stroke={k < 4 ? MINT : SUB} strokeDasharray={k < 4 ? undefined : "2 2"} className={k < 4 ? "stg-pop" : undefined} style={at(0.2 + k * 0.15)} />)}</>,
    <g key="back" fill="none" stroke={GOLD} strokeWidth="2.600" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12l-8 8 8 8" className="draw" pathLength={1} /><path d="M14 20h26a8 8 0 0 1 0 16h-6" className="draw" pathLength={1} style={at(0.3)} /></g>,
    <><path d="M6 30h16c4 0 5-14 10-14s6 14 10 14h16" fill="none" stroke={SUB} strokeWidth="2.400" strokeLinecap="round" className="draw" pathLength={1} /><circle cx="32" cy="12" r="4" fill={ROSE} className="ab-pulse" /></>,
    <path key="star" d="M32 5l5 10.500 11.500 1.500-8.400 8 2 11.500L32 31l-10.100 5.500 2-11.500-8.400-8L27 15.500z" fill={GOLD} className="ab-pulse" />,
    <><path d="M18 38V4" stroke={GOLD} strokeWidth="2.600" strokeLinecap="round" /><path d="M18 6h28l-6 8 6 8H18z" fill={GOLD} className="ab-wave" /></>,
  ];
  return <svg viewBox="0 0 64 42" aria-hidden className="mx-auto h-auto w-[64px]" style={FONT}>{art[i]}</svg>;
}

// 사용 공간 지도의 가운데 — AskBack 허브
export function HubOrb() {
  return (
    <svg viewBox="0 0 200 200" aria-hidden className="ab-float h-auto w-full max-w-[200px]" style={FONT}>
      <defs>
        <radialGradient id="hub-g"><stop offset="0" stopColor={MINT} stopOpacity="0.4" /><stop offset="1" stopColor={MINT} stopOpacity="0" /></radialGradient>
        <linearGradient id="hub-c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#a78bfa" /><stop offset="1" stopColor={BLUE} /></linearGradient>
      </defs>
      <circle cx="100" cy="100" r="98" fill="url(#hub-g)" />
      <circle cx="100" cy="100" r="80" fill="none" stroke={LINE} strokeDasharray="3 7" />
      <circle cx="100" cy="100" r="58" fill="url(#hub-c)" stroke="#c7d2fe" strokeWidth="1.500" />
      <text x="100" y="96" fill="#fff" fontSize="20" fontWeight="800" textAnchor="middle">teensparkai</text>
      <text x="100" y="118" fill="#dfe6ff" fontSize="11" textAnchor="middle">묻고 · 답하고 · 적는다</text>
      {[[GOLD, "6s"], [PINK, "9s"], [SKY, "12s"]].map(([c, d]) => <circle key={c} r="5" fill={c}><animateMotion dur={d} repeatCount="indefinite" path="M180 100A80 80 0 1 1 20 100A80 80 0 1 1 180 100" /></circle>)}
    </svg>
  );
}
