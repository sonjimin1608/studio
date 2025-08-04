'use server';
import { generateSpanishStoryParagraph } from '@/ai/flows/generate-spanish-story';
import { analyzeSentence } from '@/ai/flows/analyze-sentence';
import type { GenerateSpanishStoryParagraphInput, GenerateSpanishStoryParagraphOutput } from '@/ai/flows/generate-spanish-story';
import type { AnalyzeSentenceOutput } from '@/ai/flows/analyze-sentence';

type GenerateStoryResult = {
  success: true;
  data: GenerateSpanishStoryParagraphOutput['paragraph'];
} | {
  success: false;
  error: string;
}

type AnalyzeSentenceResult = {
  success: true;
  data: AnalyzeSentenceOutput;
} | {
  success: false;
  error: string;
}

export async function generateStoryParagraphAction(input: GenerateSpanishStoryParagraphInput): Promise<GenerateStoryResult> {
  try {
    const result = await generateSpanishStoryParagraph(input);
    return { success: true, data: result.paragraph };
  } catch (error) {
    console.error('Error generating story paragraph:', error);
    return { success: false, error: '이야기 단락 생성에 실패했습니다. 다시 시도해주세요.' };
  }
}

export async function analyzeSentenceAction(sentence: string): Promise<AnalyzeSentenceResult> {
  try {
    const analysis = await analyzeSentence({ sentence });
    return { success: true, data: analysis };
  } catch (error) {
    console.error('Error analyzing sentence:', error);
    return { success: false, error: '문장 분석에 실패했습니다. 다시 시도해주세요.' };
  }
}
