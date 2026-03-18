import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Bt from "../common/Bt";
import { useAuth } from "../contexts/AuthContext";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { fetchMasterForUser, insertMaster, updateMaster } from "../lib/supabaseQueries";

const field = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid var(--br)",
  borderRadius: 8,
  background: "var(--sf2)",
  color: "var(--tx)",
  fontSize: 14,
  outline: "none",
  fontFamily: "var(--fn)",
};

export default function MasterTab() {
  const { user, supabaseConfigured } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [masterId, setMasterId] = useState(null);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [signature, setSignature] = useState("");
  const [slug, setSlug] = useState("");
  const [color, setColor] = useState("#63d9ff");
  const [tagsStr, setTagsStr] = useState("");
  const [linkIg, setLinkIg] = useState("");
  const [linkYt, setLinkYt] = useState("");
  const [linkFc, setLinkFc] = useState("");
  const [linkSub, setLinkSub] = useState("");

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { row, error } = await fetchMasterForUser(supabase);
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    if (row) {
      setMasterId(row.id);
      setName(row.name || "");
      setTitle(row.title || "");
      setBio(row.bio || "");
      setSignature(row.signature || "");
      setSlug(row.slug || "");
      setColor(row.color || "#63d9ff");
      setTagsStr(Array.isArray(row.tags) ? row.tags.join(", ") : "");
      const L = row.links && typeof row.links === "object" ? row.links : {};
      setLinkIg(L.ig || "");
      setLinkYt(L.yt || "");
      setLinkFc(L.fc || "");
      setLinkSub(L.sub || "");
    } else {
      setMasterId(null);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const buildLinks = () => {
    const o = {};
    if (linkIg.trim()) o.ig = linkIg.trim();
    if (linkYt.trim()) o.yt = linkYt.trim();
    if (linkFc.trim()) o.fc = linkFc.trim();
    if (linkSub.trim()) o.sub = linkSub.trim();
    return o;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user?.id) return;
    const tags = tagsStr
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const slugClean = slug.trim().replace(/[^a-z0-9-]/gi, "").toLowerCase() || null;
    const payload = {
      name: name.trim() || null,
      title: title.trim() || null,
      bio: bio.trim() || null,
      signature: signature.trim() || null,
      slug: slugClean,
      color: color.trim() || "#63d9ff",
      tags: tags.length ? tags : null,
      links: buildLinks(),
      updated_at: new Date().toISOString(),
    };

    setSaving(true);
    if (masterId) {
      const { error } = await updateMaster(supabase, masterId, payload);
      setSaving(false);
      if (error) {
        setErr(error.message.includes("unique") ? "이미 사용 중인 slug 입니다." : error.message);
        return;
      }
    } else {
      const { row, error } = await insertMaster(supabase, {
        user_id: user.id,
        ...payload,
        status: "active",
      });
      setSaving(false);
      if (error) {
        setErr(error.message.includes("unique") ? "slug 중복 또는 이미 마스터 프로필이 있습니다." : error.message);
        return;
      }
      if (row) setMasterId(row.id);
    }
    setMsg("저장했습니다. 활성 클론이 있으면 마켓에 노출됩니다.");
  };

  if (!supabaseConfigured) {
    return (
      <div style={{ minHeight: 520, padding: 24, maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>마스터 프로필</h1>
        <p style={{ color: "var(--tx2)" }}>.env 설정 후 이용하세요.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: 520, padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ fontSize: 10, color: "var(--cy)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 10 }}>MASTER</div>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>마스터 프로필</h1>
      <p style={{ color: "var(--tx2)", lineHeight: 1.7, marginBottom: 20, fontSize: 13 }}>
        마켓 카드·클론 페이지에 쓰이는 정보입니다. 저장 후{" "}
        <Link to="/dashboard/create" style={{ color: "var(--cy)" }}>
          클론 만들기
        </Link>
        에서 클론을 활성화하면 마켓에 나옵니다.
      </p>

      {err ? <p style={{ color: "#f66", fontSize: 13, marginBottom: 12 }}>{err}</p> : null}
      {msg ? <p style={{ color: "var(--cy)", fontSize: 13, marginBottom: 12 }}>{msg}</p> : null}

      {loading ? (
        <p style={{ color: "var(--tx3)" }}>불러오는 중…</p>
      ) : (
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {!masterId && <p style={{ fontSize: 12, color: "var(--am)" }}>아직 프로필이 없습니다. 아래 입력 후 저장하면 등록됩니다.</p>}
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--tx3)", marginBottom: 6 }}>이름 (표시명)</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={field} placeholder="홍길동" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--tx3)", marginBottom: 6 }}>한 줄 직함</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={field} placeholder="B2B 영업 코치" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--tx3)", marginBottom: 6 }}>소개 (bio)</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} style={{ ...field, resize: "vertical" }} placeholder="경력·전문 분야" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--tx3)", marginBottom: 6 }}>시그니처 문구</label>
            <input value={signature} onChange={(e) => setSignature(e.target.value)} style={field} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--tx3)", marginBottom: 6 }}>URL slug (영문·숫자·하이픈)</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} style={field} placeholder="hong-gildong" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--tx3)", marginBottom: 6 }}>테마 색</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 48, height: 36, border: "none", cursor: "pointer" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--tx3)", marginBottom: 6 }}>태그 (쉼표 구분)</label>
            <input value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} style={field} placeholder="영업, 협상" />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6 }}>링크 (선택)</div>
          <input value={linkIg} onChange={(e) => setLinkIg(e.target.value)} style={field} placeholder="Instagram @handle" />
          <input value={linkYt} onChange={(e) => setLinkYt(e.target.value)} style={field} placeholder="YouTube URL" />
          <input value={linkFc} onChange={(e) => setLinkFc(e.target.value)} style={field} placeholder="패스트캠퍼스 등" />
          <input value={linkSub} onChange={(e) => setLinkSub(e.target.value)} style={field} placeholder="뉴스레터 URL" />
          <Bt v="pr" type="submit" dis={saving}>
            {saving ? "저장 중…" : masterId ? "프로필 저장" : "마스터로 등록"}
          </Bt>
        </form>
      )}
    </div>
  );
}
