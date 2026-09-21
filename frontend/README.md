# AskBack — 열고, 좁히고, 되묻는다 (모바일 웹)

설계서 [`docs/AI_역질문_설계서_v3`](../docs/AI_역질문_설계서_v3_열고_좁히고_되묻는다.md) 를 Next.js(App Router · 함수 컴포넌트)로 옮긴 모바일 전용 웹앱.
**서버 없이** JSON + `.md` 더미 데이터와 `localStorage` 만으로 돈다.

```bash
npm install
npm run dev     # http://localhost:3000  (데스크톱에서도 폰 너비로만 보인다)
```

첫 화면 → 온보딩 1장의 **「🎬 먼저 시연으로 보기」** 를 누르면 설계서 §12 '민준의 25분'이 [▶ 다음] 버튼으로 티키타카 재생된다.

## 흐름
스플래시(은하) → 온보딩 3장 → **채팅** (☰ 서랍: 프로젝트 · 리포트/타임라인 · 복기함 · 생각 노트 · 가이드 · 설정)

## 구조
| 위치 | 역할 |
|---|---|
| `src/data/*.json` | 더미 데이터·규칙: 역할/개방도(`roles`), 평가요소·역질문 은행(`elements`), 심화 3렌즈(`lenses`), 미션(`missions`), 답 카드 색인(`answers`), **시연 대본(`demo`)**, Claude 프롬프트 명세(`prompts`) |
| `public/answers/*.md` | 코치의 답 본문 (표 · 코드 · mermaid 순서도) — 채팅과 MD 뷰어가 불러와 렌더링 |
| `public/library/*.md` | 가이드 문서 (답의 경계, 질문의 폭, 2문 1역, 리포트 읽는 법) |
| `src/lib/db.ts` | localStorage DB (`askback:v1:*`) — 서버 DB로 바꿀 땐 이 파일의 read/write만 교체 |
| `src/lib/analyzer.ts` | 유효 질문 판정 · 개방도 O1~O5 · 6요소 (§3.2, §6.2) |
| `src/lib/rq.ts` | 역질문 요소 선택 공식 · 형태 F1~F3 (§4.4) |
| `src/lib/actions.ts` | 한 턴의 파이프라인: 답 → 배지·칩 → 2문 1역 → 10문 리포트 (§8) |
| `src/lib/report.ts` | 10문 리포트 · 월간 · `.md` 내보내기 (§7) |
| `src/components/Space.tsx` | 우주 테마 커스텀 SVG (은하수 · 나선 은하 · 공전/자전 행성 · 역할 행성) |
| `src/components/MdViewer.tsx` | `.md` 뷰어 (보기/원문 · 복사 · 저장) |

## Claude API (선택 · 기본 꺼짐)
`src/app/api/turn/route.ts` 가 역할별(answer · rq · feedback · deep) JSON 구조화 출력을 받는다.
켜려면 `.env.local` 에 `NEXT_PUBLIC_ASKBACK_LIVE=1` 과 `ANTHROPIC_API_KEY` 를 넣는다. 실패하면 자동으로 로컬 엔진으로 폴백.

> `/demo` 경로와 `src/components/demo/*` 는 별도 세션에서 만든 독립 시연 화면이다.
