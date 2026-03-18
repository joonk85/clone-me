import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Av from "../common/Av";
import MasterBadges from "../common/MasterBadges";
import Bt from "../common/Bt";
import Cd from "../common/Cd";
import Tg from "../common/Tg";
import { useWindowSize } from "../hooks/useWindowSize";
import { useAuth } from "../contexts/AuthContext";
import { getSupabaseBrowserClient } from "../lib/supabase";
import {
  fetchMarketClones,
  fetchMasterHomeSummary,
  fetchRecentConversations,
  fetchTokenSummary,
  rowToMarketCard,
} from "../lib/supabaseQueries";

const GUEST_STATS = [
  { label: "전문가 클론", value: "340+", sub: "등록" },
  { label: "누적 대화", value: "120만+", sub: "턴" },
  { label: "만족도", value: "4.8", sub: "/ 5.0" },
];

function relTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

function FeaturedCard({ c, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-[220px] max-w-[260px] flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left transition hover:border-[#c4b5fd]/40 hover:bg-white/8"
    >
      <div className="relative h-28 w-full overflow-hidden bg-black/30">
        <Av src={c.av} alt="" className="h-full w-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] to-transparent" />
        {c.featured && (
          <span className="absolute right-2 top-2 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-black">
            Featured
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="truncate font-semibold text-[#e8e8f0]">{c.name}</p>
        <div className="mt-1">
          <MasterBadges verified={c.isVerified} affiliate={c.isAffiliate} />
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-[#e8e8f0]/55">{c.tagline || c.bio || "대화해보세요"}</p>
      </div>
    </button>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { user, supabaseConfigured } = useAuth();
  const { isMobile } = useWindowSize();

  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState("guest"); // guest | member | master
  const [guestFeatured, setGuestFeatured] = useState([]);
  const [memberChats, setMemberChats] = useState([]);
  const [recommend, setRecommend] = useState([]);
  const [tokens, setTokens] = useState({ total: 0, purchased: 0, bonus: 0 });
  const [masterSum, setMasterSum] = useState(null);

  const loadGuestFeatured = useCallback(async (supabase) => {
    const { rows } = await fetchMarketClones(supabase, 16);
    const cards = rows.map(rowToMarketCard);
    const feat = cards.filter((c) => c.featured);
    const rest = cards.filter((c) => !c.featured);
    const merged = [...feat, ...rest].slice(0, 6);
    setGuestFeatured(merged.slice(0, 3));
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const supabase = getSupabaseBrowserClient();
      if (!user?.id) {
        setMode("guest");
        if (supabase) await loadGuestFeatured(supabase);
        if (!cancelled) setReady(true);
        return;
      }
      if (!supabase) {
        setMode("guest");
        setReady(true);
        return;
      }
      const { data: u } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
      if (cancelled) return;
      const isMaster = u?.role === "master";
      if (isMaster) {
        setMode("master");
        const sum = await fetchMasterHomeSummary(supabase, user.id);
        if (!cancelled) setMasterSum(sum);
      } else {
        setMode("member");
        const [conv, tok, market] = await Promise.all([
          fetchRecentConversations(supabase, user.id, 5),
          fetchTokenSummary(supabase, user.id),
          fetchMarketClones(supabase, 8),
        ]);
        if (cancelled) return;
        setMemberChats(conv.list || []);
        setTokens({
          total: tok.total ?? 0,
          purchased: tok.purchased ?? 0,
          bonus: tok.bonus ?? 0,
        });
        setRecommend((market.rows || []).map(rowToMarketCard).slice(0, 6));
      }
      setReady(true);
    }
    setReady(false);
    run();
    return () => {
      cancelled = true;
    };
  }, [user?.id, loadGuestFeatured]);

  const pad = isMobile ? "px-4 py-6" : "px-6 py-10";
  const maxW = "max-w-3xl mx-auto";

  if (!ready) {
    return (
      <div className={`min-h-[50vh] ${pad} flex items-center justify-center`}>
        <p className="text-sm text-[#e8e8f0]/50">불러오는 중…</p>
      </div>
    );
  }

  /* ========== 비로그인 ========== */
  if (mode === "guest") {
    return (
      <div className={`min-h-screen ${pad}`}>
        <div className={maxW}>
          <section className="text-center">
            <Tg k="h1" className="text-3xl font-bold tracking-tight text-[#e8e8f0] sm:text-4xl">
              나만의 전문가 클론과 대화하세요
            </Tg>
            <p className="mx-auto mt-3 max-w-lg text-sm text-[#e8e8f0]/60">
              법률·세무·코칭 등 분야별 마스터의 지식을 클론으로. 토큰으로 대화하고, 마스터는 수익을 만듭니다.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Bt variant="primary" onClick={() => navigate("/signup")}>
                무료로 시작하기
              </Bt>
              <Bt variant="ghost" onClick={() => navigate("/market")}>
                마켓 둘러보기
              </Bt>
            </div>
          </section>

          <section className="mt-14 grid grid-cols-3 gap-3 sm:gap-6">
            {GUEST_STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-4 text-center sm:px-4"
              >
                <p className="text-lg font-bold text-[#c4b5fd] sm:text-2xl">{s.value}</p>
                <p className="mt-1 text-[10px] text-[#e8e8f0]/45 sm:text-xs">{s.label}</p>
                {s.sub && <p className="text-[10px] text-[#e8e8f0]/35">{s.sub}</p>}
              </div>
            ))}
          </section>

          <section className="mt-14">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#e8e8f0]">Featured 클론</h2>
              <Link to="/market" className="text-sm text-[#c4b5fd] hover:underline">
                전체 보기
              </Link>
            </div>
            {!supabaseConfigured ? (
              <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-[#e8e8f0]/50">
                Supabase 연결 후 마켓 클론이 표시됩니다.
              </p>
            ) : guestFeatured.length === 0 ? (
              <p className="text-sm text-[#e8e8f0]/45">아직 등록된 클론이 없습니다. 마스터로 참여해 보세요.</p>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {guestFeatured.map((c) => (
                  <FeaturedCard key={c.id} c={c} onClick={() => navigate(`/clone/${c.id}`)} />
                ))}
              </div>
            )}
          </section>

          <section className="mt-12 rounded-2xl border border-[#c4b5fd]/25 bg-gradient-to-br from-[#c4b5fd]/10 to-transparent p-6 text-center">
            <p className="font-medium text-[#e8e8f0]">지금 가입하고 보너스 토큰을 받으세요</p>
            <Bt variant="primary" className="mt-4" onClick={() => navigate("/signup")}>
              회원가입
            </Bt>
          </section>
        </div>
      </div>
    );
  }

  /* ========== 멤버 ========== */
  if (mode === "member") {
    return (
      <div className={`min-h-screen ${pad}`}>
        <div className={maxW}>
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div>
              <p className="text-xs text-[#e8e8f0]/50">보유 토큰</p>
              <p className="text-2xl font-bold text-[#c4b5fd]">{tokens.total.toLocaleString()}</p>
              {tokens.bonus > 0 && (
                <p className="text-[10px] text-[#e8e8f0]/40">보너스 {tokens.bonus.toLocaleString()} 포함</p>
              )}
            </div>
            <div className="flex gap-2">
              <Bt variant="ghost" size="sm" onClick={() => navigate("/my/tokens")}>
                충전
              </Bt>
              <Bt variant="primary" size="sm" onClick={() => navigate("/market")}>
                마켓
              </Bt>
            </div>
          </div>

          <section className="mb-10">
            <h2 className="mb-3 text-lg font-semibold text-[#e8e8f0]">최근 대화</h2>
            {memberChats.length === 0 ? (
              <Cd className="p-6 text-center text-sm text-[#e8e8f0]/50">
                아직 대화 기록이 없습니다.{" "}
                <button type="button" className="text-[#c4b5fd] underline" onClick={() => navigate("/market")}>
                  마켓에서 클론 선택
                </button>
              </Cd>
            ) : (
              <ul className="space-y-2">
                {memberChats.map((row) => {
                  const clone = row.clones;
                  const name = clone?.name || "클론";
                  return (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/chat/${row.clone_id}`)}
                        className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-[#c4b5fd]/30"
                      >
                        <Av src={clone?.av} alt="" className="h-12 w-12 flex-shrink-0 rounded-xl object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-[#e8e8f0]">{name}</p>
                          <p className="text-xs text-[#e8e8f0]/45">{relTime(row.updated_at)}</p>
                        </div>
                        <span className="text-[#c4b5fd]">→</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#e8e8f0]">추천 클론</h2>
              <Link to="/market" className="text-sm text-[#c4b5fd] hover:underline">
                더보기
              </Link>
            </div>
            {recommend.length === 0 ? (
              <p className="text-sm text-[#e8e8f0]/45">마켓을 준비 중입니다.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {recommend.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => navigate(`/clone/${c.id}`)}
                    className="overflow-hidden rounded-xl border border-white/10 bg-white/5 text-left transition hover:border-[#c4b5fd]/35"
                  >
                    <div className="relative h-20 overflow-hidden bg-black/20">
                      <Av src={c.av} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="p-2">
                      <p className="truncate text-sm font-medium text-[#e8e8f0]">{c.name}</p>
                      <div className="mt-0.5 origin-left scale-[0.92]">
                        <MasterBadges verified={c.isVerified} affiliate={c.isAffiliate} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  /* ========== 마스터 ========== */
  const sum = masterSum || { master: null, clonesTotal: 0, clonesActive: 0, pendingFeedback: [] };
  const hasMasterProfile = !!sum.master;

  return (
    <div className={`min-h-screen ${pad}`}>
      <div className={maxW}>
        {!hasMasterProfile ? (
          <Cd className="p-6 text-center">
            <p className="text-[#e8e8f0]/80">마스터 프로필을 등록하면 클론을 만들 수 있습니다.</p>
            <Bt variant="primary" className="mt-4" onClick={() => navigate("/master-register")}>
              마스터 등록
            </Bt>
          </Cd>
        ) : (
          <>
            <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-[#e8e8f0]/50">내 클론</p>
                <p className="mt-1 text-2xl font-bold text-[#e8e8f0]">{sum.clonesTotal}</p>
                <p className="text-xs text-[#e8e8f0]/45">활성 {sum.clonesActive}개</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-[#e8e8f0]/50">미답변 피드백</p>
                <p className="mt-1 text-2xl font-bold text-amber-400/90">{sum.pendingFeedback.length}</p>
                <p className="text-xs text-[#e8e8f0]/45">최근 5건 표시</p>
              </div>
              <div className="col-span-2 flex items-center justify-center rounded-2xl border border-[#c4b5fd]/20 bg-[#c4b5fd]/5 p-4 sm:col-span-1">
                <Bt variant="primary" className="w-full sm:w-auto" onClick={() => navigate("/dashboard")}>
                  대시보드
                </Bt>
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#e8e8f0]">미답변 피드백</h2>
                {sum.pendingFeedback.length > 0 && (
                  <Link to="/dashboard" className="text-sm text-[#c4b5fd] hover:underline">
                    전체 관리
                  </Link>
                )}
              </div>
              {sum.pendingFeedback.length === 0 ? (
                <p className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-sm text-[#e8e8f0]/50">
                  답변 대기 중인 피드백이 없습니다.
                </p>
              ) : (
                <ul className="space-y-2">
                  {sum.pendingFeedback.map((f) => (
                    <li
                      key={f.id}
                      className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-[#e8e8f0]/85"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs text-[#e8e8f0]/45">
                        <span>{f.clones?.name || "클론"}</span>
                        <span>{relTime(f.created_at)}</span>
                      </div>
                      <p className="mt-1 line-clamp-2">{f.message || "(내용 없음)"}</p>
                      {f.rating != null && (
                        <p className="mt-1 text-xs text-amber-200/80">★ {f.rating}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
