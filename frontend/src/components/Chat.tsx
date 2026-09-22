"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import lenses from "@/data/lenses.json";
import roles from "@/data/roles.json";
import formats from "@/data/formats.json";
import { askMe, deepAnswer, deepAsk, patchProject, pushMessage, runTurn } from "@/lib/actions";
import { update, useTable } from "@/lib/db";
import { checkLive, roleLabel } from "@/lib/engine";
import { reportTitle, reportToMd, seqOf, SIX_KEYS, windowCountOf } from "@/lib/report";
import { draftProgress, exportFilename, formatOf, projectMd } from "@/lib/draft";
import type { ChipKind, LensKey, Message, Project, WindowReport } from "@/lib/types";
import { scenarios } from "@/data/scenarios";
import { useApp } from "./AppContext";
import { AstroKid, JourneyMap, PlanArt, ReportArt, Sparkle, TelescopeArt } from "./Art";
import Buddy, { buddyName, levelOf } from "./Buddy";
import { CheckSheet, FormatPicker } from "./DraftKit";
import { AttachMenu, ImageStrip, MAX_IMAGES, filesToImages, useVoice } from "./Attach";
import Markdown from "./Markdown";
import ReportCard from "./ReportCard";
import RQCard from "./RQCard";
import { CoachAvatar, RolePlanet, Rocket } from "./Space";
import { Sheet } from "./ui";

// 확장 칩(메이커 · 공유·서버 · 협력 · AI) — 켜 둔 팩의 칩이 앞에 온다
const PACK_QUICK = (on: Project["packs"]) => {
  const keys = Object.keys(roles.packs) as (keyof typeof roles.packs)[];
  return [...keys.filter((k) => on.includes(k)), ...keys.filter((k) => !on.includes(k))].flatMap((k) => roles.packs[k].quick);
};
// 칩 줄의 묶음 — 버튼 하나를 누르면 심화처럼 카드 트레이로 펼쳐진다
type GroupKey = "format" | "expand" | "refine";
const GROUP: Record<GroupKey, { emoji: string; name: string; tip: string; box: string; text: string }> = {
  format: { emoji: "🧩", name: "형식 질문", tip: "이 형식에서 자주 막히는 곳", box: "border-line bg-card", text: "text-ink" },
  expand: { emoji: "🚀", name: "확장", tip: "한 단씩 키우기 — 누르면 빈칸 질문이 채워져", box: "border-[#2f6f8f] bg-[#0f2a3a]", text: "text-[#7fdcff]" },
  refine: { emoji: "🧭", name: "다듬기", tip: "방금 답을 넓히고 · 좁히고 · 되묻기", box: "border-line bg-card", text: "text-ink" },
};
const CHIP_LABEL: Record<ChipKind, string> = { widen: "🌅 넓히기", narrow: "🔍 좁히기", alt: "🔀 대안 묻기" };
const SAMPLES = [
  { tag: "좁게", text: "토양센서 값이 400 밑이면 펌프 3초 켜는 코드 짜줘" },
  { tag: "열고", text: "상추 화분 자동급수를 만들고 있어. 우노 + 정전용량 센서 + 5V 펌프, 다음 주 시연이야. 펌프가 깜빡이지 않는 게 기준이야. 급수 로직을 어떻게 잡으면 좋을까?" },
  { tag: "대안", text: "임계값 방식 말고 급수를 판단하는 다른 방식 2가지와, 각각 잃는 것은? 내 제약에선 뭐가 맞아?" },
];

interface DeepState {
  lens: LensKey;
  level: number;
  awaiting: boolean;
  next: string | null;
}

function Streamed({ md, active, onTick, onDone }: { md: string; active: boolean; onTick: () => void; onDone: () => void }) {
  const [len, setLen] = useState(0);
  useEffect(() => {
    if (!active) return;
    const step = Math.max(3, Math.ceil(md.length / 200));
    const timer = setInterval(() => setLen((l) => Math.min(md.length, l + step)), 24);
    return () => clearInterval(timer);
  }, [active, md]);
  useEffect(() => {
    if (!active) return;
    onTick();
    if (len >= md.length) onDone();
  }, [active, len, md.length, onTick, onDone]);
  return <Markdown streaming={active}>{active ? md.slice(0, len) : md}</Markdown>;
}

function CoachBubble({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="coach-row">
      <CoachAvatar size={34} />
      <div className="coach-bubble">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="coach-label"><span className="mini"><CoachAvatar size={20} /></span>코치</span>
          {right}
        </div>
        {children}
      </div>
    </div>
  );
}

// 턴 카드 — 내 질문(위, 파란 띠)과 코치의 답(아래)을 한 장으로 묶는다. 접으면 질문만 남는다.
function TurnCard({ n, q, open, onToggle, tag, onZoom, children }: { n: number; q: Extract<Message, { kind: "user" }>; open: boolean; onToggle: () => void; tag?: React.ReactNode; onZoom?: () => void; children: React.ReactNode }) {
  return (
    <article className={`turn rise ${open ? "open" : "closed"}`}>
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        aria-expanded={open}
        className="turn-q"
      >
        {open && <AstroKid size={38} />}
        <span className="turn-n">Q{n}</span>
        <span className="turn-body min-w-0 flex-1">
          <span className="turn-who">🙋 내 질문{q.chip ? ` · ${CHIP_LABEL[q.chip]} 칩` : ""}{q.images?.length ? ` · 🖼 ${q.images.length}` : ""}</span>
          <span className={`block whitespace-pre-wrap text-[15px] leading-relaxed ${open ? "" : "line-clamp-1"}`}>{q.text}</span>
        </span>
        {tag}
        {onZoom && (
          <button
            type="button"
            aria-label="크게 보기"
            title="크게 보기"
            onClick={(e) => {
              e.stopPropagation();
              onZoom();
            }}
            className="turn-zoom grid h-7 w-7 shrink-0 place-items-center rounded-full active:bg-white/20"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />
            </svg>
          </button>
        )}
        <span className="turn-caret">{open ? "▴" : "▾"}</span>
      </div>
      {open && q.images && q.images.length > 0 && (
        <div className="turn-img">
          <ImageStrip images={q.images} />
        </div>
      )}
      {open && <div className="turn-a">{children}</div>}
    </article>
  );
}

function plainPreview(md: string) {
  return md.replace(/```[\s\S]*?```/g, " ").replace(/[#>*`|_-]/g, "").replace(/\s+/g, " ").trim().slice(0, 70);
}

// 기획서 카드 — "기획서에 「…」 칸을 담았어"에서 칸 이름만 뽑아 두 줄로 보여준다
function planLine(note: string) {
  return note.match(/「(.+?)」/)?.[1] ?? note;
}

function AnswerView({ m, project, isLast, streaming, embedded, onTick, onStreamDone, onChip, onDeep, onAskMe, onRole, onTasks, onPlan }: {
  m: Extract<Message, { kind: "answer" }>;
  project: Project;
  isLast: boolean;
  streaming: boolean;
  embedded?: boolean;
  onTick: () => void;
  onStreamDone: () => void;
  onChip: (kind: ChipKind, draft: string) => void;
  onDeep: () => void;
  onAskMe: () => void;
  onRole: () => void;
  onTasks: () => void;
  onPlan: () => void;
}) {
  const { openMd } = useApp();
  const [override, setOverride] = useState<boolean | null>(null); // 지난 답은 핵심 한 줄로 접힌다
  const [detail, setDetail] = useState(false);
  const open = embedded || (override ?? (isLast || streaming));
  const o = m.analysis.openness;
  const roleColor = m.role ? roles.roles[m.role].color : undefined;
  const yourCall = m.yourCall ?? [];

  if (!open) {
    return (
      <button type="button" onClick={() => setOverride(true)} className="flex w-full items-center gap-2 rounded-2xl border border-line bg-card px-3 py-2.5 text-left">
        <CoachAvatar />
        <span className="min-w-0 flex-1 truncate text-[13px] text-sub">{plainPreview(m.md)}…</span>
        {m.role && <span className="shrink-0 text-xs font-bold" style={{ color: roleColor }}>{roleLabel(m.role, project)}</span>}
        <span className="shrink-0 text-xs text-sub">펼치기 ▾</span>
      </button>
    );
  }

  return (
    <div className="rise">
      <CoachBubble
        right={
          !embedded && !streaming && !isLast ? (
            <button type="button" onClick={() => setOverride(false)} className="text-[11px] font-semibold text-sub">
              접기 ▴
            </button>
          ) : undefined
        }
      >
        <Streamed md={m.md} active={streaming} onTick={onTick} onDone={onStreamDone} />
      </CoachBubble>

      {!streaming && (
        <div className="coach-extra fade mt-3 space-y-2.5">
          {/* ① 핵심: 위험 한 줄 · 역할 배지 · 다음 질문 칩 */}
          {m.riskNote && <p className="rounded-xl border border-[#8a6a1f] bg-amber-soft px-3 py-2.5 text-sm leading-relaxed">💬 {m.riskNote}</p>}

          {m.role && (
            <button type="button" onClick={onRole} className="flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-[13px] leading-relaxed" style={{ background: `${roleColor}1f`, borderColor: `${roleColor}55` }}>
              <RolePlanet role={m.role} size={34} />
              <span>이번 답에서 나는 <b style={{ color: roleColor }}>{roleLabel(m.role, project)}</b> 로 일했어. <span className="text-sub">({m.roleReason})</span></span>
            </button>
          )}

          {m.planNote && (
            <button type="button" onClick={onPlan} disabled={!project.plan} className="flex w-full items-start gap-2.5 rounded-xl border border-mint bg-mint-soft px-3 py-2.5 text-left text-[13px] leading-relaxed">
              <span className="mt-0.5 shrink-0"><PlanArt size={28} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-bold text-mint">📝 기획서.md에 담았어</span>
                <span className="mt-0.5 block font-semibold">{planLine(m.planNote)}</span>
              </span>
              {project.plan && <span className="mt-0.5 shrink-0 rounded-full border border-mint px-2 py-0.5 text-[11px] font-bold text-mint">전체 열기 ›</span>}
            </button>
          )}

          {isLast && m.chips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {m.chips.map((c) => (
                <button key={c.kind} type="button" onClick={() => onChip(c.kind, c.draft)} className="glow rounded-full border border-clay bg-card px-3.5 py-1.5 text-[13px] font-bold text-clay active:bg-clay-soft">
                  {CHIP_LABEL[c.kind]}
                </button>
              ))}
            </div>
          )}

          {/* ② 자세히: 가정 · 네가 정할 것 · 내 질문 돌아보기 — 한 줄 요약으로 접혀 있다 */}
          <div className="rounded-xl border border-line bg-card">
            <button type="button" onClick={() => setDetail((v) => !v)} aria-expanded={detail} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-bold">
              <span className="flex-1 truncate">
                {yourCall.length > 0 && <span className="mr-2 text-mint">🫵 정할 것 {yourCall.length}</span>}
                {m.assumptions.length > 0 && <span className="mr-2">📌 가정 {m.assumptions.length}</span>}
                <span className="text-sub">🔎 {o === "NA" ? "판별 불가" : roles.openness[o].short}</span>
              </span>
              <span className="flex items-center gap-1 text-sub"><Sparkle size={10} />{detail ? "닫기 ▴" : "자세히 ▾"}</span>
            </button>
            {detail && (
              <div className="fade space-y-3 border-t border-line px-3 py-3 text-[13px] leading-relaxed">
                {yourCall.length > 0 && (
                  <div>
                    <p className="font-bold text-mint">🫵 네가 정할 것 — 여기부턴 내가 대신 못 정해</p>
                    <ul className="mt-1 space-y-0.5">
                      {yourCall.map((y) => (
                        <li key={y}>· {y}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {m.assumptions.length > 0 && (
                  <div>
                    <p className="font-bold">📌 내가 가정한 것</p>
                    <ul className="mt-1 space-y-0.5 text-sub">
                      {m.assumptions.map((x) => (
                        <li key={x}>· {x}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <p className="font-bold">🔎 내 질문 돌아보기</p>
                  <p className="mt-1 text-sub">
                    {o === "NA" ? "코드·에러만 붙여넣은 질문이라 폭을 판별하지 않았어." : `${roles.openness[o].shape} — 얻는 것: ${roles.openness[o].gain} · 잃는 것: ${roles.openness[o].lose}`}
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    {SIX_KEYS.map((k) => (
                      <span key={k} title={roles.six[k].name} className={`grid min-h-[32px] flex-1 place-items-center rounded-lg px-1 py-1 text-center text-[10.5px] font-bold leading-tight ${m.analysis.six[k] >= 0.5 ? "bg-mint text-void" : "bg-sand text-sub"}`}>
                        {roles.six[k].name.replace(/ \(.*\)/, "")}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[11px] text-sub">왜 · 맥락 · 제약 · 기준 · 검증 · 버릴 것 — 질문에 실린 칸이 빛나. 단계: {m.analysis.stage}</p>
                </div>
              </div>
            )}
          </div>

          {/* ③ 도구 */}
          <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
            {project.format && <button type="button" className="rounded-full border border-mint bg-mint-soft px-3 py-1.5 text-mint" onClick={onTasks}>✅ 초안에 적기</button>}
            <button type="button" className="rounded-full bg-sand px-3 py-1.5" onClick={() => openMd({ title: "코치의 답", md: m.md, filename: `answer-${m.turnId}.md` })}>📄 MD 뷰어</button>
            {isLast && <button type="button" className="rounded-full bg-sand px-3 py-1.5" onClick={onDeep}>🔭 심화</button>}
            {isLast && <button type="button" className="rounded-full bg-sand px-3 py-1.5" onClick={onAskMe}>🙋 나한테 물어봐</button>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Chat({ project }: { project: Project }) {
  const { go, openDrawer, openMd, openReport, confirm } = useApp();
  const all = useTable("messages");
  const rqs = useTable("rqs");
  const turns = useTable("turns");
  const state = useTable("state");
  const reports = useTable("reports");
  const profile = useTable("profile");
  const messages = all.filter((m) => m.projectId === project.id);

  const [draft, setDraft] = useState("");
  const [images, setImages] = useState<string[]>([]); // 이번 질문에 붙인 사진 (멀티모달)
  const addImages = (imgs: string[]) => setImages((prev) => [...prev, ...imgs].slice(0, MAX_IMAGES));
  const voice = useVoice((said: string) => setDraft((d) => (d ? `${d} ${said}` : said))); // 핸들러는 ref로 들고 있어 매번 새로 만들어도 된다
  const [chip, setChip] = useState<ChipKind | null>(null);
  const [busy, setBusy] = useState(false);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [deep, setDeep] = useState<DeepState | null>(null);
  const [roleSheet, setRoleSheet] = useState(false);
  const [checkKey, setCheckKey] = useState<string | null>(null); // 초안에 적기 시트 — "" 이면 다음 빈칸
  const format = formatOf(project);
  const progress = draftProgress(project);
  const [openTurns, setOpenTurns] = useState<Record<string, boolean>>({}); // 턴 카드 열림 — 기본은 마지막 카드만
  const [sortNew, setSortNew] = useState(false);
  const [filter, setFilter] = useState<"all" | "q" | "rq">("all");
  const [tray, setTray] = useState<null | "quick" | "lens" | GroupKey>(null); // 입력창 위로 요술 램프처럼 솟는 트레이
  const quickOpen = tray === "quick";
  const [toolsOpen, setToolsOpen] = useState(false); // 보기 도구 줄 — 필요할 때만
  const [checksOpen, setChecksOpen] = useState(false); // 헤더의 형식 체크 칸 — 기본은 접힘
  const [live, setLive] = useState<boolean | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    checkLive().then(setLive);
  }, []);

  // 소개 페이지에서 고른 "막힌 자리"를 첫 질문으로 받아 적는다 — 한 번 쓰고 지운다
  useEffect(() => {
    let seed: string | null = null;
    try { seed = sessionStorage.getItem("ab.seed"); sessionStorage.removeItem("ab.seed"); } catch { /* 못 읽으면 그냥 빈 입력창 */ }
    if (!seed) return;
    setDraft(seed);
    input.current?.focus();
  }, []);

  const isExample = state.demoProjectId === project.id; // 시나리오 JSON에서 한꺼번에 불러온 예시
  const example = isExample ? scenarios.find((x) => `prj_example_${x.id}` === project.id) : undefined;
  const openPlan = () => project.plan && openMd({ title: `📝 ${project.plan.filename}`, md: project.plan.md, filename: project.plan.filename });
  const seen = useRef(0);
  const acted = useRef(false); // 이 화면에서 내가 질문 · 답을 보낸 적이 있나

  const toBottom = useCallback(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);
  const endStream = useCallback(() => setStreamId(null), []);
  useEffect(() => {
    // 예시는 처음부터 읽는 것 — 내가 뭔가 보내기 전까지는 맨 위에서 시작한다
    const grew = seen.current > 0 && messages.length > seen.current; // 불러온 뒤에 새 말이 붙었다
    seen.current = messages.length;
    if (grew) acted.current = true;
    if (isExample && !acted.current) {
      if (scroller.current) scroller.current.scrollTop = 0;
      return;
    }
    toBottom();
  }, [messages.length, busy, streamId, toBottom, isExample]);

  // 스트리밍 중인 답 뒤의 메시지(역질문 등)는 답이 끝난 뒤에 보인다 — 답의 첫 토큰보다 먼저 나오는 것은 없다
  const streamAt = streamId ? messages.findIndex((m) => m.id === streamId) : -1;
  const visible = streamAt >= 0 ? messages.slice(0, streamAt + 1) : messages;
  const lastAnswerId = [...messages].reverse().find((m) => m.kind === "answer")?.id;
  const lastId = messages[messages.length - 1]?.id;
  const unread = [...reports].reverse().find((r) => !r.opened);

  // 별이 — 리포트가 한 장 생길 때마다 레벨이 오르고 모습이 바뀐다
  const level = levelOf(reports.length);
  const windowCount = windowCountOf(project?.id, project?.name ?? "", turns, reports); // 다음 리포트까지 — 이 프로젝트의 질문만 센다
  const [seenLv, setSeenLv] = useState(level);
  if (level < seenLv) setSeenLv(level);
  const evolved = level > seenLv && !busy && !streamId;

  const send = async () => {
    const attached = deep?.awaiting ? [] : images;
    const text = draft.trim() || (attached.length ? "이 사진 좀 봐줘." : "");
    if (!text || busy) return;
    acted.current = true;
    setDraft("");
    setImages([]);
    const used = chip;
    setChip(null);
    if (input.current) input.current.style.height = "auto";
    setBusy(true);
    if (deep?.awaiting) {
      const next = await deepAnswer(project, deep.lens, deep.level, text);
      setDeep(deep.level >= 3 ? null : { ...deep, awaiting: false, next });
    } else {
      await runTurn(project.id, text, used, setStreamId, undefined, attached);
    }
    setBusy(false);
  };

  const onAction = (action: string) => {
    if (action.startsWith("rhythm:")) {
      const n = Number(action.split(":")[1]) as 2 | 3 | 4;
      patchProject(project.id, { rhythm: n, counter: 0 });
      pushMessage({ projectId: project.id, kind: "coach", md: `알겠어. 이제 **${n}문 1역**이야. 설정에서 언제든 바꿀 수 있어.` });
    }
    if (action === "deep:next" && deep) {
      const level = deep.level + 1;
      deepAsk(project, deep.lens, level, deep.next);
      setDeep({ ...deep, level, awaiting: true, next: null });
    }
    if (action === "deep:lens") {
      setDeep(null);
      setTray("lens");
    }
    if (action === "deep:stop") {
      setDeep(null);
      pushMessage({ projectId: project.id, kind: "coach", md: "좋아, 여기까지. 네 문장은 **생각 노트**에 있어. 하던 걸로 돌아가자." });
    }
  };

  const pickLens = (lens: LensKey) => {
    setTray(null);
    deepAsk(project, lens, 0);
    setDeep({ lens, level: 0, awaiting: true, next: null });
  };

  const group = tray === "format" || tray === "expand" || tray === "refine" ? tray : null;
  const groupItems: Record<GroupKey, { emoji: string; label: string; draft: string; chip?: string }[]> = {
    format: format?.quick ?? [],
    expand: PACK_QUICK(project.packs),
    refine: formats.common.filter((q) => lastAnswerId || !q.draft.startsWith("방금")),
  };

  const fillDraft = (text: string, kind: ChipKind | null) => {
    setDraft(text);
    setChip(kind);
    requestAnimationFrame(() => {
      const el = input.current;
      if (!el) return;
      el.focus();
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    });
  };

  const renderMessage = (m: Message, embedded = false) => {
      if (m.kind === "user") {
        return (
          <div key={m.id} className="rise me">
            <span className="me-label">나{m.chip ? ` · ${CHIP_LABEL[m.chip]} 칩` : ""}{m.deep ? " · 🔭 심화" : ""}</span>
            <div className={`me-bubble ${m.deep ? "deep" : ""}`}>
              {m.images && m.images.length > 0 && (
                <div className={m.text ? "mb-2" : ""}>
                  <ImageStrip images={m.images} />
                </div>
              )}
              {m.text}
            </div>
          </div>
        );
      }
      if (m.kind === "answer") {
        return (
          <AnswerView key={m.id} m={m} project={project} embedded={embedded} isLast={m.id === lastAnswerId && !busy} streaming={m.id === streamId} onTick={toBottom} onStreamDone={endStream}
            onChip={(kind, text) => fillDraft(text, kind)} onDeep={() => setTray("lens")} onRole={() => setRoleSheet(true)} onTasks={() => setCheckKey("")} onPlan={openPlan}
            onAskMe={async () => {
              setBusy(true);
              await askMe(project.id);
              setBusy(false);
            }}
          />
        );
      }
      if (m.kind === "rq") {
        const rq = rqs.find((r) => r.id === m.rqId);
        return rq ? <RQCard key={m.id} rq={rq} inChat /> : null;
      }
      if (m.kind === "deepPick") return null; // 예전 기록에 남은 고르기 카드는 그리지 않는다 (중복 방지)
      if (m.kind === "deepQ") {
        return (
          <div key={m.id} className="rise rounded-2xl border border-[#7a2f8f] bg-rose-soft p-4">
            <div className="mb-2 flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={`h-1 flex-1 rounded-full ${i <= m.level ? "bg-[#ff5fb0]" : "bg-card"}`} />
              ))}
            </div>
            <div className="flex items-start gap-3">
              <TelescopeArt size={36} />
              <div className="min-w-0 flex-1"><Markdown>{m.md}</Markdown></div>
            </div>
          </div>
        );
      }
      return (
        <div key={m.id} className="rise">
          <CoachBubble>
            <Markdown>{m.md}</Markdown>
          </CoachBubble>
          {m.actions && (
            <div className="coach-extra mt-2.5 flex flex-wrap gap-2">
              {m.actions.map((a) => (
                <button key={a.action} type="button" disabled={m.id !== lastId || busy} onClick={() => onAction(a.action)} className="rounded-full border border-line bg-card px-3.5 py-1.5 text-[13px] font-bold disabled:opacity-40">
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      );
  };

  // 질문+답을 한 장의 턴 카드로 묶는다. 나머지(코치 한마디 · 되묻기 · 심화)는 낱장으로 남는다.
  type UserMsg = Extract<Message, { kind: "user" }>;
  type AnswerMsg = Extract<Message, { kind: "answer" }>;
  type Block =
    | { key: string; kind: "turn"; q: UserMsg; a: AnswerMsg | null; n: number }
    | { key: string; kind: "single"; m: Message }
    | { key: string; kind: "report"; r: WindowReport };
  const turnNo = new Map(turns.filter((t) => t.projectId === project.id).map((t, i) => [t.id, i + 1]));
  const blocks: Block[] = [];
  for (let i = 0; i < visible.length; i++) {
    const m = visible[i];
    const next = visible[i + 1];
    if (m.kind === "user" && !m.deep && next?.kind === "answer") {
      blocks.push({ key: m.id, kind: "turn", q: m, a: next, n: turnNo.get(next.turnId) ?? blocks.filter((x) => x.kind === "turn").length + 1 });
      i++;
    } else if (m.kind === "user" && !m.deep && !next && busy) {
      blocks.push({ key: m.id, kind: "turn", q: m, a: null, n: turnNo.size + 1 }); // 답을 기다리는 질문
    } else blocks.push({ key: m.id, kind: "single", m });
  }
  // 리포트도 대화의 한 턴이다 — 도착한 시각의 자리에 핵심만 담은 카드로 끼운다
  const firstAt = visible[0]?.createdAt ?? Infinity;
  const atOf = (b: Block) => (b.kind === "turn" ? (b.a ?? b.q).createdAt : b.kind === "single" ? b.m.createdAt : b.r.createdAt);
  for (const r of reports) {
    if (r.createdAt < firstAt || (r.projectId ? r.projectId !== project.id : !r.projects.includes(project.name))) continue;
    let at = blocks.length;
    while (at > 0 && atOf(blocks[at - 1]) > r.createdAt) at--;
    blocks.splice(at, 0, { key: `report${r.index}`, kind: "report", r });
  }
  const turnBlocks = blocks.filter((x) => x.kind === "turn");
  const lastTurnKey = turnBlocks[turnBlocks.length - 1]?.key;
  const pendingTurn = turnBlocks.some((x) => x.kind === "turn" && x.a === null);
  const isOpen = (key: string) => openTurns[key] ?? (isExample || key === lastTurnKey); // 예시는 전부 펼친 채로 — 누를 것 없이 읽는다
  const allOpen = turnBlocks.length > 0 && turnBlocks.every((x) => isOpen(x.key));
  const setAll = (v: boolean) => setOpenTurns(Object.fromEntries(turnBlocks.map((x) => [x.key, v])));
  const shown = blocks.filter((x) => (filter === "all" ? true : filter === "q" ? x.kind === "turn" : x.kind === "single" && x.m.kind === "rq"));
  const openReportDoc = (r: WindowReport) => {
    update("reports", (prev) => prev.map((x) => (x.index === r.index ? { ...x, opened: true } : x)));
    openMd({ title: `📄 ${reportTitle(r, reports)}`, md: reportToMd(r, reports, profile?.name ?? "나"), filename: `report-${seqOf(r, reports)}.md` });
  };
  const ordered = sortNew ? [...shown].reverse() : shown;

  return (
    <>
      {/* 헤더는 한 줄 — 형식 체크 칸은 🧩 버튼 안에 접혀 있고, 리포트 진행은 아래 가장자리의 얇은 선이다 */}
      <header className="relative border-b border-line bg-paper">
        <div className="flex items-center gap-1 px-1.5 py-2 min-[400px]:gap-1.5 min-[400px]:px-2">
          <button type="button" aria-label="메뉴" onClick={openDrawer} className="menu-btn grid h-9 w-9 shrink-0 place-items-center rounded-full text-lg active:bg-sand">
            ☰
          </button>
          <h1 className="min-w-[72px] flex-1 truncate px-1 text-[15px] font-bold" title={project.desc || undefined}>
            {project.emoji} {project.name}
            {state.demoProjectId === project.id && <span className="ml-1.5 rounded-full border border-dashed border-current px-1.5 py-px text-[10px] font-bold text-sub">예시</span>}
            {project.answerOnly && <span className="ml-1.5 text-[11px] font-semibold text-sub">⚡ 답만</span>}
            {live && <span className="ml-1.5 text-[11px] font-semibold text-mint">● Claude</span>}
          </h1>
          {format && (
            <button type="button" onClick={() => setChecksOpen((v) => !v)} aria-expanded={checksOpen} title="초안 체크 칸" className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs font-bold ${checksOpen ? "border-clay bg-clay-soft" : "border-line bg-card"}`}>
              <span style={{ color: format.color }}>{format.emoji} {progress.done}/{progress.total}</span>
              <span className="text-sub">{checksOpen ? "▴" : "▾"}</span>
            </button>
          )}
          {project.plan && (
            <button type="button" onClick={openPlan} title={project.plan.filename} className="shrink-0 rounded-full border border-mint bg-mint-soft px-2.5 py-1.5 text-xs font-bold text-mint">
              📝<span className="max-[400px]:hidden"> 기획서</span>
            </button>
          )}
          {turnBlocks.length >= 2 && (
            <button type="button" aria-label="보기 도구" title="보기 도구 — 필터 · 모두 접기 · 정렬" aria-expanded={toolsOpen} onClick={() => { if (toolsOpen) { setFilter("all"); setSortNew(false); } setToolsOpen((v) => !v); }} className={`shrink-0 rounded-full border px-2.5 py-1.5 text-xs font-bold ${toolsOpen || filter !== "all" || sortNew ? "border-clay bg-clay-soft text-clay" : "border-line bg-card"}`}>
              ☷
            </button>
          )}
          <button type="button" aria-label=".md로 내보내기" title=".md로 내보내기" onClick={() => openMd({ title: `${project.name} — 전체 기록`, md: projectMd(project, true), filename: exportFilename(project, true) })} className="shrink-0 rounded-full border border-line bg-card px-2.5 py-1.5 text-xs font-bold max-[400px]:hidden">
            ⬇️
          </button>
          <button type="button" onClick={() => go({ name: "reports" })} title={`다음 리포트까지 ${windowCount}/10`} className="flex shrink-0 items-center gap-1 rounded-full border border-[#8a6a1f] bg-amber-soft py-1 pl-1.5 pr-3 text-xs font-bold text-gold">
            <Buddy level={level} size={24} />
            <span><span className="max-[400px]:hidden">Lv.</span>{level}</span>
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-sand" aria-label={`다음 리포트까지 ${windowCount}/10`}>
          <div className="xp h-full transition-all" style={{ width: `${windowCount * 10}%` }} />
        </div>
        {/* 초안 체크 칸 — 빈칸을 누르면 그 칸을 채울 질문이 입력창에 들어온다 */}
        {format && checksOpen && (
          <div className="fade border-t border-line px-3 pb-3 pt-2.5">
            <p className="mb-2 text-[11px] leading-relaxed text-sub">
              <b className="text-ink">📐 {formats.principle.title}</b> — {formats.principle.axes.map((a) => `${a.emoji} ${a.name}: ${format.design[a.key as "plan" | "algo" | "arch"].split(" — ")[0]}`).join("  ·  ")}
            </p>
            <p className="mb-2 text-[11px] text-sub">⬜ 빈칸을 누르면 그 칸을 채울 질문이 입력창에 들어와. ✅ 채운 칸은 눌러서 볼 수 있어.</p>
            <div className="flex flex-wrap gap-1.5">
              {format.checks.map((c) => {
                const filled = Boolean(project.checks?.[c.key]);
                return (
                  <button key={c.key} type="button" title={c.done} onClick={() => { setChecksOpen(false); if (filled) setCheckKey(c.key); else fillDraft(c.ask, null); }} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold ${filled ? "border-mint bg-mint-soft text-mint" : c.key === progress.next?.key ? "border-clay text-clay" : "border-line text-sub"}`}>
                    {filled ? "✅" : "⬜"} {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {turnBlocks.length >= 2 && (toolsOpen || filter !== "all" || sortNew) && (
        <div className="viewbar fade">
          <div className="seg" role="tablist" aria-label="보기">
            {([["all", "전체"], ["q", "질문만"], ["rq", "🧭 되묻기"]] as const).map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={filter === k} onClick={() => setFilter(k)} className={filter === k ? "on" : ""}>{label}</button>
            ))}
          </div>
          <button type="button" onClick={() => setAll(!allOpen)} className="tool">{allOpen ? "▴ 모두 접기" : "▾ 모두 펼치기"}</button>
          <button type="button" onClick={() => setSortNew((v) => !v)} className="tool">{sortNew ? "↑ 최신순" : "↓ 시간순"}</button>
        </div>
      )}

      {unread && (
        <button
          type="button"
          onClick={() => {
            openReportDoc(unread);
          }}
          className="report-pill ob-point rise mx-4 mt-2 rounded-full bg-ink px-4 py-1.5 text-[13px] font-bold text-paper"
        >
          <ReportArt size={26} />
          <span>🎉 {reportTitle(unread, reports)} 도착 — 보고 싶을 때 열어봐</span>
          <span className="float"><Rocket size={20} /></span>
        </button>
      )}

      <div ref={scroller} className="scroll flex-1 px-2.5 py-4 min-[400px]:px-5 min-[400px]:py-5">
        <div className="mx-auto max-w-[860px] space-y-6">
        {ordered.map((x) => {
          if (x.kind === "single") {
            // 예시의 첫 인사 — 글 대신 확장 사다리를 지도로 보여준다
            if (example && x.m.id === messages[0]?.id && x.m.kind === "coach") {
              return (
                <div key={x.key} className="rise">
                  <CoachBubble>
                    <JourneyMap stages={example.stages} caption="작게 시작해서, 질문으로 한 단씩 키워" />
                    <Markdown>{x.m.md.split("\n").filter((l) => !l.includes("작게 시작해서 한 단씩 키워")).join("\n")}</Markdown>{/* 예전에 불러 둔 예시에는 글 사다리가 남아 있다 */}
                  </CoachBubble>
                </div>
              );
            }
            return renderMessage(x.m);
          }
          if (x.kind === "report") {
            const r = x.r;
            return <ReportCard key={x.key} r={r} onDoc={() => openReportDoc(r)} onDetail={() => { update("reports", (prev) => prev.map((y) => (y.index === r.index ? { ...y, opened: true } : y))); openReport(r.index); }} />;
          }
          const open = filter === "q" ? (openTurns[x.key] ?? false) : isOpen(x.key) || x.a?.id === streamId;
          const role = x.a?.role;
          return (
            <TurnCard key={x.key} n={x.n} q={x.q} open={open} onToggle={() => setOpenTurns((o) => ({ ...o, [x.key]: !open }))}
              tag={role ? <span className="turn-role" title={roles.roles[role].name}>{roles.roles[role].emoji}</span> : undefined}
              onZoom={x.a ? () => openMd({ title: `Q${x.n} 크게 보기`, md: `**🙋 내 질문**\n\n${x.q.text}\n\n---\n\n${x.a!.md}`, filename: `qa-${x.a!.turnId}.md` }) : undefined}
            >
              {x.a ? renderMessage(x.a, true) : (
                <div className="flex items-center gap-1.5 py-1">
                  <CoachAvatar size={28} />
                  <span className="dot" /><span className="dot" /><span className="dot" />
                  <span className="ml-1 text-xs text-sub">{live ? "🛰 최선의 답을 만드는 중" : "💭 생각하는 중"}</span>
                </div>
              )}
            </TurnCard>
          );
        })}
        {filter !== "all" && ordered.length === 0 && <p className="py-10 text-center text-sm text-sub">{filter === "rq" ? "아직 되묻기가 없어." : "아직 질문이 없어."}</p>}

        {messages.length <= 1 && !busy && project.format === "product" && (
          <div className="rise space-y-2 pt-2">
            <button type="button" onClick={() => go({ name: "idea" })} className="chunk-card mb-3 flex w-full items-center gap-3 rounded-3xl p-4 text-left">
              <span className="text-3xl">💡</span>
              <span>
                <b className="block text-[15px]">아이디어 티키타카 구경하기</b>
                <span className="text-xs text-sub">한 줄 아이디어가 7번 만에 유저 시나리오가 되는 과정</span>
              </span>
            </button>
            <p className="text-xs font-bold text-sub">이렇게 물어볼 수 있어 — 눌러서 고쳐 보내봐</p>
            {SAMPLES.map((s) => (
              <button key={s.tag} type="button" onClick={() => fillDraft(s.text, null)} className="block w-full rounded-2xl border border-line bg-card p-3 text-left text-[13px] leading-relaxed active:bg-sand">
                <b className="mr-1.5 text-clay">{s.tag}</b>
                {s.text}
              </button>
            ))}
          </div>
        )}

        {!format && !busy && !streamId && <FormatPicker project={project} />}

        {busy && !streamId && !pendingTurn && (
          <div className="coach-row items-center">
            <CoachAvatar size={34} />
            <div className="flex items-center gap-1.5 rounded-3xl bg-card px-4 py-3.5">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
              <span className="ml-1 text-xs text-sub">{live ? "🛰 최선의 답을 만드는 중" : "💭 생각하는 중"}</span>
            </div>
          </div>
        )}
        </div>
      </div>

      <div className="hud border-t border-line px-2 min-[400px]:px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2">
        {deep?.awaiting && (
          <div className="mb-2 flex items-center justify-between rounded-xl bg-rose-soft px-3 py-1.5 text-xs font-bold">
            <span>
              🔭 심화 중 · {lenses[deep.lens].name} {deep.level >= 3 ? "확장" : `L${deep.level + 1}`} — 리듬에 들어가지 않아
            </span>
            <button type="button" onClick={() => onAction("deep:stop")} className="text-sub">
              나가기
            </button>
          </div>
        )}
        {!deep?.awaiting && tray === "lens" && (
          <div className="genie mb-2 rounded-2xl border border-[#7a2f8f] bg-rose-soft p-2" aria-label="심화 렌즈 고르기">
            <div className="flex items-center justify-between px-1.5 pb-1.5 text-[11px] font-bold text-[#ff9bd8]">
              <span>🔭 심화 — 렌즈를 누르면 질문이 나와</span>
              <button type="button" aria-label="닫기" onClick={() => setTray(null)} className="px-1 text-sub">✕</button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(lenses) as LensKey[]).map((k) => (
                <button key={k} type="button" disabled={busy} onClick={() => pickLens(k)} title={lenses[k].tagline} className="chunk-card rounded-xl px-2 py-2 text-center disabled:opacity-40">
                  <span className="block text-xl">{lenses[k].emoji}</span>
                  <b className="block text-xs">{lenses[k].name}</b>
                  <span className="mt-0.5 block text-[10px] leading-tight text-sub">{lenses[k].tagline}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {!deep?.awaiting && group && (
          <div className={`genie mb-2 rounded-2xl border p-2 ${GROUP[group].box}`} aria-label={`${GROUP[group].name} 질문 고르기`}>
            <div className={`flex items-center justify-between px-1.5 pb-1.5 text-[11px] font-bold ${GROUP[group].text}`}>
              <button type="button" onClick={() => setTray("quick")} className="text-left">‹ {GROUP[group].emoji} {GROUP[group].name} — {GROUP[group].tip}</button>
              <button type="button" aria-label="닫기" onClick={() => setTray(null)} className="px-1 text-sub">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 min-[520px]:grid-cols-3">
              {groupItems[group].map((q) => (
                <button key={q.label} type="button" disabled={busy} title={q.draft} onClick={() => { setTray(null); fillDraft(q.draft.replaceAll("{goal}", project.desc || "___"), ("chip" in q ? (q.chip as ChipKind) : null)); }} className="chunk-card rounded-xl px-2 py-2 text-center disabled:opacity-40">
                  <span className="block text-xl">{q.emoji}</span>
                  <b className="block text-xs">{q.label}</b>
                </button>
              ))}
              {group === "refine" && lastAnswerId && (
                <button type="button" disabled={busy} onClick={async () => { setTray(null); setBusy(true); await askMe(project.id); setBusy(false); }} className="chunk-card rounded-xl px-2 py-2 text-center disabled:opacity-40">
                  <span className="block text-xl">🙋</span>
                  <b className="block text-xs">나한테 물어봐</b>
                </button>
              )}
            </div>
          </div>
        )}
        {!deep?.awaiting && quickOpen && (
          <div className="quickbar genie -mx-3 mb-2 flex gap-1.5 overflow-x-auto px-3" aria-label="질문 바로 만들기">
            <button type="button" onClick={() => setTray("lens")} className="shrink-0 whitespace-nowrap rounded-full border border-[#7a2f8f] bg-rose-soft px-3 py-1.5 text-[13px] font-bold text-[#ff9bd8]">🔭 심화</button>
            {progress.next && (
              <button type="button" disabled={busy} onClick={() => fillDraft(progress.next!.ask, null)} className="shrink-0 whitespace-nowrap rounded-full border border-clay bg-clay-soft px-3 py-1.5 text-[13px] font-bold text-clay disabled:opacity-40">
                ⬜ {progress.next.label} 묻기
              </button>
            )}
            {(Object.keys(GROUP) as GroupKey[]).filter((g) => groupItems[g].length > 0).map((g) => (
              <button key={g} type="button" onClick={() => setTray(g)} className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] font-bold ${GROUP[g].box} ${GROUP[g].text}`}>
                {g === "format" && format ? format.emoji : GROUP[g].emoji} {GROUP[g].name}
              </button>
            ))}
            {format && (
              <button type="button" onClick={async () => { if (await confirm({ emoji: "🔁", title: "형식을 바꿀까?", body: "적어 둔 초안 칸이 비워져.", ok: "바꾸기" })) update("projects", (prev) => prev.map((p) => (p.id === project.id ? { ...p, format: undefined, checks: {} } : p))); }} className="shrink-0 whitespace-nowrap rounded-full border border-line px-3 py-1.5 text-[13px] text-sub">
                🔁 형식 바꾸기
              </button>
            )}
          </div>
        )}
        {images.length > 0 && (
          <div className="mb-2 rounded-2xl bg-card p-2.5">
            <ImageStrip images={images} onRemove={(i) => setImages((prev) => prev.filter((_, k) => k !== i))} />
          </div>
        )}
        <div className="flex items-end gap-1.5 min-[400px]:gap-2">
          {!deep?.awaiting && <AttachMenu room={MAX_IMAGES - images.length} onImages={addImages} disabled={busy} />}
          {!deep?.awaiting && (
            <button type="button" aria-label="질문 바로 만들기" aria-expanded={tray !== null} onClick={() => setTray((t) => (t ? null : "quick"))} className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-lg ${tray ? "chunk" : "chunk-ghost"}`}>
              💡
            </button>
          )}
        <div className="flex min-w-0 flex-1 items-end gap-2 rounded-3xl border-2 border-line bg-card py-1 pl-3.5 pr-1.5 focus-within:border-clay">
          <div className="flex gap-1 pb-3" title="다음 역질문까지 남은 질문">
            {Array.from({ length: project.rhythm }).map((_, i) => (
              <span key={i} className={`h-2 w-2 rounded-full ${i < project.counter ? "bg-clay" : "border border-[#5d57a0]"}`} />
            ))}
          </div>
          <textarea
            ref={input}
            value={draft}
            rows={1}
            placeholder={deep?.awaiting ? "💭 네 생각을 적어줘. 정답은 없어." : "✨ 무엇이든 물어봐"}
            onChange={(e) => {
              setDraft(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
            }}
            onPaste={async (e) => {
              const files = [...e.clipboardData.files];
              if (!files.some((f) => f.type.startsWith("image/"))) return;
              e.preventDefault();
              addImages(await filesToImages(files, MAX_IMAGES - images.length));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia("(pointer: fine)").matches) {
                e.preventDefault();
                void send();
              }
            }}
            className="max-h-[140px] flex-1 resize-none bg-transparent py-2 text-[15px] leading-relaxed outline-none placeholder:text-[#7f79b8]"
          />
          {voice.supported && (
            <button type="button" aria-label={voice.listening ? "듣기 멈추기" : "말로 묻기"} aria-pressed={voice.listening} onClick={voice.toggle} className={`mb-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-base ${voice.listening ? "mic-on" : "text-sub"}`}>
              🎙
            </button>
          )}
        </div>
          <button type="button" aria-label="보내기" onClick={() => void send()} disabled={(!draft.trim() && images.length === 0) || busy} className="chunk grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-lg font-black disabled:border-b-[#1d2648] disabled:bg-sand disabled:text-[#5d6899]">
            ↑
          </button>
        </div>
        {voice.listening && <p className="px-2 pt-1.5 text-[11px] font-bold text-[#ff8a8f]">● 듣는 중 — 말하면 입력창에 적혀. 다시 누르면 멈춰.</p>}
        {draft.includes("___") && <p className="px-2 pt-1.5 text-[11px] text-sub">{chip ? `${CHIP_LABEL[chip]} 초안이야. ` : ""}___ 빈칸을 네 말로 채워서 보내봐.</p>}
      </div>

      {evolved && (
        <div className="scrim fade absolute inset-0 z-40 grid place-items-center px-8" onClick={() => setSeenLv(level)}>
          <div className="panel w-full rounded-3xl px-6 py-8 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="ob-pop bg-gradient-to-r from-[#5c9dff] via-[#c08bff] to-[#ff5fb0] bg-clip-text text-4xl font-black tracking-tight text-transparent">LEVEL UP!</p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <div className="opacity-50">
                <Buddy level={seenLv} size={56} />
              </div>
              <span className="text-xl text-gold">➜</span>
              <div className="relative">
                <span className="ob-flash pointer-events-none absolute inset-0 rounded-full border-2 border-[#ffd98a]" style={{ animationDelay: "0.5s" }} />
                <div className="ob-pop" style={{ animationDelay: "0.5s" }}>
                  <Buddy level={level} size={112} />
                </div>
              </div>
            </div>
            <p className="mt-5 text-lg font-extrabold">
              <span className="text-gold">Lv.{level}</span> {buddyName(level)}
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-sub">질문 10개로 리포트 한 장 완성! 네가 자란 만큼 별이도 자랐어.</p>
            <div className="mt-6 space-y-2.5">
              {unread && (
                <button
                  type="button"
                  className="w-full rounded-2xl bg-ink py-3 text-sm font-bold text-paper"
                  onClick={() => {
                    setSeenLv(level);
                    update("reports", (prev) => prev.map((r) => (r.index === unread.index ? { ...r, opened: true } : r)));
                    openReport(unread.index);
                  }}
                >
                  📄 리포트 보러 가기
                </button>
              )}
              <button type="button" className="w-full py-2 text-sm font-semibold text-sub" onClick={() => setSeenLv(level)}>
                계속 물어볼래
              </button>
            </div>
          </div>
        </div>
      )}

      {checkKey !== null && <CheckSheet project={project} initialKey={checkKey || undefined} onClose={() => setCheckKey(null)} />}

      {roleSheet && (
        <Sheet title="네 질문이 나를 앉힌 자리" onClose={() => setRoleSheet(false)}>
          <p className="mb-3 text-[13px] leading-relaxed text-sub">배지는 평가가 아니라 <b className="text-ink">거울</b>이야. 질문의 폭이 AI의 역할을 정해.</p>
          <div className="space-y-2">
            {(Object.keys(roles.openness) as (keyof typeof roles.openness)[]).map((k) => {
              const o = roles.openness[k];
              const r = roles.roles[o.role as keyof typeof roles.roles];
              return (
                <div key={k} className="flex gap-3 rounded-xl border border-line bg-card p-3">
                  <RolePlanet role={o.role} size={40} />
                  <div className="text-[13px] leading-relaxed">
                    <b>{o.short} → {r.name}</b>
                    <p className="text-sub">{o.shape}</p>
                    <p>얻는 것 <b>{o.gain}</b> · 잃는 것 <b>{o.lose}</b></p>
                  </div>
                </div>
              );
            })}
          </div>
        </Sheet>
      )}
    </>
  );
}
