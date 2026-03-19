# 전체 플로우 및 Left Rail 구조 스펙

> 2026.03 재정리 — 핵심 플로우, 멤버/마스터 Rail, 우측 헤더, 모바일.

---

## 1. 핵심 플로우

1. **회원가입 → 멤버**
2. **"클론 만들기" CTA 클릭**
   → 마스터 프로필 생성 (이름/직함/소개)
   → 클론 생성
3. **이후 마스터 모드 전환 가능**

---

## 2. 멤버 모드 Rail

| 구역 | 내용 |
|------|------|
| **상단** | clone.me 로고 + collapse 토글 |
| **메뉴** | 홈, 마스터 찾기, 대화 히스토리(스크롤, 항목: 마스터 아바타 + 마스터명 + 내용...) |
| **하단 고정** | 내 이름 클릭 → 드롭업 (마이페이지, 설정) / "내 클론 만들기" 버튼 (미등록 → /master-register, 등록됨 → 마스터 모드로 전환) |

---

## 3. 마스터 모드 Rail

| 구역 | 내용 |
|------|------|
| **상단** | clone.me 로고 + collapse 토글 |
| **메뉴** | 홈, 내 클론 목록(스크롤, 항목: 클론 아바타 + 클론명 + 활성/비활성, 클릭 → /dashboard/:cloneId), 하단 "+ 새 클론 만들기" 버튼 |
| **하단 고정** | 내 이름 클릭 → 드롭업 (마스터 스튜디오, 설정) / "멤버로 전환" 버튼 |

---

## 4. 우측 상단 헤더

| 모드 | 내용 |
|------|------|
| **멤버 모드** | 토큰 잔액 pill (클릭 시 /my/tokens), "내 클론 만들기" 버튼 |
| **마스터 모드** | 토큰 잔액 pill, [멤버 \| 마스터] 토글 스위치 |
| **비로그인** | 로그인 버튼 |

---

## 5. 모바일

- Rail 기본 숨김
- 햄버거 → 슬라이드 오픈
- 배경 클릭 시 닫힘

---

## 6. 공통

- CSS Variables만 사용
- Heroicons 사용
- collapse 상태 localStorage 저장 (`clone_me_rail_collapsed`)
- 마스터 등록 여부: `masters` 테이블 + `users.has_master_profile` 확인

---

## 7. Side Effect 요약

| 파일 | 변경 |
|------|------|
| `src/common/AppShell.jsx` | Rail 상단 항상 clone.me. 멤버: 홈+마스터 찾기+대화 히스토리, 하단 이름 드롭업+내 클론 만들기. 마스터: 홈+내 클론 목록+새 클론 만들기, 하단 이름 드롭업(마스터 스튜디오/설정)+멤버로 전환. 헤더: 멤버=내 클론 만들기, 마스터=토글. `isMaster = masterRow \|\| userRow?.has_master_profile` |
| `src/contexts/AppStateContext.jsx` | 변경 없음 (masterMode 유지) |
| 라우트 | /master-register, /dashboard, /dashboard/create, /dashboard/:cloneId, /my, /my/settings 동일 |
