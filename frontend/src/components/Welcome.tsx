"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useAccount } from "@/lib/account";
import { createProject } from "@/lib/actions";
import { useApp } from "./AppContext";
import Buddy from "./Buddy";

// 첫 화면 = 사용 설명서. 예전 온보딩처럼 한 화면에 한 가지씩, 탭하면 다음 칸으로 넘어간다.
// 다섯 칸 — 템플릿 → 질문 버튼 → 답 + 열린 질문 → 되묻기 → 리포트 · 기획서. 마지막 칸에서 템플릿(형식) 고르기로 보낸다.
// 그림은 실제 채팅 화면을 줄여 그린 커스텀 SVG (밤하늘 팔레트).
const G = "#ffc83d", M = "#5ad1b3", P = "#ff7ac8", B = "#5c9dff", V = "#c08bff", C = "#7fdcff", O = "#ff9f43";
const BG = "#1d1846", BG2 = "#141033", LN = "#3d3672", TX = "#f2f4ff", SUB = "#9aa0d0";

function Frame({ id, c, children }: { id: string; c: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 240 170" className="h-auto w-full max-w-[400px]" aria-hidden>
      <defs>
        <radialGradient id={`gl-${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={c} stopOpacity="0.32" />
          <stop offset="1" stopColor={c} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`card-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#241e57" />
          <stop offset="1" stopColor={BG2} />
        </linearGradient>
      </defs>
      <ellipse cx="120" cy="88" rx="118" ry="80" fill={`url(#gl-${id})`} />
      {[[18, 22], [222, 30], [30, 150], [214, 148], [120, 8]].map(([x, y], i) => (
        <circle key={i} className="tw" cx={x} cy={y} r={i % 2 ? 1.2 : 1.8} fill={TX} opacity="0.6" />
      ))}
      {children}
    </svg>
  );
}

const Hand = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x} ${y})`}>
    {/* CSS 애니메이션의 transform 이 위치를 덮어쓰지 않게 한 겹 안쪽에서 흔든다 */}
    <g className="ob-bob">
      <path d="M0 0l10 24 4.5-9 10 7 4.5-4.5-9.5-7.5 10-4.5z" fill={TX} stroke={BG2} strokeWidth="1.6" strokeLinejoin="round" />
    </g>
  </g>
);

// 1. 템플릿 — 다섯 형식 카드, 하나가 떠오르며 체크
function PickArt() {
  const tiles = [
    { e: "📄", n: "논문", c: V },
    { e: "🔎", n: "리서치", c: M },
    { e: "📣", n: "캠페인", c: O },
    { e: "💻", n: "서비스", c: B },
    { e: "🤖", n: "제품", c: C },
  ];
  return (
    <Frame id="pick" c={G}>
      <rect x="14" y="30" width="212" height="112" rx="16" fill="url(#card-pick)" stroke={LN} strokeWidth="1.2" />
      <text x="28" y="50" fontSize="9" fontWeight="800" fill={SUB}>① 무엇으로 만들 거야?</text>
      {tiles.map((t, i) => {
        const on = i === 3;
        const x = 24 + i * 40;
        const y = on ? 60 : 66;
        return (
          <g key={t.n} className={on ? "ob-pop" : "rise"} style={{ animationDelay: `${0.08 * i}s` }}>
            <rect x={x} y={y} width="34" height="50" rx="9" fill={on ? `${t.c}30` : BG} stroke={t.c} strokeWidth={on ? 2.4 : 1.1} strokeOpacity={on ? 1 : 0.55} />
            <text x={x + 17} y={y + 24} textAnchor="middle" fontSize="15">{t.e}</text>
            <text x={x + 17} y={y + 40} textAnchor="middle" fontSize="7.5" fontWeight="800" fill={t.c}>{t.n}</text>
          </g>
        );
      })}
      <g className="ob-pop" style={{ animationDelay: "0.5s" }}>
        <circle cx="178" cy="60" r="8" fill={G} />
        <path d="M174 60l3 3 5-6" fill="none" stroke={BG2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <rect x="28" y="122" width="184" height="12" rx="6" fill={BG} stroke={LN} />
      <text x="36" y="131" fontSize="7" fontWeight="700" fill={SUB}>질문 버튼 · 채울 칸 · 되묻는 것이 형식에 맞춰져</text>
      <Hand x={172} y={102} />
    </Frame>
  );
}

// 2. 질문 버튼 — 빈칸에서 시작하지 않는다. 칩을 누르면 초안이 입력창에 들어온다
function ChipsArt() {
  const chips = [
    { t: "설계 묻기", c: V, w: 46 },
    { t: "형식 질문", c: SUB, w: 44 },
    { t: "확장", c: C, w: 28 },
    { t: "다듬기", c: SUB, w: 34 },
  ];
  let x = 18;
  return (
    <Frame id="chips" c={V}>
      <rect x="10" y="22" width="220" height="132" rx="16" fill="url(#card-chips)" stroke={LN} strokeWidth="1.2" />
      {/* 질문 바로 만들기 */}
      <g className="ob-pop">
        <rect x="18" y="32" width="58" height="18" rx="9" fill={`${P}22`} stroke={P} strokeWidth="1.2" />
        <text x="47" y="44.5" textAnchor="middle" fontSize="8" fontWeight="800" fill={P}>심화</text>
      </g>
      <text x="84" y="44.5" fontSize="7.5" fontWeight="700" fill={SUB}>렌즈를 고르면 깊은 질문이 나와</text>
      {chips.map((c, i) => {
        const cx = x;
        x += c.w + 5;
        const on = i === 0;
        return (
          <g key={c.t} className="rise" style={{ animationDelay: `${0.1 + i * 0.1}s` }}>
            <rect x={cx} y="60" width={c.w} height="18" rx="9" fill={on ? `${V}33` : BG} stroke={c.c} strokeWidth={on ? 1.8 : 1} />
            <text x={cx + c.w / 2} y="72.5" textAnchor="middle" fontSize="7.5" fontWeight="800" fill={on ? "#c6b5ff" : TX}>{c.t}</text>
          </g>
        );
      })}
      {/* 칩 → 입력창으로 초안이 내려온다 */}
      <path d="M45 80c0 14 10 18 26 22" fill="none" stroke={V} strokeWidth="1.6" strokeDasharray="3 3" />
      <path d="M68 98l6 4-7 2" fill="none" stroke={V} strokeWidth="1.6" strokeLinecap="round" />
      <rect x="18" y="104" width="22" height="22" rx="7" fill={G} />
      <text x="29" y="119" textAnchor="middle" fontSize="11">💡</text>
      <rect x="46" y="104" width="150" height="22" rx="11" fill={BG} stroke={V} strokeWidth="1.4" />
      <rect x="56" y="111" width="90" height="4" rx="2" fill="#c6b5ff" className="rise" style={{ animationDelay: "0.6s" }} />
      <rect x="56" y="118" width="54" height="3" rx="1.5" fill={SUB} opacity="0.7" className="rise" style={{ animationDelay: "0.7s" }} />
      <rect x="152" y="113" width="34" height="5" rx="2.5" fill={P} opacity="0.85" />
      <text x="169" y="131" textAnchor="middle" fontSize="6" fontWeight="800" fill={P}>빈칸 채우기</text>
      <circle cx="212" cy="115" r="11" fill={G} />
      <path d="M212 120v-9m-4 4l4-4 4 4" fill="none" stroke={BG2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <text x="120" y="146" textAnchor="middle" fontSize="7.5" fontWeight="700" fill={SUB}>누르면 질문 초안 → 고쳐서 보내기</text>
      <Hand x={64} y={73} />
    </Frame>
  );
}

// 3. 답 + 열린 질문 — 답은 끝까지, 끝에는 코치가 일부러 안 정한 "네가 정할 것"
function OpenArt() {
  return (
    <Frame id="open" c={M}>
      <rect x="132" y="12" width="96" height="22" rx="11" fill={B} />
      <text x="180" y="26.5" textAnchor="middle" fontSize="8" fontWeight="800" fill={TX}>물 주는 방법 알려 줘</text>
      <rect x="12" y="42" width="216" height="118" rx="16" fill="url(#card-open)" stroke={LN} strokeWidth="1.2" />
      <text x="22" y="58" fontSize="8" fontWeight="800" fill={TX}>방법 3개를 비교해 볼게</text>
      {[66, 74, 82].map((y, i) => (
        <g key={y} className="rise" style={{ animationDelay: `${0.1 + i * 0.1}s` }}>
          <rect x="22" y={y} width="8" height="4" rx="2" fill={[G, M, B][i]} />
          <rect x="34" y={y} width={[120, 96, 138][i]} height="4" rx="2" fill={LN} />
        </g>
      ))}
      <g className="ob-pop" style={{ animationDelay: "0.45s" }}>
        <rect x="22" y="94" width="196" height="58" rx="10" fill={`${M}1f`} stroke={M} strokeWidth="1.4" />
        <text x="30" y="107" fontSize="7.5" fontWeight="900" fill={M}>네가 정할 것 — 여기부턴 내가 대신 못 정해</text>
        <text x="32" y="122" fontSize="8" fontWeight="700" fill={TX}>· 흙이 얼마나 마르면 물을 줄까?</text>
        <text x="32" y="138" fontSize="8" fontWeight="700" fill={TX}>· 물이 넘치면 누가 알아야 해?</text>
      </g>
      <Hand x={176} y={118} />
    </Frame>
  );
}

// 4. 되묻기 — 두 번 물으면 한 번, 코치가 "왜?"를 묻고 내 말로 답한다
function AskBackArt() {
  return (
    <Frame id="back" c={P}>
      {[0, 1].map((i) => (
        <g key={i} className="rise" style={{ animationDelay: `${i * 0.15}s` }}>
          <rect x={120 - i * 4} y={14 + i * 28} width={104 + i * 4} height="22" rx="11" fill={B} />
          <text x={132 - i * 4} y={28.5 + i * 28} fontSize="8" fontWeight="900" fill={TX}>{i + 1}</text>
          <rect x={144 - i * 4} y={23 + i * 28} width={64} height="4" rx="2" fill={TX} opacity="0.85" />
        </g>
      ))}
      <g className="ob-pop" style={{ animationDelay: "0.35s" }}>
        <rect x="14" y="74" width="140" height="42" rx="14" fill={`${P}22`} stroke={P} strokeWidth="1.8" />
        <circle cx="34" cy="95" r="12" fill={P} />
        <text x="34" y="99" textAnchor="middle" fontSize="10" fontWeight="900" fill={BG2}>왜?</text>
        <text x="52" y="91" fontSize="8" fontWeight="900" fill={P}>되묻기</text>
        <text x="52" y="105" fontSize="7.5" fontWeight="700" fill={TX}>왜 그 방법을 골랐어?</text>
      </g>
      <path d="M154 96c22 0 34 10 36 26" fill="none" stroke={P} strokeWidth="1.8" strokeDasharray="3 3" />
      <g className="rise" style={{ animationDelay: "0.6s" }}>
        <rect x="92" y="126" width="132" height="32" rx="12" fill={`${M}22`} stroke={M} strokeWidth="1.6" />
        <text x="102" y="140" fontSize="7.5" fontWeight="900" fill={M}>내 말로 한 줄</text>
        <rect x="102" y="146" width="100" height="4" rx="2" fill={M} opacity="0.7" />
      </g>
      <g transform="translate(20 128)">
        <rect width="58" height="28" rx="10" fill={BG} stroke={G} strokeWidth="1.2" />
        <text x="29" y="13" textAnchor="middle" fontSize="8" fontWeight="900" fill={G}>2문 1역</text>
        <text x="29" y="23" textAnchor="middle" fontSize="6.5" fontWeight="700" fill={SUB}>리듬은 설정에서</text>
      </g>
    </Frame>
  );
}

// 5. 리포트 · 기획서 — 질문 10개 = 리포트 한 장, 7단계 기획 가이드가 한 단씩 오른다
function ReportArt() {
  const lv = ["🕯", "🔥", "🔦", "🚀"];
  return (
    <Frame id="rep" c={G}>
      {Array.from({ length: 10 }, (_, i) => (
        <circle key={i} className="ob-pop" style={{ animationDelay: `${i * 0.05}s` }} cx={30 + i * 20} cy="16" r="6" fill={G} />
      ))}
      <text x="120" y="34" textAnchor="middle" fontSize="7.5" fontWeight="800" fill={SUB}>질문 10개 → 리포트 한 장</text>
      <g className="rise" style={{ animationDelay: "0.4s" }}>
        <path d="M22 44h58l14 14v66H22z" fill="url(#card-rep)" stroke={LN} strokeWidth="1.4" />
        <path d="M80 44v14h14" fill="none" stroke={LN} strokeWidth="1.4" />
        <text x="30" y="62" fontSize="8" fontWeight="900" fill={TX}>리포트</text>
        {[72, 84, 96, 108].map((y, i) => (
          <g key={y}>
            <path d={`M30 ${y}l3 3 6-6`} fill="none" stroke={M} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="44" y={y - 1} width={[38, 30, 42, 24][i]} height="4" rx="2" fill={LN} />
          </g>
        ))}
      </g>
      <g className="ob-pop" style={{ animationDelay: "0.6s" }}>
        <rect x="102" y="48" width="52" height="62" rx="9" fill={`${G}22`} stroke={G} strokeWidth="1.5" />
        <text x="128" y="74" textAnchor="middle" fontSize="10" fontWeight="900" fill={G}>기획서</text>
        <text x="128" y="92" textAnchor="middle" fontSize="10" fontWeight="800" fill={TX}>.md</text>
      </g>
      <g transform="translate(164 42)">
        <text x="30" y="0" textAnchor="middle" fontSize="7" fontWeight="800" fill={SUB}>7단계 기획 가이드</text>
        {lv.map((e, i) => (
          <g key={e} className="rise" style={{ animationDelay: `${0.7 + i * 0.12}s` }}>
            <rect x={6 + i * 2} y={66 - i * 20} width={48 - i * 4} height="18" rx="9" fill={i === 3 ? `${O}33` : BG} stroke={i === 3 ? O : LN} strokeWidth="1.2" />
            <text x="30" y={79 - i * 20} textAnchor="middle" fontSize="9">{e}</text>
          </g>
        ))}
      </g>
      <text x="120" y="146" textAnchor="middle" fontSize="7.5" fontWeight="700" fill={SUB}>따로 정리할 필요 없어 — 물으면 저절로 쌓여</text>
    </Frame>
  );
}

type Step = { art: ReactNode; c: string; word: string; title: string; desc: string; tags: string[] };
const STEPS: Step[] = [
  { art: <PickArt />, c: G, word: "템플릿", title: "먼저 무엇을 만들지 골라", desc: "형식을 고르면 질문 버튼 · 채울 칸 · 코치가 되묻는 것이 그 형식에 맞춰져. 나중에 바꿔도 돼.", tags: ["논문", "리서치", "캠페인", "서비스", "제품"] },
  { art: <ChipsArt />, c: V, word: "질문 버튼", title: "빈칸에서 시작하지 않아", desc: "입력창 위 버튼을 누르면 질문 초안이 들어와. 고쳐서 보내기만 하면 돼. 💡를 누르면 더 많은 질문이 펼쳐져.", tags: ["설계 묻기", "형식 질문", "확장", "다듬기", "심화"] },
  { art: <OpenArt />, c: M, word: "열린 질문", title: "답은 끝까지, 정할 건 너에게", desc: "답은 숨기지 않고 끝까지 줘. 대신 답마다 코치가 일부러 안 정한 ‘네가 정할 것’이 붙어. 그 칸을 네 말로 정하면서 다음 질문을 이어 가면 돼.", tags: ["네가 정할 것", "열린 질문", "물음표로 끝나"] },
  { art: <AskBackArt />, c: P, word: "되묻기", title: "두 번 물으면 한 번, 내가 물어", desc: "‘왜 그렇게 했어?’에 네 말로 한 줄 답하면 설계가 네 것이 돼. 급할 땐 [나중에]로 넘겨도 괜찮아.", tags: ["되묻기", "2문 1역", "나중에"] },
  { art: <ReportArt />, c: G, word: "리포트", title: "물으면 저절로 기획서가 쌓여", desc: "질문 10개마다 리포트 한 장. 대화가 도는 동안 7단계 기획 가이드가 한 칸씩 차고, 기획서.md로 내보낼 수 있어.", tags: ["리포트", "불씨 → 봉화", ".md"] },
];

export default function Welcome({ onNewProject, onDemo }: { onNewProject: () => void; onDemo: () => void }) {
  const { go, openLogin } = useApp();
  const account = useAccount();
  // 처음엔 설명서를 건너뛰고 시작 칸(마지막 칸)부터 — "사용 설명서 보기"를 누를 때만 1칸부터 펼친다
  const [guide, setGuide] = useState(false);
  const [step, setStep] = useState(STEPS.length - 1);
  const s = STEPS[step];
  const last = step === STEPS.length - 1;
  const next = () => !last && setStep(step + 1);
  const free = () => {
    createProject({ name: "자유 질문", desc: "", emoji: "💬", packs: [] });
    go({ name: "chat" });
  };

  return (
    <>
      <div className="pointer-events-none absolute inset-0 -z-[1] bg-[#05041a]/90" />
      <div className="scroll flex min-h-0 flex-1 flex-col px-7 pb-[max(16px,env(safe-area-inset-bottom))] pt-5">
        {guide && <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center">
          {step === 0 ? (
            <span className="justify-self-start text-xs font-semibold text-clay">사용 설명서</span>
          ) : (
            <button type="button" className="justify-self-start text-xs font-semibold text-sub" onClick={() => setStep(step - 1)}>‹ 이전</button>
          )}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <button key={i} type="button" aria-label={`${i + 1}번째 칸`} onClick={() => setStep(i)} className={`h-1 rounded-full transition-all duration-300 ${i === step ? "w-7 bg-clay" : "w-3.5 bg-line"}`} />
            ))}
          </div>
          <button type="button" className={`justify-self-end text-xs font-semibold text-sub ${last ? "invisible" : ""}`} onClick={() => setStep(STEPS.length - 1)}>건너뛰기</button>
        </div>}

        <div
          key={step}
          className={`mx-auto flex w-full max-w-[440px] min-h-0 flex-1 flex-col items-center text-center ${last ? "" : "cursor-pointer"}`}
          {...(last ? {} : { role: "button", tabIndex: 0, onClick: next, onKeyDown: (e: React.KeyboardEvent) => (e.key === "Enter" || e.key === " ") && next() })}
        >
          <div className="rise flex w-full flex-1 items-center justify-center py-1">{s.art}</div>

          {guide && <p className="rise mt-2 text-[10px] font-extrabold tracking-[0.08em] text-sub">STEP {step + 1} / {STEPS.length}</p>}
          <p className="ob-pop text-[28px] font-black leading-tight tracking-tight" style={{ color: s.c, animationDelay: "0.1s" }}>{s.word}</p>
          <h1 className="rise mt-1 max-w-[340px] text-[18px] font-extrabold leading-snug [word-break:keep-all]" style={{ animationDelay: "0.2s" }}>{s.title}</h1>
          <p className="rise mt-2 max-w-[340px] text-[13.5px] leading-[1.7] text-sub [word-break:keep-all]" style={{ animationDelay: "0.3s" }}>{s.desc}</p>
          <ul className="mt-3 flex flex-wrap justify-center gap-1.5">
            {s.tags.map((t, i) => (
              <li key={t} className="ob-pop rounded-full border border-line bg-card px-2.5 py-1 text-[11.5px] font-bold" style={{ animationDelay: `${0.45 + i * 0.08}s` }}>{t}</li>
            ))}
          </ul>

          <div className="mt-auto w-full space-y-2 pt-5">
            {last ? (
              <>
                <div className="mb-3 flex items-center justify-center gap-2 text-left">
                  <Buddy level={1} size={44} />
                  <p className="text-[13px] font-bold [word-break:keep-all]">준비 끝! 무엇을 만들지부터 골라 볼까?</p>
                </div>
                <button type="button" onClick={onNewProject} className="w-full rounded-2xl bg-ink py-3.5 text-[15px] font-bold text-paper active:opacity-80">템플릿 고르고 시작하기</button>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={onDemo} className="rounded-2xl border border-clay py-2.5 text-[13px] font-bold text-clay">예시 먼저 보기</button>
                  <button type="button" onClick={free} className="rounded-2xl border border-line bg-card py-2.5 text-[13px] font-bold">그냥 물어볼래</button>
                </div>
                <div className="flex justify-center gap-4 pt-2 text-xs font-semibold text-sub">
                  <button type="button" onClick={() => { setGuide(true); setStep(0); }}>사용 설명서 보기</button>
                  <Link href="/about">소개 다시 보기</Link>
                  <button type="button" onClick={openLogin}>{account.status === "signedIn" ? account.user.nickname : "로그인"}</button>
                </div>
              </>
            ) : (
              <span className="mx-auto flex w-fit items-center gap-2 rounded-full border border-line bg-card px-4 py-1.5 text-[13px] font-semibold">
                <span className="dot" /> 탭하여 계속
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
