/**
 * Supabase 테이블 조회·정규화 (RLS 전제). 마켓·프로필·users·masters.
 */

function firstChar(s) {
  if (!s || typeof s !== "string") return "?";
  return s.trim().charAt(0).toUpperCase() || "?";
}

/** 활성 클론 + 마스터 (마켓 목록). anon 가능 */
export async function fetchMarketClones(supabase) {
  const { data, error } = await supabase
    .from("clones")
    .select(
      `
      id,
      name,
      subtitle,
      color,
      av,
      token_price,
      master_id,
      created_at,
      masters (
        id,
        name,
        title,
        bio,
        signature,
        tags,
        links,
        is_verified,
        is_affiliate
      )
    `
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return { list: [], error };
  const list = (data || []).map(rowToMarketCard);
  return { list, error: null };
}

export function rowToMarketCard(row) {
  const m = row.masters || {};
  const tags = Array.isArray(m.tags) ? m.tags : [];
  const cat =
    tags.find((t) => /영업|마케팅|교육/.test(t)) ||
    tags[0] ||
    "전체";
  return {
    id: row.id,
    name: m.name || row.name || "클론",
    title: m.title || row.subtitle || "",
    cat,
    price: row.token_price ?? 1,
    priceLabel: `토큰 ${row.token_price ?? 1}/메시지`,
    subs: 0,
    rating: 4.8,
    docs: 0,
    av: row.av || firstChar(m.name || row.name),
    color: row.color || "#63d9ff",
    featured: !!m.is_verified,
    isVerified: !!m.is_verified,
    isAffiliate: !!m.is_affiliate,
    tags,
    bio: m.bio || "",
    signature: m.signature || "",
    links: m.links && typeof m.links === "object" ? m.links : {},
    master_id: row.master_id,
    token_price: row.token_price,
  };
}

function formatUpdateDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return "—";
  }
}

/** 클론 상세 (마스터 프로필 페이지). 활성 또는 소유자면 RLS 통과 */
export async function fetchCloneForProfile(supabase, cloneId) {
  const { data, error } = await supabase
    .from("clones")
    .select(
      `
      id,
      name,
      subtitle,
      color,
      av,
      token_price,
      welcome_msg,
      master_id,
      masters (
        id,
        name,
        title,
        bio,
        signature,
        tags,
        links,
        is_verified,
        is_affiliate,
        slug
      ),
      demo_qa ( question, answer, is_pinned, display_order ),
      clone_products ( name, price, description, display_order ),
      clone_updates ( title, body, created_at )
    `
    )
    .eq("id", cloneId)
    .maybeSingle();

  if (error) return { clone: null, error };
  if (!data) return { clone: null, error: null };

  const m = data.masters || {};
  const demo = [...(data.demo_qa || [])].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
  );
  const products = [...(data.clone_products || [])].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
  );
  const updates = [...(data.clone_updates || [])].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const clone = {
    id: data.id,
    name: m.name || data.name || "클론",
    title: m.title || data.subtitle || "",
    av: data.av || firstChar(m.name || data.name),
    color: data.color || "#63d9ff",
    featured: !!m.is_verified,
    masterVerified: !!m.is_verified,
    masterAffiliate: !!m.is_affiliate,
    isVerified: !!m.is_verified,
    isAffiliate: !!m.is_affiliate,
    tags: Array.isArray(m.tags) ? m.tags : [],
    bio: m.bio || "",
    signature: m.signature || "",
    links: m.links && typeof m.links === "object" ? m.links : {},
    price: data.token_price ?? 1,
    priceLabel: `토큰 ${data.token_price ?? 1}/메시지`,
    subs: 0,
    rating: 4.8,
    docs: 0,
    token_price: data.token_price,
    welcomeMsg: data.welcome_msg || "",
    demoQA: demo.map((d) => ({
      q: d.question,
      a: d.answer,
      pinned: !!d.is_pinned,
    })),
    products: products.map((p) => ({
      name: p.name,
      price: p.price || "—",
      topic: p.description || "",
    })),
    updates: updates.map((u) => ({
      date: formatUpdateDate(u.created_at),
      title: u.title,
      body: u.body || "",
    })),
  };

  return { clone, error: null };
}

export async function fetchMyUserRow(supabase) {
  const { data, error } = await supabase.from("users").select("*").maybeSingle();
  return { row: data, error };
}

export async function updateMyUserRow(supabase, userId, patch) {
  const { data, error } = await supabase.from("users").update(patch).eq("id", userId).select().single();
  return { row: data, error };
}

export async function fetchMasterForUser(supabase) {
  const { data, error } = await supabase.from("masters").select("*").maybeSingle();
  return { row: data, error };
}

export async function insertMaster(supabase, row) {
  const { data, error } = await supabase.from("masters").insert(row).select().single();
  return { row: data, error };
}

export async function updateMaster(supabase, masterId, patch) {
  const { data, error } = await supabase.from("masters").update(patch).eq("id", masterId).select().single();
  return { row: data, error };
}

/** 홈 — 멤버: 최근 대화 */
export async function fetchRecentConversations(supabase, userId, limit = 5) {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, updated_at, clone_id, clones(name, color, av)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(limit);
  return { list: data || [], error };
}

/** 채팅 레일: 대화 목록 + 마지막 메시지 미리보기 */
export async function fetchConversationsForChatRail(supabase, userId, limit = 40) {
  const { data: convs, error } = await supabase
    .from("conversations")
    .select("id, updated_at, clone_id, clones(name, color, av)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) return { list: [], error };
  if (!convs?.length) return { list: [], error: null };

  const ids = convs.map((c) => c.id);
  const { data: msgs } = await supabase
    .from("messages")
    .select("conversation_id, content, created_at")
    .in("conversation_id", ids)
    .order("created_at", { ascending: false })
    .limit(600);

  const previewByConv = {};
  for (const m of msgs || []) {
    if (previewByConv[m.conversation_id] == null) {
      const t = (m.content || "").replace(/\s+/g, " ").trim();
      previewByConv[m.conversation_id] = t.slice(0, 72) || "새 대화";
    }
  }

  const list = convs.map((c) => ({
    id: c.id,
    updated_at: c.updated_at,
    clone_id: c.clone_id,
    cloneName: c.clones?.name || "클론",
    color: c.clones?.color || "#63d9ff",
    av: c.clones?.av || "?",
    preview: previewByConv[c.id] || "새 대화",
  }));
  return { list, error: null };
}

export async function fetchMessagesForConversation(supabase, conversationId) {
  const { data, error } = await supabase
    .from("messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  return { messages: data || [], error };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** 구독 클론 메타 (레일 하단) — UUID만 DB 조회 */
export async function fetchClonesByIdsForRail(supabase, cloneIds) {
  const uuids = (cloneIds || []).filter((id) => typeof id === "string" && UUID_RE.test(id));
  if (!uuids.length) return { list: [], error: null };
  const { data, error } = await supabase.from("clones").select("id, name, color, av").in("id", uuids).eq("is_active", true);
  if (error) return { list: [], error };
  return { list: data || [], error: null };
}

/** 홈 — 멤버: 토큰 요약 */
export async function fetchTokenSummary(supabase, userId) {
  const [balRes, bonusRes] = await Promise.all([
    supabase.from("token_balances").select("purchased_balance").maybeSingle(),
    supabase
      .from("bonus_tokens")
      .select("remaining, expires_at, is_expired")
      .eq("user_id", userId)
      .gt("remaining", 0),
  ]);
  const purchased = balRes.data?.purchased_balance ?? 0;
  const now = Date.now();
  const bonus = (bonusRes.data || [])
    .filter((b) => !b.is_expired && new Date(b.expires_at).getTime() > now)
    .reduce((s, b) => s + (b.remaining || 0), 0);
  return { purchased, bonus, total: purchased + bonus, error: balRes.error || bonusRes.error };
}

/** 마스터 소유 클론 목록 */
export async function fetchClonesForMaster(supabase, masterId) {
  const { data, error } = await supabase
    .from("clones")
    .select("id, name, is_active, token_price, discount, color, av, updated_at")
    .eq("master_id", masterId)
    .order("updated_at", { ascending: false });
  return { rows: data || [], error };
}

export async function fetchMasterHomeSummary(supabase, userId) {
  const { data: master, error: mErr } = await supabase.from("masters").select("id, name, is_verified").eq("user_id", userId).maybeSingle();
  if (mErr || !master) {
    return { master: null, clonesTotal: 0, clonesActive: 0, pendingFeedback: [], error: mErr };
  }
  const { data: clones } = await supabase.from("clones").select("id, name, is_active").eq("master_id", master.id);
  const list = clones || [];
  const cloneIds = list.map((c) => c.id);
  let pendingFeedback = [];
  if (cloneIds.length) {
    const { data: fb } = await supabase
      .from("feedbacks")
      .select("id, message, rating, created_at, clone_id, clones(name)")
      .in("clone_id", cloneIds)
      .is("reply", null)
      .order("created_at", { ascending: false })
      .limit(5);
    pendingFeedback = fb || [];
  }
  return {
    master,
    clonesTotal: list.length,
    clonesActive: list.filter((c) => c.is_active).length,
    pendingFeedback,
    error: null,
  };
}

const LS_TOKEN_MOCK = "clone_me_token_mock";

function readLocalTokenMock(userId) {
  if (typeof window === "undefined" || !userId) return { purchased: 0, txs: [] };
  try {
    const raw = window.localStorage.getItem(`${LS_TOKEN_MOCK}_${userId}`);
    if (!raw) return { purchased: 0, txs: [] };
    const o = JSON.parse(raw);
    return {
      purchased: Math.max(0, Number(o.purchased) || 0),
      txs: Array.isArray(o.txs) ? o.txs : [],
    };
  } catch {
    return { purchased: 0, txs: [] };
  }
}

function writeLocalTokenMock(userId, data) {
  if (typeof window === "undefined" || !userId) return;
  window.localStorage.setItem(`${LS_TOKEN_MOCK}_${userId}`, JSON.stringify(data));
}

/** 로컬 Mock 충전 (DB 정책 없을 때) */
export function localMockPurchase(userId, pack) {
  const cur = readLocalTokenMock(userId);
  const nextPurchased = cur.purchased + pack.tokens;
  const tx = {
    id: `local_${Date.now()}`,
    created_at: new Date().toISOString(),
    type: "purchase",
    amount: pack.tokens,
    description: `[브라우저 Mock] ${pack.name} ${pack.tokens}T`,
    source: "local",
  };
  cur.txs.unshift(tx);
  writeLocalTokenMock(userId, { purchased: nextPurchased, txs: cur.txs.slice(0, 200) });
  return { purchased: nextPurchased, tx };
}

export function getLocalTokenMock(userId) {
  return readLocalTokenMock(userId);
}

export async function fetchTokenTransactions(supabase, userId, limit = 80) {
  const { data, error } = await supabase
    .from("token_transactions")
    .select("id, amount, type, token_type, description, created_at, clone_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return { rows: data || [], error };
}

/** DB Mock 결제 — token_mock_purchase_rls.sql 적용 필요 */
export async function mockPurchaseTokenPack(supabase, userId, pack) {
  const { tokens, name, won, priceLabel } = pack;
  const { data: row, error: selErr } = await supabase.from("token_balances").select("purchased_balance").eq("user_id", userId).maybeSingle();
  if (selErr) return { error: selErr };

  let newPurchased;
  if (!row) {
    const { error: insErr } = await supabase.from("token_balances").insert({
      user_id: userId,
      purchased_balance: tokens,
    });
    if (insErr) return { error: insErr };
    newPurchased = tokens;
  } else {
    newPurchased = (row.purchased_balance ?? 0) + tokens;
    const { error: upErr } = await supabase
      .from("token_balances")
      .update({ purchased_balance: newPurchased, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (upErr) return { error: upErr };
  }

  const { error: txErr } = await supabase.from("token_transactions").insert({
    user_id: userId,
    amount: tokens,
    token_type: "purchased",
    type: "purchase",
    description: `[테스트결제] ${name} (${tokens}T · ${priceLabel})`,
    balance_after_purchased: newPurchased,
    actual_price: won,
  });
  if (txErr) return { error: txErr, newPurchased };
  return { newPurchased, error: null };
}
