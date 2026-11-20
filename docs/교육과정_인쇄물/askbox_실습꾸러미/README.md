# askbox 실습 꾸러미 — 질문함 서버

수업자료: [Firebase 백엔드 서버 만들기 — 2시간](../Firebase_백엔드_서버_만들기_2시간_수업자료_v1.md)

| 파일 | 무엇 |
|---|---|
| `firebase.json` · `.firebaserc` | 에뮬레이터 설정 · 프로젝트 이름 `demo-askbox` (진짜 Firebase와 연결되지 않음) |
| `firestore.rules` | DB 직접 접근을 전부 잠그는 규칙 |
| `functions/package.json` | 서버가 쓰는 도구 |
| `functions/index.js` | **학생이 채우는 파일** (처음엔 안내 주석만) |
| `완성본/index.js` | 다섯 단계를 다 붙인 완성 코드 (에뮬레이터에서 확인함) |

```bash
cd askbox_실습꾸러미/functions && npm install && cd ..
npx firebase emulators:start
```

Claude 키(선택 · 교사만): `functions/.secret.local` 에 `ANTHROPIC_API_KEY=...` 한 줄. 이 파일은 Git에 올리지 않는다 (`.gitignore`).
