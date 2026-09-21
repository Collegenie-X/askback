import { Fragment, type ReactNode } from "react";

// about.json 의 글 안 표시를 화면 글씨로 바꾼다.
// \n 줄바꿈 · ==보라 그라디언트== · ^^금색^^ · **흰 굵은 글씨** · ~~분홍~~ · @@보라@@ · ##흐린 글씨## · %%빨강%%
const MARKS: Record<string, string> = {
  "==": "grad",
  "^^": "grad-gold",
  "**": "font-bold text-white",
  "~~": "font-bold text-[#f472b6]",
  "@@": "font-bold text-[#a78bfa]",
  "##": "text-sub",
  "%%": "text-[#fb7185]",
};
const TOKEN = /(==|\^\^|\*\*|~~|@@|##|%%)(.+?)\1/g;

export function rich(text: string): ReactNode {
  return text.split("\n").map((line, n) => {
    const out: ReactNode[] = [];
    let last = 0;
    for (const m of line.matchAll(TOKEN)) {
      if (m.index > last) out.push(line.slice(last, m.index));
      out.push(<span key={m.index} className={MARKS[m[1]]}>{m[2]}</span>);
      last = m.index + m[0].length;
    }
    if (last < line.length) out.push(line.slice(last));
    return <Fragment key={n}>{n > 0 && <br />}{out}</Fragment>;
  });
}
