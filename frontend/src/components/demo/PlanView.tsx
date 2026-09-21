"use client";

import DemoMarkdown from "./DemoMarkdown";

interface Props {
  filename: string;
  markdown: string;
  filled: number;
  total: number;
  onClose: () => void;
}

// 📝 기획서.md — 코드는 어느 도구로도 뽑을 수 있다. 여기 남는 건 알고리즘 · 기획 · 차별점이다.
export default function PlanView({ filename, markdown, filled, total, onClose }: Props) {
  const download = () => {
    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-white">
      <header className="flex items-center gap-2 border-b border-stone-200 px-3 py-3">
        <button onClick={onClose} aria-label="닫기" className="px-1 text-lg">
          ‹
        </button>
        <div className="min-w-0">
          <div className="truncate text-[14.5px] font-semibold">📝 {filename}</div>
          <div className="text-[11.5px] text-stone-500">
            {filled}/{total}칸 · 답이 끝날 때마다 한 칸씩 쌓여요
          </div>
        </div>
        <button onClick={download} className="ml-auto shrink-0 rounded-full bg-stone-800 px-3 py-1.5 text-[12.5px] font-semibold text-white">
          ⬇ .md 저장
        </button>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-3 text-[13.5px] leading-relaxed">
        <DemoMarkdown>{markdown}</DemoMarkdown>
        <div className="mt-4 rounded-xl bg-emerald-50 px-3 py-2.5 text-[12.5px] text-emerald-900">
          이 파일을 코딩 도구(Cursor · Claude Code · Replit 등)에 그대로 붙여넣으면 코드가 나와요. <b>___ 빈칸</b>은 도구가 모르는 칸 — 네가 채워야 해요.
        </div>
      </div>
    </div>
  );
}
