import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "틴스파크AI — 한 줄에서 기획서까지, 7단계",
  applicationName: "틴스파크AI",
  description:
    "답은 끝까지 줍니다. 대신 단계마다 한 번 되묻습니다. 불씨부터 봉화까지 일곱 단계를 오르면 기획서·유저 시나리오·코딩 프롬프트가 남는 청소년 AI 코치.",
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
