"use client";

import { useEffect, useRef } from "react";

export interface ConfirmOptions {
  emoji?: string;
  title: string;
  body?: string;
  ok?: string;
  cancel?: string;
  danger?: boolean; // 되돌릴 수 없는 일 — 확인 버튼이 빨갛게 바뀐다
}

// 브라우저 기본 confirm 대신 쓰는 앱 안 확인 창. Esc · 바깥 누르기 = 취소.
export default function ConfirmDialog({ emoji = "🤔", title, body, ok = "좋아", cancel = "취소", danger, onDone }: ConfirmOptions & { onDone: (yes: boolean) => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus(); // 엔터를 잘못 눌러도 안전한 쪽에 초점
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onDone(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDone]);

  return (
    <div className="absolute inset-0 z-50 grid place-items-center px-6" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby={body ? "confirm-body" : undefined}>
      <button type="button" aria-label="취소" tabIndex={-1} className="fade scrim absolute inset-0" onClick={() => onDone(false)} />
      <div className="rise panel relative w-full max-w-[340px] rounded-3xl px-5 pb-5 pt-6 text-center">
        <div className={`mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl text-3xl ${danger ? "confirm-icon-danger" : "slot-icon"}`}>{emoji}</div>
        <h2 id="confirm-title" className="text-base font-bold leading-snug">{title}</h2>
        {body && <p id="confirm-body" className="mt-2 text-[13px] leading-relaxed text-sub">{body}</p>}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button ref={cancelRef} type="button" onClick={() => onDone(false)} className="chunk-ghost rounded-2xl px-3 py-3 text-sm font-bold">{cancel}</button>
          <button type="button" onClick={() => onDone(true)} className={`${danger ? "chunk-danger" : "chunk"} rounded-2xl px-3 py-3 text-sm font-bold`}>{ok}</button>
        </div>
      </div>
    </div>
  );
}
