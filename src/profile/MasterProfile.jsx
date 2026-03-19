import { useState } from "react";
import {
  AcademicCapIcon,
  CameraIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  HandRaisedIcon,
  PlayIcon,
  HandThumbUpIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

import Av from "../common/Av";
import MasterBadges from "../common/MasterBadges";
import Bt from "../common/Bt";
import Cd from "../common/Cd";
import Tg from "../common/Tg";

// 마켓 클론 상세 — 소개·샘플 Q&A·강의·업데이트·피드백 탭. 구독/대화 CTA.

export default function MasterProfile({ clone, onBack, onSubscribe, subscribed, setActiveClone, setView }) {
  const [tab, setTab] = useState("demo");
  const [fbRating, setFbRating] = useState(0);
  const [fbText, setFbText] = useState("");
  const [fbDone, setFbDone] = useState(false);
  const isSub = subscribed.includes(clone.id);

  const publicFeedbacks = [
    { id: "pf1", rating: 5, msg: "콜드콜 스크립트 덕분에 첫 주에 계약 2건 성사했습니다. 실전에서 바로 쓸 수 있는 내용이에요.", date: "2025.01.14", helpful: 24 },
    { id: "pf2", rating: 4, msg: "전반적으로 유용합니다. B2B SaaS 케이스가 더 있으면 좋겠어요.", date: "2025.01.12", helpful: 11 },
    { id: "pf3", rating: 5, msg: "협상 프레임워크 알려준 덕에 계약 성사율이 확 올랐어요. 강추!", date: "2025.01.10", helpful: 18 },
    { id: "pf4", rating: 3, msg: "답변이 가끔 교과서적입니다. 더 실전 감각이 있었으면 해요.", date: "2025.01.08", helpful: 6 },
    { id: "pf5", rating: 5, msg: "매일 아침 출근길에 질문하는 습관이 생겼습니다. 최고예요!", date: "2025.01.06", helpful: 31 },
  ];
  const avgRating = (publicFeedbacks.reduce((s, f) => s + f.rating, 0) / publicFeedbacks.length).toFixed(1);
  const dist = [5, 4, 3, 2, 1].map((r) => ({ r, n: publicFeedbacks.filter((f) => f.rating === r).length }));

  return (
    <div style={{ minHeight: 600, padding: "18px 18px 40px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <button type="button" onClick={onBack} style={{ background: "none", border: "none", color: "var(--tx2)", cursor: "pointer", fontSize: 12, marginBottom: 14, fontFamily: "var(--fn)", display: "flex", alignItems: "center", gap: 5 }}>
          ← 마켓으로
        </button>
        <Cd style={{ padding: "20px 22px 16px", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{ position: "relative" }}>
              <Av char={clone.av} color={clone.color} size={60} />
              {clone.featured && (
              <div style={{ position: "absolute", top: -3, right: -3, width: 16, height: 16, borderRadius: "50%", background: "var(--go)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <StarIconSolid style={{ width: 16, height: 16, color: "var(--on-cy)" }} />
              </div>
            )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 3 }}>
                <span style={{ fontSize: 19, fontWeight: 800 }}>{clone.name}</span>
                <MasterBadges verified={clone.masterVerified ?? clone.featured} affiliate={clone.masterAffiliate ?? clone.isAffiliate} size="md" />
              </div>
              <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 7 }}>{clone.title}</div>
              <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--tx3)", fontFamily: "var(--mo)" }}>
                <span style={{ color: "var(--go)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <StarIconSolid style={{ width: 16, height: 16 }} />
                {clone.rating}
              </span>
                <span>{clone.subs.toLocaleString()} 구독자</span>
                <span>{clone.docs}개 문서</span>
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: clone.color }}>{clone.priceLabel || `₩${Number(clone.price).toLocaleString()}`}</div>
              <div style={{ fontSize: 10, color: "var(--tx3)", fontFamily: "var(--mo)", marginBottom: 8 }}>{clone.priceLabel ? "메시지당" : "/월"}</div>
              {isSub ? (
                <Bt v="pr" sz="sm" on={() => { setActiveClone(clone); setView("chat"); }} style={{ background: clone.color }}>
                  대화하기 →
                </Bt>
              ) : (
                <Bt v="pr" sz="sm" on={() => onSubscribe(clone.id)} style={{ background: clone.color }}>
                  구독 시작
                </Bt>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {clone.links.ig && (
            <a href="#" style={{ padding: "4px 10px", borderRadius: "var(--r-md)", background: "var(--sf2)", border: "1px solid var(--br2)", color: "var(--tx2)", fontSize: 11, textDecoration: "none", fontFamily: "var(--mo)", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <CameraIcon style={{ width: 16, height: 16 }} />
              {clone.links.ig}
            </a>
          )}
            {clone.links.yt && (
            <a href="#" style={{ padding: "4px 10px", borderRadius: "var(--r-md)", background: "var(--tg-rd-bg)", border: "1px solid var(--err-border)", color: "var(--rd)", fontSize: 11, textDecoration: "none", fontFamily: "var(--mo)", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <PlayIcon style={{ width: 16, height: 16 }} />
              YouTube
            </a>
          )}
            {clone.links.fc && (
            <a href="#" style={{ padding: "4px 10px", borderRadius: "var(--r-md)", background: "var(--am-muted)", border: "1px solid var(--am-line)", color: "var(--am)", fontSize: 11, textDecoration: "none", fontFamily: "var(--mo)", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <AcademicCapIcon style={{ width: 16, height: 16 }} />
              패스트캠퍼스
            </a>
          )}
            {clone.links.sub && (
            <a href="#" style={{ padding: "4px 10px", borderRadius: 7, background: "var(--cyd)", color: "var(--cy)", fontSize: 11, textDecoration: "none", fontFamily: "var(--mo)", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <EnvelopeIcon style={{ width: 16, height: 16 }} />
              뉴스레터
            </a>
          )}
          </div>
        </Cd>

        <div style={{ display: "flex", gap: 1, marginBottom: 14, borderBottom: "1px solid var(--br)" }}>
          {[
            ["about", "소개"],
            ["demo", "샘플 대화"],
            ["products", "강의·상품"],
            ["updates", "업데이트"],
            ["feedback", "피드백 " + publicFeedbacks.length],
          ].map(([k, l]) => (
            <button type="button" key={k} onClick={() => setTab(k)} style={{ padding: "6px 13px", border: "none", borderBottom: tab === k ? "2px solid var(--cy)" : "2px solid transparent", background: "transparent", fontSize: 12, fontWeight: tab === k ? 700 : 400, color: tab === k ? "var(--cy)" : "var(--tx2)", cursor: "pointer", fontFamily: "var(--fn)", marginBottom: -1, whiteSpace: "nowrap" }}>
              {l}
            </button>
          ))}
        </div>

        {tab === "about" && (
          <Cd style={{ padding: "16px 18px" }}>
            <p style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.8, marginBottom: 10 }}>{clone.bio}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>{(clone.tags || []).map((t) => <Tg key={t} label={t} />)}</div>
          </Cd>
        )}

        {tab === "demo" && (
          <div style={{ animation: "fu 0.3s ease" }}>
            <div style={{ padding: "11px 14px", background: "var(--cyd)", border: "1px solid var(--br2)", borderRadius: 10, marginBottom: 14, display: "flex", gap: 10, alignItems: "center" }}>
              <div><ChatBubbleLeftRightIcon style={{ width: 20, height: 20, color: "var(--cy)" }} /></div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 1 }}>{clone.name} 클론과 실제 대화를 미리 보세요</div>
                <div style={{ fontSize: 11, color: "var(--tx2)" }}>강사가 직접 선별한 베스트 Q&A입니다. 구독 전에 어떤 답변을 하는지 확인하세요.</div>
              </div>
            </div>

            {(clone.demoQA || []).filter((d) => d.pinned).length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", fontSize: 12, color: "var(--tx3)" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>💭</div>
                강사가 아직 샘플 대화를 등록하지 않았습니다
              </div>
            ) : (
              (clone.demoQA || [])
                .filter((d) => d.pinned)
                .map((qa, i) => (
                  <div key={i} style={{ marginBottom: 18, animation: "fu 0.3s ease" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 8 }}>
                      <div style={{ maxWidth: "75%", padding: "10px 14px", borderRadius: 12, borderTopRightRadius: 3, background: "var(--cyd)", border: "1px solid var(--br2)", fontSize: 13, lineHeight: 1.7, color: "var(--tx)" }}>{qa.q}</div>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--sf2)", border: "1px solid var(--br)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, alignSelf: "flex-end", color: "var(--tx2)" }}>
                        <UserIcon style={{ width: 16, height: 16 }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Av char={clone.av} color={clone.color} size={28} />
                      <div style={{ maxWidth: "75%", padding: "10px 14px", borderRadius: 12, borderTopLeftRadius: 3, background: "var(--sf)", border: "1px solid var(--br)", fontSize: 13, lineHeight: 1.7, color: "var(--tx)" }}>
                        {qa.a}
                        <div style={{ marginTop: 6, fontSize: 10, color: "var(--tx3)", fontFamily: "var(--mo)", display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gn)", display: "inline-block" }} />
                          {clone.name} AI 클론
                        </div>
                      </div>
                    </div>
                    {i < (clone.demoQA || []).filter((d) => d.pinned).length - 1 && <div style={{ height: 1, background: "var(--br)", margin: "14px 0" }} />}
                  </div>
                ))
            )}

            <Cd style={{ padding: "14px 16px", marginTop: 6, borderColor: "var(--br2)" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>직접 질문해보고 싶으신가요?</div>
                  <div style={{ fontSize: 11, color: "var(--tx2)" }}>무료 체험 5회 — 지금 바로 {clone.name} 클론과 대화할 수 있습니다.</div>
                </div>
                {isSub ? (
                  <Bt v="pr" sz="sm" on={() => { setActiveClone(clone); setView("chat"); }} style={{ background: clone.color, flexShrink: 0 }}>
                    대화하기 →
                  </Bt>
                ) : (
                  <Bt v="pr" sz="sm" on={() => onSubscribe(clone.id)} style={{ background: clone.color, flexShrink: 0 }}>
                    무료 체험 →
                  </Bt>
                )}
              </div>
            </Cd>
          </div>
        )}

        {tab === "products" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(clone.products || []).length === 0 && (
              <Cd style={{ padding: 24, textAlign: "center", color: "var(--tx3)", fontSize: 13 }}>등록된 강의·상품이 없습니다.</Cd>
            )}
            {(clone.products || []).map((p, i) => (
              <Cd key={i} style={{ padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "var(--cy)", fontFamily: "var(--mo)" }}>{p.price}</div>
                </div>
                <Bt v="gh" sz="sm">
                  자세히 보기 →
                </Bt>
              </Cd>
            ))}
          </div>
        )}

        {tab === "updates" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(clone.updates && clone.updates.length > 0
              ? clone.updates
              : [
                  { date: "—", title: "아직 공지 없음", body: "강사가 업데이트를 올리면 여기에 표시됩니다." },
                ]
            ).map((u, i) => (
              <Cd key={i} style={{ padding: "13px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{u.title}</span>
                  <Tg label={u.date} />
                </div>
                <p style={{ fontSize: 12, color: "var(--tx2)", lineHeight: 1.6 }}>{u.body}</p>
              </Cd>
            ))}
          </div>
        )}

        {tab === "feedback" && (
          <div style={{ animation: "fu 0.3s ease" }}>
            <Cd style={{ padding: "16px 18px", marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: 42, fontWeight: 800, color: "var(--go)", lineHeight: 1 }}>{avgRating}</div>
                  <div style={{ display: "flex", gap: 2, justifyContent: "center", margin: "4px 0" }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={n} style={{ display: "inline-flex" }}>
                        <StarIconSolid style={{ width: 16, height: 16, color: n <= Math.round(Number(avgRating)) ? "var(--go)" : "var(--sf3)" }} />
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--tx3)", fontFamily: "var(--mo)" }}>{publicFeedbacks.length}개 피드백</div>
                </div>
                <div style={{ flex: 1 }}>
                  {dist.map(({ r, n }) => (
                    <div key={r} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: "var(--tx3)", fontFamily: "var(--mo)", minWidth: 16, textAlign: "right" }}>{r}</span>
                      <StarIconSolid style={{ width: 16, height: 16, color: "var(--go)" }} />
                      <div style={{ flex: 1, height: 5, borderRadius: 3, background: "var(--sf3)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(n / publicFeedbacks.length) * 100}%`, background: "var(--go)", borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 11, color: "var(--tx3)", fontFamily: "var(--mo)", minWidth: 14 }}>{n}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Cd>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {publicFeedbacks.map((fb) => (
                <Cd key={fb.id} style={{ padding: "13px 15px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", gap: 3 }}>{[1, 2, 3, 4, 5].map((n) => (
                    <StarIconSolid key={n} style={{ width: 20, height: 20, color: n <= fb.rating ? "var(--go)" : "var(--sf3)" }} />
                  ))}</div>
                    <span style={{ fontSize: 11, color: "var(--tx3)", fontFamily: "var(--mo)" }}>{fb.date}</span>
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 7 }}>{fb.msg}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button type="button" style={{ fontSize: 11, color: "var(--tx3)", background: "none", border: "1px solid var(--br)", borderRadius: 6, padding: "3px 9px", cursor: "pointer", fontFamily: "var(--fn)", display: "flex", alignItems: "center", gap: 4 }}>
                      <HandThumbUpIcon style={{ width: 16, height: 16 }} />
                      도움됐어요 <span style={{ color: "var(--tx2)" }}>{fb.helpful}</span>
                    </button>
                  </div>
                </Cd>
              ))}
            </div>

            <Cd style={{ padding: "16px 18px", borderColor: "var(--br2)" }}>
              {!fbDone ? (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{isSub ? "이 클론과 대화해보셨나요? 피드백을 남겨주세요" : "구독 후 피드백을 남길 수 있습니다"}</div>
                  {isSub && (
                    <>
                      <div style={{ display: "flex", gap: 7, marginBottom: 10 }}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button type="button" key={n} onClick={() => setFbRating(n)} style={{ flex: 1, padding: "10px 4px", borderRadius: 9, border: `1px solid ${fbRating >= n ? "var(--go)" : "var(--br)"}`, background: fbRating >= n ? "var(--tg-go-bg)" : "var(--sf2)", cursor: "pointer", transition: "all 0.1s", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <StarIconSolid style={{ width: 24, height: 24, color: fbRating >= n ? "var(--go)" : "var(--br)" }} />
                          </button>
                        ))}
                      </div>
                      {fbRating > 0 && <div style={{ fontSize: 11, color: "var(--tx2)", textAlign: "center", marginBottom: 10, fontFamily: "var(--mo)" }}>{["", "별로예요", "아쉬워요", "보통이에요", "좋아요!", "최고예요!"][fbRating]}</div>}
                      <textarea value={fbText} onChange={(e) => setFbText(e.target.value)} placeholder="다른 구독자들에게 도움이 될 솔직한 피드백을 남겨주세요..." style={{ width: "100%", padding: "9px 11px", border: "1px solid var(--br)", borderRadius: 9, background: "var(--sf2)", color: "var(--tx)", fontSize: 12, outline: "none", fontFamily: "var(--fn)", resize: "none", height: 80, lineHeight: 1.5, marginBottom: 10 }} />
                      <Bt v="pr" dis={fbRating === 0 || !fbText.trim()} on={() => setFbDone(true)} style={{ width: "100%", justifyContent: "center" }}>
                        피드백 게시하기
                      </Bt>
                    </>
                  )}
                  {!isSub && (
                    <div style={{ textAlign: "center", padding: "8px 0" }}>
                      <Bt v="gh" sz="sm" on={() => onSubscribe(clone.id)}>
                        구독하고 피드백 남기기
                      </Bt>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "10px 0" }}>
                  <div style={{ marginBottom: 7 }}><HandRaisedIcon style={{ width: 24, height: 24, color: "var(--gn)" }} /></div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>피드백 감사합니다!</div>
                  <p style={{ fontSize: 12, color: "var(--tx2)" }}>소중한 의견이 강사와 다른 구독자들에게 도움이 됩니다.</p>
                </div>
              )}
            </Cd>
          </div>
        )}
      </div>
    </div>
  );
}

