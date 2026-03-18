import { useNavigate } from "react-router-dom";

import Av from "../common/Av";
import Bt from "../common/Bt";
import { useAppState } from "../contexts/AppStateContext";

// 마스터 내 클론 목록 — 최대 3개, 카드 클릭 시 /dashboard/:id. 신규는 /dashboard/create.

export default function MyClones() {
  const navigate = useNavigate();
  const { myClones, setActiveMyClone } = useAppState();

  const openDash = (c) => {
    setActiveMyClone(c);
    navigate(`/dashboard/${c.id}`);
  };

  const goCreate = () => navigate("/dashboard/create");

  return (
    <div style={{ minHeight: 600, padding: "20px 20px 48px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ fontSize: 10, color: "var(--cy)", fontFamily: "var(--mo)", marginBottom: 8, letterSpacing: "0.08em" }}>MY CLONES</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>내 클론 ({myClones.length}/3)</h2>
          {myClones.length < 3 && (
            <Bt v="pr" on={goCreate}>
              + 새 클론 만들기
            </Bt>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          {myClones.map((c) => (
            <div
              key={c.id}
              style={{
                background: "var(--sf)",
                border: `1px solid ${c.active ? "var(--br2)" : "var(--br)"}`,
                borderRadius: 14,
                padding: "18px 20px",
                display: "flex",
                gap: 14,
                alignItems: "center",
                transition: "all 0.15s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = c.color + "66";
                e.currentTarget.style.boxShadow = `0 4px 20px ${c.color}12`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = c.active ? "var(--br2)" : "var(--br)";
                e.currentTarget.style.boxShadow = "none";
              }}
              onClick={() => openDash(c)}
            >
              <Av char={c.av} color={c.color} size={50} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 15, fontWeight: 800 }}>{c.name}</span>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.active ? "var(--gn)" : "var(--sf3)", animation: c.active ? "pulse 2s infinite" : undefined }} />
                  <span style={{ fontSize: 11, color: c.active ? "var(--gn)" : "var(--tx3)" }}>{c.active ? "운영중" : "대기중"}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 6 }}>{c.subtitle}</div>
                <div style={{ display: "flex", gap: 14, fontSize: 11, color: "var(--tx3)", fontFamily: "var(--mo)" }}>
                  <span style={{ color: "var(--cy)" }}>{c.subs}명 구독</span>
                  <span>{c.docs}개 문서</span>
                  <span>{c.v}</span>
                  {c.discount > 0 && <span style={{ color: "var(--am)" }}>할인 {c.discount}% 진행중</span>}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: c.color }}>
                    ₩{c.discount > 0 ? Math.round(c.price * (1 - c.discount / 100)).toLocaleString() : c.price.toLocaleString()}
                  </div>
                  {c.discount > 0 && <div style={{ fontSize: 10, color: "var(--am)", textDecoration: "none", fontFamily: "var(--mo)" }}>-{c.discount}% 할인중</div>}
                  <div style={{ fontSize: 10, color: "var(--tx3)", fontFamily: "var(--mo)" }}>/월</div>
                </div>
                <div style={{ fontSize: 12, color: "var(--cy)", fontFamily: "var(--mo)" }}>상세보기 →</div>
              </div>
            </div>
          ))}
        </div>

        {myClones.length < 3 && (
          <div
            onClick={goCreate}
            style={{ padding: "18px 20px", border: "2px dashed var(--br)", borderRadius: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "all 0.15s" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--cy)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--br)";
            }}
          >
            <div style={{ width: 50, height: 50, borderRadius: "50%", border: "2px dashed var(--br)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "var(--tx3)" }}>+</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tx2)", marginBottom: 3 }}>새 클론 추가</div>
              <div style={{ fontSize: 12, color: "var(--tx3)" }}>다른 주제나 타겟으로 별도의 클론을 운영할 수 있습니다 ({3 - myClones.length}개 더 가능)</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

