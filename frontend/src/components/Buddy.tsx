// 별이 — 질문을 먹고 자라는 캐릭터. 레벨이 오를 때마다 모습이 바뀐다 (커스텀 SVG)
//   Lv.1 씨앗 → Lv.2 별 → Lv.3 고리와 달 → Lv.4 왕관과 빛 → 그 뒤로는 달이 늘고(Lv.5·7) 무지개 후광(Lv.6)이 생긴다
// 레벨 = 리포트 수 + 1. 채팅 헤더·타임라인·온보딩이 같은 별이를 쓴다.
import data from "@/data/onboarding.json";

export const levelOf = (reports: number) => reports + 1;

export function buddyName(level: number) {
  const names = data.buddy;
  const lv = Math.max(1, level);
  return lv <= names.length ? names[lv - 1].name : `${names[names.length - 1].name} ★${lv - names.length}`;
}

const STAR = Array.from({ length: 10 }, (_, i) => {
  const a = ((-90 + i * 36) * Math.PI) / 180;
  const r = i % 2 ? 10.5 : 20;
  return `${Math.round(Math.cos(a) * r * 10) / 10},${Math.round(Math.sin(a) * r * 10) / 10}`;
}).join(" ");

const SCALE = [0, 1, 0.78, 0.92, 1];

function Face({ happy }: { happy: boolean }) {
  return (
    <g>
      <g className="ob-blink">
        <circle cx="-5.5" cy="-1" r="2.4" fill="#2a1a4a" />
        <circle cx="5.500" cy="-1" r="2.4" fill="#2a1a4a" />
        <circle cx="-4.7" cy="-1.800" r="0.8" fill="#fff" />
        <circle cx="6.3" cy="-1.800" r="0.8" fill="#fff" />
      </g>
      <circle cx="-9.500" cy="3.500" r="2.2" fill="#ff7ac8" opacity="0.6" />
      <circle cx="9.500" cy="3.500" r="2.2" fill="#ff7ac8" opacity="0.6" />
      {happy ? <path d="M-4 3.500 h8 a4 4.500 0 0 1 -8 0z" fill="#2a1a4a" /> : <path d="M-3.500 4 q3.500 3.600 7 0" fill="none" stroke="#2a1a4a" strokeWidth="1.6" strokeLinecap="round" />}
    </g>
  );
}

export default function Buddy({ level, size = 72 }: { level: number; size?: number }) {
  const lv = Math.max(1, Math.min(4, level));
  const moons = level >= 7 ? 3 : level >= 5 ? 2 : 1;
  return (
    <svg width={size} height={size} viewBox="-40 -40 80 80" role="img" aria-label={`별이 레벨 ${level}`} className="shrink-0 overflow-visible">
      <defs>
        <radialGradient id="bd-star" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset="0.55" stopColor="#ffd98a" />
          <stop offset="1" stopColor="#ffab5c" />
        </radialGradient>
        <radialGradient id="bd-seed" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#f4edff" />
          <stop offset="1" stopColor="#b9a8ff" />
        </radialGradient>
        <linearGradient id="bd-halo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8fe9ff" />
          <stop offset="0.5" stopColor="#ff7ac8" />
          <stop offset="1" stopColor="#ffd98a" />
        </linearGradient>
        <radialGradient id="bd-glow">
          <stop offset="0" stopColor="#ffd98a" stopOpacity="0.6" />
          <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g className="ob-bob">
        {lv >= 2 && <circle r={lv === 4 ? 38 : 28} fill="url(#bd-glow)" className={lv === 4 ? "ob-beam" : undefined} />}
        {lv >= 3 && <ellipse rx="33" ry="8" fill="none" stroke="#8fe9ff" strokeWidth="2" opacity="0.4" transform="rotate(-18)" />}

        {lv === 1 ? (
          <g>
            <path d="M0 -12 q-1 -8 4 -13" fill="none" stroke="#3fe0c0" strokeWidth="2.200" strokeLinecap="round" />
            <path d="M4 -25 q9 -3 11 5 q-9 3 -11 -5z" fill="#3fe0c0" className="ob-wiggle" />
            <ellipse cy="2" rx="15" ry="14" fill="url(#bd-seed)" />
            <g transform="translate(0 3)"><Face happy={false} /></g>
          </g>
        ) : (
          <g transform={`scale(${SCALE[lv]})`}>
            <polygon points={STAR} fill="url(#bd-star)" stroke="#ffc46b" strokeWidth="7" strokeLinejoin="round" />
            <polygon points={STAR} fill="url(#bd-star)" />
            <g transform="translate(0 2)"><Face happy={lv === 4} /></g>
            {lv === 4 && (
              <g transform="translate(0 -25)">
                <path d="M-9 4 l-2 -11 6 5 5 -8 5 8 6 -5 -2 11z" fill="#ff5fb0" stroke="#fff" strokeWidth="1" strokeLinejoin="round" />
                <circle cy="-9" r="1.600" fill="#8fe9ff" />
              </g>
            )}
          </g>
        )}

        {lv >= 3 && <path d="M-31.400 10.200 A33 8 -18 0 0 31.400 -10.200" fill="none" stroke="#8fe9ff" strokeWidth="2.400" strokeLinecap="round" />}
        {level >= 6 && <circle r="37" fill="none" stroke="url(#bd-halo)" strokeWidth="1.600" strokeDasharray="2 5" strokeLinecap="round" className="orbit-slow" />}
        {lv >= 3 && (
          <g className="orbit-fast">
            <circle r="36" fill="none" />
            <circle cx="36" r="3" fill="#efeaff" />
            {moons >= 2 && <circle cx="-36" r="2.400" fill="#ff7ac8" />}
            {moons >= 3 && <circle cy="36" r="2.400" fill="#3fe0c0" />}
          </g>
        )}
        {lv === 4 &&
          [[-30, -22], [31, -26], [-33, 20], [30, 24]].map(([x, y], i) => (
            <path key={i} transform={`translate(${x} ${y})`} d="M0 -5 L1.300 -1.300 5 0 1.300 1.300 0 5 -1.300 1.300 -5 0 -1.300 -1.300Z" fill="#fff" className={`tw tw-${i}`} />
          ))}
      </g>
    </svg>
  );
}
