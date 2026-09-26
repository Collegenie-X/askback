import { OPEN_LEVELS, SWEET, type OpenLevel } from "./question";

// 히어로 그림 — 질문의 열림을 다섯 칸짜리 계단으로 세운다.
// 말풍선을 늘어놓지 않는다. 지금 몇 번째 칸에 서 있는지, 그 칸에서 AI가 무엇이 되는지만 보인다.
// 계단은 O3에서 정점이고 그 뒤로는 낮아진다 — 더 열수록 좋은 게 아니라는 말을 모양으로 한다.

const CARD = "#0d0d18";
const LINE = "#2c2c46";
const SUB = "#8a8aa8";
const INK = "#f2f4ff";

const BASE = 336;            // 계단이 서 있는 바닥
const RISE = [8, 62, 124, 92, 50];  // 칸마다의 높이 — 가운데가 정점
const COL = 70;
const X0 = 24;

const x = (i: number) => X0 + i * COL;
const top = (i: number) => BASE - 14 - RISE[i];

export default function OpenChat({ lv, sweet }: { lv: OpenLevel; sweet: boolean }) {
  const c = lv.color;
  const i = OPEN_LEVELS.findIndex((l) => l.key === lv.key);

  return (
    <svg viewBox="0 0 400 420" role="img" aria-label={`${lv.key} ${lv.label} — 이때 AI는 ${lv.roleName}`} className="h-auto w-full" style={{ fontFamily: "inherit" }}>
      <defs>
        <linearGradient id="oc-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c} stopOpacity="0.2" /><stop offset="1" stopColor={c} stopOpacity="0" />
        </linearGradient>
        <radialGradient id="oc-spot">
          <stop offset="0" stopColor={c} stopOpacity="0.55" /><stop offset="1" stopColor={c} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="6" y="6" width="388" height="408" rx="26" fill={CARD} stroke={`${c}4d`} strokeWidth="1.6" />
      <rect x="6" y="6" width="388" height="150" rx="26" fill="url(#oc-glow)" />

      {/* 지금 서 있는 칸 */}
      <g key={`h${lv.key}`} className="swap">
        <text x="30" y="44" fill={SUB} fontSize="10.5" fontWeight="800">{lv.key}</text>
        <text x="30" y="72" fill={c} fontSize="21" fontWeight="800">{lv.label}</text>
        {sweet && (
          <>
            <rect x="262" y="28" width="104" height="26" rx="13" fill="#34d3992e" stroke="#34d399" strokeWidth="1.3" className="ab-pulse" />
            <text x="314" y="45" textAnchor="middle" fill="#34d399" fontSize="10.5" fontWeight="800">스위트 스팟</text>
          </>
        )}
        {/* 이때 AI는 무엇이 되는가 */}
        <text x="30" y="102" fill={SUB} fontSize="10.5" fontWeight="800">이때 AI는</text>
        <rect x="94" y="88" width="124" height="24" rx="12" fill={`${c}24`} stroke={c} strokeWidth="1.3" />
        <text x="156" y="104" textAnchor="middle" fill={c} fontSize="12" fontWeight="800">{lv.roleName}</text>
      </g>

      {/* 계단 — 다섯 칸 */}
      <g>
        <path d={`M24 ${BASE + 1}h352`} stroke={LINE} strokeWidth="1.2" />
        {OPEN_LEVELS.map((l, n) => {
          const on = n === i;
          const t = top(n);
          const col = on ? c : n === SWEET ? "#34d39955" : "#ffffff14";
          return (
            <g key={l.key}>
              {/* 칸의 기둥 */}
              <rect
                x={x(n)} y={t} width={COL - 12} height={BASE - t} rx="10"
                fill={on ? `${c}1f` : "#ffffff08"} stroke={col} strokeWidth={on ? 1.6 : 1}
              />
              {/* 디딤판 */}
              <rect x={x(n) - 3} y={t - 5} width={COL - 6} height="7" rx="3.5" fill={on ? c : "#ffffff1f"} />
              <text x={x(n) + (COL - 12) / 2} y={BASE - 12} textAnchor="middle" fill={on ? c : SUB} fontSize="11" fontWeight="800">{l.key}</text>
            </g>
          );
        })}

        {/* 지금 칸 위에 선 불빛 */}
        <g key={`m${lv.key}`} className="swap">
          <circle cx={x(i) + (COL - 12) / 2} cy={top(i) - 22} r="26" fill="url(#oc-spot)" />
          <circle cx={x(i) + (COL - 12) / 2} cy={top(i) - 20} r="7" fill={c} />
          <circle cx={x(i) + (COL - 12) / 2} cy={top(i) - 20} r="12" fill="none" stroke={`${c}66`} strokeWidth="1.4" className="ab-pulse" />
        </g>
      </g>

      {/* 이 칸에서 얻는 것과 잃는 것 */}
      <g key={`g${lv.key}`} className="swap">
        <rect x="24" y="350" width="172" height="46" rx="14" fill="#34d3991a" stroke="#34d39959" />
        <text x="40" y="370" fill="#34d399" fontSize="10" fontWeight="800">+ 얻는 것</text>
        <text x="40" y="387" fill={INK} fontSize="12" fontWeight="800">{lv.gain}</text>

        <rect x="204" y="350" width="172" height="46" rx="14" fill="#ffffff08" stroke={LINE} />
        <text x="220" y="370" fill="#fb7185" fontSize="10" fontWeight="800">− 잃는 것</text>
        <text x="220" y="387" fill={SUB} fontSize="12" fontWeight="800">{lv.lose}</text>
      </g>
    </svg>
  );
}
