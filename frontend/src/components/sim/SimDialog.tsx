"use client";

// 대화창에서 여는 화면 설계도 — 기획서로 AI가 흰 종이 와이어프레임(화면 · 칸 · 규칙)을 그리고, 그다음은 손으로 고친다.
// 비용 규칙 — AI 호출은 답 10개마다 한 번만:
//   R1 답 10개 전에는 📐 설계도 만들기가 잠긴다 (예시 템플릿 · 빈 틀은 언제나 무료)
//   R4 만든 설계도는 이 브라우저에 저장 — 다시 열 때는 호출이 없다
//   R5 답 10개가 더 쌓이면(다음 리포트) 다시 만들기 1번
//   R6 설계도 안의 수정은 전부 손으로 (AI 0회)
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ProjectSchema, starterSpec, templateFor, upgradeTemplate, type Project } from "@/lib/sim";
import SimStage, { cardClass, segClass } from "./SimStage";
import "./sim.css";

const storeKey = (id: string) => `askback:sim:p:${id}`;
const genKey = (id: string) => `askback:sim:gen:${id}`; // AI로 만든 횟수
export const SIM_EVERY = 10; // 답 몇 개마다 AI 설계 1번

const readUsed = (id: string) => {
  try {
    return Math.max(0, Number(localStorage.getItem(genKey(id))) || 0);
  } catch {
    return 0;
  }
};

export default function SimDialog({ projectId, emoji, name, desc, plan, answers, hasPlan, onClose, focusRule, onJump }: {
  projectId: string; emoji: string; name: string; desc: string; plan: string; onClose: () => void;
  answers: number; // 이 프로젝트에서 받은 답 수 — 10개마다 AI 설계 1번
  hasPlan: boolean; // 📝 기획서가 있나 — 만들기 전 점검
  focusRule?: string; // 대화 답 카드의 "📱 화면에서 눌러 보기"로 열면 그 규칙부터 보여 준다
  onJump?: (q: number) => void; // 규칙의 💬 Q 번호 → 다이얼로그를 닫고 그 질문으로
}) {
  const template = useMemo(() => templateFor(projectId), [projectId]); // 예시 템플릿 — 저장된 명세가 없으면 이걸로 바로 연다
  const [spec, setSpec] = useState<Project | null>(null);
  const [ready, setReady] = useState(false);
  const [live, setLive] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [used, setUsed] = useState(0);
  const [sure, setSure] = useState(false); // 다시 만들기 — 두 번 눌러야 한다 (손으로 고친 게 사라지니까)
  const [msg, setMsg] = useState<{ note?: string; ask?: string; error?: string } | null>(null);
  const [nonce, setNonce] = useState(0);

  const earned = Math.floor(answers / SIM_EVERY);
  const left = Math.max(0, earned - used);
  const nextAt = (used + 1) * SIM_EVERY; // 다음 AI 설계가 열리는 답 수
  const canGen = left > 0 && live === true && !busy;

  useEffect(() => {
    let alive = true;
    Promise.resolve().then(() => {
      if (!alive) return;
      setUsed(readUsed(projectId));
      try {
        const raw = localStorage.getItem(storeKey(projectId));
        const parsed = raw ? ProjectSchema.safeParse(JSON.parse(raw)) : null;
        if (parsed?.success) {
          const up = upgradeTemplate(parsed.data, template); // 예전 판 예시면 새 판으로 (연필 · 스티커는 그대로)
          if (up !== parsed.data) localStorage.setItem(storeKey(projectId), JSON.stringify(up));
          setSpec(up);
        }
        else if (template) setSpec(template);
      } catch {
        if (template) setSpec(template);
      }
      setReady(true);
    });
    fetch("/api/sim").then((r) => r.json()).then((d: { live?: boolean }) => alive && setLive(Boolean(d.live)), () => alive && setLive(false));
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      alive = false;
      window.removeEventListener("keydown", onKey);
    };
  }, [projectId, onClose, template]);

  const save = (next: Project | null) => {
    setSpec(next);
    try {
      if (next) localStorage.setItem(storeKey(projectId), JSON.stringify(next));
      else localStorage.removeItem(storeKey(projectId));
    } catch {}
  };

  const generate = async () => {
    if (!canGen) return;
    setBusy(true);
    setSure(false);
    setMsg(null);
    try {
      const res = await fetch("/api/sim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: projectId, name, plan }) });
      const data = (await res.json()) as { project?: unknown; note?: string; ask?: string };
      const parsed = ProjectSchema.safeParse(data.project);
      if (res.ok && parsed.success) {
        save(parsed.data);
        const n = used + 1; // 성공했을 때만 1번 쓴 것으로 센다
        setUsed(n);
        try {
          localStorage.setItem(genKey(projectId), String(n));
        } catch {}
        setNonce((k) => k + 1);
        setMsg({ note: data.note, ask: data.ask });
      } else setMsg({ error: res.status === 503 ? "AI 연결이 꺼져 있어. 빈 틀로 시작해 봐." : "이번엔 설계도를 못 그렸어. 한 번 더 눌러 봐 — 횟수는 안 줄었어." });
    } catch {
      setMsg({ error: "연결이 끊겼어. 잠깐 뒤에 다시 해 봐 — 횟수는 안 줄었어." });
    } finally {
      setBusy(false);
    }
  };

  const close = <button type="button" className={segClass(false)} onClick={onClose}>✕ 닫기</button>;
  // 머리 오른쪽 — 다시 만들기 (답 10개가 더 쌓였을 때만)
  const regen = spec && live && (
    left > 0 ? (
      <button type="button" className={`${segClass(sure)} disabled:opacity-40`} disabled={busy} onClick={() => (sure ? generate() : setSure(true))} title="손으로 고친 설계도는 새것으로 바뀐다">
        {busy ? "그리는 중…" : sure ? "정말? 고친 게 사라져 — 다시 누르기" : `♻ AI로 다시 설계 · ${left}번`}
      </button>
    ) : (
      <span className="px-1 text-[12px] font-bold text-sub" title={`AI 설계는 답 ${SIM_EVERY}개마다 한 번`}>♻ 다시 설계는 답 {nextAt}개에</span>
    )
  );

  return createPortal(
    <div className="sim sim-overlay" role="dialog" aria-modal="true" aria-label="화면 설계도">
      {spec ? (
        <>
          {template && spec?.id === template.id && (
            <div className="mx-auto mt-4 max-w-[1240px] px-4">
              <p className="sim-banner">
                📂 <b>예시 템플릿</b> · 규칙 {template.rules.length}개 · 💬 {template.rules.map((r) => r.from).filter((q, i, a): q is number => q !== undefined && a.indexOf(q) === i).sort((x, y) => x - y).map((q) => `Q${q}`).join(" ")} <span className="text-sub">— 💬Q를 누르면 그 대화로</span>
              </p>
            </div>
          )}
          {msg?.note && (
            <div className="mx-auto mt-4 max-w-[1240px] px-4">
              <div className="rounded-2xl border border-clay bg-clay-soft px-4 py-3 text-[13px] leading-relaxed">
                ✨ {msg.note}
                {msg.ask && <p className="mt-1 font-bold text-clay">🙋 {msg.ask}</p>}
              </div>
            </div>
          )}
          {msg?.error && <p className="mx-auto mt-4 max-w-[1240px] px-4 text-[13px] font-bold text-[#fb7185]">{msg.error}</p>}
          <SimStage
            key={`${nonce}:${focusRule ?? ""}`}
            project={spec}
            focusRule={focusRule}
            onJump={onJump}
            onChange={save}
            title={<>📐 {emoji} {name} <span className="ml-1 rounded-full bg-clay-soft px-2 py-0.5 align-middle text-[11px] text-clay">화면 설계도</span></>}
            sub="흰 종이 와이어프레임 — 화면 · 칸 · 규칙만. 고치기는 손으로, 이상한 곳은 대화로 돌아가서 물어봐."
            actions={<>{regen}{close}</>}
            onResetAll={() => { save(null); setMsg(null); if (template) { setSpec(template); setNonce((n) => n + 1); } }}
          />
        </>
      ) : (
        <div className="mx-auto max-w-[520px] px-4 pt-16">
          <div className={`${cardClass} text-center`}>
            <p className="text-4xl">📐</p>
            <h1 className="mt-2 text-[18px] font-black">{emoji} {name} — 화면 설계도</h1>
            <p className="mt-2 text-[13.5px] leading-relaxed text-sub">대화로 정한 기획서를 흰 종이 와이어프레임으로 그려. 꾸미기 · 코드는 없어 — 화면 · 칸 · 규칙만.</p>

            {/* 만들기 전 점검 — 한 번뿐인 AI 호출을 덜 익은 기획에 쓰지 않게 */}
            <div className="sim-gate">
              <div className="sim-gate-bar" aria-label={`답 ${Math.min(answers, nextAt)}/${nextAt}`}>
                <i style={{ width: `${Math.min(100, (answers / nextAt) * 100)}%` }} />
              </div>
              <ul>
                <li className={answers >= nextAt ? "ok" : ""}>{answers >= nextAt ? "✅" : "⏳"} 답 {SIM_EVERY}개 — 지금 {answers}개{answers < nextAt ? ` · ${nextAt - answers}개 더` : ""}</li>
                <li className={hasPlan ? "ok" : ""}>{hasPlan ? "✅" : "⬜"} 📝 기획서{hasPlan ? "" : " — 대화에서 기획서를 먼저 만들면 더 정확해"}</li>
                <li className={live ? "ok" : ""}>{live ? "✅" : "⬜"} AI 연결{live === false ? " — 꺼져 있음 (서버에 API 키 없음)" : ""}</li>
              </ul>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button type="button" className={`${segClass(true)} disabled:opacity-40`} disabled={!ready || !canGen} onClick={generate} title={`AI 설계는 답 ${SIM_EVERY}개마다 한 번`}>
                {busy ? "설계도를 그리는 중…" : left > 0 ? "📐 설계도 만들기 · AI 1번" : `🔒 답 ${nextAt}개에 열려`}
              </button>
              <button type="button" className={segClass(false)} disabled={!ready || busy} onClick={() => { save(starterSpec(projectId, emoji, name, desc)); setNonce((n) => n + 1); }}>🧩 빈 틀로 시작 · 무료</button>
              {close}
            </div>
            <p className="mt-3 text-[12px] text-sub">AI 설계는 답 {SIM_EVERY}개마다 한 번 · 만든 뒤 고치기는 손으로 (무료)</p>
            {msg?.error && <p className="mt-3 text-[13px] font-bold text-[#fb7185]">{msg.error}</p>}
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
