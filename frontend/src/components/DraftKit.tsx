"use client";

// 아이템 초안 도구 — 전부 채팅 화면 안에서 쓴다: 형식 고르기 카드 · 초안 칸 적기 시트 · .md 내보내기
import { useState } from "react";
import data from "@/data/formats.json";
import { pushMessage } from "@/lib/actions";
import { FORMAT_KEYS, draftProgress, exportFilename, formatIntro, formatOf, projectMd, setCheck, setFormat } from "@/lib/draft";
import type { FormatKey, Project } from "@/lib/types";
import { useApp } from "./AppContext";
import { Sheet } from "./ui";

export function ExportButtons({ project }: { project: Project }) {
  const { openMd } = useApp();
  const open = (full: boolean) => openMd({ title: `${project.name} — ${full ? "전체 기록" : "기초 초안"}`, md: projectMd(project, full), filename: exportFilename(project, full) });
  const btn = "flex-1 rounded-xl border border-line bg-card py-2.5 text-[13px] font-bold active:bg-sand";
  return (
    <div className="flex gap-2">
      <button type="button" onClick={() => open(false)} className={btn}>⬇️ 초안만 .md</button>
      <button type="button" onClick={() => open(true)} className={btn}>⬇️ 전체 기록 .md</button>
    </div>
  );
}

export function pickFormat(project: Project, key: FormatKey) {
  setFormat(project.id, key);
  pushMessage({ projectId: project.id, kind: "coach", md: `좋아, ${formatIntro(key)}` });
}

// 채팅 안에 뜨는 형식 고르기 카드
export function FormatPicker({ project }: { project: Project }) {
  return (
    <div className="rise rounded-2xl border border-clay bg-card p-4">
      <p className="text-sm font-bold">무엇으로 만들 거야? — 하나를 골라줘</p>
      <p className="mt-1 text-xs leading-relaxed text-sub">고른 형식에 따라 <b className="text-ink">질문 버튼</b> · <b className="text-ink">체크할 칸</b> · <b className="text-ink">코치가 되묻는 것</b>이 달라져. 어느 형식이든 <b className="text-ink">{data.principle.title}</b> — {data.principle.axes.map((a) => a.name).join(" · ")}를 네가 정해. 나중에 바꿀 수 있어.</p>
      <div className="mt-3 space-y-2">
        {FORMAT_KEYS.map((k) => {
          const f = data.formats[k];
          return (
            <button key={k} type="button" onClick={() => pickFormat(project, k)} className="flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left active:opacity-80" style={{ borderColor: `${f.color}66`, background: `${f.color}14` }}>
              <span className="text-2xl">{f.emoji}</span>
              <span className="min-w-0">
                <b className="block text-sm" style={{ color: f.color }}>{f.name}</b>
                <span className="block text-xs text-sub">{f.draft}</span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-sub">🔀 {f.design.algo}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// 답을 보고 네가 정한 것을 초안 칸에 한 줄로 적는다
export function CheckSheet({ project, initialKey, onClose }: { project: Project; initialKey?: string; onClose: () => void }) {
  const f = formatOf(project);
  const [key, setKey] = useState(initialKey ?? draftProgress(project).next?.key ?? f?.checks[0].key ?? "");
  const [text, setText] = useState(project.checks?.[key] ?? "");
  if (!f) return null;
  const check = f.checks.find((c) => c.key === key) ?? f.checks[0];
  return (
    <Sheet title="✅ 초안에 적기" onClose={onClose}>
      <p className="mb-2 text-xs font-bold text-sub">어느 칸을 정했어?</p>
      <div className="mb-3 grid grid-cols-2 gap-1.5">
        {f.checks.map((c) => (
          <button key={c.key} type="button" onClick={() => { setKey(c.key); setText(project.checks?.[c.key] ?? ""); }} className={`rounded-xl border px-2.5 py-2 text-left text-[13px] font-bold ${c.key === key ? "border-clay bg-clay-soft text-clay" : "border-line bg-card"}`}>
            {project.checks?.[c.key] ? "✅" : "⬜"} {c.label}
          </button>
        ))}
      </div>
      <p className="mb-1.5 text-xs text-sub">기준: {check.done}</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={300} placeholder="코치의 답을 옮기지 말고, 네가 정한 걸 네 말로 한두 줄." className="w-full resize-none rounded-xl border border-line bg-card px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-clay" />
      <button
        type="button"
        disabled={!text.trim()}
        onClick={() => {
          setCheck(project.id, check.key, text);
          const after = { ...project, checks: { ...project.checks, [check.key]: text.trim() } };
          const p = draftProgress(after);
          pushMessage({
            projectId: project.id,
            kind: "coach",
            md: `✅ **${check.label}** 칸을 네 말로 채웠어 (${p.done}/${p.total}).\n\n> ${text.trim().replace(/\n/g, "\n> ")}\n\n${p.next ? `다음 칸은 **${p.next.label}**이야. 입력창 위 버튼으로 바로 물어볼 수 있어.` : `초안 ${p.total}칸이 다 찼어! 🎉 위쪽 **⬇️ .md** 버튼으로 한 장짜리 초안을 내보낼 수 있어.`}`,
          });
          onClose();
        }}
        className="mt-3 w-full rounded-2xl bg-clay py-3.5 text-[15px] font-bold text-void disabled:opacity-30"
      >
        이 칸에 적기
      </button>
    </Sheet>
  );
}
