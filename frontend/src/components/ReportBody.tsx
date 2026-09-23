"use client";

// 리포트 본문 — 대화 속 카드 · 자세히 팝업이 똑같이 쓰는 한 벌. 섹션 ①~⑧의 순서와 이름은 REPORT_SECTIONS(.md 내보내기와 공유)에서만 정한다.
import { useState } from "react";
import roles from "@/data/roles.json";
import { update, useTable } from "@/lib/db";
import { buildTextStats, LENGTH_INFO, LENGTH_KEYS, O_KEYS, REPORT_SECTIONS, reportRange, ROLE_KEYS, seqOf, SIX_KEYS, textComment } from "@/lib/report";
import { AXES, axisOf, colorOf, elementById, FORM_LABEL } from "@/lib/rq";
import type { Openness, WindowReport } from "@/lib/types";
import { ReportArt, RingGauge, StampArt, TargetArt, TrophyArt } from "./Art";
import { RolePlanet } from "./Space";
import { Card } from "./ui";

const SIX_EMOJI: Record<string, string> = { why: "💡", context: "🧩", constraint: "📏", criteria: "⚖️", verify: "🔬", discard: "🗑" };
const RESULT_LABEL = { done: "✅ 해냈어!", partial: "➖ 절반쯤 했어", missed: "◻️ 다음 리포트에서 다시" };
const O_COLOR: Record<string, string> = { O1: "#b7b3d6", O2: "#5cb8ff", O3: "#3fe0c0", O4: "#ff7ac8", O5: "#ffd98a" };
const S = REPORT_SECTIONS;
const Say = ({ children }: { children: React.ReactNode }) => <p className="mt-3 rounded-xl bg-sand px-3 py-2 text-[13px] leading-relaxed">💬 {children}</p>;
const None = ({ children }: { children: React.ReactNode }) => <p className="text-[13px] leading-relaxed text-sub">{children}</p>;

export default function ReportBody({ r, readOnly = false }: { r: WindowReport; readOnly?: boolean }) {
  const reports = useTable("reports");
  const turns = useTable("turns");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const seq = seqOf(r, reports);
  const [qa, qb] = reportRange(r, reports);
  const ref = roles.stageMix[r.stage];
  const max = Math.max(1, ...O_KEYS.map((k) => r.mix[k]));
  const total = Math.max(1, O_KEYS.reduce((n, k) => n + r.mix[k], 0));
  const topRole = ROLE_KEYS.filter((k) => r.roles[k] > 0).sort((a, b) => r.roles[b] - r.roles[a])[0];
  const ranked = [...SIX_KEYS].sort((a, b) => r.six[b] - r.six[a]);
  const strong = ranked[0];
  const weak = ranked[ranked.length - 1];
  // 글자 수 — 리포트에 없으면(예전 기록) 남아 있는 질문에서 다시 센다
  const own = r.projectId ? turns.filter((t) => t.projectId === r.projectId && t.windowIndex === seq) : [];
  const text = r.text ?? (own.length ? buildTextStats(own, (_, i) => qa + i) : null);
  const lenMax = text ? Math.max(1, ...LENGTH_KEYS.map((k) => text.buckets[k].count)) : 1;

  const saveMission = () => {
    if (draft.trim()) update("reports", (prev) => prev.map((x) => (x.index === r.index ? { ...x, nextMission: { ...x.nextMission, text: draft.trim(), editedByStudent: true } } : x)));
    setEditing(false);
  };

  return (
    <div className="space-y-3">
      {/* ① 한눈에 보기 */}
      <section className="rounded-2xl border border-[#8a6a1f] bg-amber-soft p-4">
        <div className="flex items-center gap-2.5">
          <ReportArt size={40} />
          <div className="min-w-0">
            <p className="text-[15px] font-extrabold text-gold">{S[0].n} {S[0].title}</p>
            <p className="text-[12px] leading-relaxed text-sub">Q{qa}~Q{qb}, 질문 {total}개를 돌아봤어. 비교 대상은 언제나 예전의 너야.</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          <div className="grid justify-items-center rounded-xl bg-card px-1 py-2.5">
            <RingGauge value={r.mix.O3 + r.mix.O4} total={total} size={70} label="열린 질문" />
            <p className="mt-1 text-[11px] font-bold">🌅 열린 질문</p>
            <p className="text-[10px] text-sub">방법을 열어 두고 물음</p>
          </div>
          <div className="grid justify-items-center rounded-xl bg-card px-1 py-2.5">
            <span className="grid h-[70px] place-items-center">{topRole ? <RolePlanet role={topRole} size={62} /> : <span className="text-2xl">—</span>}</span>
            <p className="mt-1 text-[11px] font-bold">{topRole ? `${roles.roles[topRole].emoji} ${roles.roles[topRole].name} ${r.roles[topRole]}번` : "역할 없음"}</p>
            <p className="text-[10px] text-sub">AI를 가장 많이 앉힌 자리</p>
          </div>
          <div className="grid justify-items-center rounded-xl bg-card px-1 py-2.5">
            <span className="flex h-[70px] items-center gap-0.5 text-[28px] font-black tabular-nums">{text ? text.avg : "—"}<span className="mt-2.5 text-[11px] font-bold text-sub">자</span></span>
            <p className="mt-1 text-[11px] font-bold">📏 질문 평균 길이</p>
            <p className="text-[10px] text-sub">{text ? `가장 짧게 ${text.min}자 · 길게 ${text.max}자` : "기록 없음"}</p>
          </div>
          <div className="grid justify-items-center rounded-xl bg-card px-1 py-2.5">
            <span className="grid h-[70px] place-items-center text-lg leading-7">{r.elements.length ? r.elements.map((e) => colorOf(e.score)).join("") : "—"}</span>
            <p className="mt-1 text-[11px] font-bold">🧭 되묻기 {r.elements.length}번</p>
            <p className="text-[10px] text-sub">🟢 내 말로 · 🟡 힌트 후 · ⚪ 모름</p>
          </div>
        </div>
      </section>

      {/* ② 질문 유형 */}
      <Card n="2" title={S[1].title}>
        <p className="mb-3 text-[13px] leading-relaxed text-sub">질문을 어떤 폭으로 하느냐가 AI가 앉을 자리를 정해. 막대가 길수록 그 유형으로 많이 물었다는 뜻이야.</p>
        <div className="space-y-2.5">
          {O_KEYS.map((k, i) => {
            const o = roles.openness[k as Exclude<Openness, "NA">];
            const role = roles.roles[o.role as keyof typeof roles.roles];
            return (
              <div key={k} className={`flex items-center gap-2.5 ${r.mix[k] ? "" : "opacity-45"}`} title={`${o.label} → ${role.name} ${r.mix[k]}번`}>
                <RolePlanet role={o.role} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-baseline gap-1.5 text-[13px] font-bold">
                    <span className="truncate">{role.emoji} {o.label} → {role.name}</span>
                    <b className="ml-auto shrink-0 tabular-nums">{r.mix[k]}번 · {Math.round((r.mix[k] / total) * 100)}%</b>
                  </p>
                  <div className="mt-1 h-3 rounded-[4px] bg-sand">
                    <div className="grow-x h-full rounded-[4px]" style={{ width: `${(r.mix[k] / max) * 100}%`, background: O_COLOR[k], minWidth: r.mix[k] ? 8 : 0, animationDelay: `${i * 0.08}s` }} />
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-sub">{o.shape}</p>
                </div>
              </div>
            );
          })}
        </div>
        {r.mix.NA > 0 && <p className="mt-2 text-xs text-sub">판별 불가(코드·에러 붙여넣기) {r.mix.NA}개는 유형에서 뺐어.</p>}
        <p className="mt-3 text-xs text-sub">📐 참고 — {r.stage} 단계에서 잘 통하는 비율: 👨‍💻 좁은 질문 {ref.O2}% · 🛠 열린 질문 {ref.O3}% · 🏛 대안 질문 {ref.O4}%</p>
        <Say>{r.mixComment}</Say>
      </Card>

      {/* ③ 질문 길이 */}
      <Card n="3" title={S[2].title}>
        {text ? (
          <>
            <p className="mb-3 text-[13px] leading-relaxed text-sub">길다고 좋은 질문은 아니야. 글자 수마다 <b className="text-ink">질문에 몇 가지를 실었는지</b>를 같이 봐.</p>
            <div className="space-y-2.5">
              {LENGTH_KEYS.map((k, i) => {
                const b = text.buckets[k];
                const info = LENGTH_INFO[k];
                return (
                  <div key={k} className={`flex items-center gap-2.5 ${b.count ? "" : "opacity-45"}`}>
                    <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-sand text-lg">{info.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-baseline gap-1.5 text-[13px] font-bold">
                        <span className="truncate">{info.name} <span className="text-[11px] font-normal text-sub">{info.range}</span></span>
                        <b className="ml-auto shrink-0 tabular-nums">{b.count}번</b>
                      </p>
                      <div className="mt-1 h-3 rounded-[4px] bg-sand">
                        <div className="grow-x h-full rounded-[4px]" style={{ width: `${(b.count / lenMax) * 100}%`, background: info.color, minWidth: b.count ? 8 : 0, animationDelay: `${i * 0.08}s` }} />
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-sub">{b.count ? `실은 것 평균 ${b.avgSix}가지 · 그중 열린 질문 ${b.open}번` : "이 길이로는 묻지 않았어"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-sub">📏 평균 {text.avg}자{text.shortest && ` · 가장 짧은 질문 Q${text.shortest.n}(${text.shortest.chars}자)`}{text.longest && ` · 가장 긴 질문 Q${text.longest.n}(${text.longest.chars}자)`}</p>
            <Say>{textComment(text)}</Say>
          </>
        ) : (
          <None>이 리포트는 질문 원문이 남아 있지 않아서 글자 수를 셀 수 없어. 다음 리포트부터 나와.</None>
        )}
      </Card>

      {/* ④ 질문에 실은 것 */}
      <Card n="4" title={S[3].title}>
        <p className="mb-3 text-[13px] leading-relaxed text-sub">질문에 이 여섯 가지를 실을수록 나에게 맞는 답이 돌아와. 기둥은 {total}번 중 몇 번 실었는지야.</p>
        <div className="grid grid-cols-6 gap-1.5">
          {SIX_KEYS.map((k, i) => (
            <div key={k} className="text-center" title={`${roles.six[k].name} ${r.six[k]}번`}>
              <p className="text-xs font-extrabold tabular-nums">{r.six[k]}</p>
              <div className="relative mx-auto mt-0.5 h-20 w-full max-w-[44px] overflow-hidden rounded-lg bg-sand">
                <div className="grow-y absolute inset-x-0 bottom-0 rounded-t-[4px]" style={{ height: `${Math.min(100, (r.six[k] / total) * 100)}%`, background: k === weak && r.six[weak] < r.six[strong] ? "#ffc83d" : "#5ad1b3", animationDelay: `${i * 0.07}s` }} />
              </div>
              <p className="mt-1 text-lg leading-none">{SIX_EMOJI[k]}</p>
              <p className="mt-0.5 text-[10.5px] font-bold leading-tight">{roles.six[k].name.replace(/ \(.*\)/, "")}</p>
            </div>
          ))}
        </div>
        <Say>
          가장 자주 실은 건 <b>{SIX_EMOJI[strong]} {roles.six[strong].name}</b>({r.six[strong]}번).
          {r.six[weak] < r.six[strong] && <> 노란 기둥 <b>{SIX_EMOJI[weak]} {roles.six[weak].name}</b>({r.six[weak]}번)이 가장 비어 있어 — 다음 질문에 이 한 줄만 보태 봐.</>}
        </Say>
      </Card>

      {/* ⑤ 되묻기 돌아보기 */}
      <Card n="5" title={S[4].title}>
        {r.elements.length === 0 ? (
          <None>이번엔 되묻기에 답한 기록이 없어. 그래서 미션은 질문 습관에서 골랐어.</None>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {r.elements.map((e, i) => {
                const el = elementById(e.element);
                return (
                  <div key={i} className="rounded-xl bg-sand px-3 py-2 text-[13px]">
                    <p className="font-bold">{el?.icon} {el?.name} <span className="ml-0.5">{e.status === "answered" ? colorOf(e.score) : "➖"}</span></p>
                    <p className="text-[11px] text-sub">{e.status === "answered" ? `${FORM_LABEL[e.form]}(${e.form})${e.hintStage ? " · 힌트 후" : ""}` : "나중에로 넘김"}</p>
                  </div>
                );
              })}
            </div>
            {/* 세 축 — 코드보다 먼저 정할 세 가지 중 이번에 무엇을 확인했나 */}
            <div className="mt-3 rounded-xl border border-line px-3 py-2.5">
              <p className="text-[11px] font-bold text-sub">📐 이번에 확인한 세 축</p>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                {AXES.map((a) => {
                  const n = r.elements.filter((e) => axisOf(e.element) === a.key).length;
                  return (
                    <span key={a.key} className={n ? "font-bold" : "text-sub"} title={a.desc}>
                      {a.emoji} {a.name} <span className="tabular-nums">{n}</span>
                    </span>
                  );
                })}
              </div>
              {(() => {
                const thin = AXES.filter((a) => !r.elements.some((e) => axisOf(e.element) === a.key));
                return thin.length ? (
                  <p className="mt-1.5 text-[11px] leading-relaxed text-sub">
                    {thin.map((a) => `${a.emoji} ${a.name}`).join(" · ")}는 이번에 한 번도 안 물었어 — {thin[0].desc}. 입력창의 💡 → 📐 설계 묻기에서 그 칸부터 채워 봐.
                  </p>
                ) : (
                  <p className="mt-1.5 text-[11px] leading-relaxed text-sub">세 축을 다 확인했어. 기획 · 알고리즘 · 전체 구조를 네 말로 설명할 수 있다는 뜻이야.</p>
                );
              })()}
            </div>
            <p className="mt-2 text-[11px] text-sub">🟢 네 말로 설명함 · 🟡 힌트를 보고 답함 · ⚪ 아직 모름 — 점수가 아니라 다음에 어떤 모양으로 물을지 정하는 표시야.</p>
          </>
        )}
      </Card>

      {/* ⑥ 걸린 곳 */}
      <Card n="6" title={S[5].title}>
        {r.stuck.length === 0 ? (
          <None>같은 개념을 두 번 이상 물은 곳은 없었어.</None>
        ) : (
          r.stuck.map((s) => (
            <p key={s.concept} className="text-sm leading-relaxed">🪢 <b>{s.concept}</b> 관련 질문이 이번에 {s.countInWindow}번. 지금까지 합쳐 {s.countTotal}번째야.</p>
          ))
        )}
      </Card>

      {/* ⑦ 베스트 질문 */}
      <Card n="7" title={S[6].title}>
        {r.best ? (
          <>
            <div className="flex items-start gap-3">
              <TrophyArt />
              <p className="min-w-0 flex-1 rounded-xl border-l-[3px] border-clay bg-sand px-3 py-2.5 text-sm font-semibold leading-relaxed">“{r.best.text}” <span className="whitespace-nowrap text-xs font-normal text-sub">— Q{r.best.turnN}</span></p>
            </div>
            <Say>{r.best.reason}</Say>
          </>
        ) : (
          <None>이번엔 뽑지 않았어.</None>
        )}
      </Card>

      {/* ⑧ 미션 */}
      <Card n="8" title={S[7].title} tone="mission">
        {r.lastMission ? (
          <div className="mb-3 flex items-start gap-3 border-b border-line pb-3">
            <StampArt result={r.lastMission.result} size={44} />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-extrabold">지난 미션 — {RESULT_LABEL[r.lastMission.result]}</p>
              <p className="mt-0.5 text-[13px] font-semibold leading-relaxed">“{r.lastMission.text}”</p>
              <p className="mt-1 text-[12px] leading-relaxed text-sub">→ {r.lastMission.detail}</p>
            </div>
          </div>
        ) : (
          <p className="mb-3 border-b border-line pb-3 text-[12px] text-sub">지난 미션 — {seq === 1 ? "1번째 리포트라 아직 없어. 여기가 출발점이야." : "기록이 없어."}</p>
        )}
        {editing ? (
          <>
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} className="w-full resize-none rounded-xl border border-line bg-card px-3 py-2 text-sm outline-none" />
            <button type="button" onClick={saveMission} className="mt-2 w-full rounded-xl bg-ink py-2.5 text-sm font-bold text-paper">이걸로 할래</button>
          </>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <TargetArt size={44} />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-extrabold">다음 미션 — 하나만</p>
                <p className="mt-0.5 text-[15px] font-bold leading-relaxed">{r.nextMission.text}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-sub">← {r.nextMission.editedByStudent ? "네가 직접 정한 미션이야. 똑같이 지켜볼게." : r.nextMission.basis}</p>
              </div>
            </div>
            {!readOnly && <button type="button" onClick={() => { setDraft(r.nextMission.text); setEditing(true); }} className="mt-3 rounded-full border border-clay px-3.5 py-1.5 text-xs font-bold text-clay">✏️ 미션 바꾸기</button>}
          </>
        )}
      </Card>
    </div>
  );
}
