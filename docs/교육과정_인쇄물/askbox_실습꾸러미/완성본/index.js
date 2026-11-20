// 질문함 서버 — 회원이 질문하면 Claude 가 답하고, 내 질문함에 저장한다.
// [1단계] 서버 켜기 · [2단계] DB 저장 · [3단계] 회원 확인 · [4단계] Claude 답 · [5단계] 내 질문함

// ── [1단계] 서버 켜기 ─────────────────────────────────────
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const express = require("express");

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// ── [2단계] DB(Firestore) 연결 ────────────────────────────
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

initializeApp();
const db = getFirestore();

app.post("/guestbook", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const message = String(req.body.message || "").trim();
  if (!name || !message) {
    return res.status(400).json({ error: { code: "empty", message: "이름과 글을 모두 적어 주세요." } });
  }
  const doc = { name, message, createdAt: Date.now() };
  const ref = await db.collection("guestbook").add(doc);
  res.status(201).json({ data: { id: ref.id, ...doc } });
});

app.get("/guestbook", async (req, res) => {
  const snap = await db.collection("guestbook").orderBy("createdAt", "desc").limit(10).get();
  res.json({ data: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
});

// ── [3단계] 회원 확인 (문지기) ─────────────────────────────
async function requireUser(req, res, next) {
  const match = /^Bearer (.+)$/.exec(req.get("Authorization") || "");
  if (!match) {
    return res.status(401).json({ error: { code: "no_token", message: "로그인이 필요해요." } });
  }
  try {
    req.user = await getAuth().verifyIdToken(match[1]); // { uid, email, ... }
    next();
  } catch (e) {
    res.status(401).json({ error: { code: "bad_token", message: "로그인 토큰이 올바르지 않아요." } });
  }
}

app.put("/me", requireUser, async (req, res) => {
  const nickname = String(req.body.nickname || "").trim();
  if (!nickname || nickname.length > 20) {
    return res.status(400).json({ error: { code: "bad_nickname", message: "닉네임은 1~20자로 적어 주세요." } });
  }
  await db.doc(`users/${req.user.uid}`).set({ nickname, email: req.user.email, updatedAt: Date.now() }, { merge: true });
  res.json({ data: { uid: req.user.uid, nickname } });
});

app.get("/me", requireUser, async (req, res) => {
  const snap = await db.doc(`users/${req.user.uid}`).get();
  if (!snap.exists) return res.status(404).json({ error: { code: "no_profile", message: "먼저 PUT /me 로 닉네임을 정해 주세요." } });
  res.json({ data: { uid: req.user.uid, ...snap.data() } });
});

// ── [4단계] Claude 에게 묻기 ───────────────────────────────
const Anthropic = require("@anthropic-ai/sdk");
const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");

const ANSWER_SCHEMA = {
  type: "object",
  properties: {
    answer: { type: "string", description: "학생 질문에 대한 답. 중학생이 읽을 수 있게 5문장 이내" },
    ask_back: { type: "string", description: "학생이 스스로 생각해 보도록 되묻는 질문 한 개" },
    keywords: { type: "array", items: { type: "string" }, description: "핵심 낱말 2~3개" },
  },
  required: ["answer", "ask_back", "keywords"],
  additionalProperties: false,
};

const SYSTEM = [
  "너는 중학생의 프로젝트를 돕는 코치다.",
  "먼저 질문에 정확하고 쉽게 답한다. 그다음 학생이 스스로 생각하도록 되묻는 질문을 하나 만든다.",
  "개인정보를 묻지 않는다. 위험한 실험 방법은 알려 주지 않고 어른과 함께 하라고 말한다.",
].join("\n");

async function askClaude(question) {
  const apiKey = ANTHROPIC_API_KEY.value();
  if (!apiKey) {
    return {
      source: "practice",
      answer: `(연습 답) "${question}" 에 대한 진짜 답은 선생님 키를 넣으면 나와요.`,
      ask_back: "이 질문으로 무엇을 만들고 싶어?",
      keywords: ["연습"],
    };
  }
  const client = new Anthropic({ apiKey });
  const response = await client.beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM,
    messages: [{ role: "user", content: question }],
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: ANSWER_SCHEMA },
    },
  });
  if (response.stop_reason === "refusal") {
    return { source: "refused", answer: "이 질문에는 답하기 어려워요. 선생님께 물어봐 주세요.", ask_back: "", keywords: [] };
  }
  const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const out = JSON.parse(text);
  return { source: "claude", model: response.model, ...out };
}

app.post("/questions", requireUser, async (req, res) => {
  const question = String(req.body.text || "").trim();
  if (!question || question.length > 500) {
    return res.status(400).json({ error: { code: "bad_question", message: "질문은 1~500자로 적어 주세요." } });
  }
  let reply;
  try {
    reply = await askClaude(question);
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: { code: "busy", message: "지금 질문이 많아요. 잠시 뒤 다시 해 주세요." } });
    }
    if (e instanceof Anthropic.APIError) {
      return res.status(502).json({ error: { code: "claude_error", message: `Claude 오류 (${e.status})` } });
    }
    throw e;
  }
  const doc = { question, ...reply, createdAt: Date.now() };
  const ref = await db.collection(`users/${req.user.uid}/questions`).add(doc);
  res.status(201).json({ data: { id: ref.id, ...doc } });
});

// ── [5단계] 내 질문함 ─────────────────────────────────────
app.get("/questions", requireUser, async (req, res) => {
  const snap = await db.collection(`users/${req.user.uid}/questions`).orderBy("createdAt", "desc").limit(20).get();
  res.json({ data: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
});

app.get("/questions/:id", requireUser, async (req, res) => {
  const snap = await db.doc(`users/${req.user.uid}/questions/${req.params.id}`).get();
  if (!snap.exists) return res.status(404).json({ error: { code: "not_found", message: "그런 질문이 없어요." } });
  res.json({ data: { id: snap.id, ...snap.data() } });
});

app.delete("/questions/:id", requireUser, async (req, res) => {
  const ref = db.doc(`users/${req.user.uid}/questions/${req.params.id}`);
  if (!(await ref.get()).exists) return res.status(404).json({ error: { code: "not_found", message: "그런 질문이 없어요." } });
  await ref.delete();
  res.status(204).end();
});

// ── 함수 하나로 내보내기 (파일 맨 아래 한 번만) ────────────
exports.api = onRequest({ region: "asia-northeast3", secrets: [ANTHROPIC_API_KEY] }, app);
