"use client";

// 로그인 팝업 — 보던 화면 위에 겹쳐 열린다. 페이지를 떠나지 않는다.
//
//   ① Google로 시작  →  ② 학년 (중1 · 중2 · 기타면 만 14세 확인)  →  ③ 동의  →  🎉 환영
//   가입은 만 14세 이상만:  ②에서 "아직이에요" 를 고르면 안내만 하고 넘어가지 않는다 (로그인 없이 이 기기에서는 쓸 수 있다)
//   (예전에 보내 둔 보호자 동의 요청이 남아 있으면 ④ 기다리기 화면은 그대로 보인다)
//   이미 가입했다면 ① 다음 바로 닫힌다. 로그인한 뒤 다시 열면 '내 계정' 카드(학년 · 로그아웃 · 탈퇴).
//   동의 줄의 "보기 ›" 는 팝업 안에서 문서 페이지로 넘어가고, "동의하고 돌아가기" 로 체크까지 한 번에.
import { useEffect, useRef, useState } from "react";
import onboarding from "@/data/onboarding.json";
import { LEGAL, type LegalId } from "@/data/legal";
import { cancelGuardian, completeSignup, deleteAccount, pollSignup, resendGuardian, signInWithGoogle, signOut, updateMe, useAccount, type GoogleProfile, type GuardianPending, type Member } from "@/lib/account";
import { useApp } from "./AppContext";
import { LogoMark } from "./Art";
import LegalView from "./LegalView";

const ASK_AGE = ["중1", "중2", "기타"]; // 중3 이상은 이미 만 14세가 지났다
const STEPS = ["Google", "학년", "동의"];
const STEPS_KID = [...STEPS, "보호자"]; // 예전에 보낸 보호자 동의 요청을 기다리는 화면에서만
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginDialog({ onClose }: { onClose: () => void }) {
  const account = useAccount();
  // 팝업이 열려 있는 동안 본 상태 — 로그인 전(①)을 봤는지, 가입 단계(②③④)를 거쳤는지
  const [sawSignedOut, setSawSignedOut] = useState(false);
  const [sawSignup, setSawSignup] = useState(false);
  if (account.status === "signedOut" && !sawSignedOut) setSawSignedOut(true);
  if (account.status === "needsSignup" && !sawSignup) setSawSignup(true);

  // 이미 가입한 사람이 이 팝업의 ①에서 로그인하면 바로 닫는다 (환영 화면은 처음 가입한 사람만).
  // 팝업을 연 뒤에 저장된 로그인이 늦게 풀린 경우(계정 확인 중 → 로그인됨)는 닫지 않고 '내 계정' 카드를 보여 준다.
  useEffect(() => {
    if (account.status === "signedIn" && sawSignedOut && !sawSignup) onClose();
  }, [account.status, sawSignedOut, sawSignup, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  let body;
  if (account.status === "loading") body = <Wait text="계정을 확인하고 있어요…" />;
  else if (account.status === "signedOut") body = <Start error={account.error} />;
  else if (account.status === "needsSignup" && account.pending) body = <GuardianWait profile={account.profile} pending={account.pending} />;
  else if (account.status === "needsSignup") body = <Signup profile={account.profile} />;
  else if (sawSignup) body = <Welcome user={account.user} onClose={onClose} />; // 방금 가입 (보호자 동의로 끝난 경우도)
  else body = <Me user={account.user} picture={account.picture} onClose={onClose} />;

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center sm:items-center sm:px-6" role="dialog" aria-modal="true" aria-label="로그인">
      <button type="button" aria-label="닫기" tabIndex={-1} className="fade scrim absolute inset-0" onClick={onClose} />
      <div className="login-pop panel scroll relative flex max-h-[92%] w-full max-w-[400px] flex-col rounded-t-3xl px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 sm:rounded-3xl sm:pb-5">
        <button type="button" onClick={onClose} aria-label="닫기" className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full text-sub active:bg-sand">✕</button>
        {body}
      </div>
    </div>
  );
}

// 위쪽 진행 막대 (3칸)
function Progress({ at, steps = STEPS }: { at: number; steps?: string[] }) {
  return (
    <div className="mb-5 mr-9 flex gap-1.5" aria-label={`${steps.length}단계 중 ${at + 1}단계`}>
      {steps.map((s, i) => (
        <div key={s} className="flex-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-sand">
            <div className="h-full rounded-full bg-clay transition-all duration-500" style={{ width: i <= at ? "100%" : "0%" }} />
          </div>
          <p className={`mt-1 text-[10.5px] font-bold transition-colors ${i === at ? "text-clay" : i < at ? "text-ink" : "text-sub"}`}>{i < at ? "✓ " : ""}{s}</p>
        </div>
      ))}
    </div>
  );
}

function Wait({ text }: { text: string }) {
  return (
    <div className="grid place-items-center gap-3 py-16">
      <span className="flex gap-1.5"><span className="dot" /><span className="dot" /><span className="dot" /></span>
      <p className="text-sm text-sub">{text}</p>
    </div>
  );
}

// ① 버튼 하나
function Start({ error }: { error?: string }) {
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    if (!(await signInWithGoogle())) setBusy(false); // 성공하면 계정 확인이 끝날 때까지 기다리는 표시를 둔다
  };
  if (busy && !error) return <><Progress at={0} /><Wait text="Google 계정을 확인하고 있어요…" /></>;
  return (
    <div className="slide-in">
      <Progress at={0} />
      <div className="text-center">
        <div className="float mx-auto w-fit"><LogoMark size={64} /></div>
        <h2 className="mt-4 text-[22px] font-extrabold leading-tight">3초면 시작해요</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-sub">로그인하면 내 질문과 리포트를<br />어느 기기에서든 이어서 봐요.</p>
      </div>
      <button type="button" onClick={go} className="google-btn mt-7 flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-3.5 text-[15px] font-bold text-[#1f1f1f]">
        <GoogleMark />
        Google로 계속하기
      </button>
      {error && <p role="alert" className="rise mt-3 rounded-xl border border-[#fb7185] bg-[#2a1220] px-3 py-2 text-[13px] text-[#fda4af]">{error}</p>}
      <ul className="mt-5 flex justify-center gap-4 text-[11px] text-sub">
        <li>🔑 비밀번호 없음</li>
        <li>🎓 학년만 고르면 끝</li>
      </ul>
    </div>
  );
}

// ②③ 가입 마치기 — 학년, 그다음 동의
function Signup({ profile }: { profile: GoogleProfile }) {
  const [step, setStep] = useState<"grade" | "agree">("grade");
  const [back, setBack] = useState(false); // 뒤로 갈 때는 왼쪽에서 들어온다
  const [nickname, setNickname] = useState((profile.name || profile.email.split("@")[0]).slice(0, 20));
  const [editName, setEditName] = useState(false);
  const [grade, setGrade] = useState("");
  const [under14, setUnder14] = useState<boolean | null>(null);
  const [agreed, setAgreed] = useState<Record<LegalId, boolean>>({ terms: false, privacy: false, guardian: false });
  const [doc, setDoc] = useState<LegalId | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const goStep = (s: "grade" | "agree") => { setBack(s === "grade"); setStep(s); };
  const next = () => { timer.current = setTimeout(() => goStep("agree"), 320); }; // 고른 칸이 빛나는 걸 잠깐 보여 주고 넘어간다

  const pickGrade = (g: string) => {
    setGrade(g);
    if (ASK_AGE.includes(g)) { setUnder14(null); return; }
    setUnder14(false);
    next();
  };
  const pickAge = (u: boolean) => { setUnder14(u); if (!u) next(); }; // 만 14세 미만이면 다음으로 가지 않는다

  const needed: LegalId[] = ["terms", "privacy"]; // 보호자 동의는 아이가 체크하지 않는다 — 보호자가 메일에서 직접
  const all = needed.every((k) => agreed[k]);
  const toggleAll = () => setAgreed((a) => ({ ...a, ...Object.fromEntries(needed.map((k) => [k, !all])) }));
  const left = needed.filter((k) => !agreed[k]).length;
  const ready = !!nickname.trim() && !!grade && under14 === false && left === 0;

  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true);
    setError("");
    try {
      await completeSignup({ nickname: nickname.trim(), grade, interests: [], under14: false, agreeTerms: true, agreePrivacy: true });
      // 성공하면 계정 상태가 바뀌어 화면이 저절로 넘어간다 (🎉 환영)
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  // 문서 보기 — 팝업 안에서 한 장 넘긴다
  if (doc) {
    const d = LEGAL[doc];
    return (
      <div key={doc} className="slide-in flex min-h-0 flex-col">
        <button type="button" onClick={() => { setBack(true); setDoc(null); }} className="-ml-1 mb-3 flex w-fit items-center gap-1 rounded-full px-2 py-1 text-[13px] font-bold text-sub active:bg-sand">‹ 동의로 돌아가기</button>
        <LegalView doc={d} />
        <div className="sticky -bottom-5 -mx-5 mt-5 bg-gradient-to-t from-[#0c1124] via-[#0c1124] to-transparent px-5 pb-1 pt-4">
          <button type="button" onClick={() => { if (doc !== "guardian") setAgreed((a) => ({ ...a, [doc]: true })); setBack(true); setDoc(null); }} className="chunk w-full rounded-2xl py-3.5 text-[15px] font-extrabold">
            {doc === "guardian" ? "읽었어요 · 돌아가기" : agreed[doc] ? "✓ 동의했어요 · 돌아가기" : `${d.label}에 동의하고 돌아가기`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Progress at={step === "grade" ? 1 : 2} />
      {step === "grade" ? (
        <div key="grade" className={back ? "slide-back" : "slide-in"}>
          <div className="flex items-center gap-1.5">
            {editName ? (
              <input autoFocus value={nickname} onChange={(e) => setNickname(e.target.value.slice(0, 20))} onBlur={() => setEditName(false)} onKeyDown={(e) => e.key === "Enter" && setEditName(false)} aria-label="코치가 부를 이름" className="w-40 rounded-lg border border-clay bg-paper px-2 py-1 text-[20px] font-extrabold outline-none" />
            ) : (
              <h2 className="text-[22px] font-extrabold">안녕, {nickname || "친구"} 👋</h2>
            )}
            {!editName && <button type="button" onClick={() => setEditName(true)} aria-label="이름 바꾸기" className="rounded-full px-1.5 py-0.5 text-[12px] text-sub active:bg-sand">✎</button>}
          </div>
          <p className="mt-1 text-[13px] text-sub">몇 학년이야? 코치가 눈높이를 맞춰 줄게.</p>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {onboarding.grades.map((g, i) => (
              <button key={g} type="button" onClick={() => pickGrade(g)} aria-pressed={grade === g} style={{ animationDelay: `${i * 35}ms` }} className={`rise slot rounded-2xl py-3.5 text-[16px] font-extrabold ${grade === g ? "slot-on text-clay" : ""} ${g === "기타" ? "col-span-3 py-2.5 text-[14px]" : ""}`}>
                {g}
              </button>
            ))}
          </div>

          {grade && ASK_AGE.includes(grade) && (
            <div className="rise mt-5 rounded-2xl border border-line bg-card p-3.5">
              <p className="text-[14px] font-extrabold">🎂 만 14세가 지났어?</p>
              <p className="mt-0.5 text-[11.5px] text-sub">올해 생일이 지났는지로 따져요. 틴스파크AI는 만 14세 이상부터 가입할 수 있어요.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => pickAge(false)} aria-pressed={under14 === false} className={`slot rounded-xl py-2.5 text-[13px] font-bold ${under14 === false ? "slot-on text-clay" : ""}`}>네, 지났어요</button>
                <button type="button" onClick={() => pickAge(true)} aria-pressed={under14 === true} className={`slot rounded-xl py-2.5 text-[13px] font-bold ${under14 === true ? "slot-on text-clay" : ""}`}>아직이에요</button>
              </div>
              {under14 && (
                <div role="alert" className="rise mt-3 rounded-xl border border-clay bg-clay-soft px-3 py-2.5 text-[12.5px] leading-relaxed">
                  <p className="font-extrabold">🎂 만 14세 생일이 지나면 다시 만나요!</p>
                  <p className="mt-0.5 text-sub">가입은 만 14세 이상만 할 수 있어요. 그동안은 <b className="text-ink">로그인 없이</b> 이 기기에서 질문하고 리포트를 볼 수 있어요.</p>
                </div>
              )}
            </div>
          )}

          <button type="button" onClick={() => signOut()} className="mx-auto mt-6 block text-[11.5px] text-sub underline underline-offset-2">{profile.email} 말고 다른 계정으로</button>
        </div>
      ) : (
        <div key="agree" className="slide-in">
          <h2 className="text-[22px] font-extrabold">마지막이야! ✍️</h2>
          <p className="mt-1 text-[13px] text-sub">읽어 보고 동의해 줘. <b className="text-ink">보기 ›</b> 를 누르면 3줄 요약부터 보여 줘.</p>

          <button type="button" role="checkbox" aria-checked={all} onClick={toggleAll} className={`slot mt-5 flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left ${all ? "slot-on" : ""}`}>
            <Tick on={all} big />
            <span className="flex-1 text-[15px] font-extrabold">모두 동의하기</span>
          </button>

          <ul className="mt-2 space-y-0.5 px-1">
            {needed.map((k, i) => (
              <li key={k} className="rise flex items-center gap-2" style={{ animationDelay: `${i * 60}ms` }}>
                <button type="button" role="checkbox" aria-checked={agreed[k]} onClick={() => setAgreed((a) => ({ ...a, [k]: !a[k] }))} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2.5 text-left active:bg-sand">
                  <Tick on={agreed[k]} />
                  <span className="min-w-0 truncate text-[13.5px]"><span className="font-bold text-clay">[필수]</span> {LEGAL[k].label} 동의</span>
                </button>
                <button type="button" onClick={() => { setBack(false); setDoc(k); }} className="shrink-0 rounded-full border border-line px-2.5 py-1 text-[11.5px] font-bold text-sub active:bg-sand">보기 ›</button>
              </li>
            ))}
          </ul>

          <p className="mt-2 rounded-xl bg-sand px-3 py-2 text-[11.5px] leading-relaxed text-sub">🌏 AI 답을 만들기 위해 질문 글은 미국의 Anthropic으로 보내져요(국외 이전). AI 학습에는 쓰이지 않아요. 자세한 내용은 개인정보 <b className="text-ink">보기 ›</b> 5항에 있어요.</p>

          {error && <p role="alert" className="rise mt-3 rounded-xl border border-[#fb7185] bg-[#2a1220] px-3 py-2 text-[13px] text-[#fda4af]">{error}</p>}

          <button type="button" onClick={submit} disabled={!ready || busy} className={`mt-5 w-full rounded-2xl py-3.5 text-[15px] font-extrabold ${ready ? "chunk ready-glow" : "chunk-ghost text-sub"}`}>
            {busy ? "가입하는 중…" : !ready ? `필수 항목 ${left}개 남았어요` : "시작하기 🚀"}
          </button>
          <button type="button" onClick={() => goStep("grade")} className="mx-auto mt-3 block text-[12px] text-sub">‹ 학년 다시 고르기 · {grade}</button>
        </div>
      )}
    </>
  );
}

// ④ 보호자 동의 기다리기 — 몇 초마다 서버에 묻고, 보호자가 동의하면 저절로 🎉 로 넘어간다
function GuardianWait({ profile, pending }: { profile: GoogleProfile; pending: GuardianPending }) {
  const [now, setNow] = useState(() => Date.now());
  const [change, setChange] = useState(pending.status === "declined");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const poll = setInterval(() => { if (document.visibilityState === "visible") void pollSignup(); }, 5000);
    const onFocus = () => void pollSignup(); // 보호자 메일을 같은 기기에서 열고 돌아왔을 때 바로
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(tick); clearInterval(poll); window.removeEventListener("focus", onFocus); };
  }, []);

  const wait = pending.canResendAt ? Math.max(0, Math.ceil((Date.parse(pending.canResendAt) - now) / 1000)) : 0;
  const until = new Date(pending.expiresAt).toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });
  const gEmail = email.trim().toLowerCase();
  const emailOk = EMAIL.test(gEmail) && gEmail !== profile.email.toLowerCase();
  const declined = pending.status === "declined";

  const act = async (fn: () => Promise<void>, done: string) => {
    setBusy(true);
    setMsg("");
    try {
      await fn();
      setMsg(done);
      setChange(false);
      setEmail("");
    } catch (e) {
      setMsg((e as Error).message);
    }
    setBusy(false);
  };

  return (
    <div className="slide-in">
      <Progress at={3} steps={STEPS_KID} />
      <div className="text-center">
        {declined ? (
          <div className="spark mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-sand text-5xl">😢</div>
        ) : (
          <div className="relative mx-auto grid h-20 w-20 place-items-center">
            <span className="mail-ring absolute inset-0 rounded-3xl border-2 border-clay" />
            <span className="mail-ring absolute inset-0 rounded-3xl border-2 border-clay" style={{ animationDelay: "0.9s" }} />
            <span className="float grid h-20 w-20 place-items-center rounded-3xl bg-clay-soft text-5xl">📨</span>
          </div>
        )}
        <h2 className="mt-4 text-[21px] font-extrabold leading-tight">{declined ? "보호자가 동의하지 않았어요" : "보호자 동의를 기다리고 있어요"}</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-sub">
          <b className="text-ink">{pending.guardianEmail}</b>
          {declined ? " 에서 동의하지 않음을 골랐어요. 주소가 잘못됐다면 다른 보호자 주소로 다시 보낼 수 있어요." : " 로 동의 요청 메일을 보냈어요."}
        </p>
      </div>

      {!declined && (
        <ol className="mt-5 space-y-2 rounded-2xl border border-line bg-card p-3.5 text-[13px]">
          {["보호자께 메일함을 확인해 달라고 말씀드려 (스팸함도!)", "메일의 '내용 확인하고 동의 여부 선택하기' 버튼", "보호자가 동의하면 이 화면이 저절로 넘어가요"].map((t, i) => (
            <li key={t} className="rise flex items-center gap-2.5" style={{ animationDelay: `${i * 80}ms` }}>
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sand text-[12px] font-extrabold text-clay">{i + 1}</span>
              <span className="flex-1">{t}</span>
              {i === 2 && <span className="flex gap-1" aria-label="확인하는 중"><span className="dot" /><span className="dot" /><span className="dot" /></span>}
            </li>
          ))}
        </ol>
      )}

      {pending.devLink && (
        <a href={pending.devLink} target="_blank" rel="noreferrer" className="mt-3 block rounded-xl border border-dashed border-mint bg-mint-soft px-3 py-2 text-[11.5px] text-mint">🧪 개발 환경 — 메일을 보내지 않았어요. 보호자 화면을 이 링크로 열어 보세요 ›</a>
      )}

      {change ? (
        <div className="rise mt-4">
          <input type="email" inputMode="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="다른 보호자 이메일" aria-label="보호자 이메일" className={`w-full rounded-xl border bg-paper px-3.5 py-3 text-[15px] outline-none ${gEmail && !emailOk ? "border-[#fb7185]" : "border-line focus:border-clay"}`} />
          <div className="mt-2 grid grid-cols-[1fr_2fr] gap-2">
            {!declined && <button type="button" onClick={() => setChange(false)} className="chunk-ghost rounded-2xl py-3 text-sm font-bold">취소</button>}
            <button type="button" disabled={!emailOk || busy || wait > 0} onClick={() => act(() => resendGuardian(gEmail), "새 주소로 보냈어요 📨")} className={`${declined ? "col-span-2" : ""} rounded-2xl py-3 text-sm font-extrabold ${emailOk && !wait ? "chunk" : "chunk-ghost text-sub"}`}>
              {busy ? "보내는 중…" : wait > 0 ? `${wait}초 뒤에 보낼 수 있어요` : "이 주소로 보내기"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" disabled={busy || wait > 0} onClick={() => act(() => resendGuardian(), "다시 보냈어요 📨")} className="chunk-ghost rounded-2xl py-3 text-[13px] font-bold disabled:text-sub">
            {wait > 0 ? `다시 보내기 · ${wait}초` : "📨 다시 보내기"}
          </button>
          <button type="button" disabled={busy} onClick={() => setChange(true)} className="chunk-ghost rounded-2xl py-3 text-[13px] font-bold">✉️ 주소 바꾸기</button>
        </div>
      )}

      {msg && <p role="status" className="rise mt-2 text-center text-[12px] text-sub">{msg}</p>}

      <p className="mt-4 text-center text-[11px] leading-relaxed text-sub">{until}까지 동의가 없으면 요청과 가입 정보가 자동으로 지워져요.</p>
      <button type="button" disabled={busy} onClick={() => act(async () => { await cancelGuardian(); if (declined) await signOut(); }, "")} className="mx-auto mt-2 block text-[11.5px] text-sub underline underline-offset-2">
        {declined ? "취소하고 나가기" : "요청 취소하고 처음부터"}
      </button>
    </div>
  );
}

// 🎉 가입 완료
function Welcome({ user, onClose }: { user: Member; onClose: () => void }) {
  const { go } = useApp();
  return (
    <div className="relative py-4 text-center">
      <div className="confetti" aria-hidden>{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ ["--i" as string]: i }} />)}</div>
      <div className="spark mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-clay-soft text-5xl">🎉</div>
      <h2 className="rise mt-4 text-[22px] font-extrabold" style={{ animationDelay: "150ms" }}>{user.nickname}, 환영해!</h2>
      <p className="rise mt-1.5 text-[13px] text-sub" style={{ animationDelay: "250ms" }}>이제 질문과 리포트가 계정에 저장돼요.</p>
      <p className="rise mx-auto mt-3 w-fit rounded-full border border-clay bg-clay-soft px-3 py-1 text-[12px] font-bold text-clay" style={{ animationDelay: "350ms" }}>🎓 {user.grade}</p>
      <button type="button" onClick={() => { go({ name: "chat" }); onClose(); }} className="chunk rise mt-7 w-full rounded-2xl py-3.5 text-[15px] font-extrabold" style={{ animationDelay: "450ms" }}>질문하러 가기 →</button>
    </div>
  );
}

// 로그인한 뒤 — 작은 계정 카드
function Me({ user, picture, onClose }: { user: Member; picture: string | null; onClose: () => void }) {
  const { confirm } = useApp();
  const [grade, setGrade] = useState(user.grade);
  const [msg, setMsg] = useState("");

  const saveGrade = async (g: string) => {
    if (g === grade) return;
    setGrade(g);
    setMsg("");
    try {
      await updateMe({ grade: g });
      setMsg(`✓ ${g}(으)로 바꿨어요`);
    } catch (e) {
      setGrade(user.grade);
      setMsg((e as Error).message);
    }
  };

  const leave = async () => {
    const yes = await confirm({ emoji: "👋", title: "정말 탈퇴할까?", body: "서버에 저장된 계정과 질문 기록이 모두 지워지고 되돌릴 수 없어. 확인을 위해 Google 로그인 창이 한 번 더 떠.", ok: "탈퇴하기", danger: true });
    if (!yes) return;
    try {
      if (await deleteAccount()) onClose();
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  return (
    <div className="slide-in">
      <div className="flex items-center gap-3 pr-8">
        <Avatar src={picture} name={user.nickname} size={52} />
        <div className="min-w-0">
          <p className="truncate text-[17px] font-extrabold">{user.nickname}</p>
          <p className="truncate text-xs text-sub">{user.email}</p>
        </div>
      </div>

      <p className="mb-2 mt-5 text-[12px] font-bold text-sub">🎓 학년</p>
      <div className="grid grid-cols-4 gap-1.5">
        {onboarding.grades.map((g) => (
          <button key={g} type="button" onClick={() => saveGrade(g)} aria-pressed={grade === g} className={`slot rounded-xl py-2 text-[13px] font-bold ${grade === g ? "slot-on text-clay" : ""}`}>{g}</button>
        ))}
      </div>
      {msg && <p className="rise mt-2 text-[12px] text-sub">{msg}</p>}

      <button type="button" onClick={async () => { await signOut(); onClose(); }} className="chunk-ghost mt-6 w-full rounded-2xl py-3 text-sm font-bold">로그아웃</button>
      <div className="mt-4 flex items-center justify-center gap-3 text-[11.5px] text-sub">
        <a href="/legal/terms" target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">이용약관</a>
        <span>·</span>
        <a href="/legal/privacy" target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">개인정보</a>
        <span>·</span>
        <button type="button" onClick={leave} className="underline-offset-2 hover:underline">탈퇴</button>
      </div>
    </div>
  );
}

// ── 작은 부품 ─────────────────────────────────────────────
function Tick({ on, big }: { on: boolean; big?: boolean }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-full border-2 transition-colors ${big ? "h-7 w-7 text-[14px]" : "h-6 w-6 text-[12px]"} ${on ? "border-clay bg-clay text-[#1d1600]" : "border-line text-transparent"}`}>
      <span key={String(on)} className={on ? "tick-pop font-black" : "font-black"}>✓</span>
    </span>
  );
}

export function Avatar({ src, name, size = 40 }: { src: string | null; name: string; size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  if (src) return <img src={src} alt="" referrerPolicy="no-referrer" width={size} height={size} className="shrink-0 rounded-full border border-line" style={{ width: size, height: size }} />;
  return (
    <span className="grid shrink-0 place-items-center rounded-full bg-sand font-extrabold text-clay" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {(name || "?").slice(0, 1)}
    </span>
  );
}

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
