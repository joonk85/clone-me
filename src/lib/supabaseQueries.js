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
        is_verified
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
