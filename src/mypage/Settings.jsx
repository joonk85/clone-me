import { Navigate } from "react-router-dom";

/** 북마크 호환: 전역 설정은 `/my/*` 계정 허브로 통합 */
export default function Settings() {
  return <Navigate to="/my/general" replace />;
}
