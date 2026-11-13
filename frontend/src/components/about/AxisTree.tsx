// 여섯 축 — 위에서 아래로 갈라지는 트리 한 장.
// 같은 자리(뿌리)에서 시작해도, “그냥 말하면” 가지와 “한 마디 붙이면” 가지의 열매(답)가 다르다.
// 글자 길이에 맞춰 글씨 크기를 줄이므로 data(about.json)만 고치면 된다.

const CARD = "#0d0d18";
const SAND = "#17172a";
const LINE = "#2c2c46";
const SUB = "#a8a8c0";
const INK = "#f2f4ff";
const DIM = "#6b6b8a";
const ROSE = "#fb7185";

export type Leaf = { t: string; m?: string };
export type Tree = { root: string; a: string; aGot: Leaf[]; b: string; bGot: Leaf[] };

const W = 380;
const COL = [
  { x: 4, w: 182 },
  { x: 194, w: 182 },
];
const LEAF_H = 28;
const LEAF_GAP = 8;

// 한글 한 글자 ≈ 0.95em, 영문·숫자·공백 ≈ 0.55em 으로 어림해 칸에 맞는 글씨 크기를 고른다.
function fit(text: string, room: number, max: number) {
  let u = 0;
  for (const ch of text) u += /[\x00-\x7f·]/.test(ch) ? 0.55 : 0.95;
  return Math.min(max, room / Math.max(u, 1));
}

function Lines({ text, x, y, room, max, fill, weight = 800 }: { text: string; x: number; y: number; room: number; max: number; fill: string; weight?: number }) {
  const ls = text.split("\n");
  const fs = Math.min(...ls.map((l) => fit(l, room, max)));
  const lh = fs * 1.35;
  const top = y - ((ls.length - 1) * lh) / 2 + fs * 0.36;
  return (
    <text x={x} y={top} textAnchor="middle" fill={fill} fontSize={fs} fontWeight={weight}>
      {ls.map((l, n) => (
        <tspan key={n} x={x} dy={n ? lh : 0}>
          {l}
        </tspan>
      ))}
    </text>
  );
}

function Mark({ m, x, y, c }: { m?: string; x: number; y: number; c: string }) {
  if (m === "o")
    return (
      <g>
        <circle cx={x} cy={y} r="6.5" fill={`${c}2e`} stroke={c} strokeWidth="1.3" />
        <path d={`M${x - 3} ${y}l2.2 2.2 4-4.4`} stroke={c} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  if (m === "x")
    return (
      <g stroke={ROSE} strokeWidth="1.6" strokeLinecap="round">
        <circle cx={x} cy={y} r="6.5" fill={`${ROSE}1f`} strokeWidth="1.3" />
        <path d={`M${x - 2.6} ${y - 2.6}l5.2 5.2M${x + 2.6} ${y - 2.6}l-5.2 5.2`} />
      </g>
    );
  return <circle cx={x} cy={y} r="3" fill={DIM} />;
}

function Branch({ side, label, q, got, qh, c, delay }: { side: 0 | 1; label: string; q: string; got: Leaf[]; qh: number; c: string; delay: number }) {
  const { x, w } = COL[side];
  const on = side === 1;
  const tone = on ? c : DIM;
  const qy = 82;
  const spineX = x + 16;
  const leaf0 = qy + qh + 14;
  const lastY = leaf0 + (got.length - 1) * (LEAF_H + LEAF_GAP) + LEAF_H / 2;
  return (
    <g>
      {/* 가지 이름 */}
      <rect x={x + w / 2 - 54} y="56" width="108" height="19" rx="9.5" fill={on ? `${c}24` : SAND} stroke={on ? c : LINE} strokeWidth="1.2" />
      <text x={x + w / 2} y="69.5" textAnchor="middle" fill={on ? c : SUB} fontSize="10" fontWeight="800">
        {label}
      </text>

      {/* 질문 */}
      <rect x={x} y={qy} width={w} height={qh} rx="12" fill={on ? `${c}14` : SAND} stroke={on ? c : LINE} strokeWidth={on ? 1.8 : 1.2} />
      <Lines text={q} x={x + w / 2} y={qy + qh / 2} room={w - 18} max={13} fill={on ? INK : SUB} />

      {/* 줄기 → 열매(돌아오는 답) */}
      <path d={`M${spineX} ${qy + qh}V${lastY}`} stroke={tone} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity={on ? 1 : 0.6} />
      {got.map((l, n) => {
        const ly = leaf0 + n * (LEAF_H + LEAF_GAP);
        const lx = x + 30;
        const lw = w - 30;
        const good = l.m === "o";
        const bad = l.m === "x";
        return (
          <g key={l.t} className="stg" style={{ animationDelay: `${delay + n * 0.14}s` }}>
            <path d={`M${spineX} ${ly + LEAF_H / 2}H${lx}`} stroke={tone} strokeWidth="1.6" strokeLinecap="round" opacity={on ? 1 : 0.6} />
            <rect
              x={lx}
              y={ly}
              width={lw}
              height={LEAF_H}
              rx="9"
              fill={good ? `${c}1c` : bad ? `${ROSE}0f` : CARD}
              stroke={good ? c : bad ? `${ROSE}99` : LINE}
              strokeWidth="1.3"
              strokeDasharray={bad ? "4 3" : undefined}
            />
            <Mark m={l.m} x={lx + 13} y={ly + LEAF_H / 2} c={c} />
            <Lines text={l.t} x={lx + 13 + (lw - 13) / 2} y={ly + LEAF_H / 2} room={lw - 32} max={11.5} fill={good ? INK : bad ? "#fda4af" : SUB} weight={good ? 800 : 700} />
          </g>
        );
      })}
    </g>
  );
}

export default function AxisTree({ tree, color, plainLabel, addLabel, label }: { tree: Tree; color: string; plainLabel: string; addLabel: string; label: string }) {
  const lines = Math.max(tree.a.split("\n").length, tree.b.split("\n").length);
  const qh = 20 + lines * 16;
  const n = Math.max(tree.aGot.length, tree.bGot.length);
  const H = 82 + qh + 14 + n * (LEAF_H + LEAF_GAP) - LEAF_GAP + 6;
  const ca = COL[0].x + COL[0].w / 2;
  const cb = COL[1].x + COL[1].w / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="h-auto w-full" style={{ fontFamily: "inherit" }}>
      {/* 뿌리 — 같은 자리 */}
      <rect x={W / 2 - 92} y="4" width="184" height="34" rx="17" fill={SAND} stroke={LINE} strokeWidth="1.3" />
      <Lines text={tree.root} x={W / 2} y={21} room={168} max={13} fill={INK} />
      <path d={`M${W / 2} 38V47M${ca} 56V47H${cb}V56`} stroke={SUB} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />

      <Branch side={0} label={plainLabel} q={tree.a} got={tree.aGot} qh={qh} c={color} delay={0.15} />
      <Branch side={1} label={addLabel} q={tree.b} got={tree.bGot} qh={qh} c={color} delay={0.35} />
    </svg>
  );
}
