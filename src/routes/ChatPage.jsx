import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";

import Chat from "../member/Chat";
import { useAppState } from "../contexts/AppStateContext";
import { CLONES_MARKET } from "../lib/mockData";
import { getSupabaseBrowserClient } from "../lib/supabase";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(id) {
  return typeof id === "string" && UUID_RE.test(id);
}

export default function ChatPage() {
  const { cloneId } = useParams();
  const { subscribed, freeUsed, setFreeUsed, surveyDone, setSurveyDone } = useAppState();
  const [clone, setClone] = useState(null);
  const [loading, setLoading] = useState(isUuid(cloneId));

  useEffect(() => {
    if (!cloneId) {
      setClone(null);
      setLoading(false);
      return;
    }
    if (!isUuid(cloneId)) {
      setClone(CLONES_MARKET.find((c) => c.id === cloneId) || null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const sb = getSupabaseBrowserClient();
      if (!sb) {
        if (!cancelled) {
          setClone(null);
          setLoading(false);
        }
        return;
      }
      const { data, error } = await sb
        .from("clones")
        .select(
          `id, name, subtitle, color, av, welcome_msg, ctx_prompt, mkt_freq, quality_citation, token_price,
           masters ( name, is_verified, is_affiliate, bio, signature, tags )`
        )
        .eq("id", cloneId)
        .eq("is_active", true)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setClone(null);
        setLoading(false);
        return;
      }
      const m = data.masters || {};
      const tags = Array.isArray(m.tags) ? m.tags : [];
      setClone({
        id: data.id,
        name: data.name,
        title: data.subtitle || "",
        subtitle: data.subtitle,
        color: data.color || "#63d9ff",
        av: data.av || m.name?.[0] || "?",
        welcomeMsg:
          data.welcome_msg ||
          `안녕하세요! ${data.name}의 AI 클론입니다. 궁금한 점을 물어보세요.`,
        ctx: data.ctx_prompt,
        mkt_freq: data.mkt_freq || "medium",
        quality: { citation: data.quality_citation !== false },
        isVerified: !!m.is_verified,
        isAffiliate: !!m.is_affiliate,
        tags,
        bio: m.bio || "",
        signature: m.signature || "",
        surveyQuestions: [],
        products: [],
        links: {},
        price: data.token_price ?? 1,
        token_price: data.token_price ?? 1,
        priceLabel: `토큰 ${data.token_price ?? 1}/메시지`,
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [cloneId]);

  if (loading) {
    return (
      <div style={{ minHeight: 400, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--tx3)", fontFamily: "var(--fn)" }}>
        불러오는 중…
      </div>
    );
  }
  if (!clone) return <Navigate to="/market" replace />;

  return (
    <div style={{ position: "relative" }}>
      <Chat
        clone={clone}
        subscribed={subscribed}
        freeUsed={freeUsed}
        setFreeUsed={setFreeUsed}
        surveyDone={surveyDone}
        setSurveyDone={setSurveyDone}
        isDbClone={isUuid(cloneId)}
      />
    </div>
  );
}
