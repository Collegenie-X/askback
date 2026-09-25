# 틴스파크AI 기획문서

> AskBack 업그레이드 — 답은 끝까지 주되, 코칭하며, 기획서까지 완성한다  
> 2026-09-25 · @종필

---

## 0. 핵심 구조 — AskBack 엔진 + 틴스파크AI 프레임

```mermaid
flowchart TD
  subgraph 틴스파크AI["🔥 틴스파크AI (감싸는 프레임)"]
    direction TB
    GUIDE["7단계 기획 가이드<br/>불씨→봉화 레벨 코칭<br/>기획서·유저시나리오 완성까지"]
    
    subgraph AskBack["⚡ AskBack 엔진 (핵심)"]
      direction TB
      ANS["답은 끝까지 주면서 코칭<br/>규칙 카드·순서도·비교표"]
      LOOP["질문 2회 → 되묻기 1회<br/>열린 되묻기 + 2문 1역 역질문"]
      WB["화이트보드 테스트<br/>순서도·핵심·차별점·실패 조건"]
      RPT["10문마다 리포트<br/>질문 유형 O1→O4·베스트 질문·미션"]
      ANS --> LOOP --> WB --> RPT
    end
    
    MD["산출물<br/>기획서.md · 유저시나리오.md<br/>코딩 프롬프트 · 전체 기록.md"]
    
    GUIDE --> AskBack --> MD
  end

  style 틴스파크AI fill:#FFF3ED,stroke:#FF6B35
  style AskBack fill:#fff,stroke:#111119
  style ANS fill:#FF6B35,color:#fff
  style WB fill:#FF8C55,color:#fff
  style RPT fill:#111119,color:#FF6B35
  style MD fill:#111119,color:#FF6B35
```

| 레이어 | 역할 | 무엇이 달라지나 |
| --- | --- | --- |
| **AskBack 엔진** | 답+코칭, 2문 1역 되묻기, 화이트보드 테스트, 10문 리포트 | 그대로 유지 (핵심 기능 100%) |
| **틴스파크AI 프레임** | 7단계 가이드 코칭, 레벨 체계, 기획서·유저시나리오 완성 | 새로 감싸는 구조 |
| **산출물** | 기획서.md + 유저시나리오.md + 코딩 프롬프트 + 전체 기록.md | 기존 4칸 → 전체 기획 문서로 확장 |

---

## 1. 프로젝트 개요

| 항목 | 내용 |
| --- | --- |
| 서비스명 | 틴스파크AI (TeenSparkAI) |
| 이전 명칭 | AskBack |
| 한 줄 정의 | 답은 끝까지 주면서, 코칭과 되묻기로 학생이 직접 기획서를 완성하는 AI 코치 |
| 핵심 문장 | 열린 질문 하나가 제품의 설계도로 |
| 현재 URL | askback-omega.vercel.app |

### AskBack에서 무엇이 달라지나

```mermaid
flowchart LR
  subgraph BEFORE["AskBack (현재)"]
    B1["답+코칭"] --> B2["되묻기·역질문"]
    B2 --> B3["화이트보드 테스트"]
    B3 --> B4["10문 리포트"]
    B4 --> B5["기획서 4칸.md"]
  end
  subgraph AFTER["틴스파크AI (업그레이드)"]
    A1["답+코칭"] --> A2["되묻기·역질문"]
    A2 --> A3["화이트보드 테스트"]
    A3 --> A4["10문 리포트"]
    A4 --> A5["7단계 기획 가이드"]
    A5 --> A6["기획서 + 유저시나리오<br/>+ 코딩 프롬프트"]
  end
  B5 -.->|업그레이드| A5
  
  style BEFORE fill:#f5f5f5,stroke:#999
  style AFTER fill:#FFF3ED,stroke:#FF6B35
  style A5 fill:#FF6B35,color:#fff
  style A6 fill:#111119,color:#FF6B35
```

| 구분 | AskBack | 틴스파크AI |
| --- | --- | --- |
| 답+코칭 | ✅ | ✅ 그대로 |
| 2문 1역 되묻기 | ✅ | ✅ 그대로 |
| 화이트보드 테스트 | ✅ | ✅ 그대로 |
| 10문 리포트 | ✅ | ✅ 그대로 |
| 5가지 형식 | ✅ | ✅ 그대로 |
| 기획서 4칸 | ✅ | ✅ → 7단계 기획서로 확장 |
| 7단계 가이드 코칭 | ❌ | ✅ 신규 |
| 유저 시나리오 완성 | ❌ | ✅ 신규 |
| 코딩 프롬프트 생성 | ❌ | ✅ 신규 |
| 레벨 체계 (불씨→봉화) | ❌ | ✅ 신규 |
| 브랜드 리뉴얼 | ❌ | ✅ 신규 |

### 핵심 원칙 (AskBack에서 계승)

```mermaid
flowchart LR
  R1["🔥 정보는 끝까지<br/>판단은 네 몫"]
  R2["🔥 코드 대신 명세<br/>규칙 카드·순서도"]
  R3["🔥 억지로 묻지 않는다<br/>먼저 주고 끝에서 묻는다"]
  R1 --- R2 --- R3
  style R1 fill:#FF6B35,color:#fff
  style R2 fill:#FF6B35,color:#fff
  style R3 fill:#FF6B35,color:#fff
```

---

## 2. 브랜드 가이드

| 항목 | 규정 |
| --- | --- |
| 아이콘 | 다크 라운드 사각(rx12) 안 기하학적 번개 + 궤도 점 |
| 워드마크 | 소문자 `teensparkai` — teen(다크) + spark(오렌지) + ai(30% 불투명) |
| Accent | `#FF6B35` / 그라데이션 `#FF8C55→#FF4D00` |
| Dark Navy | `#111119` |
| 서체 | Space Grotesk(영문) + Pretendard(한글) |
| 메인 슬로건 | 아이디어에 불꽃, 설계는 내가 |
| 영문 | Design before code |
| 학생용 | AI한테 시키기 전에, 스파크 먼저 |
| 교사용 | 과정이 남는 AI 기획 코치 |

---

## 3. AskBack 엔진 — 질문이 지나가는 5칸

AskBack의 핵심 루프는 그대로 유지된다. 틴스파크AI는 이 루프 위에 기획 가이드를 얹는다.

### 질문 흐름 전체도

```mermaid
flowchart LR
  Q["💬 질문<br/>평소 말로"]
  ANS["📐 답 + 명세<br/>규칙 카드·순서도<br/>+ 열린 되묻기"]
  WB["🧭 화이트보드 테스트<br/>2문마다 역질문<br/>순서도·핵심·차별점·실패"]
  RPT["📊 리포트<br/>10문마다 8칸<br/>O1→O4 질문 유형"]
  MD["📄 .md<br/>기획서·전체 기록<br/>남고 주고받고 이어진다"]

  Q --> ANS --> WB --> RPT --> MD
  WB -.->|다시 질문| Q

  style ANS fill:#FF6B35,color:#fff
  style WB fill:#FF8C55,color:#fff
  style RPT fill:#111119,color:#FF6B35
  style MD fill:#111119,color:#FF6B35
```

### 되묻기 — 두 겹 구조

```mermaid
flowchart TD
  subgraph 매턴["🙋 열린 되묻기 — 모든 답 끝"]
    A1["답 + 규칙 카드"] --> A2["되묻기 질문 1개<br/>'그 400은 어디서 왔어?'"]
    A2 --> A3["학생이 직접 잰 값 가져옴<br/>320·610"]
  end

  subgraph 매2문["🧭 2문 1역 — 질문 두 번마다"]
    B1["역질문 카드<br/>'센서가 빠지면 무슨 일이?'"]
    B2["5초 고르기<br/>→ 30초 서술"]
    B1 --> B2
  end

  매턴 --> 매2문

  style A2 fill:#FF6B35,color:#fff
  style B1 fill:#FF8C55,color:#fff
```

### 화이트보드 테스트 — 4관문

```mermaid
flowchart LR
  T1["🔲 순서도<br/>'화면 닫고<br/>순서도 그려 봐'"]
  T2["🎯 핵심<br/>'이 서비스만<br/>하는 건 뭐야?'"]
  T3["⚡ 차별점<br/>'비슷한 거랑<br/>뭐가 달라?'"]
  T4["💥 실패 조건<br/>'센서가 0이면<br/>어떻게 돼?'"]

  T1 --> T2 --> T3 --> T4

  style T1 fill:#FFE0CC,stroke:#FF6B35
  style T2 fill:#FFBA8C,stroke:#FF6B35
  style T3 fill:#FF8C55,color:#fff
  style T4 fill:#FF6B35,color:#fff
```

### 10문 리포트 — 8칸 구성

```mermaid
flowchart TD
  RPT["📊 10문 리포트"]
  RPT --> C1["한눈에 7/10"]
  RPT --> C2["질문 유형 O1→O4"]
  RPT --> C3["질문 길이"]
  RPT --> C4["실은 것"]
  RPT --> C5["되묻기 응답"]
  RPT --> C6["걸린 곳"]
  RPT --> C7["베스트 질문"]
  RPT --> C8["🚩 다음 미션"]
  
  style RPT fill:#111119,color:#FF6B35
  style C8 fill:#FF6B35,color:#fff
```

### 질문 레벨 O1→O4

```mermaid
flowchart LR
  O1["O1 받아쓰기<br/>'코드 짜줘'"]
  O2["O2 코더<br/>'왜' 질문"]
  O3["O3 엔지니어<br/>맥락·제약·기준"]
  O4["O4 아키텍트<br/>검증·버릴 것"]
  O1 --> O2 --> O3 --> O4
  style O1 fill:#FFE0CC,stroke:#FF6B35
  style O2 fill:#FFBA8C,stroke:#FF6B35
  style O3 fill:#FF8C55,color:#fff
  style O4 fill:#FF6B35,color:#fff
```

### 5가지 형식

| 형식 | 설계의 의미 | 채울 칸 |
| --- | --- | --- |
| 🤖 제품 | 부품·센서·동작 규칙 | 동작 시나리오·부품·구조·순서 |
| 💻 서비스 | 화면·흐름·사용자 | 사용자·핵심기능·흐름·화면 |
| 🎬 캠페인 | 메시지·타겟·매체 | 핵심 메시지·타겟·매체·효과 측정 |
| 🔬 리서치 | 질문·방법·분석 | 연구 질문·수집 방법·분석·목차 |
| 📄 논문 | 주장·근거·반론 | 연구 질문·확인 방법·자료·목차 |

---

## 4. 틴스파크AI 프레임 — 7단계 기획 가이드

AskBack 엔진 위에 7단계 가이드를 얹어, 대화 도중 기획서와 유저 시나리오가 함께 완성된다.

### AskBack 루프 + 기획 가이드 통합도

```mermaid
flowchart TD
  START["💡 아이디어 한 줄로 시작"]

  subgraph STEP1["1단계 · 불씨 찾기"]
    Q1["질문·답·코칭"] --> AB1["되묻기·역질문"]
    AB1 --> WB1["화이트보드: 누구의 어떤 불편?"]
    WB1 --> CHECK1["스파크 체크 → 문제 한 문장"]
  end

  subgraph STEP2["2단계 · 누구를 위해"]
    Q2["질문·답·코칭"] --> AB2["되묻기·역질문"]
    AB2 --> WB2["화이트보드: 한 사람 구체화"]
    WB2 --> CHECK2["스파크 체크 → 사용자 카드"]
  end

  LV1(("🕯 Lv.1 불씨"))

  subgraph STEP3["3단계 · 아이디어 불붙이기"]
    Q3["질문·답·코칭"] --> AB3["되묻기·역질문"]
    AB3 --> WB3["화이트보드: 차별점"]
    WB3 --> CHECK3["스파크 체크 → 한 줄 정의"]
  end

  subgraph STEP4["4단계 · 기능 고르기"]
    Q4["질문·답·코칭"] --> AB4["되묻기·역질문"]
    AB4 --> WB4["화이트보드: 기능 우선순위"]
    WB4 --> CHECK4["스파크 체크 → 기능 3개"]
  end

  RPT1["📊 10문 리포트 #1"]
  LV2(("🔥 Lv.2 불꽃"))

  subgraph STEP5["5단계 · 흐름 그리기"]
    Q5["질문·답·코칭"] --> AB5["되묻기·역질문"]
    AB5 --> WB5["화이트보드: 순서도·실패 조건"]
    WB5 --> CHECK5["스파크 체크 → 사용자 흐름"]
  end

  subgraph STEP6["6단계 · 화면 스케치"]
    Q6["질문·답·코칭"] --> AB6["되묻기·역질문"]
    AB6 --> WB6["화이트보드: 화면 구성"]
    WB6 --> CHECK6["스파크 체크 → 화면 목록"]
  end

  LV3(("🔦 Lv.3 횃불"))

  subgraph STEP7["7단계 · 발사 준비"]
    Q7["질문·답·코칭"] --> AB7["되묻기·역질문"]
    AB7 --> WB7["화이트보드: 규칙·데이터"]
    WB7 --> CHECK7["스파크 체크 → 규칙·순서"]
  end

  RPT2["📊 10문 리포트 #2"]
  LV4(("🚀 Lv.4 봉화"))

  FIN["📄 스파크노트 (기획서)<br/>📄 유저 시나리오.md<br/>💻 코딩 프롬프트<br/>📁 전체 기록.md"]

  START --> STEP1 --> STEP2 --> LV1
  LV1 --> STEP3 --> STEP4
  STEP4 --> RPT1 --> LV2
  LV2 --> STEP5 --> STEP6 --> LV3
  LV3 --> STEP7
  STEP7 --> RPT2 --> LV4 --> FIN

  style LV1 fill:#FFE0CC,stroke:#FF6B35
  style LV2 fill:#FFBA8C,stroke:#FF6B35
  style LV3 fill:#FF8C55,color:#fff
  style LV4 fill:#FF6B35,color:#fff
  style RPT1 fill:#111119,color:#FF6B35
  style RPT2 fill:#111119,color:#FF6B35
  style FIN fill:#111119,color:#FF6B35
```

### 각 단계 안에서 일어나는 일

```mermaid
flowchart LR
  A["🧭 스파크 안내<br/>이 단계 목표"] 
  B["💬 질문·답·코칭<br/>(AskBack 엔진)"]
  C["🙋 되묻기<br/>열린 질문"]
  D["🧭 역질문<br/>2문 1역"]
  E["🔲 화이트보드<br/>순서도·핵심·차별점"]
  F["✅ 스파크 체크<br/>완료 조건 확인"]
  G["📄 기획서 칸 채움"]

  A --> B --> C --> D --> E --> F --> G
  C -.->|반복| B
  F -.->|미통과| B

  style B fill:#FF6B35,color:#fff
  style E fill:#FF8C55,color:#fff
  style G fill:#111119,color:#FF6B35
```

### 7단계 한눈에 보기

| 단계 | 이름 | AskBack 엔진이 하는 것 | 기획 가이드가 하는 것 | 산출물 |
| --- | --- | --- | --- | --- |
| 1 | 불씨 찾기 | 답+코칭, 되묻기 "왜 불편해?" | 빈칸 `___는 ___할 때 불편하다` | 문제 한 문장 |
| 2 | 누구를 위해 | 역질문 "지금은 어떻게 버텨?" | 사용자 카드 템플릿 | 사용자 카드 |
| 3 | 아이디어 | 화이트보드 "차별점이 뭐야?" | 비교표 가이드 | 한 줄 정의+비교표 |
| 4 | 기능 고르기 | 되묻기 "없으면 곤란해?" | 꼭/좋음/나중 분류 가이드 | 기능 우선순위표 |
| 5 | 흐름 그리기 | 화이트보드 "순서도 그려 봐" | 흐름 템플릿 + 실패 조건 | 사용자 흐름도 |
| 6 | 화면 스케치 | 역질문 "화면 몇 개야?" | 화면별 요소 가이드 | 화면 구성표 |
| 7 | 발사 준비 | 되묻기 "기기에 뭘 기억해?" | 규칙·데이터·순서 가이드 | 스파크노트+프롬프트 |

### 레벨 체계

```mermaid
flowchart LR
  L1["🕯 Lv.1 불씨<br/>1-2단계 완료<br/>문제·사용자 확인"]
  L2["🔥 Lv.2 불꽃<br/>3-4단계 + 리포트#1<br/>아이디어·기능 확정"]
  L3["🔦 Lv.3 횃불<br/>5-6단계 완료<br/>흐름·화면 설계"]
  L4["🚀 Lv.4 봉화<br/>7단계 + 리포트#2<br/>기획서 완성"]
  L1 --> L2 --> L3 --> L4
  style L1 fill:#FFE0CC,stroke:#FF6B35
  style L2 fill:#FFBA8C,stroke:#FF6B35
  style L3 fill:#FF8C55,color:#fff
  style L4 fill:#FF6B35,color:#fff
```

---

## 5. 타겟 사용자

| 궤도 | 사용자 | 핵심 니즈 | 고통 |
| --- | --- | --- | --- |
| 1 | 중학생 서연 (14세) | 안내받으며 기획서 완성 | "코드 짜줘" 후 설명 못 함 |
| 2 | 고등학생 도윤 (17세) | 심사위원에게 보여 줄 문서 | 기능만 많고 핵심 없음 |
| 3 | 초등 5학년 하린 (11세) | 짧고 쉬운 단계 | 긴 문서 못 씀 → 간편 모드 |
| 4 | 교사 김 선생님 | 학생별 진행·평가 근거 | 한 명씩 검문할 시간 없음 |

| 항목 | 내용 |
| --- | --- |
| 기기 | 크롬북·태블릿(주), 스마트폰(보조) |
| 수업 | 45분 1차시에 1–2단계 |
| 완성 | 4–6차시 또는 2–3시간 |
| 가입 | MVP 가입 없이 기기 저장, 교사 클래스 v2 |

---

## 6. 유저 시나리오

### 시나리오 A · 학생 서연의 전체 여정

```mermaid
flowchart TD
  START["서연: '급식 앱 만들어줘'"]
  
  subgraph S1["1단계 · 불씨 찾기"]
    Q1A["질문: '급식 앱 코드 짜줘'"]
    ANS1["스파크 답+코칭: 순서도 + 규칙 카드"]
    ASK1["되묻기: '어떤 학생이, 언제, 왜?'"]
    WB1["화이트보드: '불편한 순간 그려 봐'"]
    OUT1["✅ 문제 한 문장 완성"]
  end

  subgraph S2["2단계 · 누구를 위해"]
    ANS2["답+코칭: 사용자 분석"]
    ASK2["역질문: '전교생 중 딱 한 명은?'"]
    WB2["화이트보드: '그 사람의 하루는?'"]
    OUT2["✅ 사용자 카드: 민지(중2, 알레르기)"]
  end

  LV1(("🕯 불씨"))

  subgraph S34["3-4단계 · 아이디어+기능"]
    ANS3["답+코칭: 경쟁 분석"]
    ASK3["되묻기: '민지에게만 필요한 건?'"]
    WB3["화이트보드: '차별점 하나는?'"]
    ASK4["역질문: '없으면 곤란한 기능은?'"]
    OUT4["✅ 한 줄 정의 + 기능 3개"]
  end

  RPT1["📊 10문 리포트 #1<br/>O1→O3 성장"]
  LV2(("🔥 불꽃"))

  subgraph S56["5-6단계 · 흐름+화면"]
    ANS5["답+코칭: 흐름도"]
    ASK5["되묻기: '알레르기는 언제 등록?'"]
    WB5["화이트보드: '순서도 그려 봐'"]
    ASK6["역질문: '화면 몇 개야?'"]
    OUT6["✅ 흐름도 + 화면 3개"]
  end

  LV3(("🔦 횃불"))

  subgraph S7["7단계 · 발사 준비"]
    ANS7["답+코칭: 데이터 설계"]
    ASK7["되묻기: '기기에 뭘 기억해야 해?'"]
    WB7["화이트보드: '규칙 정리'"]
    OUT7["✅ 규칙·데이터·순서"]
  end

  RPT2["📊 10문 리포트 #2"]
  LV4(("🚀 봉화"))

  FIN["📄 스파크노트 완성<br/>📄 유저 시나리오.md<br/>💻 코딩 프롬프트 복사<br/>→ 바이브코딩 시작"]

  START --> S1 --> S2 --> LV1
  LV1 --> S34 --> RPT1 --> LV2
  LV2 --> S56 --> LV3
  LV3 --> S7 --> RPT2 --> LV4 --> FIN

  style LV1 fill:#FFE0CC,stroke:#FF6B35
  style LV2 fill:#FFBA8C,stroke:#FF6B35
  style LV3 fill:#FF8C55,color:#fff
  style LV4 fill:#FF6B35,color:#fff
  style RPT1 fill:#111119,color:#FF6B35
  style RPT2 fill:#111119,color:#FF6B35
  style FIN fill:#111119,color:#FF6B35
```

### 시나리오 B · 막힌 순간 대응

```mermaid
flowchart TD
  STUCK["학생이 막힘"]
  BLANK["빈칸 5분"] --> R1["힌트→예시→코치의 생각 (3단)"]
  DUNNO["'몰라요'"] --> R2["더 작은 질문으로 쪼개기"]
  CHEAT["'대신 써 줘'"] --> R3["선택지 3개 제시, 대신 안 씀"]
  FAIL["화이트보드 미통과"] --> R4["해당 관문만 다시"]
  SKIP["급하면"] --> R5["[나중에] 버튼"]
  STUCK --> BLANK & DUNNO & CHEAT & FAIL & SKIP
  style STUCK fill:#ff4444,color:#fff
  style R1 fill:#FF6B35,color:#fff
  style R2 fill:#FF6B35,color:#fff
  style R3 fill:#FF6B35,color:#fff
```

### 시나리오 C · 교사 김 선생님

```mermaid
flowchart LR
  T1["1차시<br/>/demo 읽기"] --> T2["2차시<br/>형식 선택"]
  T2 --> T3["3-5차시<br/>학생 대화<br/>🧩 n/4 확인"]
  T3 --> T4["6차시<br/>첫 리포트<br/>베스트 질문"]
  T4 --> T5["7차시<br/>초안.md"]
  T5 --> T6["8차시<br/>발표"]
  style T3 fill:#FF6B35,color:#fff
```

---

## 7. 기능 명세

### 기능 구조도

```mermaid
flowchart TD
  subgraph ENGINE["⚡ AskBack 엔진 (유지)"]
    E1["답+코칭<br/>규칙 카드·순서도·비교표"]
    E2["열린 되묻기<br/>모든 답 끝"]
    E3["2문 1역 역질문<br/>5초 고르기~30초 서술"]
    E4["화이트보드 테스트<br/>순서도·핵심·차별점·실패"]
    E5["10문 리포트<br/>8칸·O1→O4·미션"]
    E6["5가지 형식<br/>제품·서비스·캠페인·리서치·논문"]
    E7["기획서 4칸 + 전체 기록.md"]
  end

  subgraph FRAME["🔥 틴스파크AI 프레임 (신규)"]
    F1["7단계 기획 가이드"]
    F2["단계별 빈칸 템플릿"]
    F3["스파크 체크 (완료 조건)"]
    F4["레벨 체계 (불씨→봉화)"]
    F5["유저 시나리오 가이드"]
    F6["코딩 프롬프트 자동 조립"]
    F7["스파크노트 (확장 기획서)"]
  end

  subgraph INFRA["🔧 공통 인프라"]
    I1["자동 저장 (localStorage)"]
    I2["내보내기 (.md·PDF·복사)"]
    I3["안전 장치 (미성년자)"]
  end

  ENGINE --> FRAME --> INFRA

  style ENGINE fill:#fff,stroke:#111119
  style FRAME fill:#FFF3ED,stroke:#FF6B35
  style F1 fill:#FF6B35,color:#fff
  style F6 fill:#111119,color:#FF6B35
```

### MVP vs v2

| ID | 기능 | 범위 |
| --- | --- | --- |
| E1–E7 | AskBack 엔진 전체 | MVP |
| F1 | 7단계 기획 가이드 | MVP |
| F2 | 빈칸 템플릿 | MVP |
| F3 | 스파크 체크 | MVP |
| F4 | 레벨 체계 | MVP |
| F5 | 유저 시나리오 가이드 | MVP |
| F6 | 코딩 프롬프트 조립 | MVP |
| F7 | 스파크노트 | MVP |
| I1 | 자동 저장 | MVP |
| I2 | 내보내기 | MVP |
| I3 | 안전 장치 | MVP |
| — | 손그림 업로드 | v2 |
| — | 클래스·교사 대시보드 | v2 |
| — | 계정·클라우드 저장 | v2 |

---

## 8. 화면 설계

### 화면 흐름 (AskBack 화면 + 틴스파크 확장)

```mermaid
flowchart LR
  HOME["홈"]
  NEW["프로젝트 시작<br/>형식 선택"]
  CHAT["대화 화면<br/>(AskBack 엔진)"]
  GUIDE["기획 가이드 패널<br/>(틴스파크 프레임)"]
  WB["화이트보드<br/>역질문 카드"]
  RPT["리포트"]
  NOTE["스파크노트<br/>미리보기"]
  EXPORT["내보내기"]

  HOME -->|새 프로젝트| NEW --> CHAT
  HOME -->|이어하기| CHAT
  CHAT <-->|사이드 패널| GUIDE
  CHAT --> WB --> CHAT
  CHAT -->|10문| RPT --> CHAT
  CHAT -->|7단계 완료| NOTE --> EXPORT

  style CHAT fill:#FF6B35,color:#fff
  style GUIDE fill:#FFE0CC,stroke:#FF6B35
  style NOTE fill:#111119,color:#FF6B35
```

### 정보 구조

```
틴스파크AI
├── 홈
│   ├── 새 프로젝트 시작 (+ 형식 선택)
│   └── 이어하기 (저장된 프로젝트)
├── 대화 화면 (AskBack 엔진)
│   ├── 헤더: 진행 바 · 레벨 · 🧩 n/4
│   ├── 대화 영역 (답+코칭·되묻기)
│   ├── 화이트보드 카드 (2문 1역)
│   └── 사이드: 기획 가이드 패널
│       ├── 현재 단계 안내
│       ├── 빈칸 템플릿
│       ├── 스파크 체크
│       └── 기획서 채움 현황
├── 리포트 (10문마다)
├── 스파크노트 미리보기
└── 내보내기
    ├── 기획서.md / 유저시나리오.md
    ├── 전체 기록.md
    ├── PDF
    └── 코딩 프롬프트 복사
```

---

## 9. 산출물 — 남는 것 4가지

```mermaid
flowchart LR
  NOTE["📄 스파크노트<br/>(기획서)"]
  SCENARIO["📄 유저 시나리오.md"]
  PROMPT["💻 코딩 프롬프트"]
  RECORD["📁 전체 기록.md<br/>(AI 활용 증빙)"]
  
  NOTE --> PROMPT
  
  style NOTE fill:#FF6B35,color:#fff
  style PROMPT fill:#111119,color:#FF6B35
  style RECORD fill:#111119,color:#FF6B35
```

| 산출물 | 내용 | 용도 |
| --- | --- | --- |
| 스파크노트 (기획서) | 7단계 답을 한 장으로 조립 | 발표, 수행평가, 코딩 입력 |
| 유저 시나리오.md | 사용자 흐름·화면·실패 상황 정리 | 팀원 공유, 개발 가이드 |
| 코딩 프롬프트 | 기획서를 코딩 도구용 프롬프트로 변환 | Cursor·Claude Code에 붙여넣기 |
| 전체 기록.md | 질문·되묻기 응답·화이트보드 전체 로그 | AI 활용 표기 증빙, 과정 평가 |

---

## 10. 기술 스택과 개발 착수

### 기술 스택

```mermaid
flowchart TD
  subgraph Front["프론트엔드"]
    NEXT["Next.js + TS"] --> TW["Tailwind"]
    NEXT --> FONT["Space Grotesk + Pretendard"]
  end
  subgraph Back["백엔드"]
    API["API Routes"] --> CLAUDE["Claude API"]
  end
  subgraph Store["저장"]
    LS["localStorage (MVP)"]
    SB["Supabase (v2)"]
  end
  NEXT --> LS -.-> SB
  NEXT --> API
  style CLAUDE fill:#FF6B35,color:#fff
```

### 개발 로드맵

```mermaid
gantt
  title 틴스파크AI MVP 로드맵
  dateFormat YYYY-MM-DD
  section 1주 AskBack 이관
  기존 코드 정리·리브랜딩    :a1, 2026-09-28, 4d
  스파크 캐릭터·진행 바      :a2, after a1, 3d
  section 2주 기획 가이드
  7단계 가이드·템플릿        :b1, 2026-10-05, 4d
  스파크 체크 로직            :b2, after b1, 3d
  section 3주 통합
  AskBack 루프 + 가이드 연동  :c1, 2026-10-12, 4d
  스파크노트 조립·내보내기    :c2, after c1, 3d
  section 4주 마무리
  유저 시나리오 가이드        :d1, 2026-10-19, 3d
  코딩 프롬프트 생성          :d2, after d1, 2d
  교실 테스트                :d3, after d2, 2d
```

### 코딩 착수 체크리스트

- [ ] AskBack 기존 코드 상태 점검 (엔진 재사용 범위)
- [ ] 7단계 가이드 문구·템플릿·완료 조건 확정
- [ ] 스파크 캐릭터 이미지 3종
- [ ] Claude API 키 + Vercel 환경변수
- [ ] 저장소 + 도메인 결정
- [ ] 안전 장치 필터 목록
- [ ] 교실 테스트 일정 + 학생 확보

---

> 틴스파크AI · AskBack 엔진 + 기획 가이드 프레임  
> 답은 끝까지 주되, 코칭하며, 기획서까지 완성한다  
> Design before code · 2026-09-25
