import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Av from "../common/Av";
import { useAuth } from "../contexts/AuthContext";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { fetchRecentConversations } from "../lib/supabaseQueries";

function relTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export default function MemberConversations() {
  const { user, supabaseConfigured } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { list: rows } = await fetchRecentConversations(supabase, user.id, 30);
    setList(rows || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!supabaseConfigured) {
    return <p style={{ color: "var(--tx2)" }}>Supabase 설정 후 이용할 수 있습니다.</p>;
  }

  return (
    <div>
      <p style={{ fontSize: 10, color: "var(--cy)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 8 }}>CHATS</p>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>대화 기록</h2>
      <p style={{ color: "var(--tx2)", fontSize: 13, marginBottom: 20 }}>최근 대화한 클론으로 바로 이동합니다.</p>
      {loading ? (
        <p style={{ color: "var(--tx3)" }}>불러오는 중…</p>
      ) : list.length === 0 ? (
        <p style={{ color: "var(--tx2)", fontSize: 14 }}>아직 대화 기록이 없습니다.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {list.map((row) => {
            const c = row.clones;
            const name = c?.name || "클론";
            const col = c?.color || "#63d9ff";
            return (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/chat/${row.clone_id}`)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid var(--br)",
                    background: "var(--sf2)",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "var(--fn)",
                  }}
                >
                  {c?.av ? (
                    <img src={c.av} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover" }} />
                  ) : (
                    <Av char={name.charAt(0)} color={col} size={44} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: "var(--tx)" }}>{name}</div>
                    <div style={{ fontSize: 12, color: "var(--tx2)" }}>{relTime(row.updated_at)}</div>
                  </div>
                  <span style={{ color: "var(--cy)" }}>→</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
