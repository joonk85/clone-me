import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import { AppStateProvider } from "./contexts/AppStateContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import Layout from "./routes/Layout";
import MasterProfilePage from "./routes/MasterProfilePage";
import ChatPage from "./routes/ChatPage";
import CloneDashPage from "./routes/CloneDashPage";
import TokenPage, { TokenHistoryTab, TokenShopTab } from "./routes/TokenPage";

import Home from "./pages/Home";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import Verified from "./auth/Verified";
import Onboarding from "./auth/Onboarding";
import Market from "./member/Market";
import Buyer from "./member/Buyer";
import MyClones from "./master/MyClones";
import Create from "./master/Create";
import MasterRegister from "./master/MasterRegister";
import MyPage from "./mypage/MyPage";
import MemberTab from "./mypage/MemberTab";
import MasterTab from "./mypage/MasterTab";
import Settings from "./mypage/Settings";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import ServerError from "./pages/ServerError";
import { GLOBAL_CSS } from "./styles/globalCss";

// 앱 루트 — React Router v6, PRD URL 구조. Protected: /onboarding, /my/*, /chat/*, /master-register, /dashboard/*

export default function App() {
  return (
    <div style={{ minHeight: 700, background: "var(--bg)", color: "var(--tx)", fontFamily: "var(--fn)", display: "flex", flexDirection: "column" }}>
      <style>{GLOBAL_CSS}</style>
      <BrowserRouter>
        <AuthProvider>
          <AppStateProvider>
            <Routes>
              <Route element={<Layout />}>
                {/* 공개 */}
                <Route index element={<Home />} />
                <Route path="login" element={<Login />} />
                <Route path="signup" element={<Signup />} />
                <Route path="signup/verified" element={<Verified />} />
                <Route path="market" element={<Market />} />
                <Route path="master/:id" element={<MasterProfilePage />} />
                <Route path="terms" element={<Terms />} />
                <Route path="privacy" element={<Privacy />} />
                <Route path="404" element={<NotFound />} />
                <Route path="500" element={<ServerError />} />

                {/* 보호: 인증 필요 */}
                <Route element={<ProtectedRoute />}>
                  <Route path="onboarding" element={<Onboarding />} />
                  <Route path="my" element={<MyPage />} />
                  <Route path="my/master" element={<MasterTab />} />
                  <Route path="my/tokens" element={<TokenPage />}>
                    <Route index element={<TokenShopTab />} />
                    <Route path="history" element={<TokenHistoryTab />} />
                  </Route>
                  <Route path="my/settings" element={<Settings />} />
                  <Route path="chat/:cloneId" element={<ChatPage />} />
                  <Route path="master-register" element={<MasterRegister />} />
                  <Route path="dashboard" element={<MyClones />} />
                  <Route path="dashboard/create" element={<Create />} />
                  <Route path="dashboard/:cloneId" element={<CloneDashPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/404" replace />} />
              </Route>
            </Routes>
          </AppStateProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}
