// Anthropic API(채팅·클론 응답) — MVP는 서버 경유 호출. Phase 1~3에서 클라이언트 직결 금지·환경변수 연동.

export async function callAnthropicChat() {
  throw new Error("Anthropic client not configured yet (Phase 1-3).");
}
