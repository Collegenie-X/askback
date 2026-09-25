import type { Metadata } from "next";
import About from "@/components/about/About";

export const metadata: Metadata = {
  title: "틴스파크AI 소개 — 아이디어에 불꽃, 설계는 내가",
  description: "코드는 AI가 금방 만든다. 틴스파크AI는 그 앞의 설계를 학생이 정하게 하고, 열린 질문으로 되묻고, 한 장짜리 기획서(.md)를 남긴다.",
};

export default function AboutPage() {
  return <About />;
}
