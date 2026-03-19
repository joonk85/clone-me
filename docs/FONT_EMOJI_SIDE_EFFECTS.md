# 폰트·이모지 정리 — Side Effect 체크리스트

## 요약
- **폰트:** 타이틀 Syne 700·800 유지, 본문 Pretendard/시스템, 숫자·코드 Space Mono. 크기 12/14/16/18/24/32/48px, 줄간격 1.5.
- **이모지:** 버튼·배지/태그 → Heroicons 또는 텍스트. **유지:** 빈 상태 일러스트용만 (EmptyPanel ✨💬🛒, Buyer 🎵, MasterProfile 샘플 없음 💭).

## 1. 폰트 변경 영향

### 1.1 전역 (globalCss.js)
| 항목 | 변경 전 | 변경 후 |
|------|--------|--------|
| 본문 폰트 | `--fn: Syne` | `--fn: Pretendard Variable, -apple-system, sans-serif` (본문) |
| 타이틀 | 동일 폰트 | `--fn-title: Syne` (700·800용, 기존 --fn은 제목에만 사용하는 곳이 있음 → 타이틀엔 Syne 유지) |
| 숫자/코드 | `--mo: Space Mono` | 유지 |
| 크기 스케일 | 10/11/12/13/14/18/20/22 | 12/14/16/18/24/32/48 (+ --fs-input-mobile 16) |
| 줄간격 | 제각각 | `line-height: 1.5` 기본 |

- **--fs-xs** 10→12, **--fs-sm** 11→12, **--fs-lead** 13→14, **--fs-h2** 20→24, **--fs-h1** 22→32, **--fs-h1-mobile** 20→24.
- STYLE_GUIDE.md 타이포 섹션 반영 필요.

### 1.2 영향받는 파일 (--fs- 사용처)
- `Signup.jsx`, `Login.jsx`, `MemberProfile.jsx`, `Nav.jsx`, `MyLayout.jsx`, `Market.jsx`, `Home.jsx`, `UiStates.jsx`, `PublicOnlyRoute.jsx`, `Buyer.jsx`, `MasterProfile.jsx`, `CloneDash`, 기타 인라인 `fontSize: 10~22` 사용처.
- **인라인 숫자 폰트 크기:** 9, 10, 11, 13, 19, 20, 22 등 → 12/14/16/18/24/32/48 중 가장 가까운 값으로 정리 권장 (필수는 아님, 점진 적용 가능).

## 2. 이모지 제거/교체 대상

### 2.1 유지 (빈 상태 일러스트)
- `Home.jsx`: EmptyPanel `emoji="✨"`, `emoji="💬"`, `emoji="🛒"`.
- `Buyer.jsx`: 빈 대화 영역 `🎵`.
- `MasterProfile.jsx`: 샘플 대화 없음 안내 `💭`.

### 2.2 제거·교체
| 파일 | 현재 | 조치 |
|------|------|------|
| Chat.jsx | "설문 감사합니다! 🎉 …" | 🎉 제거 (텍스트만) |
| Chat.jsx | "최고예요! 🎉" (피드백 라벨) | "최고예요!" |
| MasterProfile.jsx | 👤 (샘플 Q&A 사용자 아바타) | UserIcon (Heroicons) |
| MasterProfile.jsx | 👍 도움됐어요 | ThumbUpIcon + "도움됐어요" |
| MasterProfile.jsx | "최고예요! 🎉" | "최고예요!" |
| MasterProfile.jsx | 🙏 (피드백 감사) | SparklesIcon 또는 제거 |
| CloneDash/index.jsx | 💰 구독료 관리 / 수익 | CurrencyDollarIcon |
| CloneDash/index.jsx | ⚠️ 중복 파일 / 위험 구역 | ExclamationTriangleIcon (이미 일부 적용) |
| CloneDash/index.jsx | 📤 자료 업로드 | ArrowUpTrayIcon |
| CloneDash/index.jsx | 📂 (드롭존) | FolderIcon (이미 Create에 있음) |
| CloneDash/index.jsx | 📚 현재 학습 자료 | BookOpenIcon |
| CloneDash/index.jsx | 🗑 삭제 버튼 | TrashIcon |
| CloneDash/index.jsx | 🧪 내 클론 테스트 | BeakerIcon |
| CloneDash/index.jsx | 📋 구조화 테스트 / 버전 / 고정 답변 / 리포트 | ClipboardDocumentListIcon |
| CloneDash/index.jsx | ✅ / ⚠️ / ❌ 자가평가 | CheckCircle, ExclamationTriangle, XCircle |
| CloneDash/index.jsx | 📌 고정 답변, 🤖 Claude (테스트 소스 라벨) | MapPin/BookmarkIcon, CpuChipIcon 또는 텍스트 |
| CloneDash/index.jsx | 💬 대화 이력 | ChatBubbleLeftRightIcon (이미 import 가능) |

## 3. 작업 순서 (수정순)

1. **globalCss.js** — 폰트 패밀리(`--fn` 본문, `--fn-title` 타이틀), 폰트 크기 스케일(12/14/16/18/24/32/48), `--lh` 1.5, h1~h4·`.font-title` Syne 적용. **(완료)**
2. **docs/STYLE_GUIDE.md** — 타이포 변수 설명 갱신(`--fn` / `--fn-title` / `--mo` / `--fs-*` / `--lh`). **(완료)**
3. **이모지 제거·교체 (파일별 순차):**
   - **Chat.jsx** — 🎉 제거(설문·피드백 라벨). **(완료)**
   - **MasterProfile.jsx** — 👤→UserIcon, 👍→HandThumbUpIcon, 🎉 제거, 🙏→HandRaisedIcon. **(완료)**
   - **CloneDash/index.jsx** — 💰📤📂📚🗑🧪📋✅⚠️❌📌🤖💬 → 해당 Heroicons/텍스트. **(완료)**

## 4. 적용 내역
- **폰트:** `--fn` = Pretendard Variable + 시스템 폰트, `--fn-title` = Syne (h1~h4, .font-title), `--mo` = Space Mono. `--fs-*` = 12/14/16/18/24/32/48, `--lh` = 1.5. Nav 로고에 `--fn-title` 적용.
- **이모지 제거:** Chat(🎉), MasterProfile(👤→UserIcon, 👍→HandThumbUpIcon, 🎉, 🙏→HandRaisedIcon), CloneDash(💰📤📂📚🗑🧪📋✅⚠️❌📌🤖💬→ 해당 Heroicons 또는 텍스트). 빈 상태(🎵, 💭, EmptyPanel ✨💬🛒) 유지.
