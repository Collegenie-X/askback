"use client";

import { useEffect, useState } from "react";
import formats from "@/data/formats.json";
import Buddy from "../Buddy";
import { FormatArt, Glyph, PersonaArt, SceneArt } from "./AboutArt";

// 탭은 스스로 넘어가다가, 한 번 누르면 멈춘다
function useAutoTab(count: number, ms: number) {
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setI((v) => (v + 1) % count), ms);
    return () => clearInterval(t);
  }, [auto, count, ms]);
  return [i, (n: number) => { setAuto(false); setI(n); }, auto] as const;
}

const tabBtn = (on: boolean) => `tab shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-bold transition ${on ? "on" : ""}`;

/* ── 왜 필요한가: 여덟 장면을 네 묶음으로 ─────────────────── */
const SCENE_GROUPS = [
  { label: "🔢 숫자와 범위", scenes: [
    { art: "copy", title: "베낀 숫자", now: "“400 밑이면” — 예제에서 베낀 숫자를 AI는 그대로 만들어 준다.", fix: "🙋 “그 400은 어디서 왔어?” → 직접 재 온다 (320 · 610)" },
    { art: "bomb", title: "기능 폭탄", now: "“앱 만들어줘” → 기능 10개가 쏟아진다. 뭐부터 할지 더 모른다.", fix: "체크 칸 4개 · “일부러 안 만들 기능 하나는?”" },
  ] },
  { label: "🧠 이해와 구조", scenes: [
    { art: "mute", title: "돌아가는데 설명을 못 한다", now: "코드는 돈다. “센서가 빠지면?”에는 답이 없다.", fix: "상태표 · 순서도로 답 + 🧭 “값이 계속 0이면?”" },
    { art: "redo", title: "고장 나면 통째로 다시", now: "안 되면 “다시 만들어줘”. 어디가 틀렸는지 모른다.", fix: "모든 답에 “확인하는 법” · 한 단씩 붙이기" },
  ] },
  { label: "⚖️ 판단", scenes: [
    { art: "chip", title: "확장 = AI 붙이기라는 착각", now: "뭐든 AI · 서버부터 붙이려 한다.", fix: "“3명 이상이면 확정” 같은 규칙 먼저 · ‘하지 않는다’도 대안" },
    { art: "judge", title: "AI가 대신 정해 버린다", now: "목표 · 기준 · 선택까지 추천을 그대로 받는다.", fix: "🫵 네가 정할 것 · 📌 AI가 가정한 것을 나눠 보여 준다" },
  ] },
  { label: "📄 기록과 거울", scenes: [
    { art: "nodoc", title: "남는 문서가 없다", now: "대화창만 남는다. 수행평가에 쓸 것이 없다.", fix: "✅ 초안에 적기 → 기획서.md · 전체 기록.md" },
    { art: "clock", title: "돌아볼 거울이 늦다", now: "학기 말 평가로는 질문 습관을 못 고친다.", fix: "질문 10개마다 8칸 리포트 · 미션 하나" },
  ] },
];

export function SceneTabs() {
  const [i, pick] = useAutoTab(SCENE_GROUPS.length, 5200);
  const g = SCENE_GROUPS[i];
  return (
    <div>
      <div role="tablist" className="noscroll flex gap-2 overflow-x-auto pb-1">
        {SCENE_GROUPS.map((x, n) => <button key={x.label} role="tab" aria-selected={n === i} type="button" onClick={() => pick(n)} className={tabBtn(n === i)}>{x.label}</button>)}
      </div>
      <div key={i} className="mt-4 grid gap-3 md:grid-cols-2">
        {g.scenes.map((s, n) => (
          <div key={s.title} className="tilecard swap overflow-hidden" style={{ animationDelay: `${n * 0.12}s` }}>
            <div className="scene-stage px-6 pt-5"><div className="mx-auto max-w-[380px]"><SceneArt name={s.art} /></div></div>
            <div className="p-5">
              <p className="text-[11px] font-extrabold text-sub">장면 {i * 2 + n + 1}</p>
              <h3 className="mt-0.5 text-lg font-extrabold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-sub"><b className="text-[#fb7185]">지금은 </b>{s.now}</p>
              <p className="mt-3 rounded-xl bg-mint-soft px-3.5 py-2.5 text-[13.5px] font-semibold leading-snug text-mint">{s.fix}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 누구에게: 네 고객군 — 안쪽 궤도부터 ─────────────────── */
const AUDIENCES = [
  { who: "student" as const, color: "#60a5fa", tab: "🧑‍🚀 중학생", title: "중학생 · 프로젝트 학급", lead: "자유학기 · 메이커 · 사회참여 동아리 — 가장 절실한 자리",
    pains: ["베낀 숫자로 만든다", "돌아가는데 설명을 못 한다", "고장 나면 통째로 다시 시킨다", "쓰면 의심받고, 남는 문서가 없다"],
    gains: ["“그 400은 어디서 왔어?” → 직접 잰 내 숫자가 생긴다", "발표에서 “센서가 빠지면요?”에 답할 수 있다", "기획서.md · 전체 기록이 남는다"],
    start: "예시 프로젝트를 통으로 읽고 → “코드 짜줘”로 시작해도 OK" },
  { who: "teacher" as const, color: "#a78bfa", tab: "👩‍🏫 교사", title: "교사 · 수행평가", lead: "2026 수행평가 AI 지침 — 과정을 증빙해야 하는 자리",
    pains: ["결과물만 보고 점수를 준다", "30명의 과정을 볼 시간이 없다", "AI 허용 범위를 정할 근거가 없다", "코딩 밖 프로젝트는 도구가 없다"],
    gains: ["학생은 평소처럼 묻기만 해도 전체 기록.md 가 쌓인다", "교사는 헤더의 🧩 n/4 와 10문 리포트만 본다", "논문 · 리서치 · 캠페인까지 같은 틀로"],
    start: "/demo 로 계정 없이 교실 시연 → 자유학기 8차시" },
  { who: "school" as const, color: "#22d3ee", tab: "🛠 메이커 · 학원", title: "메이커스페이스 · 코딩 학원", lead: "바이브 코딩 수업의 앞 2차시 — 코딩 도구를 열기 전에",
    pains: ["복붙만 하고 끝난다", "안 되면 “다시 만들어줘”", "완성품은 있는데 설명이 없다"],
    gains: ["회로 · 화면을 사진으로 보여 주며 묻는다", "모든 답에 “확인하는 법” — 한 단씩 붙인다", "기획서 + 만드는 순서가 코딩 도구의 입력값이 된다"],
    start: "코딩 도구보다 먼저, 기획서 4칸부터" },
  { who: "parent" as const, color: "#34d399", tab: "👨‍👩‍👧 학부모", title: "학부모", lead: "막아야 하나, 둬야 하나 — 기특한데 불안한 자리",
    pains: ["아이가 AI로 뭔가 만드는데 물어볼 데가 없다", "아이가 자라는지 알 길이 없다"],
    gains: ["첫 질문과 지금의 질문을 나란히 본다", "아이가 자기 말로 쓴 기획서 한 장", "아이가 공유를 고르면 월간 요약 (준비 중)"],
    start: "아이와 함께 1번째 리포트 읽기" },
];

export function AudienceTabs() {
  const [i, pick] = useAutoTab(AUDIENCES.length, 6000);
  const a = AUDIENCES[i];
  const C = 150;
  return (
    <div className="grid items-center gap-6 lg:grid-cols-[320px_1fr]">
      {/* 궤도 — 안쪽부터 절실한 순서 */}
      <svg viewBox="0 0 300 300" role="img" aria-label="네 고객군이 안쪽 궤도부터 놓여 있다" className="mx-auto h-auto w-full max-w-[320px]" style={{ fontFamily: "inherit" }}>
        <circle cx={C} cy={C} r="20" fill="#fbbf24" className="ab-pulse" />
        <text x={C} y={C + 4} textAnchor="middle" fontSize="10" fontWeight="800" fill="#04060f">설계</text>
        {AUDIENCES.map((x, n) => {
          const r = 48 + n * 30;
          const ang = (-50 + n * 95) * (Math.PI / 180);
          const px = C + Math.cos(ang) * r, py = C + Math.sin(ang) * r;
          const on = n === i;
          return (
            <g key={x.title} onClick={() => pick(n)} className="cursor-pointer">
              <circle cx={C} cy={C} r={r} fill="none" stroke={on ? x.color : "#2c2c46"} strokeWidth={on ? 2.4 : 1.2} strokeDasharray={on ? undefined : "3 6"} style={{ transition: "stroke 0.3s" }} />
              <circle cx={px} cy={py} r={on ? 17 : 11} fill={x.color} opacity={on ? 1 : 0.55} className={on ? "neon" : undefined} style={{ transition: "r 0.3s, opacity 0.3s", ["--neon" as string]: `${x.color}99` }} />
              {on && <circle cx={px} cy={py} r="24" fill="none" stroke={x.color} className="ab-pulse" />}
              <text x={px} y={py + 4.500} textAnchor="middle" fontSize={on ? 13 : 10} fontWeight="800" fill="#04060f">{n + 1}</text>
            </g>
          );
        })}
      </svg>

      <div>
        <div role="tablist" className="noscroll flex gap-2 overflow-x-auto pb-1">
          {AUDIENCES.map((x, n) => <button key={x.tab} role="tab" aria-selected={n === i} type="button" onClick={() => pick(n)} className={tabBtn(n === i)}>{x.tab}</button>)}
        </div>
        <div key={i} className="tilecard swap mt-4 p-5 sm:p-6" style={{ borderColor: `${a.color}88` }}>
          <div className="flex items-center gap-4">
            <div className="w-[120px] shrink-0 sm:w-[150px]"><PersonaArt who={a.who} /></div>
            <div>
              <p className="text-[11px] font-extrabold" style={{ color: a.color }}>궤도 {i + 1}</p>
              <h3 className="text-xl font-extrabold sm:text-2xl">{a.title}</h3>
              <p className="mt-1 text-[13px] font-semibold leading-snug text-sub">{a.lead}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#fb718555] bg-[#2a0f1655] p-4">
              <p className="text-xs font-extrabold text-[#fb7185]">지금은</p>
              <ul className="mt-2 space-y-1.5 text-[13.5px] leading-snug">{a.pains.map((p) => <li key={p} className="flex gap-2"><span className="text-[#fb7185]">✕</span>{p}</li>)}</ul>
            </div>
            <div className="rounded-2xl border border-[#34d39955] bg-mint-soft p-4">
              <p className="text-xs font-extrabold text-mint">AskBack이 있으면</p>
              <ul className="mt-2 space-y-1.5 text-[13.5px] leading-snug">{a.gains.map((p) => <li key={p} className="flex gap-2"><span className="text-mint">✓</span>{p}</li>)}</ul>
            </div>
          </div>
          <p className="mt-4 rounded-xl bg-sand px-3.5 py-2.5 text-[13px] font-semibold"><span className="text-clay">🚀 이렇게 시작 · </span>{a.start}</p>
        </div>
      </div>
    </div>
  );
}

/* ── 사용법: 다섯 정거장을 돌면 가운데에서 리포트가 뜬다 ───── */
const CYCLE = [
  { emoji: "🧩", color: "#a855f7", title: "형식 선택", short: "형식 선택", tag: "논문 · 리서치 · 캠페인 · 서비스 · 제품", click: "＋ 새 프로젝트 → 다섯 형식 중 하나",
    does: ["이름 한 줄이면 프로젝트가 만들어져요", "형식이 채울 칸 4개와 질문 버튼을 정해 줘요", "가입 · 비밀번호 없음 — 기록은 이 기기에 저장"], left: "빈 체크 칸 4개" },
  { emoji: "💬", color: "#60a5fa", title: "질문 입력", short: "질문 입력", tag: "글 · 📷 사진 3장 · 🎙 말로", click: "입력창 옆 💡 → ___ 빈칸만 채우기",
    does: ["뭘 물을지 모르겠으면 💡 트레이의 질문 초안", "회로 · 화분 · 화면은 사진으로 보여 주며 묻기", "“코드 짜줘”로 시작해도 괜찮아요"], left: "질문의 폭 O1~O5 · AI 역할 배지" },
  { emoji: "📐", color: "#34d399", title: "최선의 명세 + 🙋 되묻기", short: "명세 + 되묻기", tag: "답은 아끼지 않는다", click: "답 아래 [자세히 ▾] · 🌅 넓히기 · 🔀 대안 칩",
    does: ["규칙 카드 · 상태표 · 순서도 · 비교표로 바로 답해요", "🫵 네가 정할 것 · 📌 AI가 가정한 것을 나눠 보여 줘요", "답 끝의 되물음에는 직접 재 온 값으로 답하기"], left: "내 숫자 — 마른 흙 320 · 젖은 흙 610" },
  { emoji: "🧭", color: "#f472b6", title: "이해의 확인 — 2문 1역", short: "이해 확인 · 2문 1역", tag: "5초 고르기부터 30초 서술까지", click: "역질문 카드 → 💡 힌트 · 📎 예시 · [나중에]",
    does: ["두 번 물으면 한 번, 알고리즘을 진짜 아는지 물어요", "막히면 힌트 3단. “모르겠어”도 탓하지 않아요", "물을 게 없으면 억지로 묻지 않아요"], left: "이해 기록 (학생에겐 색으로만)" },
  { emoji: "✅", color: "#fbbf24", title: "내 말로 채우는 기획서", short: "기획서 채우기", tag: "기획서.md", click: "답 아래 ✅ 초안에 적기 → 칸 고르기",
    does: ["마음을 정했으면 내 말로 한두 줄", "🧩 1/4 → 4/4, 헤더에서 진행이 보여요", "⬇️ 초안.md 를 Cursor · Claude Code · Replit에 붙여넣기"], left: "기획서.md · 전체 기록.md" },
  { emoji: "📊", color: "#67e8f9", title: "10문 리포트 & 미션", short: "10문 리포트", tag: "질문 10개마다 자동으로", click: "🎉 알약 또는 대화 속 📄 카드",
    does: ["늘 같은 8칸 — 읽는 법은 한 번만 배워요", "다음 미션 하나: “다음엔 대안을 물어봐”", "리포트 한 장마다 별이 Lv +1 · 한 달이면 월간 처방"], left: "프로젝트 · N번째 리포트" },
];

export function OrbitCycle() {
  const [i, pick] = useAutoTab(CYCLE.length, 4200);
  const s = CYCLE[i];
  const C = 200, R = 140;
  const pos = (n: number) => { const a = (-90 + n * 72) * (Math.PI / 180); return [C + Math.cos(a) * R, C + Math.sin(a) * R]; };
  const ring = `M${C} ${C - R}A${R} ${R} 0 1 1 ${C - 0.01} ${C - R}`;
  return (
    <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      <svg viewBox="0 0 400 400" role="img" aria-label="다섯 정거장을 도는 궤도와 가운데의 10문 리포트" className="mx-auto h-auto w-full max-w-[420px]" style={{ fontFamily: "inherit" }}>
        <circle cx={C} cy={C} r={R + 34} fill="none" stroke="#2c2c46" strokeDasharray="2 8" />
        <path d={ring} fill="none" stroke="#2c2c46" strokeWidth="3" />
        <path d={ring} fill="none" stroke="#a78bfa" strokeWidth="3" className="ab-dash" opacity="0.7" />
        <g><animateMotion dur="14s" repeatCount="indefinite" path={ring} rotate="auto" /><path d="M-9 -6L9 0L-9 6L-5 0z" fill="#fff" /><path d="M-9 0h-10" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" className="ab-tw" /></g>
        {CYCLE.slice(0, 5).map((x, n) => <path key={n} d={`M${C} ${C}L${pos(n)[0]} ${pos(n)[1]}`} stroke="#2c2c46" strokeDasharray="3 6" />)}
        {/* 가운데 — 리포트 */}
        <g onClick={() => pick(5)} className="cursor-pointer">
          <circle cx={C} cy={C} r="62" fill="#67e8f9" opacity={i === 5 ? 0.22 : 0.08} className="ab-pulse" />
          <path d={`M${C} ${C - 52}l45 26v52l-45 26-45-26v-52z`} fill="#11112a" stroke={i === 5 ? "#67e8f9" : "#4a4a78"} strokeWidth={i === 5 ? 3 : 1.6} />
          <text x={C} y={C - 6} textAnchor="middle" fontSize="14" fontWeight="800" fill="#ffffff">10문 리포트</text>
          <text x={C} y={C + 14} textAnchor="middle" fontSize="14" fontWeight="800" fill="#67e8f9">&amp; 미션</text>
        </g>
        {CYCLE.slice(0, 5).map((x, n) => {
          const [px, py] = pos(n);
          const on = n === i;
          return (
            <g key={x.title} onClick={() => pick(n)} className="cursor-pointer">
              {on && <circle cx={px} cy={py} r="40" fill={x.color} opacity="0.2" className="ab-pulse" />}
              <circle cx={px} cy={py} r={on ? 32 : 25} fill="#0b0b16" stroke={x.color} strokeWidth={on ? 3.4 : 1.8} className={on ? "neon" : undefined} style={{ transition: "r 0.3s", ["--neon" as string]: `${x.color}99` }} />
              <text x={px} y={py + 8} textAnchor="middle" fontSize={on ? 24 : 19}>{x.emoji}</text>
              <circle cx={px + (on ? 24 : 19)} cy={py - (on ? 24 : 19)} r="10" fill={x.color} />
              <text x={px + (on ? 24 : 19)} y={py - (on ? 24 : 19) + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill="#04060f">{n + 1}</text>
              <text x={px} y={n === 0 ? py - 40 : py + (on ? 50 : 43)} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={on ? x.color : "#c9c9e6"} stroke="#0b0b16" strokeWidth="4" paintOrder="stroke" strokeLinejoin="round" style={{ transition: "fill 0.3s" }}>{x.short}</text>
            </g>
          );
        })}
      </svg>

      <div>
        <div role="tablist" className="noscroll flex gap-1.5 overflow-x-auto pb-1">
          {CYCLE.map((x, n) => <button key={x.title} role="tab" aria-selected={n === i} type="button" onClick={() => pick(n)} className={tabBtn(n === i)}>{n < 5 ? n + 1 : "★"} {x.emoji}</button>)}
        </div>
        <div key={i} className="tilecard swap mt-4 p-5 sm:p-6" style={{ borderColor: `${s.color}88` }}>
          <p className="text-[11px] font-extrabold tracking-wider" style={{ color: s.color }}>{i < 5 ? `정거장 ${i + 1} / 5` : "궤도의 중심"}</p>
          <h3 className="mt-1 text-xl font-extrabold sm:text-2xl">{s.emoji} {s.title}</h3>
          <p className="mt-1 text-[13px] font-semibold text-sub">{s.tag}</p>
          <p className="mt-4 rounded-xl border border-line bg-void px-3.5 py-2.5 text-[13px] font-semibold"><span className="text-sub">누르는 곳 · </span>{s.click}</p>
          <ul className="mt-3 space-y-2">
            {s.does.map((d, n) => <li key={d} className="swap flex gap-2.5 text-sm leading-snug" style={{ animationDelay: `${0.15 + n * 0.12}s` }}><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: s.color }} />{d}</li>)}
          </ul>
          <p className="mt-4 inline-block rounded-full px-3 py-1 text-xs font-extrabold text-void" style={{ background: s.color }}>남는 것 · {s.left}</p>
        </div>
      </div>
    </div>
  );
}

/* ── 다섯 형식 탐색기 ─────────────────────────────────── */
const FORMAT_GLYPH: Record<string, string> = { paper: "paper", research: "search", campaign: "clapper", service: "browser", product: "robot" };
const FORMAT_EX: Record<string, { project: string; q: string; back: string; fill: string }> = {
  paper: { project: "교실 조명과 집중", q: "내 주제는 교실 조명 색이야. 확인할 수 있는 연구 질문 한 문장으로 좁히고 싶어.", back: "‘집중했다’는 걸 너는 뭘 보고 알 수 있어?", fill: "주황빛 스탠드를 켜면 수학 문제 10개를 푸는 시간이 줄어들까?" },
  research: { project: "학교 앞 횡단보도 대기 시간", q: "등교 시간 신호 대기를 알아보고 싶어. 누구를 조사해야 쓸모 있는 답이 나올까?", back: "이 결과가 나오면 누가 무엇을 다르게 결정할 수 있어?", fill: "후문으로 등교하는 1학년 · 결과는 학생회 건의에 쓴다" },
  campaign: { project: "비닐봉지 안 받기 30초 영상", q: "일회용 비닐 문제를 알리고 싶어. 본 사람이 딱 하나 바꿀 행동을 뭘로 잡을까?", back: "네가 마지막으로 편의점에서 봉지를 받은 건 언제야? 왜 받았어?", fill: "하교길 편의점에서 ‘봉지 괜찮아요’라고 말한다" },
  service: { project: "🍱 급식 잔반 예측기", q: "급식 메뉴 보고 맛있다/별로다 투표하는 웹페이지 만들어줘. 버튼 두 개면 돼.", back: "이 비율을 모아서 결국 뭘 알고 싶은 거야?", fill: "내일 밥을 얼마나 할지 정하는 영양사 선생님" },
  product: { project: "🌱 스마트 화분", q: "흙 센서값이 400 밑이면 펌프 3초 켜는 코드 짜줘.", back: "400이라는 숫자는 어디서 왔어? ‘마른 값’과 ‘젖은 값’을 직접 본 적 있어?", fill: "흙이 400보다 마르면 550이 될 때까지, 길어도 5초만 물을 준다" },
};

export function FormatExplorer() {
  const keys = Object.keys(formats.formats) as (keyof typeof formats.formats)[];
  const [i, pick] = useAutoTab(keys.length, 7000);
  const key = keys[i];
  const f = formats.formats[key];
  const ex = FORMAT_EX[key];
  return (
    <div>
      <div role="tablist" className="noscroll flex gap-2 overflow-x-auto pb-1">
        {keys.map((k, n) => {
          const x = formats.formats[k];
          return (
            <button key={k} role="tab" aria-selected={n === i} type="button" onClick={() => pick(n)} className={`${tabBtn(n === i)} flex items-center gap-2`} style={n === i ? { background: x.color, borderColor: x.color } : undefined}>
              <Glyph name={FORMAT_GLYPH[k]} size={18} />{x.name}
            </button>
          );
        })}
      </div>
      <div key={key} className="tilecard swap mt-4 grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_1fr]" style={{ borderColor: `${f.color}88` }}>
        <div>
          <p className="text-[11px] font-extrabold" style={{ color: f.color }}>이 형식에서 “설계”란</p>
          <h3 className="mt-0.5 text-xl font-extrabold">{f.emoji} {f.name}</h3>
          <p className="mt-1 text-[13px] text-sub">초안 = {f.draft}</p>
          <div className="scene-stage mt-4 rounded-2xl p-3"><FormatArt name={key} color={f.color} /></div>
        </div>
        <div className="flex flex-col">
          <p className="text-[11px] font-extrabold text-sub">첫 질문이 첫 칸이 되기까지 · {ex.project}</p>
          <p className="swap ml-auto mt-2 max-w-[92%] rounded-2xl rounded-br-md bg-student px-3.5 py-2.5 text-[13.5px] font-semibold leading-snug" style={{ animationDelay: "0.2s" }}>{ex.q}</p>
          <p className="swap mt-2 max-w-[92%] rounded-2xl rounded-bl-md border border-clay bg-clay-soft px-3.5 py-2.5 text-[13.5px] font-semibold leading-snug text-clay" style={{ animationDelay: "0.9s" }}>🙋 {ex.back}</p>
          <ol className="mt-4 space-y-2">
            {f.checks.map((c, n) => (
              <li key={c.key} className="swap flex items-start gap-2.5 rounded-xl border px-3 py-2.5" style={{ animationDelay: `${1.5 + n * 0.15}s`, borderColor: n === 0 ? f.color : "var(--color-line)", background: n === 0 ? `${f.color}1a` : "transparent" }}>
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[11px] font-extrabold" style={{ borderColor: f.color, color: n === 0 ? "#04060f" : f.color, background: n === 0 ? f.color : "transparent" }}>{n === 0 ? "✓" : n + 1}</span>
                <span className="min-w-0 text-[13.5px]"><b>{c.label}</b>{n === 0 && <span className="block text-[13px] leading-snug text-sub">“{ex.fill}”</span>}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs leading-snug text-sub">🧭 전용 역질문 · {f.rq.map((r) => r.name).join(" · ")}</p>
        </div>
      </div>
    </div>
  );
}

/* ── 질문이 자라는 여섯 단계 — 별이가 계단을 오른다 ────────── */
const STEPS = [
  { title: "시킨다", color: "#a8a8c0", quote: "“코드 짜줘”", who: "누구나 여기서 시작", push: "⌨️ 받아쓰기 · 👨‍💻 코더 배지" },
  { title: "재 온다", color: "#67e8f9", quote: "“30분은 그냥 감이었어. 5분마다 찍어 보니 20분째부터 고개가 나가 있었어”", who: "서연 · 🐢 거북목 감시 웹캠", push: "🙋 열린 되묻기" },
  { title: "조건을 싣는다", color: "#34d399", quote: "“목표는 상추가 안 마르는 것, 제약은 5V 펌프에 다음 주 시연이야”", who: "민준 · 🌱 스마트 화분", push: "🌅 넓히기 칩의 ___ 빈칸" },
  { title: "다른 길을 묻는다", color: "#f472b6", quote: "“장난 제보를 막는 방법이 뭐뭐 있어? 각각 뭘 잃어?”", who: "서윤 · 🚸 위험 등굣길 지도", push: "🔀 대안 칩 · 리포트의 미션" },
  { title: "기준을 먼저 세운다", color: "#a855f7", quote: "“틀린다면 일반쓰레기 쪽으로 틀리는 게 나아”", who: "하린 · ♻️ 분리배출 사진 판별기", push: "🧭 역질문 — 기준 · 검증" },
  { title: "남에게 건넨다", color: "#fbbf24", quote: "“후배가 나 없이도 돌릴 수 있게 하려면 뭘 넘겨야 해?”", who: "지우 · 🍱 급식 잔반 예측기", push: "📣 공유 · 🤝 협력 팩" },
];

export function GrowStairs() {
  const [i, pick] = useAutoTab(STEPS.length, 3600);
  const s = STEPS[i];
  const W = 116;
  const top = (n: number) => 236 - n * 36;
  return (
    <div>
      <div className="relative rounded-[20px] border border-line bg-card p-3 sm:p-5">
        <svg viewBox="0 0 720 300" role="img" aria-label="질문이 자라는 여섯 단계 계단" className="h-auto w-full" style={{ fontFamily: "inherit" }}>
          <defs><linearGradient id="st-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#17172a" /><stop offset="1" stopColor="#07070f" /></linearGradient></defs>
          {STEPS.map((x, n) => {
            const px = 12 + n * W, py = top(n), on = n <= i;
            return (
              <g key={x.title} onClick={() => pick(n)} className="cursor-pointer">
                <rect x={px} y={py} width={W} height={290 - py} fill="url(#st-fade)" stroke="#2c2c46" />
                <rect x={px} y={py} width={W} height={290 - py} fill={x.color} opacity={n === i ? 0.22 : on ? 0.08 : 0} style={{ transition: "opacity 0.4s" }} />
                <rect x={px} y={py} width={W} height="6" fill={x.color} opacity={on ? 1 : 0.35} style={{ transition: "opacity 0.4s" }} />
                <text x={px + W / 2} y="280" textAnchor="middle" fontSize="22" fontWeight="800" fill={on ? x.color : "#2c2c46"}>{n + 1}</text>
              </g>
            );
          })}
          <path d="M70 200C220 180 440 110 650 22" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="2 8" strokeLinecap="round" opacity="0.6" />
        </svg>
        {/* 별이 — 지금 단계 위에 서 있다 */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-full p-3 sm:p-5">
          <div className="relative h-full w-full">
            <div className="absolute -translate-x-1/2 -translate-y-full" style={{ left: `${((12 + i * W + W / 2) / 720) * 100}%`, top: `${(top(i) / 300) * 100}%`, transition: "left 0.7s cubic-bezier(0.3, 1.4, 0.5, 1), top 0.7s cubic-bezier(0.3, 1.4, 0.5, 1)" }}>
              <div className="ab-float w-[44px] sm:w-[64px] [&>svg]:h-auto [&>svg]:w-full"><Buddy level={i + 1} size={64} /></div>
            </div>
          </div>
        </div>
      </div>
      <div key={i} className="tilecard swap mt-3 p-5" style={{ borderColor: `${s.color}88` }}>
        <p className="flex flex-wrap items-center gap-2 text-sm font-extrabold">
          <span className="grid h-7 w-7 place-items-center rounded-full text-[13px] text-void" style={{ background: s.color }}>{i + 1}</span>
          <span className="text-lg">{s.title}</span>
          <span className="rounded-full bg-sand px-2.5 py-1 text-[11px] text-sub">미는 장치 · {s.push}</span>
        </p>
        <p className="mt-3 text-base font-bold leading-snug sm:text-lg">{s.quote}</p>
        <p className="mt-1.5 text-xs text-sub">— {s.who} (앱의 예시 프로젝트)</p>
      </div>
      <div className="mt-3 flex justify-center gap-1.5">{STEPS.map((x, n) => <button key={x.title} type="button" aria-label={`${n + 1}단계 ${x.title}`} onClick={() => pick(n)} className="h-2 rounded-full transition-all" style={{ width: n === i ? 28 : 10, background: n === i ? x.color : "var(--color-line)" }} />)}</div>
    </div>
  );
}
