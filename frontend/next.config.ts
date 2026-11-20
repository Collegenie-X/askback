import type { NextConfig } from "next";

// 틴스파크AI 백엔드 (Firebase Cloud Functions `api`). 브라우저는 같은 주소의 /api/v1/... 만 부르고,
// Next(Vercel)가 아래 주소로 넘겨 준다 — 같은 출처라 CORS 설정이 필요 없다.
// 로컬 에뮬레이터로 시험할 때: TEENSPARK_API=http://127.0.0.1:5001/demo-teenspark/asia-northeast3/api
const TEENSPARK_API = process.env.TEENSPARK_API ?? "https://asia-northeast3-teensparkai.cloudfunctions.net/api";

const nextConfig: NextConfig = {
  devIndicators: false, // 모바일 화면 왼쪽 아래 입력창을 가리지 않게
  async rewrites() {
    return [
      // /api/sim · /api/turn (Next 라우트)은 그대로 두고, /api/v1/** 만 Firebase 로 보낸다
      { source: "/api/v1/:path*", destination: `${TEENSPARK_API}/v1/:path*` },
    ];
  },
};

export default nextConfig;
