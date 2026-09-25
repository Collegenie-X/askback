// 단계마다 한 장면 — 그 칸에서 실제로 벌어지는 일을 그린다.
// 일곱 장면이 같은 예시(동네 빵집)를 이어서 다룬다. 340×150 한 격자.
// 히어로의 작은 칸과 아래 7단계 탭이 같은 장면을 함께 쓴다.

const CARD = "#0d0d18";
const SAND = "#17172a";
const LINE = "#2c2c46";
const SUB = "#a8a8c0";
const INK = "#f2f4ff";
const DIM = "#5d5d7d";

const F = { fontFamily: "inherit" } as const;

// 오른쪽으로 가는 화살표 한 개
function Arrow({ x, y, w = 20, c }: { x: number; y: number; w?: number; c: string }) {
  return (
    <g stroke={c} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={`M${x} ${y}h${w}`} />
      <path d={`M${x + w - 5} ${y - 4}l5 4-5 4`} />
    </g>
  );
}

// 사람 한 명 — 머리와 어깨
function Person({ x, y, s = 1, c, on }: { x: number; y: number; s?: number; c: string; on?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={on ? 1 : 0.34}>
      <circle cx="0" cy="-9" r="7.5" fill="none" stroke={on ? c : DIM} strokeWidth="1.8" />
      <path d="M-12 10c0-6.6 5.4-10 12-10s12 3.4 12 10" fill="none" stroke={on ? c : DIM} strokeWidth="1.8" strokeLinecap="round" />
    </g>
  );
}

function Scene1({ c }: { c: string }) {
  // 정리 안 된 한 줄이, 일곱 칸짜리 문서의 첫 칸이 된다
  return (
    <>
      <text x="6" y="44" fill={SUB} fontSize="9.5" fontWeight="800">평소 말 그대로</text>
      <rect x="6" y="52" width="148" height="34" rx="10" fill={SAND} stroke={LINE} />
      <text x="17" y="73" fill={INK} fontSize="10.5" fontWeight="700">동네 빵집을 앱으로…</text>
      <rect x="139" y="62" width="1.6" height="14" fill={c} className="sc-dot" />
      <Arrow x={160} y={69} w={20} c={c} />

      <rect x="188" y="12" width="146" height="126" rx="12" fill={CARD} stroke={`${c}80`} />
      <text x="200" y="30" fill={c} fontSize="10" fontWeight="800">기획서.md</text>
      <path d="M200 38h122" stroke={LINE} strokeWidth="1.2" />
      {[0, 1, 2, 3, 4, 5, 6].map((n) => (
        <g key={n}>
          <rect x="200" y={46 + n * 13} width="8" height="8" rx="2" fill={n === 0 ? c : "none"} stroke={n === 0 ? c : LINE} strokeWidth="1.3" />
          {n === 0
            ? <text x="214" y={53 + n * 13} fill={INK} fontSize="9.5" fontWeight="800" className="swap">한 줄 아이디어</text>
            : <path d={`M214 ${52 + n * 13}h${[78, 66, 84, 60, 74, 56][n - 1]}`} stroke={LINE} strokeWidth="2.4" strokeLinecap="round" strokeDasharray="3 4" />}
        </g>
      ))}
    </>
  );
}

function Scene2({ c }: { c: string }) {
  // 셋 중 한 사람으로 좁힌다
  const who = [
    { x: 58, name: "지나가는 사람", on: false },
    { x: 158, name: "단골 손님", on: false },
    { x: 262, name: "빵집 사장님", on: true },
  ];
  return (
    <>
      <text x="6" y="22" fill={SUB} fontSize="9.5" fontWeight="800">모두를 위한 것 → 한 사람의 하루</text>
      {who.map((w) => (
        <g key={w.name}>
          {w.on && <circle cx={w.x} cy="62" r="27" fill={`${c}1f`} stroke={c} strokeWidth="1.6" className="ab-pulse" />}
          <Person x={w.x} y={62} c={c} on={w.on} />
          <text x={w.x} y="104" textAnchor="middle" fill={w.on ? c : DIM} fontSize="10" fontWeight="800">{w.name}</text>
        </g>
      ))}
      <rect x="150" y="116" width="184" height="26" rx="8" fill={`${c}14`} stroke={`${c}66`} />
      <text x="162" y="133" fill={INK} fontSize="10" fontWeight="700">마감 전에 남는 빵이 아깝다</text>
      <path d={`M262 108v6`} stroke={c} strokeWidth="1.6" />
    </>
  );
}

function Scene3({ c }: { c: string }) {
  // 입력 → 판단 → 출력, 손으로 그릴 수 있는 세 칸
  return (
    <>
      {[["입력", 8], ["판단", 118], ["출력", 226]].map(([t, x]) => (
        <text key={t as string} x={x as number} y="40" fill={SUB} fontSize="9" fontWeight="800">{t}</text>
      ))}
      <rect x="8" y="48" width="92" height="38" rx="9" fill={SAND} stroke={c} strokeWidth="1.6" />
      <text x="54" y="72" textAnchor="middle" fill={INK} fontSize="10.5" fontWeight="700">남은 빵 수</text>
      <Arrow x={104} y={67} w={16} c={c} />
      <path d="M164 38l42 29-42 29-42-29z" fill={SAND} stroke={c} strokeWidth="1.6" strokeLinejoin="round" />
      <text x="164" y="71" textAnchor="middle" fill={INK} fontSize="10.5" fontWeight="700">마감 임박?</text>
      <Arrow x={210} y={67} w={16} c={c} />
      <rect x="230" y="48" width="104" height="38" rx="9" fill={`${c}1f`} stroke={c} strokeWidth="1.6" />
      <text x="282" y="72" textAnchor="middle" fill={INK} fontSize="10.5" fontWeight="700">사장님께 알림</text>
      <text x="171" y="112" fill={SUB} fontSize="9.5" fontWeight="700">아니오 → 그냥 둔다</text>
      <path d="M164 96v10h4" stroke={DIM} strokeWidth="1.4" fill="none" strokeDasharray="3 3" />
    </>
  );
}

function Scene4({ c }: { c: string }) {
  // AI가 준 숫자는 지우고, 내가 잰 숫자를 남긴다
  const bars = [12, 18, 26, 44, 34, 20];
  return (
    <>
      <text x="6" y="30" fill={SUB} fontSize="9" fontWeight="800">AI가 준 값</text>
      <rect x="6" y="38" width="100" height="34" rx="9" fill={SAND} stroke={LINE} />
      <text x="56" y="60" textAnchor="middle" fill={DIM} fontSize="12" fontWeight="800">30분 전</text>
      <path d="M16 56h80" stroke="#fb7185" strokeWidth="2" strokeLinecap="round" className="draw-now" pathLength={1} />
      <text x="6" y="94" fill="#fb7185" fontSize="9" fontWeight="800">어디서 온 숫자?</text>

      <Arrow x={112} y={55} w={20} c={c} />
      <text x="112" y="44" fill={c} fontSize="9" fontWeight="800">5일 재 봄</text>

      <path d="M148 118h186" stroke={LINE} strokeWidth="1.4" strokeLinecap="round" />
      {bars.map((hh, n) => (
        <rect key={n} x={156 + n * 30} y={118 - hh} width="18" height={hh} rx="3" fill={n === 3 ? c : `${c}3d`} className="grow" style={{ animationDelay: `${0.15 + n * 0.1}s` }} />
      ))}
      <text x={165 + 3 * 30} y={110 - 44} textAnchor="middle" fill={c} fontSize="10.5" fontWeight="800">17:40</text>
      <text x="148" y="136" fill={SUB} fontSize="9" fontWeight="700">이때부터 빵이 남기 시작</text>
    </>
  );
}

function Scene5({ c }: { c: string }) {
  // 셋을 놓고, 각각 잃는 것을 적는다
  const opt = [
    { x: 6, t: "앱 알림", lose: "앱을 깔아야", on: true },
    { x: 120, t: "문자", lose: "번호를 받아야", on: false },
    { x: 234, t: "가게 칠판", lose: "온 사람만 봄", on: false },
  ];
  return (
    <>
      <text x="6" y="22" fill={SUB} fontSize="9.5" fontWeight="800">하나만 떠올린 건, 고른 게 아니다</text>
      {opt.map((o) => (
        <g key={o.t} opacity={o.on ? 1 : 0.62}>
          <rect x={o.x} y="32" width="100" height="94" rx="11" fill={o.on ? `${c}1a` : SAND} stroke={o.on ? c : LINE} strokeWidth={o.on ? 1.8 : 1.2} />
          <text x={o.x + 50} y="58" textAnchor="middle" fill={o.on ? c : INK} fontSize="11.5" fontWeight="800">{o.t}</text>
          <path d={`M${o.x + 14} 70h72`} stroke={LINE} strokeWidth="1.2" />
          <text x={o.x + 50} y="88" textAnchor="middle" fill="#fb7185" fontSize="9" fontWeight="800">− 잃는 것</text>
          <text x={o.x + 50} y="106" textAnchor="middle" fill={SUB} fontSize="9.5" fontWeight="700">{o.lose}</text>
          {o.on && (
            <g>
              <circle cx={o.x + 88} cy="42" r="9" fill={c} />
              <path d={`M${o.x + 83.5} 42l3 3 5.5-6`} stroke="#2a1000" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )}
        </g>
      ))}
    </>
  );
}

function Scene6({ c }: { c: string }) {
  // 손으로 그려 설명한다 — 못 하면 내 것이 아니다
  return (
    <>
      <rect x="78" y="8" width="204" height="76" rx="7" fill={SAND} stroke={c} strokeWidth="1.6" />
      <g className="fx-board" stroke={c} strokeWidth="1.6" fill="none" strokeLinecap="round">
        <rect x="94" y="30" width="46" height="24" rx="5" />
        <path d="M140 42h14" />
        <path d="M178 26l22 16-22 16-22-16z" />
        <path d="M200 42h14" />
        <rect x="214" y="30" width="52" height="24" rx="5" />
      </g>
      <path d="M180 84v10M156 98h48" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <text x="180" y="116" textAnchor="middle" fill={SUB} fontSize="9.5" fontWeight="700">손으로 그려 설명하지 못하면 내 것이 아니다</text>

      <Person x={30} y={56} c={c} on />
      <path d="M44 50l26-8" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <text x="30" y="88" textAnchor="middle" fill={c} fontSize="9.5" fontWeight="800">내가 설명</text>

      <rect x="290" y="56" width="46" height="26" rx="9" fill={CARD} stroke="#fbbf24" />
      <text x="313" y="73" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="800">“왜?”</text>
      <path d="M288 69h-6" stroke="#fbbf24" strokeWidth="1.4" strokeLinecap="round" />
    </>
  );
}

function Scene7({ c }: { c: string }) {
  // 지나온 여섯 칸이 세 장이 되어, 두 곳으로 건네진다
  const files = ["기획서.md", "유저 시나리오", "코딩 프롬프트"];
  return (
    <>
      <text x="6" y="22" fill={SUB} fontSize="9.5" fontWeight="800">여섯 칸이 그대로</text>
      {files.map((f, n) => (
        <g key={f} className="stg" style={{ animationDelay: `${n * 0.14}s` }}>
          <rect x={8} y={32 + n * 34} width="122" height="28" rx="8" fill={CARD} stroke={c} strokeWidth="1.4" />
          <path d={`M20 ${39 + n * 34}h7l3 3v11h-10z`} fill="none" stroke={c} strokeWidth="1.3" strokeLinejoin="round" />
          <text x="38" y={50 + n * 34} fill={INK} fontSize="10" fontWeight="700">{f}</text>
        </g>
      ))}
      <path d="M136 46h8v58h-8" fill="none" stroke={`${c}80`} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M130 75h14" stroke={`${c}80`} strokeWidth="1.4" strokeLinecap="round" />
      <Arrow x={146} y={46} w={16} c={c} />
      <Arrow x={146} y={104} w={16} c={c} />

      <rect x="168" y="16" width="166" height="60" rx="10" fill={SAND} stroke={LINE} />
      <path d="M168 32h166" stroke={LINE} strokeWidth="1.2" />
      <circle cx="180" cy="24" r="2.6" fill="#fb7185" /><circle cx="190" cy="24" r="2.6" fill="#fbbf24" /><circle cx="200" cy="24" r="2.6" fill="#34d399" />
      <text x="182" y="54" fill="#67e8f9" fontSize="11" fontWeight="800">&lt;/&gt;</text>
      <text x="206" y="54" fill={SUB} fontSize="10" fontWeight="700">코딩 도구에 그대로</text>

      <Person x={196} y={110} c={c} on />
      <text x="222" y="108" fill={INK} fontSize="10" fontWeight="700">선생님 · 친구가</text>
      <text x="222" y="122" fill={SUB} fontSize="9.5" fontWeight="700">그 자리에서 이어 본다</text>
    </>
  );
}

const SCENES = [Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7];

export default function LadderScene({ n, color, label }: { n: number; color: string; label?: string }) {
  const S = SCENES[n] ?? SCENES[0];
  return (
    <svg viewBox="0 0 340 150" role="img" aria-label={label} className="h-auto w-full" style={F}>
      <g key={n} className="swap"><S c={color} /></g>
    </svg>
  );
}
