/**
 * UI·안내용: 1토큰 ≈ ₩100 (실결제와 무관). BRAIN `TOKEN_KRW_REF` 와 동기.
 */

export const TOKEN_KRW_REF = 100;

/**
 * @param {number} tokensPerTurn
 * @returns {number}
 */
export function approxWonPerTurn(tokensPerTurn) {
  const n = Number(tokensPerTurn);
  if (!Number.isFinite(n) || n <= 0) return TOKEN_KRW_REF;
  return Math.round(n * TOKEN_KRW_REF);
}

/**
 * @param {number} tokensPerTurn
 * @returns {string} 예: "약 ₩300/턴"
 */
export function formatApproxWonPerTurn(tokensPerTurn) {
  return `약 ₩${approxWonPerTurn(tokensPerTurn).toLocaleString("ko-KR")}/턴`;
}

/**
 * 클론 채팅용 한 줄 (토큰 + 원화 참고)
 * @param {number} tokensPerTurn
 * @returns {string}
 */
export function buildClonePriceLabel(tokensPerTurn) {
  const t = Number(tokensPerTurn);
  const n = Number.isFinite(t) && t > 0 ? Math.round(t) : 1;
  return `${n}토큰/턴 · ${formatApproxWonPerTurn(n)}`;
}
