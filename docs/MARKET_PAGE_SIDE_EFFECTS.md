# 마스터 탐색 `/market` — Side effects

> 2026-03: 레퍼런스형 **다크 마켓** UI. 전용 상단 바(검색·토큰 링·알림·계정), Priority Access 배너, 가로 스크롤 카테고리, 3열 카드 그리드(반응형).

## AppShell

- **`pathname === "/market"`** 일 때 **기본 상단 헤더**(제목·토큰 칩 등) **숨김** — 중복 UI 방지.
- **`clone-me-open-rail`** 커스텀 이벤트: 마켓 상단 햄버거가 모바일 레일을 연다.

## CSS (`globalCss.js`)

- `--market-page-bg`, `--market-banner-surface`, `--market-card-footer`
- `--market-gauge-cyan|amber|red` → `TokenRingGauge`와 동기
- `.market-sk` + `@keyframes market-sk` — 스켈레톤 펄스

## 데이터·쿼리

- `fetchMarketClones` / `groupClonesByMaster` 변경 없음. 카드 뱃지는 마스터별 **최소 `token_price`**·평균 **rating**(목 데이터 4.8 기반).
- 카테고리 **투자** 추가 + `CAT_KEYWORDS` 키워드 매칭.

## 토큰 링 (우측 상단)

- 로그인: `fetchTokenSummary` + 플랜 월 토큰으로 **퍼센트**·**cyan / amber / red** 톤.
- 비로그인: 잔액 0%·red, 라벨 `— Tokens`.

## 접근성

- 검색 `aria-label`, 카드는 `<button type="button">`, 스크린리더용 목록 제목 유지.

## 검증

- [ ] 모바일: 햄버거 → 레일 오픈
- [ ] 데스크톱: 검색 중앙, 그리드 3열
- [ ] 태블릿(768~1023): 2열
- [ ] 비로그인 / 로그인 토큰·아바타
