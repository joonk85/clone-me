import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import MasterProfile from "../profile/MasterProfile";
import { useAppState } from "../contexts/AppStateContext";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { fetchCloneForProfile } from "../lib/supabaseQueries";
import { CLONES_MARKET } from "../lib/mockData";

// /master/:id — DB 클론 UUID 우선, 없으면 예전 데모 id(kim 등)는 mock 폴백

export default function MasterProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { subscribed, setSubscribed, setActiveClone } = useAppState();
  const [clone, setClone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const mock = CLONES_MARKET.find((c) => c.id === id);
    if (mock) {
      setClone(mock);
      setLoading(false);
      setNotFound(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      const { clone: row, error } = await fetchCloneForProfile(supabase, id);
      if (cancelled) return;
      setLoading(false);
      if (error || !row) {
        setNotFound(true);
        setClone(null);
      } else {
        setNotFound(false);
        setClone(row);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const setView = (to) => {
    if (to === "chat" && clone) navigate(`/chat/${clone.id}`);
    else if (typeof to === "string") navigate(to);
  };

  if (loading) {
    return (
      <div style={{ minHeight: 400, padding: 48, textAlign: "center", color: "var(--tx3)" }}>
        불러오는 중…
      </div>
    );
  }

  if (notFound || !clone) {
    return <Navigate to="/404" replace />;
  }

  return (
    <MasterProfile
      clone={clone}
      onBack={() => navigate("/market")}
      onSubscribe={(cloneId) => setSubscribed((p) => [...p, cloneId])}
      subscribed={subscribed}
      setActiveClone={setActiveClone}
      setView={setView}
    />
  );
}
