import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function POST(req: NextRequest) {
  try {
    const { text, difficulty } = await req.json();

    if (!text) {
      return NextResponse.json({ error: '텍스트가 필요합니다.' }, { status: 400 });
    }

    // 난이도별 프롬프트 설정
    const difficultyPrompts = {
      easy: '초등학생도 이해할 수 있을 만큼 매우 쉽고 간단한 말로 설명해주세요. 일상적인 단어만 사용하세요.',
      medium: '중학생 수준으로 이해할 수 있게 설명하되, 실생활 예시를 포함해주세요.',
      hard: '고등학생 이상이 이해할 수 있는 수준으로, 전문 용어를 사용하되 각 용어를 풀어서 설명해주세요.',
    };

    const prompt = `다음 텍스트를 ${difficultyPrompts[difficulty as keyof typeof difficultyPrompts]}

텍스트:
${text}

다음 형식으로 답변해주세요:

1. 쉬운 설명: [여기에 설명]
2. 찰떡 비유: [실생활 비유나 예시]
3. 핵심 요약: [한 문장으로 요약]`;

    // OpenAI API를 사용하여 설명 생성
    // 실제 사용 시에는 환경 변수로 API 키를 설정해야 합니다
    if (!process.env.OPENAI_API_KEY) {
      // API 키가 없을 경우 더미 응답 반환
      return NextResponse.json({
        explanation: generateDummyExplanation(text, difficulty),
        analogy: generateDummyAnalogy(difficulty),
        visualization: '이 개념을 그래프로 표현하면: X축은 시간, Y축은 값을 나타냅니다.',
      });
    }

    const { text: result } = await generateText({
      model: openai('gpt-4-turbo'),
      prompt,
      maxTokens: 500,
    });

    // 응답 파싱
    const explanationMatch = result.match(/1\. 쉬운 설명: (.+?)(?=2\.|$)/s);
    const analogyMatch = result.match(/2\. 찰떡 비유: (.+?)(?=3\.|$)/s);
    const summaryMatch = result.match(/3\. 핵심 요약: (.+?)$/s);

    return NextResponse.json({
      explanation: explanationMatch?.[1]?.trim() || result,
      analogy: analogyMatch?.[1]?.trim() || '',
      visualization: '텍스트 기반 시각화 (추후 이미지 생성 기능 추가 예정)',
    });
  } catch (error) {
    console.error('설명 생성 중 오류:', error);
    return NextResponse.json(
      { error: '설명을 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 더미 설명 생성 함수 (API 키가 없을 때 사용)
function generateDummyExplanation(text: string, difficulty: string): string {
  const explanations = {
    easy: `"${text}"를 정말 쉽게 설명하면, 이것은 복잡한 개념을 간단하게 만드는 것을 의미해요. 마치 큰 퍼즐을 작은 조각들로 나누는 것처럼요!`,
    medium: `"${text}"는 전문 분야에서 자주 사용되는 개념입니다. 예를 들어, 핸드폰에서 앱을 사용할 때 이와 비슷한 원리가 작동하고 있어요.`,
    hard: `"${text}"는 학술적으로 중요한 개념입니다. 이 용어는 특정 분야에서 정의된 의미를 가지며, 관련 이론과 실무에서 핵심적인 역할을 합니다.`,
  };

  return explanations[difficulty as keyof typeof explanations] || explanations.easy;
}

function generateDummyAnalogy(difficulty: string): string {
  const analogies = {
    easy: '이것은 마치 레고 블록을 쌓는 것과 같아요. 작은 조각들을 하나씩 쌓아서 큰 작품을 만드는 거죠!',
    medium: '이것은 요리 레시피를 따라하는 것과 비슷합니다. 각 단계를 순서대로 따라가면 맛있는 요리가 완성되는 것처럼요.',
    hard: '이것은 교향악단의 연주와 같습니다. 여러 악기가 조화롭게 연주되어야 아름다운 음악이 완성되듯이, 각 요소가 유기적으로 작동해야 합니다.',
  };

  return analogies[difficulty as keyof typeof analogies] || analogies.easy;
}
