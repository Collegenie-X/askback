"use client";

// 보호자(법정대리인) 동의 화면 — 메일 링크로 연다. 로그인 없이 링크의 토큰이 곧 권한.
//   불러오기 → (대기 중) 학생 확인 · 무엇을 모으나 · 두 가지 체크 → 동의합니다 / 동의하지 않습니다 → 결과
//   이미 처리됐거나 만료된 링크는 그 상태를 보여 준다.
import Link from "next/link";
import { useEffect, useState } from "react";
import { LEGAL, OPERATOR } from "@/data/legal";
import { LogoMark } from "./Art";
import LegalView from "./LegalView";

type Info = {
  status: "pending" | "approved" | "declined" | "expired";
  child: { nickname: string; grade: string; email: string } | null;
  guardianEmail: string;
  expiresAt: string;
  decidedAt: string | null;
};

type Load = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ok"; info: Info };

async function call<T>(path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/v1/guardian/${path}`, { method: body ? "POST" : "GET", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error("서버에 닿지 못했어요. 인터넷 연결을 확인하고 다시 열어 주세요.");
  }
  const json = (await res.json().catch(() => null)) as { data?: T; error?: { message: string } } | null;
  if (!res.ok || !json || json.error) throw new Error(json?.error?.message ?? `서버 오류 (${res.status})`);
  return json.data as T;
}

const date = (iso: string) => new Date(iso).toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });

export default function GuardianConsent({ token }: { token: string }) {
  const [load, setLoad] = useState<Load>(token ? { kind: "loading" } : { kind: "error", message: "링크에 확인 정보가 없어요. 메일의 버튼을 다시 눌러 주세요." });

  useEffect(() => {
    if (!token) return;
    call<Info>(encodeURIComponent(token)).then((info) => setLoad({ kind: "ok", info }), (e: Error) => setLoad({ kind: "error", message: e.message }));
  }, [token]);

  return (
    <main className="phone">
      <div className="scroll flex-1">
        <div className="mx-auto max-w-[560px] px-4 pb-16 pt-6">
          <header className="mb-5 flex items-center gap-2.5">
            <LogoMark size={34} />
            <div>
              <p className="text-[15px] font-extrabold">{OPERATOR.service}</p>
              <p className="text-[11.5px] text-sub">만 14세 미만 가입 · 보호자(법정대리인) 동의</p>
            </div>
          </header>
          {load.kind === "loading" && (
            <div className="grid place-items-center gap-3 py-20">
              <span className="flex gap-1.5"><span className="dot" /><span className="dot" /><span className="dot" /></span>
              <p className="text-sm text-sub">요청을 확인하고 있어요…</p>
            </div>
          )}
          {load.kind === "error" && <Result emoji="🔗" title="열 수 없는 링크예요" body={load.message} />}
          {load.kind === "ok" && <Body token={token} info={load.info} onDecided={(status) => setLoad({ kind: "ok", info: { ...load.info, status, decidedAt: new Date().toISOString() } })} />}
        </div>
      </div>
    </main>
  );
}

function Body({ token, info, onDecided }: { token: string; info: Info; onDecided: (s: "approved" | "declined") => void }) {
  const [isGuardian, setIsGuardian] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [full, setFull] = useState(false);
  const [askDecline, setAskDecline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const name = info.child?.nickname ?? "학생";

  if (info.status === "approved")
    return <Result emoji="🎉" title="동의가 완료됐어요" body={`${name} 학생이 이제 틴스파크AI를 시작할 수 있어요. 학생의 화면은 저절로 넘어가요.`} foot={info.decidedAt ? `동의 일시 · ${date(info.decidedAt)}` : undefined} rights confetti />;
  if (info.status === "declined")
    return <Result emoji="🙅" title="동의하지 않음으로 처리했어요" body={`${name} 학생의 가입은 진행되지 않아요. 학생이 입력한 가입 정보는 ${date(info.expiresAt)}까지 보관된 뒤 자동으로 삭제돼요.`} rights />;
  if (info.status === "expired")
    return <Result emoji="⌛" title="기간이 지난 요청이에요" body="동의 기간(5일)이 지나 요청과 학생의 가입 정보가 삭제됐거나 곧 삭제돼요. 다시 가입하려면 학생에게 처음부터 요청해 달라고 해 주세요." />;

  const decide = async (decision: "approve" | "decline") => {
    setBusy(true);
    setError("");
    try {
      const r = await call<{ status: "approved" | "declined" }>(encodeURIComponent(token), { decision, isGuardian, agreed });
      onDecided(r.status);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };
  const ready = isGuardian && agreed;

  return (
    <div className="rise space-y-4">
      <section className="rounded-3xl border border-line bg-card p-5">
        <p className="text-[12px] font-bold text-clay">동의 요청</p>
        <h1 className="mt-1 text-[20px] font-extrabold leading-snug [word-break:keep-all]">
          {name} 학생이 틴스파크AI에 가입하려고 해요
        </h1>
        <dl className="mt-3 grid grid-cols-[72px_1fr] gap-y-1 text-[13px]">
          <dt className="text-sub">학년</dt><dd className="font-bold">{info.child?.grade}</dd>
          <dt className="text-sub">학생 계정</dt><dd className="font-bold">{info.child?.email}</dd>
          <dt className="text-sub">유효 기간</dt><dd>{date(info.expiresAt)}까지</dd>
        </dl>
        <p className="mt-3 text-[12.5px] leading-relaxed text-sub [word-break:keep-all]">「개인정보 보호법」 제22조의2에 따라 만 14세 미만 아동의 개인정보를 수집 · 이용하려면 법정대리인의 동의가 필요합니다. 아래 내용을 확인하시고 동의 여부를 선택해 주세요.</p>
      </section>

      <section className="rounded-3xl border border-line bg-card p-5">
        <h2 className="mb-3 text-[15px] font-extrabold">한눈에 보기</h2>
        <ul className="space-y-2.5 text-[13px] [word-break:keep-all]">
          {[
            ["🗂️", "모으는 정보", "Google 이메일 · 이름, 닉네임, 학년, 질문 · 답변 · 리포트 기록"],
            ["🎯", "쓰는 곳", "AI 코치 답변을 학년에 맞추고, 학습 기록을 저장해 이어 보여 주는 데만"],
            ["🌏", "국외 이전", "AI 답변 생성을 위해 질문 내용이 미국 Anthropic으로 전송 (AI 학습에 쓰지 않음, 30일 이내 삭제)"],
            ["🗑️", "보관 기간", "탈퇴할 때까지 · 탈퇴하면 즉시 삭제"],
            ["🛡️", "보호자 권리", `언제든 열람 · 정정 · 삭제 · 동의 철회 요청 (${OPERATOR.email})`],
          ].map(([e, k, v]) => (
            <li key={k} className="flex gap-2.5">
              <span className="slot-icon grid h-8 w-8 shrink-0 place-items-center rounded-xl text-base">{e}</span>
              <span><b className="block text-ink">{k}</b><span className="text-sub">{v}</span></span>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setFull((v) => !v)} aria-expanded={full} className="mt-4 w-full rounded-xl border border-line py-2.5 text-[12.5px] font-bold text-sub active:bg-sand">
          {full ? "전문 접기 ▴" : "「법정대리인(보호자) 동의」 전문 보기 ▾"}
        </button>
        {full && <div className="fade mt-4 border-t border-line pt-4"><LegalView doc={LEGAL.guardian} /></div>}
        <p className="mt-3 text-center text-[11.5px] text-sub">
          <Link href="/legal/privacy" target="_blank" className="underline underline-offset-2">개인정보 수집 · 이용 동의 및 처리 안내</Link>
          {" · "}
          <Link href="/legal/terms" target="_blank" className="underline underline-offset-2">이용약관</Link>
        </p>
      </section>

      <section className="rounded-3xl border-2 border-clay bg-clay-soft p-4">
        <Check on={isGuardian} onClick={() => setIsGuardian((v) => !v)}>저는 위 학생의 <b>법정대리인(부모 등)</b>입니다.</Check>
        <Check on={agreed} onClick={() => setAgreed((v) => !v)}>「법정대리인(보호자) 동의」와 「개인정보 수집 · 이용 동의 및 처리 안내」를 읽었으며, 자녀의 개인정보 수집 · 이용 및 국외 이전에 <b>동의합니다</b>.</Check>
      </section>

      {error && <p role="alert" className="rise rounded-xl border border-[#fb7185] bg-[#2a1220] px-3 py-2 text-[13px] text-[#fda4af]">{error}</p>}

      <button type="button" disabled={!ready || busy} onClick={() => decide("approve")} className={`w-full rounded-2xl py-4 text-[16px] font-extrabold ${ready ? "chunk ready-glow" : "chunk-ghost text-sub"}`}>
        {busy ? "처리하는 중…" : ready ? "동의합니다" : "위 두 항목에 체크해 주세요"}
      </button>
      {askDecline ? (
        <div className="rise rounded-2xl border border-line bg-card p-4 text-center">
          <p className="text-[13.5px] font-bold">동의하지 않으면 {name} 학생은 가입할 수 없어요.</p>
          <p className="mt-1 text-[12px] text-sub">로그인 없이 기기 안에서만 쓰는 것은 계속 가능해요.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setAskDecline(false)} className="chunk-ghost rounded-2xl py-3 text-sm font-bold">돌아가기</button>
            <button type="button" disabled={busy} onClick={() => decide("decline")} className="chunk-danger rounded-2xl py-3 text-sm font-bold">동의하지 않습니다</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAskDecline(true)} className="mx-auto block text-[13px] text-sub underline underline-offset-2">동의하지 않습니다</button>
      )}
      <p className="text-center text-[11px] leading-relaxed text-sub [word-break:keep-all]">요청하신 적이 없거나 학생의 보호자가 아니시면 이 페이지를 닫아 주세요. {date(info.expiresAt)}이 지나면 요청은 자동으로 삭제됩니다.</p>
    </div>
  );
}

function Check({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} onClick={onClick} className="flex w-full items-start gap-3 rounded-xl px-1.5 py-2 text-left text-[13.5px] leading-relaxed [word-break:keep-all] active:bg-sand">
      <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-[12px] font-black transition-colors ${on ? "border-clay bg-clay text-[#1d1600]" : "border-line text-transparent"}`}>
        <span key={String(on)} className={on ? "tick-pop" : ""}>✓</span>
      </span>
      <span>{children}</span>
    </button>
  );
}

function Result({ emoji, title, body, foot, rights, confetti }: { emoji: string; title: string; body: string; foot?: string; rights?: boolean; confetti?: boolean }) {
  return (
    <section className="relative rounded-3xl border border-line bg-card px-5 py-8 text-center">
      {confetti && <div className="confetti" aria-hidden>{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ ["--i" as string]: i }} />)}</div>}
      <div className="spark mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-sand text-5xl">{emoji}</div>
      <h1 className="rise mt-4 text-[21px] font-extrabold" style={{ animationDelay: "120ms" }}>{title}</h1>
      <p className="rise mt-2 text-[13.5px] leading-relaxed text-sub [word-break:keep-all]" style={{ animationDelay: "220ms" }}>{body}</p>
      {foot && <p className="mt-3 text-[11.5px] text-sub">{foot}</p>}
      {rights && <p className="mt-5 rounded-xl bg-sand px-3 py-2.5 text-[12px] leading-relaxed text-sub [word-break:keep-all]">보호자는 언제든 자녀 정보의 열람 · 정정 · 삭제와 동의 철회를 요청할 수 있어요. 문의: <b className="text-ink">{OPERATOR.email}</b></p>}
    </section>
  );
}
