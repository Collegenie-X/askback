import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/components/askback.css";
import LegalView from "@/components/LegalView";
import { LEGAL, LEGAL_IDS, type LegalId } from "@/data/legal";

// 동의 문서 페이지 — /legal/terms · /legal/privacy · /legal/guardian
// 로그인 팝업의 "보기 ›" 와 같은 글. 보호자에게 링크로 보내거나 새 창으로 열어 볼 수 있다.
type Props = { params: Promise<{ doc: string }> };

export function generateStaticParams() {
  return LEGAL_IDS.map((doc) => ({ doc }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = LEGAL[(await params).doc as LegalId];
  return d ? { title: `${d.title} — 틴스파크AI`, description: d.summary.join(" ") } : {};
}

export default async function LegalPage({ params }: Props) {
  const id = (await params).doc as LegalId;
  const doc = LEGAL[id];
  if (!doc) notFound();
  return (
    <main className="phone">
      <div className="scroll flex-1">
        <div className="mx-auto max-w-[640px] px-4 pb-16 pt-5">
          <nav className="mb-6 flex flex-wrap gap-1.5" aria-label="동의 문서">
            {LEGAL_IDS.map((k) => (
              <Link key={k} href={`/legal/${k}`} aria-current={k === id ? "page" : undefined} className={`slot rounded-full px-3 py-1.5 text-[12.5px] font-bold ${k === id ? "slot-on text-clay" : "text-sub"}`}>
                {LEGAL[k].emoji} {LEGAL[k].label}
              </Link>
            ))}
          </nav>
          <div className="rise rounded-3xl border border-line bg-card p-5">
            <LegalView doc={doc} />
          </div>
          <Link href="/" className="chunk mt-6 block rounded-2xl py-3.5 text-center text-[15px] font-extrabold">틴스파크AI로 돌아가기</Link>
        </div>
      </div>
    </main>
  );
}
