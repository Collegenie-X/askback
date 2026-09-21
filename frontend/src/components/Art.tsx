// 손그림 느낌의 커스텀 SVG — 글자만 있던 자리에 작은 그림을 놓는다. 색은 askback.css 의 밤하늘 팔레트를 따른다.
import { Rocket } from "./Space";

// 로고 — 물음표 말풍선과, 되돌아오는 화살표(AskBack)
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="shrink-0">
      <defs>
        <linearGradient id="lg-b" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b6cff" />
          <stop offset="1" stopColor="#2f49c9" />
        </linearGradient>
      </defs>
      <path d="M8 5h19a6 6 0 0 1 6 6v9a6 6 0 0 1-6 6H18l-7 6v-6H8a6 6 0 0 1-6-6v-9a6 6 0 0 1 6-6z" fill="url(#lg-b)" stroke="#b9c4ff" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M13.500 12.500a4.200 4.200 0 1 1 6.300 3.600c-1.500.9-2.100 1.600-2.100 3" fill="none" stroke="#fff" strokeWidth="2.600" strokeLinecap="round" />
      <circle cx="17.700" cy="22.600" r="1.600" fill="#fff" />
      <path d="M37 22c0 7-5 12-12 12" fill="none" stroke="#ffc83d" strokeWidth="2.600" strokeLinecap="round" />
      <path d="M28.500 30l-4 4 4.600 2.800" fill="none" stroke="#ffc83d" strokeWidth="2.600" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M33 3l1.200 3.300 3.300 1.200-3.300 1.200L33 12l-1.200-3.300-3.300-1.200 3.300-1.200z" fill="#ffd98a" className="tw" />
    </svg>
  );
}

// 질문하는 나 — 헬멧을 쓴 꼬마 우주인
export function AstroKid({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="shrink-0">
      <path d="M20 7V3" stroke="#eef0ff" strokeWidth="1.600" strokeLinecap="round" />
      <circle cx="20" cy="3" r="2.200" fill="#ffc83d" className="ob-beam" />
      <circle cx="20" cy="22" r="15" fill="#eef0ff" stroke="#b9c4ff" strokeWidth="1.500" />
      <rect x="2.500" y="18" width="5" height="9" rx="2.500" fill="#ffc83d" />
      <rect x="32.500" y="18" width="5" height="9" rx="2.500" fill="#ffc83d" />
      <ellipse cx="20" cy="23" rx="11.500" ry="10.500" fill="#1a2260" />
      <circle cx="20" cy="24.500" r="8" fill="#ffd9b8" />
      <path d="M12.200 23.500c.5-5.200 3.900-8 7.900-8s7.200 2.700 7.700 7.700c-2.800-.4-4.900-1.700-6.300-3.600-2.100 2.300-5.200 3.600-9.300 3.900z" fill="#3b2a1e" />
      <g className="ob-blink">
        <circle cx="16.800" cy="25.500" r="1.200" fill="#2a1a4a" />
        <circle cx="23.200" cy="25.500" r="1.200" fill="#2a1a4a" />
      </g>
      <circle cx="14.600" cy="27.800" r="1.400" fill="#ff8fb0" opacity="0.7" />
      <circle cx="25.400" cy="27.800" r="1.400" fill="#ff8fb0" opacity="0.7" />
      <path d="M17.600 28.400q2.400 2 4.800 0" fill="none" stroke="#2a1a4a" strokeWidth="1.200" strokeLinecap="round" />
      <path d="M10.500 19q3-5.500 9-6" fill="none" stroke="#fff" strokeWidth="1.600" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

// 리포트 — 막대그래프가 그려진 종이와 메달
export function ReportArt({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="shrink-0">
      <path d="M9 4h17l7 7v23a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="#fff8e6" stroke="#b98a12" strokeWidth="1.400" strokeLinejoin="round" />
      <path d="M26 4v7h7" fill="#ffe2a0" stroke="#b98a12" strokeWidth="1.400" strokeLinejoin="round" />
      <rect x="11.500" y="22" width="4" height="8" rx="1" fill="#5ad1b3" className="ob-bar" />
      <rect x="17.500" y="17" width="4" height="13" rx="1" fill="#5c9dff" className="ob-bar" style={{ animationDelay: "0.12s" }} />
      <rect x="23.500" y="13" width="4" height="17" rx="1" fill="#ff7ac8" className="ob-bar" style={{ animationDelay: "0.24s" }} />
      <path d="M11 9h10M11 13h7" stroke="#c9a85a" strokeWidth="1.600" strokeLinecap="round" />
      <path d="M27 29l-2 8 4.500-2.500L34 37l-2-8z" fill="#ff5fb0" />
      <circle cx="29.500" cy="27" r="5.500" fill="#ffc83d" stroke="#b98a12" strokeWidth="1.200" />
      <path d="M29.500 23.800l1 2.100 2.300.3-1.700 1.600.4 2.300-2-1.100-2 1.100.4-2.300-1.700-1.600 2.300-.3z" fill="#fff8e6" />
    </svg>
  );
}

// 기획서.md — 연필이 쓰고 있는 공책
export function PlanArt({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="shrink-0">
      <rect x="6" y="5" width="24" height="31" rx="3" fill="#0e2f2c" stroke="#5ad1b3" strokeWidth="1.600" />
      <path d="M11 5v31" stroke="#5ad1b3" strokeWidth="1.200" opacity="0.6" />
      {[11, 17, 23].map((y) => (
        <circle key={y} cx="6" cy={y + 2} r="1.700" fill="#04060f" stroke="#5ad1b3" strokeWidth="1" />
      ))}
      <path d="M15 13h11M15 19h11M15 25h6" stroke="#9af5e0" strokeWidth="1.800" strokeLinecap="round" />
      <g className="ob-wiggle">
        <path d="M35.500 14.500l3 3L27 29l-4.200 1.200L24 26z" fill="#ffc83d" stroke="#b98a12" strokeWidth="1" strokeLinejoin="round" />
        <path d="M24 26l3 3-4.200 1.200z" fill="#fff1d6" />
        <path d="M35.500 14.500l3 3-1.800 1.800-3-3z" fill="#ff7ac8" />
      </g>
    </svg>
  );
}

// 되묻기 — 바늘이 흔들리는 나침반
export function CompassArt({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="shrink-0">
      <circle cx="20" cy="21" r="15" fill="#33290a" stroke="#ffc83d" strokeWidth="2.200" />
      <circle cx="20" cy="21" r="11" fill="#1d1600" stroke="#8a6a1f" strokeWidth="1" />
      <rect x="17" y="2" width="6" height="5" rx="2" fill="#ffc83d" />
      {[0, 90, 180, 270].map((a) => (
        <path key={a} d="M20 11.500v2.500" stroke="#ffd98a" strokeWidth="1.600" strokeLinecap="round" transform={`rotate(${a} 20 21)`} />
      ))}
      <g className="ob-wiggle">
        <path d="M20 12l3.200 9h-6.400z" fill="#ff5f7a" />
        <path d="M20 30l3.200-9h-6.400z" fill="#eef0ff" />
      </g>
      <circle cx="20" cy="21" r="1.800" fill="#ffc83d" />
    </svg>
  );
}

// 심화 — 별을 겨눈 망원경
export function TelescopeArt({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="shrink-0">
      <path d="M19 24l-6 13M21 24l6 13M20 24v12" stroke="#c9b8ff" strokeWidth="1.800" strokeLinecap="round" />
      <g transform="rotate(-28 20 20)">
        <rect x="5" y="15" width="18" height="10" rx="2" fill="#8a2f7d" stroke="#ff9bd8" strokeWidth="1.300" />
        <rect x="22" y="13" width="11" height="14" rx="2" fill="#d94fa6" stroke="#ff9bd8" strokeWidth="1.300" />
        <rect x="32" y="12" width="3" height="16" rx="1.500" fill="#ffd98a" />
        <rect x="2" y="17.500" width="4" height="5" rx="1" fill="#ffd98a" />
      </g>
      <path d="M35 3l.9 2.600 2.600.9-2.600.9L35 10l-.9-2.600-2.600-.9 2.600-.9z" fill="#fff" className="tw" />
      <circle cx="29" cy="3.500" r="1" fill="#8fe9ff" className="tw tw-2" />
    </svg>
  );
}

// 반짝이 — 제목 옆 작은 장식
export function Sparkle({ size = 14, color = "#ffd98a" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden className="tw inline-block shrink-0">
      <path d="M8 0l1.800 6.200L16 8l-6.200 1.800L8 16l-1.800-6.200L0 8l6.200-1.800z" fill={color} />
    </svg>
  );
}

// 확장 사다리 — 단마다 행성 하나. 점선 항로를 따라 로켓이 마지막 단으로 간다
const STOP = [
  ["#5ad1b3", "#0e2f2c"],
  ["#5c9dff", "#12284d"],
  ["#ff7ac8", "#35163a"],
  ["#ffc83d", "#33290a"],
  ["#c58bff", "#2a1a4a"],
];

export function JourneyMap({ stages, caption }: { stages: { emoji: string; label: string; desc: string }[]; caption?: string }) {
  return (
    <figure className="journey">
      <div className="journey-track" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
        <svg className="journey-line" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden>
          <path d="M4 12 C 20 -2 30 26 50 12 S 80 -2 96 12" fill="none" stroke="#8b6cff" strokeWidth="2" strokeDasharray="1 7" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {stages.map((st, i) => {
          const [main, soft] = STOP[i % STOP.length];
          const [step, name] = st.label.includes(" · ") ? st.label.split(" · ") : [`${i + 1}단`, st.label];
          return (
            <div key={st.label} className="journey-stop rise" style={{ animationDelay: `${i * 0.12}s` }}>
              <span className="journey-planet" style={{ background: `radial-gradient(circle at 32% 28%, ${main}, ${soft} 78%)`, borderColor: main }}>
                <span className="journey-emoji">{st.emoji}</span>
                {i === stages.length - 1 && <span className="journey-rocket float"><Rocket size={22} /></span>}
              </span>
              <b className="journey-step" style={{ color: main }}>{step}</b>
              <span className="journey-name">{name}</span>
              <span className="journey-desc">{st.desc}</span>
            </div>
          );
        })}
      </div>
      {caption && <figcaption className="journey-cap"><Sparkle size={11} /> {caption}</figcaption>}
    </figure>
  );
}

// ── 리포트용 그림 ──

// 고리 게이지 — 10개 중 몇 개. 가운데에 숫자가 크게 들어간다
export function RingGauge({ value, total = 10, size = 76, color = "#5ad1b3", label }: { value: number; total?: number; size?: number; color?: string; label?: string }) {
  const c = 2 * Math.PI * 30;
  const ratio = Math.max(0, Math.min(1, value / Math.max(1, total)));
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" role="img" aria-label={`${label ?? ""} ${value}/${total}`} className="shrink-0">
      <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9" />
      <circle cx="40" cy="40" r="30" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${c * ratio} ${c}`} transform="rotate(-90 40 40)" className="gauge-arc" style={{ ["--gauge-len" as string]: `${c}` }} />
      <text x="40" y="45" textAnchor="middle" fontSize="22" fontWeight="900" fill="#f2f4ff">{value}</text>
      <text x="40" y="58" textAnchor="middle" fontSize="9" fontWeight="700" fill="#98a2cc">/ {total}</text>
    </svg>
  );
}

// 미션 도장 — 해냄(별) · 절반(반달) · 다음에(빈 원)
export function StampArt({ result, size = 56 }: { result: "done" | "partial" | "missed"; size?: number }) {
  const tone = result === "done" ? "#5ad1b3" : result === "partial" ? "#ffc83d" : "#98a2cc";
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" aria-hidden className={`shrink-0 ${result === "done" ? "spark" : ""}`}>
      <g transform="rotate(-12 30 30)">
        <circle cx="30" cy="30" r="26" fill="none" stroke={tone} strokeWidth="3" strokeDasharray="5 3" />
        <circle cx="30" cy="30" r="20" fill={`${tone}22`} stroke={tone} strokeWidth="2" />
        {result === "done" && <path d="M30 16l4.100 8.600 9.400 1.200-6.900 6.500 1.800 9.300L30 37.100l-8.400 4.500 1.800-9.300-6.900-6.500 9.400-1.200z" fill={tone} />}
        {result === "partial" && <path d="M30 17a13 13 0 0 1 0 26z" fill={tone} />}
        {result === "partial" && <circle cx="30" cy="30" r="13" fill="none" stroke={tone} strokeWidth="2.400" />}
        {result === "missed" && <circle cx="30" cy="30" r="11" fill="none" stroke={tone} strokeWidth="2.400" strokeDasharray="3 4" />}
      </g>
    </svg>
  );
}

// 다음 미션 — 과녁과 날아와 꽂힌 화살
export function TargetArt({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" aria-hidden className="shrink-0">
      <circle cx="27" cy="33" r="23" fill="#fff8e6" stroke="#b98a12" strokeWidth="1.500" />
      <circle cx="27" cy="33" r="16.500" fill="#ff5f7a" />
      <circle cx="27" cy="33" r="10" fill="#fff8e6" />
      <circle cx="27" cy="33" r="4.500" fill="#ff5f7a" />
      <g className="ob-wiggle">
        <path d="M27 33L50 10" stroke="#3b2a1e" strokeWidth="2.600" strokeLinecap="round" />
        <path d="M45 7l1.500 7.500L54 16l4-5-5.500-.500L52 5z" fill="#ffc83d" stroke="#b98a12" strokeWidth="1" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

// 이번 판의 질문 — 별이 든 트로피
export function TrophyArt({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" aria-hidden className="shrink-0">
      <path d="M17 12H8c0 10 4 16 11 17M43 12h9c0 10-4 16-11 17" fill="none" stroke="#b98a12" strokeWidth="3" strokeLinecap="round" />
      <path d="M16 8h28v14c0 9-6 15-14 15S16 31 16 22z" fill="#ffc83d" stroke="#b98a12" strokeWidth="1.600" strokeLinejoin="round" />
      <path d="M30 13l2.500 5.200 5.700.700-4.200 3.900 1.100 5.600L30 25.700l-5.100 2.700 1.100-5.600-4.200-3.900 5.700-.700z" fill="#fff8e6" />
      <rect x="26.500" y="37" width="7" height="8" fill="#e0a92a" />
      <rect x="19" y="45" width="22" height="7" rx="2.500" fill="#8a2f7d" stroke="#ff9bd8" strokeWidth="1.200" />
      <path d="M50 4l1 2.800 2.800 1-2.800 1L50 11.600l-1-2.800-2.800-1 2.800-1z" fill="#fff" className="tw" />
      <path d="M9 40l.8 2.200 2.200.800-2.200.800L9 46l-.8-2.200L6 43l2.200-.800z" fill="#8fe9ff" className="tw tw-2" />
    </svg>
  );
}

// 리포트 목록 — 리포트마다 열린 질문이 몇 개였는지, 막대와 꺾은선으로 한눈에
export function OpenTrend({ points, height = 84 }: { points: { label: string; value: number }[]; height?: number }) {
  const shown = points.slice(-8);
  const W = 240;
  const base = height - 18;
  const step = W / Math.max(1, shown.length);
  const bw = Math.min(26, step * 0.5);
  const y = (v: number) => base - (Math.max(0, Math.min(10, v)) / 10) * (base - 16);
  const line = shown.map((p, i) => `${i ? "L" : "M"}${step * i + step / 2} ${y(p.value)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} role="img" aria-label={shown.map((p) => `${p.label} 열린 질문 ${p.value}개`).join(", ")}>
      <defs>
        <linearGradient id="ot-bar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3fe0c0" />
          <stop offset="1" stopColor="#3fe0c0" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <path d={`M0 ${base}H${W}`} stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
      {shown.map((p, i) => {
        const cx = step * i + step / 2;
        return (
          <g key={p.label}>
            <rect x={cx - bw / 2} y={y(p.value)} width={bw} height={Math.max(2, base - y(p.value))} rx="4" fill="url(#ot-bar)" className="grow-y" style={{ transformBox: "fill-box", animationDelay: `${i * 0.08}s` }} />
            <text x={cx} y={y(p.value) - 5} textAnchor="middle" fontSize="11" fontWeight="900" fill="#f2f4ff">{p.value}</text>
            <text x={cx} y={height - 4} textAnchor="middle" fontSize="9" fontWeight="700" fill="#98a2cc">{p.label}</text>
          </g>
        );
      })}
      {shown.length > 1 && <path d={line} fill="none" stroke="#ffc83d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
      {shown.map((p, i) => (
        <circle key={p.label} cx={step * i + step / 2} cy={y(p.value)} r="3" fill="#ffc83d" stroke="#10142b" strokeWidth="1.5" />
      ))}
    </svg>
  );
}
