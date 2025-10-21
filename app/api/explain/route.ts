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

전체 문맥을 고려하여:
1. 선택된 영역의 텍스트, 수식, 기호를 정확하게 추출해주세요. LaTeX 수식이 있다면 LaTeX 형식으로 표현해주세요.
2. 앞뒤 문맥을 파악하여, 선택된 부분이 전체 내용에서 어떤 역할을 하는지 이해하고 ${difficultyLevel} 설명해주세요.
3. 문맥상 자연스럽고 이해하기 쉬운 실생활 비유를 제공해주세요.

다음 JSON 형식으로 답변해주세요:
{
  "extractedText": "추출된 텍스트/수식",
  "explanation": "전체 문맥을 고려한 쉬운 설명",
  "analogy": "실생활 비유"
}`
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
