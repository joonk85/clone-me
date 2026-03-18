# clone.me STYLE_GUIDE

> Dark & Minimal · 네온 포인트 · **768px** 모바일 브레이크포인트  
> 구현: `src/styles/globalCss.js` (`GLOBAL_CSS`) — **하드코딩 색/폰트 금지, 변수만 사용**

## 브레이크포인트

| 이름 | 값 | 용도 |
|------|-----|------|
| mobile | `max-width: 767px` | Nav 드로어, auth 패딩, 입력 16px |

JS에서는 `useWindowSize().isMobile` (`width < 768`).

## CSS Variables (전체)

### 배경·서페이스
| 변수 | 설명 |
|------|------|
| `--bg` | 앱 배경 |
| `--sf` | 카드/패널 표면 |
| `--sf2` | 입력·보조 패널 |
| `--sf3` | 구분·비활성 표면 |

### 테두리
| 변수 | 설명 |
|------|------|
| `--br` | 기본 보더 |
| `--br2` | 강조 보더(시안 틴트) |

### 브랜드·시맨틱 색
| 변수 | 용도 |
|------|------|
| `--cy` / `--cyd` / `--cyg` | 프라이머리(시안) |
| `--gn` | 성공·양호 |
| `--am` | 경고·강조 |
| `--rd` | 에러·위험 |
| `--pu` | 보조 강조 |
| `--go` | 별점·포인트 골드 |

### 텍스트
| 변수 | 설명 |
|------|------|
| `--tx` | 본문 |
| `--tx2` | 보조 |
| `--tx3` | 캡션·플레이스홀더 |

### 타이포
| 변수 | 설명 |
|------|------|
| `--fn` | 본문 폰트 (Syne) |
| `--mo` | 모노/라벨 (Space Mono) |
| `--fs-xs` ~ `--fs-h1` | 스케일 |
| `--fs-input-mobile` | **16px** — iOS 입력 줌 방지 |

### 레이아웃·간격
| 변수 | 설명 |
|------|------|
| `--page-pad-x` / `--page-pad-y` | 페이지 좌우·상하 (모바일에서 축소) |
| `--nav-h` / `--nav-h-mobile` | 상단 네비 높이 |
| `--touch-min` | 최소 터치 44px |
| `--safe-top` 등 | `safe-area-inset` |

### 모서리·오버레이
| 변수 | 설명 |
|------|------|
| `--r-sm` ~ `--r-xl` | radius 스케일 |
| `--nav-scrim` | 네비 배경 |
| `--overlay-dim` | 딤 오버레이 |
| `--z-nav` / `--z-nav-drawer` / `--z-nav-backdrop` | z-index |

### 태그·에러 서페이스 (기존)
`--tg-*-bg`, `--err-surface`, `--err-border`, `--am-surface` …

## 접근성

- 터치 타겟 **최소 44px** (모바일 Nav·버튼)
- 폼 인풋 모바일 **font-size ≥ 16px**

## 애니메이션

`fu`, `sp`, `wv`, `d3`, `pulse` — `globalCss.js` 내 `@keyframes` 참고.

## 홈 히어로

- 클래스 **`.home-hero-gradient-title`** — `linear-gradient`에 `var(--cy)`·`var(--pu)`·`var(--gn)`만 사용 (`background-clip: text`).
