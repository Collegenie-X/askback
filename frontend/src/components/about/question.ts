import about from "@/data/about.json";
import roles from "@/data/roles.json";

// 질문 한 벌 — 이 소개 페이지의 두 축.
//  ① 열림(O1~O5): 얼마나 열어서 묻는가. 사다리가 아니라 다이얼이고, 가운데가 스위트 스팟이다.
//  ② 넓히는 여섯 축: 무엇을 덧붙여 질문을 한 겹 넓히는가. 순서는 없다.
// ①의 뼈대(label·shape·gain·lose·role)는 앱과 같은 원본 data/roles.json 에서 가져온다.

export const open = about.open;
export const axes = about.axes;

export type Axis = (typeof axes.items)[number];
export type OpenLevel = (typeof OPEN_LEVELS)[number];

type Openness = { label: string; shape: string; gain: string; lose: string; role: string };
type Role = { emoji: string; name: string; writing: string; reason: string; color: string };

const OPENNESS = roles.openness as Record<string, Openness>;
const ROLES = roles.roles as Record<string, Role>;

export const OPEN_LEVELS = open.cases.map((c) => {
  const o = OPENNESS[c.key];
  const r = ROLES[o.role];
  return {
    ...c,
    label: o.label,
    shape: o.shape,
    gain: o.gain,
    lose: o.lose,
    roleName: r.name,
    roleWriting: r.writing,
    roleReason: r.reason,
    color: r.color,
  };
});

// 스위트 스팟 — 조건 있는 열린 질문
export const SWEET = OPEN_LEVELS.findIndex((l) => l.key === "O3");

// 불꽃 한 송이 — 파비콘(src/app/icon.svg)과 같은 모양. 64 격자, 가운데는 (31, 28).
export const FLAME_OUT = "M31 6c7 11 14 19 14 30a14 14 0 0 1-28 0c0-9 4-14 7-21 1 7 4 6 7-9z";
export const FLAME_IN = "M30.5 29c3 5 6 7 6 11.5a6 6 0 0 1-12 0c0-4 3-6.5 6-11.5z";
