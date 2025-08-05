'use server';
import { generateSpanishStory } from '@/ai/flows/generate-spanish-story';
import { analyzeSentence } from '@/ai/flows/analyze-sentence';
import type { GenerateSpanishStoryOutput } from '@/ai/flows/generate-spanish-story';
import type { AnalyzeSentenceOutput } from '@/ai/flows/analyze-sentence';

type GenerateStoryResult = {
  success: true;
  data: GenerateSpanishStoryOutput;
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

export async function generateNewStoryAction(topic: string): Promise<GenerateStoryResult> {
  try {
    const result = await generateSpanishStory({ topic });
    if (!result.paragraphs || result.paragraphs.length === 0) {
      throw new Error('Failed to generate the story paragraphs.');
    }
    return { success: true, data: result };
  } catch (error) {
    console.error('Error generating new story:', error);
    return { success: false, error: '새로운 이야기 생성에 실패했습니다. 다시 시도해주세요.' };
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
