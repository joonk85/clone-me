# 홈(/) 비로그인 히어로 섹션 수정 — Side Effect 체크

> 수정 전 영향도 정리. BRAIN·PROGRESS 기준.

---

## 1. 홈(/) 수정 시 영향받는 컴포넌트 목록

| 구분 | 파일/위치 | 영향 |
|------|-----------|------|
| **라우트** | `App.jsx` | `<Route index element={<Home />} />` — `/` 단일 진입점 |
| **레이아웃** | `Layout.jsx` | `Outlet`으로 Home 렌더. Nav + 하단 탭 여백만 적용 |
| **네비** | `Nav.jsx` | `path: "/"` → "홈" 링크, `activePath`가 `/`일 때 활성 |
| **직접 참조** | 없음 | 다른 컴포넌트가 Home을 import하거나 re-export하지 않음 |
| **데이터** | `Home.jsx` 내부 | `fetchMarketClones`(guest), `fetchMasterHomeSummary`(master), `fetchRecentConversations`·`fetchTokenSummary`(member) — 히어로는 **guest**만 사용 → `loadGuestFeatured`·`guestFeatured` |

**결론:** 히어로는 **비로그인(guest) 분기 전용**. `Home.jsx` 내 `mode === "guest"` 블록만 수정하면 되며, 멤버/마스터 UI·다른 페이지는 영향 없음.

---

## 2. 로그인/멤버/마스터 상태별 홈 분기

| 상태 | 분기 조건 | 렌더 블록 | 비고 |
|------|-----------|-----------|------|
| **guest** | `!user?.id` | `if (mode === "guest") { ... }` (L330~618) | **비로그인 히어로 + 통계 + Featured + CTA** |
| **member** | `user` 있고 `role !== "master"` | `if (mode === "member") { ... }` (L611~848) | 토큰 카드·최근 대화·추천 클론 |
| **master** | `user` 있고 `role === "master"` | 마지막 `return` (L854~) | 내 클론 수·미답변 피드백·대시보드 링크 |

- 분기: **한 컴포넌트 내 `mode` state**로만 처리. 별도 라우트(/member, /master) 없음.
- 히어로 수정 시 **guest 블록만** 건드리면 되고, member/master는 그대로 유지.

---

## 3. 네비게이션 변경 시 영향받는 파일

| 변경 유형 | 영향 파일 | 비고 |
|-----------|-----------|------|
| **탭/링크 추가·삭제** | `Nav.jsx` (`items` 배열, 데스크톱 탭·모바일 탭바) | 홈 히어로와 무관 |
| **탭바 표시 경로** | `navShell.js` → `shouldShowMobileTabBar(pathname)` | `/`는 항상 true → 홈에서 하단 탭바 표시 |
| **홈으로 이동** | `Nav.jsx` `handleLogo` → `navigate("/")`, 탭 "홈" → `path: "/"` | 히어로 수정과 무관 |
| **히어로 내 CTA** | `Home.jsx` guest 블록 내 `navigate("/market")`, `navigate("/master-register")`, `navigate("/signup")`, `navigate("/login")` | 히어로 복사/버튼 변경 시 여기만 점검 |

**결론:** 히어로만 수정할 경우 **Nav·navShell 수정 불필요**. CTA 링크/버튼만 바꾸면 그에 맞춰 `navigate`만 확인하면 됨.

---

## 4. CSS 변경 시 전역 스타일 충돌 가능성

| 대상 | 위치 | 충돌 위험 | 비고 |
|------|------|------------|------|
| **`.home-hero-gradient-title`** | `globalCss.js` (L126~139) | **홈 전용** 클래스명. 다른 페이지에서 미사용 → 충돌 없음 | 히어로 제목(h1)에만 사용. 수정 시 이 클래스 또는 인라인으로 대체 가능 |
| **`--cy` / `--cyd` / `--cyg` 등** | `globalCss.js` :root | 전역 토큰. 히어로에서 사용 중. **값만** 바꾸면 마켓·채팅·버튼 등 전반 영향 | 히어로만 다르게 하려면 **새 변수**(예: `--hero-accent`) 또는 **인라인/스코프** 사용 권장 |
| **`.nav-scroll`** | `globalCss.js` | Featured 가로 스크롤에 사용. 클래스명 공용 → 다른 nav-scroll 구간과 스타일 공유 | 히어로 자체와는 무관. Featured 영역 스크롤만 해당 |
| **인라인 스타일** | `Home.jsx` 내부 | 컴포넌트 로컬. 전역 오버라이드 없음 | 계속 사용해도 됨 |

**결론:**  
- **전역 토큰**(`--cy` 등) 이름/값 변경 금지.  
- 히어로 전용 색/배경이 필요하면 **새 CSS 변수** 또는 **Home 내부 인라인/스코프 클래스**로 처리.  
- `.home-hero-gradient-title` 수정 시 `globalCss.js`와 `Home.jsx` 사용처만 맞추면 됨.

---

## 5. 기타 참고 (수정 시 체크)

- **Featured 카드 클릭:** 수정 완료. `navigate(\`/clone/${c.id}\`)` → `navigate(\`/chat/${c.id}\`)` 로 변경해 기존 라우트 `/chat/:cloneId` 와 일치시킴. (멤버 추천 카드 동일 적용)
- **Supabase 미연결:** `!supabaseConfigured` 시 Featured 영역에 안내 문구. 히어로와 무관.
- **접근성:** 히어로 h1은 1페이지만 유지. 시각 효과용 `aria-hidden` 이미 적용됨.

---

## 6. 수정 권장 순서

(히어로 섹션을 **추가로** 수정할 때 아래 순서로 진행.)

1. **비로그인 히어로만** 수정: `Home.jsx`의 `mode === "guest"` 블록 내 **첫 번째 `<section>`** (L335~464).
2. **스타일:** 전역 색 바꾸지 말고, 필요 시 `globalCss.js`에 `--hero-*` 추가 또는 Home 내부 인라인.
3. **`.home-hero-gradient-title`:** 문구/디자인 변경 시 동일 클래스 유지하거나, 제거 후 인라인/다른 클래스로 대체.
4. CTA·통계·Featured·하단 CTA는 필요 시 단계적으로 수정.

### 적용 완료 내역

- **Featured·Recommend 카드 링크:** `navigate(\`/clone/${c.id}\`)` → `navigate(\`/chat/${c.id}\`)` (§5 반영).
- **히어로 섹션:** 첫 번째 `<section>`에 `className="home-hero"`, `aria-label="메인 소개"` 적용. `globalCss.js`에 `.home-hero` 스코프 플레이스홀더 추가.
- **추가 디자인 변경**(문구·레이아웃·CTA 등)은 위 1~4 순서대로 진행하면 됨.
