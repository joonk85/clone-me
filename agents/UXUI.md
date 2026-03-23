# 🎨 UXUI Agent — UX/UI Designer
> 항상 BRAIN.md + docs/STYLE_GUIDE.md를 먼저 읽으세요.

## 역할
사용자 경험 설계, UI 컴포넌트 구현, 반응형 레이아웃, RAG 출처 표시 UI를 담당합니다.

## 디자인 원칙
1. Dark & Minimal — 짙은 다크, 네온 포인트
2. Mobile First — 768px 브레이크포인트
3. Consistent — STYLE_GUIDE CSS Variables만 사용
4. Accessible — 터치 타겟 최소 44px

## 공통 컴포넌트
```
src/components/common/
├── Av.jsx        # 아바타 (size 가이드: 22/28/30/36/44/50/60)
├── Bt.jsx        # 버튼 (v: pr/gh/sf/dn, sz: sm/md/lg)
├── Cd.jsx        # 카드
├── Sw.jsx        # 토글
├── Tg.jsx        # 태그 (c: cy/gn/am/rd/go/pu)
├── Pb.jsx        # 프로그레스 바
├── LoadingSpinner.jsx
└── ErrorMessage.jsx
```

## 모바일 체크리스트
- [ ] isMobile (< 768px) 분기
- [ ] 하단 탭바 64px 패딩
- [ ] 터치 타겟 44px 이상
- [ ] iOS Safe Area (env)
- [ ] 채팅 100dvh (키보드 대응)
- [ ] 인풋 폰트 최소 16px (iOS 줌 방지)
- [ ] hover → 터치 대안

## 주요 UX 패턴

### 마이 멤버 `/my/*` (계정 허브)
- **`/my`에서 앱 Rail 숨김** → 좌측 **fixed 전고** 계정 메뉴(268px, `AppShell` `main` 마진과 일치). `USER ACCOUNT` — General / Security / Subscription & Usage / Notifications / 구분선 / Go to My Master AI. 상단 **← 홈으로**(`/`).
- **Security** (`/my/security`): 타이틀 **Security Control** — Password(영문 폼·Update Password) · Active Sessions(세션 API 시도·폴백 1행·`signOut({ scope: 'others' })`·행별 로그아웃 아이콘) · Security Log(로컬 `localStorage`·실패 빨간색) · Danger zone 계정 삭제 모달. 이메일 변경은 **General** 링크.
- **마스터 `/my/master/clones`:** 마스터 모드 Rail **클론 목록** + 상단 검색·토큰/알림/계정 바 · **내 클론** 타이틀 · 통계 카드(TOTAL ACTIVE / 이번 달 메시지) · 데스크톱 **테이블**·모바일 **카드** · STATUS(Operating/Idle/Inactive) · 페이지네이션 · 하단 요약 3카드 · 빈 상태 **+ 첫 클론 만들기**. (`docs/MASTER_CLONES_LIST_SIDE_EFFECTS.md`)
- **General** (`/my/general`): **General Settings** — 좌 아바타+**CHANGE AVATAR**, 우 **DISPLAY NAME**·**UNIQUE HANDLE**, **PROFILE BIO**(500자·`N / 500 characters`) · **ACCOUNT INFO**(이메일·가입일·가입 경로·계정 ID, 이메일 수정은 Security 링크) · 하단 **Reset to Defaults** / **Cancel** / **Save Changes**. (SNS 필드 UI 제거, DB 값은 유지)
- **Subscription & Usage** (`/my/subscription`): 탭 **[Current] [Upgrade]** — Current: **ACCOUNT STATUS** + **TOKEN CONSUMPTION**(링·바·USED/ALLOCATED/EST.RESET)·**Usage History** 테이블·VIEW MORE·Export CSV(Mock). Upgrade: 4플랜 카드·Pro **RECOMMENDED**·Mock `setPlanMock`. (TokenShop은 이 페이지에서 제거)
- **모바일**: **← 홈으로** 항상 + 상단 가로 탭(동일 메뉴 + Master AI).
- **우측**: 선택 메뉴별 페이지(`MyAccount*`). 마스터 스튜디오는 **`/my/master/*`** (기존 상단 탭만 유지).
- **`/settings`** → `/my/general` 리다이렉트.

### 마스터 탐색 `/market`
- **앱 셸:** 이 경로에서 기본 상단 헤더 숨김 → 마켓 **자체** 스티키 바(중앙 검색 `Search AI Masters…`, 우측 `TokenRingGauge`·토큰 문구·벨·계정).
- **Priority Access** 배너: 플랜 카피(Free vs 유료) + 남은 토큰 + 슬롯 아이콘 4칸.
- **그리드:** 모바일 1열 / 태블릿 2열 / 데스크톱 3열. 카드 상단 흑백 이미지, cyan 뱃지 `RATING / MSG NT`, 하단 다크 풋터, hover 시 lift + cyan glow.
- **변수:** `STYLE_GUIDE` 마켓 토큰 + `@keyframes market-sk` 스켈레톤.

### 플랫폼 요금제 `/pricing`
- 비로그인 접근 가능 · 로그인 시 **현재 플랜** 강조 · Free CTA **시작하기** / 유료 **구독하기 (Mock)** · 연간 −20% 토글
- 레일·앱 헤더: 토큰 잔액 옆 **플랜 뱃지** · Free면 **업그레이드** → `/pricing`
- 채팅·클론 정보: **N토큰/턴 · 약 ₩…/턴** (1토큰=₩100 참고)

### 빈 상태 (Empty State)
```jsx
<div style={{textAlign:'center', padding:'40px 24px'}}>
  <div style={{fontSize:48, opacity:0.25, marginBottom:16}}>🎵</div>
  <div style={{fontSize:18, fontWeight:700, marginBottom:10}}>제목</div>
  <p style={{color:'var(--tx2)', marginBottom:24}}>설명</p>
  <Bt v="pr">CTA</Bt>
</div>
```

### 로딩 스피너
```jsx
<span style={{
  width:14, height:14,
  border:'2px solid rgba(0,0,0,.3)',
  borderTopColor:'#000',
  borderRadius:'50%',
  display:'inline-block',
  animation:'sp 0.8s linear infinite'
}}/>
```

### 출처 표시 UI (채팅 — RAG)
```jsx
// 답변 말풍선 아래에 표시
{sources.length > 0 && quality_citation && (
  <div style={{marginTop:6, display:'flex', flexDirection:'column', gap:2}}>
    {sources.map((src, i) => (
      <div key={i} style={{
        fontSize:10, color:'var(--tx3)',
        fontFamily:'var(--mo)', display:'flex',
        alignItems:'center', gap:4
      }}>
        {src.timestamp_start
          ? <>📺 {src.file_name} · {src.timestamp_start}~{src.timestamp_end}</>
          : <>📄 {src.file_name}{src.page_number && ` · ${src.page_number}페이지`}</>
        }
        {/* 마케팅 링크 연결 시 */}
        {src.linked_product && (
          <span style={{color:'var(--cy)', cursor:'pointer'}}>
            [{src.linked_product} →]
          </span>
        )}
      </div>
    ))}
  </div>
)}
```

### 품질 점수 게이지 (클론 관리)
```jsx
const scoreColor = score >= 75 ? 'var(--gn)' : score >= 50 ? 'var(--cy)' : 'var(--am)'
const scoreLabel = score >= 75 ? '나다운 대화 가능 ✓' : score >= 50 ? '기본 대화 가능' : '자료 보강 필요'

// SVG 원형 게이지
<svg viewBox="0 0 36 36" style={{width:80, height:80}}>
  <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--sf3)" strokeWidth="3"/>
  <circle cx="18" cy="18" r="15.9" fill="none"
    stroke={scoreColor} strokeWidth="3"
    strokeDasharray={`${score} ${100 - score}`}
    strokeDashoffset="25"
    style={{transition:'stroke-dasharray 0.5s ease'}}/>
  <text x="18" y="20.5" textAnchor="middle"
    style={{fontSize:'8px', fontWeight:700, fill:'var(--tx)', fontFamily:'var(--mo)'}}>
    {score}%
  </text>
</svg>
```

### 자료 카테고리 탭 (클론 만들기)
```
[A. 어투/스타일] [B. 핵심 지식] [C. 케이스] [D. 판단 기준]
각 탭: 카테고리 설명 + 권장 자료 + 업로드 폼
```

### 클론 테스트 결과 리포트
```jsx
const results = [
  { label: '자기소개', status: 'pass' },
  { label: '어투 일관성', status: 'warn' },
  { label: '케이스 활용', status: 'fail' },
]

// 상태별 색상
const statusColor = { pass: 'var(--gn)', warn: 'var(--am)', fail: 'var(--rd)' }
const statusIcon = { pass: '✅', warn: '⚠️', fail: '❌' }
```

### 자료별 참조 현황 (인사이트 탭)
```jsx
// 파일별 이번 달 참조 횟수 바 차트
{fileStats.map(stat => (
  <div key={stat.file_id} style={{display:'flex', alignItems:'center', gap:8, marginBottom:6}}>
    <Tg label={stat.file_type} c={typeColor[stat.file_type]} />
    <span style={{fontSize:11, flex:1, overflow:'hidden', textOverflow:'ellipsis'}}>
      {stat.file_name}
    </span>
    <div style={{width:80, height:4, background:'var(--sf3)', borderRadius:2}}>
      <div style={{height:'100%', width:`${(stat.count / maxCount) * 100}%`,
        background:'var(--cy)', borderRadius:2}}/>
    </div>
    <span style={{fontSize:10, color:'var(--tx3)', fontFamily:'var(--mo)', minWidth:30}}>
      {stat.count}회
    </span>
  </div>
))}
```

### 클론 컬러 피커 (클론 만들기 Step 2) ← 신규
```jsx
// 클론 아바타/카드/채팅에 즉시 반영되는 컬러 선택 UI
// 기본값: #63d9ff (cyan) / 추천 팔레트 6개

const PALETTE = [
  '#63d9ff', // cyan  (기본)
  '#4fffb0', // green
  '#ffb347', // amber
  '#b794ff', // purple
  '#ff6b9d', // pink
  '#ffc832', // gold
]

function ColorPicker({ value, onChange }) {
  return (
    <div>
      <label style={{
        fontSize: 11, color: 'var(--tx3)',
        fontFamily: 'var(--mo)', display: 'block', marginBottom: 8
      }}>
        클론 컬러
      </label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {PALETTE.map(color => (
          <div
            key={color}
            onClick={() => onChange(color)}
            style={{
              width: 28, height: 28,
              borderRadius: '50%',
              background: color,
              cursor: 'pointer',
              border: value === color ? `3px solid #fff` : `3px solid transparent`,
              boxShadow: value === color ? `0 0 10px ${color}` : 'none',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
          />
        ))}
        {/* 선택된 컬러 코드 표시 */}
        <span style={{ fontSize: 11, color: 'var(--tx3)', fontFamily: 'var(--mo)' }}>
          {value}
        </span>
      </div>
      {/* 미리보기: 아바타가 선택 컬러로 즉시 변경 */}
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Av char="나" color={value} size={36} />
        <span style={{ fontSize: 11, color: 'var(--tx2)' }}>
          카드·채팅·대시보드에 이 컬러가 적용됩니다
        </span>
      </div>
    </div>
  )
}

// 사용 예시 (클론 만들기 Step 2)
const [cloneColor, setCloneColor] = useState('#63d9ff')
<ColorPicker value={cloneColor} onChange={setCloneColor} />
```

**UX 원칙:**
- 팔레트 클릭 즉시 아바타 미리보기 반영
- 선택된 컬러: 흰색 테두리 + glow 효과
- 미선택: 투명 테두리
- 색상 코드 hex 값 표시 (디자이너 친화)

---

### 보안 설정 토글 UI (security_delete_after_training) ← 신규
```jsx
// ⚠️ 기본값: false (OFF = 원본 보관)
// ON 설정 시 명확한 경고 메시지 표시

<div style={{
  display: 'flex', alignItems: 'flex-start',
  justifyContent: 'space-between', gap: 12,
  padding: '10px 12px',
  background: clone.security_delete_after_training
    ? 'rgba(255,79,109,0.06)'
    : 'var(--sf2)',
  borderRadius: 9,
  border: `1px solid ${clone.security_delete_after_training
    ? 'rgba(255,79,109,0.2)'
    : 'var(--br)'}`,
  transition: 'all 0.2s',
}}>
  <div style={{ flex: 1 }}>
    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3 }}>
      학습 완료 후 원본 파일 삭제
    </div>
    <div style={{ fontSize: 11, color: 'var(--tx3)', lineHeight: 1.5 }}>
      {clone.security_delete_after_training
        ? <span style={{ color: 'var(--rd)' }}>
            ⚠️ ON — 원본 파일이 삭제됩니다. 출처 표시 정확도가 하락합니다.
          </span>
        : <span style={{ color: 'var(--gn)' }}>
            ✓ OFF — 원본 보관 중 (권장). 정확한 출처 표시가 가능합니다.
          </span>
      }
    </div>
  </div>
  <Sw
    on={clone.security_delete_after_training}
    onChange={v => updateClone({ security_delete_after_training: v })}
  />
</div>

{/* ON 설정 시 추가 경고 */}
{clone.security_delete_after_training && (
  <div style={{
    fontSize: 11, color: 'var(--am)',
    background: 'rgba(255,179,71,0.08)',
    border: '1px solid rgba(255,179,71,0.2)',
    borderRadius: 8, padding: '8px 10px',
    marginTop: 6
  }}>
    💡 원본 삭제 시 "어느 강의 몇 페이지"와 같은 출처 표시가 부정확해질 수 있습니다.
       임베딩 벡터만 남아 할루시네이션 위험이 높아집니다.
  </div>
)}
```

**UX 원칙:**
- 기본값 OFF (원본 보관) — 절대 반대로 설정하지 말 것
- ON 상태: 빨간 배경 + 경고 텍스트로 위험 시각화
- OFF 상태: 초록 텍스트로 안전 상태 확인
- ON 전환 시 추가 경고 배너 자동 표시

---

## 마이페이지 탭 구조
```
상단 헤더: 프로필사진 + 닉네임 + 배지 + 토큰잔액 + ⚙️
역할 탭: [멤버 | 마스터] (마스터 등록 후)

멤버 탭: 프로필 / 토큰관리 / 구독관리 / 대화기록 / 마스터등록유도
마스터 탭: 프로필 / 인증배지 / 내클론 / 수익요약 / 단가설정 / 정산계좌
```

## 설정 페이지 구조
```
알림: 마케팅(OFF)/이메일(ON)/대화(ON)/피드백(ON,마스터만)
이용약관 및 정책: 이용약관 / 개인정보처리방침
계정 관리: 내정보 / 비밀번호 변경 / 회원탈퇴(빨간색)
로그아웃 (빨간색)
```
