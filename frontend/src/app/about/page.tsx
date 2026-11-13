import type { Metadata } from "next";
import About from "@/components/about/About";

export const metadata: Metadata = {
  title: "틴스파크AI 소개 — 내가 설명할 수 있는 프로젝트",
  description: "AI로 만들어도, 내가 설명할 수 있는 프로젝트로. 답은 끝까지 주고, 두 번 물으면 한 번 설명할 수 있는지 점검하고, 그 과정을 리포트와 기획서.md로 전부 남긴다.",
};

export default function AboutPage() {
  return <About />;
}
