/**
 * 모바일 하단 탭바(홈·마켓·마이) 표시 여부.
 * 채팅·온보딩·대시보드·가입 플로우 등 몰입 화면에서는 숨김.
 */
export function shouldShowMobileTabBar(pathname) {
  if (!pathname || typeof pathname !== "string") return false;
  if (pathname.startsWith("/chat/")) return false;
  if (pathname.startsWith("/onboarding")) return false;
  if (pathname.startsWith("/dashboard")) return false;
  if (pathname.startsWith("/master-register")) return false;
  if (pathname.startsWith("/signup")) return false;
  return true;
}
