import App from "@/components/App";

// AskBack 본 앱 (모바일 전용). 화면은 주소로 정해진다 — /p/<프로젝트>, /reports, /x/<예시> …
// 새로고침해도 같은 화면이 열리므로 링크를 그대로 공유할 수 있다. 시연 전용 화면은 /demo, 소개는 /about.
export default function Page() {
  return <App />;
}
