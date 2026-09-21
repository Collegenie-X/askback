// 우주 테마 — 커스텀 SVG. 별은 고정 시드로 뿌려서 서버/클라이언트 렌더가 같게 한다.
import type { SpaceObjectKey, SpacePrefs } from "@/lib/types";

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rand = seeded(20260921);
const STARS = Array.from({ length: 90 }, (_, i) => ({
  x: Math.round(rand() * 430),
  y: Math.round(rand() * 932),
  r: Math.round((0.4 + rand() * 1.3) * 10) / 10,
  tw: i % 5, // 반짝임 그룹
  hue: i % 11 === 0 ? "#ffd98a" : i % 7 === 0 ? "#8fe9ff" : "#ffffff",
}));

// 은하수 — 화면을 대각선으로 가로지르는 별의 강. 띠 중심에 가까울수록 촘촘하다
const mw = seeded(777);
const MILKY = Array.from({ length: 260 }, (_, i) => {
  const t = mw();
  const spread = (mw() + mw() + mw() - 1.5) * 90; // 가운데로 몰리는 분포
  return {
    x: Math.round(-60 + t * 560),
    y: Math.round(spread),
    r: Math.round((0.3 + mw() * 0.9) * 10) / 10,
    o: Math.round((0.25 + mw() * 0.7) * 100) / 100,
    c: i % 9 === 0 ? "#ffd98a" : i % 5 === 0 ? "#8fe9ff" : i % 4 === 0 ? "#ffb8e6" : "#ffffff",
  };
});

// 나선 은하의 팔 — 로그 나선 위에 점을 찍는다
function armPoints(turn: number, count: number, spread: number, seed: number) {
  const r = seeded(seed);
  return Array.from({ length: count }, (_, i) => {
    const t = i / count;
    const angle = turn + t * Math.PI * 2.6;
    const radius = 6 + t * 88;
    const jitter = (r() - 0.5) * spread * (0.4 + t);
    return {
      x: Math.round((Math.cos(angle) * (radius + jitter)) * 10) / 10,
      y: Math.round((Math.sin(angle) * (radius + jitter) * 0.62) * 10) / 10,
      s: Math.round((0.5 + r() * 1.6 * (1 - t * 0.5)) * 10) / 10,
      o: Math.round((0.35 + r() * 0.65) * 100) / 100,
    };
  });
}

const ARMS = [
  { pts: armPoints(0, 70, 16, 11), color: "#c9b8ff" },
  { pts: armPoints(Math.PI, 70, 16, 23), color: "#8fe9ff" },
  { pts: armPoints(Math.PI / 2, 40, 22, 37), color: "#ffb8e6" },
  { pts: armPoints(Math.PI * 1.5, 40, 22, 53), color: "#ffe2a8" },
];

export function Galaxy({ size = 220, spin = true }: { size?: number; spin?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="-110 -110 220 220" aria-hidden className={spin ? "galaxy-spin" : undefined}>
      <defs>
        <radialGradient id="gx-core">
          <stop offset="0" stopColor="#fff7dc" />
          <stop offset="0.25" stopColor="#ffd98a" stopOpacity="0.9" />
          <stop offset="0.6" stopColor="#a78bfa" stopOpacity="0.35" />
          <stop offset="1" stopColor="#a78bfa" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="gx-halo">
          <stop offset="0" stopColor="#7c5cff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#7c5cff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse rx="108" ry="70" fill="url(#gx-halo)" transform="rotate(-18)" />
      <g transform="rotate(-18)">
        {ARMS.map((arm, a) => arm.pts.map((p, i) => <circle key={`${a}-${i}`} cx={p.x} cy={p.y} r={p.s} fill={arm.color} opacity={p.o} />))}
        <ellipse rx="30" ry="20" fill="url(#gx-core)" />
      </g>
    </svg>
  );
}

// ── 천체들 — 배경에서 공전 · 자전한다. 설정의 [우주 배경]에서 하나씩 켜고 끈다 ──

function Shade({ id }: { id: string }) {
  return (
    <radialGradient id={id} cx="0.3" cy="0.3" r="0.9">
      <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
      <stop offset="0.55" stopColor="#000" stopOpacity="0" />
      <stop offset="1" stopColor="#000" stopOpacity="0.6" />
    </radialGradient>
  );
}

// 줄무늬 거인 — 가스 행성. 구름 띠와 붉은 점이 흐르며 자전한다
export function GiantPlanet({ size = 84 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-40 -40 80 80" aria-hidden>
      <defs>
        <clipPath id="gp-clip"><circle r="30" /></clipPath>
        <Shade id="gp-shade" />
      </defs>
      <circle r="38" fill="#ff9f5c" opacity="0.1" />
      <g clipPath="url(#gp-clip)">
        <circle r="30" fill="#e8874a" />
        <rect x="-30" y="-21" width="60" height="7" fill="#ffc98a" />
        <rect x="-30" y="-8" width="60" height="9" fill="#c9602e" />
        <rect x="-30" y="7" width="60" height="5" fill="#ffe0b0" />
        <rect x="-30" y="17" width="60" height="6" fill="#b5522a" />
        <g className="surface-wide">
          {[-80, 0, 80, 160].map((x) => (
            <g key={x} transform={`translate(${x} 0)`}>
              <ellipse cx="-14" cy="-17.500" rx="13" ry="2" fill="#fff1d6" opacity="0.8" />
              <ellipse cx="22" cy="-3.500" rx="16" ry="2.400" fill="#8f3f1c" opacity="0.7" />
              <ellipse cx="4" cy="3.500" rx="7.500" ry="4.200" fill="#ff5f5f" />
              <ellipse cx="4" cy="3.500" rx="4" ry="2" fill="#ff9a8a" />
              <ellipse cx="-24" cy="9.500" rx="12" ry="1.600" fill="#fff" opacity="0.6" />
              <ellipse cx="30" cy="20" rx="14" ry="2" fill="#7d3516" opacity="0.7" />
            </g>
          ))}
        </g>
        <circle r="30" fill="url(#gp-shade)" />
      </g>
    </svg>
  );
}

// 물빛별 — 바다와 땅, 구름이 도는 행성. 달 하나가 공전한다
export function OceanPlanet({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-40 -40 80 80" aria-hidden>
      <defs>
        <clipPath id="op-clip"><circle r="20" /></clipPath>
        <Shade id="op-shade" />
      </defs>
      <circle r="25" fill="#5cb8ff" opacity="0.16" />
      <g clipPath="url(#op-clip)">
        <circle r="20" fill="#2f7fe0" />
        <g className="surface-wide">
          {[-80, 0, 80, 160].map((x) => (
            <g key={x} transform={`translate(${x} 0)`}>
              <path d="M-16 -10 q6 -7 14 -3 q5 3 1 8 q-4 5 -10 3 q-7 -2 -5 -8z" fill="#5ad1b3" />
              <path d="M10 2 q8 -3 12 3 q2 6 -5 9 q-8 2 -10 -4 q-1 -5 3 -8z" fill="#7be08f" />
              <path d="M36 -12 q7 -2 9 4 q-2 6 -9 4 q-4 -3 0 -8z" fill="#5ad1b3" />
              <ellipse cx="-2" cy="-14" rx="10" ry="1.800" fill="#fff" opacity="0.75" />
              <ellipse cx="26" cy="12" rx="12" ry="2" fill="#fff" opacity="0.6" />
              <ellipse cx="-30" cy="8" rx="9" ry="1.600" fill="#fff" opacity="0.7" />
            </g>
          ))}
        </g>
        <circle r="20" fill="url(#op-shade)" />
      </g>
      <circle r="33" fill="none" stroke="#a9a3d9" strokeWidth="0.6" strokeDasharray="2 4" opacity="0.5" />
      <g className="orbit-fast"><circle r="33" fill="none" /><circle cx="33" r="4" fill="#e8ecff" /><circle cx="32" cy="-1" r="1.200" fill="#b9c0e6" /></g>
    </svg>
  );
}

// 솜사탕별 — 작고 빠른 분홍 행성. 얼굴이 있다
export function CandyPlanet({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-22 -22 44 44" aria-hidden>
      <defs><Shade id="cp-shade" /></defs>
      <circle r="20" fill="#ff7ac8" opacity="0.14" />
      <circle r="14" fill="#ff7ac8" />
      <path d="M-13 -4 q13 -7 26 0" fill="none" stroke="#ffc2e8" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
      <path d="M-12 7 q12 6 24 0" fill="none" stroke="#d94fa6" strokeWidth="2.400" strokeLinecap="round" opacity="0.7" />
      <circle r="14" fill="url(#cp-shade)" />
      <g className="ob-blink">
        <circle cx="-4.500" cy="-0.500" r="1.800" fill="#3a1140" />
        <circle cx="4.500" cy="-0.500" r="1.800" fill="#3a1140" />
      </g>
      <path d="M-3 3.500 q3 3 6 0" fill="none" stroke="#3a1140" strokeWidth="1.400" strokeLinecap="round" />
    </svg>
  );
}

// 고리별 — 자전하는 보라 행성 + 금빛 고리 + 공전하는 달
export function RingPlanet({ size = 130 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-65 -65 130 130" aria-hidden>
      <defs>
        <clipPath id="pl-clip"><circle r="22" /></clipPath>
        <Shade id="pl-shade" />
      </defs>
      <ellipse rx="44" ry="10" fill="none" stroke="#c9b8ff" strokeWidth="2" opacity="0.35" transform="rotate(-20)" />
      <g clipPath="url(#pl-clip)">
        <circle r="22" fill="#5b3fd6" />
        <g className="surface">
          {[-60, -20, 20, 60].map((x) => (
            <g key={x} transform={`translate(${x} 0)`}>
              <ellipse cx="0" cy="-9" rx="16" ry="3.2" fill="#8f7bff" />
              <ellipse cx="12" cy="2" rx="20" ry="3.6" fill="#3d2aa8" />
              <ellipse cx="-6" cy="12" rx="14" ry="2.8" fill="#b9a8ff" />
            </g>
          ))}
        </g>
        <circle r="22" fill="url(#pl-shade)" />
      </g>
      <path d="M-41.300 14.100 A44 10 -20 0 0 41.300 -14.100" fill="none" stroke="#ffd98a" strokeWidth="2.4" strokeLinecap="round" opacity="0.9" />
      <g className="orbit-fast">
        <circle r="58" fill="none" />
        <circle cx="58" cy="0" r="4" fill="#d9f7ff" />
      </g>
    </svg>
  );
}

// 꼬마 태양계 — 행성 셋이 제각각의 빠르기로 돈다
export function MiniSolar({ size = 170 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-85 -85 170 170" aria-hidden>
      <circle r="9" fill="#ffd98a" />
      <circle r="16" fill="#ffd98a" opacity="0.18" className="ob-beam" />
      {[30, 50, 74].map((r) => (
        <circle key={r} r={r} fill="none" stroke="#a9a3d9" strokeWidth="0.6" strokeDasharray="2 4" opacity="0.5" />
      ))}
      <g className="orbit-fast"><circle r="30" fill="none" /><circle cx="30" r="3.200" fill="#3fe0c0" /></g>
      <g className="orbit"><circle r="50" fill="none" /><circle cx="-50" r="5" fill="#ff7ac8" /></g>
      <g className="orbit-slow"><circle r="74" fill="none" /><circle cy="74" r="4.200" fill="#5cb8ff" /><ellipse cy="74" rx="8" ry="2" fill="none" stroke="#d9f7ff" strokeWidth="0.8" /></g>
    </svg>
  );
}

// 탐사선 — 태양 전지판을 편 작은 위성. 천천히 떠다닌다
export function Probe({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-28 -28 56 56" aria-hidden>
      <g transform="rotate(-24)">
        <rect x="-26" y="-5" width="15" height="10" rx="1.500" fill="#2f49c9" stroke="#9db2ff" strokeWidth="1" />
        <rect x="11" y="-5" width="15" height="10" rx="1.500" fill="#2f49c9" stroke="#9db2ff" strokeWidth="1" />
        <path d="M-21 -5 v10 M-16 -5 v10 M16 -5 v10 M21 -5 v10" stroke="#9db2ff" strokeWidth="0.700" />
        <rect x="-11" y="-1" width="22" height="2" fill="#c9cfee" />
        <rect x="-7" y="-8" width="14" height="16" rx="3" fill="#eef0ff" />
        <circle cy="-1" r="3.200" fill="#19c8e6" />
        <path d="M0 -8 v-7" stroke="#eef0ff" strokeWidth="1.400" />
        <path d="M-5 -15 q5 -5 10 0z" fill="#ffd98a" />
        <circle cy="12" r="2" fill="#ff5f5f" className="ob-beam" />
      </g>
    </svg>
  );
}

export const SPACE_OBJECTS: { key: SpaceObjectKey; name: string; desc: string }[] = [
  { key: "giant", name: "줄무늬 거인", desc: "큰 궤도를 천천히" },
  { key: "ocean", name: "물빛별", desc: "달을 데리고 공전" },
  { key: "candy", name: "솜사탕별", desc: "작고 빠르게" },
  { key: "ring", name: "고리별", desc: "제자리에서 자전" },
  { key: "solar", name: "꼬마 태양계", desc: "행성 셋이 돈다" },
  { key: "galaxy", name: "나선 은하", desc: "아주 느리게 회전" },
  { key: "probe", name: "탐사선", desc: "둥둥 떠다닌다" },
];

export function SpaceObject({ k, size }: { k: SpaceObjectKey; size: number }) {
  if (k === "giant") return <GiantPlanet size={size} />;
  if (k === "ocean") return <OceanPlanet size={size} />;
  if (k === "candy") return <CandyPlanet size={size} />;
  if (k === "ring") return <RingPlanet size={size} />;
  if (k === "solar") return <MiniSolar size={size} />;
  if (k === "galaxy") return <Galaxy size={size} spin={false} />;
  return <Probe size={size} />;
}

export const DEFAULT_SPACE: SpacePrefs = { mood: "normal", speed: "normal", motion: true, shooting: true, hidden: [] };
const SPEED = { slow: 2, normal: 1, fast: 0.45 }; // 한 바퀴 시간에 곱한다
const MOOD = { calm: 0.4, normal: 0.78, vivid: 1 };

// 큰 궤도 — 화면 가운데를 중심으로 도는 세 행성. 반지름은 화면 너비에 맞춘다(cqw)
const RIDERS: { key: SpaceObjectKey; r: number; dur: number; from: number; size: number }[] = [
  { key: "giant", r: 46, dur: 180, from: 0.06, size: 92 },
  { key: "ocean", r: 38, dur: 120, from: 0.55, size: 78 },
  { key: "candy", r: 49, dur: 75, from: 0.4, size: 46 },
];

export function Starfield({ prefs }: { prefs?: Partial<SpacePrefs> }) {
  const p = { ...DEFAULT_SPACE, ...prefs };
  const on = (k: SpaceObjectKey) => !p.hidden.includes(k);
  const k = SPEED[p.speed];
  const rings = [...new Set(RIDERS.filter((r) => on(r.key)).map((r) => r.r))];
  return (
    <div className={`starfield ${p.motion ? "" : "still"} ${p.mood === "vivid" ? "vivid" : ""}`} style={{ opacity: MOOD[p.mood] }} aria-hidden>
      <svg viewBox="0 0 430 932" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" className="absolute inset-0">
        <defs>
          <radialGradient id="neb-a" cx="0.15" cy="0.12" r="0.6">
            <stop offset="0" stopColor="#2a3fa8" stopOpacity="0.30" />
            <stop offset="1" stopColor="#6d3bff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="neb-b" cx="0.95" cy="0.45" r="0.55">
            <stop offset="0" stopColor="#7a3fb0" stopOpacity="0.14" />
            <stop offset="1" stopColor="#ff4fb4" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="mw-glow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8b6cff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#8b6cff" stopOpacity="0.28" />
            <stop offset="1" stopColor="#8b6cff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="mw-core" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffe9c4" stopOpacity="0" />
            <stop offset="0.5" stopColor="#ffe9c4" stopOpacity="0.2" />
            <stop offset="1" stopColor="#ffe9c4" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="neb-c" cx="0.3" cy="1" r="0.6">
            <stop offset="0" stopColor="#1a6f8f" stopOpacity="0.16" />
            <stop offset="1" stopColor="#19c8e6" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="430" height="932" fill="#04060f" />
        <rect width="430" height="932" fill="url(#neb-a)" />
        <rect width="430" height="932" fill="url(#neb-b)" />
        <rect width="430" height="932" fill="url(#neb-c)" />
        {/* 은하수 띠 */}
        <g transform="translate(215 470) rotate(-58)" className="milky">
          <rect x="-340" y="-130" width="680" height="260" fill="url(#mw-glow)" />
          <rect x="-340" y="-46" width="680" height="92" fill="url(#mw-core)" />
          <g transform="translate(-275 0)">
            {MILKY.map((d, i) => (
              <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.c} opacity={d.o} />
            ))}
          </g>
          {/* 어두운 먼지 띠 */}
          <path d="M-340 6 C-200 -14 -80 22 40 2 S 260 -12 340 8" stroke="#05041a" strokeWidth="14" fill="none" opacity="0.45" strokeLinecap="round" />
        </g>
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.hue} className={`tw tw-${s.tw}`} />
        ))}
        {/* 별똥별 */}
        {p.shooting && <line x1="60" y1="300" x2="120" y2="330" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" className="shooting" />}
        {p.shooting && <line x1="250" y1="90" x2="300" y2="118" stroke="#ffe9c4" strokeWidth="1" strokeLinecap="round" className="shooting shooting-2" />}
      </svg>

      {on("galaxy") && (
        <div className="starfield-galaxy">
          <Galaxy size={300} />
        </div>
      )}
      {on("ring") && <div className="sky-obj float" style={{ right: "-18px", top: "11%" }}><RingPlanet size={150} /></div>}
      {on("solar") && <div className="sky-obj" style={{ left: "-46px", bottom: "12%" }}><MiniSolar size={190} /></div>}
      {on("probe") && <div className="sky-obj probe-drift" style={{ right: "14px", top: "60%" }}><Probe size={58} /></div>}

      {/* 큰 궤도 — 점선 길을 따라 행성이 돈다. 카드 뒤로 숨었다가 가장자리에서 다시 나온다 */}
      <div className="orbit-sys">
        {rings.map((r) => (
          <span key={r} className="orbit-ring" style={{ width: `${r * 2}cqw`, height: `${r * 2}cqw` }} />
        ))}
        {RIDERS.filter((r) => on(r.key)).map((r) => {
          const time = { animationDuration: `${r.dur * k}s`, animationDelay: `${-r.dur * k * r.from}s` };
          return (
            <div key={r.key} className="rider" style={time}>
              <div className="rider-arm" style={{ transform: `translateX(${r.r}cqw)` }}>
                <div className="rider-up" style={time}>
                  <SpaceObject k={r.key} size={r.size} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 코치 아바타 — 고리를 두른 작은 행성
export function CoachAvatar({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="shrink-0">
      <defs>
        <radialGradient id="co-p" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#d8c9ff" />
          <stop offset="0.5" stopColor="#8b6cff" />
          <stop offset="1" stopColor="#3a1f9e" />
        </radialGradient>
      </defs>
      <ellipse cx="16" cy="17" rx="15" ry="4.6" fill="none" stroke="#ffd98a" strokeWidth="1.6" transform="rotate(-18 16 17)" opacity="0.55" />
      <circle cx="16" cy="16" r="9" fill="url(#co-p)" />
      <path d="M2.2 20.6 A15 4.6 -18 0 0 29.8 13.4" fill="none" stroke="#ffd98a" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="11.500" cy="11" r="1.6" fill="#fff" opacity="0.7" />
      {/* 얼굴 — 고리 위로 빼꼼 */}
      <g className="ob-blink">
        <circle cx="13" cy="14.600" r="1.300" fill="#1a1140" />
        <circle cx="19" cy="14.600" r="1.300" fill="#1a1140" />
      </g>
      <circle cx="11" cy="17" r="1.300" fill="#ff7ac8" opacity="0.7" />
      <circle cx="21" cy="17" r="1.300" fill="#ff7ac8" opacity="0.7" />
      <path d="M14.200 17 q1.800 1.800 3.600 0" fill="none" stroke="#1a1140" strokeWidth="1.100" strokeLinecap="round" />
    </svg>
  );
}

export function Rocket({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2c4 3 5.5 7.5 5 12l-2.2 2.2H9.2L7 14C6.5 9.500 8 5 12 2z" fill="#ece9ff" />
      <circle cx="12" cy="9.5" r="2.2" fill="#19c8e6" />
      <path d="M7 14l-3 3.5 3.8-.6M17 14l3 3.5-3.800-.6" fill="#ff4fb4" />
      <path d="M10 17.500c.4 2 1.200 3.300 2 4.500.8-1.200 1.600-2.500 2-4.500z" fill="#ffd98a" />
    </svg>
  );
}

// 역할별 행성 — 질문의 폭이 AI를 앉힌 자리
const ROLE_PLANET: Record<string, { body: string; band: string; ring?: string; moons: number }> = {
  typist: { body: "#8d89b8", band: "#6b6796", moons: 0 },
  coder: { body: "#3f8fe0", band: "#8fd0ff", moons: 1 },
  engineer: { body: "#1fb89a", band: "#9af5e0", ring: "#d9fff7", moons: 1 },
  architect: { body: "#d94fa6", band: "#ffb8e6", ring: "#ffd98a", moons: 2 },
  encyclopedia: { body: "#d9a441", band: "#ffe9b8", moons: 0 },
};

export function RolePlanet({ role, size = 28 }: { role: string; size?: number }) {
  const p = ROLE_PLANET[role] ?? ROLE_PLANET.typist;
  const id = `rp-${role}`;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="shrink-0">
      <defs>
        <clipPath id={id}><circle cx="20" cy="20" r="11" /></clipPath>
        <radialGradient id={`${id}-s`} cx="0.3" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.6" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
      </defs>
      {p.ring && <ellipse cx="20" cy="20" rx="18" ry="5" fill="none" stroke={p.ring} strokeWidth="1.6" opacity="0.45" transform="rotate(-20 20 20)" />}
      <g clipPath={`url(#${id})`}>
        <circle cx="20" cy="20" r="11" fill={p.body} />
        <ellipse cx="18" cy="15" rx="12" ry="2" fill={p.band} opacity="0.8" />
        <ellipse cx="23" cy="22" rx="12" ry="2.4" fill={p.band} opacity="0.5" />
        <circle cx="20" cy="20" r="11" fill={`url(#${id}-s)`} />
      </g>
      {p.ring && <path d="M3.100 26.200 A18 5 -20 0 0 36.900 13.800" fill="none" stroke={p.ring} strokeWidth="1.8" strokeLinecap="round" />}
      {p.moons >= 1 && <circle cx="35" cy="9" r="2.200" fill="#efeaff" />}
      {p.moons >= 2 && <circle cx="5" cy="32" r="1.600" fill="#ffd98a" />}
    </svg>
  );
}

// 성장 캐릭터 '별이' — 아이디어 칸이 찰수록 별먼지 → 아기별 → 행성 → 항성계 → 은하로 자란다
const BUDDY = [
  { body: "#9aa3c7", cheek: "#c3c9e6", r: 13 },
  { body: "#ffd24a", cheek: "#ff9f6b", r: 17 },
  { body: "#5ad1b3", cheek: "#ff9fc4", r: 20 },
  { body: "#7c9cff", cheek: "#ff9fc4", r: 22 },
  { body: "#c58bff", cheek: "#ffd24a", r: 24 },
];

export function Buddy({ stage, size = 72 }: { stage: number; size?: number }) {
  const s = Math.max(0, Math.min(4, stage));
  const b = BUDDY[s];
  const eye = b.r * 0.13;
  return (
    <svg width={size} height={size} viewBox="-40 -40 80 80" aria-hidden className="buddy shrink-0">
      {/* 은하: 뒤에서 도는 소용돌이 */}
      {s >= 4 && (
        <g className="orbit-slow" opacity="0.9">
          {[0, 120, 240].map((a) => (
            <path key={a} d="M0 0 C 14 -6 30 2 34 18" fill="none" stroke="#ffd24a" strokeWidth="3" strokeLinecap="round" transform={`rotate(${a})`} opacity="0.7" />
          ))}
        </g>
      )}
      {/* 항성계: 궤도와 도는 달 */}
      {s >= 3 && (
        <>
          <circle r="34" fill="none" stroke="#3a4577" strokeWidth="1.2" strokeDasharray="3 4" />
          <g className="orbit-fast"><circle r="34" fill="none" /><circle cx="34" r="4" fill="#ff9fc4" /></g>
          <g className="orbit"><circle r="34" fill="none" /><circle cx="-34" r="3" fill="#5ad1b3" /></g>
        </>
      )}
      {/* 행성: 고리 (뒤쪽 반) */}
      {s >= 2 && <ellipse rx={b.r + 11} ry="6" fill="none" stroke="#ffd24a" strokeWidth="3" opacity="0.45" transform="rotate(-16)" />}
      {/* 아기별: 뾰족한 빛 */}
      {s === 1 && [0, 72, 144, 216, 288].map((a) => <path key={a} d={`M0 ${-b.r - 9} L4 ${-b.r + 1} L-4 ${-b.r + 1} Z`} fill={b.body} transform={`rotate(${a})`} />)}
      <circle r={b.r} fill={b.body} />
      <ellipse cx={-b.r * 0.3} cy={-b.r * 0.4} rx={b.r * 0.35} ry={b.r * 0.2} fill="#fff" opacity="0.35" />
      {/* 얼굴 */}
      <circle cx={-b.r * 0.35} cy={-1} r={eye + 1} fill="#1a1f3d" />
      <circle cx={b.r * 0.35} cy={-1} r={eye + 1} fill="#1a1f3d" />
      <circle cx={-b.r * 0.35 + 0.8} cy={-1.8} r={eye * 0.45} fill="#fff" />
      <circle cx={b.r * 0.35 + 0.8} cy={-1.8} r={eye * 0.45} fill="#fff" />
      <path d={s === 0 ? `M-3 ${b.r * 0.4} h6` : `M-4 ${b.r * 0.32} q4 ${3 + s} 8 0`} fill="none" stroke="#1a1f3d" strokeWidth="1.8" strokeLinecap="round" />
      {s >= 1 && (
        <>
          <circle cx={-b.r * 0.62} cy={b.r * 0.22} r={b.r * 0.13} fill={b.cheek} opacity="0.8" />
          <circle cx={b.r * 0.62} cy={b.r * 0.22} r={b.r * 0.13} fill={b.cheek} opacity="0.8" />
        </>
      )}
      {/* 행성: 고리 (앞쪽 반) */}
      {s >= 2 && <path d={`M${-(b.r + 11) * 0.96} ${(b.r + 11) * 0.28 * 0.2 + 3} A${b.r + 11} 6 -16 0 0 ${(b.r + 11) * 0.96} ${-3 - (b.r + 11) * 0.05}`} fill="none" stroke="#ffd24a" strokeWidth="3.4" strokeLinecap="round" />}
      {/* 은하: 왕관 */}
      {s >= 4 && <path d={`M-9 ${-b.r - 2} l3 -9 l6 6 l6 -6 l3 9 z`} fill="#ffd24a" stroke="#c99a1e" strokeWidth="1" />}
    </svg>
  );
}
