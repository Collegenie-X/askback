import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "틴스파크AI — 답은 끝까지, 질문은 넓게",
  applicationName: "틴스파크AI",
  description:
    "답은 끝까지 줍니다. 대신 그 답 끝에 열린 되묻기를 붙입니다. 질문이 넓어지는 만큼 아이템이 단단해지고, 내가 던진 질문과 방향이 그대로 기획서·리포트로 남는 청소년 AI 코치.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#111119",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
