import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Bt from "../common/Bt";
import Cd from "../common/Cd";
import LoadingSpinner from "../common/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";
import { useWindowSize } from "../hooks/useWindowSize";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { fetchMasterForUser, insertMaster, updateMaster } from "../lib/supabaseQueries";

export default function MasterTab() {
  const { user, supabaseConfigured } = useAuth();
  const { isMobile } = useWindowSize();
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

  const field = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid var(--br)",
    borderRadius: "var(--r-md)",
    background: "var(--sf2)",
    color: "var(--tx)",
    fontSize: isMobile ? "var(--fs-input-mobile)" : "var(--fs-body)",
    outline: "none",
    fontFamily: "var(--fn)",
  };

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
      <Cd style={{ padding: "clamp(24px,5vw,36px)", textAlign: "center", borderStyle: "dashed", maxWidth: 560 }}>
        <h2 style={{ fontSize: "var(--fs-h2)", fontWeight: 800, color: "var(--tx)", fontFamily: "var(--fn)", marginBottom: 10 }}>마스터 프로필</h2>
        <p style={{ color: "var(--tx2)", fontSize: "var(--fs-body)", fontFamily: "var(--fn)" }}>.env 설정 후 이용하세요.</p>
      </Cd>
    );
  }

  return (
    <div>
      <p
        style={{
          fontSize: "var(--fs-xs)",
          color: "var(--cy)",
          fontFamily: "var(--mo)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        Master
      </p>
      <h2 style={{ fontSize: "var(--fs-h1-mobile)", fontWeight: 800, marginBottom: 10, color: "var(--tx)", fontFamily: "var(--fn)", letterSpacing: "-0.02em" }}>
        마스터 프로필
      </h2>
      <p style={{ color: "var(--tx2)", lineHeight: 1.7, marginBottom: 22, fontSize: "var(--fs-caption)", maxWidth: 560, fontFamily: "var(--fn)" }}>
        마켓·클론 카드에 노출되는 정보입니다. 저장 후{" "}
        <Link to="/dashboard/create" style={{ color: "var(--cy)", fontWeight: 600 }}>
          클론 만들기
        </Link>
        {" · "}
        <Link to="/my/master/clones" style={{ color: "var(--cy)", fontWeight: 600 }}>
          내 클론
        </Link>
      </p>

      {err ? (
        <Cd style={{ padding: "12px 16px", marginBottom: 16, borderColor: "var(--err-border)", background: "var(--err-surface)" }}>
          <p style={{ color: "var(--rd)", fontSize: "var(--fs-caption)", fontFamily: "var(--fn)" }}>{err}</p>
        </Cd>
      ) : null}
      {msg ? (
        <Cd style={{ padding: "12px 16px", marginBottom: 16, borderColor: "var(--br2)", background: "var(--cyd)" }}>
          <p style={{ color: "var(--cy)", fontSize: "var(--fs-caption)", fontWeight: 600, fontFamily: "var(--fn)" }}>{msg}</p>
        </Cd>
      ) : null}

      {loading ? (
        <Cd style={{ padding: 48, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <LoadingSpinner size={22} />
          <p style={{ color: "var(--tx3)", fontSize: "var(--fs-caption)", fontFamily: "var(--mo)" }}>불러오는 중…</p>
        </Cd>
      ) : (
        <Cd style={{ padding: "clamp(20px,4vw,28px)", maxWidth: 640, borderColor: "var(--br2)" }}>
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {!masterId && (
              <Cd style={{ padding: "12px 14px", borderColor: "var(--am-line)", background: "var(--am-muted)" }}>
                <p style={{ fontSize: "var(--fs-caption)", color: "var(--am)", fontFamily: "var(--fn)", lineHeight: 1.55 }}>
                  아직 프로필이 없습니다. 입력 후 저장하면 마스터로 등록됩니다.
                </p>
              </Cd>
            )}
            <div>
              <label style={{ display: "block", fontSize: "var(--fs-sm)", color: "var(--tx3)", marginBottom: 8, fontFamily: "var(--mo)" }}>이름 (표시명)</label>
              <input value={name} onChange={(e) => setName(e.target.value)} style={field} placeholder="홍길동" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "var(--fs-sm)", color: "var(--tx3)", marginBottom: 8, fontFamily: "var(--mo)" }}>한 줄 직함</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} style={field} placeholder="B2B 영업 코치" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "var(--fs-sm)", color: "var(--tx3)", marginBottom: 8, fontFamily: "var(--mo)" }}>소개 (bio)</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} style={{ ...field, resize: "vertical" }} placeholder="경력·전문 분야" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "var(--fs-sm)", color: "var(--tx3)", marginBottom: 8, fontFamily: "var(--mo)" }}>시그니처 문구</label>
              <input value={signature} onChange={(e) => setSignature(e.target.value)} style={field} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "var(--fs-sm)", color: "var(--tx3)", marginBottom: 8, fontFamily: "var(--mo)" }}>URL slug (영문·숫자·하이픈)</label>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} style={field} placeholder="hong-gildong" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "var(--fs-sm)", color: "var(--tx3)", marginBottom: 8, fontFamily: "var(--mo)" }}>테마 색</label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 52, height: 40, border: "1px solid var(--br)", borderRadius: "var(--r-md)", cursor: "pointer", background: "var(--sf2)" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "var(--fs-sm)", color: "var(--tx3)", marginBottom: 8, fontFamily: "var(--mo)" }}>태그 (쉼표)</label>
              <input value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} style={field} placeholder="영업, 협상" />
            </div>
            <p style={{ fontSize: "var(--fs-caption)", fontWeight: 700, color: "var(--tx)", fontFamily: "var(--fn)", marginTop: 4 }}>링크 (선택)</p>
            <input value={linkIg} onChange={(e) => setLinkIg(e.target.value)} style={field} placeholder="Instagram @handle" />
            <input value={linkYt} onChange={(e) => setLinkYt(e.target.value)} style={field} placeholder="YouTube URL" />
            <input value={linkFc} onChange={(e) => setLinkFc(e.target.value)} style={field} placeholder="패스트캠퍼스 등" />
            <input value={linkSub} onChange={(e) => setLinkSub(e.target.value)} style={field} placeholder="뉴스레터 URL" />
            <Bt v="pr" type="submit" dis={saving}>
              {saving ? "저장 중…" : masterId ? "프로필 저장" : "마스터로 등록"}
            </Bt>
          </form>
        </Cd>
      )}
    </div>
  );
}
