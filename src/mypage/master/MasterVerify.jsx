import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckBadgeIcon, CheckCircleIcon, HandRaisedIcon } from "@heroicons/react/24/outline";

import Bt from "../../common/Bt";
import { ErrorBanner } from "../../common/UiStates";
import MasterBadges from "../../common/MasterBadges";
import { useAuth } from "../../contexts/AuthContext";
import { getSupabaseBrowserClient } from "../../lib/supabase";
import { fetchMasterForUser } from "../../lib/supabaseQueries";

const BUCKET = "master-verifications";
const MAX_BYTES = 5 * 1024 * 1024;

const TYPE_OPTS = [
  { value: "career", label: "경력·이력 증빙", hint: "경력기술서, 이력서, 포트폴리오 등" },
  { value: "certificate", label: "자격·수료 증빙", hint: "자격증, 수료증 스캔 등" },
];

function typeKo(t) {
  const m = { career: "경력", certificate: "자격", identity: "신원", education: "학력" };
  return m[t] || t;
}

export default function MasterVerify() {
  const { user, supabaseConfigured } = useAuth();
  const navigate = useNavigate();
  const [master, setMaster] = useState(null);
  const [verifs, setVerifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vType, setVType] = useState("career");
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user?.id) {
      setLoading(false);
      return;
    }
    const { row: m } = await fetchMasterForUser(supabase);
    if (!m) {
      setMaster(null);
      setLoading(false);
      return;
    }
    setMaster(m);
    const { data } = await supabase.from("master_verifications").select("id, type, status, created_at").eq("master_id", m.id).order("created_at", { ascending: false });
    setVerifs(data || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmitFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !master?.id) return;
    setErr("");
    setOk("");
    const okMime =
      file.type === "application/pdf" ||
      file.type === "image/jpeg" ||
      file.type === "image/png" ||
      file.type === "image/webp";
    if (!okMime) {
      setErr("PDF 또는 이미지(JPEG, PNG, WebP)만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setErr("파일은 5MB 이하여야 합니다.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const ext = file.type === "application/pdf" ? "pdf" : file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg";
    const path = `${master.id}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

    setUploading(true);
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
      upsert: false,
      contentType: file.type,
    });
    if (upErr) {
      setUploading(false);
      setErr(
        `${upErr.message} — 버킷·정책: docs/supabase/storage_master_verifications.sql 실행 여부를 확인하세요.`
      );
      return;
    }

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const fileUrl = pub?.publicUrl || "";
    if (!fileUrl) {
      setUploading(false);
      setErr("파일 URL을 가져오지 못했습니다.");
      return;
    }

    const { error: insErr } = await supabase.from("master_verifications").insert({
      master_id: master.id,
      type: vType,
      file_url: fileUrl,
      status: "approved",
    });

    setUploading(false);
    if (insErr) {
      setErr(insErr.message);
      return;
    }

    const { data: m2 } = await supabase.from("masters").select("is_verified, verification_level").eq("id", master.id).maybeSingle();
    setMaster((prev) => (prev ? { ...prev, is_verified: !!m2?.is_verified, verification_level: m2?.verification_level ?? prev.verification_level } : prev));
    await load();

    if (m2?.is_verified) {
      setOk("제출이 반영되었습니다. 인증 마스터 검증 배지가 켜졌습니다. 마켓·프로필에 반영되려면 목록을 새로고침하세요.");
    } else {
      setOk(
        "증빙은 저장되었습니다. 검증 배지가 켜지지 않았다면 Supabase에서 docs/supabase/trigger_master_verification_auto_verify.sql 을 실행했는지 확인하세요."
      );
    }
    window.dispatchEvent(new CustomEvent("clone-me-master-profile-changed"));
  };

  if (!supabaseConfigured) {
    return <p style={{ color: "var(--tx2)" }}>Supabase 설정 후 이용할 수 있습니다.</p>;
  }
  if (loading) {
    return <p style={{ color: "var(--tx3)" }}>불러오는 중…</p>;
  }
  if (!master) {
    return (
      <div>
        <p style={{ color: "var(--tx2)", marginBottom: 16 }}>먼저 마스터 프로필을 등록하세요.</p>
        <Bt v="pr" on={() => navigate("/my/master/profile")}>
          프로필 작성
        </Bt>
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontSize: 10, color: "var(--gn)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 8 }}>VERIFY</p>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>인증 배지</h2>

      <div style={{ marginBottom: 20, padding: 14, borderRadius: 12, border: "1px solid var(--br)", background: "var(--sf2)" }}>
        <div style={{ fontSize: 11, color: "var(--tx3)", marginBottom: 8, fontFamily: "var(--mo)" }}>마켓·프로필에 보이는 배지</div>
        <MasterBadges verified={master.is_verified} affiliate={!!master.is_affiliate} size="md" />
        {!master.is_verified && !master.is_affiliate && (
          <p style={{ fontSize: 12, color: "var(--tx2)", marginTop: 10, marginBottom: 0 }}>아직 노출 중인 배지가 없습니다.</p>
        )}
        <div style={{ marginTop: 14, fontSize: 11, color: "var(--tx3)", lineHeight: 1.65 }}>
          <strong style={{ color: "var(--tx2)", display: "inline-flex", alignItems: "center", gap: 4 }}>
            <CheckBadgeIcon style={{ width: 16, height: 16 }} />
            검증
          </strong> — 경력/자격 증빙 제출 시 자동 ·{" "}
          <strong style={{ color: "var(--tx2)", display: "inline-flex", alignItems: "center", gap: 4 }}>
            <HandRaisedIcon style={{ width: 16, height: 16 }} />
            제휴
          </strong> — 운영자가 DB에서 부여 (
          <code style={{ fontSize: 10 }}>masters.is_affiliate = true</code>)
        </div>
      </div>

      <div
        style={{
          padding: 20,
          borderRadius: 12,
          border: master.is_verified ? "1px solid rgba(79,255,176,0.35)" : "1px solid var(--br)",
          background: master.is_verified ? "rgba(79,255,176,0.06)" : "var(--sf2)",
          marginBottom: 24,
        }}
      >
        {master.is_verified ? (
          <>
            <div style={{ marginBottom: 8 }}><CheckCircleIcon style={{ width: 24, height: 24, color: "var(--gn)" }} /></div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--gn)" }}>인증 마스터</div>
            <p style={{ fontSize: 13, color: "var(--tx2)", marginTop: 8, lineHeight: 1.6 }}>
              마켓·클론 카드에 검증 배지가 표시됩니다. 추가 서류는 아래에서 계속 제출할 수 있습니다.
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--tx)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            이력·자격 증빙 제출 → 즉시 검증
          </div>
            <p style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.6 }}>
              PDF 또는 이미지를 올리면 <strong style={{ color: "var(--gn)" }}>자동 승인</strong>되어 인증 배지가 켜집니다. (DB 트리거 적용 필요)
            </p>
          </>
        )}
      </div>

      {err ? <ErrorBanner style={{ marginBottom: 12 }}>{err}</ErrorBanner> : null}
      {ok ? <p style={{ color: "var(--gn)", fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>{ok}</p> : null}

      <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, border: "1px solid var(--br)", background: "var(--sf)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>증빙 종류</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {TYPE_OPTS.map((o) => (
            <label key={o.value} style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", fontSize: 13 }}>
              <input type="radio" name="vtype" checked={vType === o.value} onChange={() => setVType(o.value)} />
              <span>
                <strong>{o.label}</strong>
                <span style={{ color: "var(--tx3)", display: "block", fontSize: 11, marginTop: 2 }}>{o.hint}</span>
              </span>
            </label>
          ))}
        </div>
        <input ref={fileRef} type="file" accept=".pdf,application/pdf,image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={onSubmitFile} />
        <Bt v="pr" type="button" dis={uploading} on={() => fileRef.current?.click()} style={{ marginTop: 16 }}>
          {uploading ? "업로드 중…" : "파일 선택 후 제출"}
        </Bt>
        <p style={{ fontSize: 11, color: "var(--tx3)", marginTop: 10, lineHeight: 1.4 }}>
          SQL: <code style={{ fontSize: 10 }}>storage_master_verifications.sql</code> +{" "}
          <code style={{ fontSize: 10 }}>trigger_master_verification_auto_verify.sql</code>
        </p>
      </div>

      {verifs.length > 0 && (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>제출 내역</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13, color: "var(--tx2)" }}>
            {verifs.map((v) => (
              <li key={v.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--br)" }}>
                <span style={{ color: "var(--tx)" }}>{typeKo(v.type)}</span> · {v.status} ·{" "}
                {new Date(v.created_at).toLocaleString("ko-KR")}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
