# Subscription & Usage (`/my/subscription`) — Side effects

> 2026-03: 마이 **Subscription & Usage** 페이지를 **Current / Upgrade** 탭·이중 카드·이용 테이블·업그레이드 그리드로 재구성. **CSS 변수·Heroicons·Mock** 중심, 실결제 Phase 3.

## UI

### 상단 탭
- **Current** | **Upgrade** — `var(--mo)` 라벨, 활성 탭 `var(--cyd)` / `var(--cy)` 보더.

### Current
- 타이틀 **Subscription & Usage**, 서브: 플랜·토큰 사용량 안내.
- **좌: ACCOUNT STATUS** — 플랜명, **다음 결제일 (Mock)** (`isPaid`면 다음 달 1일 문자열), `platformPlans` **perks** 체크리스트, **Manage Billing** → 알림(Mock).
- **우: TOKEN CONSUMPTION** — `TokenRingGauge`(소비율 %), **used / allocated** 문구, 진행 바, **USED / ALLOCATED / EST. RESET** 그리드.  
  - `allocated`: 유료는 `plan.monthlyTokens`, Free는 표시용 **5**.  
  - `used`: `allocated - min(balance, allocated)` (추정·Mock).  
  - **잔여 잔액**은 `fetchTokenSummary` 실제 값.
- **Usage History** 테이블: `token_transactions` 중 `type === 'usage'` + 로컬 Mock + 빈 목록 시 **데모 3행**. 열: 날짜·마스터명(description 파싱)·대화 유형·토큰. **VIEW MORE** 접기/펼치기, **Export CSV (Mock)** 클라이언트 다운로드.

### Upgrade
- 타이틀 **요금제 업그레이드**, 4플랜 카드 (`PLATFORM_PLAN_ORDER`).  
- 카피는 `UPGRADE_CARD_COPY` + 가격 라벨; **Pro**에 **RECOMMENDED** + `SparklesIcon`.  
- 현재 플랜: 비활성 **현재 플랜** 버튼; 그 외 **업그레이드** → `setPlanMock` + 알림 후 Current 탭.

## 제거·변경
- 이 페이지에서 **TokenShop**·기존 단일 카드+하단 TokenHistory 블록 **제거** (이용 내역은 위 테이블로 통합). 토큰 충전 Mock은 **`/pricing`** 링크(TOKEN CONSUMPTION 카드 하단)로 안내.

## 데이터·플랜 카피
- `src/lib/platformPlans.js` — Free/Basic/Pro/Ultimate **perks** 문구를 스펙과 맞게 짧게 정리(다른 화면과 공유).

## 관련 파일
- `src/mypage/MyAccountSubscription.jsx`
- `src/lib/platformPlans.js`
- `src/common/TokenRingGauge.jsx`

## 검증
- [ ] Current: 두 카드 반응형(모바일 1열)
- [ ] Upgrade: 4카드, Pro 하이라이트, Mock 업그레이드 후 플랜 반영
- [ ] CSV 다운로드 파일 생성
- [ ] Supabase 미연결 시(페이지 자체는 설정 가드 유지)
