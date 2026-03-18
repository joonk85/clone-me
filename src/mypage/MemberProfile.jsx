import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";

import Bt from "../common/Bt";
import Cd from "../common/Cd";
import LoadingSpinner from "../common/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";
import { useWindowSize } from "../hooks/useWindowSize";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { fetchMyUserRow, updateMyUserRow } from "../lib/supabaseQueries";

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_BUCKET = "avatars";

export default function MemberProfile() {
  const { user, supabaseConfigured } = useAuth();
  const { isMobile } = useWindowSize();
  const ctx = useOutletContext() || {};
  const refreshHeader = ctx.refreshHeader || (() => {});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [nickname, setNickname] = useState("");
  const [interestsStr, setInterestsStr] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarBust, setAvatarBust] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

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
    let { row, error } = await fetchMyUserRow(supabase);
    if (!row && !error && user?.email) {
      await supabase.from("users").insert({ id: user.id, email: user.email });
      const again = await fetchMyUserRow(supabase);
      row = again.row;
      error = again.error;
    }
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    if (row) {
      setNickname(row.nickname || "");
      setInterestsStr(Array.isArray(row.interests) ? row.interests.join(", ") : "");
      setAvatarUrl(row.avatar_url || "");
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user?.id) return;
    const interests = interestsStr
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean);
    setSaving(true);
    const { error } = await updateMyUserRow(supabase, user.id, {
      nickname: nickname.trim() || null,
      interests: interests.length ? interests : null,
      avatar_url: avatarUrl.trim() || null,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setMsg("저장했습니다.");
    refreshHeader();
  };

  const onPickAvatar = () => fileRef.current?.click();

  const onAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user?.id) return;
    setErr("");
    setMsg("");
    if (!file.type.startsWith("image/")) {
      setErr("이미지 파일(JPEG, PNG, WebP, GIF)만 올릴 수 있습니다.");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setErr("파일 크기는 2MB 이하여야 합니다.");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const raw = (file.name.split(".").pop() || "jpg").toLowerCase();
    const ext = ["jpg", "jpeg", "png", "webp", "gif"].includes(raw) ? (raw === "jpeg" ? "jpg" : raw) : "jpg";
    const path = `${user.id}/profile.${ext}`;
    setUploading(true);
    const { error: upErr } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
      upsert: true,
      cacheControl: "3600",
      contentType: file.type || `image/${ext === "jpg" ? "jpeg" : ext}`,
    });
    if (upErr) {
      setUploading(false);
      setErr(
        `${upErr.message} — Storage 버킷·정책: docs/supabase/storage_avatars.sql 을 Supabase에서 실행했는지 확인하세요.`
      );
      return;
    }
    const { data: pub } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    const publicUrl = pub?.publicUrl || "";
    if (!publicUrl) {
      setUploading(false);
      setErr("공개 URL을 가져오지 못했습니다.");
      return;
    }
    const { error: dbErr } = await updateMyUserRow(supabase, user.id, {
      avatar_url: publicUrl,
      updated_at: new Date().toISOString(),
    });
    setUploading(false);
    if (dbErr) {
      setErr(dbErr.message);
      return;
    }
    setAvatarUrl(publicUrl);
    setAvatarBust(Date.now());
    setMsg("프로필 사진을 저장했습니다.");
    refreshHeader();
  };

  if (!supabaseConfigured) {
    return (
      <Cd style={{ padding: "clamp(24px,5vw,36px)", textAlign: "center", borderStyle: "dashed" }}>
        <p style={{ color: "var(--tx2)", fontSize: "var(--fs-body)", fontFamily: "var(--fn)" }}>Supabase 설정 후 이용할 수 있습니다.</p>
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
        Profile
      </p>
      <h2 style={{ fontSize: "var(--fs-h1-mobile)", fontWeight: 800, marginBottom: 8, color: "var(--tx)", fontFamily: "var(--fn)", letterSpacing: "-0.02em" }}>
        프로필
      </h2>
      <p style={{ color: "var(--tx2)", fontSize: "var(--fs-caption)", marginBottom: 22, lineHeight: 1.65, fontFamily: "var(--fn)", maxWidth: 520 }}>
        사진은 Storage 업로드 또는 URL로 넣을 수 있어요.{" "}
        <Link to="/my/settings" style={{ color: "var(--cy)", fontWeight: 600 }}>
          알림·계정 설정
        </Link>
      </p>

      {err ? (
        <Cd style={{ padding: "12px 16px", marginBottom: 16, borderColor: "var(--err-border)", background: "var(--err-surface)" }}>
          <p style={{ color: "var(--rd)", fontSize: "var(--fs-caption)", fontFamily: "var(--fn)" }}>{err}</p>
        </Cd>
      ) : null}
      {msg ? (
        <Cd style={{ padding: "12px 16px", marginBottom: 16, borderColor: "var(--br2)", background: "var(--cyd)" }}>
          <p style={{ color: "var(--cy)", fontSize: "var(--fs-caption)", fontFamily: "var(--fn)", fontWeight: 600 }}>{msg}</p>
        </Cd>
      ) : null}

      {loading ? (
        <Cd style={{ padding: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <LoadingSpinner size={22} />
          <p style={{ color: "var(--tx3)", fontSize: "var(--fs-caption)", fontFamily: "var(--mo)" }}>불러오는 중…</p>
        </Cd>
      ) : (
        <Cd style={{ padding: "clamp(20px,4vw,28px)", maxWidth: 540, borderColor: "var(--br2)" }}>
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={{ display: "block", fontSize: "var(--fs-sm)", color: "var(--tx3)", marginBottom: 10, fontFamily: "var(--mo)" }}>프로필 사진</label>
              <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
                <div
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "2px solid var(--br2)",
                    background: "var(--sf3)",
                    flexShrink: 0,
                  }}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarBust ? `${avatarUrl}${avatarUrl.includes("?") ? "&" : "?"}v=${avatarBust}` : avatarUrl}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--tx3)",
                        fontSize: "var(--fs-caption)",
                        fontFamily: "var(--fn)",
                      }}
                    >
                      없음
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: "none" }} onChange={onAvatarFile} />
                  <Bt v="pr" type="button" dis={uploading} on={onPickAvatar}>
                    {uploading ? "업로드 중…" : "사진 올리기"}
                  </Bt>
                  <span style={{ fontSize: "var(--fs-xs)", color: "var(--tx3)", maxWidth: 280, lineHeight: 1.5, fontFamily: "var(--fn)" }}>
                    JPEG·PNG·WebP·GIF, 최대 2MB. 버킷 <code style={{ fontSize: 10, fontFamily: "var(--mo)" }}>avatars</code>
                  </span>
                </div>
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "var(--fs-sm)", color: "var(--tx3)", marginBottom: 8, fontFamily: "var(--mo)" }}>이미지 URL (선택)</label>
              <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" style={field} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "var(--fs-sm)", color: "var(--tx3)", marginBottom: 8, fontFamily: "var(--mo)" }}>닉네임</label>
              <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="표시 이름" style={field} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "var(--fs-sm)", color: "var(--tx3)", marginBottom: 8, fontFamily: "var(--mo)" }}>관심사 (쉼표)</label>
              <input value={interestsStr} onChange={(e) => setInterestsStr(e.target.value)} placeholder="영업, 마케팅" style={field} />
            </div>
            <Bt v="pr" type="submit" dis={saving}>
              {saving ? "저장 중…" : "저장"}
            </Bt>
          </form>
        </Cd>
      )}
    </div>
  );
}
