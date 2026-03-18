# clone.me — Style Guide & Design System
# (PRD v4.2 기준)
> Cursor AI에게: 이 스타일 가이드를 모든 컴포넌트 작업 시 반드시 참고하세요.
> 데모 버전(v28)과 동일한 디자인 언어를 유지해야 합니다.

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━
## 1. 디자인 원칙
## ━━━━━━━━━━━━━━━━━━━━━━━━━

**Dark & Minimal** — 짙은 다크 배경, 낮은 채도의 서피스, 네온 포인트 컬러
**Tech but Warm** — 모노스페이스 폰트로 기술적 느낌, Syne으로 친근함
**Glow & Depth** — 컬러에 미세한 glow 효과로 생동감
**Consistent Motion** — 모든 전환은 fade-up 0.3s, 상태 변경은 0.15s

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━
## 2. 컬러 시스템
## ━━━━━━━━━━━━━━━━━━━━━━━━━

### CSS Variables (전역 적용)

```css
:root {
  /* ── 배경 레이어 ── */
  --bg:  #050508;   /* 최하단 배경 */
  --sf:  #0d0d14;   /* 카드 배경 */
  --sf2: #13131e;   /* 인풋, 보조 서피스 */
  --sf3: #1a1a28;   /* 가장 밝은 서피스, 프로그레스 배경 */

  /* ── 테두리 ── */
  --br:  rgba(255,255,255,0.07);    /* 기본 테두리 */
  --br2: rgba(99,217,255,0.25);     /* 강조 테두리 (cyan 계열) */

  /* ── 포인트 컬러 ── */
  --cy:  #63d9ff;                   /* Primary — Cyan (주요 액션, 링크) */
  --cyd: rgba(99,217,255,0.12);     /* Cyan 배경 (선택됨, 뱃지 배경) */
  --cyg: rgba(99,217,255,0.05);     /* Cyan 매우 연하게 (hover 배경) */
  --gn:  #4fffb0;                   /* Success — Green (완료, 운영중) */
  --am:  #ffb347;                   /* Warning — Amber (주의, 할인, 마지막 기회) */
  --rd:  #ff4f6d;                   /* Danger — Red (삭제, 오류, 탈퇴) */
  --pu:  #b794ff;                   /* Purple (Notion, 특수 뱃지) */
  --go:  #ffc832;                   /* Gold (별점, 검증 배지) */

  /* ── 텍스트 ── */
  --tx:  #e8e8f0;                   /* 기본 텍스트 */
  --tx2: rgba(232,232,240,0.55);    /* 보조 텍스트 */
  --tx3: rgba(232,232,240,0.22);    /* 힌트, 비활성 텍스트 */

  /* ── 폰트 ── */
  --fn: 'Syne', sans-serif;         /* 기본 폰트 */
  --mo: 'Space Mono', monospace;    /* 숫자, 코드, 뱃지, 라벨 */
}
```

### 컬러 사용 규칙

| 컬러 | 사용처 |
|---|---|
| `--cy` | Primary 버튼, 링크, 선택 상태, 포커스 |
| `--gn` | 성공, 운영중, 완료, 인증됨, 토글 ON |
| `--am` | 경고, 할인, 마지막 체험, 보너스 토큰 |
| `--rd` | 삭제, 에러, 위험 구역, 탈퇴 |
| `--go` | 별점, ✓ 검증 배지, Featured |
| `--pu` | Notion 연동, 특수 기능 |
| `--tx2` | 부제목, 설명, placeholder |
| `--tx3` | 힌트, 비활성, 날짜 |

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━
## 3. 타이포그래피
## ━━━━━━━━━━━━━━━━━━━━━━━━━

### 폰트 임포트
```css
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Space+Mono:wght@400;500&display=swap');
```

### 타이포그래피 스케일

| 용도 | 폰트 | 사이즈 | 웨이트 |
|---|---|---|---|
| 페이지 제목 (H1) | Syne | clamp(32px,6.5vw,62px) | 800 |
| 섹션 제목 (H2) | Syne | 22px | 800 |
| 카드 제목 | Syne | 19px | 800 |
| 서브 제목 | Syne | 15~16px | 700~800 |
| 본문 (기본) | Syne | 13px | 400 |
| 본문 (강조) | Syne | 13px | 600~700 |
| 설명 텍스트 | Syne | 12px | 400 |
| 힌트 / 라벨 | Syne | 11px | 400 |
| 뱃지 / 코드 | Space Mono | 10~11px | 400 |
| 숫자 (통계) | Space Mono | 14~20px | 700~800 |
| 마이크로 텍스트 | Space Mono | 9~10px | 400 |

### 라인 하이트

```
제목:     1.06
부제목:   1.4
본문:     1.7~1.9
설명:     1.6
```

### 텍스트 규칙
- 제목 letter-spacing: `-0.03em ~ -0.04em`
- 뱃지/라벨 letter-spacing: `0.06em ~ 0.08em`
- 그라디언트 텍스트: `linear-gradient(135deg, #fff 0%, var(--cy) 50%, var(--gn) 100%)`

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━
## 4. 공통 컴포넌트
## ━━━━━━━━━━━━━━━━━━━━━━━━━

### Av — 아바타

```jsx
function Av({ char, color, size = 44 }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: `${color}22`,
      border: `1.5px solid ${color}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700,
      color, fontFamily: 'var(--fn)', flexShrink: 0,
      boxShadow: `0 0 12px ${color}18`
    }}>
      {char}
    </div>
  )
}
```

**사이즈 가이드:**
- `size=22` — 채팅 메시지 옆 미니
- `size=28` — 샘플 대화 말풍선
- `size=30` — 채팅 헤더
- `size=36` — Featured 카드
- `size=44` — 기본 (내 클론 카드)
- `size=50` — 클론 목록
- `size=60` — 마스터 프로필 헤더

---

### Bt — 버튼

```jsx
// 버튼 변형 (v)
// pr: Primary (cyan 배경, 검은 텍스트) — 주요 CTA
// gh: Ghost (투명 배경, 테두리) — 보조 액션
// sf: Surface (sf2 배경) — 중립 액션
// dn: Danger (red 배경) — 삭제, 위험

// 사이즈 (sz)
// sm: 5px 11px / 11px 폰트
// md: 8px 18px / 13px 폰트 (기본)
// lg: 12px 24px / 15px 폰트

// 공통 속성
borderRadius: 9px
fontWeight: 700
fontFamily: 'var(--fn)'
transition: 'opacity 0.15s'
opacity: disabled ? 0.4 : 1
```

**버튼 사용 규칙:**
- 한 화면에 Primary 버튼은 1~2개 최대
- 위험한 액션은 반드시 `dn` 변형
- 비활성 상태는 opacity 0.4 (disabled 속성)

---

### Cd — 카드

```jsx
function Cd({ children, style }) {
  return (
    <div style={{
      background: 'var(--sf)',
      border: '1px solid var(--br)',
      borderRadius: 13,
      ...style
    }}>
      {children}
    </div>
  )
}
```

**카드 패딩 규칙:**
- 기본 카드: `padding: '14px 16px'`
- 넓은 카드: `padding: '16px 18px'`
- 컴팩트 카드: `padding: '11px 13px'`
- 강조 카드: `borderColor: 'var(--br2)'`

**카드 hover 패턴:**
```jsx
onMouseEnter={e => {
  e.currentTarget.style.borderColor = `${color}66`
  e.currentTarget.style.boxShadow = `0 4px 20px ${color}12`
}}
onMouseLeave={e => {
  e.currentTarget.style.borderColor = 'var(--br)'
  e.currentTarget.style.boxShadow = 'none'
}}
```

---

### Tg — 태그/뱃지

```jsx
// 컬러 변형 (c)
// cy: cyan (기본, 정보)
// gn: green (완료, 성공)
// am: amber (경고, 할인)
// rd: red (오류)
// go: gold (검증, 별점)
// pu: purple (특수)

// 스타일
padding: '2px 9px'
borderRadius: 4px
fontSize: 11px
fontFamily: 'var(--mo)'
```

---

### Sw — 토글 스위치

```jsx
// ON: --gn 배경, 검은 원
// OFF: --sf3 배경, --tx3 원
width: 30px, height: 17px
borderRadius: 9px
원 전환: transition 'left 0.2s'
```

---

### Pb — 프로그레스 바

```jsx
// height: 3px
// 85% 초과 시 amber 경고색
// 기본 컬러: --cy
// transition: width 0.4s
```

---

### 인풋 필드 공통 스타일

```jsx
const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid var(--br)',
  borderRadius: 9,
  background: 'var(--sf2)',
  color: 'var(--tx)',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'var(--fn)',
}

// 포커스 시
border: '1px solid var(--br2)'

// 에러 시
border: '1px solid var(--rd)'
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━
## 5. 애니메이션
## ━━━━━━━━━━━━━━━━━━━━━━━━━

```css
/* 페이드 업 — 컴포넌트 등장 시 */
@keyframes fu {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* 스피너 — 로딩 */
@keyframes sp {
  to { transform: rotate(360deg); }
}

/* 파동 — 오디오 시각화 */
@keyframes wv {
  0%, 100% { transform: scaleY(0.3); }
  50%       { transform: scaleY(1); }
}

/* 점 깜빡임 — 타이핑 인디케이터 */
@keyframes d3 {
  0%, 60%, 100% { opacity: 1; }
  30%           { opacity: 0; }
}

/* 펄스 — 운영중 상태 표시 */
@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50%       { opacity: 1; }
}
```

### 애니메이션 사용 규칙

| 상황 | 애니메이션 |
|---|---|
| 페이지/컴포넌트 등장 | `animation: fu 0.3s ease` |
| 홈 히어로 | `animation: fu 0.5s ease` |
| 리스트 아이템 순차 | `animation: fu ${0.2 + i * 0.07}s ease` |
| 로딩 스피너 | `animation: sp 0.8s linear infinite` |
| 타이핑 점 | `animation: d3 1.2s ${n*0.2}s infinite` |
| 운영중 표시 | `animation: pulse 2s infinite` |
| 상태 전환 | `transition: all 0.15s` |
| 테두리 컬러 | `transition: border-color 0.2s` |
| 너비 변화 | `transition: width 0.4s` |

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━
## 6. 레이아웃 패턴
## ━━━━━━━━━━━━━━━━━━━━━━━━━

### 페이지 최대 너비

```jsx
// 일반 콘텐츠 페이지
maxWidth: 720, margin: '0 auto'

// 마스터 프로필, 채팅
maxWidth: 680, margin: '0 auto'

// 클론 대시보드
maxWidth: 820, margin: '0 auto'

// 홈, 온보딩
maxWidth: 600, margin: '0 auto'
```

### 페이지 기본 패딩

```jsx
// 데스크탑
padding: '20px 20px 48px'

// 모바일
padding: '16px 16px 80px'  // 하단 탭바 높이 고려
```

### 네비게이션 (상단 고정)

```jsx
position: 'sticky', top: 0, zIndex: 100
background: 'rgba(5,5,8,0.94)'
backdropFilter: 'blur(16px)'
borderBottom: '1px solid var(--br)'
height: 52px
```

### 카드 간격

```jsx
gap: 9    // 컴팩트 리스트
gap: 10   // 기본 리스트
gap: 12   // 여유있는 리스트
```

### 그리드

```jsx
// 스탯 카드 (3열)
gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))'

// Featured 카드 (2열)
gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'

// 인구통계 (2열)
gridTemplateColumns: '1fr 1fr'
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━
## 7. 말풍선 (채팅 UI)
## ━━━━━━━━━━━━━━━━━━━━━━━━━

```jsx
// 유저 메시지 (오른쪽)
{
  flexDirection: 'row-reverse',
  background: 'var(--cyd)',
  border: '1px solid var(--br2)',
  borderRadius: 12,
  borderTopRightRadius: 3,   // 꼬리 방향
}

// 클론 메시지 (왼쪽)
{
  flexDirection: 'row',
  background: 'var(--sf)',
  border: '1px solid var(--br)',
  borderRadius: 12,
  borderTopLeftRadius: 3,    // 꼬리 방향
}

// 공통
fontSize: 13, lineHeight: 1.7
maxWidth: '74%'
padding: '9px 13px'
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━
## 8. 섹션 헤더 패턴
## ━━━━━━━━━━━━━━━━━━━━━━━━━

```jsx
// 섹션 레이블 (대시보드 탭 내)
{
  fontSize: 11,
  color: 'var(--cy)',
  fontFamily: 'var(--mo)',
  letterSpacing: '0.06em',
  marginBottom: 10,
}

// 예시
<div style={{fontSize:11,color:"var(--cy)",fontFamily:"var(--mo)",letterSpacing:"0.06em",marginBottom:10}}>
  📦 자료 관리
</div>
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━
## 9. 스크롤바

```css
::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-thumb {
  background: var(--br2);
  border-radius: 2px;
}
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━
## 10. 반응형 (Mobile) 설계
## ━━━━━━━━━━━━━━━━━━━━━━━━━

### 브레이크포인트

```css
/* Mobile: ~767px */
/* Tablet: 768px~1023px */
/* Desktop: 1024px~ */
```

React에서는 CSS-in-JS 방식으로 처리:

```jsx
// useWindowSize hook 사용
const { width } = useWindowSize()
const isMobile = width < 768
const isTablet = width >= 768 && width < 1024
```

---

### 모바일 네비게이션 — 하단 탭바

데스크탑: 상단 GNB
모바일: 하단 Fixed 탭바

```jsx
// 하단 탭바 (모바일)
{
  position: 'fixed',
  bottom: 0, left: 0, right: 0,
  height: 64,
  background: 'rgba(5,5,8,0.96)',
  backdropFilter: 'blur(16px)',
  borderTop: '1px solid var(--br)',
  display: 'flex',
  zIndex: 200,
  paddingBottom: 'env(safe-area-inset-bottom)', // iOS 노치 대응
}

// 탭 아이템
{
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 3,
  fontSize: 9,           // 아이콘 라벨
  color: active ? 'var(--cy)' : 'var(--tx3)',
}
```

**탭 아이콘 (SVG 24px):**

| 탭 | 아이콘 | 라벨 |
|---|---|---|
| 홈 | 🏠 | 홈 |
| 마켓 | 🛍 | 마켓 |
| 대화 | 💬 | 대화 |
| 대시보드 | ⚡ | 대시 (마스터만) |
| 마이 | 👤 | 마이 |

---

### 모바일 레이아웃 변환 규칙

**카드 그리드**
```jsx
// 데스크탑: 2~3열
gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'

// 모바일: 1열
gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))'
```

**사이드바 레이아웃 (멤버 대시보드)**
```jsx
// 데스크탑: 좌측 사이드바 300px + 우측 메인
display: 'flex'

// 모바일: 탭으로 전환
display: 'block'
// 상단 탭 [대화기록 | 구독] → 탭 클릭 시 콘텐츠 전환
```

**채팅 인터페이스**
```jsx
// 데스크탑: 고정 높이 660px
height: isMobile ? '100dvh' : 660
// 모바일: 전체 화면 (dvh — dynamic viewport height)
// iOS 키보드 올라올 때 자동 대응
```

**클론 대시보드 탭**
```jsx
// 데스크탑: 가로 탭
display: 'flex'

// 모바일: 가로 스크롤 탭 (overflow-x: auto)
overflowX: 'auto'
whiteSpace: 'nowrap'
// 스크롤바 숨김
scrollbarWidth: 'none'
```

**폰트 사이즈**
```jsx
// clamp() 사용으로 자동 대응
fontSize: 'clamp(32px, 6.5vw, 62px)'  // H1
fontSize: 'clamp(13px, 2.2vw, 16px)'  // 본문
```

**버튼**
```jsx
// 모바일에서 주요 CTA 버튼 풀 너비
width: isMobile ? '100%' : 'auto'
justifyContent: 'center'
```

---

### 모바일 터치 최적화

```jsx
// 최소 터치 타겟: 44px × 44px
minHeight: 44        // 버튼, 리스트 아이템
minWidth: 44

// 탭 영역 padding 확장
padding: '12px 16px'  // 모바일에서 더 넓게

// 호버 효과 → 터치 피드백으로 대체
// 모바일에서는 onMouseEnter/Leave 대신
// active 상태로 처리
```

---

### 모바일 특이사항

**iOS 안전 영역 (Safe Area)**
```jsx
// 상단 (노치)
paddingTop: 'env(safe-area-inset-top)'

// 하단 (홈 인디케이터)
paddingBottom: 'calc(64px + env(safe-area-inset-bottom))'
```

**가상 키보드 대응 (채팅)**
```jsx
// dvh 사용 — 키보드 올라올 때 뷰포트 자동 조정
height: '100dvh'

// 입력창은 항상 하단 고정
position: 'sticky', bottom: 0
```

**Pull to Refresh 방지**
```css
body { overscroll-behavior: none; }
```

---

### 반응형 컴포넌트 예시

**마켓플레이스 카드 (반응형)**
```jsx
// 모바일: 리스트형 (이미지 없이)
// 데스크탑: 카드 그리드

const cardStyle = isMobile ? {
  padding: '14px 16px',
  borderRadius: 12,
} : {
  padding: '16px 18px',
  borderRadius: 13,
}
```

**마이페이지 헤더 (반응형)**
```jsx
// 모바일: 세로 정렬
// 데스크탑: 가로 정렬

flexDirection: isMobile ? 'column' : 'row'
alignItems: isMobile ? 'center' : 'flex-start'
textAlign: isMobile ? 'center' : 'left'
```

---

### useWindowSize Hook

```jsx
// src/hooks/useWindowSize.js
import { useState, useEffect } from 'react'

export function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  useEffect(() => {
    const handler = () => setSize({
      width: window.innerWidth,
      height: window.innerHeight,
    })
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return {
    ...size,
    isMobile: size.width < 768,
    isTablet: size.width >= 768 && size.width < 1024,
    isDesktop: size.width >= 1024,
  }
}
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━
## 11. 글로벌 CSS

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  background: var(--bg);
  color: var(--tx);
  font-family: var(--fn);
  overflow-x: hidden;
  overscroll-behavior: none;
  -webkit-tap-highlight-color: transparent;  /* 모바일 터치 하이라이트 제거 */
}

/* 스크롤바 */
::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-thumb {
  background: var(--br2);
  border-radius: 2px;
}

/* 모바일 스크롤바 숨김 */
.hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.hide-scrollbar::-webkit-scrollbar { display: none; }
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━
## 12. 디자인 금지 사항

- ❌ 흰색 배경 절대 사용 금지
- ❌ 기본 파란색 (#0000ff, #007bff) 사용 금지
- ❌ border-radius 5px 이하 (버튼/카드에 너무 각짐)
- ❌ box-shadow로 흰색/검정 그림자 (컬러 glow만 허용)
- ❌ 굵기 400 이하 제목
- ❌ 모바일에서 hover만 있는 인터랙션 (터치 대응 필수)
- ❌ 모바일에서 16px 이하 인풋 폰트 (iOS 자동 줌인 방지)
