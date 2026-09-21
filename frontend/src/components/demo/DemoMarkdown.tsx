"use client";

import { isValidElement, memo, useEffect, useId, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

const Drawing = () => <div className="my-2 rounded-xl border border-stone-200 bg-stone-50 p-3 text-center text-[12px] text-stone-400">순서도를 그리는 중…</div>;

function Mermaid({ code }: { code: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          suppressErrorRendering: true,
          fontFamily: "inherit",
          themeVariables: { primaryColor: "#fff3e1", primaryBorderColor: "#f97316", primaryTextColor: "#1c1917", lineColor: "#78716c", secondaryColor: "#e0f2fe", tertiaryColor: "#f5f5f4", fontSize: "13px" },
        });
        const out = await mermaid.render(`dmd${id}`, code);
        if (alive) setSvg(out.svg);
      } catch {
        if (alive) setFailed(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [code, id]);

  if (failed) return <pre><code>{code}</code></pre>;
  if (!svg) return <Drawing />;
  return <div className="mermaid-box my-2 overflow-x-auto rounded-xl border border-stone-200 bg-white p-2" dangerouslySetInnerHTML={{ __html: svg }} />;
}

interface Props {
  children: string;
  streaming?: boolean; // 스트리밍 중엔 mermaid를 그리지 않는다 (미완성 코드가 에러를 낸다)
}

function DemoMarkdown({ children, streaming = false }: Props) {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ children: c }) => {
            const child = Array.isArray(c) ? c[0] : c;
            const cls = isValidElement<{ className?: string }>(child) ? (child.props.className ?? "") : "";
            if (cls.includes("language-mermaid")) return streaming ? <Drawing /> : <Mermaid code={textOf(c).trim()} />;
            return <pre>{c}</pre>;
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export default memo(DemoMarkdown);
