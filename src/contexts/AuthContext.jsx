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

const AuthContext = createContext(null);

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
    const { data, error } = await supabase
      .from("users")
      .select("onboarding_completed")
      .eq("id", sessionUser.id)
      .maybeSingle();

    setProfileLoading(false);
    if (error) {
      console.warn("[auth] users profile:", error.message);
      setOnboardingCompleted(true);
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUserState(u);
      if (u) loadProfileFlags(u);
      else {
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
    const { data, error } = await supabase
      .from("users")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();
    if (!error && data) setOnboardingCompleted(!!data.onboarding_completed);
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
