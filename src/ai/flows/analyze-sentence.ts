'use server';

/**
 * @fileOverview Analyzes a sentence, identifies grammatical elements, and provides vocabulary definitions with lemmas.
 *
 * - analyzeSentence - Analyzes the given sentence and returns grammatical elements and vocabulary definitions.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const AnalyzeSentenceInputSchema = z.object({
  sentence: z.string().describe('The sentence to analyze.'),
  language: z.string().describe('The language of the sentence to analyze (e.g., "Spanish", "English").'),
});
export type AnalyzeSentenceInput = z.infer<typeof AnalyzeSentenceInputSchema>;

const VocabularyItemSchema = z.object({
  term: z.string().describe('The original vocabulary word as it appears in the sentence (e.g., "hablo", "soldados").'),
  lemma: z.string().describe('The base form (lemma) of the word. For verbs, this is the infinitive (e.g., "hablar"). For nouns, the singular form (e.g., "soldado").'),
  pos: z.string().describe('The part of speech (e.g., Noun, Verb, Adjective).'),
  gender: z.enum(['m', 'f', 'n/a']).optional().describe("The grammatical gender if applicable (e.g., Spanish, German). Use 'm' for masculine, 'f' for feminine. For adjectives that don't change for gender, use 'n/a'. For other parts of speech or languages without grammatical gender, use 'n/a'."),
  definition: z.string().describe('A concise definition of the lemma in Korean, followed by the English definition in parentheses. Example: "군인 (soldier)".'),
});

export type VocabularyItem = z.infer<typeof VocabularyItemSchema>;

const GrammarItemSchema = z.object({
  topic: z.string().describe('The name of the grammatical concept (e.g., "Preterite Tense", "Ser vs. Estar").'),
  explanation: z.string().describe('A concise explanation of the grammatical rule in Korean.'),
});

const AnalyzeSentenceOutputSchema = z.object({
  translation: z.string().describe('A natural translation of the sentence into Korean, followed by the English translation in parentheses. Example: "나는 스페인어를 합니다 (I speak Spanish)".'),
  vocabulary: z.array(VocabularyItemSchema).describe('List of all words with their definitions. Do not include proper nouns.'),
  grammar: z.array(GrammarItemSchema).optional().describe('A list of key grammatical points found in the sentence. If no specific grammar points are noteworthy, this can be omitted.'),
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

Your analysis must include three parts:
1.  **translation**: Provide a natural Korean translation, followed by the English translation in parentheses.
2.  **vocabulary**: For each meaningful word (excluding proper nouns), provide its details:
    - **term**: The original word from the sentence.
    - **lemma**: The base (dictionary) form.
    - **pos**: The part of speech.
    - **gender**: For nouns in languages with grammatical gender (like Spanish or German), specify 'm' (masculine) or 'f' (feminine). For adjectives that have the same form for both genders use 'n/a'. For all other parts of speech or languages without gender, use 'n/a'.
    - **definition**: A concise definition of the lemma in Korean, followed by the English definition in parentheses. Example: "군인 (soldier)".
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
