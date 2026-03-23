const KEY = "clone_me_platform_plan_v1";

/**
 * @returns {{ planId: string, billing: 'monthly'|'annual' } | null}
 */
export function readStoredPlatformPlan(userId) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(`${KEY}:${userId}`);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o || typeof o.planId !== "string") return null;
    return {
      planId: o.planId,
      billing: o.billing === "annual" ? "annual" : "monthly",
    };
  } catch {
    return null;
  }
}

/**
 * @param {string} userId
 * @param {{ planId: string, billing?: 'monthly'|'annual' }} data
 */
export function writeStoredPlatformPlan(userId, data) {
  if (!userId || !data?.planId) return;
  try {
    localStorage.setItem(
      `${KEY}:${userId}`,
      JSON.stringify({
        planId: data.planId,
        billing: data.billing === "annual" ? "annual" : "monthly",
      })
    );
  } catch {
    /* quota */
  }
}
