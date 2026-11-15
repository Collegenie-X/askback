import type { Metadata } from "next";
import Simulator from "@/components/sim/Simulator";

export const metadata: Metadata = {
  title: "틴스파크AI — 화면 시뮬레이터",
  description: "코드 없이 화면 · 칸 · 규칙만 정해서 바로 눌러 보는 UI/UX 기획 시뮬레이터 (MVP · 더미 데이터)",
};

export default function SimPage() {
  return <Simulator />;
}
