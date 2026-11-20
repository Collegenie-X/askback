// 함수 코드를 lib/index.js 하나로 묶는다.
// 코칭 데이터(prompts.json · roles.json · concepts.json …)와 분석기 · 출력 스키마는
// frontend/src 의 파일을 그대로 가져와 번들에 넣는다 — 고칠 곳은 프런트 한 곳뿐이다.
import { build } from "esbuild";
import { cpSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const front = resolve(here, "../../frontend/src");

rmSync(resolve(here, "lib"), { recursive: true, force: true });
await build({
  entryPoints: [resolve(here, "src/index.ts")],
  outfile: resolve(here, "lib/index.js"),
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  packages: "external", // npm 패키지는 functions/node_modules 에서 불러온다
  alias: { "@front": front, "@": front },
  sourcemap: true,
  logLevel: "info",
});
// 키가 없거나 Claude 가 실패했을 때 쓰는 로컬 답 카드
cpSync(resolve(here, "../../frontend/public/answers"), resolve(here, "lib/answers"), { recursive: true });
