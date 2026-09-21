// 파비콘 만들기 — frontend/src/app/icon.svg 한 장에서 favicon.ico · apple-icon.png 을 뽑는다.
// 실행: cd frontend && node ../scripts/make-icons.mjs [미리보기를 둘 폴더]
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const sharp = createRequire(join(process.cwd(), "package.json"))("sharp");
const svg = readFileSync("src/app/icon.svg");
const png = (n) => sharp(svg, { density: 384 }).resize(n, n).png().toBuffer();

// apple-icon — 투명 모서리 없이 꽉 찬 정사각형 (모서리는 iOS가 깎는다)
writeFileSync("src/app/apple-icon.png", await sharp(svg, { density: 384 }).resize(180, 180).flatten({ background: "#0a0820" }).png().toBuffer());

// favicon.ico — PNG를 그대로 담는 ICO 컨테이너
const sizes = [16, 32, 48, 64];
const imgs = await Promise.all(sizes.map(png));
const head = Buffer.alloc(6);
head.writeUInt16LE(1, 2);
head.writeUInt16LE(sizes.length, 4);
let offset = 6 + 16 * sizes.length;
const dir = sizes.map((n, i) => {
  const e = Buffer.alloc(16);
  e[0] = n;
  e[1] = n;
  e.writeUInt16LE(1, 4);
  e.writeUInt16LE(32, 6);
  e.writeUInt32LE(imgs[i].length, 8);
  e.writeUInt32LE(offset, 12);
  offset += imgs[i].length;
  return e;
});
writeFileSync("src/app/favicon.ico", Buffer.concat([head, ...dir, ...imgs]));

if (process.argv[2]) {
  writeFileSync(join(process.argv[2], "icon256.png"), await png(256));
  writeFileSync(join(process.argv[2], "icon16x8.png"), await sharp(await png(16)).resize(128, 128, { kernel: "nearest" }).png().toBuffer());
}
console.log("favicon.ico · apple-icon.png 을 새로 만들었어");
