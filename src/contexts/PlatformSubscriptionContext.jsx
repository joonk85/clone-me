import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useAuth } from "./AuthContext";
import { getPlanById, isPaidPlan, PLANS } from "../lib/platformPlans";
import { readStoredPlatformPlan, writeStoredPlatformPlan } from "../lib/platformSubscriptionStorage";

const PlatformSubscriptionContext = createContext({
  planId: "free",
  plan: null,
  billing: "monthly",
  setPlanMock: () => {},
  isPaid: false,
  refreshPlan: () => {},
});

export function PlatformSubscriptionProvider({ children }) {
  const { user } = useAuth();
  const [planId, setPlanId] = useState("free");
  const [billing, setBilling] = useState("monthly");

  const load = useCallback(() => {
    if (!user?.id) {
      setPlanId("free");
      setBilling("monthly");
      return;
    }
    const s = readStoredPlatformPlan(user.id);
    if (s?.planId && getPlanById(s.planId)) {
      setPlanId(s.planId);
      setBilling(s.billing || "monthly");
    } else {
      setPlanId("free");
      setBilling("monthly");
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const setPlanMock = useCallback(
    (id, bill = "monthly") => {
      const next = getPlanById(id) ? id : "free";
      const b = bill === "annual" ? "annual" : "monthly";
      setPlanId(next);
      setBilling(b);
      if (user?.id) {
        writeStoredPlatformPlan(user.id, { planId: next, billing: b });
      }
    },
    [user?.id]
  );

  const plan = getPlanById(planId) ?? PLANS.free;
  const isPaid = isPaidPlan(planId);

  const value = useMemo(
    () => ({
      planId,
      plan,
      billing,
      setPlanMock,
      isPaid,
      refreshPlan: load,
    }),
    [planId, plan, billing, setPlanMock, isPaid, load]
  );

  return <PlatformSubscriptionContext.Provider value={value}>{children}</PlatformSubscriptionContext.Provider>;
}

export function usePlatformSubscription() {
  return useContext(PlatformSubscriptionContext);
}
