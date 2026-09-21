"use client";

import { useEffect, useState } from "react";
import lenses from "@/data/lenses.json";
import { clearAll, exportAll, update, useTable, write } from "@/lib/db";
import { fmtDate } from "@/lib/report";
import { seedNotes, seedReports } from "@/lib/seed";
import { useApp } from "./AppContext";
import { ProjectSettings } from "./ProjectSheet";
import { ExportButtons } from "./DraftKit";
import { Card, Empty, PageHeader } from "./ui";

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

export function Settings({ onDemo }: { onDemo: () => void }) {
  const { go } = useApp();
  const profile = useTable("profile");
  const projects = useTable("projects");
  const state = useTable("state");
  const turns = useTable("turns");
  const rqs = useTable("rqs");
  const reports = useTable("reports");
  const project = projects.find((p) => p.id === state.currentProjectId);

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportAll()], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "askback-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const seed = () => {
    if (reports.length && !window.confirm("지금 리포트를 샘플 7장으로 바꿀까?")) return;
    const now = Date.now();
    write("reports", seedReports(now).map((r) => (project ? { ...r, projectId: project.id, projects: [project.name] } : r)));
    if (project) update("notes", (prev) => [...prev.filter((n) => n.id !== "note_seed"), ...seedNotes(now, project.id)]);
  };

  const row = "flex w-full items-center justify-between rounded-xl border border-line bg-card px-3.5 py-3 text-left text-sm font-semibold active:bg-sand";
  return (
    <>
      <PageHeader title="⚙️ 설정" sub="네 질문 기록은 네 거야" back={{ name: "chat" }} />
      <div className="scroll flex-1 space-y-3 px-4 py-4">
        <Card title="나">
          <p className="text-[15px] font-bold">{profile?.name} <span className="text-sm font-normal text-sub">· {profile?.grade} · {profile?.interests.join(", ") || "관심사 없음"}</span></p>
          <p className="mt-1 text-xs text-sub">유효 질문 {turns.length}개 · 역질문 {rqs.length}개 · 리포트 {reports.length}장 · “잘 모르겠어” {state.idkCount}회</p>
        </Card>

        {project && (
          <Card title={`${project.emoji} ${project.name} — 프로젝트 설정`}>
            <ProjectSettings project={project} />
          </Card>
        )}

        <Card title="더 보기">
          <div className="space-y-2">
            <button type="button" onClick={() => go({ name: "notes" })} className={row}>📝 생각 노트<span className="text-sub">›</span></button>
            <button type="button" onClick={() => go({ name: "library" })} className={row}>📚 가이드<span className="text-sub">›</span></button>
            <button type="button" onClick={() => go({ name: "space" })} className={row}>🌌 우주 배경 꾸미기<span className="text-sub">›</span></button>
          </div>
        </Card>

        <Card title="시연 · 샘플">
          <div className="space-y-2">
            <button type="button" onClick={() => go({ name: "idea" })} className={row}>💡 아이디어 티키타카 구경하기<span className="text-sub">›</span></button>
            <button type="button" onClick={onDemo} className={row}>📂 예시 프로젝트 열기 (한꺼번에 보기)<span className="text-sub">›</span></button>
            <button type="button" onClick={seed} className={row}>📈 샘플 리포트 7장 채우기<span className="text-sub">›</span></button>
          </div>
        </Card>

        <Card title="내 데이터 (이 기기의 localStorage에만 있어)">
          <div className="space-y-2">
            {project && <ExportButtons project={project} />}
            <button type="button" onClick={download} className={row}>⬇️ 전체 내보내기 (.json)<span className="text-sub">›</span></button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("모든 기록을 지울까? 되돌릴 수 없어.")) {
                  clearAll();
                  window.location.reload();
                }
              }}
              className={`${row} text-[#ff7a8a]`}
            >
              🗑 전부 지우기<span>›</span>
            </button>
          </div>
        </Card>
        <p className="pb-6 text-center text-[11px] text-sub">AskBack · 설계서 v3 — 열고, 좁히고, 되묻는다</p>
      </div>
    </>
  );
}
