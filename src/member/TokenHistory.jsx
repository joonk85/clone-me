import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../contexts/AuthContext";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { fetchTokenTransactions, getLocalTokenMock } from "../lib/supabaseQueries";

const FILTERS = [
  { id: "all", l: "전체" },
  { id: "purchase", l: "충전" },
  { id: "usage", l: "사용" },
  { id: "bonus", l: "보너스·기타" },
];

function kindLabel(type) {
  if (!type) return "기타";
  if (type === "purchase") return "충전";
  if (type === "usage") return "사용";
  if (String(type).startsWith("bonus_")) return "보너스";
  if (type === "bonus_expired") return "만료";
  if (type === "refund") return "환불";
  if (type === "pass_monthly") return "패스";
  return type;
}

function matchesFilter(filterId, type) {
  if (filterId === "all") return true;
  if (filterId === "purchase") return type === "purchase" || type === "pass_monthly" || type === "refund";
  if (filterId === "usage") return type === "usage";
  if (filterId === "bonus") {
    return (
      type === "bonus_signup" ||
      type === "bonus_survey" ||
      type === "bonus_event" ||
      type === "bonus_expired" ||
      (type && String(type).startsWith("bonus"))
    );
  }
  return true;
}

export default function TokenHistory({ embedded = false } = {}) {
  const { user, supabaseConfigured } = useAuth();
  const [filter, setFilter] = useState("all");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) {
      setRows([]);
      setLoading(false);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    const local = getLocalTokenMock(user.id);
    const localRows = (local.txs || []).map((t) => ({
      id: t.id,
      created_at: t.created_at,
      type: t.type || "purchase",
      amount: t.amount,
      description: t.description,
      source: "local",
    }));

    if (!supabase || !supabaseConfigured) {
      setRows(localRows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      setLoading(false);
      return;
    }

    setLoading(true);
    const { rows: dbRows } = await fetchTokenTransactions(supabase, user.id, 100);
    setLoading(false);
    const merged = [
      ...(dbRows || []).map((r) => ({ ...r, source: "db" })),
      ...localRows,
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setRows(merged);
  }, [user?.id, supabaseConfigured]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = rows.filter((r) => matchesFilter(filter, r.type));
  const fmtWhen = (iso) => {
    try {
      const d = new Date(iso);
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    } catch {
      return iso;
    }
  };

  return (
    <div style={{ minHeight: embedded ? 0 : 480 }}>
      {!embedded && (
        <>
          <div style={{ fontSize: 10, color: "var(--cy)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 10 }}>TOKENS</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>이용 내역</h1>
        </>
      )}
      {embedded ? (
        <h2 style={{ fontSize: "var(--fs-body)", fontWeight: 800, marginBottom: 10, fontFamily: "var(--fn)", color: "var(--tx)" }}>사용 이력</h2>
      ) : null}
      <p style={{ color: "var(--tx2)", lineHeight: 1.7, marginBottom: 16, fontSize: embedded ? "var(--fs-caption)" : 13, fontFamily: "var(--fn)" }}>
        충전(Mock)·사용·만료·보너스 내역입니다. DB와 브라우저 Mock이 합쳐져 표시됩니다.
      </p>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: filter === f.id ? "1px solid var(--cy)" : "1px solid var(--br)",
              background: filter === f.id ? "var(--cyd)" : "transparent",
              color: filter === f.id ? "var(--cy)" : "var(--tx2)",
              fontSize: 12,
              fontWeight: filter === f.id ? 700 : 500,
              cursor: "pointer",
              fontFamily: "var(--fn)",
            }}
          >
            {f.l}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "var(--tx3)", fontSize: 13 }}>불러오는 중…</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "var(--tx2)", fontSize: 14 }}>내역이 없습니다. 토큰 상점에서 Mock 충전해 보세요.</p>
      ) : (
        <div style={{ border: "1px solid var(--br)", borderRadius: 12, overflow: "hidden", background: "var(--sf)" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr) 72px 72px minmax(0,1fr)",
              gap: 8,
              padding: "10px 14px",
              fontSize: 10,
              color: "var(--tx3)",
              fontFamily: "var(--mo)",
              borderBottom: "1px solid var(--br)",
            }}
          >
            <span>일시</span>
            <span>유형</span>
            <span style={{ textAlign: "right" }}>토큰</span>
            <span>비고</span>
          </div>
          {filtered.map((r) => {
            const amt = Number(r.amount) || 0;
            const sign = amt >= 0 ? "+" : "";
            const isNeg = amt < 0;
            return (
              <div
                key={r.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1fr) 72px 72px minmax(0,1fr)",
                  gap: 8,
                  padding: "12px 14px",
                  fontSize: 12,
                  borderBottom: "1px solid var(--br)",
                  alignItems: "center",
                }}
              >
                <span style={{ color: "var(--tx2)", fontFamily: "var(--mo)", fontSize: 11 }}>{fmtWhen(r.created_at)}</span>
                <span>{kindLabel(r.type)}</span>
                <span style={{ textAlign: "right", fontFamily: "var(--mo)", color: isNeg ? "var(--am)" : "var(--gn)" }}>
                  {sign}
                  {amt}
                </span>
                <span style={{ color: "var(--tx2)", fontSize: 11 }}>
                  {r.description || "—"}
                  {r.source === "local" && <span style={{ color: "var(--tx3)", marginLeft: 4 }}>(브라우저)</span>}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
