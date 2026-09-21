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
          themeVariables: { primaryColor: "#f6e4dc", primaryBorderColor: "#c96442", primaryTextColor: "#1f1e1d", lineColor: "#6b6961", secondaryColor: "#e2f3ec", tertiaryColor: "#f0eee6", fontSize: "13px" },
        });
        const out = await mermaid.render(`mmd${id}`, code);
        if (alive) setSvg(out.svg);
      } catch {
        if (alive) setFailed(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [code, id]);

  if (failed) return <pre className="rounded-xl"><code>{code}</code></pre>;
  if (!svg) return <div className="my-3 rounded-xl border border-line bg-card p-4 text-center text-xs text-sub">순서도를 그리는 중…</div>;
  return <div className="mermaid-box my-3 overflow-x-auto rounded-xl border border-line bg-card p-3" dangerouslySetInnerHTML={{ __html: svg }} />;
}

function CodeBlock({ children }: { children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const child = Array.isArray(children) ? children[0] : children;
  const cls = isValidElement<{ className?: string }>(child) ? (child.props.className ?? "") : "";
  const lang = /language-(\w+)/.exec(cls)?.[1] ?? "";
  const code = textOf(children).replace(/\n$/, "");
  return (
    <div className="my-3 overflow-hidden rounded-xl border border-[#3d3399]">
      <div className="flex items-center justify-between bg-[#0e0b2e] px-3 py-1.5 text-[11px] text-sub">
        <span>{lang || "code"}</span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
        >
          {copied ? "복사됨 ✓" : "복사"}
        </button>
      </div>
      <pre>{children}</pre>
    </div>
  );
}

interface Props {
  children: string;
  streaming?: boolean; // 스트리밍 중엔 mermaid를 그리지 않는다 (미완성 코드가 에러를 낸다)
}

function MarkdownBase({ children, streaming = false }: Props) {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ children: c }) => {
            const child = Array.isArray(c) ? c[0] : c;
            const cls = isValidElement<{ className?: string }>(child) ? (child.props.className ?? "") : "";
            if (cls.includes("language-mermaid")) {
              return streaming ? <div className="my-3 rounded-xl border border-line bg-card p-4 text-center text-xs text-sub">순서도를 그리는 중…</div> : <Mermaid code={textOf(c).trim()} />;
            }
            return <CodeBlock>{c}</CodeBlock>;
          },
          table: ({ children: c }) => (
            <div className="table-wrap">
              <table>{c}</table>
            </div>
          ),
          a: ({ href, children: c }) => (
            <a href={href} target="_blank" rel="noreferrer noopener">
              {c}
            </a>
          ),
          // eslint-disable-next-line @next/next/no-img-element
          img: ({ src, alt }) => <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export default memo(MarkdownBase);
