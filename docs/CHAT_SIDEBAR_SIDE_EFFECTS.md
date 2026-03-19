# 채팅 UI 사이드바 수정 — Side Effect 체크

> BRAIN·PROGRESS 기준. 수정 전 영향도 정리.

---

## 1. Chat.jsx 수정 시 영향받는 컴포넌트 목록

| 구분 | 파일 | 관계 | 비고 |
|------|------|------|------|
| **직접 사용처** | `src/routes/ChatPage.jsx` | `<Chat clone={...} subscribed={...} ... />` | Chat의 **유일한** 부모. `cloneId`(params), `useAppState()` 로 props 주입. |
| **라우트** | `src/App.jsx` | `Route path="chat/:cloneId" element={<ChatPage />}` | ChatPage만 교체 시 Chat 자체는 그대로. |
| **진입 경로** | `Home.jsx`, `Market.jsx`, `Buyer.jsx`, `MemberConversations.jsx`, `MasterProfilePage.jsx` | `navigate('/chat/${id}')` | URL로만 진입. Chat 내부/사이드바 변경과 무관. |
| **공통 컴포넌트** | `Av`, `Bt`, `Pb`, `MasterBadges` | Chat 내부에서 import | 사이드바/레이아웃만 수정 시 기존 사용 방식 유지하면 됨. |
| **스타일** | `src/member/chat-claude.css` | Chat.jsx에서 `import './chat-claude.css'` | 사이드바(레일)·오버레이·헤더·스크롤·입력창 등 모두 여기 정의. |

**결론:** Chat.jsx/사이드바를 수정해도 **다른 페이지 컴포넌트는 영향 없음**. 신경 쓸 곳은 **ChatPage( props 계약 )**, **chat-claude.css**, **AppState(freeUsed/surveyDone/subscribed)** 사용처뿐.

---

## 2. 모바일 100dvh 레이아웃 변경 시 키보드 대응 영향

| 항목 | 현재 구현 | 키보드 올라왔을 때 |
|------|-----------|---------------------|
| **높이** | `chat-claude-root`: `height: calc(100dvh - var(--nav-h-mobile))` | 모바일에서 **100dvh**는 “보이는 뷰포트” 기준. 키보드가 올라오면 **dvh가 줄어들어** 루트 높이도 함께 줄어듦. |
| **입력창** | `.chat-claude-input-dock`이 하단 고정(`sticky` 아님, flex 자식으로 하단 배치) | 루트가 100dvh 기반으로 줄어들므로, **스크롤 영역이 위로 줄어들고** 입력창은 키보드 위에 붙는 형태로 동작하는 것이 일반적. |
| **visualViewport** | 미사용 | `visualViewport` API로 키보드 높이를 보정하지 않음. 100dvh만으로도 대부분 브라우저는 키보드 노출 시 뷰포트를 줄이므로, **추가 보정 없이도 동작은 가능**. |
| **주의점** | `position: fixed` + `bottom: 0`으로 입력창을 두면 키보드 시 뷰포트와 어긋날 수 있음 | 현재는 **flex 레이아웃**으로 입력창을 하단에 두고 있어, 100dvh가 줄어들면 함께 올라옴. **fixed로 바꾸지 않으면** 키보드 대응은 유지됨. |

**수정 시 권장:**

- **100dvh** 계속 사용해도 됨. 모바일 키보드 시 뷰포트 축소에 따라 레이아웃이 따라가는 구조 유지.
- **입력창**을 `position: fixed`로 바꾸지 말 것. (필요 시 `env(keyboard-inset-height)` 등은 나중에 별도 개선.)
- 사이드바(레일)는 모바일에서 **fixed + transform**으로 슬라이드. 레일만 열 때는 키보드가 내려간 상태가 많으므로, 레일 자체는 100dvh와 독립적으로 두어도 됨.

---

## 3. 대화 기록 상태 관리 위치

| 상태 | 위치 | 용도 |
|------|------|------|
| **msgs** | `Chat.jsx` `useState` | 현재 화면에 보이는 메시지 목록. `{ r, t, sources?, marketing?, fromFixed? }[]`. |
| **conversationId** | `Chat.jsx` `useState` | 현재 대화 스레드 ID. **api/chat** 호출 시 body에 그대로 전달. 새 대화면 null, 첫 응답 후 `d.conversationId`로 세팅. |
| **convFromUrl** | `Chat.jsx` `useSearchParams().get('conv')` | URL `?conv=<uuid>`. 있으면 해당 대화 로드(메시지 fetch), 없으면 “새 대화” 상태. |
| **convRailList** | `Chat.jsx` `useState` | 사이드바 “대화 기록” 목록. `fetchConversationsForChatRail` 결과. 새 메시지 후 `refreshRail()` 호출로 갱신. |
| **freeUsed / surveyDone** | `AppStateContext` | 클론별 무료 체험 사용 횟수·설문 완료 여부. Chat은 **소비만** 하고, `setFreeUsed`로 증가. |
| **subscribed** | `AppStateContext` | 구독 중인 클론 id[]. Chat은 읽기만(헤더·레일 “구독 중인 클론” 표시). |

**저장/연동:**

- **서버에 저장:** `/api/chat` 호출 시마다 `conversations`·`messages`·`message_sources` 등은 **api/chat.js**와 Supabase가 처리. Chat.jsx는 **conversationId**와 **msgs**만 유지.
- **URL과 동기화:** `?conv=` 로 이전 대화 진입 시 `fetchMessagesForConversation`으로 메시지 로드 후 **msgs**와 **conversationId** 세팅. “새 대화”는 `setSearchParams({})`로 conv 제거 후 msgs 초기화.

**사이드바 수정 시:**  
레일에서 대화 클릭 시 `navigate('/chat/${clone_id}?conv=${id}')` 만 유지하면, 기존 “conv 로드 → msgs/conversationId 세팅” 로직이 그대로 동작. **상태 관리 위치는 건드리지 않아도 됨.**

---

## 4. api/chat.js 연동 — 건드리지 않아야 할 곳

**호출처:**  
- `Chat.jsx`: 멤버 채팅 (유일한 프로덕션 채팅)  
- `CloneDash/index.jsx`: 클론 테스트 패널 (동일 API 사용)

**요청 계약 (변경 금지):**

```http
POST /api/chat
Authorization: Bearer <Supabase access_token>
Content-Type: application/json

{
  "cloneId": "uuid",
  "conversationId": "uuid | null",
  "messages": [ { "role": "user" | "assistant", "content": "string" }, ... ]
}
```

- **마지막 메시지**는 반드시 `role: "user"`.
- `conversationId`는 기존 대화 이어갈 때만 넣고, 새 대화면 null.

**응답 계약 (클라이언트가 사용하는 필드):**

- `answer`: string
- `conversationId`: string (첫 응답 시 또는 기존 대화 시)
- `sources`: array (출처 목록)
- `fromFixedAnswer`: boolean
- `error`: 에러 시 메시지

**Chat.jsx에서 API를 건드리지 말아야 할 부분:**

- **body 구조:** `cloneId`, `conversationId`, `messages` 이름/형식 변경 금지.
- **hist 구성:** `msgs` → `{ role, content }[]` 변환 후 마지막에 user 메시지 추가하는 로직 유지.
- **응답 처리:** `d.conversationId` → `setConversationId`, `d.answer` → 메시지 추가, `d.sources` → 출처 표시. 필드 이름 변경 금지.

**사이드바만 수정할 경우:**  
`/api/chat` 호출 코드(send 함수), body, 응답 파싱은 **전부 그대로 두고**, 레일/오버레이/레이아웃/스타일만 수정하면 됨.

---

## 5. 수정 권장 순서 (사이드바만 다룰 때)

1. **chat-claude.css**  
   - `.chat-claude-rail`, `.chat-claude-rail-overlay`, `.chat-claude-rail-*` 만 수정.  
   - 100dvh, nav 높이, flex 구조는 유지.

2. **Chat.jsx**  
   - 레일/햄버거/오버레이 JSX와 클래스명·이벤트만 수정.  
   - `send`, `msgs`, `conversationId`, `convFromUrl` 로드, `refreshRail`, API 호출부는 변경하지 않음.

3. **ChatPage.jsx**  
   - Chat에 넘기는 props 계약 유지. (clone, subscribed, freeUsed, setFreeUsed, surveyDone, setSurveyDone, isDbClone)

4. **api/chat.js**  
   - 사이드바 작업에서는 수정하지 않음.

---

## 6. 적용한 수정 (사이드바)

- **오버레이:** `aria-hidden={!railOpen}` — 레일이 닫혀 있을 때 보조기술 트리에서 제외.
- **오버레이·레일:** `Escape` 키로 레일 닫기 (`onKeyDown`). 모바일에서 레일 열린 상태에서 키보드 사용 시 Escape로 닫을 수 있음.
- **레일:** `aria-label="대화 목록"` 추가.

API·상태·100dvh 구조는 변경하지 않음.
