import type { Metadata } from "next";
import "@/components/askback.css";
import GuardianConsent from "@/components/GuardianConsent";

// 보호자 동의 페이지 — 학생이 입력한 보호자 이메일로 간 메일의 버튼이 여기로 온다 (/guardian?t=<토큰>)
export const metadata: Metadata = {
  title: "보호자 동의 — 틴스파크AI",
  description: "만 14세 미만 학생의 틴스파크AI 가입에 대한 법정대리인 동의",
  robots: { index: false, follow: false }, // 토큰이 담긴 주소 — 검색에 나오지 않게
};

export default async function GuardianPage({ searchParams }: { searchParams: Promise<{ t?: string | string[] }> }) {
  const t = (await searchParams).t;
  return <GuardianConsent token={typeof t === "string" ? t : ""} />;
}
