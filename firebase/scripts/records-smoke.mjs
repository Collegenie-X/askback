// 기록 저장(질문 · 답 · 되묻기) REST 를 에뮬레이터에 대고 시험한다.
//   npm run emulators   (다른 터미널)
//   node scripts/records-smoke.mjs
// 확인하는 것: 2문 1역 · 동기화(멱등) · 내보내기 JSON · PUT 201/200 · 404/422/400 · 남의 기록 못 봄
const API = process.env.API ?? "http://127.0.0.1:5001/demo-teenspark/asia-northeast3/api/v1";
const stamp = Date.now().toString(36);
let failed = 0;

async function call(method, path, { token, body, expect } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  const good = expect ? res.status === expect : res.ok;
  console.log(`${good ? "✅" : "❌"} ${method} ${path} → ${res.status}${json.error ? ` ${json.error.code}` : ""}${res.headers.get("location") ? ` (Location: ${res.headers.get("location")})` : ""}`);
  if (!good) {
    failed++;
    console.log("   ", JSON.stringify(json).slice(0, 500));
  }
  return json;
}
const check = (label, cond, extra = "") => {
  console.log(`${cond ? "✅" : "❌"} ${label}${extra ? ` — ${extra}` : ""}`);
  if (!cond) failed++;
};

const signup = async (who) =>
  (await call("POST", "/auth/signup", {
    body: { email: `${who}-${stamp}@teenspark.test`, password: "teenspark123", nickname: who, grade: "중2", interests: ["스마트팜"], under14: false, agreeTerms: true, agreePrivacy: true },
    expect: 201,
  })).data.tokens.idToken;

console.log(`API = ${API}\n`);
const token = await signup("rec");
const other = await signup("other");

console.log("\n— 1) 서버에서 묻기: 2문 1역");
const p = (await call("POST", "/projects", { token, body: { name: "스마트 화분", desc: "흙이 마르면 자동으로 물 주기", emoji: "🌱", format: "product" }, expect: 201 })).data;
const t1 = (await call("POST", `/projects/${p.id}/turns`, { token, body: { text: "흙 센서값이 400 밑이면 펌프를 켜고 싶은데 물을 너무 많이 주지 않으려면 어떤 방식이 좋을까?" }, expect: 201 })).data;
check("질문 1 → 되묻기 없음", t1.askback === null);
const t2 = (await call("POST", `/projects/${p.id}/turns`, { token, body: { text: "펌프를 몇 초 켰다가 끄는 게 좋을까? 화분은 지름 15cm 정도야." }, expect: 201 })).data;
check("질문 2 → 되묻기 1개", Boolean(t2.askback?.question), t2.askback?.question);
const proj = (await call("GET", `/projects/${p.id}`, { token })).data;
check("카운터 0 으로 리셋 · 마디 +1", proj.counter === 0 && proj.barIndex === 1, `counter=${proj.counter} barIndex=${proj.barIndex}`);
const rqs = (await call("GET", `/projects/${p.id}/askbacks?status=open`, { token })).data;
check("열린 되묻기 목록", rqs.length === 1);
const t3 = (await call("POST", `/projects/${p.id}/turns`, { token, body: { text: "습도 센서 대신 무게로 재면 어떨까? 화분 무게가 줄면 물을 주는 거야." }, expect: 201 })).data;
const after = (await call("GET", `/projects/${p.id}/askbacks/${t2.askback.id}`, { token })).data;
check("답하지 않고 새 질문 → [나중에]", after.status === "later");
check("질문 3 → 아직 되묻기 없음", t3.askback === null);

console.log("\n— 2a) 되묻기에 답하기 (POST …/answer = 채점 · 피드백)");
const t4 = (await call("POST", `/projects/${p.id}/turns`, { token, body: { text: "무게 센서는 로드셀이랑 HX711 을 쓰면 될까? 화분 받침 아래에 두려고 해." }, expect: 201 })).data;
check("질문 4 → 되묻기", Boolean(t4.askback?.id), `${t4.askback?.source} · ${t4.askback?.form} · ${t4.askback?.question}`);
const rid = t4.askback.id;
await call("POST", `/projects/${p.id}/askbacks/${rid}/answer`, { token, body: {}, expect: 400 });
await call("POST", `/projects/${p.id}/askbacks/${rid}/answer`, { token, body: { text: "a", idk: true }, expect: 400 });
const graded = (await call("POST", `/projects/${p.id}/askbacks/${rid}/answer`, { token, body: { text: "받침 무게가 줄어들면 흙이 마른 거라서, 그때만 펌프를 켜면 되니까" } })).data;
check("채점 · 피드백 저장", graded?.askback.status === "answered" && graded.askback.score >= 0 && Boolean(graded.coachMessage?.md), `${graded?.askback.gradedBy} ${graded?.askback.score}점 · ${graded?.askback.reason}`);
await call("POST", `/projects/${p.id}/askbacks/${rid}/answer`, { token, body: { text: "다시" }, expect: 409 });
const msgs4 = (await call("GET", `/projects/${p.id}/messages`, { token })).data.items;
check("코치 피드백이 대화에 남음", msgs4.some((m) => m.kind === "coach" && m.rqId === rid));
await call("POST", `/projects/${p.id}/askbacks/nope/answer`, { token, body: { idk: true }, expect: 404 });
const t5 = (await call("POST", `/projects/${p.id}/turns`, { token, body: { text: "로드셀 값이 흔들리면 평균을 내야 할까? 몇 번 재서 평균 내면 좋을까?" }, expect: 201 })).data;
const t6 = (await call("POST", `/projects/${p.id}/turns`, { token, body: { text: "펌프를 켠 뒤 무게가 다시 늘었는지 확인하려면 몇 초 기다려야 할까?" }, expect: 201 })).data;
const rq6 = t6.askback ?? t5.askback;
if (rq6?.options?.length) {
  const picked = (await call("POST", `/projects/${p.id}/askbacks/${rq6.id}/answer`, { token, body: { option: 0 } })).data;
  check("보기 고르기 → 보기 점수", picked?.askback.score === rq6.options[0].score && picked.askback.reason === "보기에서 고름");
} else if (rq6) {
  const idk = (await call("POST", `/projects/${p.id}/askbacks/${rq6.id}/answer`, { token, body: { idk: true } })).data;
  check("잘 모르겠어 → 0점", idk?.askback.score === 0 && idk.askback.answer === "잘 모르겠어");
}

console.log("\n— 2c) 10문 리포트 (숫자는 규칙 · 문장은 Claude, 키가 없으면 규칙 문장)");
const more = [
  "로드셀을 화분 받침 아래 두면 물이 흘러서 고장 나지 않을까? 방수는 어떻게 해?",
  "펌프가 켜졌는데 물이 안 나오면 어떻게 알아챌 수 있을까? 무게가 안 늘면 경고를 띄울까?",
  "여름에는 물이 빨리 마르는데 기준 무게를 계절마다 바꿔야 할까, 아니면 하루 변화량으로 볼까?",
  "발표 때 이 화분이 기존 자동 급수기와 다른 점을 한 문장으로 말하려면 뭐라고 해야 할까?",
];
let tenth = null;
for (const text of more) tenth = (await call("POST", `/projects/${p.id}/turns`, { token, body: { text }, expect: 201 })).data;
check("10번째 질문 → 리포트 1장", tenth?.turn?.n === 10 && tenth?.report?.seq === 1, `${tenth?.report?.writtenBy} · “${tenth?.report?.headline}”`);
const list = (await call("GET", `/projects/${p.id}/reports`, { token })).data;
check("리포트 목록", list.length === 1 && list[0].turnRange[0] === 1 && list[0].turnRange[1] === 10);
const one = (await call("GET", `/projects/${p.id}/reports/1`, { token })).data;
check("숫자 칸 합 = 10", Object.values(one.mix).reduce((a, b) => a + b, 0) === 10, JSON.stringify(one.mix));
check("되묻기 결과가 리포트에", one.elements.length >= 1, `${one.elements.length}개`);
const md = await fetch(`${API}/projects/${p.id}/reports/1`, { headers: { Authorization: `Bearer ${token}`, Accept: "text/markdown" } });
const mdText = await md.text();
check("Accept: text/markdown → .md (8칸)", md.headers.get("content-type")?.startsWith("text/markdown") && mdText.includes("1번째 리포트") && (mdText.match(/^## [①②③④⑤⑥⑦⑧]/gm) ?? []).length === 8);
const mdQ = await fetch(`${API}/projects/${p.id}/reports/1?format=md`, { headers: { Authorization: `Bearer ${token}` } });
check("?format=md 도 같음", (await mdQ.text()) === mdText);
const edited = (await call("PATCH", `/projects/${p.id}/reports/1`, { token, body: { opened: true, missionText: "다음엔 펌프가 틀리는 상황도 같이 물어보기" } })).data;
check("미션을 내 말로 고침", edited.nextMission.text.startsWith("다음엔") && edited.nextMission.editedByStudent === true && edited.opened === true);
await call("PATCH", `/projects/${p.id}/reports/1`, { token, body: {}, expect: 400 });
await call("GET", `/projects/${p.id}/reports/9`, { token, expect: 404 });
const msgsR = (await call("GET", `/projects/${p.id}/messages`, { token })).data.items;
check("리포트 알림이 대화에", msgsR.some((m) => m.kind === "coach" && m.reportSeq === 1));

console.log("\n— 2b) 되묻기 통째로 저장 (PUT)");
const answered = { ...after, status: "answered", answer: "흙이 다 마르기 전에 무게로 먼저 알 수 있어서", score: 2, feedback: "좋아, 이유까지 말했어.", answeredAt: Date.now() };
await call("PUT", `/projects/${p.id}/askbacks/${t2.askback.id}`, { token, body: answered, expect: 200 });
const pair = (await call("GET", `/projects/${p.id}/turns/${t2.turn.id}`, { token })).data;
check("질문 하나 = 질문 + 답 + 되묻기", Boolean(pair.answer?.md) && pair.askbacks[0]?.answer === answered.answer);

console.log("\n— 3) 브라우저 기록 동기화 (/me/sync)");
const now = Date.now();
const lp = { id: "prj_local1", name: "급식 앱", desc: "남은 급식 줄이기", emoji: "🍱", packs: [], rhythm: 2, answerOnly: false, counter: 0, barIndex: 1, laterStreak: 0, createdAt: now, updatedAt: now };
const lt = { id: "t_local1", projectId: lp.id, n: 1, windowIndex: 1, barIndex: 0, question: "남은 급식을 어떻게 셀까?", analysis: { valid: true, openness: "O3" }, role: "guide", chipUsed: null, source: "claude", createdAt: now };
const lm = [
  { id: "m_u1", projectId: lp.id, kind: "user", text: lt.question, images: ["data:image/png;base64,AAAA"], createdAt: now },
  { id: "m_a1", projectId: lp.id, kind: "answer", md: "식판 사진을 찍어 남은 양을 3단계로…", turnId: lt.id, role: "guide", roleReason: "", assumptions: [], yourCall: ["몇 단계로 나눌지"], chips: [], analysis: lt.analysis, source: "claude", createdAt: now + 1 },
];
const la = { id: "rq_local1", projectId: lp.id, turnId: lt.id, windowIndex: 1, barIndex: 0, element: "who", pack: null, form: "F3", question: "이 앱을 누가 제일 먼저 쓸까?", status: "answered", answer: "급식 당번", score: 2, hintStage: 0, createdAt: now + 2 };
const lr = { index: 1, projectId: lp.id, seq: 1, headline: "급식을 세는 법부터 정한 10문", writtenBy: "local", createdAt: now + 3, from: now, to: now, turnRange: [1, 10], projects: [lp.name], stage: "탐색", mix: { O1: 1, O2: 2, O3: 4, O4: 2, O5: 1, NA: 0 }, roles: {}, six: {}, elements: [], stuck: [], lastMission: null, mixComment: "", best: null, nextMission: { key: "k", text: "t", basis: "b", check: { type: "six", key: "why", target: 2 }, editedByStudent: false }, opened: false };
const s1 = (await call("POST", "/me/sync", { token, body: { projects: [lp], turns: [lt], messages: lm, askbacks: [la], reports: [lr] } })).data;
check("리포트도 올라감", s1.saved.reports === 1);
check("처음 보낸 것은 새로 생김", s1.created.turns === 1 && s1.created.projects === 1, JSON.stringify(s1.created));
const s2 = (await call("POST", "/me/sync", { token, body: { projects: [lp], turns: [lt], messages: lm, askbacks: [la] } })).data;
check("같은 것을 다시 보내도 늘지 않음 (멱등)", s2.created.turns === 0 && s2.created.projects === 0);
await call("POST", "/me/sync", { token, body: { turns: [{ ...lt, id: "t_x", projectId: "nope" }] }, expect: 422 });
await call("POST", "/me/sync", { token, body: { turns: [{ id: "bad id!", projectId: lp.id, question: "x", createdAt: 1 }] }, expect: 400 });
const msgs = (await call("GET", `/projects/${lp.id}/messages`, { token })).data.items;
check("사진 원본은 저장하지 않고 장 수만", msgs.find((m) => m.id === "m_u1")?.imageCount === 1 && !msgs.find((m) => m.id === "m_u1")?.images);

console.log("\n— 3b) 내려받기 (/me/records = 브라우저 저장 모양)");
const rec = (await call("GET", "/me/records", { token })).data;
const rp = rec.projects.find((x) => x.id === lp.id);
check("프로젝트 · 기록에 id · projectId 가 붙어 옴", rp && rec.turns.some((t) => t.id === lt.id && t.projectId === lp.id) && rec.messages.some((m) => m.id === "m_a1" && m.turnId === lt.id));
check("서버 전용 칸(syncedAt · turnCount)은 빠짐", !("syncedAt" in rp) && !("turnCount" in rp) && !rec.turns.some((t) => "syncedAt" in t));
check("리포트는 projectId · seq 로", rec.reports.some((r) => r.projectId === lp.id && r.seq === 1));
const others = (await call("GET", "/me/records", { token: other })).data;
check("다른 학생은 내 기록을 못 받음", others.projects.length === 0 && others.turns.length === 0);

console.log("\n— 4) 내보내기 JSON");
const ex = (await call("GET", "/me/export", { token })).data;
const local = ex.projects.find((x) => x.id === lp.id);
check("schema 표시", ex.schema === "teenspark.export/v1");
check("프로젝트 → qa[] → answer · askbacks", local?.qa[0]?.answer?.md && local.qa[0].askbacks[0]?.answer === "급식 당번");
const server = ex.projects.find((x) => x.id === p.id);
check("서버에서 물은 10문 + 리포트 1", server?.counts.questions === 10 && server?.counts.reports === 1 && server?.reports[0]?.seq === 1, JSON.stringify(server?.counts));
check("동기화한 리포트도 내보내기에", local?.reports[0]?.headline === lr.headline);
const file = await fetch(`${API}/me/export?download=1`, { headers: { Authorization: `Bearer ${token}` } });
check("?download=1 → 파일", /attachment; filename="teenspark-/.test(file.headers.get("content-disposition") ?? ""));

console.log("\n— 5) REST 규칙");
await call("PUT", `/projects/${p.id}/turns/t_put1`, { token, body: { question: "PUT 으로 만든 질문", createdAt: now }, expect: 201 });
await call("PUT", `/projects/${p.id}/turns/t_put1`, { token, body: { question: "PUT 으로 고친 질문", createdAt: now }, expect: 200 });
await call("GET", `/projects/${p.id}/turns/none`, { token, expect: 404 });
await call("GET", `/projects/${p.id}/askbacks`, { token: other, expect: 404 }); // 남의 프로젝트는 없는 것과 같다
await call("GET", "/me/export", { expect: 401 });

console.log(failed ? `\n❌ ${failed}개 실패` : "\n✅ 전부 통과");
process.exit(failed ? 1 : 0);
