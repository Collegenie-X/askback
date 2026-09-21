"use client";

import { useState } from "react";
import formats from "@/data/formats.json";
import onboarding from "@/data/onboarding.json";
import roles from "@/data/roles.json";
import { createProject, patchProject } from "@/lib/actions";
import { FORMAT_KEYS } from "@/lib/draft";
import type { FormatKey, PackKey, Project } from "@/lib/types";
import { Sheet } from "./ui";

export function PackPicker({ value, onChange }: { value: PackKey[]; onChange: (v: PackKey[]) => void }) {
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-line bg-sand px-3 py-2.5 text-[13px]">
        <b>☑ 기본</b> <span className="text-sub">흐름 · 핵심 · 이유 · 대안 · 실패 · 기준 · 검증 · 개선 (항상 켜짐)</span>
      </div>
      {(Object.keys(roles.packs) as PackKey[]).map((k) => {
        const on = value.includes(k);
        return (
          <button key={k} type="button" onClick={() => onChange(on ? value.filter((x) => x !== k) : [...value, k])} className={`block w-full rounded-xl border px-3 py-2.5 text-left text-[13px] ${on ? "border-clay bg-clay-soft" : "border-line bg-card"}`}>
            <b>{on ? "☑" : "☐"} {roles.packs[k].emoji} {roles.packs[k].name}</b>
            <span className="ml-1.5 text-sub">{roles.packs[k].desc}</span>
          </button>
        );
      })}
    </div>
  );
}

// 형식 하나를 펼쳐 보여준다 — 무엇을 설계하는지, 무엇을 미루는지, 코치가 어떻게 되묻는지
function FormatDetail({ k }: { k: FormatKey }) {
  const f = formats.formats[k];
  return (
    <div className="fade mt-2 space-y-2.5 rounded-xl border p-3 text-[13px] leading-relaxed" style={{ borderColor: `${f.color}66`, background: `${f.color}0f` }}>
      <p><b style={{ color: f.color }}>만드는 것</b> <span className="text-sub">— {f.draft}</span></p>
      <div>
        <p className="mb-1 font-bold">네가 설계할 것</p>
        <ul className="space-y-1">
          {formats.principle.axes.map((a) => (
            <li key={a.key} className="flex gap-1.5">
              <span className="shrink-0">{a.emoji}</span>
              <span><b>{a.name}</b> <span className="text-sub">{f.design[a.key as "plan" | "algo" | "arch"]}</span></span>
            </li>
          ))}
        </ul>
      </div>
      <p><b>나중으로 미루는 것</b> <span className="text-sub">— {f.design.later}</span></p>
      <div>
        <p className="mb-1 font-bold">채울 칸 {f.checks.length}개</p>
        <p className="text-sub">{f.checks.map((c, i) => `${i + 1}. ${c.label}`).join("  ·  ")}</p>
      </div>
      <div>
        <p className="mb-1 font-bold">코치는 이런 걸 되물어</p>
        <ul className="space-y-0.5 text-sub">
          {f.rq.map((r) => (
            <li key={r.id}>🧭 {r.f3.q.split("?")[0]}?</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function ProjectSheet({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [emoji, setEmoji] = useState<string | null>(null); // null = 형식의 이모지를 따라간다
  const [format, setFormat] = useState<FormatKey | null>(null);
  const input = "w-full rounded-xl border border-line bg-card px-3.5 py-3 text-[15px] outline-none focus:border-clay";
  const P = formats.principle;

  return (
    <Sheet title="새 프로젝트" onClose={onClose}>
      <div className="mb-4 rounded-xl border border-line bg-sand p-3 text-[13px] leading-relaxed">
        <p className="font-bold">📐 {P.title}</p>
        <p className="mt-1 text-sub">{P.line}</p>
        <p className="mt-2.5 text-xs font-bold text-sub">{P.axesTitle}</p>
        <ul className="mt-1 space-y-0.5">
          {P.axes.map((a) => (
            <li key={a.key} className="flex gap-1.5">
              <span className="shrink-0">{a.emoji}</span>
              <span><b>{a.name}</b> <span className="text-sub">— {a.desc}</span></span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-4 rounded-xl border border-clay bg-clay-soft p-3 text-[13px] leading-relaxed">
        <p className="font-bold">🎁 {P.gainsTitle}</p>
        <p className="mt-1 text-sub">{P.gainsLine}</p>
        <ul className="mt-2 space-y-1">
          {P.gains.map((g) => (
            <li key={g.name} className="flex gap-1.5">
              <span className="shrink-0">{g.emoji}</span>
              <span><b>{g.name}</b> <span className="text-sub">— {g.desc}</span></span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mb-2 text-sm font-bold">① 무엇으로 만들 거야? <span className="font-normal text-sub">다섯 중 하나 — 질문 버튼 · 채울 칸 · 코치가 되묻는 것이 달라져</span></p>
      <div className="grid grid-cols-5 gap-1.5">
        {FORMAT_KEYS.map((k) => {
          const f = formats.formats[k];
          const on = format === k;
          return (
            <button key={k} type="button" aria-pressed={on} onClick={() => setFormat(k)} className="rounded-xl border px-1 py-2.5 text-center active:opacity-80" style={{ borderColor: on ? f.color : `${f.color}44`, background: on ? `${f.color}2e` : `${f.color}0f` }}>
              <span className="block text-xl">{f.emoji}</span>
              <b className="mt-0.5 block text-[12px] leading-tight" style={{ color: f.color }}>{f.name.replace(/ \(.*\)/, "")}</b>
            </button>
          );
        })}
      </div>
      {format ? <FormatDetail k={format} /> : <p className="mt-2 text-xs text-sub">하나를 누르면 그 형식에서 무엇을 설계하고 코치가 무엇을 되묻는지 보여줄게. 나중에 바꿀 수 있어.</p>}

      <p className="mb-2 mt-5 text-sm font-bold">② 이름과 한 줄 설명</p>
      <input className={input} placeholder="프로젝트 이름" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} />
      <input className={`${input} mt-2`} placeholder="한 줄 설명 (선택) — 누구의 무엇을 바꾸고 싶어?" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={40} />
      <div className="mt-2 flex gap-1.5">
        {onboarding.emojis.map((e) => (
          <button key={e} type="button" onClick={() => setEmoji(e)} className={`grid h-9 w-9 place-items-center rounded-xl text-lg ${emoji === e ? "bg-ink" : "bg-sand"}`}>
            {e}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={!name.trim() || !format}
        onClick={() => {
          if (!format) return;
          const f = formats.formats[format];
          createProject({ name: name.trim(), desc: desc.trim(), emoji: emoji ?? f.emoji, packs: f.defaultPacks as PackKey[], format });
          onCreated();
        }}
        className="mt-5 w-full rounded-2xl bg-ink py-3.5 text-[15px] font-bold text-paper disabled:opacity-30"
      >
        {format ? `${formats.formats[format].emoji} ${formats.formats[format].name} 초안 시작하기` : "형식을 먼저 골라줘"}
      </button>
    </Sheet>
  );
}

export function ProjectSettings({ project }: { project: Project }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-[13px] font-bold">되묻는 리듬</p>
        <div className="flex gap-2">
          {([2, 3, 4] as const).map((n) => (
            <button key={n} type="button" onClick={() => patchProject(project.id, { rhythm: n, counter: 0 })} className={`flex-1 rounded-xl border py-2.5 text-sm font-bold ${project.rhythm === n ? "border-ink bg-ink text-paper" : "border-line bg-card"}`}>
              {n}문 1역
            </button>
          ))}
        </div>
      </div>
      <button type="button" onClick={() => patchProject(project.id, { answerOnly: !project.answerOnly })} className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-left text-sm ${project.answerOnly ? "border-clay bg-clay-soft" : "border-line bg-card"}`}>
        <span>
          <b>⚡ 답만 모드</b>
          <span className="block text-xs text-sub">역질문을 전부 [나중에]로 넘겨. 급할 때 켜.</span>
        </span>
        <span className="text-lg">{project.answerOnly ? "🟢" : "⚪"}</span>
      </button>
      <div>
        <p className="mb-1 text-[13px] font-bold">더 돌아볼 주제 <span className="font-normal text-sub">(선택)</span></p>
        <p className="mb-2 text-xs leading-relaxed text-sub">형식에 맞춰 자동으로 켜 뒀어. 켠 주제는 10문에 두 번쯤 되물어. 설계를 묻는 되묻기는 형식에 따라 항상 들어가.</p>
        <PackPicker value={project.packs} onChange={(packs) => patchProject(project.id, { packs })} />
      </div>
    </div>
  );
}
