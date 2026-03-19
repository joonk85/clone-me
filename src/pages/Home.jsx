import { useNavigate } from "react-router-dom";

import Bt from "../common/Bt";
import { useWindowSize } from "../hooks/useWindowSize";

const HERO_STATS = [
  { value: "100+", label: "분야별 전문가" },
  { value: "24시간", label: "언제든 질문" },
  { value: "월 200회", label: "기본 대화" },
];

export default function Home() {
  const navigate = useNavigate();
  const { isMobile } = useWindowSize();

  const pagePad = {
    paddingLeft: "max(var(--page-pad-x), var(--safe-left))",
    paddingRight: "max(var(--page-pad-x), var(--safe-right))",
    paddingTop: isMobile ? 16 : 28,
    paddingBottom: isMobile ? "calc(28px + var(--safe-bottom))" : "calc(40px + var(--safe-bottom))",
    background: "var(--bg)",
  };

  const maxW = { maxWidth: 1040, marginLeft: "auto", marginRight: "auto", width: "100%" };

  return (
    <div style={{ minHeight: "100%", ...pagePad }}>
      <div style={maxW}>
        {/* 히어로 섹션 (로그인/비로그인/로딩 상태 모두 동일) */}
        <section
          className="home-hero"
          aria-label="메인 소개"
          style={{
            position: "relative",
            textAlign: "center",
            paddingTop: isMobile ? 12 : 20,
            paddingBottom: isMobile ? 8 : 12,
            marginBottom: isMobile ? 4 : 8,
            overflow: "hidden",
            borderRadius: "var(--r-xl)",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: "-8% -12% auto",
              height: "92%",
              background:
                "radial-gradient(ellipse 72% 48% at 50% -8%, var(--cyd) 0%, transparent 58%), radial-gradient(ellipse 42% 32% at 92% 18%, var(--cyg) 0%, transparent 70%), radial-gradient(ellipse 38% 28% at 8% 22%, var(--cyg) 0%, transparent 68%)",
              pointerEvents: "none",
            }}
          />
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: "50%",
              bottom: "-20%",
              transform: "translateX(-50%)",
              width: "min(100%, 520px)",
              height: "45%",
              background: "radial-gradient(ellipse 80% 70% at 50% 100%, var(--cyd) 0%, transparent 65%)",
              opacity: 0.5,
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                display: "inline-flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginBottom: isMobile ? 18 : 22,
                padding: "8px 16px",
                borderRadius: 999,
                border: "1px solid var(--br2)",
                background: "linear-gradient(135deg, var(--cyd) 0%, var(--sf2) 100%)",
                boxShadow: "0 0 32px var(--cyg)",
              }}
            >
              {["지식 클론 플랫폼", "한국 최초", "BETA"].map((t, i) => (
                <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  {i > 0 && (
                    <span style={{ color: "var(--tx3)", fontFamily: "var(--mo)", fontSize: "var(--fs-xs)" }} aria-hidden>
                      ·
                    </span>
                  )}
                  <span
                    style={{
                      fontFamily: "var(--mo)",
                      fontSize: "var(--fs-xs)",
                      letterSpacing: i === 2 ? "0.14em" : "0.06em",
                      textTransform: i === 2 ? "uppercase" : "none",
                      color: i === 2 ? "var(--go)" : "var(--cy)",
                      fontWeight: 700,
                    }}
                  >
                    {t}
                  </span>
                </span>
              ))}
            </div>

            <h1 className="home-hero-gradient-title" style={{ maxWidth: 720, margin: "0 auto", padding: "0 4px" }}>
              내 지식의 클론을 만드세요
            </h1>

            <p
              style={{
                margin: "18px auto 0",
                maxWidth: 460,
                fontSize: "var(--fs-body)",
                color: "var(--tx2)",
                lineHeight: 1.72,
                fontFamily: "var(--fn)",
                fontWeight: 500,
              }}
            >
              분야 최고 전문가에게 언제든 1:1로 물어보세요
            </p>

            <div
              style={{
                marginTop: isMobile ? 26 : 30,
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Bt v="pr" on={() => navigate("/market")} style={{ minHeight: "var(--touch-min)", paddingLeft: 20, paddingRight: 20 }}>
                전문가 클론 탐색 →
              </Bt>
              <Bt v="gh" on={() => navigate("/master-register")} style={{ minHeight: "var(--touch-min)", paddingLeft: 18, paddingRight: 18 }}>
                내 클론 만들기
              </Bt>
            </div>
          </div>
        </section>

        {/* 통계 바 */}
        <section style={{ marginTop: isMobile ? 28 : 40 }}>
          <div
            style={{
              borderRadius: "var(--r-xl)",
              overflow: "hidden",
              border: "1px solid var(--br2)",
              background: "var(--sf2)",
              boxShadow: "0 0 0 1px var(--cyg)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: "stretch",
              }}
            >
              {HERO_STATS.map((s, i) => (
                <div
                  key={s.label}
                  style={{
                    flex: 1,
                    padding: isMobile ? "18px 16px" : "24px 18px",
                    textAlign: "center",
                    borderLeft: !isMobile && i > 0 ? "1px solid var(--br)" : undefined,
                    borderTop: isMobile && i > 0 ? "1px solid var(--br)" : undefined,
                  }}
                >
                  <p
                    style={{
                      fontSize: isMobile ? "var(--fs-h2)" : "clamp(1.2rem, 2vw, 1.45rem)",
                      fontWeight: 800,
                      color: "var(--cy)",
                      fontFamily: "var(--mo)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {s.value}
                  </p>
                  <p
                    style={{
                      marginTop: 8,
                      fontSize: "var(--fs-caption)",
                      color: "var(--tx)",
                      fontFamily: "var(--fn)",
                      fontWeight: 600,
                      lineHeight: 1.45,
                    }}
                  >
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

