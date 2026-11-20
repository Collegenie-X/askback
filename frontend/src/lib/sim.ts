// 화면 시뮬레이터의 화면 명세 — 타입 · 검증 스키마 · AI 출력 변환 · 공유 링크 · 예시 틀.
// 명세는 데이터일 뿐이다. 코드는 어디에도 없고, 정해진 부품 6종만 그린다.
import { z } from "zod";
import templates from "@/data/sim-templates.json";

const Cond = z.object({ key: z.string(), op: z.enum(["<", "<=", ">", ">=", "==", "!="]), value: z.number() });
const Act = z.object({ key: z.string(), op: z.enum(["set", "add"]), value: z.number() });
// 부품 — 글 · 숫자 · 알림 · 버튼 · 목록 · 그림 + 기록 부품(큰 숫자 · 차트 · 막대 기록 · 표 · 칩)
const BLOCK_TYPES = ["text", "stat", "notice", "button", "list", "image", "big", "chart", "progress", "table", "chips"] as const;
const Datum = z.object({ label: z.string().max(40), value: z.number(), value2: z.number().optional(), note: z.string().max(40).optional() });

// 앱이 쓰는 모양 — 공유 링크 · 저장된 명세를 읽을 때도 이걸로 검사한다
export const ProjectSchema = z.object({
  id: z.string().max(40),
  rev: z.number().int().optional(), // 예시 템플릿 판 번호 — 저장된 것이 낮으면 새 판으로 바꾼다
  emoji: z.string().max(8),
  name: z.string().max(60),
  oneLine: z.string().max(200),
  rules: z.array(z.object({ id: z.string().max(8), text: z.string().max(200), from: z.number().int().optional() })).max(12), // from = 그 규칙을 정한 대화 질문 번호(Q)
  state: z.record(z.string(), z.object({ label: z.string().max(40), value: z.number(), min: z.number(), max: z.number(), unit: z.string().max(8) })),
  start: z.string(),
  // 🗺 사이트맵 — 앱의 큰 메뉴(탭). 화면은 group으로 메뉴 하나에 속한다. 없으면 화면 흐름만 본다
  menu: z.array(z.object({ id: z.string().max(40), title: z.string().max(30), path: z.string().max(60).optional() })).max(8).optional(),
  screens: z
    .array(
      z.object({
        id: z.string().max(40),
        title: z.string().max(40),
        group: z.string().max(40).optional(), // 사이트맵에서 속한 메뉴(menu[].id)
        // 🖍 연필 스케치 — 화면 위에 손으로 그은 선과 번호 메모. 좌표는 화면 칸 영역의 0~1 비율, p = [x0, y0, x1, y1, …]
        sketch: z
          .object({
            lines: z.array(z.object({ c: z.enum(["pencil", "red"]), p: z.array(z.number().min(0).max(1)).max(800) })).max(60),
            notes: z.array(z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1), text: z.string().max(160) })).max(12),
            // 📒 스티커 — 맥의 스티커처럼 끌고 · 크기 바꾸고 · 색 고르고 · 접는 메모. x · y · w · h 도 0~1 비율
            stickies: z
              .array(z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1), w: z.number().min(0.1).max(1), h: z.number().min(0.03).max(1), color: z.enum(["yellow", "blue", "green", "pink", "purple", "gray"]), text: z.string().max(400), min: z.boolean().optional() }))
              .max(12)
              .optional(),
          })
          .optional(),
        blocks: z
          .array(
            z.object({
              id: z.string().max(40),
              type: z.enum(BLOCK_TYPES),
              text: z.string().max(200).optional(),
              bind: z.string().optional(),
              tone: z.string().optional(),
              go: z.string().optional(),
              do: z.array(Act).max(6).optional(),
              rule: z.string().optional(),
              showIf: Cond.optional(),
              disabledIf: Cond.optional(),
              items: z.array(z.string().max(120)).max(12).optional(),
              // 기록 부품 — 더미 데이터를 그대로 싣는다
              val: z.string().max(40).optional(), // big · stat: 고정으로 보여 줄 값 ("4:12:30", "A+")
              sub: z.string().max(120).optional(), // big · chart · progress · table: 아래 작은 설명
              unit: z.string().max(8).optional(),
              chart: z.enum(["bar", "line", "donut"]).optional(),
              data: z.array(Datum).max(14).optional(), // chart · progress: value2 = 목표 · 반 평균, note = 오른쪽 글
              cols: z.array(z.string().max(20)).max(6).optional(), // table 머리
              rows: z.array(z.array(z.string().max(40)).max(6)).max(10).optional(),
            }),
          )
          .max(24),
      }),
    )
    .min(1)
    .max(12),
  // 🔌 하드웨어 — 기기는 진짜로 돌리지 않는다. 입력은 값(state)을 가짜로 움직이는 센서 · 카메라, 출력은 조건이 맞으면 켜지는 램프로 흉내 낸다
  hardware: z
    .object({
      inputs: z.array(z.object({ key: z.string(), device: z.string().max(40) })).max(8), // key = state 중 하나
      outputs: z.array(z.object({ id: z.string().max(40), label: z.string().max(40), device: z.string().max(40), onIf: Cond, rule: z.string().optional() })).max(8),
    })
    .optional(),
});
export type Project = z.infer<typeof ProjectSchema>;
export type Screen = Project["screens"][number];
export type Block = Screen["blocks"][number];
export type BlockType = Block["type"];
export type Cond = z.infer<typeof Cond>;
export type Hardware = NonNullable<Project["hardware"]>;
export type Sketch = NonNullable<Screen["sketch"]>;
export type Sticky = NonNullable<Sketch["stickies"]>[number];

// Claude 구조화 출력용 — 모든 칸이 필수이고, 없는 값은 null. 값(state)은 배열로 받는다
export const AiSpecSchema = z.object({
  emoji: z.string(),
  name: z.string(),
  oneLine: z.string(),
  rules: z.array(z.object({ id: z.string(), text: z.string() })),
  state: z.array(z.object({ key: z.string(), label: z.string(), value: z.number(), min: z.number(), max: z.number(), unit: z.string() })),
  start: z.string(),
  screens: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      blocks: z.array(
        z.object({
          id: z.string(),
          type: z.enum(BLOCK_TYPES),
          text: z.string(),
          bind: z.string().nullable(),
          tone: z.enum(["warn", "good"]).nullable(),
          go: z.string().nullable(),
          do: z.array(Act),
          rule: z.string().nullable(),
          showIf: Cond.nullable(),
          disabledIf: Cond.nullable(),
          items: z.array(z.string()),
          val: z.string().nullable(),
          sub: z.string().nullable(),
          unit: z.string().nullable(),
          chart: z.enum(["bar", "line", "donut"]).nullable(),
          data: z.array(z.object({ label: z.string(), value: z.number(), value2: z.number().nullable(), note: z.string().nullable() })),
          cols: z.array(z.string()),
          rows: z.array(z.array(z.string())),
        }),
      ),
    }),
  ),
  /** 이번에 무엇을 만들었거나 바꿨는지 한두 문장 */
  note: z.string(),
  /** 학생이 정해야 할 것을 되묻는 질문 하나 */
  ask: z.string(),
});
export type AiSpec = z.infer<typeof AiSpecSchema>;

// AI 출력 → 앱 모양. 없는 화면 · 값 · 규칙을 가리키는 연결은 떼어 낸다
export function fromAi(spec: AiSpec, id: string): Project {
  const state = Object.fromEntries(spec.state.map((v) => [v.key, { label: v.label, value: v.value, min: Math.min(v.min, v.value), max: Math.max(v.max, v.value), unit: v.unit }]));
  const screenIds = new Set(spec.screens.map((s) => s.id));
  const ruleIds = new Set(spec.rules.map((r) => r.id));
  const cond = (c: Cond | null) => (c && c.key in state ? c : undefined);
  const screens = spec.screens.map((s) => ({
    id: s.id,
    title: s.title,
    blocks: s.blocks.map((b) => {
      const out: Block = { id: b.id, type: b.type, text: b.text };
      if (b.bind && b.bind in state) out.bind = b.bind;
      if (b.tone) out.tone = b.tone;
      if (b.go && screenIds.has(b.go)) out.go = b.go;
      const acts = b.do.filter((a) => a.key in state);
      if (acts.length) out.do = acts;
      if (b.rule && ruleIds.has(b.rule)) out.rule = b.rule;
      const show = cond(b.showIf);
      if (show) out.showIf = show;
      const off = cond(b.disabledIf);
      if (off) out.disabledIf = off;
      if (b.type === "list" || b.type === "chips") out.items = b.items;
      if (b.val) out.val = b.val;
      if (b.sub) out.sub = b.sub;
      if (b.unit) out.unit = b.unit;
      if (b.chart) out.chart = b.chart;
      if (b.data.length) out.data = b.data.map((d) => ({ label: d.label, value: d.value, ...(d.value2 != null ? { value2: d.value2 } : {}), ...(d.note ? { note: d.note } : {}) }));
      if (b.cols.length) out.cols = b.cols;
      if (b.rows.length) out.rows = b.rows;
      return out;
    }),
  }));
  return { id, emoji: spec.emoji || "📱", name: spec.name, oneLine: spec.oneLine, rules: spec.rules, state, start: screenIds.has(spec.start) ? spec.start : screens[0]?.id ?? "", screens };
}

// AI 연결이 꺼져 있을 때 쓰는 빈 틀 — 규칙은 비워 둔다 (규칙은 학생이 정한다)
export function starterSpec(id: string, emoji: string, name: string, oneLine: string): Project {
  return {
    id,
    emoji,
    name,
    oneLine: oneLine || "한 줄 설명을 적어 줘",
    rules: [],
    state: { count: { label: "🔢 한 횟수", value: 0, min: 0, max: 10, unit: "번" } },
    start: "home",
    screens: [
      { id: "home", title: name, blocks: [{ id: "t1", type: "image", text: "🖼 대표 그림" }, { id: "t2", type: "text", text: oneLine || "여기에 무엇을 하는 앱인지 적어 줘" }, { id: "t3", type: "button", text: "▶️ 시작하기", go: "main" }] },
      { id: "main", title: "하는 화면", blocks: [{ id: "t4", type: "stat", text: "지금까지", bind: "count" }, { id: "t5", type: "button", text: "➕ 한 번 하기", do: [{ key: "count", op: "add", value: 1 }] }, { id: "t6", type: "button", text: "🏁 결과 보기", go: "result" }] },
      { id: "result", title: "결과", blocks: [{ id: "t7", type: "stat", text: "모두", bind: "count" }, { id: "t8", type: "notice", text: "🎉 3번 넘게 했어!", tone: "good", showIf: { key: "count", op: ">=", value: 3 } }, { id: "t9", type: "button", text: "🏠 처음으로", go: "home", do: [{ key: "count", op: "set", value: 0 }] }] },
    ],
  };
}

// ── 공유 링크 — 명세를 압축해 주소의 # 뒤에 싣는다. 서버에 저장하지 않는다 ──
const b64 = (bytes: Uint8Array) => btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join("")).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

export async function encodeShare(project: Project): Promise<string> {
  const raw = new TextEncoder().encode(JSON.stringify(project));
  if (typeof CompressionStream === "undefined") return `j.${b64(raw)}`;
  return `z.${b64(await pipe(raw, new CompressionStream("deflate-raw")))}`;
}

// 링크는 남이 만든 것이다 — 길이를 막고, 스키마로 검사한 것만 돌려준다
export async function decodeShare(data: string): Promise<Project | null> {
  try {
    if (data.length > 40000) return null;
    const [kind, body] = [data.slice(0, 2), data.slice(2)];
    const bytes = kind === "z." ? await pipe(unb64(body), new DecompressionStream("deflate-raw")) : kind === "j." ? unb64(body) : null;
    if (!bytes || bytes.length > 300000) return null;
    const parsed = ProjectSchema.safeParse(JSON.parse(new TextDecoder().decode(bytes)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** 예시 템플릿의 화면 명세 — 예시 프로젝트 id(prj_example_<시나리오 id>)로 찾는다. 없으면 null */
export function templateFor(projectId: string): Project | null {
  const key = projectId.replace(/^prj_example_/, "");
  if (key === projectId || key.startsWith("_")) return null;
  const raw = (templates as Record<string, unknown>)[key];
  const parsed = raw ? ProjectSchema.safeParse(raw) : null;
  return parsed?.success ? parsed.data : null;
}

/** 예시 템플릿이 새 판이면 바꿔 준다 — 연필 · 스티커는 같은 화면 id로 옮겨 붙인다. 바뀌지 않으면 그대로 */
export function upgradeTemplate(saved: Project, fresh: Project | null | undefined): Project {
  if (!fresh || saved.id !== fresh.id || (saved.rev ?? 0) >= (fresh.rev ?? 0)) return saved;
  const ink = new Map(saved.screens.filter((s) => s.sketch).map((s) => [s.id, s.sketch]));
  return { ...fresh, screens: fresh.screens.map((s) => (ink.has(s.id) ? { ...s, sketch: ink.get(s.id) } : s)) };
}
