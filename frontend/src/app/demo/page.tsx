import type { Metadata } from "next";
import DemoHub from "@/components/demo/DemoHub";

export const metadata: Metadata = {
  title: "틴스파크AI — 사용 시연",
  description: "JSON 한 장으로 보는 AI 역질문 코치 — 작게 시작해 질문으로 키우는 프로젝트",
};

export default function DemoPage() {
  return <DemoHub />;
}
