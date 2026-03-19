import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Av from "../common/Av";
import Bt from "../common/Bt";
import { ErrorBanner } from "../common/UiStates";
import { useAuth } from "../contexts/AuthContext";
import { useAppState } from "../contexts/AppStateContext";
import { getSupabaseBrowserClient } from "../lib/supabase";
import { fetchMasterForUser, insertMaster, updateMyUserRow } from "../lib/supabaseQueries";

const COLOR_PRESETS = ["#63d9ff", "#c4b5fd", "#4fffb0", "#ffb347", "#ff4f6d", "#ffc832", "#b794ff", "#e8e8f0"];

function slugify(name) {
  const s = (name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return s || "clone";
}

export default function MasterRegister() {
  const navigate = useNavigate();
  const { user, supabaseConfigured } = useAuth();
  const { addMyClone, setActiveMyClone } = useAppState();
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#63d9ff");

  const checkExisting = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user?.id) {
      setChecking(false);
      return;
    }
    const { row } = await fetchMasterForUser(supabase);
    setChecking(false);
    if (row) {
      navigate("/dashboard/create", { replace: true });
    }
  }, [user?.id, navigate]);

  useEffect(() => {
    checkExisting();
  }, [checkExisting]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    const cloneName = name.trim() || "내 클론";
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user?.id) return;

    setBusy(true);
    let master = null;
    const baseSlug = slugify(cloneName);
    for (let i = 0; i < 3; i++) {
      const slug = i === 0 ? baseSlug : `${baseSlug}-${Date.now().toString(36).slice(-6)}`;
      const { row: inserted, error } = await insertMaster(supabase, {
        user_id: user.id,
        name: cloneName,
        title: description.trim() || null,
        slug,
        color,
        links: {},
        status: "active",
      });
      if (error) {
        if ((error.message || "").includes("unique") || error.code === "23505") {
          continue;
        }
        setBusy(false);
        setErr(error.message || "마스터 등록에 실패했습니다.");
        return;
      }
      master = inserted;
      const { error: uErr } = await updateMyUserRow(supabase, user.id, {
        role: "master",
        has_master_profile: true,
        updated_at: new Date().toISOString(),
      });
      if (uErr) {
        setBusy(false);
        setErr("마스터는 생성되었으나 계정 갱신에 실패했습니다.");
        return;
      }
      break;
    }
    if (!master) {
      setBusy(false);
      setErr("slug 생성에 실패했습니다. 이름을 바꿔 주세요.");
      return;
    }

    const ctx = `You are ${cloneName}'s AI clone. ${description.trim() || ""}. Speak Korean.`;
    const { data: cloneData, error: cloneErr } = await supabase
      .from("clones")
      .insert({
        master_id: master.id,
        name: cloneName,
        subtitle: description.trim() || null,
        color,
        av: cloneName.charAt(0) || "?",
        token_price: 1,
        is_anonymous: false,
        mkt_freq: "medium",
        ctx_prompt: ctx,
        welcome_msg: null,
        is_active: false,
        version: "v1",
        quality_no_answer: true,
        quality_tone_style: true,
        quality_citation: true,
      })
      .select("id")
      .single();

    setBusy(false);
    if (cloneErr) {
      setErr(cloneErr.message || "클론 생성에 실패했습니다.");
      return;
    }

    const appClone = {
      id: cloneData.id,
      name: cloneName,
      subtitle: description.trim() || "클론",
      price: 0,
      token_price: 1,
      discount: 0,
      discountEnd: "",
      active: false,
      subs: 0,
      docs: 0,
      v: "v1",
      color,
      av: cloneName.charAt(0) || "?",
      quality: { noAnswer: true, toneStyle: true, citation: true },
      mktLinks: [],
      updates: [],
      notices: [],
      files: [],
      trainingStatus: "idle",
      isAnon: false,
      surveyQuestions: [],
      mktFreq: "medium",
      ctx,
    };
    addMyClone(appClone);
    setActiveMyClone(appClone);
    navigate(`/dashboard/${cloneData.id}`, { replace: true });
  };

  if (!supabaseConfigured) {
    return (
      <div style={{ minHeight: 400, padding: 24, maxWidth: 520, margin: "0 auto" }}>
        <p style={{ color: "var(--tx2)" }}>Supabase 설정 후 이용할 수 있습니다.</p>
      </div>
    );
  }

  if (checking) {
    return (
      <div style={{ minHeight: 400, padding: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--tx3)" }}>확인 중…</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: 520, padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <div style={{ fontSize: 10, color: "var(--cy)", fontFamily: "var(--mo)", letterSpacing: "0.08em", marginBottom: 10 }}>
        클론 만들기
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>첫 클론을 만드세요</h1>
      <p style={{ color: "var(--tx2)", lineHeight: 1.6, marginBottom: 24, fontSize: 14 }}>
        이름·설명·컬러만 입력하면 바로 대시보드로 이동합니다. 자료 업로드와 인증은 나중에 마이페이지에서 할 수 있어요.
      </p>

      {err ? <ErrorBanner style={{ marginBottom: 16 }}>{err}</ErrorBanner> : null}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "var(--tx3)", marginBottom: 6 }}>클론 이름 *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 영업 코칭 클론"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid var(--br)",
              borderRadius: 8,
              background: "var(--sf2)",
              color: "var(--tx)",
              fontSize: 14,
              outline: "none",
              fontFamily: "var(--fn)",
            }}
            required
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "var(--tx3)", marginBottom: 6 }}>한 줄 설명 (선택)</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="예: B2B 영업 핵심 전략"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid var(--br)",
              borderRadius: 8,
              background: "var(--sf2)",
              color: "var(--tx)",
              fontSize: 14,
              outline: "none",
              fontFamily: "var(--fn)",
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "var(--tx3)", marginBottom: 8 }}>테마 컬러</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`색 ${c}`}
                onClick={() => setColor(c)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: c,
                  border: color === c ? "3px solid var(--tx)" : "2px solid var(--br)",
                  cursor: "pointer",
                  boxShadow: color === c ? `0 0 12px ${c}88` : "none",
                }}
              />
            ))}
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--tx2)", cursor: "pointer" }}>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ width: 36, height: 32, border: "none", cursor: "pointer", borderRadius: 6 }}
              />
              <span style={{ fontFamily: "var(--mo)" }}>{color}</span>
            </label>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
            <Av char={name.trim()[0] || "?"} color={color} size={44} />
            <span style={{ fontSize: 12, color: "var(--tx3)" }}>미리보기</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
          <Bt v="pr" type="submit" dis={busy || !name.trim()}>
            {busy ? "만드는 중…" : "만들고 대시보드로 이동"}
          </Bt>
          <Link to="/my/become-master" style={{ alignSelf: "center", fontSize: 14, color: "var(--tx2)" }}>
            취소
          </Link>
        </div>
      </form>
    </div>
  );
}
