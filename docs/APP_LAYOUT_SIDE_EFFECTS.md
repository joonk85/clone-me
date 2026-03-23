# 앱 레이아웃 Claude UI 구조 — Side Effect 체크

> 전체 앱 레이아웃 변경 시 영향도 정리.

---

## 1. 변경 요약

| 구분 | 내용 |
|------|------|
| **로그인 시** | Left Rail(240px) + 상단 헤더(페이지 타이틀, 토큰 pill) + 메인(Outlet). 모바일: rail 숨김, 햄버거로 슬라이드 오픈, 배경 클릭 시 닫힘, 하단 탭바 제거 |
| **비로그인 시** | 기존 Nav만 (상단 로고+탭, 모바일 하단 탭바 유지) |
| **적용 페이지** | 홈, 마켓(탐색), 채팅, 마이, 대시보드 |

---

## 2. 영향 파일

| 파일 | 변경 |
|------|------|
| `src/routes/Layout.jsx` | 분기: 비로그인 → Nav+Outlet / 로그인 → AppShell(rail+header+Outlet) |
| `src/common/AppShell.jsx` (신규) | Rail(로고, 새 대화, 대화 목록, 하단 유저 블록) + 헤더(타이틀, 토큰 pill) + Outlet |
| `src/contexts/PageTitleContext.jsx` (신규) | 페이지별 타이틀 (Chat에서 clone명 설정) |
| `src/styles/globalCss.js` 또는 `app-shell.css` | rail 240px, 모바일 오버레이 |
| `src/member/Chat.jsx` | 앱 rail 사용 시 채팅 전용 rail 제거, 메인 영역만 렌더 |

---

## 3. 데이터 의존

- Rail 대화 목록: `fetchConversationsForChatRail(supabase, user.id)`
- 하단 유저: `fetchMyUserRow(supabase)`, `fetchTokenSummary(supabase, user.id)` (RLS)
- 토큰 pill: 동일 `fetchTokenSummary`

---

## 4. Chat.jsx 연동

- 앱 레이아웃에서 rail을 제공하므로 Chat 내부의 대화 목록/새 대화 rail 제거.
- Chat은 메인 영역만: 헤더(클론명)는 Layout 헤더에 타이틀로 표시 가능 (PageTitleContext로 clone.name 설정).

---

## 적용 완료 내역

- **Layout.jsx:** 항상 PageTitleProvider + AppShell. 비로그인/로그인 동일 shell. 하단 탭바 제거.
- **AppShell.jsx (스펙 반영):**
  - **Left Rail:** 전체 높이 고정. 열림 240px / 접힘 56px. Collapse 토글 버튼(ChevronLeft/Right) 항상 표시. `localStorage` 키 `clone_me_rail_collapsed`로 새로고침 유지.
  - **비로그인:** 상단 로고(collapse 시 favicon만 "c" 원형) + 토글. 메뉴: 홈(HomeIcon), 마스터 찾기(MagnifyingGlassIcon). 하단: 로그인(ArrowRightOnRectangleIcon).
  - **로그인:** 상단 동일. 메뉴: 홈, 마스터 찾기, 대화 히스토리(스크롤, 항목=아바타+마스터명+미리보기; collapse 시 아바타만). 하단: 내 이름+아바타, 클릭 시 드롭업(마이페이지 /my, 설정 /settings). Heroicons 사용.
  - **헤더:** 비로그인=우측 로그인 버튼. 로그인=아바타+토큰 pill(/my/tokens)+마스터 시 마스터 전환(/dashboard), 비마스터 시 마스터 만들기(/master-register).
  - **모바일:** rail 기본 숨김, 햄버거로 슬라이드 오픈, 배경 클릭·Escape로 닫기. 하단 탭바 없음.
- **PageTitleContext / AppRailContext:** 유지.
- **Chat.jsx:** 앱 rail 사용, setPageTitle(clone.name), refreshRail() from context.
- **App.jsx:** Routes 래퍼 flex:1 minHeight:0.
