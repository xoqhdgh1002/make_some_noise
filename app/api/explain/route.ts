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

    // ====== 1단계: Vision API로 텍스트/수식 추출 ======
    const extractionPrompt = contextImage
      ? `다음 두 이미지를 분석해주세요:
첫 번째 이미지는 사용자가 선택한 주요 영역이고, 두 번째 이미지는 앞뒤 문맥을 포함한 더 넓은 영역입니다.

**목표**: 선택된 영역의 텍스트/수식을 정확하게 추출하고, 앞뒤 문맥을 파악하세요.

다음 JSON 형식으로 답변해주세요:
{
  "selectedText": "선택된 영역의 정확한 텍스트/수식 (LaTeX 포함)",
  "beforeContext": "선택 영역 앞부분의 텍스트 (2-3문장)",
  "afterContext": "선택 영역 뒷부분의 텍스트 (2-3문장)"
}`
      : `이 이미지에서 모든 텍스트와 수식을 정확하게 추출해주세요. LaTeX 수식은 LaTeX 형식으로 표현해주세요.

다음 JSON 형식으로 답변해주세요:
{
  "selectedText": "추출된 텍스트/수식",
  "beforeContext": "",
  "afterContext": ""
}`;

    const extractionContent: any[] = [
      { type: 'text', text: extractionPrompt },
      { type: 'image', image: image },
    ];

    if (contextImage) {
      extractionContent.push({ type: 'image', image: contextImage });
    }

    const { text: extractionResult } = await generateText({
      model: openai('gpt-4o'),
      messages: [
        {
          role: 'user',
          content: extractionContent,
        },
      ],
      maxTokens: 800,
    });

    // 추출 결과 파싱
    let selectedText = '';
    let beforeContext = '';
    let afterContext = '';

    try {
      const jsonMatch = extractionResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        selectedText = parsed.selectedText || '';
        beforeContext = parsed.beforeContext || '';
        afterContext = parsed.afterContext || '';
      }
    } catch (e) {
      console.error('1단계 JSON 파싱 오류:', e);
      selectedText = extractionResult;
    }

    if (!selectedText) {
      throw new Error('텍스트 추출 실패');
    }

    // ====== 2단계: 추출된 텍스트를 쉬운 설명으로 변환 ======
    const explanationPrompt = `당신은 전문적인 교육 콘텐츠 작성자입니다. 어려운 학술 내용을 쉽게 풀어쓰는 것이 전문입니다.

**상황**: 독자가 전공 서적을 읽다가 어려운 부분을 선택했습니다. 이 부분을 ${difficultyLevel} 설명하여 원본 텍스트를 대체해야 합니다.

**원본 텍스트**: ${selectedText}

${beforeContext ? `**앞 문맥**: ${beforeContext}` : ''}
${afterContext ? `**뒤 문맥**: ${afterContext}` : ''}

**중요 원칙**:
1. **문맥 연결성**: 설명은 앞뒤 문장과 자연스럽게 이어져야 합니다
   - 앞 문장의 내용을 받아서 시작하세요
   - 뒤 문장으로 자연스럽게 이어지도록 마무리하세요
   - 독립된 정의가 아닌, 문단의 일부처럼 작성하세요

2. **스타일 가이드**:
   - "이것은 ~입니다" 같은 정의형 표현 지양
   - 원문의 톤과 문체 유지
   - 불필요한 설명 제거, 핵심만 전달
   - 전문 용어는 일상 언어로 바꾸기

3. **비유 사용**:
   - 독자가 쉽게 이해할 수 있는 실생활 비유 제공
   - 비유는 별도 필드에 작성 (본문에 포함하지 말 것)

**좋은 예시**:
- 원문: "분할 정복(Divide and Conquer) 기법을 사용합니다."
- 앞 문맥: "이 알고리즘은 데이터를 효율적으로 처리하기 위해"
- 뒤 문맥: "따라서 시간 복잡도가 크게 개선됩니다."
- ✅ 좋은 설명: "문제를 작은 조각으로 나눠서 각각 해결한 다음 합치는 방법을 사용합니다."
- ❌ 나쁜 설명: "분할 정복 기법은 큰 문제를 작은 문제로 나누는 알고리즘 설계 기법입니다..."

다음 JSON 형식으로 답변해주세요:
{
  "explanation": "앞뒤 문맥과 자연스럽게 이어지는 쉬운 설명",
  "analogy": "실생활 비유",
  "styleNotes": "어떤 점을 고려하여 이렇게 작성했는지 (선택사항)"
}`;

    const { text: explanationResult } = await generateText({
      model: openai('gpt-4o'),
      messages: [
        {
          role: 'user',
          content: explanationPrompt,
        },
      ],
      maxTokens: 1000,
      temperature: 0.7,
    });

    // 설명 결과 파싱
    try {
      const jsonMatch = explanationResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({
          extractedText: selectedText,
          explanation: parsed.explanation || explanationResult,
          analogy: parsed.analogy || '',
          visualization: '2단계 처리 완료',
        });
      }
    } catch (e) {
      console.error('2단계 JSON 파싱 오류:', e);
    }

    return NextResponse.json({
      extractedText: selectedText,
      explanation: explanationResult,
      analogy: '',
      visualization: '2단계 처리 완료',
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
