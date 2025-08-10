'use server';
import { generateStory, type GenerateStoryOutput } from '@/ai/flows/generate-story';
import { analyzeSentence, type AnalyzeSentenceOutput } from '@/ai/flows/analyze-sentence';
import { textToSpeech, type TextToSpeechOutput } from '@/ai/flows/text-to-speech';


type GenerateStoryResult = {
  success: true;
  data: GenerateStoryOutput;
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

type TextToSpeechResult = {
  success: true;
  data: TextToSpeechOutput;
} | {
  success: false;
  error: string;
}

export async function generateNewStoryAction(topic: string, language: string, level: number): Promise<GenerateStoryResult> {
  try {
    const result = await generateStory({ topic, language, level });
    if (!result.paragraphs || result.paragraphs.length === 0) {
      throw new Error('Failed to generate the story paragraphs.');
    }
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error generating new story:', error);
    const errorMessage = error.cause?.message || error.message || 'An unknown error occurred.';
    return { success: false, error: `새로운 이야기 생성에 실패했습니다: ${errorMessage}` };
  }
}

export async function analyzeSentenceAction(sentence: string, language: string): Promise<AnalyzeSentenceResult> {
  try {
    const analysis = await analyzeSentence({ sentence, language });
    return { success: true, data: analysis };
  } catch (error: any) {
    console.error('Error analyzing sentence:', error);
    const errorMessage = error.cause?.message || error.message || 'An unknown error occurred.';
    return { success: false, error: `문장 분석에 실패했습니다: ${errorMessage}` };
  }
}

export async function textToSpeechAction(text: string): Promise<TextToSpeechResult> {
  try {
    const result = await textToSpeech({ text });
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error converting text to speech:', error);
    const errorMessage = error.cause?.message || error.message || 'An unknown error occurred.';
    return { success: false, error: `음성 변환에 실패했습니다: ${errorMessage}` };
  }
}
