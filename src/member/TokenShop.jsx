import { useCallback, useEffect, useState } from "react";

import Bt from "../common/Bt";
import Cd from "../common/Cd";
import { useAuth } from "../contexts/AuthContext";
import { getSupabaseBrowserClient } from "../lib/supabase";

const PACKS = [
  { id: "s", name: "스타터", tokens: 100, price: "₩4,900", tag: null },
  { id: "m", name: "스탠다드", tokens: 350, price: "₩14,900", tag: "인기" },
  { id: "l", name: "프로", tokens: 800, price: "₩29,900", tag: null },
];

function formatExp(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

export default function TokenShop() {
  const { user, supabaseConfigured } = useAuth();
  const [purchased, setPurchased] = useState(null);
  const [bonusRows, setBonusRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user?.id) {
      setPurchased(null);
      setBonusRows([]);
      return;
    }
    setLoading(true);
    const [balRes, bonusRes] = await Promise.all([
      supabase.from("token_balances").select("purchased_balance, pass_balance").maybeSingle(),
      supabase
        .from("bonus_tokens")
        .select("id, remaining, expires_at, is_expired, reason")
        .eq("user_id", user.id)
        .gt("remaining", 0)
        .order("expires_at", { ascending: true }),
    ]);
    setLoading(false);
    if (!balRes.error && balRes.data) {
      setPurchased(balRes.data.purchased_balance ?? 0);
    } else {
      setPurchased(0);
    }
    const now = Date.now();
    const rows = (bonusRes.data || []).filter((b) => !b.is_expired && new Date(b.expires_at).getTime() > now);
    setBonusRows(rows);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const bonusTotal = bonusRows.reduce((s, b) => s + (b.remaining || 0), 0);

  return (
    <div style={{ minHeight: 520, padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ fontSize: 10, color: "var(--cy)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 10 }}>TOKENS</div>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>토큰 상점</h1>
      <p style={{ color: "var(--tx2)", lineHeight: 1.7, marginBottom: 20, fontSize: 13 }}>대화·RAG 호출에 쓰이는 토큰을 충전합니다. 결제 연동 전까지 구매 버튼은 비활성입니다.</p>

      {supabaseConfigured && user && (
        <Cd style={{ padding: "16px 18px", marginBottom: 20, borderColor: "var(--br2)" }}>
          <div style={{ fontSize: 11, color: "var(--tx3)", fontFamily: "var(--mo)", marginBottom: 8 }}>내 잔액</div>
          {loading ? (
            <div style={{ color: "var(--tx3)", fontSize: 13 }}>불러오는 중…</div>
          ) : (
            <>
              <div style={{ fontSize: 15, marginBottom: 6 }}>
                <strong style={{ color: "var(--cy)" }}>구매 잔액</strong> {purchased ?? 0} &nbsp;·&nbsp; 패스 잔액은 별도
              </div>
              <div style={{ fontSize: 15, marginBottom: bonusRows.length ? 10 : 0 }}>
                <strong style={{ color: "var(--go)" }}>보너스(유효분)</strong> {bonusTotal}토큰
              </div>
              {bonusRows.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "var(--tx2)", lineHeight: 1.7 }}>
                  {bonusRows.map((b) => (
                    <li key={b.id}>
                      {b.remaining}토큰 — 만료 {formatExp(b.expires_at)}
                      {b.reason === "signup" ? " (가입)" : ""}
                    </li>
                  ))}
                </ul>
              )}
              {bonusTotal === 0 && purchased === 0 && !loading && (
                <div style={{ fontSize: 12, color: "var(--tx3)", marginTop: 6 }}>
                  가입 보너스는 DB에 <code style={{ fontSize: 11 }}>signup_bonus_trigger.sql</code> 적용 후 신규 가입 시 지급됩니다.
                </div>
              )}
            </>
          )}
        </Cd>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        {PACKS.map((p) => (
          <Cd key={p.id} style={{ padding: "18px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{p.name}</div>
              {p.tag && (
                <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "var(--cyd)", color: "var(--cy)", fontFamily: "var(--mo)" }}>{p.tag}</span>
              )}
            </div>
            <div style={{ fontSize: 13, color: "var(--tx2)" }}>{p.tokens.toLocaleString()} 토큰</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--cy)", marginTop: 4 }}>{p.price}</div>
            <Bt v="pr" dis style={{ marginTop: 8, justifyContent: "center" }}>
              구매 (준비 중)
            </Bt>
          </Cd>
        ))}
      </div>
    </div>
  );
}
