import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function POST(req: NextRequest) {
  try {
    const { image, contextImage, difficulty } = await req.json();

    if (!image) {
      return NextResponse.json({ error: '이미지가 필요합니다.' }, { status: 400 });
    }

    // 난이도별 프롬프트 설정
    const difficultyPrompts = {
      easy: '초등학생도 이해할 수 있을 만큼 매우 쉽고 간단한 말로',
      medium: '중학생 수준으로 이해할 수 있게, 실생활 예시를 포함하여',
      hard: '고등학생 이상이 이해할 수 있는 수준으로, 전문 용어를 사용하되 각 용어를 풀어서',
    };

    const difficultyLevel = difficultyPrompts[difficulty as keyof typeof difficultyPrompts] || difficultyPrompts.easy;

    // OpenAI API 키가 없을 경우 더미 응답 반환
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        extractedText: '이 영역에는 복잡한 수식이나 전문 용어가 포함되어 있습니다.',
        explanation: generateDummyExplanation(difficulty),
        analogy: generateDummyAnalogy(difficulty),
        visualization: '텍스트 기반 시각화',
      });
    }

    // OpenAI Vision API를 사용하여 이미지에서 텍스트 추출 및 설명 생성
    const prompt = contextImage
      ? `다음 두 이미지를 분석해주세요:
첫 번째 이미지는 사용자가 선택한 주요 영역이고, 두 번째 이미지는 앞뒤 문맥을 포함한 더 넓은 영역입니다.

**중요**: 이 설명은 원본 텍스트를 대체하여 독자가 읽게 됩니다. 따라서 앞뒤 문장과 자연스럽게 이어져야 합니다.

전체 문맥을 고려하여:
1. 선택된 영역의 텍스트, 수식, 기호를 정확하게 추출해주세요. LaTeX 수식이 있다면 LaTeX 형식으로 표현해주세요.

2. **앞뒤 문맥을 파악**하여 선택된 부분이 전체 내용에서 어떤 역할을 하는지 이해하세요.

3. 설명을 작성할 때:
   - 앞 문장에서 이어지는 내용이라면, 자연스럽게 연결되도록 작성하세요
   - 뒤 문장으로 자연스럽게 이어질 수 있도록 마무리하세요
   - ${difficultyLevel} 설명하되, 문맥의 흐름을 끊지 마세요
   - 독립된 설명이 아닌, 문단의 일부로 읽힐 수 있도록 작성하세요

4. 문맥상 자연스럽고 이해하기 쉬운 실생활 비유를 제공해주세요.

다음 JSON 형식으로 답변해주세요:
{
  "extractedText": "추출된 텍스트/수식",
  "explanation": "앞뒤 문맥과 자연스럽게 이어지는 쉬운 설명",
  "analogy": "실생활 비유"
}

예시:
앞 문장: "이 알고리즘은 데이터를 효율적으로 처리하기 위해"
선택 영역: "분할 정복(Divide and Conquer) 기법을 사용합니다."
뒤 문장: "따라서 시간 복잡도가 크게 개선됩니다."

좋은 설명: "문제를 작은 조각으로 나눠서 각각 해결한 다음 합치는 방법을 사용합니다."
나쁜 설명: "분할 정복 기법은 큰 문제를 작은 문제로 나누는 알고리즘 설계 기법입니다. 이것은..." (앞뒤 문맥과 단절됨)`
      : `이 이미지를 분석하여 다음을 제공해주세요:

1. 이미지에 있는 모든 텍스트, 수식, 기호를 정확하게 추출해주세요. LaTeX 수식이 있다면 LaTeX 형식으로 표현해주세요.
2. 추출한 내용을 ${difficultyLevel} 설명해주세요.
3. 이해하기 쉬운 실생활 비유를 제공해주세요.

다음 JSON 형식으로 답변해주세요:
{
  "extractedText": "추출된 텍스트/수식",
  "explanation": "쉬운 설명",
  "analogy": "실생활 비유"
}`;

    const messageContent: any[] = [{ type: 'text', text: prompt }, { type: 'image', image: image }];

    // 컨텍스트 이미지가 있으면 추가
    if (contextImage) {
      messageContent.push({ type: 'image', image: contextImage });
    }

    const { text: result } = await generateText({
      model: openai('gpt-4o'),
      messages: [
        {
          role: 'user',
          content: messageContent,
        },
      ],
      maxTokens: 1000,
    });

    // JSON 응답 파싱
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({
          extractedText: parsed.extractedText || '텍스트 추출 실패',
          explanation: parsed.explanation || result,
          analogy: parsed.analogy || '',
          visualization: '이미지 기반 추출 완료',
        });
      }
    } catch (e) {
      // JSON 파싱 실패 시 전체 결과 반환
      console.error('JSON 파싱 오류:', e);
    }

    return NextResponse.json({
      extractedText: '이미지에서 추출된 내용',
      explanation: result,
      analogy: '',
      visualization: '이미지 분석 완료',
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
function generateDummyExplanation(difficulty: string): string {
  const explanations = {
    easy: '선택한 영역의 내용을 정말 쉽게 설명하면, 이것은 복잡한 개념을 간단하게 만드는 것을 의미해요. 마치 큰 퍼즐을 작은 조각들로 나누는 것처럼요!',
    medium: '이 내용은 전문 분야에서 자주 사용되는 개념입니다. 예를 들어, 핸드폰에서 앱을 사용할 때 이와 비슷한 원리가 작동하고 있어요.',
    hard: '이 내용은 학술적으로 중요한 개념입니다. 이 용어는 특정 분야에서 정의된 의미를 가지며, 관련 이론과 실무에서 핵심적인 역할을 합니다.',
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
