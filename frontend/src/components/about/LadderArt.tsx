import { FLAME_IN, FLAME_OUT, ladder, levelOf, nodeX, nodeY, TREAD_W, treadY, X0, Y0 } from "./ladder";

// 그림 — 일곱 칸을 오르는 계단. 지나온 칸은 불이 붙어 있고, 지금 칸은 크게 타오른다.
// 왼쪽 위 카드에 그 칸에서 손에 남는 것.

const CARD = "#0d0d18";
const SUB = "#a8a8c0";
const LINE = "#2c2c46";

// 불꽃 한 송이 — 파비콘(src/app/icon.svg)과 같은 모양.
// 바깥 <g> 가 자리·크기를, 안쪽 <g> 가 흔들림을 맡는다.
// (ab-pulse 는 transform 을 움직이므로, 자리를 잡는 transform 과 같은 노드에 두면 덮어쓴다)
function Flame({ x, y, k, color, state }: { x: number; y: number; k: number; color: string; state: "past" | "now" | "next" }) {
  const dim = state === "next";
  return (
    <g transform={`translate(${x} ${y}) scale(${k * 0.46})`}>
      <g className={state === "now" ? "ab-pulse" : undefined} style={{ transformOrigin: "center" }}>
        <g transform="translate(-31 -28)">
          <path d={FLAME_OUT} fill={dim ? "none" : color} stroke={dim ? SUB : color} strokeWidth={dim ? 2.6 : 0} opacity={dim ? 0.5 : 1} />
          {!dim && <path d={FLAME_IN} fill="#fff7ed" opacity="0.9" />}
        </g>
      </g>
    </g>
  );
}

export default function LadderArt({ i }: { i: number }) {
  const steps = ladder.steps;
  const now = steps[i];
  const lv = levelOf(now);

  // 계단 윤곽 — 디딤판과 챌판을 이어 그린 한 줄
  let stair = `M${X0 - 14} ${Y0 + 8}`;
  for (let n = 0; n < steps.length; n++) {
    stair += `H${X0 + (n + 1) * TREAD_W}`;
    if (n < steps.length - 1) stair += `V${treadY(n + 1) + 8}`;
  }

  // 각 층(불씨·불꽃·횃불·봉화)의 첫 칸 — 층 이름표를 그 위에 세운다
  const firstOf = ladder.levels.map((l) => steps.findIndex((s) => s.lvl === l.key));

  return (
    <svg viewBox="0 0 460 500" role="img" aria-label={`일곱 계단 중 ${now.no}단계 ${now.title} — ${now.gain} 가 남는다`} className="h-auto w-full" style={{ fontFamily: "inherit" }}>
      <defs>
        <linearGradient id="lad-trail" x1="0" y1="1" x2="1" y2="0">
          {ladder.levels.map((l, n) => <stop key={l.key} offset={n / (ladder.levels.length - 1)} stopColor={l.color} />)}
        </linearGradient>
        <radialGradient id="lad-glow"><stop offset="0" stopColor={lv.color} stopOpacity="0.55" /><stop offset="1" stopColor={lv.color} stopOpacity="0" /></radialGradient>
        <linearGradient id="lad-card" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a1509" /><stop offset="1" stopColor={CARD} /></linearGradient>
      </defs>

      {/* 밤하늘의 불티 */}
      {[[30, 26], [436, 30], [446, 226], [18, 210], [250, 16], [66, 486]].map(([x, y], n) => (
        <path key={n} d={`M${x} ${y - 5}l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z`} fill={n % 2 ? "#ffd2a8" : "#ffb37a"} className="ab-tw" style={{ animationDelay: `${n * 0.5}s` }} />
      ))}

      {/* 계단 — 지나온 만큼 색이 차오른다 */}
      <path d={stair} fill="none" stroke={LINE} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
      <path d={stair} fill="none" stroke="url(#lad-trail)" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" pathLength={steps.length} strokeDasharray={`${i + 1} ${steps.length}`} style={{ transition: "stroke-dasharray .5s ease-out" }} />

      {/* 층 이름표 — 불씨 · 불꽃 · 횃불 · 봉화 */}
      {ladder.levels.map((l, n) => {
        const at = firstOf[n];
        const on = l.key === now.lvl;
        return (
          <g key={l.key} transform={`translate(${nodeX(at)} ${nodeY(at) - 46})`} opacity={on ? 1 : 0.45} style={{ transition: "opacity .4s" }}>
            <rect x="-26" y="-11" width="52" height="22" rx="11" fill={CARD} stroke={l.color} strokeWidth={on ? 1.6 : 1} />
            <text x="0" y="4.5" textAnchor="middle" fill={l.color} fontSize="12" fontWeight="800">{l.name}</text>
          </g>
        );
      })}

      {/* 일곱 칸 */}
      {steps.map((s, n) => {
        const state = n < i ? "past" : n === i ? "now" : "next";
        const c = levelOf(s).color;
        const x = nodeX(n);
        const y = nodeY(n);
        return (
          <g key={s.no}>
            {state === "now" && <circle cx={x} cy={y} r="46" fill="url(#lad-glow)" className="ab-pulse" />}
            <circle cx={x} cy={y} r={state === "now" ? 23 : 18} fill={CARD} stroke={state === "next" ? LINE : c} strokeWidth={state === "now" ? 2.4 : 1.6} style={{ transition: "r .35s" }} />
            <Flame x={x} y={y + 1} k={state === "now" ? 1.25 : 0.88} color={c} state={state} />
            <circle cx={x} cy={treadY(n) + 8} r="9.5" fill={state === "next" ? "#15152a" : c} stroke={state === "next" ? LINE : "none"} />
            <text x={x} y={treadY(n) + 12} textAnchor="middle" fill={state === "next" ? SUB : "#2a1000"} fontSize="11" fontWeight="800">{s.no}</text>
          </g>
        );
      })}

      {/* 지금 칸에서 남는 것 */}
      <g key={now.no} className="swap">
        <rect x="8" y="18" width="260" height="104" rx="16" fill="url(#lad-card)" stroke={lv.color} strokeWidth="1.6" />
        <rect x="8" y="18" width="4" height="104" rx="2" fill={lv.color} />
        <text x="26" y="44" fill={lv.color} fontSize="11.5" fontWeight="800">{now.no}단계 · {now.title}</text>
        <text x="26" y="68" fill="#fff" fontSize="13" fontWeight="800">{ladder.gainLabel}</text>
        <path d="M26 78h224" stroke={LINE} strokeWidth="1.2" />
        {now.gain.split(" · ").map((g, n) => (
          <text key={g} x={26 + (n % 2) * 122} y={98 + Math.floor(n / 2) * 17} fill="#ffd9b8" fontSize="11.5" fontWeight="800">· {g}</text>
        ))}
      </g>

      {/* 아래는 아이디어 한 줄, 위는 넘길 수 있는 한 장 */}
      <text x="12" y="492" fill={SUB} fontSize="11" fontWeight="800">한 줄</text>
      <text x="448" y="150" textAnchor="end" fill={ladder.levels[3].color} fontSize="11" fontWeight="800">한 장</text>
    </svg>
  );
}
