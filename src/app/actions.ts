'use server';
import { generateSpanishStoryParagraph } from '@/ai/flows/generate-spanish-story';
import { analyzeSentence } from '@/ai/flows/analyze-sentence';
import type { GenerateSpanishStoryParagraphOutput } from '@/ai/flows/generate-spanish-story';
import type { AnalyzeSentenceOutput } from '@/ai/flows/analyze-sentence';
import { redirect } from 'next/navigation';
import type { Story } from '@/lib/types';

type GenerateStoryResult = {
  success: true;
  data: Story;
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
    const result = await generateSpanishStoryParagraph({ topic, previousContext: '' });
    if (!result.paragraph) {
      throw new Error('Failed to generate the first paragraph.');
    }
    const newStory: Story = {
      id: crypto.randomUUID(),
      topic: topic,
      lessons: [result.paragraph],
      createdAt: new Date().toISOString(),
      currentDay: 0,
    };
    return { success: true, data: newStory };
  } catch (error) {
    console.error('Error generating new story:', error);
    return { success: false, error: '새로운 이야기 생성에 실패했습니다. 다시 시도해주세요.' };
  }
}

export async function continueStoryAction(story: Story): Promise<string | null> {
    try {
        const previousContext = story.lessons.join('\n\n');
        const result = await generateSpanishStoryParagraph({ topic: story.topic, previousContext });
        return result.paragraph;
    } catch (error) {
        console.error('Error continuing story:', error);
        return null;
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
