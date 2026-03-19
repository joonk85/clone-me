# 마스터 전환 스위치 — Side Effect 체크

> 멤버/마스터 모드 전환 및 레일·헤더 분기 정리.

---

## 1. 변경 요약

| 케이스 | 우측 상단 | Left Rail |
|--------|-----------|-----------|
| **비로그인** | 로그인 버튼 | 홈, 마스터 찾기. 하단: 로그인 |
| **멤버 모드** | 토큰 pill + "내 클론 만들기" | 홈, 마스터 찾기, 대화 히스토리. 하단: 내 이름(마이페이지/설정) + "내 클론 만들기" (미등록→/master-register, 등록됨→마스터 모드 전환) |
| **마스터 모드** | 토큰 pill + [멤버\|마스터] 토글 | 홈, 내 클론 목록(스크롤+새 클론 만들기). 하단: 내 이름(마스터 스튜디오/설정) + "멤버로 전환" |

---

## 2. 상태 관리

- **masterMode:** `"member"` \| `"master"` — `AppStateContext`에 저장.
- **persist:** `localStorage` 키 `clone_me_master_mode`로 유지 (새로고침 후에도 유지).
- **마스터 등록 여부:** `fetchMasterForUser` (masters 테이블) + `userRow?.has_master_profile` 확인.

---

## 3. 영향 파일

| 파일 | 변경 |
|------|------|
| `src/contexts/AppStateContext.jsx` | `masterMode`, `setMasterMode` 추가. `readMasterMode()` 초기값, localStorage 동기화, storage 이벤트 수신. |
| `src/common/AppShell.jsx` | `useAppState()`로 masterMode 사용. `masterRow`, `masterClones` 상태. `fetchClonesForMaster` 호출. 레일 메뉴·중간·하단을 isMaster/masterMode별 분기. 헤더 우측: 마스터일 때 [멤버 \| 마스터] 토글. |
| `src/lib/supabaseQueries.js` | 변경 없음. `fetchMasterForUser`, `fetchClonesForMaster` 기존 사용. |

---

## 4. 공통

- CSS Variables만 사용.
- Heroicons 사용 (PlusCircleIcon, ListBulletIcon, ArrowPathIcon 등).
- 모바일 대응 유지 (collapse 시 아이콘만, 햄버거·오버레이 동일).

---

## 5. 적용 완료 내역

- AppStateContext: `masterMode` state + `setMasterMode` + localStorage `clone_me_master_mode` + storage 이벤트.
- 플로우/레일 재정리: **FLOW_RAIL_SPEC.md** 참고.
- AppShell: 상단 항상 clone.me. 멤버 레일: 홈+마스터 찾기+대화 히스토리, 하단 이름 드롭업(마이페이지/설정)+"내 클론 만들기". 마스터 레일: 홈+내 클론 목록(클릭→/dashboard/:cloneId)+"새 클론 만들기", 하단 이름 드롭업(마스터 스튜디오/설정)+"멤버로 전환". 헤더: 멤버=내 클론 만들기, 마스터=토글.
