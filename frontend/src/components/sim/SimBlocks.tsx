"use client";

// 기록 부품 — 흰 종이 와이어프레임으로 그린다. 색은 먹(진한 남색) · 회색 두 가지, 강조는 진하게만.
// big(주인공 숫자) · chart(막대 · 꺾은선 · 도넛) · progress(막대 기록) · table · chips
import type { Block } from "@/lib/sim";

const INK = "#1b2038", GRAY = "#c8cee0", SOFT = "#eef0f7";

export function Big({ b }: { b: Block }) {
  return (
    <div className="sim-big">
      {b.text && <span className="sim-big-t">{b.text}</span>}
      <b>{b.val ?? "—"}{b.unit && <small>{b.unit}</small>}</b>
      {b.sub && <span className="sim-big-s">{b.sub}</span>}
    </div>
  );
}

export function Chips({ b }: { b: Block }) {
  return (
    <div className="sim-chips">
      {(b.items ?? []).map((t, i) => <span key={i} className={t.startsWith("*") ? "on" : ""}>{t.replace(/^\*/, "")}</span>)}
    </div>
  );
}

export function Progress({ b }: { b: Block }) {
  const data = b.data ?? [];
  const max = Math.max(1, ...data.map((d) => d.value2 ?? d.value));
  return (
    <div className="sim-card-w">
      {b.text && <p className="sim-card-t">{b.text}</p>}
      <ul className="sim-prog">
        {data.map((d, i) => {
          const goal = d.value2 ?? max;
          return (
            <li key={i}>
              <span className="l">{d.label}</span>
              <span className="bar"><i style={{ width: `${Math.min(100, (d.value / goal) * 100)}%` }} /></span>
              <span className="n">{d.note ?? `${d.value}${b.unit ?? ""}`}</span>
            </li>
          );
        })}
      </ul>
      {b.sub && <p className="sim-card-s">{b.sub}</p>}
    </div>
  );
}

export function Table({ b }: { b: Block }) {
  return (
    <div className="sim-card-w">
      {b.text && <p className="sim-card-t">{b.text}</p>}
      <table className="sim-table">
        {b.cols && <thead><tr>{b.cols.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>}
        <tbody>{(b.rows ?? []).map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
      </table>
      {b.sub && <p className="sim-card-s">{b.sub}</p>}
    </div>
  );
}

/** 막대 · 꺾은선 · 도넛 — value2가 있으면 목표 · 반 평균을 점선으로 겹친다 */
export function Chart({ b }: { b: Block }) {
  const data = b.data ?? [];
  const kind = b.chart ?? "bar";
  return (
    <div className="sim-card-w">
      {b.text && <p className="sim-card-t">{b.text}</p>}
      {kind === "donut" ? <Donut b={b} /> : kind === "line" ? <Line b={b} /> : <Bars b={b} />}
      {kind !== "donut" && data.some((d) => d.value2 !== undefined) && (
        <p className="sim-chart-key"><span><i className="solid" />{kind === "line" ? "나" : "한 것"}</span><span><i className="dash" />{kind === "line" ? "반 평균" : "목표"}</span></p>
      )}
      {b.sub && <p className="sim-card-s">{b.sub}</p>}
    </div>
  );
}

function Bars({ b }: { b: Block }) {
  const data = b.data ?? [];
  const W = 300, H = 120, top = 16, base = 96;
  const max = Math.max(1, ...data.map((d) => Math.max(d.value, d.value2 ?? 0)));
  const step = W / Math.max(1, data.length);
  const bw = Math.min(26, step * 0.55);
  const y = (v: number) => base - (v / max) * (base - top);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="sim-chart" role="img" aria-label={b.text}>
      <line x1="0" x2={W} y1={base} y2={base} stroke={GRAY} />
      {data.map((d, i) => {
        const cx = step * i + step / 2;
        return (
          <g key={i}>
            <rect x={cx - bw / 2} y={y(d.value)} width={bw} height={base - y(d.value)} rx="3" fill={INK} />
            {d.value2 !== undefined && <line x1={cx - bw / 2 - 3} x2={cx + bw / 2 + 3} y1={y(d.value2)} y2={y(d.value2)} stroke="#6b7280" strokeWidth="2" strokeDasharray="3 2" />}
            <text x={cx} y={y(d.value) - 4} textAnchor="middle" fontSize="9.5" fontWeight="800" fill={INK}>{d.note ?? d.value}</text>
            <text x={cx} y={base + 14} textAnchor="middle" fontSize="10" fontWeight="700" fill="#6b7280">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Line({ b }: { b: Block }) {
  const data = b.data ?? [];
  const W = 300, H = 120, top = 14, base = 96, L = 8, R = W - 8;
  const vals = data.flatMap((d) => [d.value, d.value2 ?? d.value]);
  // 눈금은 데이터에 맞춘다 — 0부터 시작하면 높은 값끼리 평평하게 붙는다
  const hi = Math.max(1, ...vals), lo = Math.min(...vals);
  const max = hi + (hi - lo) * 0.15, min = Math.max(0, lo - (hi - lo) * 0.35);
  const x = (i: number) => L + (R - L) * (data.length > 1 ? i / (data.length - 1) : 0.5);
  const y = (v: number) => base - ((v - min) / (max - min || 1)) * (base - top);
  const path = (k: "value" | "value2") => data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y((k === "value" ? d.value : d.value2 ?? d.value)).toFixed(1)}`).join(" ");
  const best = data.reduce((m, d, i) => (d.value > data[m].value ? i : m), 0);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="sim-chart" role="img" aria-label={b.text}>
      {[0.33, 0.66].map((t) => <line key={t} x1="0" x2={W} y1={top + (base - top) * t} y2={top + (base - top) * t} stroke={SOFT} />)}
      <line x1="0" x2={W} y1={base} y2={base} stroke={GRAY} />
      <path d={`${path("value")} L${x(data.length - 1)},${base} L${x(0)},${base} Z`} fill={SOFT} />
      {data.some((d) => d.value2 !== undefined) && <path d={path("value2")} fill="none" stroke="#6b7280" strokeWidth="2" strokeDasharray="4 3" />}
      <path d={path("value")} fill="none" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
      {data.map((d, i) => <circle key={i} cx={x(i)} cy={y(d.value)} r={i === best ? 4.5 : 2.6} fill={i === best ? INK : "#fff"} stroke={INK} strokeWidth="1.8" />)}
      {data.length > 0 && <text x={x(best)} y={y(data[best].value) - 8} textAnchor="middle" fontSize="10" fontWeight="900" fill={INK}>{data[best].note ?? `${data[best].value}${b.unit ?? ""}`}</text>}
      {data.map((d, i) => (data.length <= 8 || i % 2 === 0) && <text key={`l${i}`} x={x(i)} y={base + 14} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#6b7280">{d.label}</text>)}
    </svg>
  );
}

function Donut({ b }: { b: Block }) {
  const data = b.data ?? [];
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const r = 38, c = 2 * Math.PI * r;
  const shades = [INK, "#6b7280", "#a3a9bf", GRAY, "#dfe3f0"];
  // 조각마다 시작 위치 — 앞 조각 길이를 미리 더해 둔다
  const lens = data.map((d) => (d.value / total) * c);
  const starts = lens.map((_, i) => lens.slice(0, i).reduce((a, x) => a + x, 0));
  return (
    <div className="sim-donut">
      <svg viewBox="0 0 100 100" role="img" aria-label={b.text}>
        <circle cx="50" cy="50" r={r} fill="none" stroke={SOFT} strokeWidth="14" />
        {data.map((d, i) => <circle key={i} cx="50" cy="50" r={r} fill="none" stroke={shades[i % shades.length]} strokeWidth="14" strokeDasharray={`${lens[i]} ${c - lens[i]}`} strokeDashoffset={-starts[i]} transform="rotate(-90 50 50)" />)}
        <text x="50" y="49" textAnchor="middle" fontSize="15" fontWeight="900" fill={INK}>{b.val ?? `${Math.round(((data[0]?.value ?? 0) / total) * 100)}%`}</text>
        <text x="50" y="63" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#6b7280">{data[0]?.label}</text>
      </svg>
      <ul>
        {data.map((d, i) => <li key={i}><i style={{ background: shades[i % shades.length] }} />{d.label}<b>{d.note ?? `${d.value}${b.unit ?? ""}`}</b></li>)}
      </ul>
    </div>
  );
}
