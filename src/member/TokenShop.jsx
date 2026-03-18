import { useCallback, useEffect, useState } from "react";

import Bt from "../common/Bt";
import Cd from "../common/Cd";
import { useAuth } from "../contexts/AuthContext";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { getLocalTokenMock, localMockPurchase, mockPurchaseTokenPack } from "../lib/supabaseQueries";

const PACKS = [
  { id: "s", name: "스타터", tokens: 100, price: "₩4,900", won: 4900, tag: null },
  { id: "m", name: "스탠다드", tokens: 350, price: "₩14,900", won: 14900, tag: "인기" },
  { id: "l", name: "프로", tokens: 800, price: "₩29,900", won: 29900, tag: null },
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

function isRlsError(err) {
  if (!err) return false;
  const c = err.code || "";
  const m = (err.message || "").toLowerCase();
  return c === "42501" || m.includes("row-level security") || m.includes("permission denied");
}

export default function TokenShop() {
  const { user, supabaseConfigured } = useAuth();
  const [purchased, setPurchased] = useState(null);
  const [bonusRows, setBonusRows] = useState([]);
  const [localExtra, setLocalExtra] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalPack, setModalPack] = useState(null);
  const [payBusy, setPayBusy] = useState(false);
  const [payMsg, setPayMsg] = useState("");
  const [payErr, setPayErr] = useState("");

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user?.id) {
      setPurchased(null);
      setBonusRows([]);
      setLocalExtra(0);
      return;
    }
    const loc = getLocalTokenMock(user.id);
    setLocalExtra(loc.purchased);
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
  const dbPurchased = purchased ?? 0;
  const totalPurchasedDisplay = dbPurchased + localExtra;

  const runMockPay = async (pack, useLocalOnly) => {
    setPayErr("");
    setPayMsg("");
    const supabase = getSupabaseBrowserClient();
    if (!user?.id) return;

    if (useLocalOnly) {
      setPayBusy(true);
      localMockPurchase(user.id, { tokens: pack.tokens, name: pack.name });
      setPayBusy(false);
      setPayMsg(`${pack.tokens}토큰이 브라우저 Mock으로 충전되었습니다.`);
      setModalPack(null);
      load();
      return;
    }

    if (!supabase) {
      setPayErr("Supabase 클라이언트가 없습니다.");
      return;
    }

    setPayBusy(true);
    const result = await mockPurchaseTokenPack(supabase, user.id, {
      tokens: pack.tokens,
      name: pack.name,
      won: pack.won,
      priceLabel: pack.price,
    });
    setPayBusy(false);

    if (result.error) {
      if (isRlsError(result.error)) {
        setPayErr(
          "DB에 쓰기 권한이 없습니다. SQL Editor에서 docs/supabase/token_mock_purchase_rls.sql 을 실행하거나, 아래「브라우저만 충전」을 사용하세요."
        );
      } else {
        setPayErr(result.error.message || "충전 실패");
      }
      return;
    }
    setPayMsg(`${pack.tokens}토큰이 충전되었습니다. (테스트 결제)`);
    setModalPack(null);
    load();
  };

  return (
    <div style={{ minHeight: 480 }}>
      <div style={{ fontSize: 10, color: "var(--cy)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 10 }}>TOKENS</div>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>토큰 상점</h1>
      <p style={{ color: "var(--tx2)", lineHeight: 1.7, marginBottom: 16, fontSize: 13 }}>
        <strong style={{ color: "var(--am)" }}>테스트 모드</strong> — 실제 결제·카드 없이 Mock으로만 충전됩니다.
      </p>

      {supabaseConfigured && user && (
        <Cd style={{ padding: "16px 18px", marginBottom: 20, borderColor: "var(--br2)" }}>
          <div style={{ fontSize: 11, color: "var(--tx3)", fontFamily: "var(--mo)", marginBottom: 8 }}>내 잔액</div>
          {loading ? (
            <div style={{ color: "var(--tx3)", fontSize: 13 }}>불러오는 중…</div>
          ) : (
            <>
              <div style={{ fontSize: 15, marginBottom: 6 }}>
                <strong style={{ color: "var(--cy)" }}>구매 잔액</strong>{" "}
                {localExtra > 0 ? (
                  <>
                    {dbPurchased.toLocaleString()} <span style={{ color: "var(--tx3)" }}>(DB)</span> +{" "}
                    {localExtra.toLocaleString()} <span style={{ color: "var(--tx3)" }}>(브라우저)</span> ={" "}
                    <strong>{totalPurchasedDisplay.toLocaleString()}</strong>
                  </>
                ) : (
                  <>{dbPurchased.toLocaleString()}</>
                )}{" "}
                토큰
              </div>
              <div style={{ fontSize: 15, marginBottom: bonusRows.length ? 10 : 0 }}>
                <strong style={{ color: "var(--go)" }}>보너스(유효)</strong> {bonusTotal}토큰
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
              <div style={{ fontSize: 11, color: "var(--tx3)", marginTop: 10, lineHeight: 1.5 }}>
                합계 사용 가능: 약 <strong style={{ color: "var(--cy)" }}>{(totalPurchasedDisplay + bonusTotal).toLocaleString()}</strong> 토큰 (구매+보너스)
              </div>
            </>
          )}
        </Cd>
      )}

      {payMsg ? (
        <p style={{ color: "var(--gn)", fontSize: 13, marginBottom: 14 }}>{payMsg}</p>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        {PACKS.map((p) => (
          <Cd key={p.id} style={{ padding: "18px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{p.name}</div>
              {p.tag && (
                <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "var(--cyd)", color: "var(--cy)", fontFamily: "var(--mo)" }}>
                  {p.tag}
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: "var(--tx2)" }}>{p.tokens.toLocaleString()} 토큰</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--cy)", marginTop: 4 }}>{p.price}</div>
            <Bt v="pr" on={() => setModalPack(p)} dis={!user} style={{ marginTop: 8, justifyContent: "center" }}>
              Mock 구매
            </Bt>
          </Cd>
        ))}
      </div>

      {!user && <p style={{ marginTop: 16, fontSize: 13, color: "var(--tx3)" }}>로그인 후 충전할 수 있습니다.</p>}

      {modalPack && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => !payBusy && setModalPack(null)}
        >
          <div
            role="document"
            style={{
              maxWidth: 400,
              width: "100%",
              padding: 24,
              background: "var(--sf)",
              border: "1px solid var(--br)",
              borderRadius: 13,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>테스트 결제</h2>
            <p style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.6, marginBottom: 16 }}>
              <strong>{modalPack.name}</strong> · {modalPack.tokens.toLocaleString()}토큰 · {modalPack.price}
              <br />
              실제 과금 없이 잔액만 증가합니다.
            </p>
            {payErr ? <p style={{ color: "#f66", fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>{payErr}</p> : null}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Bt v="pr" on={() => runMockPay(modalPack, false)} dis={payBusy}>
                {payBusy ? "처리 중…" : "결제 시뮬레이션 (DB 반영)"}
              </Bt>
              <Bt v="gh" on={() => runMockPay(modalPack, true)} dis={payBusy}>
                브라우저에만 충전 (SQL 없이 테스트)
              </Bt>
              <Bt v="gh" on={() => setModalPack(null)} dis={payBusy}>
                취소
              </Bt>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
