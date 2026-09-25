import type { Metadata } from "next";
import About from "@/components/about/About";

export const metadata: Metadata = {
  title: "틴스파크AI 소개 — 불씨에서 봉화까지, 7단계",
  description: "코드는 AI가 금방 만든다. 틴스파크AI는 그 앞의 설계를 학생이 정하게 한다. 한 줄 아이디어에서 시작해 단계마다 한 번씩 되묻고, 일곱 칸이 차면 기획서 한 장(.md)이 남는다.",
};

export default function AboutPage() {
  return <About />;
}
