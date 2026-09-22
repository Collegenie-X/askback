"use client";

// .md 뷰어 — 답·리포트·가이드 문서를 전체 화면으로 본다. 이미지 · 표 · 코드 · mermaid 순서도를 렌더링한다.
import { useEffect, useState } from "react";
import Markdown from "./Markdown";

export interface MdDoc {
  title: string;
  md?: string;
  src?: string; // public 아래의 .md 경로
  filename?: string;
}

export default function MdViewer({ doc, onClose }: { doc: MdDoc; onClose: () => void }) {
  const [fetched, setFetched] = useState<string | null>(null);
  const [raw, setRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!doc.src) return;
    let alive = true;
    fetch(doc.src)
      .then((r) => (r.ok ? r.text() : "문서를 불러오지 못했어."))
      .catch(() => "문서를 불러오지 못했어.")
      .then((t) => alive && setFetched(t));
    return () => {
      alive = false;
    };
  }, [doc.src]);

  const md = doc.md ?? fetched;
  const download = () => {
    if (!md) return;
    const url = URL.createObjectURL(new Blob([md], { type: "text/markdown;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.filename ?? `${doc.title.replace(/[^\w가-힣]+/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fade fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-0 backdrop-blur-sm sm:p-5" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet panel flex h-full w-full flex-col overflow-hidden border-line shadow-2xl sm:h-[92dvh] sm:max-w-[1000px] sm:rounded-2xl sm:border">
      <header className="flex items-center gap-2 border-b border-line px-3 py-2.5">
        <button type="button" onClick={onClose} aria-label="닫기" className="grid h-9 w-9 place-items-center rounded-full text-lg active:bg-sand">
          ✕
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{doc.title}</p>
          <p className="text-[11px] text-sub">Markdown 뷰어</p>
        </div>
        <div className="flex rounded-full bg-sand p-0.5 text-xs font-semibold">
          <button type="button" onClick={() => setRaw(false)} className={`rounded-full px-3 py-1 ${!raw ? "bg-card shadow-sm" : "text-sub"}`}>
            보기
          </button>
          <button type="button" onClick={() => setRaw(true)} className={`rounded-full px-3 py-1 ${raw ? "bg-card shadow-sm" : "text-sub"}`}>
            원문
          </button>
        </div>
      </header>
      <div className="scroll flex-1 px-5 py-5">
        {md === null || md === undefined ? (
          <p className="text-sm text-sub">불러오는 중…</p>
        ) : raw ? (
          <pre className="whitespace-pre-wrap break-words font-mono text-[12.5px] leading-relaxed text-ink">{md}</pre>
        ) : (
          <Markdown>{md}</Markdown>
        )}
      </div>
      <footer className="flex gap-2 border-t border-line px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <button
          type="button"
          className="flex-1 rounded-xl border border-line bg-card py-2.5 text-sm font-semibold active:bg-sand"
          onClick={() => {
            if (md) navigator.clipboard?.writeText(md);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
        >
          {copied ? "복사됨 ✓" : "📋 MD 복사"}
        </button>
        <button type="button" onClick={download} className="flex-1 rounded-xl bg-ink py-2.5 text-sm font-semibold text-paper active:opacity-80">
          ⬇️ .md 저장
        </button>
      </footer>
      </div>
    </div>
  );
}
