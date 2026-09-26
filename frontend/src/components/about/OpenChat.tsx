import { type OpenLevel } from "./question";

// 히어로 그림 — 그 열림으로 물었을 때 실제로 오가는 대화 한 판.
// 같은 빵집 이야기를 다섯 번 다르게 묻는다. 왼쪽이 나, 오른쪽이 코치.

const CARD = "#0d0d18";
const SAND = "#17172a";
const LINE = "#2c2c46";
const SUB = "#a8a8c0";
const INK = "#f2f4ff";

// 말풍선 안에 들어갈 만큼 글을 자른다 (한 줄에 대략 28자)
function wrap(text: string, per = 26): string[] {
  const out: string[] = [];
  let line = "";
  for (const ch of text) {
    line += ch;
    if (line.length >= per && (ch === " " || ch === "." || ch === "," || ch === "?")) { out.push(line.trim()); line = ""; }
    else if (line.length >= per + 6) { out.push(line.trim()); line = ""; }
  }
  if (line.trim()) out.push(line.trim());
  return out.slice(0, 4);
}

export default function OpenChat({ lv, sweet }: { lv: OpenLevel; sweet: boolean }) {
  const c = lv.color;
  const ask = wrap(lv.ask, 22);
  const askH = 22 + ask.length * 17;
  const replyY = 82 + askH + 30;   // 내 말풍선이 끝난 아래에서 시작한다

  return (
    <svg viewBox="0 0 400 420" role="img" aria-label={`${lv.label}으로 물었을 때 — ${lv.reply}`} className="h-auto w-full" style={{ fontFamily: "inherit" }}>
      <defs>
        <linearGradient id="oc-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c} stopOpacity="0.16" /><stop offset="1" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect x="6" y="6" width="388" height="408" rx="26" fill={CARD} stroke={`${c}4d`} strokeWidth="1.6" />
      <rect x="6" y="6" width="388" height="140" rx="26" fill="url(#oc-glow)" />

      {/* 어떤 열림으로 묻고 있는지 */}
      <g key={`h${lv.key}`} className="swap">
        <rect x="24" y="24" width="120" height="26" rx="13" fill={`${c}24`} stroke={c} strokeWidth="1.3" />
        <text x="84" y="41" textAnchor="middle" fill={c} fontSize="11" fontWeight="800">{lv.key} {lv.label}</text>
        {sweet && (
          <>
            <rect x="152" y="24" width="96" height="26" rx="13" fill="#34d3992e" stroke="#34d399" strokeWidth="1.3" className="ab-pulse" />
            <text x="200" y="41" textAnchor="middle" fill="#34d399" fontSize="10.5" fontWeight="800">스위트 스팟</text>
          </>
        )}
      </g>

      {/* 내가 던진 말 */}
      <g key={`a${lv.key}`} className="swap">
        <text x="24" y="74" fill={SUB} fontSize="10" fontWeight="800">나</text>
        <rect x="24" y="82" width="308" height={askH} rx="16" fill={SAND} stroke={LINE} />
        <path d="M24 90v-6h8z" fill={SAND} stroke={LINE} />
        {ask.map((t, n) => (
          <text key={n} x="42" y={106 + n * 17} fill={INK} fontSize="12.5" fontWeight="700">{t}</text>
        ))}
      </g>

      {/* 코치가 돌려준 것 */}
      <g key={`r${lv.key}`} className="swap">
        <text x="376" y={replyY - 8} textAnchor="end" fill={c} fontSize="10" fontWeight="800">코치</text>
        <rect x="68" y={replyY} width="308" height="84" rx="16" fill={`${c}14`} stroke={c} strokeWidth="1.5" />
        <text x="88" y={replyY + 28} fill={INK} fontSize="13" fontWeight="800">{lv.reply}</text>
        <path d={`M88 ${replyY + 42}h268`} stroke={`${c}4d`} strokeWidth="1.2" />
        {wrap(lv.note, 24).map((t, n) => (
          <text key={n} x="88" y={replyY + 62 + n * 16} fill={c} fontSize="11" fontWeight="700">{t}</text>
        ))}
      </g>

      {/* 그래서 이때 AI는 무엇이 되는가 */}
      <g key={`o${lv.key}`} className="swap">
        <path d="M24 336h352" stroke={LINE} strokeWidth="1.2" />
        <text x="24" y="360" fill={SUB} fontSize="10" fontWeight="800">이때 AI는</text>
        <rect x="96" y="344" width="104" height="24" rx="12" fill={`${c}24`} stroke={c} strokeWidth="1.3" />
        <text x="148" y="360" textAnchor="middle" fill={c} fontSize="11.5" fontWeight="800">{lv.roleName}</text>

        <text x="24" y="390" fill="#34d399" fontSize="10" fontWeight="800">+ {lv.gain}</text>
        <text x="24" y="406" fill="#fb7185" fontSize="10" fontWeight="800">− {lv.lose}</text>
      </g>
    </svg>
  );
}
