// 프로필 고르기용 캐릭터 (커스텀 SVG) — 학년은 우주에서 자라는 길, 관심사는 얼굴 달린 도구 친구들.
// 고른 것만 움직인다. 색은 askback.css 의 밤하늘 팔레트를 따른다.

// 작은 얼굴 — 눈 두 개와 웃는 입. 어디든 붙인다
function MiniFace({ x, y, ink = "#2a1a4a", gap = 4, blush = true }: { x: number; y: number; ink?: string; gap?: number; blush?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="ob-blink">
        <circle cx={-gap} r="1.500" fill={ink} />
        <circle cx={gap} r="1.500" fill={ink} />
      </g>
      {blush && <circle cx={-gap - 2.600} cy="2.600" r="1.500" fill="#ff7ac8" opacity="0.65" />}
      {blush && <circle cx={gap + 2.600} cy="2.600" r="1.500" fill="#ff7ac8" opacity="0.65" />}
      <path d="M-2.200 2.600q2.200 2.400 4.400 0" fill="none" stroke={ink} strokeWidth="1.300" strokeLinecap="round" />
    </g>
  );
}

const STAR4 = "M0 -4L1.100 -1.100 4 0 1.100 1.100 0 4 -1.100 1.100 -4 0 -1.100 -1.100Z";

// ── 학년 — 초승달 → 행성 → 고리 행성 → 로켓 → 위성 → 은하, 그리고 어디서든 온 UFO ──
export const GRADE_TONE: Record<string, [string, string]> = {
  중1: ["#ffe9a8", "#33290a"],
  중2: ["#5ad1b3", "#0e2f2c"],
  중3: ["#ff7ac8", "#35163a"],
  고1: ["#ff8a5c", "#3a1c10"],
  고2: ["#5c9dff", "#12284d"],
  고3: ["#c58bff", "#2a1a4a"],
  기타: ["#8fe9ff", "#0f2b3a"],
};

export function GradeArt({ grade, size = 40, on = false }: { grade: string; size?: number; on?: boolean }) {
  const move = on ? "ob-bob" : undefined;
  const body = () => {
    switch (grade) {
      case "중1":
        return (
          <g className={move}>
            <path d="M29 7.500A17 17 0 1 0 41 30 13.500 13.500 0 0 1 29 7.500z" fill="#ffe9a8" stroke="#e0b94a" strokeWidth="1.200" strokeLinejoin="round" />
            <MiniFace x={20} y={27} gap={3.400} />
            <path d={STAR4} transform="translate(37 12)" fill="#fff" className="tw" />
          </g>
        );
      case "중2":
        return (
          <g className={move}>
            <circle cx="24" cy="24" r="16" fill="#5ad1b3" stroke="#2f8f7a" strokeWidth="1.200" />
            <circle cx="15" cy="16" r="3" fill="#3aa98e" />
            <circle cx="33" cy="33" r="2.400" fill="#3aa98e" />
            <circle cx="34" cy="15" r="1.600" fill="#3aa98e" />
            <path d="M12 17q4-7 11-8" fill="none" stroke="#fff" strokeWidth="1.600" strokeLinecap="round" opacity="0.5" />
            <MiniFace x={24} y={25} />
          </g>
        );
      case "중3":
        return (
          <g className={move}>
            <g transform="rotate(-18 24 24)">
              <ellipse cx="24" cy="24" rx="21" ry="6" fill="none" stroke="#8fe9ff" strokeWidth="2" opacity="0.45" />
              <circle cx="24" cy="24" r="12.500" fill="#ff7ac8" stroke="#c94f9a" strokeWidth="1.200" />
              <path d="M13 21q11 4 22-1" fill="none" stroke="#ffb3e0" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
              <path d="M3 24A21 6 0 0 0 45 24" fill="none" stroke="#8fe9ff" strokeWidth="2.400" strokeLinecap="round" />
            </g>
            <MiniFace x={24} y={22} gap={3.600} />
          </g>
        );
      case "고1":
        return (
          <g className={move}><g transform="rotate(35 24 24)">
            <path d="M19 37q5 9 10 0z" fill="#ffc83d" className="ob-beam" />
            <path d="M21 37q3 5 6 0z" fill="#ff5f7a" />
            <path d="M16 28l-6 9 8-2zM32 28l6 9-8-2z" fill="#ff5f7a" stroke="#b9304a" strokeWidth="1" strokeLinejoin="round" />
            <path d="M24 3c7 6 9 15 8 26l-2 8H18l-2-8C15 18 17 9 24 3z" fill="#eef0ff" stroke="#b9c4ff" strokeWidth="1.200" strokeLinejoin="round" />
            <path d="M24 3c3.400 2.900 5.600 6.400 6.900 10.500H17.100C18.400 9.400 20.600 5.900 24 3z" fill="#ff8a5c" />
            <circle cx="24" cy="21" r="5" fill="#1a2260" stroke="#8fe9ff" strokeWidth="1.500" />
            <MiniFace x={24} y={20.500} ink="#fff" gap={1.900} blush={false} />
          </g></g>
        );
      case "고2":
        return (
          <g className={move}><g transform="rotate(-20 24 24)">
            <path d="M15 24H9M33 24h6" stroke="#b9c4ff" strokeWidth="2" />
            <g fill="#2f49c9" stroke="#8fb4ff" strokeWidth="1">
              <rect x="1" y="17" width="9" height="14" rx="1.500" />
              <rect x="38" y="17" width="9" height="14" rx="1.500" />
            </g>
            <path d="M1 24h9M38 24h9M5.500 17v14M42.500 17v14" stroke="#8fb4ff" strokeWidth="0.800" />
            <rect x="15" y="15" width="18" height="18" rx="4" fill="#eef0ff" stroke="#b9c4ff" strokeWidth="1.200" />
            <path d="M24 15v-5" stroke="#b9c4ff" strokeWidth="1.600" />
            <path d="M18 9a6 3 0 0 0 12 0z" fill="#ffc83d" stroke="#b98a12" strokeWidth="1" />
            <MiniFace x={24} y={23} gap={3.400} />
            <circle cx="24" cy="5" r="2.500" fill="none" stroke="#8fe9ff" strokeWidth="1.200" className="ob-ping" />
          </g></g>
        );
      case "고3":
        return (
          <g>
            <g className={on ? "orbit-fast" : undefined}>
              <circle cx="24" cy="24" r="22" fill="none" />
              <path d="M24 24c0-7 9-10 14-4 5 7-1 18-12 19" fill="none" stroke="#c58bff" strokeWidth="3.400" strokeLinecap="round" />
              <path d="M24 24c0 7-9 10-14 4-5-7 1-18 12-19" fill="none" stroke="#8fe9ff" strokeWidth="3.400" strokeLinecap="round" />
              <circle cx="40" cy="31" r="1.300" fill="#fff" />
              <circle cx="8" cy="17" r="1.300" fill="#fff" />
              <circle cx="31" cy="8" r="1" fill="#ffd98a" />
              <circle cx="16" cy="40" r="1" fill="#ffd98a" />
            </g>
            <circle cx="24" cy="24" r="8.500" fill="#fff3c4" stroke="#ffc46b" strokeWidth="1.200" />
            <MiniFace x={24} y={23} gap={3} />
          </g>
        );
      default:
        return (
          <g className={move}>
            <path d="M16 30l-5 14h26l-5-14z" fill="#8fe9ff" opacity="0.22" className="ob-beam" />
            <path d="M13 23a11 11 0 0 1 22 0z" fill="#1a2260" stroke="#8fe9ff" strokeWidth="1.400" />
            <MiniFace x={24} y={17} ink="#fff" gap={3.200} blush={false} />
            <ellipse cx="24" cy="26" rx="21" ry="7" fill="#eef0ff" stroke="#b9c4ff" strokeWidth="1.200" />
            {[8, 16, 24, 32, 40].map((x, i) => (
              <circle key={x} cx={x} cy={26.500 + (i === 2 ? 1.500 : i % 4 ? 1 : 0)} r="1.700" fill={["#ff7ac8", "#ffc83d", "#5ad1b3", "#ffc83d", "#ff7ac8"][i]} className={`tw tw-${i % 3}`} />
            ))}
          </g>
        );
    }
  };
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden className="shrink-0 overflow-visible">
      {body()}
    </svg>
  );
}

// ── 관심사 — 로봇 · 보드 · 연필 · 플라스크 · 슬레이트 · 별똥별 ──
export const INTEREST_TONE: Record<string, [string, string]> = {
  코딩: ["#5c9dff", "#12284d"],
  아두이노: ["#3fe0c0", "#0e2f2c"],
  글쓰기: ["#ffc83d", "#33290a"],
  탐구보고서: ["#c58bff", "#2a1a4a"],
  영상: ["#ff7ac8", "#35163a"],
  기타: ["#8fe9ff", "#0f2b3a"],
};

export function InterestArt({ kind, size = 48, on = false }: { kind: string; size?: number; on?: boolean }) {
  const move = on ? "ob-wiggle" : undefined;
  const body = () => {
    switch (kind) {
      case "코딩":
        return (
          <g className={move}>
            <path d="M24 10V5" stroke="#b9c4ff" strokeWidth="1.800" strokeLinecap="round" />
            <circle cx="24" cy="4" r="2.400" fill="#ffc83d" className="ob-beam" />
            <rect x="3" y="20" width="5" height="10" rx="2.500" fill="#ffc83d" />
            <rect x="40" y="20" width="5" height="10" rx="2.500" fill="#ffc83d" />
            <rect x="7" y="10" width="34" height="28" rx="8" fill="#5c9dff" stroke="#2f6bff" strokeWidth="1.200" />
            <rect x="11.500" y="15" width="25" height="16" rx="4" fill="#0b1230" />
            <path d="M19 19l-4 4 4 4M29 19l4 4-4 4" fill="none" stroke="#8fe9ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M25.800 18.500l-3.600 9" stroke="#ff7ac8" strokeWidth="2" strokeLinecap="round" />
            <path d="M20 34.500h8" stroke="#0b1230" strokeWidth="1.600" strokeLinecap="round" />
            <rect x="17" y="38" width="14" height="6" rx="2" fill="#2f49c9" />
          </g>
        );
      case "아두이노":
        return (
          <g className={move}>
            <rect x="2" y="17" width="8" height="9" rx="1.500" fill="#c9d0ee" stroke="#8a93b8" strokeWidth="1" />
            <rect x="6" y="10" width="38" height="30" rx="5" fill="#0e8a7d" stroke="#3fe0c0" strokeWidth="1.400" />
            <rect x="14" y="7" width="26" height="4.500" rx="1" fill="#10142b" />
            <rect x="20" y="38.500" width="20" height="4.500" rx="1" fill="#10142b" />
            {[17, 21, 25, 29, 33, 37].map((x) => (
              <circle key={x} cx={x} cy="9.200" r="0.900" fill="#ffc83d" />
            ))}
            <path d="M16 19v-2.500M21 19v-2.500M27 19v-2.500M32 19v-2.500M16 33v2.500M21 33v2.500M27 33v2.500M32 33v2.500" stroke="#c9d0ee" strokeWidth="1.400" />
            <rect x="12.500" y="18.500" width="23" height="15" rx="2.500" fill="#10142b" />
            <MiniFace x={24} y={24.500} ink="#fff" />
            <circle cx="40" cy="16" r="2" fill="#ff5f7a" className="ob-beam" />
            <circle cx="40" cy="23" r="1.500" fill="#ffc83d" />
          </g>
        );
      case "글쓰기":
        return (
          <g>
            <path d="M6 44q3-3.500 6 0t6 0" fill="none" stroke="#ff7ac8" strokeWidth="2" strokeLinecap="round" />
            <g className={move}><g transform="rotate(24 24 24)">
              <rect x="16" y="1" width="16" height="8" rx="3" fill="#ff7ac8" />
              <rect x="16" y="8" width="16" height="4" fill="#c9d0ee" />
              <rect x="16" y="12" width="16" height="22" fill="#ffc83d" stroke="#b98a12" strokeWidth="1" />
              <path d="M21.300 12v22M26.700 12v22" stroke="#e0a92a" strokeWidth="1" />
              <path d="M16 34h16l-8 12z" fill="#fff1d6" stroke="#b98a12" strokeWidth="1" strokeLinejoin="round" />
              <path d="M21.300 42h5.400L24 46z" fill="#2a1a4a" />
              <rect x="18.500" y="16" width="11" height="12" rx="4" fill="#ffe9a8" />
              <MiniFace x={24} y={20.500} gap={2.600} blush={false} />
            </g></g>
          </g>
        );
      case "탐구보고서":
        return (
          <g>
            <circle cx="22" cy="14" r="1.800" fill="#9af5e0" className="ob-bob" />
            <circle cx="27" cy="8" r="1.300" fill="#9af5e0" className="ob-bob" style={{ animationDelay: "0.6s" }} />
            <g className={move}>
              <path d="M15.200 29h17.600l5.600 10.600a2.600 2.600 0 0 1-2.300 3.800H11.900a2.600 2.600 0 0 1-2.300-3.800z" fill="#5ad1b3" />
              <path d="M18.500 4h11v3.500H28v10l10.800 20.600a3.600 3.600 0 0 1-3.200 5.300H12.400a3.600 3.600 0 0 1-3.200-5.300L20 17.500v-10h-1.500z" fill="rgba(255,255,255,0.1)" stroke="#c9b8ff" strokeWidth="1.600" strokeLinejoin="round" />
              <path d="M14 36l3-5.500" stroke="#fff" strokeWidth="1.600" strokeLinecap="round" opacity="0.55" />
              <MiniFace x={24} y={35} gap={3.600} />
            </g>
            <g transform="translate(37 12)">
              <circle r="5" fill="rgba(143,233,255,0.18)" stroke="#ffc83d" strokeWidth="1.800" />
              <path d="M3.600 3.600l4.400 4.400" stroke="#ffc83d" strokeWidth="2.400" strokeLinecap="round" />
            </g>
          </g>
        );
      case "영상":
        return (
          <g className={move}>
            <g transform="rotate(-14 6 19)">
              <rect x="6" y="11" width="36" height="8" rx="2" fill="#eef0ff" stroke="#ff9bd8" strokeWidth="1" />
              {[10, 19, 28, 37].map((x) => (
                <path key={x} d={`M${x} 11h4.500l-3.500 8h-4.500z`} fill="#2a1a4a" />
              ))}
            </g>
            <rect x="6" y="19" width="36" height="24" rx="4" fill="#3a1d52" stroke="#ff9bd8" strokeWidth="1.400" />
            <path d="M6 25h36" stroke="#ff9bd8" strokeWidth="1" opacity="0.6" />
            <MiniFace x={20} y={32} ink="#fff" gap={3.400} />
            <path d="M32.500 29.500v8l6.500-4z" fill="#ffc83d" stroke="#b98a12" strokeWidth="0.800" strokeLinejoin="round" />
          </g>
        );
      default:
        return (
          <g className={move}>
            <path d="M22 27L5 44M27 31L14 45M18 23L4 34" stroke="#8fe9ff" strokeWidth="2.400" strokeLinecap="round" opacity="0.55" strokeDasharray="1 5" />
            <circle cx="29" cy="19" r="13" fill="#fff3c4" stroke="#ffc46b" strokeWidth="1.400" />
            <path d="M20 14q3-6 9-7" fill="none" stroke="#fff" strokeWidth="1.600" strokeLinecap="round" opacity="0.7" />
            <MiniFace x={29} y={19} />
            <path d={STAR4} transform="translate(9 12)" fill="#ff7ac8" className="tw" />
            <path d={STAR4} transform="translate(42 38) scale(0.8)" fill="#8fe9ff" className="tw tw-2" />
          </g>
        );
    }
  };
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden className="shrink-0 overflow-visible">
      {body()}
    </svg>
  );
}

// 프로젝트 행성 — 고른 이모지가 행성 위에 서고, 이름을 쓰면 고리와 깃발이 생긴다
export function ProjectPlanet({ emoji, named, size = 120 }: { emoji: string; named: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden className="shrink-0 overflow-visible">
      <defs>
        <radialGradient id="pp-body" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor={named ? "#9af5e0" : "#56608f"} />
          <stop offset="1" stopColor={named ? "#1d6e8a" : "#232b52"} />
        </radialGradient>
        <radialGradient id="pp-glow">
          <stop offset="0" stopColor="#5ad1b3" stopOpacity="0.45" />
          <stop offset="1" stopColor="#5ad1b3" stopOpacity="0" />
        </radialGradient>
      </defs>
      {named && <circle cx="60" cy="66" r="58" fill="url(#pp-glow)" className="ob-beam" />}
      <g className="ob-bob">
        {named && <ellipse cx="60" cy="72" rx="54" ry="12" fill="none" stroke="#ffc83d" strokeWidth="2.400" opacity="0.4" transform="rotate(-14 60 72)" />}
        <circle cx="60" cy="72" r="34" fill="url(#pp-body)" stroke={named ? "#5ad1b3" : "#3a4478"} strokeWidth="1.600" strokeDasharray={named ? undefined : "4 5"} />
        <circle cx="44" cy="84" r="5" fill="#000" opacity="0.14" />
        <circle cx="78" cy="90" r="3.500" fill="#000" opacity="0.14" />
        <circle cx="80" cy="64" r="2.600" fill="#000" opacity="0.14" />
        {named && <path d="M7.600 85A54 12 -14 0 0 112.400 59" fill="none" stroke="#ffc83d" strokeWidth="3" strokeLinecap="round" />}
        {named && (
          <g className="ob-pop">
            <path d="M84 46V24" stroke="#eef0ff" strokeWidth="2" strokeLinecap="round" />
            <path d="M84 24l14 4.500-14 5z" fill="#ff5fb0" className="ob-wiggle" />
          </g>
        )}
        <text key={emoji} x="60" y="52" textAnchor="middle" fontSize="34" className="ob-pop">{emoji}</text>
      </g>
      {named && <path d={STAR4} transform="translate(18 28) scale(1.4)" fill="#fff" className="tw" />}
      {named && <path d={STAR4} transform="translate(104 100)" fill="#8fe9ff" className="tw tw-2" />}
    </svg>
  );
}

// ── 새 프로젝트 — 형식 다섯: 학사모 쓴 논문 · 돋보기 · 확성기 · 노트북 · 바퀴 달린 기계 ──
export function FormatArt({ k, size = 48, on = false }: { k: string; size?: number; on?: boolean }) {
  const move = on ? "ob-wiggle" : undefined;
  const body = () => {
    switch (k) {
      case "paper":
        return (
          <g className={move}>
            <path d="M12 11h18l8 8v23a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V13a2 2 0 0 1 2-2z" fill="#f4edff" stroke="#b26bff" strokeWidth="1.400" strokeLinejoin="round" />
            <path d="M30 11v8h8" fill="#d9c2ff" stroke="#b26bff" strokeWidth="1.400" strokeLinejoin="round" />
            <path d="M15 24h13M15 39h9" stroke="#b9a8ff" strokeWidth="1.800" strokeLinecap="round" />
            <MiniFace x={24} y={30.500} />
            <path d="M22 1.500l13 4.500-13 4.500L9 6z" fill="#2a1a4a" stroke="#b26bff" strokeWidth="1.200" strokeLinejoin="round" />
            <path d="M35 6v6.500" stroke="#ffc83d" strokeWidth="1.400" strokeLinecap="round" />
            <circle cx="35" cy="13.500" r="1.600" fill="#ffc83d" />
          </g>
        );
      case "research":
        return (
          <g className={move}>
            <rect x="4" y="33" width="4" height="9" rx="1" fill="#5c9dff" opacity="0.8" />
            <rect x="10" y="28" width="4" height="14" rx="1" fill="#ff7ac8" opacity="0.8" />
            <path d="M31 31l10.500 10.500" stroke="#ffc83d" strokeWidth="5.500" strokeLinecap="round" />
            <circle cx="22" cy="21" r="14" fill="#10331f" stroke="#4ade80" strokeWidth="3" />
            <path d="M12.500 17q3-6.500 9.500-7" fill="none" stroke="#fff" strokeWidth="1.800" strokeLinecap="round" opacity="0.5" />
            <MiniFace x={22} y={21} ink="#eafff1" />
            <path d={STAR4} transform="translate(41 8)" fill="#fff" className="tw" />
          </g>
        );
      case "campaign":
        return (
          <g>
            <path d="M38 17q4.500 7 0 14M42.500 12.500q7.500 11.500 0 23" fill="none" stroke="#ffd98a" strokeWidth="2.200" strokeLinecap="round" className="ob-beam" />
            <g className={move}>
              <path d="M15 31l2.500 10.500h6L21 32z" fill="#b96a00" />
              <rect x="3" y="18" width="8" height="12" rx="2.500" fill="#eef0ff" stroke="#b9c4ff" strokeWidth="1" />
              <path d="M10 18.500L33 8v32L10 29.500z" fill="#ff9f1c" stroke="#b96a00" strokeWidth="1.400" strokeLinejoin="round" />
              <path d="M33 8v32" stroke="#ffe2a0" strokeWidth="3" strokeLinecap="round" />
              <MiniFace x={21} y={23} gap={3.400} />
            </g>
          </g>
        );
      case "service":
        return (
          <g className={move}>
            <rect x="8" y="7" width="32" height="25" rx="3.500" fill="#12284d" stroke="#5b8cff" strokeWidth="1.600" />
            <circle cx="12.500" cy="11" r="1" fill="#ff5f7a" />
            <circle cx="16" cy="11" r="1" fill="#ffc83d" />
            <circle cx="19.500" cy="11" r="1" fill="#5ad1b3" />
            <MiniFace x={24} y={19.500} ink="#fff" />
            <rect x="13" y="26.500" width="10" height="2.600" rx="1.300" fill="#5b8cff" />
            <path d="M3 36h42l-3 5.500H6z" fill="#c9d0ee" stroke="#8a93b8" strokeWidth="1" strokeLinejoin="round" />
            <path d="M20 38h8" stroke="#8a93b8" strokeWidth="1.400" strokeLinecap="round" />
            <path d="M33 22l9.500 4.500-4 1.300-1.500 4z" fill="#ffc83d" stroke="#b98a12" strokeWidth="0.900" strokeLinejoin="round" />
          </g>
        );
      default:
        return (
          <g className={move}>
            <path d="M24 13V6.500" stroke="#c9d0ee" strokeWidth="1.800" strokeLinecap="round" />
            <circle cx="24" cy="5" r="2.500" fill="#ff5f7a" className="ob-beam" />
            <path d="M6 22H2.500M45.500 22H42" stroke="#c9d0ee" strokeWidth="2.400" strokeLinecap="round" />
            <rect x="8" y="13" width="32" height="23" rx="6" fill="#38d5e8" stroke="#1a9fb0" strokeWidth="1.400" />
            <circle cx="17.500" cy="22" r="4.200" fill="#fff" />
            <circle cx="30.500" cy="22" r="4.200" fill="#fff" />
            <g className="ob-blink">
              <circle cx="18.300" cy="22.500" r="2" fill="#10142b" />
              <circle cx="31.300" cy="22.500" r="2" fill="#10142b" />
            </g>
            <path d="M20 30h8" stroke="#10142b" strokeWidth="1.800" strokeLinecap="round" />
            <circle cx="15" cy="40" r="4.500" fill="#10142b" stroke="#c9d0ee" strokeWidth="1.400" />
            <circle cx="33" cy="40" r="4.500" fill="#10142b" stroke="#c9d0ee" strokeWidth="1.400" />
            <circle cx="15" cy="40" r="1.300" fill="#ffc83d" />
            <circle cx="33" cy="40" r="1.300" fill="#ffc83d" />
          </g>
        );
    }
  };
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden className="shrink-0 overflow-visible">
      {body()}
    </svg>
  );
}

// 알고리즘 — 시작 · 갈림길 · 두 갈래로 이어지는 순서도
export function FlowArt({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden className="shrink-0">
      <path d="M24 12v6M15 25H9v8M33 25h6v8" fill="none" stroke="#8fb4ff" strokeWidth="1.800" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="14" y="3" width="20" height="9" rx="4.500" fill="#5c9dff" />
      <path d="M24 17l9 8-9 8-9-8z" fill="#ff7ac8" stroke="#c94f9a" strokeWidth="1" strokeLinejoin="round" className="ob-beam" />
      <path d="M22.500 23.200a1.700 1.700 0 1 1 2.500 1.500c-.7.4-1 .8-1 1.500" fill="none" stroke="#fff" strokeWidth="1.400" strokeLinecap="round" />
      <circle cx="24" cy="28.600" r="0.900" fill="#fff" />
      <rect x="2" y="33" width="14" height="10" rx="2.500" fill="#5ad1b3" />
      <rect x="32" y="33" width="14" height="10" rx="2.500" fill="#ffc83d" />
    </svg>
  );
}

// 전체 구조 — 서로 이어진 블록 탑과 깃발
export function BlocksArt({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden className="shrink-0">
      <rect x="4" y="30" width="18" height="13" rx="3" fill="#5ad1b3" stroke="#2f8f7a" strokeWidth="1" />
      <rect x="26" y="30" width="18" height="13" rx="3" fill="#5c9dff" stroke="#2f6bff" strokeWidth="1" />
      <rect x="14" y="15" width="20" height="13" rx="3" fill="#ffc83d" stroke="#b98a12" strokeWidth="1" />
      <path d="M22 36.500h4M19 28v2M29 28v2" stroke="#eef0ff" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="33" r="1.300" fill="#0e2f2c" /><circle cx="17" cy="33" r="1.300" fill="#0e2f2c" />
      <circle cx="31" cy="33" r="1.300" fill="#12284d" /><circle cx="39" cy="33" r="1.300" fill="#12284d" />
      <path d="M24 15V4" stroke="#eef0ff" strokeWidth="1.800" strokeLinecap="round" />
      <path d="M24 4l10 3.500-10 3.500z" fill="#ff5fb0" className="ob-wiggle" />
    </svg>
  );
}

// 바로 받는 피드백 — 내 물음표 말풍선과, 되돌아오는 코치의 물음표
export function AskBackArt({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden className="shrink-0">
      <path d="M9 4h17a6 6 0 0 1 6 6v7a6 6 0 0 1-6 6H15l-6 5v-5a6 6 0 0 1-6-6v-7a6 6 0 0 1 6-6z" fill="#2f49c9" stroke="#8fb4ff" strokeWidth="1.200" strokeLinejoin="round" />
      <path d="M14.500 11a3.200 3.200 0 1 1 4.800 2.800c-1.200.7-1.600 1.300-1.600 2.400" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <circle cx="17.700" cy="19.300" r="1.200" fill="#fff" />
      <g className="ob-bob">
        <path d="M22 22h17a6 6 0 0 1 6 6v7a6 6 0 0 1-6 6v5l-6-5H22a6 6 0 0 1-6-6v-7a6 6 0 0 1 6-6z" fill="#ffc83d" stroke="#b98a12" strokeWidth="1.200" strokeLinejoin="round" />
        <path d="M34 29a3.200 3.200 0 1 0-4.800 2.800c1.200.7 1.600 1.300 1.600 2.400" fill="none" stroke="#1d1600" strokeWidth="2" strokeLinecap="round" />
        <circle cx="30.800" cy="37.300" r="1.200" fill="#1d1600" />
      </g>
    </svg>
  );
}

// 질문 분석 — 닫힘에서 열림으로 바늘이 움직이는 계기판
export function MeterArt({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden className="shrink-0">
      <path d="M6 34a18 18 0 0 1 9-15.600" fill="none" stroke="#ff5f7a" strokeWidth="5" strokeLinecap="round" />
      <path d="M17.500 17.200a18 18 0 0 1 13 0" fill="none" stroke="#ffc83d" strokeWidth="5" strokeLinecap="round" />
      <path d="M33 18.400A18 18 0 0 1 42 34" fill="none" stroke="#5ad1b3" strokeWidth="5" strokeLinecap="round" />
      <g className="ob-wiggle" style={{ transformOrigin: "24px 34px", transformBox: "view-box" }}>
        <path d="M24 34l8-13" stroke="#eef0ff" strokeWidth="2.600" strokeLinecap="round" />
      </g>
      <circle cx="24" cy="34" r="3.600" fill="#eef0ff" stroke="#8a93b8" strokeWidth="1" />
      <path d="M12 42h24" stroke="#8a93b8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
