import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getSupabaseBrowserClient } from "../lib/supabase";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(id) {
  return typeof id === "string" && UUID_RE.test(id);
}

function isRlsOrJwtError(err) {
  if (!err) return false;
  const m = (err.message || "").toLowerCase();
  const c = err.code || "";
  return (
    c === "42501" ||
    c === "PGRST301" ||
    m.includes("permission denied") ||
    m.includes("row-level security") ||
    m.includes("jwt")
  );
}

const AuthContext = createContext(null);

async function fetchUserOnboardingFlag(supabase, userId) {
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 120 * attempt));
    }
    await supabase.auth.getSession();
    const { data, error } = await supabase
      .from("users")
      .select("onboarding_completed")
      .eq("id", userId)
      .maybeSingle();
    if (!error) return { data, error: null };
    if (!isRlsOrJwtError(error) || attempt === 3) return { data: null, error };
  }
  return { data: null, error: null };
}

/** 트리거 누락 시 최초 로그인용 public.users 행 */
async function ensureUsersRow(supabase, sessionUser) {
  if (!sessionUser?.id || !sessionUser?.email) return;
  const { data, error } = await supabase.from("users").select("id").eq("id", sessionUser.id).maybeSingle();
  if (error && isRlsOrJwtError(error)) return;
  if (data) return;
  await supabase.from("users").insert({
    id: sessionUser.id,
    email: sessionUser.email,
    role: "member",
  });
}

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(true);

  const loadProfileFlags = useCallback(async (sessionUser) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !sessionUser?.id || !isUuid(sessionUser.id)) {
      setProfileLoading(false);
      setOnboardingCompleted(true);
      return;
    }
    setProfileLoading(true);
    await supabase.auth.getSession();
    await ensureUsersRow(supabase, sessionUser);

    const { data, error } = await fetchUserOnboardingFlag(supabase, sessionUser.id);

    setProfileLoading(false);
    if (error) {
      if (error.message?.includes("onboarding_completed") || error.code === "42703") {
        setOnboardingCompleted(true);
        return;
      }
      console.warn("[auth] users profile:", error.message);
      setOnboardingCompleted(false);
      return;
    }
    if (!data) {
      setOnboardingCompleted(false);
      return;
    }
    setOnboardingCompleted(!!data.onboarding_completed);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        const u = session?.user ?? null;
        setUserState(u);
        if (u) loadProfileFlags(u);
        else {
          setProfileLoading(false);
          setOnboardingCompleted(true);
        }
      })
      .finally(() => setLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null;
      setUserState(u);
      if (u) {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
          loadProfileFlags(u);
        }
      } else {
        setProfileLoading(false);
        setOnboardingCompleted(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfileFlags]);

  const setUser = useCallback((u) => setUserState(u), []);

  const refreshUserProfile = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!user?.id || !supabase || !isUuid(user.id)) return;
    await supabase.auth.getSession();
    const { data, error } = await fetchUserOnboardingFlag(supabase, user.id);
    if (!error && data) setOnboardingCompleted(!!data.onboarding_completed);
    else if (!error && !data) setOnboardingCompleted(false);
  }, [user?.id]);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    setUserState(null);
    setOnboardingCompleted(true);
  }, []);

  const supabaseConfigured = !!getSupabaseBrowserClient();

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      profileLoading,
      onboardingCompleted,
      refreshUserProfile,
      signOut,
      isAuthenticated: !!user,
      supabaseConfigured,
    }),
    [
      user,
      loading,
      profileLoading,
      onboardingCompleted,
      refreshUserProfile,
      signOut,
      setUser,
      supabaseConfigured,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
