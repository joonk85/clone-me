import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import Bt from "../common/Bt";
import Cd from "../common/Cd";
import LoadingSpinner from "../common/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";
import { useWindowSize } from "../hooks/useWindowSize";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { fetchMyUserRow, updateMyUserRow } from "../lib/supabaseQueries";

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_BUCKET = "avatars";
const BIO_MAX = 500;

function isImageAv(v) {
  return typeof v === "string" && /^https?:\/\//i.test(v.trim());
}

function snapshotFromRow(row, userEmail) {
  return {
    nickname: row?.nickname || "",
    profile_slug: row?.profile_slug || "",
    profile_bio: row?.profile_bio || "",
    avatar_url: row?.avatar_url || "",
    socialYoutube: row?.social_youtube_url || "",
    socialInstagram: row?.social_instagram_url || "",
    socialLinkedin: row?.social_linkedin_url || "",
    socialWebsite: row?.social_website_url || "",
    userEmail,
  };
}

/** Auth User 기준 가입 경로 라벨 (표시만) */
function signupPathLabel(user) {
  if (!user) return "—";
  const id0 = user.identities?.[0];
  const p = id0?.provider || user.app_metadata?.provider;
  if (!p || p === "email") return "이메일";
  const map = {
    google: "Google",
    github: "GitHub",
    apple: "Apple",
    facebook: "Facebook",
    twitter: "Twitter",
    discord: "Discord",
    slack: "Slack",
    linkedin: "LinkedIn",
    azure: "Microsoft",
  };
  return map[p] || String(p).replace(/_/g, " ");
}

function formatJoinedAt(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("ko-KR", { dateStyle: "long", timeStyle: "short" });
  } catch {
    return "—";
  }
}

const roLabel = {
  fontSize: 10,
  fontFamily: "var(--mo)",
  letterSpacing: "0.1em",
  color: "var(--tx3)",
  fontWeight: 700,
  marginBottom: 6,
};

const roValue = {
  fontSize: "var(--fs-body)",
  color: "var(--tx)",
  fontFamily: "var(--fn)",
  wordBreak: "break-all",
};

export default function MyAccountGeneral() {
  const { user, supabaseConfigured } = useAuth();
  const { isMobile } = useWindowSize();
  const refreshSidebar = () => {
    try {
      window.dispatchEvent(new CustomEvent("clone-me-user-profile-changed"));
    } catch {
      /* ignore */
    }
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [baseline, setBaseline] = useState(null);

  const [nickname, setNickname] = useState("");
  const [profileSlug, setProfileSlug] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarBust, setAvatarBust] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [socialYoutube, setSocialYoutube] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialLinkedin, setSocialLinkedin] = useState("");
  const [socialWebsite, setSocialWebsite] = useState("");
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

  const labelMo = {
    display: "block",
    fontSize: 10,
    color: "var(--tx3)",
    marginBottom: 8,
    fontFamily: "var(--mo)",
    letterSpacing: "0.1em",
    fontWeight: 700,
  };

  const applySnapshot = useCallback((s) => {
    if (!s) return;
    setNickname(s.nickname);
    setProfileSlug(s.profile_slug);
    setProfileBio(s.profile_bio);
    setAvatarUrl(s.avatar_url);
    setSocialYoutube(s.socialYoutube);
    setSocialInstagram(s.socialInstagram);
    setSocialLinkedin(s.socialLinkedin);
    setSocialWebsite(s.socialWebsite);
  }, []);

  const restoreBaseline = useCallback(() => {
    setMsg("");
    setErr("");
    applySnapshot(baseline);
  }, [baseline, applySnapshot]);

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
      const snap = snapshotFromRow(row, user.email);
      setBaseline(snap);
      applySnapshot(snap);
    }
  }, [user?.id, user?.email, applySnapshot]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    const slugRaw = profileSlug.trim().toLowerCase().replace(/^@+/, "");
    if (slugRaw && !/^[a-z0-9_]{3,30}$/.test(slugRaw)) {
      setErr("핸들은 3~30자 영문 소문자, 숫자, 밑줄(_)만 사용할 수 있습니다.");
      return;
    }
    if (profileBio.length > BIO_MAX) {
      setErr(`프로필 소개는 ${BIO_MAX}자 이하여야 합니다.`);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user?.id) return;
    setSaving(true);
    const basePatch = {
      nickname: nickname.trim() || null,
      avatar_url: avatarUrl.trim() || null,
      updated_at: new Date().toISOString(),
    };
    const extPatch = {
      profile_slug: slugRaw || null,
      profile_bio: profileBio.trim() || null,
    };
    const socialPatch = {
      social_youtube_url: socialYoutube.trim() || null,
      social_instagram_url: socialInstagram.trim() || null,
      social_linkedin_url: socialLinkedin.trim() || null,
      social_website_url: socialWebsite.trim() || null,
    };
    let { error } = await updateMyUserRow(supabase, user.id, { ...basePatch, ...extPatch, ...socialPatch });
    if (error) {
      ({ error } = await updateMyUserRow(supabase, user.id, { ...basePatch, ...socialPatch }));
      if (!error && (slugRaw || profileBio.trim())) {
        setErr("`docs/supabase/users_profile_slug_bio.sql` 적용 후 핸들·소개를 저장할 수 있습니다. 나머지는 저장되었습니다.");
      }
    }
    if (error) {
      ({ error } = await updateMyUserRow(supabase, user.id, basePatch));
      if (!error) {
        setErr("SNS 컬럼이 없습니다. `docs/supabase/users_member_social_urls.sql` 을 실행하세요.");
      }
    }
    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setMsg("변경 사항을 저장했습니다.");
    const nextSnap = snapshotFromRow(
      {
        nickname: nickname.trim() || null,
        profile_slug: slugRaw || null,
        profile_bio: profileBio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        social_youtube_url: socialYoutube.trim() || null,
        social_instagram_url: socialInstagram.trim() || null,
        social_linkedin_url: socialLinkedin.trim() || null,
        social_website_url: socialWebsite.trim() || null,
      },
      user.email
    );
    setBaseline(nextSnap);
    refreshSidebar();
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
      setErr(`${upErr.message} — Storage: docs/supabase/storage_avatars.sql`);
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
    setMsg("아바타를 업데이트했습니다.");
    setBaseline((prev) =>
      prev
        ? { ...prev, avatar_url: publicUrl }
        : snapshotFromRow(
            {
              nickname,
              profile_slug: profileSlug,
              profile_bio: profileBio,
              avatar_url: publicUrl,
              social_youtube_url: socialYoutube,
              social_instagram_url: socialInstagram,
              social_linkedin_url: socialLinkedin,
              social_website_url: socialWebsite,
            },
            user.email
          )
    );
    refreshSidebar();
  };

  const joinedAt = user?.created_at || null;

  if (!supabaseConfigured) {
    return (
      <Cd style={{ padding: "clamp(24px,5vw,36px)", borderStyle: "dashed" }}>
        <p style={{ color: "var(--tx2)", fontFamily: "var(--fn)" }}>Supabase 설정 후 이용할 수 있습니다.</p>
      </Cd>
    );
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <p style={{ fontSize: "var(--fs-xs)", color: "var(--cy)", fontFamily: "var(--mo)", letterSpacing: "0.12em", fontWeight: 700, marginBottom: 8 }}>GENERAL</p>
      <h1 style={{ fontSize: "var(--fs-h2)", fontWeight: 800, margin: "0 0 8px", fontFamily: "var(--fn-title)", color: "var(--tx)" }}>General Settings</h1>
      <p style={{ color: "var(--tx2)", fontSize: "var(--fs-caption)", marginBottom: 22, lineHeight: 1.65, fontFamily: "var(--fn)" }}>
        플랫폼 전반에 사용되는 기본 정보입니다.
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
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <Cd style={{ padding: "clamp(20px,4vw,28px)", borderColor: "var(--br2)" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 200px) 1fr",
                gap: isMobile ? 24 : 28,
                alignItems: "start",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: isMobile ? "flex-start" : "center", gap: 14 }}>
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "2px solid var(--br2)",
                    background: "var(--sf3)",
                    flexShrink: 0,
                  }}
                >
                  {avatarUrl && isImageAv(avatarUrl) ? (
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
                      —
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: "none" }} onChange={onAvatarFile} />
                <Bt v="pr" type="button" dis={uploading || saving} on={onPickAvatar} style={{ minHeight: "var(--touch-min)", width: isMobile ? "100%" : "auto", justifyContent: "center" }}>
                  {uploading ? "…" : "CHANGE AVATAR"}
                </Bt>
                <span style={{ fontSize: "var(--fs-xs)", color: "var(--tx3)", maxWidth: 200, lineHeight: 1.5, fontFamily: "var(--fn)", textAlign: isMobile ? "left" : "center" }}>
                  JPEG·PNG·WebP·GIF, max 2MB
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
                <div>
                  <label style={labelMo}>DISPLAY NAME</label>
                  <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="표시 이름" style={field} autoComplete="name" />
                </div>
                <div>
                  <label style={labelMo}>UNIQUE HANDLE (@ slug)</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "var(--tx2)", fontFamily: "var(--mo)", fontSize: "var(--fs-body)" }}>@</span>
                    <input
                      value={profileSlug}
                      onChange={(e) => setProfileSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      placeholder="your_handle"
                      style={{ ...field, flex: 1 }}
                      autoComplete="username"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: isMobile ? 8 : 4, paddingTop: 22, borderTop: "1px solid var(--br)" }}>
              <label style={labelMo}>PROFILE BIO</label>
              <textarea
                value={profileBio}
                onChange={(e) => setProfileBio(e.target.value.slice(0, BIO_MAX))}
                placeholder="짧은 소개를 입력하세요."
                rows={5}
                style={{ ...field, resize: "vertical", minHeight: 120 }}
              />
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--tx3)", fontFamily: "var(--mo)", marginTop: 8, textAlign: "right" }}>
                {profileBio.length} / {BIO_MAX} characters
              </div>
            </div>
          </Cd>

          <Cd style={{ padding: "clamp(18px,3vw,24px)", borderColor: "var(--br2)", background: "var(--sf2)" }}>
            <div style={{ ...roLabel, marginBottom: 14 }}>ACCOUNT INFO</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "18px 24px" }}>
              <div>
                <div style={roLabel}>이메일</div>
                <div style={roValue}>{user?.email || "—"}</div>
                <p style={{ fontSize: "var(--fs-xs)", color: "var(--tx3)", marginTop: 8, fontFamily: "var(--fn)", lineHeight: 1.5 }}>
                  수정은{" "}
                  <Link to="/my/security" style={{ color: "var(--cy)", fontWeight: 700 }}>
                    Security
                  </Link>
                  에서 진행할 수 있습니다.
                </p>
              </div>
              <div>
                <div style={roLabel}>가입일</div>
                <div style={roValue}>{formatJoinedAt(joinedAt)}</div>
              </div>
              <div>
                <div style={roLabel}>가입 경로</div>
                <div style={roValue}>{signupPathLabel(user)}</div>
              </div>
              <div>
                <div style={roLabel}>계정 ID</div>
                <div style={{ ...roValue, fontFamily: "var(--mo)", fontSize: "var(--fs-caption)" }}>{user?.id || "—"}</div>
              </div>
            </div>
          </Cd>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              paddingTop: 8,
            }}
          >
            <button
              type="button"
              onClick={restoreBaseline}
              disabled={saving}
              style={{
                padding: 0,
                border: "none",
                background: "none",
                color: "var(--cy)",
                fontFamily: "var(--fn)",
                fontSize: "var(--fs-caption)",
                fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.45 : 1,
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              Reset to Defaults
            </button>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginLeft: "auto" }}>
              <Bt v="gh" type="button" on={restoreBaseline} dis={saving} style={{ minHeight: "var(--touch-min)" }}>
                Cancel
              </Bt>
              <Bt v="pr" type="submit" dis={saving || uploading} style={{ minHeight: "var(--touch-min)" }}>
                {saving ? "Saving…" : "Save Changes"}
              </Bt>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
