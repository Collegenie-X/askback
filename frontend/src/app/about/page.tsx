import type { Metadata } from "next";
import About from "@/components/about/About";

export const metadata: Metadata = {
  title: "틴스파크AI 소개 — 열린 질문으로 설계한다",
  description: "코드는 AI가 금방 만든다. 틴스파크AI는 그 앞의 설계를 학생이 정하게 한다. 얼마나 열어서 묻는지를 코칭하고, 여섯 축으로 질문을 넓혀 아이템을 단단하게 만든다.",
};

export default function AboutPage() {
  return <About />;
}
