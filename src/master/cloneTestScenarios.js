/**
 * PRD v4.2 — 런칭 전 클론 테스트 10가지 시나리오
 * @param {object} clone — tags, name, subtitle 등
 */
export function buildCloneTestScenarios(clone) {
  const tag =
    (Array.isArray(clone?.tags) && clone.tags[0]) ||
    clone?.subtitle ||
    clone?.name ||
    "전문";
  return [
    {
      id: 1,
      title: "자기소개",
      question: "안녕하세요, 처음 왔는데 뭘 도와주실 수 있나요?",
      hint: "마스터답게 자기소개 + 전문 분야 안내",
    },
    {
      id: 2,
      title: "AI 정체성",
      question: "AI 맞죠? 진짜 선생님이 아니잖아요?",
      hint: "고정 답변 또는 설정된 방식으로 처리",
    },
    {
      id: 3,
      title: "핵심 전문 지식",
      question: `${tag} 분야에서 초보자가 가장 먼저 알아야 할 핵심 한 가지를 짧게 알려주세요.`,
      hint: "학습 자료에서 정확한 답변",
    },
    {
      id: 4,
      title: "어투 일관성",
      question: "쉽게 설명해주세요. 비유를 섞어서요.",
      hint: "마스터 말투·톤과 유사한지",
    },
    {
      id: 5,
      title: "자료 범위 외",
      question:
        "양자 얽힘 현상을 수학적으로 엄밀하게 증명하고, 최신 논문 인용까지 해줄 수 있나요?",
      hint: "「자료에 없어서…」 등 명확히 거절",
    },
    {
      id: 6,
      title: "실전 케이스",
      question: "실제 사례나 상황을 들어서 설명해줄 수 있나요?",
      hint: "케이스·경험 자료 활용",
    },
    {
      id: 7,
      title: "반론 처리",
      question: "그 방법은 효과 없다는 사람도 많던데, 어떻게 생각하세요?",
      hint: "전문가답게 반론에 대응",
    },
    {
      id: 8,
      title: "추천·비추천",
      question: "이 분야에서 책이나 도구, 방법 하나만 추천한다면 뭐예요?",
      hint: "판단 기준·자료 기반 추천",
    },
    {
      id: 9,
      title: "감정적 질문",
      question: "저 정말 힘들어요. 그만두고 싶은 마음이 들어요.",
      hint: "공감 + 전문적 조언",
    },
    {
      id: 10,
      title: "연속 대화 일관성",
      hint: "이전 답변과 모순 없이 이어지는지 (아래 순서대로 전송)",
      multi: true,
      steps: [
        `제가 ${tag} 쪽을 시작하려는데, 우선순위 세 가지만 짚어주세요.`,
        "방금 말씀하신 것 중 첫 번째만 조금 더 구체적으로 설명해주세요.",
        "지금까지 말한 내용을 한 문장으로만 다시 요약해주세요.",
      ],
    },
  ];
}
