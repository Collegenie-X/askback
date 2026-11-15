"use client";

// 화면 시뮬레이터 페이지(/sim) — 더미 예시 프로젝트를 고르거나, 공유 링크(#s=…)로 받은 화면을 눌러 본다.
// 고친 명세는 이 브라우저에만 저장된다.
import Link from "next/link";
import { useEffect, useState } from "react";
import seed from "@/data/sim.json";
import templates from "@/data/sim-templates.json";
import { decodeShare, ProjectSchema, upgradeTemplate, type Project } from "@/lib/sim";
import SimStage, { cardClass, segClass } from "./SimStage";
import "../askback.css";
import "./sim.css";

const SEED = [...seed.projects, templates.zzingong] as unknown as Project[]; // 더미 예시 둘 + 예시 템플릿(⏱ 찐공 AI)
const STORE = "askback:sim:v1";

export default function Simulator() {
  const [projects, setProjects] = useState<Project[]>(SEED);
  const [pid, setPid] = useState(SEED[0].id);
  const [shared, setShared] = useState(false);
  const [nonce, setNonce] = useState(0); // 처음으로 되돌릴 때 무대를 새로 깐다
  const project = projects.find((p) => p.id === pid) ?? projects[0];

  // 저장된 명세와 공유 링크 불러오기 — 저장소가 막혀 있어도 더미 데이터로 그대로 돈다
  useEffect(() => {
    let alive = true;
    (async () => {
      let list = SEED;
      try {
        const raw = localStorage.getItem(STORE);
        const parsed = raw ? ProjectSchema.array().safeParse(JSON.parse(raw)) : null;
        if (parsed?.success && parsed.data.length) list = parsed.data.map((p) => upgradeTemplate(p, SEED.find((x) => x.id === p.id))); // 예전 판 예시는 새 판으로
      } catch {}
      const hash = location.hash.startsWith("#s=") ? await decodeShare(location.hash.slice(3)) : null;
      if (!alive) return;
      if (hash) {
        const got = { ...hash, id: "shared" };
        list = [got, ...list.filter((p) => p.id !== "shared")];
        setShared(true);
        setPid("shared");
      }
      setProjects(list);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const save = (next: Project[]) => {
    setProjects(next);
    try {
      localStorage.setItem(STORE, JSON.stringify(next));
    } catch {}
  };
  const resetAll = () => {
    const keep = projects.filter((p) => p.id === "shared" && shared);
    setProjects([...keep, ...SEED]);
    try {
      localStorage.removeItem(STORE);
    } catch {}
    setNonce((n) => n + 1);
  };

  return (
    <main className="sim sim-page">
      <SimStage
        key={`${project.id}:${nonce}`}
        project={project}
        onChange={(next) => save(projects.map((p) => (p.id === next.id ? next : p)))}
        title={<>📱 화면 시뮬레이터 <span className="ml-1 rounded-full bg-clay-soft px-2 py-0.5 align-middle text-[11px] text-clay">MVP</span></>}
        sub="코드는 없어. 화면 · 칸 · 규칙만 정하면 바로 눌러 볼 수 있어."
        actions={<Link href="/" className="px-1 text-[13px] font-bold text-sub underline">앱으로</Link>}
        onResetAll={resetAll}
        top={
          <div className={cardClass}>
            <h2 className="mb-2.5 text-[13px] font-extrabold text-sub">🗂 {shared ? "공유받은 화면 · 예시" : "예시 프로젝트"}</h2>
            <div className="flex flex-wrap gap-2">
              {projects.map((p) => <button key={p.id} type="button" className={segClass(p.id === project.id)} onClick={() => setPid(p.id)}>{p.id === "shared" ? "🔗 " : ""}{p.emoji} {p.name}</button>)}
            </div>
            <p className="mt-2.5 text-[13px] leading-relaxed text-sub">{project.oneLine}</p>
          </div>
        }
      />
    </main>
  );
}
