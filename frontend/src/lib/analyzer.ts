// 분석기 (설계서 v3 §6.2, §3.2) — 신호 규칙 기반. Claude API가 연결되면 개방도·6요소는 모델 결과로 덮어쓴다.
import concepts from "@/data/concepts.json";
import type { Analysis, Openness, SixKey, Stage, Turn } from "./types";

function bigrams(s: string) {
  const t = s.replace(/\s+/g, "").toLowerCase();
  const set = new Set<string>();
  for (let i = 0; i < t.length - 1; i++) set.add(t.slice(i, i + 2));
  return set;
}

export function similarity(a: string, b: string) {
  const A = bigrams(a);
  const B = bigrams(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach((g) => B.has(g) && inter++);
  return inter / (A.size + B.size - inter);
}

export function topicOf(q: string, max = 22) {
  const t = q.replace(/```[\s\S]*?```/g, "").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max) + "…" : t;
}

const RX = {
  emotional: /(우울|죽고\s?싶|자해|외로워|너무 힘들어|살기 싫|불안해서|왕따|괴롭힘)/,
  smalltalk: /^(ㅇㅇ|ㅇㅋ|ㄱㅅ|고마워|고맙|감사|안녕|하이|오+ ?된다|된다|ㅋ+|ㅎ+|넵|네|응|굿|좋아|알겠어|오케이|ok)[\s!~.ㅋㅎ]*$/i,
  howto: /(리포트|설정|타임라인|기록).{0,8}(어디|어떻게 봐|어디서)/,
  alt: /(말고|다른 (방법|방식|길)|비교|장단점|잃는|틀리는 조건|대안|vs\b|차이가 뭐)/i,
  open: /(어떻게|왜|어떤 방식|어떤 게|뭐가 좋|좋을까|맞을까|방향|일까|할까|을까|인가|이유)/,
  spec: /(짜\s?줘|만들어\s?줘|써\s?줘|작성해\s?줘|코드|구현해)/,
  directive: /(바꿔\s?줘|고쳐\s?줘|수정해\s?줘|로 바꿔|번째? 줄|지워\s?줘|추가해\s?줘|이름을|으로 해줘)/,
  formatLimit: /(코드만|한 줄로|짧게만|설명 없이)/,
  urgent: /(빨리|급해|분 뒤|곧 발표|시간 없|마감)/,
  why: /(위해|하려고|하고 싶|목표|목적|때문에|싶어서)/,
  context: /(지금|현재|상황|쓰고 있|가지고 있|가진|우노|보드|학년|프로젝트|만들고 있|꽂았|연결했)/,
  constraint: /(안에|까지|만 가지고|제약|예산|시간이|[0-9]+\s?(v|V|시간|분|일|원|cm)|없이|밖에 없|다음 주|내일)/,
  criteria: /(기준|잘 됐|성공|않는 게|않아야|이면 돼|해야 해|이하|이상이면|깜빡이지)/,
  verify: /(확인|테스트|검증|맞는지|로그|재 ?보)/,
  discard: /(말고|빼고|제외|안 쓸|쓰지 않|버리|없이)/,
  stageVerify: /(에러|오류|안 돼|안돼|테스트|확인|error|exception)/i,
  stageBuild: /(짜\s?줘|코드|구현|바꿔|고쳐|만들어\s?줘)/,
  stageDesign: /(구조|설계|방식|로직|어떻게 잡|아키텍처)/,
};

function sixOf(text: string): Record<SixKey, number> {
  const s = (rx: RegExp) => (rx.test(text) ? 1 : 0);
  return {
    why: s(RX.why),
    context: s(RX.context),
    constraint: s(RX.constraint),
    criteria: s(RX.criteria),
    verify: s(RX.verify),
    discard: s(RX.discard),
  };
}

export function analyze(text: string, history: Turn[], projectDesc: string): Analysis {
  const q = text.trim();
  const base: Analysis = {
    valid: true,
    six: sixOf(q),
    openness: "NA",
    contextLoad: 0,
    stage: "탐색",
    urgent: RX.urgent.test(q),
    signals: [],
    concepts: concepts.filter((c) => q.toLowerCase().includes(c.toLowerCase())).slice(0, 3),
  };

  if (RX.emotional.test(q)) return { ...base, valid: false, invalidReason: "emotional" };
  if (q.length <= 12 && RX.smalltalk.test(q)) return { ...base, valid: false, invalidReason: "smalltalk" };
  if (RX.howto.test(q)) return { ...base, valid: false, invalidReason: "howto" };
  const prev = history[history.length - 1];
  if (prev && similarity(prev.question, q) >= 0.9) return { ...base, valid: false, invalidReason: "duplicate" };

  base.stage = (RX.stageVerify.test(q) ? "검증" : RX.stageBuild.test(q) ? "구현" : RX.stageDesign.test(q) ? "설계" : "탐색") as Stage;

  // 코드·에러만 붙여넣음 → 판별 불가
  const hangul = (q.match(/[가-힣]/g) ?? []).length;
  if (q.length > 20 && hangul / q.length < 0.15) {
    return { ...base, openness: "NA", stage: "검증", signals: ["paste"] };
  }

  // 맥락량: 앞선 3턴에서 준 맥·제·기도 포함한다 (§6.2)
  const recent = history.slice(-3);
  const carried = (k: SixKey) => base.six[k] >= 0.5 || recent.some((t) => t.analysis.six[k] >= 0.5);
  let load = 0;
  if (carried("context") || projectDesc.trim().length > 0) load++;
  if (carried("constraint")) load++;
  if (carried("criteria")) load++;
  base.contextLoad = load;

  const sig = {
    alt: RX.alt.test(q),
    open: RX.open.test(q),
    spec: RX.spec.test(q),
    directive: RX.directive.test(q),
    limit: RX.formatLimit.test(q),
  };
  base.signals = Object.entries(sig).filter(([, v]) => v).map(([k]) => k);

  let o: Openness;
  if (sig.alt) o = load >= 1 ? "O4" : "O5";
  else if (sig.directive && !sig.open) o = "O1";
  else if (sig.spec && !sig.open) o = "O2";
  else if (sig.open) o = load >= 2 ? "O3" : sig.spec ? "O2" : load === 1 && q.length > 40 ? "O3" : "O5";
  else o = q.length < 25 ? "O5" : "O2";
  if (sig.limit && o === "O3") o = "O2";
  base.openness = o;
  return base;
}
