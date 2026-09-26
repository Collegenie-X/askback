// 축마다 한 장면 — 그 축을 붙였을 때 비로소 보이는 것.
// 여섯 장면이 같은 예시(동네 빵집 · 남는 빵)를 이어서 다룬다. 340×150 한 격자.

const CARD = "#0d0d18";
const SAND = "#17172a";
const LINE = "#2c2c46";
const SUB = "#a8a8c0";
const INK = "#f2f4ff";
const DIM = "#5d5d7d";
const ROSE = "#fb7185";

const F = { fontFamily: "inherit" } as const;

function Arrow({ x, y, w = 20, c, up = 0 }: { x: number; y: number; w?: number; c: string; up?: number }) {
  return (
    <g stroke={c} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={`M${x} ${y}h${w}`} />
      <path d={`M${x + w - 5} ${y - 4}l5 4-5 4`} />
      {up ? <path d={`M${x + w} ${y}v${-up}`} /> : null}
    </g>
  );
}

function Person({ x, y, c, on = true }: { x: number; y: number; c: string; on?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`} opacity={on ? 1 : 0.34}>
      <circle cx="0" cy="-9" r="7.5" fill="none" stroke={on ? c : DIM} strokeWidth="1.8" />
      <path d="M-12 10c0-6.6 5.4-10 12-10s12 3.4 12 10" fill="none" stroke={on ? c : DIM} strokeWidth="1.8" strokeLinecap="round" />
    </g>
  );
}

// 왜 — 수단을 물으면 그 수단만, 목적을 물으면 길이 여럿
function Why({ c }: { c: string }) {
  return (
    <>
      <text x="6" y="20" fill={SUB} fontSize="9.5" fontWeight="800">수단을 물으면 그 수단만 온다</text>
      <rect x="6" y="30" width="96" height="30" rx="9" fill={SAND} stroke={LINE} />
      <text x="54" y="50" textAnchor="middle" fill={DIM} fontSize="10.5" fontWeight="700">남은 빵 알림</text>
      <Arrow x={108} y={45} w={18} c={DIM} />

      <rect x="132" y="24" width="120" height="42" rx="11" fill={`${c}1f`} stroke={c} strokeWidth="1.8" />
      <text x="192" y="41" textAnchor="middle" fill={c} fontSize="9" fontWeight="800">진짜 목적</text>
      <text x="192" y="57" textAnchor="middle" fill={INK} fontSize="11" fontWeight="800">빵을 덜 버린다</text>

      <path d="M192 68v14M96 96h192" stroke={c} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M96 96v-8M192 96v-8M288 96v-8" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
      <text x="192" y="112" textAnchor="middle" fill={SUB} fontSize="9" fontWeight="800">목적을 물으면 길이 여럿</text>

      {[["알림", 96], ["예약 픽업", 192], ["마감 할인", 288]].map(([t, x], n) => (
        <g key={t as string} className="stg" style={{ animationDelay: `${0.2 + n * 0.14}s` }}>
          <rect x={(x as number) - 44} y="118" width="88" height="26" rx="8" fill={CARD} stroke={n === 0 ? LINE : c} strokeWidth="1.4" />
          <text x={x as number} y="135" textAnchor="middle" fill={n === 0 ? DIM : INK} fontSize="10" fontWeight="700">{t}</text>
        </g>
      ))}
    </>
  );
}

// 맥락 — 그 일이 벌어지는 자리를 말하면, 못 쓰는 방식이 드러난다
function Context({ c }: { c: string }) {
  return (
    <>
      <text x="6" y="20" fill={SUB} fontSize="9.5" fontWeight="800">그 일이 벌어지는 자리</text>
      <rect x="6" y="30" width="200" height="110" rx="12" fill={SAND} stroke={`${c}59`} strokeDasharray="5 4" />

      <circle cx="48" cy="58" r="15" fill="none" stroke={c} strokeWidth="1.8" />
      <path d="M48 49v9l6 4" stroke={c} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x="48" y="88" textAnchor="middle" fill={c} fontSize="10.5" fontWeight="800">17:30</text>
      <text x="48" y="104" textAnchor="middle" fill={SUB} fontSize="9" fontWeight="700">마감 30분 전</text>

      <Person x={140} y={62} c={c} />
      <path d="M124 60l-10-8M156 60l10-8" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <text x="140" y="96" textAnchor="middle" fill={INK} fontSize="10" fontWeight="700">두 손이 다 찼다</text>
      <text x="106" y="126" fill={SUB} fontSize="9" fontWeight="700">하루 중 제일 바쁜 시간</text>

      <Arrow x={212} y={64} w={18} c={c} />
      <rect x="236" y="34" width="98" height="30" rx="9" fill={CARD} stroke={LINE} />
      <text x="285" y="53" textAnchor="middle" fill={DIM} fontSize="10" fontWeight="700">화면을 누른다</text>
      <path d="M246 49h78" stroke={ROSE} strokeWidth="2" strokeLinecap="round" className="draw-now" pathLength={1} />
      <rect x="236" y="76" width="98" height="30" rx="9" fill={`${c}1f`} stroke={c} strokeWidth="1.6" />
      <text x="285" y="95" textAnchor="middle" fill={INK} fontSize="10" fontWeight="700">소리로만 알린다</text>
      <text x="236" y="126" fill={SUB} fontSize="9" fontWeight="700">상황이 답을 고른다</text>
    </>
  );
}

// 제약 — 울타리를 치면 남는 답이 전부 해볼 수 있는 것
function Constraint({ c }: { c: string }) {
  return (
    <>
      <rect x="6" y="26" width="200" height="112" rx="14" fill={`${c}0f`} stroke={c} strokeWidth="1.8" />
      <text x="16" y="20" fill={c} fontSize="9.5" fontWeight="800">쓸 수 있는 것</text>
      {[["사장님 폰 1대", 48], ["다음 주 시연까지", 78], ["서버 비용 0원", 108]].map(([t, y], n) => (
        <g key={t as string} className="stg" style={{ animationDelay: `${0.15 + n * 0.12}s` }}>
          <circle cx="32" cy={(y as number) - 4} r="8" fill={`${c}2e`} stroke={c} strokeWidth="1.4" />
          <path d={`M28 ${(y as number) - 4}l3 3 5-6`} stroke={c} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <text x="50" y={y as number} fill={INK} fontSize="11" fontWeight="700">{t}</text>
        </g>
      ))}

      <text x="228" y="20" fill={DIM} fontSize="9.5" fontWeight="800">그래서 빠지는 답</text>
      {[["서버 붙이기", 48], ["앱 설치 시키기", 82], ["AI 이미지 인식", 116]].map(([t, y], n) => (
        <g key={t as string} opacity="0.95">
          <rect x="220" y={(y as number) - 18} width="114" height="26" rx="8" fill={SAND} stroke={LINE} />
          <text x="277" y={(y as number) - 1} textAnchor="middle" fill={INK} fontSize="10" fontWeight="700" opacity="0.8">{t}</text>
          <path d={`M230 ${(y as number) - 5}h94`} stroke={ROSE} strokeWidth="1.8" strokeLinecap="round" className="draw-now" pathLength={1} style={{ animationDelay: `${0.3 + n * 0.12}s` }} />
        </g>
      ))}
    </>
  );
}

// 기준 — '좋은'이 숫자가 되면, 나중에 맞았는지 확인할 수 있다
function Criteria({ c }: { c: string }) {
  return (
    <>
      <rect x="6" y="22" width="120" height="30" rx="9" fill={SAND} stroke={LINE} />
      <text x="66" y="42" textAnchor="middle" fill={DIM} fontSize="11" fontWeight="800">“좋은 알림”</text>
      <text x="6" y="68" fill={DIM} fontSize="9" fontWeight="700">무엇이 좋은지 아무도 모른다</text>
      <Arrow x={134} y={37} w={20} c={c} />

      <text x="170" y="28" fill={c} fontSize="9.5" fontWeight="800">버리는 빵 (개 / 하루)</text>
      <path d="M170 56h160" stroke={LINE} strokeWidth="1.6" strokeLinecap="round" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
        <path key={n} d={`M${170 + n * 22.8} 56v5`} stroke={LINE} strokeWidth="1.4" strokeLinecap="round" />
      ))}
      <text x="170" y="74" fill={SUB} fontSize="9" fontWeight="700">0</text>
      <text x="330" y="74" textAnchor="end" fill={SUB} fontSize="9" fontWeight="700">10</text>

      <g className="stg" style={{ animationDelay: "0.2s" }}>
        <circle cx="330" cy="56" r="6" fill={DIM} />
        <text x="330" y="92" textAnchor="middle" fill={DIM} fontSize="10" fontWeight="800">지금 10</text>
      </g>
      <g className="stg" style={{ animationDelay: "0.4s" }}>
        <path d="M238 56V26l16 6-16 6" fill="none" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
        <circle cx="238" cy="56" r="7" fill={c} />
        <text x="238" y="92" textAnchor="middle" fill={c} fontSize="10" fontWeight="800">목표 3</text>
      </g>
      <path d="M322 56h-76" stroke={c} strokeWidth="1.8" strokeDasharray="4 4" strokeLinecap="round" className="ab-dash" />

      <rect x="170" y="106" width="164" height="32" rx="10" fill={`${c}14`} stroke={`${c}66`} />
      <text x="182" y="126" fill={INK} fontSize="10" fontWeight="700">만든 뒤에 맞았는지 셀 수 있다</text>
    </>
  );
}

// 검증 — 견주는 방법을 먼저 물으면, 틀렸을 때 알아차릴 길이 생긴다
function Verify({ c }: { c: string }) {
  return (
    <>
      <text x="6" y="20" fill={SUB} fontSize="9.5" fontWeight="800">무엇과 무엇을 견줄 건가</text>
      <path d="M170 30v78M144 108h52" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M62 38h216" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M170 30a5 5 0 1 1 0 .01" fill={c} />

      {[["지난주", 62, "12개"], ["이번 주", 278, "4개"]].map(([t, x, v], n) => (
        <g key={t as string}>
          <path d={`M${(x as number) - 26} 44l${26} ${22} ${26}-22z`} fill={n ? `${c}2e` : SAND} stroke={n ? c : LINE} strokeWidth="1.5" strokeLinejoin="round" />
          <path d={`M${x as number} 38v6`} stroke={c} strokeWidth="1.5" />
          <text x={x as number} y="84" textAnchor="middle" fill={n ? c : INK} fontSize="13" fontWeight="800">{v}</text>
          <text x={x as number} y="100" textAnchor="middle" fill={SUB} fontSize="9.5" fontWeight="800">{t}</text>
        </g>
      ))}

      <rect x="72" y="112" width="196" height="30" rx="10" fill={CARD} stroke="#fbbf24" />
      <path d="M88 121v6M88 132h.01" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
      <path d="M88 115l7 14H81z" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinejoin="round" />
      <text x="104" y="131" fill="#fbbf24" fontSize="10" fontWeight="800">손님 수도 같았나? — 코치의 되묻기</text>
    </>
  );
}

// 버릴 것 — 안 만들 것을 정하면, 만들 것 하나가 또렷해진다
function Discard({ c }: { c: string }) {
  const rows = [
    { t: "사장님 알림 화면", keep: true },
    { t: "손님용 주문 화면", keep: false },
    { t: "포인트 적립", keep: false },
    { t: "리뷰 게시판", keep: false },
  ];
  return (
    <>
      <text x="6" y="20" fill={SUB} fontSize="9.5" fontWeight="800">떠오른 것 전부</text>
      {rows.map((r, n) => (
        <g key={r.t} className="stg" style={{ animationDelay: `${0.12 * n}s` }} opacity={r.keep ? 1 : 0.8}>
          <rect x="6" y={26 + n * 27} width="166" height="24" rx="8" fill={r.keep ? `${c}1f` : SAND} stroke={r.keep ? c : LINE} strokeWidth={r.keep ? 1.6 : 1.2} />
          <text x="20" y={42 + n * 27} fill={r.keep ? INK : SUB} fontSize="10.5" fontWeight="700">{r.t}</text>
          {!r.keep && <path d={`M16 ${38 + n * 27}h146`} stroke={ROSE} strokeWidth="1.8" strokeLinecap="round" className="draw-now" pathLength={1} style={{ animationDelay: `${0.3 + n * 0.1}s` }} />}
        </g>
      ))}
      <text x="6" y="144" fill={ROSE} fontSize="9" fontWeight="800">세 줄은 일부러 그었다</text>

      <Arrow x={180} y={70} w={18} c={c} />
      <rect x="208" y="44" width="126" height="52" rx="12" fill={`${c}1f`} stroke={c} strokeWidth="1.8" />
      <text x="271" y="66" textAnchor="middle" fill={c} fontSize="9" fontWeight="800">이번에 만들 것</text>
      <text x="271" y="84" textAnchor="middle" fill={INK} fontSize="11" fontWeight="800">사장님 알림 화면</text>
      <text x="271" y="118" textAnchor="middle" fill={SUB} fontSize="9" fontWeight="700">하나만 남으면</text>
      <text x="271" y="132" textAnchor="middle" fill={SUB} fontSize="9" fontWeight="700">끝까지 만들 수 있다</text>
    </>
  );
}

const SCENES: Record<string, ({ c }: { c: string }) => React.ReactElement> = {
  why: Why, context: Context, constraint: Constraint, criteria: Criteria, verify: Verify, discard: Discard,
};

export default function AxisScene({ k, color, label }: { k: string; color: string; label?: string }) {
  const S = SCENES[k] ?? Why;
  return (
    <svg viewBox="0 0 340 150" role="img" aria-label={label} className="h-auto w-full" style={F}>
      <g key={k} className="swap"><S c={color} /></g>
    </svg>
  );
}
