// 즉답(스트리밍) 시연 — 일회용 계정으로 가입 → /ask/stream 으로 질문 → 글자가 오는 대로 출력 → 탈퇴
//   node scripts/stream-demo.mjs                      (에뮬레이터)
//   API=https://asia-northeast3-teensparkai.cloudfunctions.net/api/v1 node scripts/stream-demo.mjs
// 운영 주소에 돌리면 Claude 를 실제로 한 번 부른다 (비용 발생).
const API = process.env.API ?? "http://127.0.0.1:5001/demo-teenspark/asia-northeast3/api/v1";
const QUESTION = process.env.Q ?? "흙 센서값이 400 밑이면 펌프를 켜고 싶은데, 물을 너무 많이 주지 않으려면 어떤 방식이 좋을까? 아두이노 우노를 쓰고 있어.";

const json = async (method, path, { token, body } = {}) => {
  const r = await fetch(API + path, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json().catch(() => ({})) };
};

const email = `stream-demo-${Date.now().toString(36)}@example.com`;
const password = "teenspark123";
const signup = await json("POST", "/auth/signup", { body: { email, password, nickname: "서연", grade: "중2", interests: ["스마트팜"], under14: false, agreeTerms: true, agreePrivacy: true } });
const token = signup.body.data?.tokens?.idToken;
if (!token) throw new Error(`가입 실패: ${JSON.stringify(signup.body)}`);

try {
  const t0 = Date.now();
  const sec = () => ((Date.now() - t0) / 1000).toFixed(1) + "s";
  const res = await fetch(API + "/ask/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ text: QUESTION }),
  });
  console.log(`[${sec()}] HTTP ${res.status} ${res.headers.get("content-type")}`);
  const decoder = new TextDecoder();
  let buf = "";
  let firstDelta = null;
  let deltas = 0;
  let text = "";
  for await (const chunk of res.body) {
    buf += decoder.decode(chunk, { stream: true });
    let i;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const raw = buf.slice(0, i);
      buf = buf.slice(i + 2);
      const event = /^event: (.+)$/m.exec(raw)?.[1];
      const data = /^data: (.+)$/m.exec(raw)?.[1];
      if (!event || !data) continue;
      const d = JSON.parse(data);
      if (event === "analysis") console.log(`[${sec()}] analysis  열림=${d.analysis.openness} 국면=${d.analysis.stage} 모델=${d.model}`);
      if (event === "delta") {
        if (firstDelta === null) {
          firstDelta = sec();
          console.log(`[${firstDelta}] 첫 글자 ↓\n`);
        }
        deltas++;
        text += d.text;
        process.stdout.write(d.text);
      }
      if (event === "done") {
        console.log(`\n\n[${sec()}] done  outcome=${d.outcome} source=${d.source} model=${d.model} 조각=${deltas}개`);
        console.log(`        timing=${JSON.stringify(d.timing)} usage=${JSON.stringify(d.usage)} fallback=${JSON.stringify(d.fallbackReason)}`);
        console.log(`        스트림으로 받은 글 = 저장된 답? ${text === d.answer?.md ? "같음 ✅" : "다름 ❌"}`);
      }
      if (event === "error") console.log(`\n[${sec()}] error ${JSON.stringify(d)}`);
    }
  }
} finally {
  await json("DELETE", "/me", { token, body: { password } });
}
