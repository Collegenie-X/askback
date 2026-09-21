"use client";

// 멀티모달 입력 부품 — 사진(앨범·카메라·붙여넣기)과 음성(말로 묻기).
// 사진은 localStorage에 들어가야 하므로 긴 변 1024px JPEG로 줄여 data URL로 만든다.
import { useCallback, useEffect, useRef, useState } from "react";

export const MAX_IMAGES = 3;

export function shrinkImage(file: Blob, maxSide = 1024, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      URL.revokeObjectURL(url);
      if (!ctx) return reject(new Error("canvas"));
      ctx.fillStyle = "#fff"; // 투명 PNG가 검게 나오지 않게
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    img.src = url;
  });
}

export async function filesToImages(files: Iterable<File>, room: number): Promise<string[]> {
  const picked = [...files].filter((f) => f.type.startsWith("image/")).slice(0, Math.max(0, room));
  const out: string[] = [];
  for (const f of picked) {
    try {
      out.push(await shrinkImage(f));
    } catch {
      // 읽지 못한 파일은 건너뛴다
    }
  }
  return out;
}

/* ---------- 말로 묻기 (Web Speech API) ---------- */

interface SpeechResultEvent {
  resultIndex: number;
  results: { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } };
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useVoice(onText: (finalText: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const rec = useRef<Recognition | null>(null);
  const handler = useRef(onText);
  useEffect(() => {
    handler.current = onText;
  }, [onText]);
  useEffect(() => {
    const id = requestAnimationFrame(() => setSupported(recognitionCtor() !== null));
    return () => {
      cancelAnimationFrame(id);
      rec.current?.stop();
    };
  }, []);

  const toggle = useCallback(() => {
    if (rec.current) {
      rec.current.stop();
      return;
    }
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = "ko-KR";
    r.interimResults = false;
    r.continuous = true;
    r.onresult = (e) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) text += e.results[i][0].transcript;
      if (text.trim()) handler.current(text.trim());
    };
    const end = () => {
      rec.current = null;
      setListening(false);
    };
    r.onend = end;
    r.onerror = end;
    rec.current = r;
    setListening(true);
    r.start();
  }, []);

  return { listening, supported, toggle };
}

/* ---------- 화면 조각 ---------- */

export function ImageStrip({ images, onRemove }: { images: string[]; onRemove?: (i: number) => void }) {
  if (!images.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {images.map((src, i) => (
        <div key={i} className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={`첨부 사진 ${i + 1}`} className={`rounded-2xl object-cover ${onRemove ? "h-16 w-16" : "max-h-52 max-w-full"}`} />
          {onRemove && (
            <button type="button" aria-label="사진 빼기" onClick={() => onRemove(i)} className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-void text-xs font-bold text-ink ring-2 ring-line">
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export function AttachMenu({ room, onImages, disabled }: { room: number; onImages: (imgs: string[]) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const album = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? [...e.target.files] : [];
    e.target.value = "";
    setOpen(false);
    if (files.length) onImages(await filesToImages(files, room));
  };
  return (
    <div className="relative shrink-0">
      <button type="button" aria-label="사진 붙이기" aria-expanded={open} disabled={disabled || room <= 0} onClick={() => setOpen((v) => !v)} className="chunk-ghost grid h-10 w-10 place-items-center rounded-2xl text-xl font-bold disabled:opacity-40">
        ＋
      </button>
      {open && (
        <>
          <button type="button" aria-label="닫기" className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} />
          <div className="panel fade absolute bottom-12 left-0 z-20 w-44 overflow-hidden rounded-2xl text-sm font-bold">
            <button type="button" onClick={() => album.current?.click()} className="flex w-full items-center gap-2.5 px-4 py-3 text-left active:bg-sand">🖼️ 앨범에서 고르기</button>
            <button type="button" onClick={() => camera.current?.click()} className="flex w-full items-center gap-2.5 border-t border-line px-4 py-3 text-left active:bg-sand">📷 지금 찍기</button>
            <p className="border-t border-line px-4 py-2 text-[11px] font-normal text-sub">붙여넣기(Ctrl/⌘+V)도 돼 · 최대 {MAX_IMAGES}장</p>
          </div>
        </>
      )}
      <input ref={album} type="file" accept="image/*" multiple hidden onChange={pick} />
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={pick} />
    </div>
  );
}
