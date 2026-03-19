# 마스터 등록 플로우 간소화 — Side Effect 체크

## 요약

- **기존:** /master-register 3단계(기본정보 → 인증 선택 → 완료) 후 /dashboard/create에서 첫 클론 제작.
- **변경:** /master-register = **클론 만들기 1단계만** (이름·설명·컬러) → 제출 시 마스터 없으면 생성 + 클론 1개 생성 → **바로 /dashboard/:id 로 이동**. 인증·자료·프로필 링크는 Step 2/3로 나중에(대시보드·마이페이지에서).

---

## 1. /master-register 플로우 변경

| 항목 | 변경 전 | 변경 후 |
|------|--------|--------|
| 단계 수 | 3 (기본정보, 인증 선택, 완료) | **1** (클론 이름·설명·컬러만) |
| 제출 시 | masters INSERT + users 역할 갱신 | 마스터 없으면 masters INSERT + users 갱신 + **clones INSERT** |
| 완료 후 | Step 4 화면 → "첫 클론 만들기" → /dashboard/create | **즉시 /dashboard/:cloneId 로 이동** |
| 인증 | Step 2에서 "지금/나중에" 선택 | **제거** — 인증은 마이페이지 → 인증 배지에서만 (선택) |

---

## 2. /dashboard/create 와의 관계

| 시나리오 | 동작 |
|----------|------|
| **마스터 없음 + /master-register** | 단일 폼(이름·설명·컬러) → master 생성(필요 시) + clone 1개 생성 → /dashboard/:id |
| **마스터 없음 + /dashboard/create** | 기존처럼 "마스터 프로필이 필요해요" → /master-register 로 유도 (변경 없음) |
| **마스터 있음 + /master-register** | **리다이렉트** → /dashboard/create (두 번째 클론은 Create에서) |
| **마스터 있음 + /dashboard/create** | 기존 3단계(자료 → 클론 설정 → 출시) 유지 — "클론 꾸미기"는 대시보드에서 |

- **통합 여부:** 통합하지 않음. /master-register = 첫 클론 전용 최소 폼. /dashboard/create = 추가 클론 + 자료/토큰 등 설정.

---

## 3. masters 테이블 필드

- **스키마 변경 없음.** 기존 `masters` 컬럼 그대로 사용.
- 최소 생성 시: `user_id`, `name`, `slug` 필수. `slug`는 클론 이름 기반 자동 생성(영문·숫자·하이픈, 중복 시 접미사).
- `title`, `bio`, `signature`, `tags`, `links` 등은 NULL 또는 기본값. Step 2(클론 꾸미기)·프로필에서 나중에 채움.

---

## 4. 영향 파일

| 파일 | 변경 |
|------|------|
| **src/master/MasterRegister.jsx** | 전면 수정 — 단일 폼(이름·설명·컬러), 제출 시 master(없으면 생성) + clone 생성 → navigate(/dashboard/:id) |
| **src/master/Create.jsx** | noMaster 시 /master-register 유도 유지. 그 외 로직 유지 |
| **src/App.jsx** | 라우트 유지 (/master-register) |
| **진입점** | Home, Market, MemberBecomeMaster, MyClones 등 기존대로 /master-register 사용 |

---

## 5. Step 2 / Step 3 (문서상 정리)

- **Step 2 (클론 꾸미기, 선택):** 대시보드(/dashboard/:id)에서 — 자료 업로드, 프로필 링크(LinkedIn/YouTube/개인 사이트), 소개글. (기존 CloneDash·프로필 편집)
- **Step 3 (인증, 선택):** 마이페이지 → 인증 배지 — 서류 업로드 → 검증 배지, 링크 인증. (기존 MasterVerify)

---

## 6. 적용 완료

- **MasterRegister.jsx** — 단일 폼(클론 이름·한 줄 설명·테마 컬러), 제출 시 master 생성 + clone 생성 → `navigate(/dashboard/:id)`. 기존 마스터 있으면 `/dashboard/create` 리다이렉트.
- **Create.jsx** — 변경 없음. noMaster 시 `/master-register` 유도 유지.
- **masters 테이블** — 스키마 변경 없음. slug는 클론 이름 기반 자동 생성.
- **MemberBecomeMaster.jsx** — 카피만 새 플로우에 맞게 수정.
