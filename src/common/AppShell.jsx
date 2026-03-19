import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

import Av from "./Av";
import { useAuth } from "../contexts/AuthContext";
import { AppRailProvider } from "../contexts/AppRailContext";
import { usePageTitle } from "../contexts/PageTitleContext";
import { useWindowSize } from "../hooks/useWindowSize";
import { getSupabaseBrowserClient } from "../lib/supabase";
import {
  fetchConversationsForChatRail,
  fetchMasterForUser,
  fetchMyUserRow,
  fetchTokenSummary,
} from "../lib/supabaseQueries";

const RAIL_OPEN = 240;
const RAIL_COLLAPSED = 56;
const STORAGE_KEY = "clone_me_rail_collapsed";

const PATH_TITLES = {
  "/": "홈",
  "/market": "탐색",
  "/my": "마이",
  "/my/profile": "프로필",
  "/my/conversations": "대화 목록",
  "/my/tokens": "토큰",
  "/my/settings": "설정",
  "/my/subscription": "구독",
  "/my/become-master": "마스터 되기",
  "/dashboard": "대시보드",
  "/dashboard/create": "클론 만들기",
  "/master-register": "마스터 등록",
};

function getPageTitle(pathname, contextTitle) {
  if (contextTitle) return contextTitle;
  if (pathname.startsWith("/chat/")) return "대화";
  const sorted = Object.entries(PATH_TITLES).sort((a, b) => b[0].length - a[0].length);
  for (const [path, title] of sorted) {
    if (pathname === path || (path !== "/" && pathname.startsWith(path))) return title;
  }
  return "clone.me";
}

function formatRailDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    if (sameDay) return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch {
    return "";
  }
}

function isImageAv(v) {
  return typeof v === "string" && /^https?:\/\//i.test(v.trim());
}

function readCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export default function AppShell({ children }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isMobile } = useWindowSize();
  const { title: contextTitle } = usePageTitle();
  const dropdownRef = useRef(null);

  const [railOpen, setRailOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [convList, setConvList] = useState([]);
  const [userRow, setUserRow] = useState(null);
  const [tokens, setTokens] = useState({ total: 0 });
  const [isMaster, setIsMaster] = useState(false);

  const refreshRail = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user?.id) return;
    const [convRes, userRes, tokRes, masterRes] = await Promise.all([
      fetchConversationsForChatRail(supabase, user.id, 40),
      fetchMyUserRow(supabase),
      fetchTokenSummary(supabase, user.id),
      fetchMasterForUser(supabase),
    ]);
    setConvList(convRes.list || []);
    setUserRow(userRes.row || null);
    setTokens({ total: tokRes.total ?? 0 });
    setIsMaster(!!masterRes.row);
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) refreshRail();
  }, [user?.id, refreshRail]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch (_) {}
  }, [collapsed]);

  const pageTitle = getPageTitle(pathname, contextTitle);
  const displayName = userRow?.display_name || userRow?.email?.split("@")[0] || "나";
  const userAv = userRow?.avatar_url || userRow?.av;
  const userChar = (displayName || "?").trim().charAt(0).toUpperCase();

  const closeRail = useCallback(() => setRailOpen(false), []);
  const railWidth = collapsed ? RAIL_COLLAPSED : RAIL_OPEN;
  const mainMarginLeft = isMobile ? 0 : railWidth;

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setUserDropdownOpen(false);
    }
    if (userDropdownOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [userDropdownOpen]);

  const isActive = (path) => pathname === path || (path !== "/" && pathname.startsWith(path));

  return (
    <AppRailProvider refreshRail={refreshRail}>
      <div
        style={{
          display: "flex",
          flex: 1,
          minHeight: 0,
          width: "100%",
          background: "var(--bg)",
          color: "var(--tx)",
        }}
      >
        {/* Overlay (mobile) */}
        {isMobile && (
          <button
            type="button"
            aria-label="레일 닫기"
            aria-hidden={!railOpen}
            style={{
              position: "fixed",
              inset: 0,
              background: "var(--overlay-dim)",
              zIndex: 199,
              border: "none",
              padding: 0,
              cursor: "pointer",
              opacity: railOpen ? 1 : 0,
              pointerEvents: railOpen ? "auto" : "none",
              transition: "opacity 0.2s ease",
            }}
            onClick={closeRail}
            onKeyDown={(e) => e.key === "Escape" && closeRail()}
          />
        )}

        {/* Left Rail: fixed, full viewport height */}
        <aside
          className="app-shell-rail"
          role="navigation"
          aria-label="앱 레일"
          data-open={isMobile ? railOpen : undefined}
          data-collapsed={!isMobile && collapsed ? "true" : undefined}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            height: "100dvh",
            width: railWidth,
            display: "flex",
            flexDirection: "column",
            background: "var(--sf)",
            borderRight: "1px solid var(--br)",
            zIndex: 200,
            transform: isMobile ? (railOpen ? "translateX(0)" : "translateX(-100%)") : "none",
            transition: "transform 0.22s ease, width 0.2s ease",
            boxShadow: isMobile ? "4px 0 24px rgba(0,0,0,0.35)" : "none",
          }}
          onKeyDown={(e) => isMobile && e.key === "Escape" && closeRail()}
        >
          {/* 상단: 로고 + 토글 */}
          <div
            style={{
              padding: collapsed ? "12px 10px" : "12px 14px",
              borderBottom: "1px solid var(--br)",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "space-between",
              gap: 8,
            }}
          >
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                navigate("/");
                if (isMobile) closeRail();
              }}
              onKeyDown={(e) => e.key === "Enter" && navigate("/")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                fontFamily: "var(--fn-title)",
                fontWeight: 800,
                fontSize: "var(--fs-body)",
                color: "var(--tx)",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "var(--cy)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 10px var(--cyg)",
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 900, color: "var(--on-cy)" }}>c</span>
              </div>
              {!collapsed && <span>clone.me</span>}
            </div>
            {!isMobile && (
              <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                aria-label={collapsed ? "레일 펼치기" : "레일 접기"}
                style={{
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  background: "transparent",
                  color: "var(--tx2)",
                  cursor: "pointer",
                  borderRadius: "var(--r-sm)",
                }}
              >
                {collapsed ? (
                  <ChevronRightIcon style={{ width: 20, height: 20 }} />
                ) : (
                  <ChevronLeftIcon style={{ width: 20, height: 20 }} />
                )}
              </button>
            )}
          </div>

          {/* 메뉴: 홈, 마스터 찾기 */}
          <nav style={{ padding: "8px 0", borderBottom: "1px solid var(--br)", flexShrink: 0 }} aria-label="주 메뉴">
            <button
              type="button"
              onClick={() => {
                navigate("/");
                if (isMobile) closeRail();
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: collapsed ? "10px 0" : "10px 14px",
                justifyContent: collapsed ? "center" : "flex-start",
                border: "none",
                background: isActive("/") ? "var(--cyd)" : "transparent",
                color: isActive("/") ? "var(--cy)" : "var(--tx)",
                cursor: "pointer",
                fontFamily: "var(--fn)",
                fontSize: "var(--fs-caption)",
                fontWeight: 600,
              }}
            >
              <HomeIcon style={{ width: 20, height: 20, flexShrink: 0 }} />
              {!collapsed && <span>홈</span>}
            </button>
            <button
              type="button"
              onClick={() => {
                navigate("/market");
                if (isMobile) closeRail();
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: collapsed ? "10px 0" : "10px 14px",
                justifyContent: collapsed ? "center" : "flex-start",
                border: "none",
                background: isActive("/market") ? "var(--cyd)" : "transparent",
                color: isActive("/market") ? "var(--cy)" : "var(--tx)",
                cursor: "pointer",
                fontFamily: "var(--fn)",
                fontSize: "var(--fs-caption)",
                fontWeight: 600,
              }}
            >
              <MagnifyingGlassIcon style={{ width: 20, height: 20, flexShrink: 0 }} />
              {!collapsed && <span>마스터 찾기</span>}
            </button>
          </nav>

          {/* 로그인 후: 대화 히스토리 (스크롤) */}
          {user && (
            <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: collapsed ? "8px 0" : "8px 0" }}>
              {convList.length === 0 ? (
                !collapsed && (
                  <div
                    style={{
                      padding: 20,
                      textAlign: "center",
                      fontSize: "var(--fs-xs)",
                      color: "var(--tx3)",
                      fontFamily: "var(--fn)",
                    }}
                  >
                    저장된 대화가 없습니다.
                  </div>
                )
              ) : (
                <ul style={{ listStyle: "none", padding: "4px 0", margin: 0 }}>
                  {convList.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => {
                          navigate(`/chat/${c.clone_id}?conv=${c.id}`);
                          if (isMobile) closeRail();
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: collapsed ? 0 : 10,
                          padding: collapsed ? "10px 0" : "10px 14px",
                          justifyContent: collapsed ? "center" : "flex-start",
                          border: "none",
                          background:
                            pathname.startsWith("/chat/") && pathname.includes(c.clone_id) ? "var(--cyd)" : "transparent",
                          color: "var(--tx)",
                          textAlign: "left",
                          cursor: "pointer",
                          fontFamily: "var(--fn)",
                        }}
                      >
                        {isImageAv(c.av) ? (
                          <img
                            src={c.av}
                            alt=""
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <Av
                            char={(c.av || c.cloneName || "?").toString().trim().charAt(0)}
                            color={c.color || "#63d9ff"}
                            size={36}
                          />
                        )}
                        {!collapsed && (
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                fontSize: "var(--fs-caption)",
                                fontWeight: 600,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {c.cloneName || "클론"}
                            </div>
                            <div
                              style={{
                                fontSize: "var(--fs-xs)",
                                color: "var(--tx3)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {c.preview || "새 대화"}
                            </div>
                            <div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 2, fontFamily: "var(--mo)" }}>
                              {formatRailDate(c.updated_at)}
                            </div>
                          </div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* 하단 고정 */}
          <div
            style={{
              padding: collapsed ? "10px 0" : "12px 14px",
              borderTop: "1px solid var(--br)",
              flexShrink: 0,
              background: "var(--sf)",
              display: "flex",
              justifyContent: collapsed ? "center" : "stretch",
            }}
          >
            {!user ? (
              <button
                type="button"
                onClick={() => {
                  navigate("/login");
                  if (isMobile) closeRail();
                }}
                style={{
                  width: collapsed ? "auto" : "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: collapsed ? "10px" : "10px 14px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  border: "1px solid var(--br2)",
                  borderRadius: "var(--r-md)",
                  background: "var(--cyd)",
                  color: "var(--cy)",
                  fontSize: "var(--fs-caption)",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "var(--fn)",
                }}
              >
                <ArrowRightOnRectangleIcon style={{ width: 20, height: 20, flexShrink: 0 }} />
                {!collapsed && <span>로그인</span>}
              </button>
            ) : (
              <div style={{ position: "relative", width: collapsed ? "auto" : "100%" }} ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen((o) => !o)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: collapsed ? 0 : 10,
                    padding: collapsed ? "8px 0" : "10px 12px",
                    justifyContent: collapsed ? "center" : "flex-start",
                    border: "1px solid var(--br)",
                    borderRadius: "var(--r-lg)",
                    background: "var(--sf2)",
                    color: "var(--tx)",
                    textAlign: "left",
                    cursor: "pointer",
                    fontFamily: "var(--fn)",
                  }}
                >
                  {isImageAv(userAv) ? (
                    <img
                      src={userAv}
                      alt=""
                      style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                    />
                  ) : (
                    <Av char={userChar} color="var(--cy)" size={40} />
                  )}
                  {!collapsed && (
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: "var(--fs-caption)",
                          fontWeight: 700,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {displayName}
                      </div>
                    </div>
                  )}
                </button>
                {userDropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "100%",
                      left: collapsed ? "50%" : 0,
                      transform: collapsed ? "translateX(-50%)" : "translateY(-4px)",
                      marginBottom: 4,
                      minWidth: collapsed ? 160 : 180,
                      background: "var(--sf2)",
                      border: "1px solid var(--br)",
                      borderRadius: "var(--r-md)",
                      boxShadow: "0 8px 24px var(--overlay-dim)",
                      zIndex: 201,
                      overflow: "hidden",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/my");
                        setUserDropdownOpen(false);
                        if (isMobile) closeRail();
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "12px 14px",
                        border: "none",
                        background: "transparent",
                        color: "var(--tx)",
                        cursor: "pointer",
                        fontFamily: "var(--fn)",
                        fontSize: "var(--fs-caption)",
                        textAlign: "left",
                      }}
                    >
                      <UserCircleIcon style={{ width: 20, height: 20 }} />
                      마이페이지
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/my/settings");
                        setUserDropdownOpen(false);
                        if (isMobile) closeRail();
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "12px 14px",
                        border: "none",
                        borderTop: "1px solid var(--br)",
                        background: "transparent",
                        color: "var(--tx)",
                        cursor: "pointer",
                        fontFamily: "var(--fn)",
                        fontSize: "var(--fs-caption)",
                        textAlign: "left",
                      }}
                    >
                      <Cog6ToothIcon style={{ width: 20, height: 20 }} />
                      설정
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Main: margin-left로 rail 너비 확보, 전체 높이 */}
        <div
          className="app-shell-main"
          style={{
            marginLeft: mainMarginLeft,
            minHeight: "100dvh",
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <header
            style={{
              flexShrink: 0,
              height: "var(--nav-h-mobile)",
              minHeight: "var(--nav-h-mobile)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              paddingLeft: "max(var(--page-pad-x), var(--safe-left))",
              paddingRight: "max(var(--page-pad-x), var(--safe-right))",
              paddingTop: "var(--safe-top)",
              background: "var(--nav-scrim)",
              backdropFilter: "blur(16px)",
              borderBottom: "1px solid var(--br)",
            }}
          >
            {isMobile && (
              <button
                type="button"
                aria-label="메뉴 열기"
                onClick={() => setRailOpen(true)}
                style={{
                  width: 44,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  background: "transparent",
                  color: "var(--tx)",
                  cursor: "pointer",
                }}
              >
                <Bars3Icon style={{ width: 24, height: 24 }} />
              </button>
            )}
            <h1
              style={{
                flex: 1,
                minWidth: 0,
                margin: 0,
                fontSize: "var(--fs-h3)",
                fontWeight: 800,
                color: "var(--tx)",
                fontFamily: "var(--fn)",
                letterSpacing: "-0.03em",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {pageTitle}
            </h1>

            {/* 우측: 비로그인=로그인 버튼 / 로그인=아바타+토큰+마스터 */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              {!user ? (
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "var(--r-md)",
                    border: "1px solid var(--br2)",
                    background: "var(--cyd)",
                    color: "var(--cy)",
                    fontSize: "var(--fs-caption)",
                    fontWeight: 700,
                    fontFamily: "var(--fn)",
                    cursor: "pointer",
                  }}
                >
                  로그인
                </button>
              ) : (
                <>
                  {isImageAv(userAv) ? (
                    <img
                      src={userAv}
                      alt=""
                      style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }}
                    />
                  ) : (
                    <Av char={userChar} color="var(--cy)" size={32} />
                  )}
                  <button
                    type="button"
                    onClick={() => navigate("/my/tokens")}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      borderRadius: 999,
                      border: "1px solid var(--br2)",
                      background: "var(--cyd)",
                      color: "var(--cy)",
                      fontSize: "var(--fs-xs)",
                      fontWeight: 700,
                      fontFamily: "var(--mo)",
                      cursor: "pointer",
                    }}
                  >
                    {tokens.total.toLocaleString()} T
                  </button>
                  {isMaster ? (
                    <button
                      type="button"
                      onClick={() => navigate("/dashboard")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "var(--r-md)",
                        border: "1px solid var(--br2)",
                        background: "var(--cyd)",
                        color: "var(--cy)",
                        fontSize: "var(--fs-xs)",
                        fontWeight: 700,
                        fontFamily: "var(--fn)",
                        cursor: "pointer",
                      }}
                    >
                      마스터 전환
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate("/master-register")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "var(--r-md)",
                        border: "1px solid var(--cy)",
                        background: "transparent",
                        color: "var(--cy)",
                        fontSize: "var(--fs-xs)",
                        fontWeight: 700,
                        fontFamily: "var(--fn)",
                        cursor: "pointer",
                      }}
                    >
                      마스터 만들기
                    </button>
                  )}
                </>
              )}
            </div>
          </header>
          <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>{children}</div>
        </div>
      </div>
    </AppRailProvider>
  );
}
