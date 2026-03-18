import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";

import Bt from "../common/Bt";
import { useAuth } from "../contexts/AuthContext";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { fetchMyUserRow, updateMyUserRow } from "../lib/supabaseQueries";

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_BUCKET = "avatars";

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

export default function MemberProfile() {
  const { user, supabaseConfigured } = useAuth();
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
    return <p style={{ color: "var(--tx2)" }}>Supabase 설정 후 이용할 수 있습니다.</p>;
  }

  return (
    <div>
      <p style={{ fontSize: 10, color: "var(--cy)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 8 }}>PROFILE</p>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>프로필</h2>
      <p style={{ color: "var(--tx2)", fontSize: 13, marginBottom: 20 }}>
        프로필 사진은 Supabase Storage에 올리거나, 아래에 URL을 직접 넣을 수 있어요.{" "}
        <Link to="/my/settings" style={{ color: "var(--cy)" }}>
          알림·계정 설정
        </Link>
      </p>
      {err ? <p style={{ color: "#f66", fontSize: 13, marginBottom: 12 }}>{err}</p> : null}
      {msg ? <p style={{ color: "var(--cy)", fontSize: 13, marginBottom: 12 }}>{msg}</p> : null}
      {loading ? (
        <p style={{ color: "var(--tx3)" }}>불러오는 중…</p>
      ) : (
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 520 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--tx3)", marginBottom: 8 }}>프로필 사진</label>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2px solid var(--br2)",
                  background: "var(--sf2)",
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
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--tx3)", fontSize: 12 }}>
                    없음
                  </div>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: "none" }} onChange={onAvatarFile} />
                <Bt v="pr" type="button" dis={uploading} on={onPickAvatar}>
                  {uploading ? "업로드 중…" : "사진 올리기"}
                </Bt>
                <span style={{ fontSize: 11, color: "var(--tx3)", maxWidth: 280, lineHeight: 1.4 }}>
                  JPEG·PNG·WebP·GIF, 최대 2MB. 버킷 <code style={{ fontSize: 10 }}>avatars</code> 필요.
                </span>
              </div>
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--tx3)", marginBottom: 6 }}>이미지 URL (선택)</label>
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://… (외부 URL)"
              style={field}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--tx3)", marginBottom: 6 }}>닉네임</label>
            <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="표시 이름" style={field} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--tx3)", marginBottom: 6 }}>관심사 (쉼표)</label>
            <input value={interestsStr} onChange={(e) => setInterestsStr(e.target.value)} placeholder="영업, 마케팅" style={field} />
          </div>
          <Bt v="pr" type="submit" dis={saving}>
            {saving ? "저장 중…" : "저장"}
          </Bt>
        </form>
      )}
    </div>
  );
}
