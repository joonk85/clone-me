# 🧪 QA Agent — Quality Assurance
> 항상 BRAIN.md를 먼저 읽으세요.

## 역할
버그 발견, 테스트 시나리오 작성, RAG 품질 검증, 출시 전 체크리스트를 담당합니다.

## 테스트 체크리스트

### 인증
- [ ] 이메일 형식 검증
- [ ] 비밀번호 최소 8자리
- [ ] 중복 이메일 에러 처리
- [ ] 이메일 인증 미완료 시 제한
- [ ] 이메일 인증 완료 → /signup/verified → /my 이동
- [ ] 비밀번호 찾기 이메일 발송
- [ ] 첫 가입 → /onboarding 이동
- [ ] Protected Routes: 비로그인 → /login 리다이렉트

### 토큰
- [ ] 가입 시 보너스 5토큰 자동 지급 확인
- [ ] bonus_tokens 테이블에 30일 만료 설정 확인
- [ ] 보너스 토큰 먼저 차감 (expires_at 빠른 순)
- [ ] 보너스 소진 후 구매 토큰 차감 확인
- [ ] 토큰 0 시 대화 차단 + 충전 유도
- [ ] Mock 충전 시 즉시 잔액 반영
- [ ] 이용 내역 필터 (전체/충전/사용/보너스/만료)

### 구독별 토큰 차감 우선순위 테스트
- [ ] A. clone_subscriptions 활성 시 → monthly_usage 체크, 토큰 차감 없음 확인
- [ ] A. monthly_usage 200회 초과 시 → 대화 차단 확인
- [ ] B. pass_subscriptions 활성 시 → pass_balance에서 차감 (monthly_usage 아님)
- [ ] B. 제휴 마스터 + 패스 → actual_price = token_price × 50% 적용 확인
- [ ] B. pass_balance 부족 시 → 대화 차단 + 충전 유도
- [ ] C. 구독 없음 → free_trial_usage 차감 (토큰 차감 없음)
- [ ] D. 무료체험 소진 → bonus_tokens → purchased_balance 순서 차감 확인

### 무료 체험
- [ ] 클론당 5회 (FREE_BASE) 확인
- [ ] 설문 완료 시 +10회 (FREE_BONUS) 확인
- [ ] free_trial_usage 클론별 독립 추적
- [ ] 체험 2회 남음 → cyan 배너
- [ ] 체험 1회 남음 → amber 배너
- [ ] 체험 소진 → 전환 카드 (블러+충전/구독 유도)

### RAG 파이프라인
- [ ] 파일 업로드 → 청크 생성 → clone_chunks 저장
- [ ] 메타데이터 정확성 (파일명/페이지/섹션/타임스탬프)
- [ ] 답변 생성 시 TOP_K=5 청크 검색
- [ ] message_sources에 청크 ID 기록
- [ ] file_reference_stats 참조 횟수 업데이트
- [ ] 출처 표시 UI: PDF→페이지, SRT→타임스탬프
- [ ] 고정 답변 우선 적용 확인
- [ ] 자료 범위 외 질문 → "모르겠습니다" 처리 (quality_no_answer=true)

### 클론 테스트 10가지 시나리오
- [ ] 자기소개 테스트
- [ ] AI 정체성 질문
- [ ] 핵심 전문 지식
- [ ] 어투 일관성
- [ ] 자료 범위 외 처리
- [ ] 케이스 활용
- [ ] 반론 처리
- [ ] 추천/비추천
- [ ] 감정적 질문 대응
- [ ] 연속 대화 일관성
→ 결과: ✅/⚠️/❌ + 권장 개선사항

### 품질 점수
- [ ] 파일 업로드 시 quality_score 자동 재계산 (recalcQualityScore 호출)
- [ ] SRT 업로드 → +15점 (A 카테고리)
- [ ] SNS/뉴스레터 업로드 → +15점 (A 카테고리, SRT 외)
- [ ] PDF/DOCX 업로드 → +15점 (B 카테고리)
- [ ] 총 단어수 10,000자 이상 → +10점
- [ ] 총 단어수 50,000자 이상 → 추가 +10점 (누적 아님, 별도 조건)
- [ ] Notion 연동 → +5점
- [ ] C 카테고리 케이스 파일 5개 이상 → +10점
- [ ] D 카테고리 판단기준 문서 있음 → +10점  ← 신규
- [ ] 고정 답변 (fixed_answers) 5개 이상 등록 → +10점  ← 신규
- [ ] 최대 100점 달성 시나리오 확인 (모든 조건 충족)  ← 신규
- [ ] 점수 색상: 75+초록(gn) / 50~74 cyan(cy) / ~49 amber(am)

### 채팅
- [ ] welcomeMsg 첫 메시지 자동 표시
- [ ] 메시지 전송 후 자동 스크롤
- [ ] Enter 키 전송
- [ ] 로딩 중 중복 전송 방지
- [ ] 타이핑 인디케이터 (점 3개)
- [ ] 인챗 설문 (survey_enabled=true 시)
- [ ] 피드백 팝업 (3번째 교환 후)
- [ ] 출처 표시 (citation=true 시)
- [ ] 신고 버튼 동작

### 마스터 등록 & 인증
- [ ] 마스터 등록 즉시 활성화
- [ ] 서류 업로드 즉시 is_verified=true + ✓ 배지
- [ ] 마이페이지에 마스터 탭 추가 확인
- [ ] 배지 표시: 카드/프로필/채팅 헤더

### 모바일
- [ ] iOS Safari 테스트
- [ ] Android Chrome 테스트
- [ ] 채팅 100dvh + 키보드 올라올 때 레이아웃
- [ ] 하단 탭바 Safe Area
- [ ] 터치 타겟 44px 이상

### 보안
- [ ] Supabase RLS: 본인 데이터만 접근
- [ ] SERVICE_ROLE_KEY 클라이언트 노출 없음
- [ ] 파일 업로드 타입 검증 (PDF/DOCX/TXT/SRT만)
- [ ] 파일 용량 제한 (50MB)

## 알려진 이슈 (데모 v28에서)
- `return<JSX>` → `return <JSX>` (공백 필수)
- `position:fixed` → iframe 내 `position:sticky` 사용
- monthly state 선언 순서: canSend 변수 전에 monthly 선언 필요
- 채팅 높이: `height:660px` + `flex:1` 조합

## 버그 리포트 템플릿
```
## 버그 제목
환경: iOS/Android/Desktop, Chrome/Safari
재현:
1.
2.
예상: / 실제:
```

---

## PRD v4.2 최종 수정사항 테스트 (2026.03 추가)

### slug 테스트
- [ ] 마스터 등록 시 slug 자동 생성 확인
- [ ] 한글 이름 slug 변환 확인 (예: "김민준" → "김민준" or "kimjinjun")
- [ ] 중복 slug 발생 시 suffix 자동 추가 (예: "kimjinjun2")
- [ ] clone.me/@{slug} 공유 링크 접근 확인
- [ ] 마켓플레이스 카드 → 프로필 URL에 slug 반영 확인

### 재구독 테스트 (partial index)
- [ ] 구독 취소 후 동일 클론 재구독 가능 확인
- [ ] 활성 구독 중 동일 클론 중복 구독 불가 확인
- [ ] clone_subscriptions에 취소된 row와 신규 active row 공존 확인

### 컬러 피커 테스트
- [ ] 클론 만들기 Step 2에 컬러 피커 표시 확인
- [ ] 컬러 선택 시 아바타 색상 즉시 반영 확인
- [ ] 선택한 컬러가 마켓플레이스 카드에 반영 확인
- [ ] 채팅 화면 아바타 + 버튼에 클론 컬러 반영 확인
- [ ] 기본값 #63d9ff (cyan) 확인

### security_delete_after_training 테스트
- [ ] DB 기본값 false (OFF) 확인
- [ ] UI에 "[기본 OFF] ← 원본 보관 권장" 표시 확인
- [ ] ON 설정 시 경고 메시지 표시 확인
- [ ] OFF 상태: 파일 삭제 없이 Storage 보관 확인

### process-file 파일 전달 테스트
- [ ] 대용량 PDF (3MB 이상) base64 변환 후 req.body 전달 시 오류 없는지 확인
- [ ] 서버에서 Buffer.from(fileBuffer, 'base64') 정상 변환 확인
- [ ] 처리 완료 후 clone_chunks 저장 확인
- [ ] .extracted.txt Storage 저장 확인
