# AskBack 서버 — Django · DRF · SQLite

브라우저(localStorage)에서 돌던 코칭 엔진을 서버로 옮긴 것. Claude API 키를 서버에만 두고, 기록 · 점수 · 리포트는 서버 DB가 원본이 된다.
설계는 [`docs/AI_역질문_서버_API_DB_설계서_v1.md`](../docs/AI_역질문_서버_API_DB_설계서_v1.md) 를 따른다.

## 빠른 시작

```bash
cd server
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env            # ANTHROPIC_API_KEY 를 넣으면 Claude, 비우면 로컬 답 카드
.venv/bin/python manage.py migrate
.venv/bin/python manage.py createsuperuser     # /admin 로그인용
.venv/bin/python manage.py runserver 8000
```

| 주소 | 내용 |
|---|---|
| `http://localhost:8000/admin/` | 관리자 — 학생 · 프로젝트 · 턴 · 역질문 · 리포트 · Claude 호출(토큰 · 캐시 적중률 합계) |
| `http://localhost:8000/api/v1/health` | 살아 있는지 · Claude 를 쓰는지 · 작업별 모델/effort/프롬프트 버전 |
| `http://localhost:8000/api/v1/…` | REST API (아래) |

학생 토큰을 바로 받으려면:

```bash
.venv/bin/python manage.py issue_token --nickname 민준 --grade 중2
```

## 더미 DB — 바로 눌러 보기

```bash
.venv/bin/python manage.py seed_dummy --reset --admin
```

예시 시나리오 4개(스마트 화분 · 콩이 일지 · 거북목 감시 웹캠 · 위험 등굣길 지도)의 **실제 질문 20개와 학생 답**, 그리고 형식이 다른 추가 학생 6명을
**진짜 코칭 엔진에 하나씩 흘려 보내서** 만든다. 그래서 턴 · 역질문 · 채점 · 10문 리포트 · 미션이 운영과 같은 규칙으로 쌓인다.

| 만들어지는 것 | 내용 |
|---|---|
| 학생 10명 · 프로젝트 10개 | 다섯 형식(논문 · 리서치 · 캠페인 · 서비스 · 제품)이 다 나온다. 질문 수 3~23개 → 리포트 0 · 1 · 2장이 섞인다 |
| 턴 약 140개 | 지난 30일 저녁마다 4~6문씩 — 9월 · 10월에 걸쳐서 월간 리포트도 두 달 치 |
| 역질문 약 70개 | 답함 · 나중에 · 모르겠어 · 힌트 후 답 — 🟢🟡⚪ 판정이 고르게 |
| 리포트 11장 | 8칸 · 지난 미션 채점까지 |
| 그 밖 | 심화 대화 생각 노트 · 체크 칸 · 기획서.md · 월 목표 · 지운 프로젝트 1개(복구 가능) · 관문에 걸린 잡담 |
| 가짜 Claude 호출 기록 | 관리자 'Claude 호출' 합계 화면을 보기 위한 것 — 실제로 부르지는 않는다 (`--no-llm-calls` 로 끔) |
| `dummy_tokens.json` | 학생별 기기 토큰 · 프로젝트 ID — `Authorization: Bearer <token>` 으로 API 를 바로 부른다 |
| 개발 관리자 (`--admin`) | 아이디 `admin` · 비밀번호 `askback-dev-1234` (개발 DB 전용, `ASKBACK_DUMMY_ADMIN_PASSWORD` 로 바꿈) |

| 옵션 | 뜻 |
|---|---|
| `--reset` | 예전 더미만 지우고 다시 (직접 만든 학생은 건드리지 않는다 — 더미는 기기 토큰의 `user_agent=seed_dummy` 로 구분) |
| `--extra 2` · `--days 14` · `--seed 3` | 추가 학생 수 · 기간 · 난수 씨앗(같은 값이면 같은 결과) |
| `--use-claude` | 로컬 답 카드 대신 실제 Claude 로 답한다 — **비용 발생** |

개발 DB와 따로 두고 싶으면 DB 파일만 바꾼다:

```bash
ASKBACK_SQLITE_PATH=dummy.sqlite3 .venv/bin/python manage.py migrate
ASKBACK_SQLITE_PATH=dummy.sqlite3 .venv/bin/python manage.py seed_dummy --admin
ASKBACK_SQLITE_PATH=dummy.sqlite3 .venv/bin/python manage.py runserver 8000
```

토큰으로 바로 불러 보기:

```bash
TOKEN=$(python3 -c "import json;print(json.load(open('dummy_tokens.json'))['students'][0]['token'])")
PID=$(python3 -c "import json;print(json.load(open('dummy_tokens.json'))['students'][0]['project_id'])")
curl -s localhost:8000/api/v1/projects/$PID/reports -H "Authorization: Bearer $TOKEN"
```

DEBUG=False 이거나 운영 설정이면 실행을 거부한다 (`--force` 로만 DEBUG=False 허용).

## 구조

```
server/
├─ config/                  설정 (settings/base · dev · prod · test) · urls · wsgi/asgi
├─ apps/
│  ├─ common/               ID · camelCase 봉투 · 오류 봉투 · 커서 페이지 · 멱등 키 · 데이터 카탈로그
│  ├─ accounts/             학생 · 기기 토큰(Bearer) · 월 목표
│  ├─ projects/             프로젝트 · 메시지 · 생각 노트 · 초안 체크 칸 · 기획서
│  │  └─ services/          projects · messages · drafts
│  ├─ coaching/             턴 · 역질문 + 코칭 엔진
│  │  └─ engine/            analyzer · chips · rq_picker · answerer · grader · deep · context · pipeline
│  ├─ reports/              10문 리포트 · 월간 리포트
│  │  └─ services/          builder · missions · sections · markdown · monthly
│  ├─ llm/                  Claude 어댑터 · 스키마 · 내용 검증 · 호출 기록
│  ├─ transfer/             내보내기 · localStorage 가져오기
│  └─ devtools/             더미 DB (seed_dummy) — 개발 전용
└─ templates/admin/         관리자 화면 덧붙임 (Claude 호출 합계)
```

| 앱 | 브라우저 쪽 원본 |
|---|---|
| `coaching/engine/analyzer.py` | `frontend/src/lib/analyzer.ts` |
| `coaching/engine/rq_picker.py` | `frontend/src/lib/rq.ts` |
| `coaching/engine/answerer.py` · `grader.py` · `deep.py` | `frontend/src/lib/engine.ts` |
| `coaching/engine/pipeline.py` | `frontend/src/lib/actions.ts` |
| `reports/services/*` | `frontend/src/lib/report.ts` |
| `llm/schemas.py` | `frontend/src/lib/schemas.ts` |
| `llm/prompts.py` | `frontend/src/data/prompts.json` (그대로 읽는다) |

코칭 데이터(`prompts.json` · `elements.json` · `formats.json` · `roles.json` · `answers.json` · `missions.json` · `lenses.json` · `concepts.json`)와 로컬 답 카드(`public/answers/*.md`)는 **프런트 저장소의 파일을 그대로 읽는다** — 고칠 곳은 한 곳뿐이다.

## API 한눈에

모든 요청: `Authorization: Bearer <기기 토큰>` · JSON 필드는 camelCase · 성공은 `{ "data": … }`, 실패는 `{ "error": { "code", "message", "details" } }`.

| 메서드 | 주소 | 하는 일 |
|---|---|---|
| POST | `/auth/device` | 익명 기기 토큰 발급 (학생도 만든다) |
| DELETE | `/auth/device` | 지금 기기 로그아웃 |
| GET · PATCH · DELETE | `/me` | 내 정보 · 고치기 · 전부 지우기 |
| GET | `/me/export` | 내 데이터 전부 (브라우저 exportAll 과 같은 모양) |
| GET · PUT · DELETE | `/me/goals` · `/me/goals/{ym}` | 월 목표 |
| GET · POST | `/projects` | 목록 · 만들기 (첫 코치 인사 포함) |
| GET · PATCH · DELETE | `/projects/{id}` | 조회 · 고치기 · 지우기 (30일 복구) |
| POST | `/projects/{id}/restore` | 되살리기 |
| PUT · DELETE | `/projects/{id}/checks/{key}` | 초안 체크 칸 |
| GET · PUT | `/projects/{id}/plan` | 기획서.md |
| **POST** | **`/projects/{id}/turns`** | **질문 하나 — 관문 → 분석 → 답 → 칩 → 역질문 → 리포트** (`Idempotency-Key` 권장) |
| GET | `/projects/{id}/turns?window=1` | 턴 목록 |
| GET | `/projects/{id}/messages` | 대화 (커서 페이지) |
| GET | `/projects/{id}/rqs?status=later` | 역질문 목록 |
| POST | `/projects/{id}/ask-me` | 🙋 나한테 물어봐 |
| POST | `/rqs/{id}/answer` · `/hint` · `/later` · `/idk` | 역질문 답하기 · 힌트 · 나중에 · 모르겠어 |
| GET | `/projects/{id}/reports` · `/reports/{id}` · `/reports/{id}.md` | 리포트 목록 · 8칸 · 마크다운 |
| PATCH | `/reports/{id}` | 열람 표시 · 미션 문구 고치기 |
| GET | `/monthly/{ym}` · `/monthly/{ym}.md` | 월간 리포트 |
| POST | `/projects/{id}/deep/open` · `/ask` · `/answer` | 심화 대화 |
| GET · PATCH · DELETE | `/projects/{id}/notes` · `/notes/{id}` | 생각 노트 |
| POST | `/import/local` | 브라우저 기록 옮기기 |

### 예 — 질문 보내기

```bash
TOKEN=abk_...   # issue_token 으로 받은 값
curl -s -X POST localhost:8000/api/v1/projects \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"스마트 화분","emoji":"🌱","format":"product","packs":["maker"]}'

curl -s -X POST localhost:8000/api/v1/projects/<프로젝트ID>/turns \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{"text":"흙 센서값이 400 밑이면 펌프 3초 켜는 코드 짜줘"}'
```

응답의 `outcome` 이 `answered` 면 `turn` · `answer` · (리듬이 찼으면) `rq` · (10번째면) `report` 가 같이 온다. `gated` · `emotional` 이면 `coachMessages` 만 온다.

## Claude 연결

| 작업 | 언제 | 모델 | effort | 시간 제한 |
|---|---|---|---|---|
| `answer` | 유효 질문마다 | `claude-opus-5-5` | medium | 45초 |
| `rq` | 마디가 찰 때 (역질문 문장 다듬기) | `claude-opus-5-5` | low | 15초 |
| `feedback` | 역질문에 직접 쓴 답 채점 | `claude-opus-5-5` | low | 15초 |
| `deep` | 심화 대화 | `claude-opus-5-5` | low | 15초 |

- 구조화 출력: `output_config.format = json_schema` (스키마는 `llm/schemas.py` 의 pydantic 모델에서 만든다).
- 캐시: 시스템 프롬프트(학생마다 같음)에 `cache_control`. 학생 · 프로젝트 맥락은 마지막 user 메시지의 `<context>` 에.
- 검증: 스키마 → 내용 규칙(`llm/validate.py`: 🙋 되묻기 줄, 개수 제한, F1 보기 3개, 점수 언급 제거) → 서버 상한(힌트 · 베끼기면 최대 1점).
- 폴백: 키 없음 · 시간 초과 · 거절 · 잘림 · 형식 두 번 실패 → 로컬 답 카드. 호출은 전부 `LLMCall` 에 남는다.
- Claude 호출(수십 초)은 DB 트랜잭션 밖에서 한다 — SQLite 쓰기 잠금을 오래 쥐지 않기 위해.

## 테스트

```bash
.venv/bin/python manage.py test --settings=config.settings.test
```

엔진 판정 · 전체 턴 흐름(역질문 · 리포트 · 멱등 · 한도) · 인증 · 프로젝트 · 옮기기 · Claude 경로(가짜 SDK) · 모든 관리자 화면을 확인한다. 테스트는 Claude 를 실제로 부르지 않는다.

## 운영 메모

- `DJANGO_SETTINGS_MODULE=config.settings.prod` + `DJANGO_SECRET_KEY` 필수.
- SQLite 는 WAL 모드 · `IMMEDIATE` 트랜잭션으로 연다. 동시 사용자가 많아지면 `DATABASES` 만 PostgreSQL 로 바꾸면 된다 (`select_for_update` 가 그때부터 실제로 잠근다).
- 지운 프로젝트 30일 뒤 실제 삭제: `apps.projects.services.projects.purge_expired()` 를 예약 작업에서 부른다.
