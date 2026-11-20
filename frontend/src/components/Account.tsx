"use client";

// 회원가입 · 로그인 (/account) — Google 계정 하나로.
//   ① Google로 시작하기  →  ② 처음이면 가입 마치기 (닉네임 · 학년 · 관심사 · 동의)  →  ③ 내 계정
import { useState } from "react";
import onboarding from "@/data/onboarding.json";
import { completeSignup, deleteAccount, signInWithGoogle, signOut, updateMe, useAccount, type GoogleProfile, type Member } from "@/lib/account";
import { useApp } from "./AppContext";
import { PageHeader } from "./ui";

export default function Account() {
  const account = useAccount();
  return (
    <>
      <PageHeader title="🔐 내 계정" sub="Google 계정 하나로 가입 · 로그인" back={{ name: "chat" }} />
      <div className="scroll flex-1 px-4 py-5">
        {account.status === "loading" && <p className="py-16 text-center text-sm text-sub">계정을 확인하고 있어요…</p>}
        {account.status === "signedOut" && <Start error={account.error} />}
        {account.status === "needsSignup" && <SignupForm profile={account.profile} />}
        {account.status === "signedIn" && <Me user={account.user} picture={account.picture} />}
      </div>
    </>
  );
}

// ① 처음 화면 — 버튼 하나
function Start({ error }: { error?: string }) {
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    await signInWithGoogle();
    setBusy(false);
  };
  return (
    <div className="mx-auto max-w-sm pt-6 text-center">
      <p className="text-5xl">✨</p>
      <h2 className="mt-4 text-xl font-extrabold">틴스파크AI 시작하기</h2>
      <p className="mt-2 text-sm leading-relaxed text-sub">
        가입하면 내 질문과 리포트를
        <br />
        다른 기기에서도 이어서 볼 수 있어요.
      </p>
      <button type="button" onClick={go} disabled={busy} className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-white py-3.5 text-[15px] font-bold text-[#1f1f1f] active:opacity-80 disabled:opacity-60">
        <GoogleMark />
        {busy ? "Google 창을 여는 중…" : "Google로 시작하기"}
      </button>
      {error && <p role="alert" className="mt-3 rounded-xl border border-[#fb7185] bg-[#2a1220] px-3 py-2 text-left text-[13px] text-[#fda4af]">{error}</p>}
      <p className="mt-6 text-[11.5px] leading-relaxed text-sub">처음이면 닉네임과 학년만 정하면 가입이 끝나요. 비밀번호는 만들지 않아요.</p>
    </div>
  );
}

// ② 가입 마치기 — 처음 들어온 Google 계정
function SignupForm({ profile }: { profile: GoogleProfile }) {
  const [nickname, setNickname] = useState(profile.name.slice(0, 20));
  const [grade, setGrade] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [under14, setUnder14] = useState<boolean | null>(null);
  const [guardian, setGuardian] = useState(false);
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const all = terms && privacy && (under14 !== true || guardian);
  const toggleAll = () => {
    const v = !all;
    setTerms(v);
    setPrivacy(v);
    if (under14) setGuardian(v);
  };
  const ready = nickname.trim() && grade && under14 !== null && terms && privacy && (!under14 || guardian);

  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true);
    setError("");
    try {
      await completeSignup({ nickname: nickname.trim(), grade, interests, under14: !!under14, guardianConsent: guardian, agreeTerms: true, agreePrivacy: true });
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3">
        <Avatar src={profile.picture} name={profile.name || profile.email} />
        <div className="min-w-0">
          <p className="text-[13px] font-bold">Google 계정 확인 ✓</p>
          <p className="truncate text-xs text-sub">{profile.email}</p>
        </div>
        <button type="button" onClick={() => signOut()} className="ml-auto shrink-0 rounded-full border border-line px-2.5 py-1 text-[11px] text-sub active:bg-sand">다른 계정</button>
      </div>

      <h2 className="pt-1 text-lg font-extrabold">거의 다 왔어요! 🚀</h2>

      <Field label="닉네임" hint="코치가 이 이름으로 불러요 · 20자까지">
        <input value={nickname} onChange={(e) => setNickname(e.target.value.slice(0, 20))} placeholder="예: 서연" className="w-full rounded-xl border border-line bg-paper px-3.5 py-3 text-[15px] outline-none focus:border-clay" />
      </Field>

      <Field label="학년">
        <Chips options={onboarding.grades} isOn={(g) => grade === g} onPick={setGrade} />
      </Field>

      <Field label="관심 있는 것" hint="여러 개 골라도 돼요 · 안 골라도 돼요">
        <Chips options={onboarding.interests} isOn={(g) => interests.includes(g)} onPick={(g) => setInterests((v) => (v.includes(g) ? v.filter((x) => x !== g) : [...v, g]))} />
      </Field>

      <Field label="나이" hint="만 14세 미만은 보호자 동의가 필요해요 (개인정보 보호법)">
        <div className="grid grid-cols-2 gap-2">
          <Pick on={under14 === false} onClick={() => { setUnder14(false); setGuardian(false); }}>만 14세 이상</Pick>
          <Pick on={under14 === true} onClick={() => setUnder14(true)}>만 14세 미만</Pick>
        </div>
      </Field>

      <section className="rounded-2xl border border-line bg-card p-3">
        <Check on={all} onClick={toggleAll} strong>전체 동의</Check>
        <div className="my-2 border-t border-line" />
        <Check on={terms} onClick={() => setTerms(!terms)}>[필수] 이용약관 동의</Check>
        <Check on={privacy} onClick={() => setPrivacy(!privacy)}>[필수] 개인정보 수집 · 이용 동의</Check>
        {under14 && <Check on={guardian} onClick={() => setGuardian(!guardian)}>[필수] 보호자(법정대리인)에게 동의를 받았어요</Check>}
        <details className="mt-2 text-[11.5px] leading-relaxed text-sub">
          <summary className="cursor-pointer select-none">무엇을 모으나요?</summary>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
            <li>모으는 것: Google 이메일, 닉네임, 학년, 관심사, 질문과 대화 기록</li>
            <li>쓰는 곳: 코치 답변을 맞추고, 기록 · 리포트를 이어서 보여 주는 데만</li>
            <li>지우기: 탈퇴하면 계정과 기록을 모두 바로 지워요</li>
          </ul>
        </details>
      </section>

      {error && <p role="alert" className="rounded-xl border border-[#fb7185] bg-[#2a1220] px-3 py-2 text-[13px] text-[#fda4af]">{error}</p>}

      <button type="button" onClick={submit} disabled={!ready || busy} className="w-full rounded-xl bg-clay py-3.5 text-[15px] font-extrabold text-paper active:opacity-80 disabled:opacity-40">
        {busy ? "가입하는 중…" : "가입 완료"}
      </button>
    </div>
  );
}

// ③ 내 계정
function Me({ user, picture }: { user: Member; picture: string | null }) {
  const { go, confirm } = useApp();
  const [grade, setGrade] = useState(user.grade);
  const [msg, setMsg] = useState("");

  const saveGrade = async (g: string) => {
    setGrade(g);
    try {
      await updateMe({ grade: g });
      setMsg("학년을 바꿨어요.");
    } catch (e) {
      setGrade(user.grade);
      setMsg((e as Error).message);
    }
  };

  const leave = async () => {
    const yes = await confirm({ emoji: "👋", title: "정말 탈퇴할까?", body: "서버에 저장된 계정과 질문 기록이 모두 지워지고 되돌릴 수 없어. 확인을 위해 Google 로그인 창이 한 번 더 떠.", ok: "탈퇴하기", danger: true });
    if (!yes) return;
    try {
      if (await deleteAccount()) go({ name: "chat" });
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      <section className="flex items-center gap-3 rounded-2xl border-2 border-line bg-card p-4">
        <Avatar src={picture} name={user.nickname} size={56} />
        <div className="min-w-0">
          <p className="truncate text-[17px] font-extrabold">{user.nickname} <span className="text-xs font-normal text-sub">· {user.grade}</span></p>
          <p className="truncate text-xs text-sub">{user.email}</p>
          <p className="mt-1 text-[11px] text-gold">✓ 가입 완료 · {new Date(user.createdAt).toLocaleDateString("ko-KR")}</p>
        </div>
      </section>

      <Field label="학년">
        <Chips options={onboarding.grades} isOn={(g) => grade === g} onPick={saveGrade} />
      </Field>
      {msg && <p className="text-[12px] text-sub">{msg}</p>}

      <button type="button" onClick={() => go({ name: "chat" })} className="w-full rounded-xl bg-clay py-3 text-[15px] font-extrabold text-paper active:opacity-80">질문하러 가기</button>
      <div className="flex gap-2">
        <button type="button" onClick={() => signOut()} className="flex-1 rounded-xl border border-line py-2.5 text-sm font-bold active:bg-sand">로그아웃</button>
        <button type="button" onClick={leave} className="flex-1 rounded-xl border border-line py-2.5 text-sm text-sub active:bg-sand">탈퇴</button>
      </div>
    </div>
  );
}

// ── 작은 부품 ─────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[13px] font-bold">{label} {hint && <span className="text-[11px] font-normal text-sub">· {hint}</span>}</p>
      {children}
    </div>
  );
}

function Chips({ options, isOn, onPick }: { options: string[]; isOn: (o: string) => boolean; onPick: (o: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <Pick key={o} on={isOn(o)} onClick={() => onPick(o)} small>{o}</Pick>
      ))}
    </div>
  );
}

function Pick({ on, onClick, small, children }: { on: boolean; onClick: () => void; small?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`rounded-xl border font-bold ${small ? "px-3.5 py-2 text-[13px]" : "py-3 text-sm"} ${on ? "border-clay bg-clay-soft text-clay" : "border-line bg-card text-ink active:bg-sand"}`}>
      {children}
    </button>
  );
}

function Check({ on, onClick, strong, children }: { on: boolean; onClick: () => void; strong?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} onClick={onClick} className={`flex w-full items-center gap-2.5 rounded-lg px-1 py-1.5 text-left ${strong ? "text-[14px] font-extrabold" : "text-[13px]"}`}>
      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[12px] ${on ? "border-clay bg-clay text-paper" : "border-line"}`}>{on ? "✓" : ""}</span>
      {children}
    </button>
  );
}

export function Avatar({ src, name, size = 40 }: { src: string | null; name: string; size?: number }) {
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
