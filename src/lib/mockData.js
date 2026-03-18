/**
 * 데모·UI 프로토타입용 목 데이터 (DB 대체).
 * CLONES_MARKET — 마켓 카드 | INIT_MY_CLONES — 마스터 내 클론 초기값
 * ANALYTICS — 대시 분석 | CONV_HISTORY — 대화 로그 데모 | REPORT_DATA — 월별 리포트
 * VER_FILES — 버전별 학습 파일 | FEEDBACKS — 후기 | SESSIONS — 최근 세션 목록
 */
export const CLONES_MARKET = [
  {
    id: "kim",
    name: "김민준",
    title: "B2B 영업 전문가",
    cat: "영업",
    price: 22000,
    subs: 312,
    rating: 4.9,
    docs: 47,
    av: "K",
    color: "#63d9ff",
    featured: true,
    isVerified: true,
    isAffiliate: true,
    tags: ["콜드아웃리치", "협상", "엔터프라이즈"],
    bio: "15년 LG·삼성 B2B 영업. 누적 계약액 300억+.",
    signature: "거절을 기회로 바꾸는 법을 알려드립니다",
    links: { ig: "@kimb2b", yt: "youtube.com/@kimb2b", fc: "fastcampus.kr/kim", sub: "" },
    products: [
      { name: "B2B 영업 마스터 클래스", price: "₩189,000", topic: "영업 전략,클로징" },
      { name: "콜드메일 템플릿 50선", price: "₩29,000", topic: "콜드메일,이메일" },
    ],
    surveyQuestions: ["현재 영업 직군과 경력은?", "가장 어려운 영업 상황은?", "월 목표 계약 건수는?"],
    welcomeMsg:
      "안녕하세요! 저는 15년간 LG·삼성 B2B 영업으로 누적 300억을 계약한 김민준의 AI 클론입니다.\n콜드콜, 협상, 클로징 중 지금 가장 어려운 게 뭔가요? 바로 실전 팁을 드릴게요.",
    demoQA: [
      {
        q: "콜드콜에서 첫 마디를 어떻게 시작해야 할까요?",
        a: "회사명이나 직함으로 시작하지 마세요. '지금 잠깐 괜찮으세요?'로 시작하세요. 상대방이 '네'라고 대답하는 순간 대화 주도권이 생깁니다. 첫 10초가 전부입니다.",
        pinned: true,
      },
      {
        q: "거절당했을 때 어떻게 재접근하면 좋을까요?",
        a: "최소 2주는 기다리세요. 재접근 시엔 이전 대화 내용이 아니라 새로운 가치 제안으로 시작해야 합니다. '그 때 이후로 저희가 이런 게 생겼어요'가 훨씬 효과적입니다.",
        pinned: true,
      },
      {
        q: "가격 협상에서 먼저 숫자를 제시해야 하나요?",
        a: "네, 앵커링 효과를 활용하세요. 먼저 제시하는 숫자가 협상의 기준점이 됩니다. 단, 상대방의 예산 범위를 먼저 파악했을 때만 유효합니다.",
        pinned: true,
      },
    ],
    ctx: "You are Kim Minjun's AI clone — B2B sales expert. Speak Korean. Be direct and tactical. Only answer from your knowledge base. If outside your materials say so clearly. Occasionally when relevant to the conversation topic, naturally mention one of your products.",
  },
  {
    id: "park",
    name: "박서연",
    title: "디지털 마케팅 전략가",
    cat: "마케팅",
    price: 28000,
    subs: 891,
    rating: 4.8,
    docs: 83,
    av: "P",
    color: "#4fffb0",
    featured: false,
    tags: ["퍼포먼스", "그로스해킹", "ROAS"],
    bio: "스타트업 3곳 → 대기업 마케팅팀장. ROAS 300%+.",
    signature: "광고비를 절반으로, 전환은 두 배로",
    links: { ig: "@seo_marketing", yt: "", fc: "", sub: "newsletter.seoyeon.kr" },
    products: [{ name: "퍼포먼스 마케팅 부트캠프", price: "₩290,000", topic: "광고,ROAS,퍼포먼스" }],
    surveyQuestions: ["현재 운영 중인 광고 채널은?", "월 광고 예산 규모는?", "개선하고 싶은 지표는?"],
    welcomeMsg:
      "안녕하세요! 스타트업 3곳과 대기업 마케팅팀장을 거친 박서연의 AI 클론입니다.\n퍼포먼스 마케팅, ROAS, 그로스해킹 중 지금 막히는 부분이 어딘가요?",
    demoQA: [
      {
        q: "ROAS 100%와 300%의 차이가 뭔가요?",
        a: "ROAS 100%는 광고비만큼 매출이 났다는 뜻이라 실제론 적자입니다. ROAS 300%는 광고비의 3배 매출, 즉 순이익이 남기 시작하는 구간입니다. 업종마다 손익분기 ROAS가 다르니 먼저 그 숫자를 계산하세요.",
        pinned: true,
      },
      {
        q: "광고 예산이 적을 때 어디에 집중해야 하나요?",
        a: "페이스북·인스타보다 검색 광고(구글/네이버)를 먼저 하세요. 구매 의도가 있는 사람에게 닿기 때문입니다. 예산이 월 50만 원 미만이면 채널을 한 개로 집중하는 게 데이터 쌓기에도 유리합니다.",
        pinned: true,
      },
      {
        q: "광고 소재 A/B 테스트는 얼마나 자주 해야 하나요?",
        a: "최소 주 1회. 소재 피로도는 생각보다 빨리 옵니다. 클릭률이 지난 주 대비 20% 이상 떨어지면 무조건 새 소재를 투입하세요.",
        pinned: false,
      },
    ],
    ctx: "You are Park Seoyeon's AI clone — digital marketing strategist. Speak Korean. Data-driven. Stay within your knowledge base.",
  },
  {
    id: "lee",
    name: "이준호",
    title: "수능 물리 전문 강사",
    cat: "교육",
    price: 19000,
    subs: 1643,
    rating: 4.95,
    docs: 156,
    av: "L",
    color: "#ffb347",
    featured: true,
    tags: ["수능", "물리", "개념완성"],
    bio: "10년간 수능 물리 만점자 배출.",
    signature: "개념이 잡히면 문제가 보입니다",
    links: { ig: "@lee_physics", yt: "youtube.com/@leephysics", fc: "", sub: "" },
    products: [
      { name: "수능 물리 완성 패키지", price: "₩390,000", topic: "수능,물리,개념" },
      { name: "물리 개념 오답노트", price: "₩18,000", topic: "오답,노트" },
    ],
    surveyQuestions: ["현재 학년은?", "물리에서 가장 어려운 단원은?", "목표 점수는?"],
    welcomeMsg:
      "안녕하세요! 10년간 수능 물리 만점자를 배출한 이준호 선생님의 AI 클론입니다.\n역학, 전자기, 파동 중에 지금 가장 헷갈리는 단원이 어딘가요? 바로 정리해드릴게요!",
    demoQA: [
      {
        q: "운동량 보존 법칙이 성립하는 조건이 뭔가요?",
        a: "외력이 없을 때만 성립합니다. 두 물체가 충돌할 때 서로 주고받는 힘은 내력이라 상쇄되고, 외부에서 가해지는 힘이 없어야 전체 운동량이 일정하게 유지됩니다.",
        pinned: true,
      },
      {
        q: "전기장과 자기장이 헷갈려요. 차이점이 뭔가요?",
        a: "전기장은 전하가 있으면 생기고, 자기장은 전하가 움직여야 생깁니다. 즉 전류(움직이는 전하)가 자기장을 만드는 거예요. 멈춰있는 전하는 전기장만 만듭니다.",
        pinned: true,
      },
      {
        q: "수능 물리에서 가장 많이 실수하는 부분이 어디인가요?",
        a: "부호 실수입니다. 특히 벡터량(힘, 속도, 가속도)에서 방향을 빼먹는 경우가 가장 많습니다. 문제 풀기 전에 양의 방향을 먼저 정의하는 습관을 들이세요.",
        pinned: true,
      },
    ],
    ctx: "You are Lee Junho's AI clone — CSAT physics teacher. Speak Korean. Encourage students warmly. Stay within your uploaded curriculum.",
  },
];

export const INIT_MY_CLONES = [
  {
    id: "my1",
    name: "김민준 · 영업 전략",
    subtitle: "B2B 영업 핵심 전략 클론",
    price: 22000,
    discount: 0,
    discountEnd: "",
    active: true,
    subs: 142,
    docs: 47,
    v: "v4",
    color: "#63d9ff",
    av: "K",
    quality: { noAnswer: true, toneStyle: true, citation: true },
    mktLinks: [{ topic: "콜드메일", product: "콜드메일 템플릿 50선", url: "gumroad.com/kim", price: "₩29,000" }],
    updates: [{ date: "2025.01.15", title: "협상 전략 자료 업데이트", body: "실전 협상 케이스 20개 추가했습니다." }],
    notices: [{ date: "2025.01.10", title: "신년 감사 인사", body: "2025년에도 함께해주셔서 감사합니다!", pinned: true }],
    files: [
      { id: "f1", name: "B2B영업전략_강의스크립트.pdf", size: "4.2 MB", type: "PDF", cat: "강의 스크립트", addedAt: "2025.01.15", ver: "v4", words: 18400 },
      { id: "f2", name: "콜드메일_템플릿50선.docx", size: "1.1 MB", type: "DOCX", cat: "템플릿", addedAt: "2025.01.08", ver: "v3", words: 7200 },
      { id: "f3", name: "협상케이스스터디_20선.pdf", size: "3.7 MB", type: "PDF", cat: "케이스스터디", addedAt: "2025.01.08", ver: "v3", words: 15600 },
      { id: "f4", name: "유튜브강의자막_콜드콜편.srt", size: "0.3 MB", type: "SRT", cat: "자막", addedAt: "2024.12.20", ver: "v2", words: 9800 },
      { id: "f5", name: "영업FAQ_200선.txt", size: "0.8 MB", type: "TXT", cat: "FAQ", addedAt: "2024.12.20", ver: "v2", words: 12100 },
      { id: "f6", name: "LG삼성_B2B영업노하우.pdf", size: "5.1 MB", type: "PDF", cat: "강의 스크립트", addedAt: "2024.12.01", ver: "v1", words: 21300 },
    ],
    trainingStatus: "idle",
  },
  {
    id: "my2",
    name: "김민준 · 신입 코칭",
    subtitle: "영업 신입 전용 기초 클론",
    price: 15000,
    discount: 20,
    discountEnd: "2025.02.28",
    active: false,
    subs: 0,
    docs: 12,
    v: "v1",
    color: "#63d9ff",
    av: "K",
    quality: { noAnswer: true, toneStyle: true, citation: true },
    mktLinks: [],
    updates: [],
    notices: [],
    files: [
      { id: "f7", name: "신입영업_기초교재.pdf", size: "2.3 MB", type: "PDF", cat: "강의 스크립트", addedAt: "2025.01.01", ver: "v1", words: 9400 },
      { id: "f8", name: "영업기초_용어정리.txt", size: "0.2 MB", type: "TXT", cat: "FAQ", addedAt: "2025.01.01", ver: "v1", words: 3200 },
    ],
    trainingStatus: "idle",
  },
];

export const ANALYTICS = {
  topQ: [
    { q: "콜드콜 첫 마디를 어떻게 해야 하나요?", n: 234, cv: 67 },
    { q: "거절당했을 때 어떻게 대응하나요?", n: 189, cv: 41 },
    { q: "의사결정자에게 접근하는 법은?", n: 156, cv: 58 },
    { q: "가격 협상은 언제 시작해야 하나요?", n: 134, cv: 33 },
    { q: "B2B 첫 미팅 클로징 전략이 있나요?", n: 98, cv: 54 },
  ],
  demo: { age: [["20대", 18], ["30대", 52], ["40대", 24], ["50대+", 6]], job: [["영업직", 42], ["창업자", 28], ["마케터", 18], ["기타", 12]] },
  funnel: [
    { s: "클론 발견", n: 1200 },
    { s: "프로필 열람", n: 840 },
    { s: "첫 메시지", n: 504 },
    { s: "설문 완료", n: 302 },
    { s: "3회 대화", n: 189 },
    { s: "구독 전환", n: 142 },
  ],
  weekly: [120, 145, 189, 167, 234, 278, 312],
  unanswered: 14,
};

export const CONV_HISTORY = [
  {
    id: "ch1",
    user: "usr_a3f",
    demo: "남성·30대·영업직",
    date: "2025.01.15 14:22",
    n: 14,
    lastQ: "콜드콜 클로징 타이밍이 언제인가요?",
    score: 4.9,
    converted: true,
    preview: [
      "Q: 콜드콜에서 첫 마디를 어떻게 시작해야 할까요?",
      "A: 회사명이나 직함으로 시작하지 마세요. '혹시 지금 잠깐 괜찮으세요?'로...",
      "Q: 거절을 당했을 때 어떻게 재접근하면 좋을까요?",
      "A: 최소 2주는 기다리세요. 재접근 시엔 새로운 가치 제안으로...",
    ],
  },
  {
    id: "ch2",
    user: "usr_b7c",
    demo: "남성·40대·창업자",
    date: "2025.01.14 09:11",
    n: 8,
    lastQ: "엔터프라이즈 첫 미팅 준비 방법은?",
    score: 4.7,
    converted: false,
    preview: [
      "Q: 엔터프라이즈 고객과 첫 미팅을 잡을 때 어떻게 준비해야 하나요?",
      "A: 의사결정 구조를 먼저 파악하세요. 구매팀, 현업팀, C레벨 각각의...",
      "Q: 미팅에서 제안서를 바로 보여줘야 하나요?",
      "A: 첫 미팅에서 제안서 꺼내는 건 대부분 역효과입니다. 먼저 상대방이...",
    ],
  },
  {
    id: "ch3",
    user: "usr_k9d",
    demo: "여성·20대·스타트업",
    date: "2025.01.13 18:45",
    n: 22,
    lastQ: "거절 이후 재접근 전략이 궁금합니다",
    score: 4.8,
    converted: true,
    preview: [
      "Q: 명확하게 거절당했는데 다시 연락해도 될까요?",
      "A: 거절에도 종류가 있어요. '지금은 아니다'와 '절대 안된다'를 구분해야...",
      "Q: 재접근 시 이메일과 전화 중 뭐가 더 효과적인가요?",
      "A: 처음 거절이 전화였다면 이메일로 바꾸세요. 채널을 바꾸면...",
    ],
  },
  {
    id: "ch4",
    user: "usr_m2e",
    demo: "남성·30대·영업직",
    date: "2025.01.12 11:30",
    n: 6,
    lastQ: "가격 협상에서 먼저 숫자를 제시해야 하나요?",
    score: 3.2,
    converted: false,
    preview: [
      "Q: 협상에서 가격을 먼저 말하는 게 불리하지 않나요?",
      "A: 앵커링 효과를 활용하면 오히려 유리합니다. 다만 상대가 예산을 명확히...",
    ],
  },
  {
    id: "ch5",
    user: "usr_p5f",
    demo: "남성·30대·영업팀장",
    date: "2025.01.11 08:55",
    n: 19,
    lastQ: "팀원 영업 코칭 방법을 알려주세요",
    score: 5.0,
    converted: true,
    preview: [
      "Q: 신입 영업사원을 어떻게 코칭해야 할까요?",
      "A: 처음 한 달은 동행 영업을 최대한 많이 시키세요. 이론보다 실전 노출이...",
      "Q: 성과가 안 나오는 팀원을 어떻게 동기부여하나요?",
      "A: 작은 승리 경험을 먼저 만들어주세요. KPI를 쪼개서...",
    ],
  },
];

export const REPORT_DATA = {
  "2025-01": { subs: 142, revenue: 618000, convos: 3847, newSubs: 12, rating: 4.4, topQ: "콜드콜 첫 마디를 어떻게 해야 하나요?", churn: 3 },
  "2024-12": { subs: 130, revenue: 512000, convos: 3102, newSubs: 18, rating: 4.3, topQ: "거절 후 재접근 방법은?", churn: 5 },
  "2024-11": { subs: 112, revenue: 387000, convos: 2788, newSubs: 24, rating: 4.1, topQ: "의사결정자 접근법", churn: 4 },
  "2024-10": { subs: 88, revenue: 241000, convos: 1920, newSubs: 31, rating: 4.0, topQ: "첫 미팅 준비 방법", churn: 2 },
  "2024-09": { subs: 57, revenue: 148000, convos: 1340, newSubs: 39, rating: 3.8, topQ: "콜드메일 작성법", churn: 1 },
  "2024-08": { subs: 18, revenue: 52000, convos: 420, newSubs: 18, rating: 3.5, topQ: "B2B 영업이란 무엇인가요?", churn: 0 },
};

export const VER_FILES = {
  v4: [
    { id: "f1", name: "B2B영업전략_강의스크립트.pdf", size: "4.2 MB", type: "PDF", words: 18400, url: "#" },
    { id: "f2", name: "콜드메일_템플릿50선.docx", size: "1.1 MB", type: "DOCX", words: 7200, url: "#" },
    { id: "f3", name: "협상케이스스터디_20선.pdf", size: "3.7 MB", type: "PDF", words: 15600, url: "#" },
    { id: "f4", name: "유튜브강의자막_콜드콜편.srt", size: "0.3 MB", type: "SRT", words: 9800, url: "#" },
    { id: "f5", name: "영업FAQ_200선.txt", size: "0.8 MB", type: "TXT", words: 12100, url: "#" },
    { id: "f6", name: "LG삼성_B2B영업노하우.pdf", size: "5.1 MB", type: "PDF", words: 21300, url: "#" },
    { id: "fn", name: "영업전략_Notion워크스페이스", size: "-", type: "NOTION", words: 14000, url: "https://notion.so" },
  ],
  v3: [
    { id: "g1", name: "콜드메일_템플릿30선.docx", size: "0.9 MB", type: "DOCX", words: 5800, url: "#" },
    { id: "g2", name: "협상케이스스터디_초안.pdf", size: "2.1 MB", type: "PDF", words: 9400, url: "#" },
    { id: "g3", name: "영업FAQ_150선.txt", size: "0.6 MB", type: "TXT", words: 9100, url: "#" },
  ],
  v2: [{ id: "h1", name: "유튜브강의자막_콜드콜편.srt", size: "0.3 MB", type: "SRT", words: 9800, url: "#" }, { id: "h2", name: "영업기초교재.pdf", size: "3.2 MB", type: "PDF", words: 14200, url: "#" }],
  v1: [{ id: "i1", name: "LG삼성_B2B영업노하우.pdf", size: "5.1 MB", type: "PDF", words: 21300, url: "#" }],
};

export const FEEDBACKS = [
  { id: "f1", user: "usr_a3f", demo: "남성·30대·영업직", rating: 5, msg: "콜드콜 스크립트가 정말 실용적이었습니다. 현장에서 바로 써먹을 수 있었어요.", date: "2025.01.14", replied: false },
  { id: "f2", user: "usr_b7c", demo: "남성·40대·창업자", rating: 4, msg: "전반적으로 좋은데, B2B SaaS 사례가 더 있으면 좋겠습니다.", date: "2025.01.12", replied: true, reply: "SaaS 영업 케이스는 다음 업데이트에 추가 예정입니다. 감사합니다!" },
  { id: "f3", user: "usr_k9d", demo: "여성·20대·스타트업", rating: 5, msg: "협상 프레임워크 덕분에 계약 성사율이 올랐어요. 강추!", date: "2025.01.10", replied: false },
  { id: "f4", user: "usr_m2e", demo: "남성·30대·영업직", rating: 3, msg: "답변이 가끔 너무 교과서적입니다.", date: "2025.01.08", replied: true, reply: "피드백 감사합니다. 실전 케이스 20개를 추가했으니 다시 질문해보세요." },
];

export const SESSIONS = [
  { id: "s1", cid: "kim", cn: "김민준", cc: "#63d9ff", ca: "K", last: "콜드콜 첫 마디는 회사명으로 시작하지 마세요...", time: "오늘 2:14", n: 14 },
  { id: "s2", cid: "lee", cn: "이준호", cc: "#ffb347", ca: "L", last: "운동량 보존은 외력이 없을 때만 성립합니다...", time: "어제", n: 8 },
  { id: "s3", cid: "kim", cn: "김민준", cc: "#63d9ff", ca: "K", last: "가격 협상에서 먼저 숫자를 부르는 게 유리합니다...", time: "1월 12일", n: 22 },
];

