import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import { AppStateProvider } from "./contexts/AppStateContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicOnlyRoute from "./routes/PublicOnlyRoute";
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
import MyLayout from "./mypage/MyLayout";
import MemberProfile from "./mypage/MemberProfile";
import MemberSubscription from "./mypage/MemberSubscription";
import MemberConversations from "./mypage/MemberConversations";
import MemberBecomeMaster from "./mypage/MemberBecomeMaster";
import MasterTab from "./mypage/MasterTab";
import MasterVerify from "./mypage/master/MasterVerify";
import MasterClonesList from "./mypage/master/MasterClonesList";
import MasterRevenue from "./mypage/master/MasterRevenue";
import MasterPricing from "./mypage/master/MasterPricing";
import MasterPayout from "./mypage/master/MasterPayout";
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
                <Route element={<PublicOnlyRoute />}>
                  <Route path="login" element={<Login />} />
                  <Route path="signup" element={<Signup />} />
                  <Route path="signup/verified" element={<Verified />} />
                </Route>
                <Route path="market" element={<Market />} />
                <Route path="master/:id" element={<MasterProfilePage />} />
                <Route path="terms" element={<Terms />} />
                <Route path="privacy" element={<Privacy />} />
                <Route path="404" element={<NotFound />} />
                <Route path="500" element={<ServerError />} />

                {/* 보호: 인증 필요 */}
                <Route element={<ProtectedRoute />}>
                  <Route path="onboarding" element={<Onboarding />} />
                  <Route path="my" element={<MyLayout />}>
                    <Route index element={<Navigate to="profile" replace />} />
                    <Route path="profile" element={<MemberProfile />} />
                    <Route path="subscription" element={<MemberSubscription />} />
                    <Route path="conversations" element={<MemberConversations />} />
                    <Route path="become-master" element={<MemberBecomeMaster />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="tokens" element={<TokenPage />}>
                      <Route index element={<TokenShopTab />} />
                      <Route path="history" element={<TokenHistoryTab />} />
                    </Route>
                    <Route path="master" element={<Outlet />}>
                      <Route index element={<Navigate to="profile" replace />} />
                      <Route path="profile" element={<MasterTab />} />
                      <Route path="verify" element={<MasterVerify />} />
                      <Route path="clones" element={<MasterClonesList />} />
                      <Route path="revenue" element={<MasterRevenue />} />
                      <Route path="pricing" element={<MasterPricing />} />
                      <Route path="payout" element={<MasterPayout />} />
                    </Route>
                  </Route>
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
