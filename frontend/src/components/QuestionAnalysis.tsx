"use client";

// 🔎 질문 분석 — 그림으로 보기. questionsToMd(.md)와 같은 숫자를, 위→아래 나무(트리)로 묶고 직접 그린 SVG 차트와 코멘트로 보여준다.
// 순서: ① 한 줄 진단 → ② 질문 나무(유형별 묶음) → ③ 실은 것 나무 + 육각 차트 → ④ 질문 지문(길이 · 유형 · 실은 것) → ⑤ 유형별 질문 카드 → ⑥ 정리
import roles from "@/data/roles.json";
import { answerSummary, buildTextStats, LENGTH_INFO, lengthKeyOf, O_KEYS, type QuestionDocInput, reportHeadline, SIX_FIX, SIX_KEYS, textComment } from "@/lib/report";
import { AXES, axisOf, colorOf, elementById, FORM_LABEL } from "@/lib/rq";
import type { Openness, ReverseQuestion, RoleKey, SixKey, Turn, WindowReport } from "@/lib/types";

type OKey = Exclude<Openness, "NA">;
const OPEN = roles.openness as Record<
  OKey,
  {
    label: string;
    short: string;
    shape: string;
    gain: string;
    lose: string;
    role: string;
  }
>;
const ROLE = roles.roles as Record<RoleKey, { emoji: string; name: string; color: string }>;
const SIX = roles.six as Record<SixKey, { short: string; name: string }>;
const SIX_EMOJI: Record<SixKey, string> = {
  why: "💡",
  context: "🧩",
  constraint: "📏",
  criteria: "⚖️",
  verify: "🔬",
  discard: "🗑",
};
const oColor = (o: Openness) => (o === "NA" ? "#6b7398" : ROLE[OPEN[o].role as RoleKey].color);

/** 질문 나무의 큰 가지 — AI에게 무엇을 맡겼나 */
const GROUPS: {
  key: string;
  label: string;
  sub: string;
  keys: OKey[];
  color: string;
}[] = [
  {
    key: "mine",
    label: "✋ 내가 다 정함",
    sub: "AI는 손만 빌려줌",
    keys: ["O1", "O2"],
    color: "#7f8fd6",
  },
  {
    key: "open",
    label: "🤝 함께 설계",
    sub: "AI의 판단을 빌림",
    keys: ["O3", "O4"],
    color: "#3fe0c0",
  },
  {
    key: "wide",
    label: "🌫 크게 물음",
    sub: "누구에게나 같은 답",
    keys: ["O5"],
    color: "#ffd98a",
  },
];

interface Row {
  t: Turn;
  n: number;
  chars: number;
  o: Openness;
  got: SixKey[];
  miss: SixKey[];
  rq?: ReverseQuestion;
  plan?: string;
  ans?: { md: string; assumptions?: string[]; yourCall?: string[] };
}

export default function QuestionAnalysis({ r, name, src }: { r: WindowReport; name: string; src: QuestionDocInput }) {
  const [from, to] = r.turnRange;
  const rows: Row[] = src.turns
    .filter((t) => (r.projectId ? t.projectId === r.projectId : true) && t.n >= from && t.n <= to)
    .sort((a, b) => a.n - b.n)
    .map((t) => ({
      t,
      n: t.n,
      chars: t.question.replace(/\s+/g, " ").trim().length,
      o: t.analysis.openness,
      got: SIX_KEYS.filter((k) => t.analysis.six[k] >= 0.5),
      miss: SIX_KEYS.filter((k) => t.analysis.six[k] < 0.5),
      rq: src.rqs.find((q) => q.turnId === t.id),
      plan: src.planNoteOf?.(t.id),
      ans: src.answerOf?.(t.id),
    }));

  if (!rows.length) return <p className="text-sm text-sub">이 리포트가 덮는 질문 원문이 남아 있지 않아. 표 문서(📄 문서 탭)를 봐 줘.</p>;

  const n = rows.length;
  const stats = buildTextStats(
    rows.map((x) => x.t),
    (t) => t.n,
  );
  const byO = (k: Openness) => rows.filter((x) => x.o === k);
  const sixCount = (k: SixKey) => rows.filter((x) => x.got.includes(k)).length;
  const avgSix = Math.round((rows.reduce((s, x) => s + x.got.length, 0) / n) * 10) / 10;
  const openN = byO("O3").length + byO("O4").length;
  const rqs = rows.filter((x) => x.rq);
  const answered = rqs.filter((x) => x.rq!.status === "answered").length;
  // 가장 빈 칸 — 같은 수면 목적 → 기준 → 제약 → 맥락 → 검증 → 버릴 것 순으로 먼저 채울 칸을 고른다
  const weak = (["why", "criteria", "constraint", "context", "verify", "discard"] as SixKey[]).reduce((a, k) => (sixCount(k) < sixCount(a) ? k : a));

  return (
    <div className="qa mx-auto max-w-[860px] space-y-5">
      {/* ① 한 줄 진단 */}
      <section className="rounded-2xl border border-[#8a6a1f] bg-amber-soft p-4">
        <p className="text-[11px] font-extrabold text-gold">
          🔎 {r.projects[0] ?? "내 프로젝트"} · Q{from}~Q{to} · {name}
        </p>
        <h2 className="mt-1 text-[18px] font-extrabold leading-snug">“{reportHeadline(r)}”</h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-sub">
          답이 아니라 <b className="text-ink">내가 한 질문</b>을 본다 — 질문의 폭이 AI를 어느 자리에 앉혔고, 무엇을 실었고 무엇을 빠뜨렸는지.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Kpi label="🌅 열린 질문" sub="목표·조건 주고 방법을 물음">
            <Ring value={openN} total={n} color="#3fe0c0" text={`${openN}/${n}`} />
          </Kpi>
          <Kpi label="🎒 질문당 실은 것" sub={`여섯 가지 중 평균 ${avgSix}`}>
            <HexMeter value={avgSix} />
          </Kpi>
          <Kpi label="📏 평균 길이" sub={`${stats.min}~${stats.max}자`}>
            <LenMeter avg={stats.avg} />
          </Kpi>
          <Kpi label="🧭 되묻기" sub={rqs.length ? `${rqs.length}번 중 ${answered}번 답함` : "이번엔 없었어"}>
            <Dots items={rqs.map((x) => (x.rq!.status === "answered" ? (x.rq!.score ?? 0) : -1))} />
          </Kpi>
        </div>
        <Coach {...coachOverall(rows, openN, avgSix, weak, sixCount(weak), answered)} />
      </section>

      {/* ② 질문 나무 */}
      <Section n="①" title="질문 나무 — AI에게 무엇을 맡겼나" desc="맨 위 질문 묶음이 ‘무엇을 맡겼나’로 세 갈래, 다시 다섯 유형으로 나뉘고, 맨 아래에 실제 질문이 매달려. 칩 위에 올리면 질문 원문이 보여.">
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <QuestionTree rows={rows} />
        </div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
          {GROUPS.map((g) => {
            const c = g.keys.reduce((s, k) => s + byO(k).length, 0);
            return (
              <p key={g.key} className={`rounded-xl border px-3 py-2 text-[12px] leading-relaxed ${c ? "" : "opacity-50"}`} style={{ borderColor: `${g.color}66` }}>
                <b style={{ color: g.color }}>
                  {g.label} {c}개
                </b>
                <br />
                <span className="text-sub">{g.keys.map((k) => `${ROLE[OPEN[k].role as RoleKey].emoji} ${OPEN[k].label}: 얻는 것 ${OPEN[k].gain}`).join(" · ")}</span>
              </p>
            );
          })}
        </div>
        {byO("NA").length > 0 && (
          <p className="mt-2 text-[11.5px] text-sub">
            코드·에러만 붙인 질문 {byO("NA").length}개(Q
            {byO("NA")
              .map((x) => x.n)
              .join(", Q")}
            )는 유형을 판별하지 않았어.
          </p>
        )}
        <Coach {...coachTypes(rows)} extra={r.mixComment} />
      </Section>

      {/* ③ 실은 것 */}
      <Section n="②" title="실은 것 나무 — 여섯 가지 중 무엇을 챙겼나" desc={`질문 ${n}개에 여섯 가지를 몇 번씩 실었는지. 절반(${Math.ceil(n / 2)}번) 넘게 실은 건 ‘습관’, 그보다 적으면 ‘자주 빠짐’으로 묶었어.`}>
        <div className="grid items-center gap-3 md:grid-cols-[1fr_220px]">
          <div className="-mx-1 overflow-x-auto px-1">
            <SixTree count={sixCount} n={n} />
          </div>
          <SixRadar count={sixCount} n={n} />
        </div>
        <Coach {...coachSix(rows, sixCount, avgSix, weak)} />
      </Section>

      {/* ④ 질문 지문 */}
      <Section n="③" title="질문 지문 — 순서대로 본 길이 · 유형 · 실은 것" desc="막대 높이는 글자 수, 동그라미 색은 질문 유형, 아래 여섯 칸은 그 질문에 실은 것이야. 왼쪽에서 오른쪽으로 질문이 어떻게 변했는지 봐.">
        <div className="-mx-1 overflow-x-auto px-1">
          <Fingerprint rows={rows} />
        </div>
        <Legend />
        <Coach {...coachFlow(rows, stats.buckets.short.count)} extra={`${textComment(stats)}${trendLine(rows)}`} />
      </Section>

      {/* ⑤ 질문별 카드 — 유형별로 묶어서 */}
      <Section n="④" title="질문 하나씩 — 유형별로 묶어서" desc="같은 유형끼리 한 가지에 모았어. 카드마다 🤖 판정과 ‘이렇게 바꿔 물어봐’를 붙였고, 펼치면 답 요약 · 되묻기 · 기획서에 남긴 것이 보여.">
        <div className="space-y-4">
          {([...O_KEYS, "NA"] as Openness[])
            .filter((k) => byO(k).length)
            .map((k) => (
              <TypeBranch key={k} o={k} rows={byO(k)} />
            ))}
        </div>
      </Section>

      {/* ⑥ 정리 */}
      <Section n="⑤" title="이번 구간을 한 줄로">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-[#8a6a1f] bg-amber-soft px-3 py-2.5">
            <p className="text-[11px] font-extrabold text-gold">🏅 베스트 질문</p>
            {r.best ? (
              <>
                <p className="mt-1 text-[13.5px] font-semibold leading-relaxed">
                  “{r.best.text}” <span className="text-[11px] font-normal text-sub">— Q{r.best.turnN}</span>
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-sub">💬 {r.best.reason}</p>
              </>
            ) : (
              <p className="mt-1 text-[12.5px] text-sub">이번엔 뽑지 않았어.</p>
            )}
          </div>
          <div className="rounded-xl border border-mint bg-mint-soft px-3 py-2.5">
            <p className="text-[11px] font-extrabold text-mint">🚩 다음 미션 — 하나만</p>
            <p className="mt-1 text-[13.5px] font-bold leading-relaxed">{r.nextMission.text}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-sub">← {r.nextMission.basis}</p>
          </div>
        </div>
      </Section>
    </div>
  );
}

/* ---------- 코멘트 문장 — 전부 위 숫자에서만 나온다 ---------- */

type Verdict = "good" | "ok" | "bad";
/** 바꿔 묻기 대안 하나 — 원래 질문에 무엇을 보태면 무엇이 달라지나 */
interface Alt {
  tag: string;
  after: string;
  why: string;
}
interface CoachSay {
  verdict: Verdict;
  /** 한 문장 결론 — 코치 박스 맨 위에 크게 */
  headline: string;
  good?: React.ReactNode;
  bad?: React.ReactNode;
  next?: React.ReactNode;
  /** 실제 질문 하나를 골라 2~3가지로 바꿔 본 대안 */
  alts?: { from: Row; items: Alt[] }[];
}

/** 칸이 빠지면 답이 어떻게 달라지나 — ‘숫자가 왜 문제인지’를 한 줄로 */
const SIX_WHY: Record<SixKey, string> = {
  why: "목적이 없으면 AI는 ‘보통 이런 용도겠지’ 하고 추측해",
  context: "상황을 모르면 누구에게나 맞는 일반 답이 와",
  constraint: "제약이 없으면 네가 못 쓰는 방법까지 권해",
  criteria: "기준이 없으면 ‘잘 됐다’를 AI가 대신 정해",
  verify: "확인 방법이 없으면 틀려도 모르고 넘어가",
  discard: "버릴 걸 안 정하면 기능이 끝없이 불어나",
};
/** 칸을 채우면 얻는 것 */
const SIX_GAIN: Record<SixKey, string> = {
  why: "답이 네 목적에 맞춰져",
  context: "네 상황에 맞는 답이 와",
  constraint: "못 쓰는 방법을 AI가 먼저 걸러 줘",
  criteria: "‘잘 됐다’를 네가 정하게 돼",
  verify: "맞는지 확인하는 법까지 같이 와",
  discard: "범위가 줄어 빨리 끝나",
};
const FILL_ORDER: SixKey[] = ["why", "criteria", "constraint", "context", "verify", "discard"];
/** 받침 따라 조사 고르기 — 지시로 / 질문으로, 지시야 / 질문이야 */
const batchim = (w: string) => {
  const c = w
    .replace(/[^가-힣]/g, "")
    .slice(-1)
    .charCodeAt(0);
  return c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 !== 0 : false;
};
const ro = (w: string) => {
  const c = w
    .replace(/[^가-힣]/g, "")
    .slice(-1)
    .charCodeAt(0);
  const jong = c >= 0xac00 ? (c - 0xac00) % 28 : 0;
  return `${w}${jong === 0 || jong === 8 ? "로" : "으로"}`;
};
const iya = (w: string) => `${w}${batchim(w) ? "이야" : "야"}`;
const neun = (w: string) => `${w}${batchim(w) ? "은" : "는"}`;
const eul = (w: string) => `${w}${batchim(w) ? "을" : "를"}`;
const isOpen = (o: Openness) => o === "O3" || o === "O4";
const qList = (xs: Row[]) => xs.map((x) => `Q${x.n}`).join(" · ");
const domOf = (rows: Row[]) => (O_KEYS as OKey[]).reduce((a, k) => (rows.filter((x) => x.o === k).length > rows.filter((x) => x.o === a).length ? k : a), "O1" as OKey);
const sixNames = (ks: SixKey[]) => ks.map((k) => `${SIX_EMOJI[k]} ${SIX[k].name}`).join(" · ");
const baseQ = (x: Row) =>
  x.t.question
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.?!…~]+$/, "");
const cut = (s: string, max = 26) => (s.length > max ? `${s.slice(0, max)}…` : s);
const quote = (x: Row, max = 26) => `Q${x.n} “${cut(baseQ(x), max)}”`;
const scoreOf = (x: Row) => x.got.length + (isOpen(x.o) ? 2 : x.o === "O2" ? 1 : 0);
const firstMiss = (x: Row) => FILL_ORDER.find((k) => x.miss.includes(k));

/** 답이 몰래 정한 것 — assumptions, 또는 답 본문의 “몰래 정한 것:” 줄에서 */
function secretsOf(x: Row): string[] {
  const a = x.ans?.assumptions ?? [];
  const m = x.ans?.md.match(/몰래 정한 것[:：]\s*([^\n]+)/);
  return [...a, ...(m ? m[1].split(/\s*[·,]\s*/) : [])].map((s) => s.replace(/\*\*|`/g, "").trim()).filter(Boolean);
}

/** 실제 질문 하나를 2~3가지로 바꿔 본다 — 모양이 다른 대안끼리 */
function altsFor(x: Row, max = 3): Alt[] {
  const list: Alt[] = [];
  const b = baseQ(x);
  const stuck = /오류|에러|안 ?돼|안 ?됨|버그|error|멈춰|깨져/i.test(x.t.question);
  if (x.chars <= 8 && !stuck) list.push({ tag: "🎯 콕 집어 말하기", after: `${b} — ___ 부분을 ___처럼 바꾸고 싶어. ___는 그대로 둬.`, why: "어디를 어떻게 바꿀지 알아야 AI가 엉뚱한 곳을 안 건드려" });
  if (stuck) list.push({ tag: "🧩 상황 세 토막", after: `${b} — ___를 했더니 ___가 나왔어. 원래는 ___가 돼야 해. 어디부터 볼까?`, why: "무엇이 어떻게 안 되는지 알아야 AI가 추측을 멈춰" });
  const k = firstMiss(x);
  if (k) list.push({ tag: `${SIX_EMOJI[k]} ${SIX[k].name.replace(/ \(.*\)/, "")} 한 줄 보태기`, after: `${b}. ${SIX_FIX[k]}`, why: SIX_GAIN[k] });
  if (!isOpen(x.o)) list.push({ tag: "🛠 방법을 묻기 (O3)", after: `${b} — 목표는 ___이고, ___는 못 써. 어떤 방법이 좋을까? 왜 그 방법인지도.`, why: "AI가 받아쓰기에서 엔지니어로 — 방법과 이유가 같이 와" });
  if (x.o !== "O4") list.push({ tag: "🏛 대안을 묻기 (O4)", after: `${b} — 할 수 있는 길 2~3가지와 각각의 대가를 비교해 줘. 나는 ___가 제일 중요해.`, why: "답 하나 대신 선택지가 와서, 고르는 사람이 네가 돼" });
  return list.slice(0, max);
}

function coachOverall(rows: Row[], openN: number, avgSix: number, weak: SixKey, weakN: number, answered: number): CoachSay {
  const n = rows.length;
  const closedRows = rows.filter((x) => x.o === "O1" || x.o === "O2");
  const closed = closedRows.length;
  const dom = domOf(rows);
  const verdict: Verdict = openN >= n * 0.5 && avgSix >= 3 ? "good" : closed >= n * 0.6 || avgSix < 1.5 ? "bad" : "ok";
  const sorted = [...rows].sort((a, b) => scoreOf(b) - scoreOf(a) || b.chars - a.chars);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const secrets = rows.flatMap((x) => secretsOf(x).map((s) => ({ n: x.n, s })));
  const headline =
    verdict === "good"
      ? "목표를 주고 방법을 묻는 습관이 잡혔어 — 이제 빈 칸 하나만 채우면 돼"
      : closed >= n * 0.6
        ? `${n}개 중 ${closed}개가 ‘이렇게 해 줘’ — 결과물은 받았지만 판단은 하나도 빌리지 않았어`
        : avgSix < 1.5
          ? "질문이 비어 있어서, AI가 빈칸을 전부 추측으로 채웠어"
          : "방향은 맞아 — 실을 것 한두 개만 더 보태면 답이 확 달라져";
  const good = (
    <>
      {best.got.length >= 2 ? (
        <>
          <b>{quote(best)}</b> — {eul(sixNames(best.got))} 실은 이 질문이 이번 구간의 본보기야. 같은 모양으로 물으면 돼.
        </>
      ) : (
        <>
          <b>{quote(rows.find((x) => x.o === dom) ?? best)}</b>처럼 원하는 걸 짧고 분명하게 말해서 결과물은 빨리 나왔어 — {ro(OPEN[dom].label)} 얻는 ‘{OPEN[dom].gain}’.
        </>
      )}
      {answered > 0 && <> 되묻기에도 {answered}번 답했어 — 네 말로 설명해 본 순간이야.</>}
    </>
  );
  const bad =
    verdict === "good" ? (
      weakN < n / 2 ? (
        <>
          {SIX_EMOJI[weak]} {SIX[weak].name}은 {n}번 중 {weakN}번 — {SIX_WHY[weak]}.
        </>
      ) : undefined
    ) : (
      <>
        {closed >= n * 0.6 ? (
          <>
            <b>
              {closedRows
                .slice(0, 2)
                .map((x) => quote(x, 14))
                .join(", ")}
            </b>
            처럼 무엇을 만들지만 말하고 왜·어떤 조건인지는 빠졌어. 그 대가로 {eul(`‘${OPEN[dom].lose}’`)} 잃었어.
          </>
        ) : (
          <>
            열린 질문이 {openN}/{n}개라 AI의 판단을 빌린 순간이 적었어.{" "}
          </>
        )}
        {secrets.length > 0 && (
          <span className="mt-1 block">
            🤫 그 사이 AI가 <b>몰래 정한 것 {secrets.length}개</b> —{" "}
            {secrets
              .slice(0, 3)
              .map((x) => `‘${cut(x.s, 22)}’(Q${x.n})`)
              .join(", ")}
            {secrets.length > 3 ? ` 외 ${secrets.length - 3}개` : ""} — 이건 네가 정했어야 할 것들이야.
          </span>
        )}
        {avgSix < 2 && <span className="mt-1 block">질문당 실은 건 평균 {avgSix}가지 — 답이 네 프로젝트가 아니라 ‘보통의 경우’에 맞춰졌어.</span>}
      </>
    );
  const next =
    closed >= n * 0.6 ? (
      <>
        다음 10개 중 <b>딱 3개만</b> “목표는 ___이고, ___는 못 써. 어떤 방법이 좋을까?” 모양으로 물어봐. 그것만으로 AI가 받아쓰기에서 엔지니어 자리로 옮겨 앉아.
      </>
    ) : (
      <>
        가장 빈 칸 {SIX_EMOJI[weak]} {SIX[weak].name}부터 — 질문 끝에 <Fill k={weak} /> 한 줄.
      </>
    );
  return { verdict, headline, good, bad, next, alts: verdict === "good" && scoreOf(worst) >= 4 ? undefined : [{ from: worst, items: altsFor(worst, 3) }] };
}

function coachTypes(rows: Row[]): CoachSay {
  const n = rows.length;
  const open = rows.filter((x) => isOpen(x.o));
  const wide = rows.filter((x) => x.o === "O5");
  const closed = rows.filter((x) => x.o === "O1" || x.o === "O2");
  const dom = domOf(rows);
  const domRows = rows.filter((x) => x.o === dom);
  const verdict: Verdict = open.length >= n * 0.5 ? "good" : open.length === 0 || closed.length >= n * 0.8 ? "bad" : "ok";
  const headline =
    open.length === 0
      ? `${n}개 모두 ‘어떻게 하면 좋을까?’ 없이 물었어 — AI는 손만 빌려줬어`
      : verdict === "good"
        ? `${n}개 중 ${open.length}개가 열린 질문 — AI의 머리를 빌리고 있어`
        : `${OPEN[dom].label} ${domRows.length}개가 대부분 — 판단을 빌린 질문은 ${open.length}개`;
  const good = open.length ? (
    <>
      <b>
        {open
          .slice(0, 2)
          .map((x) => quote(x, 18))
          .join(", ")}
      </b>
      {open.length > 2 ? ` 외 ${open.length - 2}개` : ""}는 목표·조건을 주고 방법을 물었어 — AI가 방법과 그 이유까지 같이 내놓은 질문들이야.
    </>
  ) : (
    <>
      원하는 걸 분명히 말해서 AI가 헤매지는 않았어 — {ro(OPEN[dom].label)} 얻는 ‘{OPEN[dom].gain}’.
    </>
  );
  const bad =
    open.length === 0 ? (
      <>
        {qList(domRows.slice(0, 4))}
        {domRows.length > 4 ? " …" : ""} 모두 {iya(OPEN[dom].label)}. 화면 구성·저장 방식·예외 처리 같은 설계 결정이 전부 AI 몫이 됐고, <b>왜 그렇게 했는지는 하나도 남지 않았어.</b> 나중에 고치려면 그 이유부터 다시
        물어야 해.
      </>
    ) : wide.length >= n * 0.3 ? (
      <>
        맥락 없이 크게 물은 <b>{wide.map((x) => quote(x, 14)).join(", ")}</b> — 누구에게나 같은 교과서 답이 돌아왔어.
      </>
    ) : closed.length > open.length ? (
      <>
        시키는 질문({closed.length}개)이 여는 질문({open.length}개)보다 많아. 특히 <b>{quote(closed[0], 18)}</b>는 정할 게 많은 질문인데 시키기만 했어.
      </>
    ) : undefined;
  // 바꿔 볼 질문 — 판단이 필요한 ‘만들어 줘’ 류를 먼저 고른다 (오류 신고보다 설계 질문이 바꿔 묻기 효과가 크다)
  const isAsk = (x: Row) => (/(줘|해 ?줘|만들|추가|바꿔)/.test(x.t.question) && !/오류|에러|버그/.test(x.t.question) ? 0 : 1);
  const sample = [...closed, ...wide].sort((a, b) => isAsk(a) - isAsk(b) || scoreOf(a) - scoreOf(b) || b.chars - a.chars)[0];
  const next = sample ? <>판단이 필요한 질문(새 기능·구조·저장 방식)일 때만 열어서 물어봐. 버튼 색·오타 같은 건 지금처럼 시켜도 돼.</> : <>지금 폭을 유지하면서, 구현 단계에선 O2(좁은 질문)로 속도를 내도 좋아.</>;
  return {
    verdict,
    headline,
    good,
    bad,
    next,
    alts: sample
      ? [
          {
            from: sample,
            items: altsFor(sample, 4).filter((a) => a.tag.startsWith("🛠") || a.tag.startsWith("🏛")),
          },
        ]
      : undefined,
  };
}

function coachSix(rows: Row[], count: (k: SixKey) => number, avgSix: number, weak: SixKey): CoachSay {
  const n = rows.length;
  const habit = SIX_KEYS.filter((k) => count(k) > n / 2);
  const some = SIX_KEYS.filter((k) => count(k) > 0 && count(k) <= n / 2);
  const thin = FILL_ORDER.filter((k) => count(k) <= n / 2).sort((a, b) => count(a) - count(b));
  const verdict: Verdict = avgSix >= 3 ? "good" : avgSix < 1.5 ? "bad" : "ok";
  const empty = SIX_KEYS.every((k) => count(k) === 0);
  const headline = empty
    ? "여섯 칸이 모두 비었어 — 답이 ‘아무나’에게 맞춰졌어"
    : habit.length
      ? `${neun(habit.map((k) => SIX[k].name.replace(/ \(.*\)/, "")).join(" · "))} 습관 — ${thin.length ? `${SIX[thin[0]].name.replace(/ \(.*\)/, "")}만 채우면 돼` : "여섯 칸을 고르게 실었어"}`
      : `가끔 싣긴 했지만 아직 습관이 된 칸은 없어`;
  const exampleOf = (k: SixKey) => rows.find((x) => x.got.includes(k));
  const good = habit.length ? (
    <>
      {neun(sixNames(habit))} 습관이 됐어 — 예를 들어 <b>{quote(exampleOf(habit[0])!, 20)}</b>엔 {SIX[habit[0]].name}이 들어 있어서 {SIX_GAIN[habit[0]]}.
    </>
  ) : some.length ? (
    <>{some.map((k) => `${SIX_EMOJI[k]} ${SIX[k].name}(${exampleOf(k) ? `Q${exampleOf(k)!.n}` : ""})`).join(" · ")}는 실어 봤어 — 그 질문의 답이 더 구체적이었을 거야.</>
  ) : undefined;
  // 칸마다 다른 질문을 예로 — 같은 질문이 두 번 나오지 않게
  const used = new Set<string>();
  const pick: Partial<Record<SixKey, Row>> = {};
  thin.slice(0, 2).forEach((k) => {
    const cand = [...rows].filter((x) => x.miss.includes(k)).sort((a, b) => b.got.length - a.got.length || b.chars - a.chars);
    const x = cand.find((c) => !used.has(c.t.id)) ?? cand[0];
    if (x) {
      used.add(x.t.id);
      pick[k] = x;
    }
  });
  const missRow = (k: SixKey) => pick[k];
  const bad = thin.length ? (
    <>
      {thin.slice(0, 2).map((k) => {
        const x = missRow(k);
        return (
          <span key={k} className="block">
            <b>
              {SIX_EMOJI[k]} {SIX[k].name} {count(k)}/{n}
            </b>{" "}
            — {SIX_WHY[k]}.
            {x && (
              <>
                {" "}
                예: <b>{quote(x, 18)}</b>에 이 칸이 없었어.
              </>
            )}
          </span>
        );
      })}
    </>
  ) : undefined;
  const next = (
    <>
      가장 먼저 채울 칸은 {SIX_EMOJI[weak]} {SIX[weak].name}. 질문 끝에 <Fill k={weak} />
    </>
  );
  const alts = thin.slice(0, 2).map((k) => {
    const x = missRow(k);
    return x ? { from: x, items: [{ tag: `${SIX_EMOJI[k]} ${SIX[k].name.replace(/ \(.*\)/, "")} 한 줄 보태기`, after: `${baseQ(x)}. ${SIX_FIX[k]}`, why: SIX_GAIN[k] }] } : null;
  });
  const merged = alts.filter(Boolean) as { from: Row; items: Alt[] }[];
  // 같은 질문이면 한 묶음으로
  const grouped = merged.reduce<{ from: Row; items: Alt[] }[]>((acc, g) => {
    const same = acc.find((a) => a.from.t.id === g.from.t.id);
    if (same) same.items.push(...g.items);
    else acc.push({ ...g, items: [...g.items] });
    return acc;
  }, []);
  return { verdict, headline, good, bad, next, alts: grouped.length ? grouped : undefined };
}

/** 짧은 질문이 연달아 나온 구간 — 막혔을 때 설명 없이 다시 던진 흔적 */
function shortStreak(rows: Row[], limit = 6) {
  let best: Row[] = [];
  let cur: Row[] = [];
  rows.forEach((x) => {
    cur = x.chars <= limit ? [...cur, x] : [];
    if (cur.length > best.length) best = cur;
  });
  return best;
}

function coachFlow(rows: Row[], shortN: number): CoachSay {
  const n = rows.length;
  const streak = shortStreak(rows);
  const half = Math.floor(n / 2);
  const avg = (xs: Row[]) => (xs.length ? xs.reduce((s, x) => s + x.got.length, 0) / xs.length : 0);
  const a = avg(rows.slice(0, half));
  const b = avg(rows.slice(half));
  const up = n >= 4 && b - a >= 0.8;
  const down = n >= 4 && a - b >= 0.8;
  const verdict: Verdict = streak.length >= 3 || shortN >= n * 0.6 || down ? "bad" : up ? "good" : "ok";
  const rich = [...rows].sort((p, q) => q.got.length - p.got.length || q.chars - p.chars)[0];
  const longPoor = rows.filter((x) => x.chars >= 120 && x.got.length <= 1);
  const headline =
    streak.length >= 3
      ? `막힐 때 질문이 짧아졌어 — Q${streak[0].n}~Q${streak[streak.length - 1].n}이 ${streak.map((x) => `${x.chars}자`).join("·")}`
      : up
        ? `뒤로 갈수록 질문이 좋아지고 있어 (실은 것 ${a.toFixed(1)} → ${b.toFixed(1)})`
        : down
          ? `뒤로 갈수록 질문이 비어 갔어 (실은 것 ${a.toFixed(1)} → ${b.toFixed(1)})`
          : shortN >= n * 0.6
            ? `${n}개 중 ${shortN}개가 40자 미만 — 실을 자리가 없었어`
            : "길이와 실은 것이 고르게 유지됐어";
  const good = up ? (
    <>
      앞 절반 평균 {a.toFixed(1)}가지 → 뒤 절반 {b.toFixed(1)}가지. 질문하는 법이 좋아지는 중이야.
    </>
  ) : rich.got.length >= 2 ? (
    <>
      가장 많이 실은 <b>{quote(rich, 20)}</b>({rich.chars}자 · {rich.got.length}가지)가 이번 구간의 본보기야. 길어서가 아니라 실은 게 많아서 좋은 질문이야.
    </>
  ) : (
    <>
      가장 긴 <b>{quote(rich, 20)}</b>({rich.chars}자)에서는 하고 싶은 걸 조금 더 풀어 말했어.
    </>
  );
  const bad =
    streak.length >= 3 ? (
      <>
        <b>{streak.map((x) => `“${baseQ(x)}”`).join(" → ")}</b> — 막혔을 때 무엇이 어떻게 안 되는지 빼고 다시 던졌어. AI는 상황을 모르니 같은 추측을 반복할 수밖에 없어.
      </>
    ) : longPoor.length ? (
      <>{qList(longPoor)}는 120자가 넘는데 실은 건 1가지 이하 — 코드·설명을 붙였지만 목적이 없었어. 길이보다 ‘무엇을 실었나’가 중요해.</>
    ) : shortN >= n * 0.6 ? (
      <>
        {n}개 중 {shortN}개가 40자 미만 — 짧아서 목적·조건을 실을 자리가 없었어.
      </>
    ) : down ? (
      <>뒤로 갈수록 실은 게 줄었어. 급해질수록 목적 한 줄이 먼저 빠져.</>
    ) : undefined;
  const next = (
    <>
      막혔을 때는 세 토막으로 — <b>“무엇을 했더니 → 무엇이 나왔고 → 원래는 무엇을 기대했어.”</b> 길게 쓰라는 게 아니라 이 세 칸만 채우면 돼.
    </>
  );
  const target = streak[0] ?? longPoor[0];
  return { verdict, headline, good, bad, next, alts: target ? [{ from: target, items: altsFor(target, 2) }] : undefined };
}

/** 질문 카드 한 장의 판정 — 근거는 그 질문의 칸 · 길이 · AI가 몰래 정한 것 */
function judgeQ(q: Row): { verdict: Verdict; why: string } {
  const score = scoreOf(q);
  const tail = ""; // AI가 몰래 정한 것은 카드의 🤫 줄에서 따로 보여준다
  if (score >= 4) return { verdict: "good", why: `${eul(sixNames(q.got))} 실어서 답이 네 프로젝트 쪽으로 좁혀졌어.` };
  if (q.chars <= 6) return { verdict: "bad", why: `${q.chars}자 — 무엇이 어떻게 안 되는지 빠져서 AI가 추측으로 답했어.${tail}` };
  if (q.o === "O5") return { verdict: "bad", why: `맥락 없이 커서 누구에게나 같은 답이 와.${tail}` };
  if (score < 2) return { verdict: "bad", why: q.o === "O1" ? `무엇을 만들지만 있고 왜·어떤 조건인지가 없어 — 나머지는 AI가 전부 채웠어.${tail}` : `실은 칸이 거의 없어서 일반적인 답이 왔어.${tail}` };
  return {
    verdict: "ok",
    why: q.got.length
      ? `${neun(sixNames(q.got))} 실었지만 ${SIX_EMOJI[firstMiss(q) ?? q.miss[0]]} ${SIX[firstMiss(q) ?? q.miss[0]].name}이 빠졌어 — ${SIX_WHY[firstMiss(q) ?? q.miss[0]]}.`
      : `방향은 좋은데 실은 칸이 없어 답이 넓게 퍼졌어.${tail}`,
  };
}

function trendLine(rows: Row[]) {
  if (rows.length < 4) return "";
  const half = Math.floor(rows.length / 2);
  const avg = (xs: Row[]) => xs.reduce((s, x) => s + x.got.length, 0) / xs.length;
  const a = avg(rows.slice(0, half));
  const b = avg(rows.slice(half));
  if (b - a >= 0.8) return ` 뒤로 갈수록 실은 게 늘었어(앞 절반 평균 ${a.toFixed(1)} → 뒤 절반 ${b.toFixed(1)}) — 좋아지는 중이야.`;
  if (a - b >= 0.8) return ` 뒤로 갈수록 실은 게 줄었어(${a.toFixed(1)} → ${b.toFixed(1)}). 급해질 때 목적 한 줄이 먼저 빠져.`;
  return ` 앞 절반과 뒤 절반의 실은 것은 비슷했어(${a.toFixed(1)} → ${b.toFixed(1)}).`;
}

/* ---------- 틀 ---------- */

function Section({ n, title, desc, children }: { n: string; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-4">
      <h3 className="flex items-center gap-2 text-[15px] font-extrabold">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-clay text-[12px] text-[#1a1400]">{n}</span>
        {title}
      </h3>
      {desc && <p className="mt-1 mb-3 text-[12.5px] leading-relaxed text-sub">{desc}</p>}
      {!desc && <div className="mb-3" />}
      {children}
    </section>
  );
}

const VERDICT: Record<Verdict, { label: string; color: string; bg: string }> = {
  good: { label: "👍 잘하고 있어", color: "#5ad1b3", bg: "#0e2f2c" },
  ok: { label: "➖ 반쯤 왔어", color: "#5cb8ff", bg: "#12284d" },
  bad: { label: "⚠️ 여기부터 고치자", color: "#ff9a7a", bg: "#3a1a24" },
};

/** 🤖 AI 코치 — 결론 한 문장 → 잘한 것 · 아쉬운 것 · 다음엔 → 이렇게 바꿔 물어봐(대안) */
function Coach({ verdict, headline, good, bad, next, alts, extra }: CoachSay & { extra?: React.ReactNode }) {
  const v = VERDICT[verdict];
  return (
    <div
      className="coach relative mt-4 overflow-hidden rounded-2xl border-2"
      style={{ borderColor: v.color, background: `linear-gradient(160deg, ${v.bg} 0%, #131a35 75%)`, boxShadow: `0 0 0 4px ${v.color}1f, 0 8px 24px -12px ${v.color}80` }}
    >
      <div className="flex items-start gap-3 px-4 pt-3.5 pb-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[20px]" style={{ background: `${v.color}26`, border: `2px solid ${v.color}` }}>
          🤖
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2">
            <span className="text-[11.5px] font-extrabold tracking-wide" style={{ color: v.color }}>
              AI 코치의 한마디
            </span>
            <span className="rounded-full px-2.5 py-0.5 text-[11.5px] font-extrabold text-[#070a18]" style={{ background: v.color }}>
              {v.label}
            </span>
          </p>
          <p className="mt-1 text-[16px] font-extrabold leading-snug text-ink">{headline}</p>
        </div>
      </div>
      <div className="space-y-2 px-4 pb-3 text-[13.5px] leading-relaxed">
        {good && (
          <CoachLine icon="👍" label="잘한 것" color="#5ad1b3">
            {good}
          </CoachLine>
        )}
        {bad && (
          <CoachLine icon="⚠️" label="아쉬운 것" color="#ff9a7a">
            {bad}
          </CoachLine>
        )}
        {next && (
          <CoachLine icon="👉" label="다음엔" color="#ffc83d">
            {next}
          </CoachLine>
        )}
      </div>
      {alts?.length ? (
        <div className="border-t px-4 py-3" style={{ borderColor: `${v.color}44`, background: "#070a1880" }}>
          <p className="mb-2 text-[12.5px] font-extrabold text-clay">🔁 이렇게 바꿔 물어봐 — 실제 질문으로 만든 대안</p>
          <div className="space-y-3">
            {alts.map((g) => (
              <AltSet key={g.from.t.id} from={g.from} items={g.items} />
            ))}
          </div>
        </div>
      ) : null}
      {extra && <p className="border-t border-line px-4 py-2.5 text-[12px] leading-relaxed text-sub">📝 {extra}</p>}
    </div>
  );
}

function CoachLine({ icon, label, color, children }: { icon: string; label: string; color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border-l-[3px] bg-[#070a18]/40 px-3 py-2" style={{ borderColor: color }}>
      <p className="mb-0.5 text-[11.5px] font-extrabold" style={{ color }}>
        {icon} {label}
      </p>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** 원래 질문 하나 → 대안 2~3가지 (위→아래 가지) */
function AltSet({ from, items, compact }: { from: Row; items: Alt[]; compact?: boolean }) {
  return (
    <div>
      {!compact && (
        <p className={`rounded-lg bg-sand px-2.5 py-1.5 ${compact ? "text-[12px]" : "text-[12.5px]"}`}>
          <span className="mr-1.5 rounded bg-card px-1.5 py-0.5 text-[10.5px] font-extrabold text-sub">원래 Q{from.n}</span>
          <span className="text-sub line-through decoration-[#ff9a7a]/70">“{baseQ(from)}”</span>
        </p>
      )}
      <ul className="ml-3 border-l-2 border-clay/50">
        {items.map((a, i) => (
          <li key={i} className="relative pt-2 pl-4">
            <span className="absolute top-[18px] left-0 h-[2px] w-3 bg-clay/50" />
            <div className="rounded-lg border border-clay/40 bg-clay-soft/60 px-2.5 py-1.5">
              <p className="text-[11px] font-extrabold text-clay">
                대안 {String.fromCharCode(65 + i)} · {a.tag}
              </p>
              <p className={`mt-0.5 font-semibold leading-relaxed text-ink ${compact ? "text-[12.5px]" : "text-[13px]"}`}>“{a.after}”</p>
              <p className="mt-0.5 text-[11.5px] text-sub">→ {a.why}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const Fill = ({ k }: { k: SixKey }) => <code className="rounded bg-card px-1.5 py-0.5 text-[12px] text-ink">{SIX_FIX[k]}</code>;

function Kpi({ label, sub, children }: { label: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="grid justify-items-center rounded-xl bg-card px-1 py-2.5 text-center">
      <div className="grid h-[64px] place-items-center">{children}</div>
      <p className="mt-1 text-[11.5px] font-bold">{label}</p>
      <p className="text-[10.5px] text-sub">{sub}</p>
    </div>
  );
}

/* ---------- 작은 SVG 계기 ---------- */

function Ring({ value, total, color, text }: { value: number; total: number; color: string; text: string }) {
  const R = 26;
  const C = 2 * Math.PI * R;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" role="img" aria-label={text}>
      <circle cx="32" cy="32" r={R} fill="none" stroke="#1d2648" strokeWidth="7" />
      {value > 0 && <circle cx="32" cy="32" r={R} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(value / Math.max(1, total)) * C} ${C}`} transform="rotate(-90 32 32)" />}
      <text x="32" y="36.5" textAnchor="middle" fontSize="13" fontWeight="800" fill="#f2f4ff">
        {text}
      </text>
    </svg>
  );
}

/** 여섯 조각 육각형 — 평균 몇 칸을 채웠나 */
function HexMeter({ value }: { value: number }) {
  const cx = 32,
    cy = 32,
    R = 27;
  const pt = (i: number, rr: number) => [cx + rr * Math.cos((Math.PI / 3) * i - Math.PI / 2), cy + rr * Math.sin((Math.PI / 3) * i - Math.PI / 2)];
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" role="img" aria-label={`${value}/6`}>
      {Array.from({ length: 6 }, (_, i) => {
        const [x1, y1] = pt(i, R);
        const [x2, y2] = pt(i + 1, R);
        const fill = value >= i + 1 ? "#5ad1b3" : value > i ? "#5ad1b380" : "#1d2648";
        return <path key={i} d={`M${cx},${cy} L${x1},${y1} L${x2},${y2} Z`} fill={fill} stroke="#131a35" strokeWidth="2" />;
      })}
      <circle cx={cx} cy={cy} r="12" fill="#131a35" />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill="#f2f4ff">
        {value}
      </text>
    </svg>
  );
}

/** 평균 길이를 짧음 · 보통 · 긴 띠 위에 꽂는다 */
function LenMeter({ avg }: { avg: number }) {
  const W = 120,
    max = 200;
  const x = (c: number) => 6 + (Math.min(c, max) / max) * (W - 12);
  return (
    <svg width={W} height="64" viewBox={`0 0 ${W} 64`} role="img" aria-label={`평균 ${avg}자`}>
      <text x={W / 2} y="22" textAnchor="middle" fontSize="18" fontWeight="900" fill="#f2f4ff">
        {avg}
        <tspan fontSize="10" fill="#98a2cc">
          자
        </tspan>
      </text>
      <rect x={x(0)} y="34" width={x(40) - x(0)} height="8" rx="3" fill={LENGTH_INFO.short.color} opacity=".55" />
      <rect x={x(40)} y="34" width={x(120) - x(40)} height="8" fill={LENGTH_INFO.mid.color} opacity=".55" />
      <rect x={x(120)} y="34" width={x(max) - x(120)} height="8" rx="3" fill={LENGTH_INFO.long.color} opacity=".55" />
      <path d={`M${x(avg)},31 l-4,-5 h8 z`} fill="#ffc83d" />
      <line x1={x(avg)} x2={x(avg)} y1="31" y2="45" stroke="#ffc83d" strokeWidth="2" />
      <text x={x(0)} y="56" fontSize="8" fill="#98a2cc">
        0
      </text>
      <text x={x(40)} y="56" fontSize="8" textAnchor="middle" fill="#98a2cc">
        40
      </text>
      <text x={x(120)} y="56" fontSize="8" textAnchor="middle" fill="#98a2cc">
        120
      </text>
    </svg>
  );
}

/** 되묻기 하나당 점 하나 — 초록 내 말로 · 노랑 힌트 후 · 회색 모름 · 빈 원 넘김 */
function Dots({ items }: { items: number[] }) {
  if (!items.length) return <span className="text-2xl text-sub">—</span>;
  const per = Math.min(5, items.length);
  const rowsN = Math.ceil(items.length / per);
  return (
    <svg width={per * 16} height={rowsN * 16} viewBox={`0 0 ${per * 16} ${rowsN * 16}`}>
      {items.map((s, i) => {
        const cx = (i % per) * 16 + 8,
          cy = Math.floor(i / per) * 16 + 8;
        return s < 0 ? <circle key={i} cx={cx} cy={cy} r="5.5" fill="none" stroke="#6b7398" strokeWidth="1.5" /> : <circle key={i} cx={cx} cy={cy} r="6" fill={s >= 2 ? "#5ad1b3" : s === 1 ? "#ffc83d" : "#98a2cc"} />;
      })}
    </svg>
  );
}

/* ---------- ① 질문 나무 — 뿌리 → 세 갈래 → 다섯 유형 → 질문 ---------- */

function elbow(x1: number, y1: number, x2: number, y2: number) {
  const m = (y1 + y2) / 2;
  return `M${x1},${y1} V${m - 6} Q${x1},${m} ${x1 + Math.sign(x2 - x1) * 6},${m} H${x2 - Math.sign(x2 - x1) * 6} Q${x2},${m} ${x2},${m + 6} V${y2}`;
}

function QuestionTree({ rows }: { rows: Row[] }) {
  const W = 680;
  const colX = (i: number) => 86 + i * 127;
  const typeX: Record<OKey, number> = {
    O1: colX(0),
    O2: colX(1),
    O3: colX(2),
    O4: colX(3),
    O5: colX(4),
  };
  const groupX = (g: (typeof GROUPS)[number]) => g.keys.reduce((s, k) => s + typeX[k], 0) / g.keys.length;
  const rootX = W / 2;
  const Y = { root: 26, group: 104, type: 190, leaf: 252 };
  const STEP = 27;
  const by = (k: Openness) => rows.filter((x) => x.o === k);
  const maxLeaves = Math.max(1, ...O_KEYS.map((k) => by(k).length));
  const H = Y.leaf + maxLeaves * STEP + 6;
  const total = rows.filter((x) => x.o !== "NA").length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full min-w-[600px]" role="img" aria-label="질문 나무">
      {/* 뿌리 → 갈래 */}
      {GROUPS.map((g) => {
        const c = g.keys.reduce((s, k) => s + by(k).length, 0);
        return (
          <path
            key={g.key}
            d={elbow(rootX, Y.root + 20, groupX(g), Y.group - 24)}
            fill="none"
            stroke={c ? g.color : "#2b3560"}
            strokeWidth={c ? 2 + (c / Math.max(1, total)) * 5 : 1.5}
            strokeOpacity={c ? 0.75 : 1}
            strokeLinecap="round"
          />
        );
      })}
      {/* 갈래 → 유형 */}
      {GROUPS.flatMap((g) =>
        g.keys.map((k) => {
          const c = by(k).length;
          return (
            <path
              key={k}
              d={elbow(groupX(g), Y.group + 24, typeX[k], Y.type - 30)}
              fill="none"
              stroke={c ? oColor(k) : "#2b3560"}
              strokeWidth={c ? 2 + (c / Math.max(1, total)) * 4 : 1.5}
              strokeOpacity={c ? 0.8 : 1}
              strokeLinecap="round"
            />
          );
        }),
      )}

      {/* 뿌리 */}
      <g>
        <rect x={rootX - 82} y={Y.root - 20} width="164" height="40" rx="20" fill="#2b2208" stroke="#ffc83d" strokeWidth="1.5" />
        <text x={rootX} y={Y.root + 5} textAnchor="middle" fontSize="14" fontWeight="800" fill="#ffc83d">
          🔎 질문 {rows.length}개
        </text>
      </g>

      {/* 갈래 */}
      {GROUPS.map((g) => {
        const c = g.keys.reduce((s, k) => s + by(k).length, 0);
        const x = groupX(g);
        return (
          <g key={g.key} opacity={c ? 1 : 0.45}>
            <rect x={x - 76} y={Y.group - 24} width="152" height="48" rx="12" fill="#131a35" stroke={g.color} strokeWidth={c ? 1.8 : 1} />
            <text x={x} y={Y.group - 4} textAnchor="middle" fontSize="13" fontWeight="800" fill={g.color}>
              {g.label} · {c}
            </text>
            <text x={x} y={Y.group + 13} textAnchor="middle" fontSize="10.5" fill="#98a2cc">
              {g.sub}
            </text>
          </g>
        );
      })}

      {/* 유형 + 매달린 질문 */}
      {O_KEYS.map((k) => {
        const o = k as OKey;
        const x = typeX[o];
        const list = by(o);
        const role = ROLE[OPEN[o].role as RoleKey];
        const col = oColor(o);
        const pct = total ? Math.round((list.length / total) * 100) : 0;
        const spine = x - 52;
        return (
          <g key={k} opacity={list.length ? 1 : 0.4}>
            <rect x={x - 60} y={Y.type - 30} width="120" height="60" rx="12" fill={list.length ? `${col}22` : "#131a35"} stroke={col} strokeWidth={list.length ? 1.6 : 1} />
            {o === "O3" && (
              <text x={x + 56} y={Y.type - 33} textAnchor="end" fontSize="9.5" fontWeight="800" fill="#3fe0c0">
                ★ 스위트 스팟
              </text>
            )}
            <text x={x} y={Y.type - 11} textAnchor="middle" fontSize="11.5" fontWeight="800" fill="#f2f4ff">
              {OPEN[o].short}
            </text>
            <text x={x} y={Y.type + 5} textAnchor="middle" fontSize="10.5" fill={col}>
              {role.emoji} {role.name}
            </text>
            <text x={x} y={Y.type + 21} textAnchor="middle" fontSize="11" fontWeight="800" fill="#f2f4ff">
              {list.length}개{" "}
              <tspan fontWeight="500" fill="#98a2cc">
                · {pct}%
              </tspan>
            </text>
            {list.length > 0 && <line x1={spine} x2={spine} y1={Y.type + 30} y2={Y.leaf + (list.length - 1) * STEP + 11} stroke={col} strokeOpacity=".6" strokeWidth="1.5" />}
            {list.map((q, i) => {
              const y = Y.leaf + i * STEP;
              return (
                <g key={q.t.id}>
                  <title>{`Q${q.n} · ${q.chars}자 · 실은 것 ${q.got.length}/6\n${q.t.question}`}</title>
                  <line x1={spine} x2={spine + 8} y1={y + 11} y2={y + 11} stroke={col} strokeOpacity=".6" strokeWidth="1.5" />
                  <rect x={spine + 8} y={y} width="104" height="22" rx="7" fill="#1d2648" stroke={col} strokeOpacity=".5" />
                  <text x={spine + 15} y={y + 15} fontSize="10.5" fontWeight="800" fill="#f2f4ff">
                    Q{q.n}
                  </text>
                  <text x={spine + 44} y={y + 15} fontSize="9.5" fill="#98a2cc">
                    {q.chars}자
                  </text>
                  {/* 실은 것 미니 막대 — 여섯 칸 */}
                  {SIX_KEYS.map((s, j) => (
                    <rect key={s} x={spine + 76 + j * 5.5} y={y + 7} width="4" height="8" rx="1" fill={q.got.includes(s) ? "#5ad1b3" : "#2b3560"} />
                  ))}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- ② 실은 것 나무 + 육각 차트 ---------- */

function SixTree({ count, n }: { count: (k: SixKey) => number; n: number }) {
  const habit = SIX_KEYS.filter((k) => count(k) > n / 2).sort((a, b) => count(b) - count(a));
  const thin = SIX_KEYS.filter((k) => count(k) <= n / 2).sort((a, b) => count(b) - count(a));
  const W = 560;
  const Y = { root: 22, branch: 92, leaf: 162 };
  const leafW = 82;
  // 잎 여섯 개를 한 줄에 고르게 — 습관 먼저, 그다음 빠지는 것. 가지 노드는 제 잎들의 가운데에 선다.
  const order = [...habit, ...thin];
  const gap = (W - 6 * leafW) / 7;
  const leafX = (k: SixKey) => gap + order.indexOf(k) * (leafW + gap) + leafW / 2;
  const mid = (list: SixKey[], fallback: number) => (list.length ? list.reduce((s, k) => s + leafX(k), 0) / list.length : fallback);
  const branches = [
    {
      key: "habit",
      label: "✅ 습관이 된 것",
      list: habit,
      color: "#5ad1b3",
      x: Math.max(84, mid(habit, 90)),
    },
    {
      key: "thin",
      label: "⬜ 자주 빠지는 것",
      list: thin,
      color: "#ffc83d",
      x: Math.min(W - 84, mid(thin, W - 90)),
    },
  ];
  if (!habit.length) branches[1].x = Math.max(branches[1].x, 270);
  if (!thin.length) branches[0].x = Math.min(branches[0].x, W - 270);
  return (
    <svg viewBox={`0 0 ${W} 216`} className="block w-full min-w-[480px]" role="img" aria-label="실은 것 나무">
      {branches.map((b) => (
        <path key={b.key} d={elbow(W / 2, Y.root + 18, b.x, Y.branch - 20)} fill="none" stroke={b.list.length ? b.color : "#2b3560"} strokeWidth="2.5" strokeOpacity=".75" />
      ))}
      <rect x={W / 2 - 74} y={Y.root - 18} width="148" height="36" rx="18" fill="#0e2f2c" stroke="#5ad1b3" strokeWidth="1.5" />
      <text x={W / 2} y={Y.root + 5} textAnchor="middle" fontSize="13" fontWeight="800" fill="#5ad1b3">
        🎒 여섯 가지
      </text>
      {branches.map((b) => {
        const lx = (i: number) => leafX(b.list[i]);
        return (
          <g key={b.key}>
            {b.list.map((k, i) => (
              <path key={k} d={elbow(b.x, Y.branch + 20, lx(i), Y.leaf - 26)} fill="none" stroke={b.color} strokeOpacity=".55" strokeWidth="1.5" />
            ))}
            <rect x={b.x - 80} y={Y.branch - 20} width="160" height="40" rx="12" fill="#131a35" stroke={b.color} strokeWidth="1.5" opacity={b.list.length ? 1 : 0.45} />
            <text x={b.x} y={Y.branch + 5} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={b.color}>
              {b.label} · {b.list.length}
            </text>
            {!b.list.length && (
              <text x={b.x} y={Y.branch + 34} textAnchor="middle" fontSize="10.5" fill="#98a2cc">
                아직 없어
              </text>
            )}
            {b.list.map((k, i) => {
              const x = lx(i);
              const c = count(k);
              return (
                <g key={k}>
                  <title>{`${SIX[k].name} — ${n}번 중 ${c}번`}</title>
                  <rect x={x - leafW / 2} y={Y.leaf - 26} width={leafW} height="62" rx="10" fill="#1d2648" stroke={b.color} strokeOpacity=".45" />
                  <text x={x} y={Y.leaf - 6} textAnchor="middle" fontSize="15">
                    {SIX_EMOJI[k]}
                  </text>
                  <text x={x} y={Y.leaf + 10} textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#f2f4ff">
                    {SIX[k].name.replace(/ \(.*\)/, "")}
                  </text>
                  <rect x={x - 30} y={Y.leaf + 18} width="60" height="6" rx="3" fill="#2b3560" />
                  <rect x={x - 30} y={Y.leaf + 18} width={(60 * c) / Math.max(1, n)} height="6" rx="3" fill={b.color} />
                  <text x={x} y={Y.leaf + 48} textAnchor="middle" fontSize="10" fill="#98a2cc">
                    {c}/{n}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

function SixRadar({ count, n }: { count: (k: SixKey) => number; n: number }) {
  const S = 220,
    cx = S / 2,
    cy = S / 2 + 4,
    R = 74;
  const ang = (i: number) => (Math.PI / 3) * i - Math.PI / 2;
  const pt = (i: number, rr: number) => `${cx + rr * Math.cos(ang(i))},${cy + rr * Math.sin(ang(i))}`;
  const poly = SIX_KEYS.map((k, i) => pt(i, Math.max(3, (count(k) / Math.max(1, n)) * R))).join(" ");
  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="mx-auto block w-full max-w-[220px]" role="img" aria-label="여섯 가지 육각 차트">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={SIX_KEYS.map((_, i) => pt(i, R * f)).join(" ")} fill="none" stroke={f === 0.5 ? "#ffc83d55" : "#2b3560"} strokeDasharray={f === 0.5 ? "3 3" : undefined} />
      ))}
      {SIX_KEYS.map((_, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + R * Math.cos(ang(i))} y2={cy + R * Math.sin(ang(i))} stroke="#2b3560" />
      ))}
      <polygon points={poly} fill="#5ad1b333" stroke="#5ad1b3" strokeWidth="2" strokeLinejoin="round" />
      {SIX_KEYS.map((k, i) => {
        const rr = Math.max(3, (count(k) / Math.max(1, n)) * R);
        return <circle key={k} cx={cx + rr * Math.cos(ang(i))} cy={cy + rr * Math.sin(ang(i))} r="3.5" fill={count(k) > n / 2 ? "#5ad1b3" : "#ffc83d"} />;
      })}
      {SIX_KEYS.map((k, i) => (
        <text key={k} x={cx + (R + 22) * Math.cos(ang(i))} y={cy + (R + 22) * Math.sin(ang(i)) + 4} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#f2f4ff">
          {SIX_EMOJI[k]} {SIX[k].short} {count(k)}
        </text>
      ))}
      <text x="2" y={S - 4} fontSize="9.5" fill="#98a2cc">
        점선 = 절반
      </text>
    </svg>
  );
}

/* ---------- ③ 질문 지문 — 길이 막대 + 유형 동그라미 + 실은 것 여섯 칸 ---------- */

function Fingerprint({ rows }: { rows: Row[] }) {
  const L = 40,
    Rm = 12,
    T = 18,
    plotH = 130;
  const step = Math.max(44, Math.min(64, 600 / rows.length));
  const W = L + Rm + step * rows.length;
  const base = T + plotH;
  const top = Math.max(140, ...rows.map((x) => x.chars)) * 1.08;
  const y = (c: number) => base - (Math.min(c, top) / top) * plotH;
  const x = (i: number) => L + step * i + step / 2;
  const H = base + 26 + 6 * 8.5 + 10;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" style={{ minWidth: Math.min(W, 560) }} role="img" aria-label="질문 지문 차트">
      {/* 길이 띠 */}
      <rect x={L} y={y(Math.min(top, 1e9))} width={W - L - Rm} height={y(120) - y(top)} fill={LENGTH_INFO.long.color} opacity=".06" />
      <rect x={L} y={y(120)} width={W - L - Rm} height={y(40) - y(120)} fill={LENGTH_INFO.mid.color} opacity=".06" />
      {[40, 120]
        .filter((v) => v < top)
        .map((v) => (
          <g key={v}>
            <line x1={L} x2={W - Rm} y1={y(v)} y2={y(v)} stroke="#98a2cc" strokeOpacity=".35" strokeDasharray="4 4" />
            <text x={L - 6} y={y(v) + 3.5} textAnchor="end" fontSize="9.5" fill="#98a2cc">
              {v}자
            </text>
          </g>
        ))}
      <line x1={L} x2={W - Rm} y1={base} y2={base} stroke="#2b3560" />
      <text x={L - 6} y={base + 3.5} textAnchor="end" fontSize="9.5" fill="#98a2cc">
        0
      </text>

      {/* 실은 것이 늘고 주는 흐름선 */}
      <polyline points={rows.map((q, i) => `${x(i)},${base - 8 - (q.got.length / 6) * (plotH - 16)}`).join(" ")} fill="none" stroke="#5ad1b3" strokeOpacity=".45" strokeWidth="1.5" strokeDasharray="2 3" />

      {rows.map((q, i) => {
        const col = oColor(q.o);
        return (
          <g key={q.t.id}>
            <title>{`Q${q.n} · ${q.chars}자 · ${q.o === "NA" ? "판별 불가" : OPEN[q.o].label} · 실은 것 ${q.got.length}/6\n${q.t.question}`}</title>
            <line x1={x(i)} x2={x(i)} y1={base} y2={y(q.chars)} stroke={col} strokeWidth="3" strokeLinecap="round" opacity=".75" />
            <circle cx={x(i)} cy={y(q.chars)} r="7" fill={col} stroke="#131a35" strokeWidth="2" />
            <text x={x(i)} y={y(q.chars) - 11} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#f2f4ff">
              {q.chars}
            </text>
            <text x={x(i)} y={base + 15} textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#f2f4ff">
              Q{q.n}
            </text>
            {SIX_KEYS.map((s, j) => (
              <rect key={s} x={x(i) - 6} y={base + 24 + j * 8.5} width="12" height="6.5" rx="1.5" fill={q.got.includes(s) ? "#5ad1b3" : "#1d2648"} stroke="#2b3560" strokeWidth=".5" />
            ))}
          </g>
        );
      })}
      {SIX_KEYS.map((s, j) => (
        <text key={s} x={L - 6} y={base + 30 + j * 8.5} textAnchor="end" fontSize="8.5" fill="#98a2cc">
          {SIX[s].short}
        </text>
      ))}
    </svg>
  );
}

function Legend() {
  return (
    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-sub">
      {O_KEYS.map((k) => (
        <span key={k} className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: oColor(k) }} />
          {OPEN[k as OKey].label}
        </span>
      ))}
      <span className="flex items-center gap-1">
        <span className="inline-block h-2 w-3 rounded-sm bg-mint" /> 실은 칸
      </span>
      <span className="flex items-center gap-1">
        <svg width="18" height="6">
          <line x1="0" x2="18" y1="3" y2="3" stroke="#5ad1b3" strokeDasharray="2 3" strokeWidth="1.5" />
        </svg>{" "}
        실은 개수 흐름
      </span>
    </div>
  );
}

/* ---------- ④ 유형 가지 — 머리 노드 아래로 질문 카드가 매달린다 ---------- */

function TypeBranch({ o, rows }: { o: Openness; rows: Row[] }) {
  const col = oColor(o);
  const info = o === "NA" ? null : OPEN[o];
  const role = info ? ROLE[info.role as RoleKey] : null;
  return (
    <div>
      <div className="flex items-center gap-2 rounded-xl border px-3 py-2" style={{ borderColor: `${col}88`, background: `${col}18` }}>
        <span className="text-lg">{role?.emoji ?? "🧾"}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-extrabold" style={{ color: col }}>
            {info ? `${info.short} → ${role!.name}` : "판별 불가 (코드·에러)"} · {rows.length}개
            <span className="ml-2 text-[11px] font-bold text-sub">
              {(["good", "ok", "bad"] as Verdict[])
                .map((k) => [k, rows.filter((q) => judgeQ(q).verdict === k).length] as const)
                .filter(([, c]) => c)
                .map(([k, c]) => `${VERDICT[k].label.split(" ")[0]} ${c}`)
                .join(" · ")}
            </span>
          </p>
          <p className="truncate text-[11px] text-sub">{info ? `${info.shape} — 얻는 것 ${info.gain} · 잃는 것 ${info.lose}` : "붙여넣은 코드·에러만 있어 폭을 판별하지 않았어"}</p>
        </div>
      </div>
      <ul className="ml-4 border-l-2 pl-0" style={{ borderColor: `${col}55` }}>
        {rows.map((q) => (
          <li key={q.t.id} className="relative pt-2.5 pl-4">
            <span className="absolute top-[22px] left-0 h-[2px] w-3" style={{ background: `${col}55` }} />
            <QCard q={q} col={col} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function QCard({ q, col }: { q: Row; col: string }) {
  const len = LENGTH_INFO[lengthKeyOf(q.chars)];
  const fix = q.miss[0];
  const rq = q.rq;
  const el = rq ? elementById(rq.element) : undefined;
  const axis = rq ? AXES.find((a) => a.key === (rq.axis ?? axisOf(rq.element))) : undefined;
  const j = judgeQ(q);
  const v = VERDICT[j.verdict];
  return (
    <div className="rounded-xl border border-line bg-paper/40 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        <b className="rounded-md px-1.5 py-0.5 text-[11.5px] text-[#070a18]" style={{ background: col }}>
          Q{q.n}
        </b>
        <span className="rounded-md bg-sand px-1.5 py-0.5">
          {len.emoji} {q.chars}자
        </span>
        <span className="flex items-center gap-0.5 rounded-md bg-sand px-1.5 py-0.5" title={SIX_KEYS.map((k) => `${SIX[k].name} ${q.got.includes(k) ? "✅" : "⬜"}`).join(" · ")}>
          {SIX_KEYS.map((k) => (
            <span key={k} className={`grid h-4 w-4 place-items-center rounded-[4px] text-[9px] font-extrabold ${q.got.includes(k) ? "bg-mint text-[#070a18]" : "bg-card text-sub"}`}>
              {SIX[k].short}
            </span>
          ))}
          <span className="ml-1 font-bold">{q.got.length}/6</span>
        </span>
        {rq && (
          <span className="rounded-md bg-sand px-1.5 py-0.5">
            🧭 {rq.status === "answered" ? colorOf(rq.score ?? null) : "➖"} {el?.name ?? rq.element}
          </span>
        )}
        <span className="ml-auto rounded-full px-2 py-0.5 text-[10.5px] font-extrabold" style={{ color: v.color, background: v.bg }}>
          {v.label}
        </span>
      </div>
      <p className="mt-1.5 line-clamp-3 text-[13.5px] font-semibold leading-relaxed">“{q.t.question.trim()}”</p>
      <p className="mt-1.5 rounded-lg border-l-[3px] px-2.5 py-1.5 text-[12.5px] leading-relaxed" style={{ borderColor: v.color, background: `${v.bg}cc` }}>
        <b style={{ color: v.color }}>🤖 코치 </b>
        {j.why}
      </p>
      {secretsOf(q).length > 0 && (
        <p className="mt-1 text-[12px] leading-relaxed text-sub">
          🤫 AI가 몰래 정한 것 — <span className="text-ink">{secretsOf(q).join(" · ")}</span>
        </p>
      )}
      {j.verdict !== "good" ? (
        <div className="mt-2">
          <AltSet from={q} items={altsFor(q, 2)} compact />
        </div>
      ) : fix ? (
        <p className="mt-1.5 text-[12px] leading-relaxed text-sub">
          ✨ 한 단계 더 — {SIX_EMOJI[fix]} {SIX[fix].name}까지 실으면 → <Fill k={fix} />
        </p>
      ) : (
        <p className="mt-1.5 text-[12px] text-mint">✨ 여섯 칸을 다 실었어.</p>
      )}
      <details className="mt-1.5 text-[12px]">
        <summary className="cursor-pointer text-sub select-none">답 · 되묻기 · 남긴 것 펼치기</summary>
        <div className="mt-1.5 space-y-1 leading-relaxed">
          <p>
            <span className="text-sub">답 요약 —</span> {q.ans ? answerSummary(q.ans.md).replace(/\*\*|__|`/g, "") : "답이 남아 있지 않아"}
          </p>
          {q.ans?.yourCall?.length ? (
            <p>
              <span className="text-sub">답이 나에게 남긴 판단 —</span> {q.ans.yourCall.join(" · ")}
            </p>
          ) : null}
          <p>
            <span className="text-sub">기획서에 남긴 것 —</span> {q.plan ?? "새로 담긴 칸은 없었어"}
          </p>
          {q.miss.length > 1 && (
            <p>
              <span className="text-sub">그 밖에 빠진 것 —</span>{" "}
              {q.miss
                .slice(1)
                .map((k) => `${SIX_EMOJI[k]} ${SIX[k].name}`)
                .join(" · ")}
            </p>
          )}
          {rq && (
            <div className="mt-1 rounded-lg bg-sand px-2.5 py-2">
              <p className="font-bold">
                🧭 되묻기 — {el?.icon} {el?.name ?? rq.element}
                {axis ? ` (${axis.emoji} ${axis.name})` : ""} · {FORM_LABEL[rq.form]}
              </p>
              <p>물음: {rq.question}</p>
              <p>내 답: {rq.status === "answered" ? (rq.answer ?? "(적지 않음)") : rq.status === "later" ? "나중에로 넘김" : "아직 안 답함"}</p>
              <p>
                판정: {colorOf(rq.score ?? null)}
                {rq.hintStage ? ` · 힌트 ${rq.hintStage}단까지 열고` : ""} {rq.reason ?? ""}
              </p>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
