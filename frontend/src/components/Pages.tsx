"use client";

import { useEffect, useState, type ReactNode } from "react";
import lenses from "@/data/lenses.json";
import { clearAll, exportAll, update, useTable, write } from "@/lib/db";
import { fmtDate, windowCountOf } from "@/lib/report";
import { seedNotes, seedReports } from "@/lib/seed";
import { useApp } from "./AppContext";
import Buddy, { buddyName, levelOf } from "./Buddy";
import { ProjectSettings } from "./ProjectSheet";
import { ExportButtons } from "./DraftKit";
import { Empty, PageHeader } from "./ui";

export function NotesView() {
  const notes = useTable("notes");
  const projects = useTable("projects");
  return (
    <>
      <PageHeader title="📝 생각 노트" sub="심화 대화에서 나온 네 문장" back={{ name: "chat" }} />
      <div className="scroll flex-1 space-y-3 px-4 py-4">
        {notes.length === 0 && <Empty emoji="🔭">답 아래 [🔭 심화]를 열고 철학 · 심리학 · 사회학 렌즈로 이야기하면<br />네 문장이 여기에 모여.</Empty>}
        {[...notes].reverse().map((n) => (
          <div key={n.id} className="rounded-2xl border border-[#7a2f8f] bg-rose-soft p-4">
            <p className="text-[11px] font-bold text-[#ff9bd8]">
              {lenses[n.lens].emoji} {lenses[n.lens].name} · {n.level >= 3 ? "확장" : `L${n.level + 1}`} · {projects.find((p) => p.id === n.projectId)?.name ?? ""} · {fmtDate(n.createdAt)}
            </p>
            <p className="mt-1.5 text-[15px] font-semibold leading-relaxed">“{n.text}”</p>
          </div>
        ))}
      </div>
    </>
  );
}

interface Doc {
  file: string;
  emoji: string;
  title: string;
  desc: string;
}

export function Library() {
  const { openMd } = useApp();
  const [docs, setDocs] = useState<Doc[]>([]);
  useEffect(() => {
    fetch("/library/index.json").then((r) => r.json()).then(setDocs).catch(() => setDocs([]));
  }, []);
  return (
    <>
      <PageHeader title="📚 가이드" sub=".md 문서를 뷰어로 열어 — 이미지 · 표 · 순서도" back={{ name: "chat" }} />
      <div className="scroll flex-1 space-y-2.5 px-4 py-4">
        {docs.map((d) => (
          <button key={d.file} type="button" onClick={() => openMd({ title: d.title, src: `/library/${d.file}`, filename: d.file })} className="flex w-full items-center gap-3 rounded-2xl border border-line bg-card p-4 text-left active:bg-sand">
            <span className="text-2xl">{d.emoji}</span>
            <span className="min-w-0">
              <b className="block text-sm">{d.title}</b>
              <span className="block truncate text-xs text-sub">{d.desc}</span>
            </span>
            <span className="ml-auto text-sub">›</span>
          </button>
        ))}
      </div>
    </>
  );
}

// 설정의 한 묶음 — 게임 메뉴처럼 꼬리표 + 제목 + 한 줄 설명
function Group({ tag, title, sub, children }: { tag: string; title: string; sub?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="group-tag shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold">{tag}</span>
        <h3 className="min-w-0 truncate text-[14px] font-bold">{title}</h3>
      </div>
      {sub && <p className="-mt-1.5 mb-3 text-xs leading-relaxed text-sub">{sub}</p>}
      {children}
    </section>
  );
}

function Tile({ emoji, label, sub, onClick }: { emoji: string; label: string; sub: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="slot flex flex-col items-start rounded-2xl p-3 text-left [word-break:keep-all]">
      <span className="slot-icon grid h-9 w-9 place-items-center rounded-xl text-lg">{emoji}</span>
      <b className="mt-2 block text-[13px]">{label}</b>
      <span className="mt-0.5 block text-[11.5px] leading-snug text-sub">{sub}</span>
    </button>
  );
}

export function Settings({ onDemo }: { onDemo: () => void }) {
  const { go, confirm } = useApp();
  const profile = useTable("profile");
  const projects = useTable("projects");
  const state = useTable("state");
  const turns = useTable("turns");
  const rqs = useTable("rqs");
  const reports = useTable("reports");
  const notes = useTable("notes");
  const project = projects.find((p) => p.id === state.currentProjectId);
  const level = levelOf(reports.length);
  const windowCount = windowCountOf(project?.id, project?.name ?? "", turns, reports);

  // 🔗 지금 보는 화면의 주소를 그대로 복사한다 — 화면마다 주소가 다르니 링크가 곧 이 자리다
  const [copied, setCopied] = useState(false);
  const demo = !!state.demoProjectId && state.currentProjectId === state.demoProjectId;
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      return; // 클립보드를 막아 둔 브라우저 — 주소창의 주소를 그대로 쓰면 된다
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportAll()], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "askback-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const seed = async () => {
    if (reports.length && !(await confirm({ emoji: "📑", title: "리포트를 샘플 7장으로 바꿀까?", body: "지금 있는 리포트는 샘플로 덮어써져.", ok: "바꾸기" }))) return;
    const now = Date.now();
    write("reports", seedReports(now).map((r) => (project ? { ...r, projectId: project.id, projects: [project.name] } : r)));
    if (project) update("notes", (prev) => [...prev.filter((n) => n.id !== "note_seed"), ...seedNotes(now, project.id)]);
  };

  const stats = [
    { emoji: "💬", label: "질문", value: turns.length },
    { emoji: "🧭", label: "역질문", value: rqs.length },
    { emoji: "📊", label: "리포트", value: reports.length },
    { emoji: "🤔", label: "모르겠어", value: state.idkCount },
  ];

  return (
    <>
      <PageHeader title="⚙️ 설정" sub="네 질문 기록은 네 거야" back={{ name: "chat" }} />
      <div className="scroll flex-1 space-y-3 px-4 py-4">
        {/* 플레이어 카드 — 별이 · 레벨 · 지금까지 모은 것 */}
        <section className="rounded-2xl border-2 border-line bg-card p-4">
          <div className="flex items-center gap-3">
            <Buddy level={level} size={64} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[17px] font-extrabold">{profile?.name} <span className="text-xs font-normal text-sub">· {profile?.grade}</span></p>
              <p className="text-[13px] font-bold"><span className="text-gold">Lv.{level}</span> {buddyName(level)}</p>
              <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-sand"><span className="xp block h-full transition-all" style={{ width: `${windowCount * 10}%` }} /></span>
              <span className="mt-0.5 block text-[11px] text-sub">⭐ 다음 리포트까지 {windowCount}/10</span>
            </div>
          </div>
          {!!profile?.interests.length && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.interests.map((t) => <span key={t} className="rounded-full bg-sand px-2.5 py-1 text-[11.5px] font-semibold text-sub">#{t}</span>)}
            </div>
          )}
          <div className="mt-3 grid grid-cols-4 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl bg-sand px-1 py-2 text-center">
                <span className="block text-base">{s.emoji}</span>
                <b className="block text-[17px] leading-tight text-gold">{s.value}</b>
                <span className="block text-[10.5px] text-sub">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {project && (
          <Group tag="PLAY" title={`${project.emoji} ${project.name} — 플레이 방식`} sub="이 프로젝트에만 적용돼. 코치가 얼마나 자주, 무엇을 되물을지 정해.">
            <ProjectSettings project={project} />
          </Group>
        )}

        <Group tag="MAP" title="🗺 둘러보기">
          <div className="grid grid-cols-3 gap-2">
            <Tile emoji="📝" label="생각 노트" sub={notes.length ? `내 문장 ${notes.length}개` : "심화 대화의 문장"} onClick={() => go({ name: "notes" })} />
            <Tile emoji="📚" label="가이드" sub="쓰는 법 · 설계서" onClick={() => go({ name: "library" })} />
            <Tile emoji="🌌" label="우주 배경" sub="천체 켜고 끄기" onClick={() => go({ name: "space" })} />
          </div>
        </Group>

        <Group tag="LAB" title="🧪 연습장" sub="내 기록 없이도 AskBack이 어떻게 돌아가는지 볼 수 있어.">
          <div className="grid grid-cols-3 gap-2">
            <Tile emoji="💡" label="아이디어 티키타카" sub="주고받기 구경" onClick={() => go({ name: "idea" })} />
            <Tile emoji="📂" label="예시 프로젝트" sub="한꺼번에 보기" onClick={onDemo} />
            <Tile emoji="✨" label="소개 다시 보기" sub="처음 그 다섯 칸" onClick={() => go({ name: "onboarding" })} />
            <Tile emoji="📈" label="샘플 리포트" sub="7장 채우기" onClick={seed} />
          </div>
        </Group>

        <Group tag="LINK" title="🔗 링크로 공유하기" sub="화면마다 주소가 달라. 지금 보는 자리의 주소를 그대로 보내면 돼.">
          <button type="button" onClick={copyLink} className="slot flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left text-sm font-semibold">
            {copied ? "✅ 복사했어!" : "🔗 이 화면 링크 복사"}<span className="text-sub">›</span>
          </button>
          <p className="mt-2 text-[11px] text-sub">
            {demo
              ? "📂 예시 프로젝트 링크야 — 누구에게 보내도 그 사람 화면에서 똑같이 열려."
              : "⚠️ 내 기록은 이 기기에만 있어서, 내 프로젝트 링크는 다른 기기에서 열면 비어 있어. 남에게 보낼 땐 예시 프로젝트 링크나 ⬇️ 내보내기를 써."}
          </p>
        </Group>

        <Group tag="SAVE" title="💾 세이브 데이터" sub="모든 기록은 이 기기의 localStorage에만 있어. 가끔 내보내 둬.">
          <div className="space-y-2">
            {project && <ExportButtons project={project} />}
            <button type="button" onClick={download} className="slot flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left text-sm font-semibold">⬇️ 전체 내보내기 (.json)<span className="text-sub">›</span></button>
          </div>
          <div className="mt-4 border-t border-dashed border-line pt-3">
            <p className="mb-2 text-[11px] font-bold text-[#ff7a8a]">⚠️ 위험 구역</p>
            <button
              type="button"
              onClick={async () => {
                if (await confirm({ emoji: "🗑", title: "모든 기록을 지울까?", body: "프로젝트 · 대화 · 리포트가 전부 사라져. 되돌릴 수 없어.", ok: "전부 지우기", danger: true })) {
                  clearAll();
                  window.location.reload();
                }
              }}
              className="slot slot-danger flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left text-sm font-semibold"
            >
              🗑 전부 지우기 — 처음부터 다시<span>›</span>
            </button>
          </div>
        </Group>
        <p className="pb-6 text-center text-[11px] text-sub">AskBack · 설계서 v3 — 열고, 좁히고, 되묻는다</p>
      </div>
    </>
  );
}
