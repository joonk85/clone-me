# 플랫폼 구독 (멤버) — Side Effect 체크

> **플랫폼 플랜** Free / Basic / Pro / Ultimate. MVP: Mock 저장(`localStorage`) + UI만. 실결제·`platform_subscriptions`는 Phase 3.

---

## 1. 라우트

| 경로 | 컴포넌트 | 비고 |
|------|-----------|------|
| `/pricing` | `PlatformPricing` | **공개** · 플랜 카드·연간/월간·Mock 구독 |
| `/my/subscription` | → **`/settings`** 리다이렉트 | 구독 UI는 **설정**의「구독」섹션 |
| `/settings` | `Settings` | 계정·알림 + **구독**(현재 플랜·업그레이드·Mock 취소) |
| `/my/settings` | → **`/settings`** | 북마크 호환 |
| `/my/master/pricing` | `MasterPricing` | 마스터 **클론 턴당 토큰** 단가 (플랫폼 플랜과 별개) |

---

## 2. 영향 파일

| 파일 | 내용 |
|------|------|
| `src/lib/platformPlans.js` | 플랜 정의·가격·혜택·연간 할인 20% 헬퍼 |
| `src/lib/platformSubscriptionStorage.js` | `localStorage` 키 `clone_me_platform_plan_v1:{userId}` |
| `src/lib/tokenPricing.js` | `TOKEN_KRW_REF`(100)·`buildClonePriceLabel`·원화/턴 안내 |
| `src/contexts/PlatformSubscriptionContext.jsx` | `planId`·`setPlanMock`·`isPaid` |
| `src/App.jsx` | `PlatformSubscriptionProvider`(Auth 하위)·`/pricing` 라우트 |
| `src/common/AppShell.jsx` | 헤더·레일: 토큰 옆 플랜 뱃지·Free 시 **업그레이드** → `/pricing` |
| `src/mypage/MyLayout.jsx` | 마이 헤더: 토큰 옆 플랜 뱃지·업그레이드 |
| `src/member/Chat.jsx` · `src/routes/ChatPage.jsx` | 클론별 `N토큰/턴 · 약 ₩…/턴` 표시 |
| `src/mypage/master/MasterPricing.jsx` | 턴당 토큰 입력 시 원화 참고 문구 |

---

## 3. 레거시 정리

- 제품 기준 멤버 과금은 **플랫폼 구독 + 토큰**. DB의 `clone_subscriptions` 등은 Phase 3에서 `platform_subscriptions`와 함께 정리.

---

## 4. 스타일

- 인라인 스타일 **CSS 변수만** (`STYLE_GUIDE`). 플랜 카드에 Heroicons `CheckIcon`.
