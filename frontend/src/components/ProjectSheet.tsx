"use client";

import { useState } from "react";
import formats from "@/data/formats.json";
import onboarding from "@/data/onboarding.json";
import roles from "@/data/roles.json";
import { createProject, patchProject } from "@/lib/actions";
import { FORMAT_KEYS } from "@/lib/draft";
import type { FormatKey, PackKey, Project } from "@/lib/types";
import { useTable } from "@/lib/db";
import { CompassArt, PlanArt, ReportArt } from "./Art";
import Buddy, { levelOf } from "./Buddy";
import { AskBackArt, BlocksArt, FlowArt, FormatArt, MeterArt, ProjectPlanet } from "./ProfileArt";
import { Sheet } from "./ui";

// 주제 팩 = 장착 슬롯. 기본 팩은 잠겨 있고, 나머지는 눌러서 끼웠다 뺐다 한다
export function PackPicker({ value, onChange }: { value: PackKey[]; onChange: (v: PackKey[]) => void }) {
  const keys = Object.keys(roles.packs) as PackKey[];
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 rounded-xl border border-line bg-sand px-3 py-2.5 text-[13px]">
        <span className="text-base">🔒</span>
        <span className="min-w-0 flex-1"><b>기본 팩</b> <span className="text-sub">흐름 · 핵심 · 이유 · 대안 · 실패 · 기준 · 검증 · 개선</span></span>
        <span className="shrink-0 rounded-full bg-mint-soft px-2 py-0.5 text-[10.5px] font-bold text-mint">항상 장착</span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {keys.map((k) => {
          const on = value.includes(k);
          return (
            <button key={k} type="button" aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== k) : [...value, k])} className={`slot rounded-2xl p-3 text-left ${on ? "slot-on" : ""}`}>
              <span className="flex items-center gap-2">
                <span className="slot-icon grid h-9 w-9 shrink-0 place-items-center rounded-xl text-lg">{roles.packs[k].emoji}</span>
                <b className="min-w-0 flex-1 truncate text-[13px]">{roles.packs[k].name}</b>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${on ? "bg-clay text-white" : "bg-sand text-sub"}`}>{on ? "장착" : "빈 칸"}</span>
              </span>
              <span className="mt-1.5 block text-[11.5px] leading-snug text-sub">{roles.packs[k].desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// 형식 하나를 펼쳐 보여준다 — 무엇을 설계하는지, 무엇을 미루는지, 코치가 어떻게 되묻는지
function FormatDetail({ k }: { k: FormatKey }) {
  const f = formats.formats[k];
  const [more, setMore] = useState(false);
  return (
    <div className="info fade mt-2 space-y-2 text-[13px] leading-relaxed" style={{ borderColor: `${f.color}66` }}>
      <p><span className="info-tag" style={{ color: f.color }}>📖 {f.name.replace(/ \(.*\)/, "")}</span> <span className="text-sub">{f.draft}</span></p>
      <p className="text-sub"><b className="text-ink">채울 칸 {f.checks.length}개</b> — {f.checks.map((c, i) => `${i + 1}. ${c.label}`).join(" · ")}</p>
      <button type="button" onClick={() => setMore(!more)} className="text-xs font-bold text-clay sm:hidden">{more ? "접기 ▴" : "설계할 것 · 되묻는 것 자세히 ▾"}</button>
      <div className={`${more ? "" : "hidden"} space-y-2 sm:block`}>
        <ul className="space-y-1">
          {formats.principle.axes.map((a) => (
            <li key={a.key} className="flex gap-1.5">
              <span className="shrink-0">{a.emoji}</span>
              <span><b>{a.name}</b> <span className="text-sub">{f.design[a.key as "plan" | "algo" | "arch"]}</span></span>
            </li>
          ))}
        </ul>
        <p><b>나중으로 미루는 것</b> <span className="text-sub">— {f.design.later}</span></p>
        <div>
          <p className="mb-0.5 font-bold">코치는 이런 걸 되물어</p>
          <ul className="space-y-0.5 text-sub">
            {f.rq.map((r) => (
              <li key={r.id}>🧭 {r.f3.q.split("?")[0]}?</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function ProjectSheet({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [emoji, setEmoji] = useState<string | null>(null); // null = 형식의 이모지를 따라간다
  const [format, setFormat] = useState<FormatKey | null>(null);
  const [more, setMore] = useState(false); // 모바일에서는 설명을 접어 둔다
  const input = "w-full rounded-xl border border-line bg-card px-3.5 py-3 text-[15px] outline-none focus:border-clay";
  const P = formats.principle;

  const level = levelOf(useTable("reports").length);
  const f = format ? formats.formats[format] : null;
  const shown = emoji ?? f?.emoji ?? "🌱";
  const say = !f ? P.title : name.trim() ? `${name.trim()}! 이제 시작만 누르면 돼` : `${f.name.replace(/ \(.*\)/, "")} 좋지! 이름을 지어 줘`;
  const AXIS_ART: Record<string, React.ReactNode> = { plan: <CompassArt size={38} />, algo: <FlowArt size={38} />, arch: <BlocksArt size={38} /> };
  const GAIN_ART = [<AskBackArt key="a" size={38} />, <MeterArt key="m" size={38} />, <span key="r" className="flex"><ReportArt size={34} /><span className="-ml-2 mt-1.5"><PlanArt size={30} /></span></span>];
  const num = "mr-1.5 inline-grid h-5 w-5 place-items-center rounded-full bg-clay text-[11px] font-black text-[#1d1600]";

  return (
    <Sheet title="새 프로젝트" onClose={onClose}>
      <div className="mb-4 flex items-end gap-1.5">
        <Buddy level={level} size={76} />
        <div className="mb-1.5 min-w-0 flex-1 rounded-[8px_22px_22px_22px] border-[1.5px] border-line bg-card px-4 py-3">
          <p key={say} className="rise text-[15px] font-extrabold leading-snug [word-break:keep-all]">📐 {say}</p>
          <p className="mt-1 hidden text-[12.5px] leading-relaxed text-sub [word-break:keep-all] sm:block">{P.line}</p>
        </div>
      </div>

      <section className="info mb-5">
        <button type="button" onClick={() => setMore(!more)} className="flex w-full items-center gap-2 text-left sm:pointer-events-none">
          <span className="info-tag">📖 알아두기</span>
          <span className="min-w-0 flex-1 truncate text-xs text-sub">{P.axes.map((a) => a.name).join(" · ")} — 네가 정하는 세 가지</span>
          <span className="shrink-0 text-xs font-bold text-clay sm:hidden">{more ? "접기 ▴" : "자세히 ▾"}</span>
        </button>
        <div className={`${more ? "" : "hidden"} sm:block`}>
          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {P.axes.map((a) => (
              <div key={a.key} className="flex items-center gap-2.5">
                {AXIS_ART[a.key] ?? <span className="text-2xl">{a.emoji}</span>}
                <span className="min-w-0 text-[12px] leading-snug text-sub [word-break:keep-all]"><b className="block text-[13px] text-ink">{a.name}</b>{a.desc}</span>
              </div>
            ))}
          </div>
          <p className="mt-3.5 border-t border-dashed border-line pt-3 text-[12.5px] font-bold">🎁 {P.gainsTitle} <span className="font-normal text-sub">— {P.gainsLine}</span></p>
          <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {P.gains.map((g, i) => (
              <div key={g.name} className="flex items-center gap-2.5">
                <span className="grid w-12 shrink-0 place-items-center">{GAIN_ART[i] ?? <span className="text-2xl">{g.emoji}</span>}</span>
                <span className="min-w-0 text-[12px] leading-snug text-sub [word-break:keep-all]"><b className="block text-[13px] text-gold">{g.name}</b>{g.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <p className="mb-2 flex flex-wrap items-center gap-x-1.5 text-sm font-bold"><span className={num}>1</span>무엇으로 만들 거야? <span className="act-tag">👆 하나 누르기</span></p>
      <div className="grid grid-cols-5 gap-1.5">
        {FORMAT_KEYS.map((k) => {
          const ft = formats.formats[k];
          const on = format === k;
          return (
            <button key={k} type="button" aria-pressed={on} onClick={() => setFormat(k)} className={`pick ${on ? "on" : ""}`} style={{ ["--pick" as string]: ft.color, ["--pick-soft" as string]: `${ft.color}26`, color: ft.color, borderColor: on ? ft.color : `${ft.color}55` }}>
              <FormatArt k={k} size={44} on={on} />
              <span className="leading-tight">{ft.name.replace(/ \(.*\)/, "")}</span>
            </button>
          );
        })}
      </div>
      {format ? <FormatDetail key={format} k={format} /> : <p className="mt-2 text-xs text-sub">형식마다 질문 버튼 · 채울 칸 · 코치가 되묻는 것이 달라져. 나중에 바꿀 수 있어.</p>}

      <p className="mb-2 mt-6 text-sm font-bold"><span className={num}>2</span>이름과 한 줄 설명 <span className="act-tag ml-1">✍️ 쓰기</span></p>
      <div className="flex items-center gap-3">
        <ProjectPlanet emoji={shown} named={!!name.trim()} size={104} />
        <div className="min-w-0 flex-1">
          <p className="mb-1.5 text-xs font-bold text-sub">행성에 세울 아이콘 <span className="font-normal">— 안 고르면 형식 아이콘</span></p>
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-8">
            {onboarding.emojis.map((e) => (
              <button key={e} type="button" aria-pressed={emoji === e} onClick={() => setEmoji(emoji === e ? null : e)} className={`pick emoji ${emoji === e ? "on" : ""}`}>
                {e}
              </button>
            ))}
          </div>
        </div>
      </div>
      <input className={`${input} mt-3`} placeholder="프로젝트 이름" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} />
      <input className={`${input} mt-2`} placeholder="한 줄 설명 (선택) — 누구의 무엇을 바꾸고 싶어?" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={40} />
      <button
        type="button"
        disabled={!name.trim() || !format}
        onClick={() => {
          if (!format || !f) return;
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

const RHYTHMS = [
  { n: 2, emoji: "🔥", name: "촘촘하게", desc: "두 번 묻고 한 번 돌아봐. 생각이 가장 빨리 깊어져." },
  { n: 3, emoji: "⚖️", name: "균형 있게", desc: "세 번 묻고 한 번. 만들기와 돌아보기가 반반." },
  { n: 4, emoji: "🍃", name: "느긋하게", desc: "네 번 묻고 한 번. 만드는 데 집중하고 싶을 때." },
] as const;

export function Switch({ on }: { on: boolean }) {
  return <span aria-hidden className={`switch ${on ? "switch-on" : ""}`}><span className="switch-knob" /></span>;
}

export function ProjectSettings({ project }: { project: Project }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-[13px] font-bold">🥁 되묻는 리듬 <span className="font-normal text-sub">— 몇 번 묻고 한 번 돌아볼까</span></p>
        <div className="grid grid-cols-3 gap-2">
          {RHYTHMS.map((r) => {
            const on = project.rhythm === r.n;
            return (
              <button key={r.n} type="button" aria-pressed={on} onClick={() => patchProject(project.id, { rhythm: r.n, counter: 0 })} className={`slot rounded-2xl px-2 py-3 text-center ${on ? "slot-on" : ""}`}>
                <span className="block text-2xl">{r.emoji}</span>
                <b className="mt-1 block text-[14px]">{r.n}문 1역</b>
                <span className={`block text-[11px] font-bold ${on ? "text-gold" : "text-sub"}`}>{r.name}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-sub">{RHYTHMS.find((r) => r.n === project.rhythm)?.desc}</p>
      </div>

      <button type="button" role="switch" aria-checked={project.answerOnly} onClick={() => patchProject(project.id, { answerOnly: !project.answerOnly })} className={`slot flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left ${project.answerOnly ? "slot-on" : ""}`}>
        <span className="slot-icon grid h-9 w-9 shrink-0 place-items-center rounded-xl text-lg">⚡</span>
        <span className="min-w-0 flex-1">
          <b className="block text-sm">답만 모드 <span className="text-[11px] font-bold text-sub">{project.answerOnly ? "켜짐" : "꺼짐"}</span></b>
          <span className="block text-xs text-sub">역질문을 전부 [나중에]로 넘겨. 급할 때만 켜.</span>
        </span>
        <Switch on={project.answerOnly} />
      </button>

      <div>
        <p className="mb-1 flex items-center text-[13px] font-bold">🧩 주제 팩 장착 <span className="ml-auto rounded-full bg-sand px-2 py-0.5 text-[11px] text-gold">{project.packs.length} / {Object.keys(roles.packs).length}</span></p>
        <p className="mb-2 text-xs leading-relaxed text-sub">형식에 맞춰 자동으로 끼워 뒀어. 장착한 주제는 10문에 두 번쯤 되물어. 설계를 묻는 되묻기는 형식에 따라 항상 들어가.</p>
        <PackPicker value={project.packs} onChange={(packs) => patchProject(project.id, { packs })} />
      </div>
    </div>
  );
}
