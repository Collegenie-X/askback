// 소개 페이지 커스텀 SVG ③ — 두 겹의 되묻기. 리듬 궤도 · 대화의 다리 · 이해의 나침반.
import type { CSSProperties } from "react";

const FONT = { fontFamily: "inherit" } as const;
const at = (s: number): CSSProperties => ({ animationDelay: `${s}s` });
const neon = (c: string): CSSProperties => ({ ["--neon" as string]: c });

const SUB = "#a8a8c0";
const GLASS = "#0d0d18";
const LINE = "#2c2c46";
const GOLD = "#fbbf24";
const PINK = "#f472b6";
const MINT = "#34d399";
const VIOLET = "#a78bfa";
const ROSE = "#fb7185";

// 돌아오는 화살표가 든 말풍선 — 🙋 열린 되묻기의 표식
function BackIcon({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M-11 -9h22a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H-2l-6 5v-5h-3a4 4 0 0 1-4-4V-5a4 4 0 0 1 4-4z" fill="#2a2108" />
      <path d="M-3 -4l-4 4 4 4M-7 0h9a3.500 3.500 0 0 1 0 7" strokeWidth="1.800" />
    </g>
  );
}

// 바늘이 흔들리는 나침반 — 🧭 역질문의 표식
function Compass({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r + 8} fill={PINK} opacity="0.16" className="ab-pulse" />
      <circle cx={x} cy={y} r={r} fill="#2a1030" stroke={PINK} strokeWidth="2.400" className="neon" style={neon(`${PINK}88`)} />
      {[0, 90, 180, 270].map((a) => <path key={a} d={`M${x} ${y - r + 3}v4`} stroke={PINK} strokeWidth="1.600" strokeLinecap="round" transform={`rotate(${a} ${x} ${y})`} />)}
      <g className="sc-swing" style={{ transformOrigin: `${x}px ${y}px` }}>
        <path d={`M${x} ${y - r * 0.62}l${r * 0.2} ${r * 0.62}h-${r * 0.4}z`} fill={PINK} />
        <path d={`M${x} ${y + r * 0.62}l${r * 0.2} -${r * 0.62}h-${r * 0.4}z`} fill="#fff" opacity="0.85" />
      </g>
      <circle cx={x} cy={y} r="2.200" fill="#fff" />
    </g>
  );
}

// 리듬 궤도 — 질문 여섯 개가 한 줄의 궤도 위에. 답마다 금빛 되묻기가 돌아오고, 두 번마다 분홍 나침반 관문을 지난다.
export function RhythmArt() {
  const track = "M40 160H960";
  const xs = [110, 260, 410, 560, 710, 860];
  return (
    <svg viewBox="0 0 1000 300" role="img" aria-label="질문 여섯 개의 리듬. 모든 답 끝에 열린 되묻기가 돌아오고, 질문 두 번마다 역질문 관문을 지난다" className="h-auto w-full min-w-[760px]" style={FONT}>
      <defs>
        <linearGradient id="rh-track" gradientUnits="userSpaceOnUse" x1="40" y1="160" x2="960" y2="160"><stop offset="0" stopColor="#6c5ce7" /><stop offset="0.5" stopColor="#a78bfa" /><stop offset="1" stopColor="#60a5fa" /></linearGradient>
        <radialGradient id="rh-q" cx="0.35" cy="0.3"><stop offset="0" stopColor="#c4b5fd" /><stop offset="1" stopColor="#4f46e5" /></radialGradient>
        <filter id="rh-blur" filterUnits="userSpaceOnUse" x="0" y="120" width="1000" height="80"><feGaussianBlur stdDeviation="6" /></filter>
      </defs>

      <path d={track} stroke="url(#rh-track)" strokeWidth="10" strokeLinecap="round" opacity="0.4" filter="url(#rh-blur)" />
      <path d={track} stroke="url(#rh-track)" strokeWidth="3" strokeLinecap="round" className="draw" pathLength={1} />
      <path d={track} stroke="#fff" strokeWidth="1.800" strokeLinecap="round" opacity="0.5" className="wave-flow" />
      <circle r="5.500" fill="#fff" className="neon"><animateMotion dur="9s" repeatCount="indefinite" path={track} /></circle>

      {xs.map((x, i) => (
        <g key={x} className="stg" style={at(0.2 + i * 0.22)}>
          {/* 답 — 명세 카드 */}
          <path d={`M${x} 132V104`} stroke={LINE} strokeWidth="1.600" strokeDasharray="2 4" />
          <rect x={x - 48} y="58" width="96" height="46" rx="10" fill={GLASS} stroke={MINT} strokeWidth="1.400" />
          <rect x={x - 38} y="68" width="24" height="10" rx="3" fill="none" stroke={MINT} /><path d={`M${x - 14} 73h10`} stroke={MINT} /><path d={`M${x + 6} 66l10 7-10 7-10-7z`} fill="none" stroke={MINT} />
          <text x={x + 22} y="78" fill="#fff" fontSize="12" fontWeight="800">답</text>
          <text x={x} y="97" textAnchor="middle" fill={SUB} fontSize="10">규칙 카드 · 순서도</text>
          {/* 질문 행성 */}
          <circle cx={x} cy="160" r="42" fill={VIOLET} className="rh-glow" style={at(i * 1.2)} />
          <circle cx={x} cy="160" r="27" fill="url(#rh-q)" stroke="#c7d2fe" strokeWidth="1.400" className="neon" style={neon("#6c5ce7aa")} />
          <text x={x} y="166" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="800">Q{i + 1}</text>
          {/* 돌아오는 금빛 되묻기 */}
          <path d={`M${x + 22} 184C${x + 56} 236 ${x - 56} 236 ${x - 24} 190`} fill="none" stroke={GOLD} strokeWidth="2.400" strokeLinecap="round" className="ab-dash" />
          <path d={`M${x - 32} 198l7-10 9 8`} fill="none" stroke={GOLD} strokeWidth="2.400" strokeLinecap="round" strokeLinejoin="round" />
          <BackIcon x={x} y={246} />
        </g>
      ))}

      {/* 두 번마다 — 역질문 관문 */}
      {[1, 3, 5].map((i, n) => {
        const gx = xs[i] + 72;
        return (
          <g key={i} className="stg-pop" style={at(1.6 + n * 0.3)}>
            <path d={`M${gx} 128V36`} stroke={PINK} strokeWidth="1.600" strokeDasharray="2 5" opacity="0.7" />
            <Compass x={gx} y={160} r={19} />
            <rect x={gx - 40} y="12" width="80" height="26" rx="13" fill="#2a1030" stroke={PINK} strokeWidth="1.400" />
            <text x={gx} y="30" textAnchor="middle" fill={PINK} fontSize="12.500" fontWeight="800">2문 1역</text>
          </g>
        );
      })}

      <g fontSize="12.500" fontWeight="700">
        <circle cx="52" cy="284" r="5" fill={MINT} /><text x="64" y="288" fill={SUB}>답은 끝까지</text>
        <circle cx="172" cy="284" r="5" fill={GOLD} /><text x="184" y="288" fill={SUB}>되묻기 — 모든 답 끝</text>
        <circle cx="342" cy="284" r="5" fill={PINK} /><text x="354" y="288" fill={SUB}>역질문 — 질문 두 번마다</text>
      </g>
    </svg>
  );
}

// 대화의 다리 — 답과 다음 질문 사이를, 학생이 직접 잰 숫자를 들고 건넌다
export function BridgeArt() {
  const arch = "M128 118Q210 22 292 118";
  return (
    <svg viewBox="0 0 420 210" role="img" aria-label="코치의 되물음이 다리가 되고, 학생이 직접 잰 숫자를 들고 다음 질문으로 건너간다" className="h-auto w-full" style={FONT}>
      {/* 왼쪽: 답 */}
      <g className="stg" style={at(0.2)}>
        <rect x="14" y="92" width="114" height="84" rx="12" fill={GLASS} stroke={MINT} strokeWidth="1.500" />
        <text x="26" y="112" fill={MINT} fontSize="11.500" fontWeight="800">답 · 규칙 카드</text>
        <text x="26" y="134" fill="#fff" fontSize="12" fontWeight="700">400 밑이면</text>
        <text x="26" y="151" fill="#fff" fontSize="12" fontWeight="700">펌프 3초</text>
        <circle cx="106" cy="130" r="13" fill="none" stroke={GOLD} strokeWidth="1.800" strokeDasharray="3 3" className="ab-pulse" />
      </g>
      {/* 코치의 되물음 */}
      <g className="stg-pop" style={at(0.8)}>
        <rect x="18" y="10" width="172" height="40" rx="14" fill="#2a2108" stroke={GOLD} strokeWidth="1.500" />
        <path d="M92 49l8 14 8-14z" fill="#2a2108" stroke={GOLD} strokeWidth="1.500" strokeLinejoin="round" />
        <text x="104" y="35" textAnchor="middle" fill={GOLD} fontSize="13" fontWeight="800">“그 400은 어디서 왔어?”</text>
      </g>
      {/* 다리 */}
      <path d={arch} fill="none" stroke={GOLD} strokeWidth="9" strokeLinecap="round" opacity="0.25" />
      <path d={arch} fill="none" stroke={GOLD} strokeWidth="3.500" strokeLinecap="round" className="draw" pathLength={1} style={at(1)} />
      {[150, 180, 210, 240, 270].map((x, i) => { const t = (x - 128) / 164; const y = 118 - 4 * 48 * t * (1 - t); return <path key={x} d={`M${x} ${y + 2}V118`} stroke={GOLD} strokeWidth="1.400" opacity="0.6" className="draw" pathLength={1} style={at(1.3 + i * 0.1)} />; })}
      <path d="M128 118H292" stroke={GOLD} strokeWidth="2" opacity="0.6" />
      {/* 숫자를 들고 건너는 학생 */}
      <g>
        <animateMotion dur="5.500s" repeatCount="indefinite" path={arch} keyPoints="0;1;1" keyTimes="0;0.75;1" calcMode="linear" />
        <rect x="-5" y="-18" width="10" height="14" rx="4" fill="#4f46e5" />
        <circle cx="0" cy="-25" r="7" fill="#ffd9b8" /><path d="M-7 -26a7 7 0 0 1 14 0c-4 0-7-2-8-4-1 2-3 4-6 4z" fill="#3b2a1e" />
        <rect x="8" y="-34" width="34" height="17" rx="5" fill={GOLD} /><text x="25" y="-21.500" textAnchor="middle" fill="#0b0b16" fontSize="11" fontWeight="800">320</text>
      </g>
      {/* 화분 — 직접 잰다 */}
      <g className="stg" style={at(1.6)}>
        <path d="M186 160h48l-7 34h-34z" fill="#7c2d12" stroke="#fb923c" strokeWidth="1.400" />
        <path d="M210 160c0-16-10-22-18-24 0 12 6 20 18 24zM210 160c0-20 10-28 20-30 0 14-8 24-20 30z" fill={MINT} />
        <path d="M222 140v34" stroke="#c7d2fe" strokeWidth="3" strokeLinecap="round" /><rect x="217" y="134" width="10" height="8" rx="2" fill="#60a5fa" />
        <text x="244" y="170" fill={SUB} fontSize="10.500" fontWeight="700">마른 흙 320</text>
        <text x="244" y="185" fill={SUB} fontSize="10.500" fontWeight="700">젖은 흙 610</text>
      </g>
      {/* 오른쪽: 다음 질문 */}
      <g className="stg" style={at(2.2)}>
        <rect x="292" y="92" width="116" height="66" rx="14" fill="#4f46e5" stroke="#818cf8" strokeWidth="1.500" />
        <text x="304" y="112" fill="#c7d2fe" fontSize="11.500" fontWeight="800">다음 질문</text>
        <text x="304" y="132" fill="#fff" fontSize="12" fontWeight="700">“320 · 610이야.</text>
        <text x="304" y="148" fill="#fff" fontSize="12" fontWeight="700">기준을 다시 잡자”</text>
      </g>
    </svg>
  );
}

// 이해의 나침반 — 순서도의 한 곳을 끊어 보고, 무슨 일이 벌어지는지 고르게 한다
export function CompassArt() {
  const choices = ["계속 물을 준다", "펌프가 멈춘다", "아무 일도 없다"];
  return (
    <svg viewBox="0 0 420 210" role="img" aria-label="센서가 빠져 0이 되는 상황을 순서도에서 보여 주고, 세 가지 중 고르게 하는 역질문" className="h-auto w-full" style={FONT}>
      {/* 순서도 — 센서 선이 끊겼다 */}
      <g className="stg" style={at(0.2)}>
        <rect x="14" y="20" width="76" height="28" rx="8" fill={GLASS} stroke={ROSE} strokeWidth="1.500" /><text x="52" y="39" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">흙 센서</text>
        <path d="M52 48v10" stroke={ROSE} strokeWidth="2" /><path d="M52 66v10" stroke={ROSE} strokeWidth="2" strokeDasharray="2 3" />
        <path d="M44 58l6 4-6 4M60 58l-6 4 6 4" fill="none" stroke={ROSE} strokeWidth="1.800" strokeLinecap="round" className="ab-tw" />
        <path d="M52 76l30 18-30 18-30-18z" fill={GLASS} stroke={LINE} strokeWidth="1.500" /><text x="52" y="98" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">&lt;400?</text>
        <path d="M52 112v14" stroke={LINE} strokeWidth="2" />
        <rect x="14" y="126" width="76" height="28" rx="8" fill={GLASS} stroke={LINE} strokeWidth="1.500" /><text x="52" y="145" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">펌프 3초</text>
      </g>
      <g className="stg-pop" style={at(0.9)}>
        <circle cx="98" cy="62" r="15" fill="#2a0f16" stroke={ROSE} strokeWidth="1.600" className="ab-pulse" />
        <text x="98" y="67" textAnchor="middle" fill={ROSE} fontSize="14" fontWeight="800">0</text>
      </g>
      {/* 나침반 */}
      <g className="stg-pop" style={at(1.2)}><Compass x={168} y={92} r={30} /></g>
      <path d="M120 80q12 -6 20 0" fill="none" stroke={PINK} strokeWidth="1.600" strokeDasharray="2 4" /><path d="M200 92h22" stroke={PINK} strokeWidth="1.600" strokeDasharray="2 4" />
      {/* 5초 고르기 */}
      <text x="232" y="24" fill={PINK} fontSize="11.500" fontWeight="800">무슨 일이 벌어질까? · 5초 고르기</text>
      {choices.map((c, i) => (
        <g key={c} className="stg" style={at(1.6 + i * 0.25)}>
          <rect x="232" y={34 + i * 36} width="174" height="28" rx="14" fill={i === 0 ? "#0a261f" : GLASS} stroke={i === 0 ? MINT : LINE} strokeWidth="1.500" />
          <circle cx="248" cy={48 + i * 36} r="7" fill="none" stroke={i === 0 ? MINT : SUB} strokeWidth="1.500" />
          {i === 0 && <g className="stg-pop" style={at(2.8)}><circle cx="248" cy="48" r="7" fill={MINT} /><path d="M244.500 48l2.500 2.500 4.500-5" fill="none" stroke="#0b0b16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></g>}
          <text x="264" y={52.500 + i * 36} fill={i === 0 ? "#fff" : SUB} fontSize="12" fontWeight="700">{c}</text>
        </g>
      ))}
      {/* 난이도 — 5초에서 30초까지 */}
      <g className="stg" style={at(2.4)}>
        <text x="14" y="190" fill={SUB} fontSize="11" fontWeight="700">5초 · 고르기</text>
        <path d="M92 186H316" stroke={LINE} strokeWidth="5" strokeLinecap="round" />
        <path d="M92 186H316" stroke={PINK} strokeWidth="5" strokeLinecap="round" opacity="0.5" className="draw" pathLength={1} style={at(2.6)} />
        <circle cx="92" cy="186" r="8" fill={PINK} className="sl-knob neon" style={neon(`${PINK}aa`)} />
        <text x="406" y="190" textAnchor="end" fill={SUB} fontSize="11" fontWeight="700">30초 · 서술</text>
      </g>
    </svg>
  );
}
