import { useNavigate } from "react-router-dom";

import Bt from "../common/Bt";
import { useAppState } from "../contexts/AppStateContext";

// 랜딩 — 역할(creator/buyer)별 CTA·카드. create / market / dashboard / 마스터 등록으로 연결.

export default function Home() {
  const navigate = useNavigate();
  const { role } = useAppState();

  return (
    <div
      style={{
        minHeight: 600,
        padding: "56px 24px 48px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "8%",
          left: "5%",
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: "radial-gradient(circle,var(--cyd) 0%,transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "12%",
          right: "5%",
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: "radial-gradient(circle,var(--tg-gn-bg) 0%,transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 600, animation: "fu 0.5s ease" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 13px",
            borderRadius: 100,
            border: "1px solid var(--br2)",
            background: "var(--cyg)",
            marginBottom: 24,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "var(--cy)",
              boxShadow: "0 0 6px var(--cy)",
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: 11, color: "var(--cy)", fontFamily: "var(--mo)", letterSpacing: "0.08em" }}>
            지식 클론 플랫폼 · 한국 최초 · BETA
          </span>
        </div>
        <h1
          style={{
            fontSize: "clamp(32px,6.5vw,62px)",
            fontWeight: 800,
            lineHeight: 1.06,
            letterSpacing: "-0.04em",
            marginBottom: 14,
            background: "linear-gradient(135deg,#fff 0%,var(--cy) 50%,var(--gn) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          내 지식의 클론을
          <br />
          만드세요
        </h1>
        <p style={{ fontSize: "clamp(13px,2.2vw,16px)", color: "var(--tx2)", lineHeight: 1.9, marginBottom: 28, maxWidth: 420, margin: "0 auto 28px" }}>
          {role === "creator" ? (
            <>
              강의 자료를 올리면 AI가 나처럼 대화합니다.
              <br />
              내가 자는 동안에도 클론이 가르치고,
              <br />
              <span style={{ color: "var(--gn)", fontWeight: 600 }}>수익이 매달 입금됩니다.</span>
            </>
          ) : (
            <>
              분야 최고 전문가에게 언제든 1:1로 물어보세요.
              <br />
              <span style={{ color: "var(--cy)", fontWeight: 600 }}>전문가 클론이 24시간 답해드립니다.</span>
            </>
          )}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}>
          <Bt v="pr" sz="lg" on={() => navigate(role === "creator" ? "/dashboard/create" : "/market")}>
            {role === "creator" ? "내 클론 만들기 →" : "전문가 클론 탐색 →"}
          </Bt>
          <Bt v="gh" sz="lg" on={() => navigate(role === "creator" ? "/dashboard" : "/master-register")}>
            {role === "creator" ? "내 클론 관리" : "강사로 등록하기"}
          </Bt>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, borderRadius: 14, overflow: "hidden", border: "1px solid var(--br)" }}>
          {(role === "creator"
            ? [
                ["최대 3개", "클론 동시 운영"],
                ["자료만 올리면", "5분 안에 완성"],
                ["설문 완료", "+5회 추가 체험"],
              ]
            : [
                ["100+", "분야별 전문가"],
                ["24시간", "언제든 질문"],
                ["월 200회", "기본 대화 제공"],
              ]
          ).map(([v, l]) => (
            <div key={l} style={{ padding: "18px 10px", background: "var(--sf)", textAlign: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "var(--cy)", marginBottom: 3 }}>{v}</div>
              <div style={{ fontSize: 11, color: "var(--tx2)" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

