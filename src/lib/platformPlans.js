/**
 * 플랫폼 구독 플랜 (멤버) — BRAIN·PRD 동기. 결제·월 지급은 Phase 3 `platform_subscriptions`.
 */

export const ANNUAL_DISCOUNT = 0.2;

/** @typedef {'free'|'basic'|'pro'|'ultimate'} PlatformPlanId */

/** @type {PlatformPlanId[]} */
export const PLATFORM_PLAN_ORDER = ["free", "basic", "pro", "ultimate"];

export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    shortLabel: "Free",
    monthlyPriceWon: 0,
    monthlyTokens: 0,
    perks: ["5토큰", "무료 체험 5회", "마켓 탐색"],
    highlight: false,
  },
  basic: {
    id: "basic",
    name: "Basic",
    shortLabel: "Basic",
    monthlyPriceWon: 9900,
    monthlyTokens: 50,
    perks: ["매월 50토큰", "대화 기록 저장"],
    highlight: false,
  },
  pro: {
    id: "pro",
    name: "Pro",
    shortLabel: "Pro",
    monthlyPriceWon: 29000,
    monthlyTokens: 150,
    perks: ["매월 150토큰", "대화 기록 저장", "클론 즐겨찾기", "신규 마스터 알림"],
    highlight: true,
  },
  ultimate: {
    id: "ultimate",
    name: "Ultimate",
    shortLabel: "Ultimate",
    monthlyPriceWon: 59000,
    monthlyTokens: 400,
    perks: ["매월 400토큰", "위 전부 포함", "대화 PDF보내기", "베타 기능 우선 접근"],
    highlight: false,
  },
};

/**
 * @param {number} monthlyWon
 * @returns {number}
 */
export function annualTotalWon(monthlyWon) {
  if (!monthlyWon) return 0;
  return Math.round(monthlyWon * 12 * (1 - ANNUAL_DISCOUNT));
}

/**
 * @param {number} monthlyWon
 * @returns {number}
 */
export function annualEffectiveMonthlyWon(monthlyWon) {
  if (!monthlyWon) return 0;
  return Math.round(annualTotalWon(monthlyWon) / 12);
}

/**
 * @param {string} id
 */
export function getPlanById(id) {
  return PLANS[id] || null;
}

/**
 * @param {PlatformPlanId} planId
 */
export function isPaidPlan(planId) {
  return planId !== "free" && !!PLANS[planId];
}
