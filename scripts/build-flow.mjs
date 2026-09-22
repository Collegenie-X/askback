// docs/다섯칸.md → frontend/src/data/flow.json
// 다섯 칸의 순서 · 이름 · 색 · 핵심 표시 · 목적지는 .md 한 장에서만 정한다.
// 화면별 설명 문장(말투가 다르다)은 각 화면의 JSON에 그대로 남는다.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = resolve(root, "docs/다섯칸.md");
const out = resolve(root, "frontend/src/data/flow.json");

const rows = readFileSync(src, "utf8")
  .split("\n")
  .filter((l) => /^\|\s*\d{2}\s*\|/.test(l))
  .map((l) => l.split("|").slice(1, -1).map((c) => c.trim()));

if (rows.length !== 5) throw new Error(`다섯 칸이어야 합니다 — ${rows.length}칸을 찾았습니다. ${src} 의 표를 확인하세요.`);

const steps = rows.map(([no, emoji, label, appLabel, color, core, to, toLabel]) => ({
  no,
  emoji,
  label,
  appLabel,
  color,
  core: core === "★",
  to,
  toLabel,
}));

writeFileSync(out, `${JSON.stringify({ _doc: "원본은 docs/다섯칸.md — 직접 고치지 마세요. node scripts/build-flow.mjs 로 다시 만듭니다.", steps }, null, 2)}\n`);
console.log(`✓ ${steps.length}칸 → ${out}`);
