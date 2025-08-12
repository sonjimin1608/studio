'use server';

/**
 * @fileOverview 문장을 분석하여 문법 요소와 어휘 정의(보조정리 포함)를 제공합니다.
 *
 * - analyzeSentence - 주어진 문장을 분석하고 문법 요소와 어휘 정의를 반환합니다.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const AnalyzeSentenceInputSchema = z.object({
  sentence: z.string().describe('분석할 문장.'),
  language: z.string().describe('분석할 문장의 언어 (예: "Spanish", "English").'),
});
export type AnalyzeSentenceInput = z.infer<typeof AnalyzeSentenceInputSchema>;

const VocabularyItemSchema = z.object({
  term: z.string().describe('문장에 나타나는 원래 어휘 단어 (예: "hablo", "soldados").'),
  lemma: z.string().describe('단어의 기본 형태(표제어). 동사의 경우 부정사(예: "hablar"), 명사의 경우 단수형(예: "soldado").'),
  pos: z.string().describe('품사 (예: "명사", "동사", "형용사").'),
  gender: z.enum(['m', 'f', 'n/a']).optional().describe("문법적 성별이 적용되는 경우 (예: 스페인어, 독일어). 남성형은 'm', 여성형은 'f'를 사용합니다. 성별에 따라 변하지 않는 형용사의 경우 'n/a'를 사용합니다. 다른 품사나 문법적 성별이 없는 언어의 경우 'n/a'를 사용합니다."),
  definition: z.string().describe('표제어에 대한 간결한 한국어 정의와 괄호 안에 영어 정의. 예: "군인 (soldier)".'),
  pinyin: z.string().optional().describe("단어가 중국어일 경우, 성조가 포함된 병음(Pinyin) 표기. 다른 언어의 경우 생략합니다."),
});

export type VocabularyItem = z.infer<typeof VocabularyItemSchema>;

const GrammarItemSchema = z.object({
  topic: z.string().describe('문법 개념의 이름 (예: "Preterite Tense", "Ser vs. Estar").'),
  explanation: z.string().describe('문법 규칙에 대한 간결한 한국어 설명.'),
});

const AnalyzeSentenceOutputSchema = z.object({
  translation: z.string().describe('문장의 자연스러운 한국어 번역과 괄호 안에 영어 번역. 예: "나는 스페인어를 합니다 (I speak Spanish)".'),
  vocabulary: z.array(VocabularyItemSchema).describe('정의가 포함된 모든 단어 목록. 고유명사는 포함하지 않습니다.'),
  grammar: z.array(GrammarItemSchema).optional().describe('문장에서 발견된 주요 문법 사항 목록. 특별히 주목할 만한 문법 사항이 없는 경우 생략될 수 있습니다.'),
});
export type AnalyzeSentenceOutput = z.infer<typeof AnalyzeSentenceOutputSchema>;


export async function analyzeSentence(input: AnalyzeSentenceInput): Promise<AnalyzeSentenceOutput> {
  return analyzeSentenceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSentencePrompt',
  input: {schema: AnalyzeSentenceInputSchema},
  output: {schema: AnalyzeSentenceOutputSchema},
  prompt: `You are a language expert. Analyze the given sentence in the specified language.

Language: {{{language}}}
Sentence: {{{sentence}}}

Your analysis must be in Korean and include three parts:
1.  **translation**: Provide a natural Korean translation, followed by the English translation in parentheses.
2.  **vocabulary**: For each meaningful word (excluding proper nouns), provide its details:
    - **term**: The original word from the sentence.
    - **lemma**: The base (dictionary) form.
    - **pos**: The part of speech in Korean (e.g., "명사", "동사", "형용사").
    - **gender**: For nouns in languages with grammatical gender (like Spanish or German), specify 'm' (masculine) or 'f' (feminine). For adjectives that have the same form for both genders use 'n/a'. For all other parts of speech or languages without gender, use 'n/a'.
    - **definition**: A concise, dictionary-style definition of the lemma in Korean, followed by the English translation in parentheses. It should be a direct translation, not a long explanation. Example: "군인 (soldier)". For "casa", it should be "집 (house)", not a long sentence.
    - **pinyin**: If the language is Chinese, provide the Pinyin with tone marks for the term. For all other languages, omit this field.
3.  **grammar**: Identify key grammatical concepts in the sentence. For each, provide:
    - **topic**: The name of the concept.
    - **explanation**: A concise explanation in Korean. If there are no noteworthy grammatical points, you can provide an empty array.

Your output must be a JSON object matching the provided schema. Do not analyze punctuation.`,
});

const analyzeSentenceFlow = ai.defineFlow(
  {
    name: 'analyzeSentenceFlow',
    inputSchema: AnalyzeSentenceInputSchema,
    outputSchema: AnalyzeSentenceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
