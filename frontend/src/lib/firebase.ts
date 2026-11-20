// Firebase 웹 SDK — Google 로그인에만 쓴다. Firestore 는 브라우저가 직접 만지지 않고 /api/v1 (서버)을 거친다.
// 아래 값은 웹 앱 공개 설정이라 코드에 그대로 둬도 된다 (Firebase 콘솔 → 프로젝트 설정 → 내 앱).
import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, GoogleAuthProvider, signInWithCredential, type Auth } from "firebase/auth";

// 로컬 에뮬레이터로 시험할 때: NEXT_PUBLIC_FIREBASE_EMULATOR=1 (next.config.ts 의 TEENSPARK_API 도 에뮬레이터로)
const config = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === "1"
  ? { apiKey: "demo-key", authDomain: "demo-teenspark.firebaseapp.com", projectId: "demo-teenspark", appId: "demo-app" }
  : {
      apiKey: "AIzaSyA1dL0qIhTvSuSNYeZXxOgD_oQ5hjY8zZ0",
      authDomain: "teensparkai.firebaseapp.com",
      projectId: "teensparkai",
      appId: "1:580984114572:web:70637848ea190a3b491aa9",
      messagingSenderId: "580984114572",
      storageBucket: "teensparkai.firebasestorage.app",
    };

let cached: Auth | null = null;

/** 브라우저에서만 부른다 (서버 렌더링 중에는 쓰지 않음) */
export function firebaseAuth(): Auth {
  if (cached) return cached;
  const app = getApps().length ? getApp() : initializeApp(config);
  cached = getAuth(app);
  if (process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === "1") {
    connectAuthEmulator(cached, "http://127.0.0.1:9099", { disableWarnings: true });
    // 에뮬레이터 시험용: 팝업 없이 가짜 Google 계정으로 로그인 (배포에서는 위 조건이 거짓이라 실행되지 않는다)
    const a = cached;
    (window as unknown as { __fakeGoogle?: (email: string, name: string) => Promise<unknown> }).__fakeGoogle = (email, name) =>
      signInWithCredential(a, GoogleAuthProvider.credential(JSON.stringify({ sub: email, email, email_verified: true, name })));
  }
  return cached;
}
