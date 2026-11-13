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
        <text x="81" y="24" textAnchor="middle" fill={INK} fontSize="13" fontWeight="800">“필기하는 것도</text>
        <text x="81" y="41" textAnchor="middle" fill={INK} fontSize="13" fontWeight="800">딴짓이에요?”</text>
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

// 딸깍 만든 앱 — "찐공 앱 만들어줘" 한 문장이 블랙박스를 지나 30초 만에 앱이 된다.
// 상자를 열어 보면 AI가 몰래 정한 결정 셋 → 발표 날 "왜?" 하나로 모이고(깔때기) → 이유 0/3.
export function GapArt() {
  const PINK = "#f472b6";
  const hidden: [string, string, string, string][] = [
    ["기획", "첫 화면 = 타이머", "누구를 위해?", GOLD],
    ["알고리즘", "25분 = 1찐공", "왜 25분?", MINT],
    ["구조", "순위 = 메인 화면", "왜 메인에?", PINK],
  ];
  const cx = [180, 500, 820];
  return (
    <svg viewBox="0 0 1000 580" role="img" aria-label="찐공 앱 만들어줘 한 문장이 블랙박스를 지나 30초 만에 앱이 됐다. 상자를 열어 보면 첫 화면, 25분 기준, 순위 위치를 AI가 몰래 정했고, 발표 날 왜냐고 물으면 설명할 이유가 0개다" className="h-auto w-full min-w-[720px]" style={FONT}>
      <defs>
        <radialGradient id="gap-bb"><stop offset="0" stopColor={VIOLET} stopOpacity="0.35" /><stop offset="1" stopColor={VIOLET} stopOpacity="0" /></radialGradient>
        <linearGradient id="gap-funnel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={ROSE} stopOpacity="0.02" /><stop offset="1" stopColor={ROSE} stopOpacity="0.14" /></linearGradient>
      </defs>

      {/* ① 학생 한 문장 */}
      <g className="stg" style={at(0.1)}>
        <rect x="30" y="70" width="200" height="110" rx="20" fill={CARD} stroke={LINE} strokeWidth="2" />
        <text x="130" y="98" textAnchor="middle" fill={SUB} fontSize="12.500" fontWeight="700">💬 학생 한 문장</text>
        <text x="130" y="134" textAnchor="middle" fill={INK} fontSize="22" fontWeight="800">“찐공 앱</text>
        <text x="130" y="163" textAnchor="middle" fill={INK} fontSize="22" fontWeight="800">만들어줘”</text>
      </g>
      <path d="M238 125h124" stroke={SUB} strokeWidth="2" className="ab-dash" />
      <path d="M362 125l-10-7v14z" fill={SUB} />

      {/* ② 블랙박스 — 안에서 무슨 일이 있었는지 아무도 모른다 */}
      <g className="stg-pop" style={at(0.45)}>
        <ellipse cx="510" cy="118" rx="190" ry="110" fill="url(#gap-bb)" className="ab-pulse" />
        <path d="M380 60l30-30h240l-30 30z" fill="#1a1a28" stroke="#3b3b58" strokeWidth="1.600" strokeLinejoin="round" />
        <path d="M620 60l30-30v140l-30 30z" fill="#0b0b13" stroke="#3b3b58" strokeWidth="1.600" strokeLinejoin="round" />
        <rect x="380" y="60" width="240" height="140" fill="#030305" stroke="#3b3b58" strokeWidth="1.600" />
        <text x="500" y="82" textAnchor="middle" fill={SUB} fontSize="10.500" fontWeight="800" letterSpacing="4">BLACK BOX</text>
        <text x="497" y="163" textAnchor="middle" fill={ROSE} fontSize="78" fontWeight="900" opacity="0.55" className="ab-tw">?</text>
        <text x="503" y="163" textAnchor="middle" fill={SKY} fontSize="78" fontWeight="900" opacity="0.45">?</text>
        <text x="500" y="163" textAnchor="middle" fill={INK} fontSize="78" fontWeight="900">?</text>
        <text x="500" y="189" textAnchor="middle" fill={ROSE} fontSize="12.500" fontWeight="800">AI가 알아서 · 말없이</text>
      </g>

      {/* ③ 30초 — 딸깍 */}
      <path d="M660 125h134" stroke={GOLD} strokeWidth="2.600" className="ab-dash" />
      <path d="M800 125l-11-7.500v15z" fill={GOLD} />
      <text x="727" y="110" textAnchor="middle" fill={GOLD} fontSize="16" fontWeight="800">⚡ 30초</text>

      {/* ④ 딸깍 나온 찐공 앱 */}
      <g className="stg" style={at(0.8)}>
        <g className="ab-float">
          <rect x="810" y="30" width="130" height="196" rx="18" fill={CARD} stroke={VIOLET} strokeWidth="2" />
          <rect x="861" y="38" width="28" height="4" rx="2" fill={LINE} />
          <text x="875" y="62" textAnchor="middle" fill={INK} fontSize="12" fontWeight="800">찐공 📚</text>
          <circle cx="875" cy="100" r="26" fill="none" stroke={`${VIOLET}44`} strokeWidth="6" />
          <path d="M875 74a26 26 0 1 1 -24 36" fill="none" stroke={VIOLET} strokeWidth="6" strokeLinecap="round" />
          <text x="875" y="105" textAnchor="middle" fill={INK} fontSize="13" fontWeight="800">25:00</text>
          {[["🥇 민지", "3h"], ["🥈 나", "2h"], ["🥉 준호", "1h"]].map(([n, h], i) => (
            <g key={n}>
              <rect x="822" y={138 + i * 24} width="106" height="19" rx="6" fill={SAND} />
              <text x="828" y={151 + i * 24} fill={INK} fontSize="10.500" fontWeight="700">{n}</text>
              <text x="922" y={151 + i * 24} textAnchor="end" fill={SUB} fontSize="10.500">{h}</text>
            </g>
          ))}
        </g>
        <rect x="900" y="16" width="70" height="26" rx="13" fill="#0a261f" stroke={MINT} />
        <text x="935" y="34" textAnchor="middle" fill={MINT} fontSize="12.500" fontWeight="800">✓ 완성!</text>
      </g>

      {/* ⑤ 상자를 열면 — 위에서 아래로 갈라지는 숨은 결정 셋 */}
      <g className="stg" style={at(1.1)}>
        <path d="M500 200v44M180 244h640M180 244v22M500 244v22M820 244v22" stroke={ROSE} strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="5 5" />
        <rect x="512" y="210" width="200" height="22" rx="11" fill="#2a0f16" stroke={`${ROSE}99`} />
        <text x="612" y="225.500" textAnchor="middle" fill="#fda4af" fontSize="11.500" fontWeight="800">상자를 열면 — AI가 정한 것</text>
      </g>

      {/* 깔때기 — 셋이 아래로 좁아져 하나의 질문으로 */}
      <path d="M30 266h940L650 420H350z" fill="url(#gap-funnel)" stroke={`${ROSE}44`} strokeWidth="1.500" strokeDasharray="4 6" className="stg" style={at(1.2)} />
      {hidden.map(([n, v, why, c], i) => (
        <g key={n} className="stg" style={at(1.3 + i * 0.2)}>
          <rect x={cx[i] - 140} y="272" width="280" height="84" rx="16" fill={CARD} stroke={c} strokeWidth="1.800" />
          <rect x={cx[i] - 124} y="284" width={n.length * 13 + 20} height="20" rx="10" fill={`${c}26`} />
          <text x={cx[i] - 114} y="298.500" fill={c} fontSize="11.500" fontWeight="800">{n}</text>
          <text x={cx[i] + 124} y="298.500" textAnchor="end" fill={ROSE} fontSize="11" fontWeight="800">정한 사람: AI</text>
          <text x={cx[i]} y="331" textAnchor="middle" fill={INK} fontSize="19" fontWeight="800">{v}</text>
          <text x={cx[i]} y="349" textAnchor="middle" fill={SUB} fontSize="11.500" fontWeight="700">🤷 {why}</text>
          <path d={i === 1 ? "M500 356v52" : `M${cx[i]} 356C${cx[i]} 390 ${500 + (i === 0 ? -120 : 120)} 386 ${500 + (i === 0 ? -60 : 60)} 408`} stroke={c} strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      ))}

      {/* ⑥ 발표 날 — 하나로 모인 질문 */}
      <g className="stg" style={at(2)}>
        <rect x="320" y="408" width="360" height="50" rx="25" fill={SAND} stroke={INK} strokeWidth="1.600" />
        <text x="500" y="439" textAnchor="middle" fill={INK} fontSize="16.500" fontWeight="800">🙋 발표 날 · “왜 이렇게 만들었어?”</text>
        <path d="M500 458v24" stroke={ROSE} strokeWidth="2.400" strokeLinecap="round" />
        <path d="M500 490l-7-10h14z" fill={ROSE} />
      </g>

      {/* ⑦ 답 — 이유 0 / 3 */}
      <g className="stg" style={at(2.3)}>
        <rect x="290" y="494" width="420" height="78" rx="20" fill="#2a0f16" stroke={ROSE} strokeWidth="2.200" />
        <text x="500" y="526" textAnchor="middle" fill={INK} fontSize="17" fontWeight="800">😶 “…AI가 그렇게 만들어서요.”</text>
        <g className="stamp">
          <text x="500" y="558" textAnchor="middle" fill={ROSE} fontSize="20" fontWeight="900">설명한 이유 0 / 3</text>
        </g>
      </g>
    </svg>
  );
}

// 빈칸 세 장 — 칸을 채우면 이렇게 된다. 기획(누구 → 첫 화면) · 알고리즘(위→아래 판단) · 구조(3화면, 순위는 뺌)
export function GapAxisArt({ name }: { name: "plan" | "algo" | "arch" }) {
  const PINK = "#f472b6";
  const DARK = "#04140f";
  const art: Record<string, ReactNode> = {
    plan: (
      <>
        <text x="8" y="16" fill={GOLD} fontSize="11" fontWeight="800">누구를 위해?</text>
        <g className="stg" style={at(0.2)}>
          <path d="M28 120c0-24 12-36 30-36s30 12 30 36z" fill={BLUE} />
          <circle cx="58" cy="62" r="17" fill="#ffd9b8" />
          <path d="M41 60a17 17 0 0 1 34 0c-7-1-14-6-17-11-4 6-10 10-17 11z" fill="#3b2a1e" />
          <circle cx="52" cy="65" r="1.800" fill="#2a1a4a" /><circle cx="64" cy="65" r="1.800" fill="#2a1a4a" />
          <rect x="84" y="78" width="16" height="26" rx="3" fill={CARD} stroke={SKY} strokeWidth="1.500" />
          <path d="M98 50l-6 10h7l-6 11" fill="none" stroke={ROSE} strokeWidth="2.200" strokeLinecap="round" strokeLinejoin="round" className="ab-tw" />
          <text x="60" y="140" textAnchor="middle" fill={INK} fontSize="11.500" fontWeight="800">시험 2주 전 중학생</text>
          <text x="60" y="156" textAnchor="middle" fill={ROSE} fontSize="10.500" fontWeight="700">폰 때문에 10분마다 끊김</text>
        </g>
        <path d="M122 84h44" stroke={GOLD} strokeWidth="2.400" className="ab-dash" />
        <path d="M172 84l-9-6v12z" fill={GOLD} />
        <g className="stg" style={at(0.6)}>
          <rect x="190" y="20" width="88" height="128" rx="14" fill={CARD} stroke={GOLD} strokeWidth="1.800" />
          <rect x="223" y="27" width="22" height="3.500" rx="1.800" fill={LINE} />
          <text x="234" y="52" textAnchor="middle" fill={SUB} fontSize="10" fontWeight="700">첫 화면</text>
          <g className="ab-pulse"><rect x="202" y="66" width="64" height="40" rx="20" fill={MINT} /></g>
          <text x="234" y="91" textAnchor="middle" fill={DARK} fontSize="14" fontWeight="900">▶ 시작</text>
          <text x="234" y="128" textAnchor="middle" fill={SUB} fontSize="9.500" fontWeight="700">누르면 바로 공부</text>
        </g>
      </>
    ),
    algo: (
      <>
        {[["📱 폰 뒤집기", 6, 0.1], ["⏱ 25분 재기", 42, 0.3]].map(([t, y, d]) => (
          <g key={t as string} className="stg" style={at(d as number)}>
            <rect x="96" y={y as number} width="108" height="24" rx="8" fill={CARD} stroke={MINT} strokeWidth="1.500" />
            <text x="150" y={(y as number) + 16.500} textAnchor="middle" fill={INK} fontSize="11.500" fontWeight="800">{t}</text>
          </g>
        ))}
        <path d="M150 30v12M150 66v10" stroke={MINT} strokeWidth="1.800" />
        <g className="stg" style={at(0.5)}>
          <path d="M150 76l64 22-64 22-64-22z" fill={`${GOLD}1f`} stroke={GOLD} strokeWidth="1.600" strokeLinejoin="round" />
          <text x="150" y="102" textAnchor="middle" fill={INK} fontSize="11" fontWeight="800">중간에 폰 들면?</text>
        </g>
        <g className="stg" style={at(0.8)}>
          <path d="M86 98H40v28" stroke={ROSE} strokeWidth="1.800" fill="none" />
          <text x="64" y="92" textAnchor="middle" fill={ROSE} fontSize="10" fontWeight="800">예</text>
          <rect x="4" y="126" width="72" height="26" rx="9" fill={`${ROSE}1a`} stroke={ROSE} strokeWidth="1.500" />
          <text x="40" y="143.500" textAnchor="middle" fill="#fda4af" fontSize="11.500" fontWeight="800">■ 멈춤</text>
        </g>
        <g className="stg" style={at(1)}>
          <path d="M214 98h46v28" stroke={MINT} strokeWidth="1.800" fill="none" />
          <text x="238" y="92" textAnchor="middle" fill={MINT} fontSize="10" fontWeight="800">아니오</text>
          <rect x="220" y="126" width="76" height="26" rx="9" fill={`${MINT}24`} stroke={MINT} strokeWidth="1.800" />
          <text x="258" y="143.500" textAnchor="middle" fill={INK} fontSize="12" fontWeight="900">+1 찐공 🔥</text>
        </g>
        <g className="stg-pop" style={at(1.3)}>
          <rect x="98" y="140" width="104" height="22" rx="11" fill="#2a2108" stroke={GOLD} />
          <text x="150" y="155" textAnchor="middle" fill={GOLD} fontSize="10" fontWeight="800">25분 = 우리 반 설문</text>
        </g>
      </>
    ),
    arch: (
      <>
        {[["시작", "▶"], ["타이머", "25"], ["기록", "▮▮▮"]].map(([t, g], i) => (
          <g key={t} className="stg" style={at(0.15 + i * 0.25)}>
            <rect x={8 + i * 100} y="8" width="84" height="92" rx="12" fill={CARD} stroke={PINK} strokeWidth="1.700" />
            <text x={50 + i * 100} y="26" textAnchor="middle" fill={SUB} fontSize="9.500" fontWeight="800">{i + 1}</text>
            {i === 1 ? (
              <><circle cx={150} cy="54" r="17" fill="none" stroke={`${PINK}44`} strokeWidth="4" /><path d="M150 37a17 17 0 1 1 -15 25" fill="none" stroke={PINK} strokeWidth="4" strokeLinecap="round" /><text x="150" y="58" textAnchor="middle" fill={INK} fontSize="11" fontWeight="800">{g}</text></>
            ) : (
              <text x={50 + i * 100} y="62" textAnchor="middle" fill={i === 0 ? MINT : PINK} fontSize={i === 0 ? 22 : 15} fontWeight="900">{g}</text>
            )}
            <text x={50 + i * 100} y="90" textAnchor="middle" fill={INK} fontSize="12" fontWeight="800">{t}</text>
            {i < 2 && <path d={`M${94 + i * 100} 54h10`} stroke={PINK} strokeWidth="2" />}
            {i < 2 && <path d={`M${106 + i * 100} 54l-5-4v8z`} fill={PINK} />}
          </g>
        ))}
        <g className="stg" style={at(1)}>
          <rect x="40" y="116" width="120" height="36" rx="10" fill={SAND} stroke={`${ROSE}aa`} strokeWidth="1.500" strokeDasharray="5 4" />
          <text x="100" y="139" textAnchor="middle" fill={SUB} fontSize="13" fontWeight="800">🏆 순위 화면</text>
          <path d="M46 134h108" stroke={ROSE} strokeWidth="2.600" strokeLinecap="round" className="draw" pathLength={1} style={at(1.4)} />
          <text x="172" y="132" fill={ROSE} fontSize="13" fontWeight="900">✗ 일부러 뺌</text>
          <text x="172" y="149" fill={SUB} fontSize="11" fontWeight="700">비교 스트레스라서</text>
        </g>
      </>
    ),
  };
  return <svg viewBox="0 0 300 166" aria-hidden className="h-auto w-full" style={FONT}>{art[name]}</svg>;
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
