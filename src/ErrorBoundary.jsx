import { Component } from "react";

/**
 * Catches render errors so users see a message instead of a blank screen.
 * Check the browser console for the full stack trace.
 */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[clone.me] App render error:", error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (error) {
      const msg = error?.message || String(error);
      return (
        <div
          style={{
            minHeight: "100dvh",
            padding: 24,
            boxSizing: "border-box",
            background: "#0a0a10",
            color: "#e8e8f0",
            fontFamily: "system-ui, sans-serif",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>화면을 불러오지 못했습니다</h1>
          <p style={{ opacity: 0.85, fontSize: 14, lineHeight: 1.5 }}>
            앱 렌더 중 오류가 났습니다. 개발자 도구(F12) → Console 탭에서 자세한 오류를 확인한 뒤 새로고침해 보세요.
          </p>
          <pre
            style={{
              margin: 0,
              padding: 12,
              borderRadius: 8,
              background: "rgba(255,255,255,0.06)",
              fontSize: 12,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {msg}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
