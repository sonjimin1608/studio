'use server';

/**
 * @fileOverview Analyzes a sentence, identifies grammatical elements, and provides vocabulary definitions.
 *
 * - analyzeSentence - Analyzes the given sentence and returns grammatical elements and vocabulary definitions.
 * - AnalyzeSentenceInput - The input type for the analyzeSentence function.
 * - AnalyzeSentenceOutput - The return type for the analyzeSentence function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeSentenceInputSchema = z.object({
  sentence: z.string().describe('The sentence to analyze.'),
});
export type AnalyzeSentenceInput = z.infer<typeof AnalyzeSentenceInputSchema>;

const AnalyzeSentenceOutputSchema = z.object({
  translation: z.string().describe('The Korean translation of the sentence.'),
  grammar: z
    .array(
      z.object({
        term: z.string().describe('The name of the grammatical rule, in Korean.'),
        definition: z.string().describe('The explanation of the grammatical rule in Korean.'),
      })
    )
    .describe('List of grammatical rules found in the sentence.'),
  vocabulary: z
    .array(
      z.object({
        term: z.string().describe('The vocabulary word in Spanish. For nouns, include gender (e.g., "palabra (f.)"). For adjectives, show both forms (e.g., "bueno/a").'),
        definition: z
          .string()
          .describe('The definition of the word in Korean and English, formatted as "Korean (English)".'),
      })
    )
    .describe('List of all nouns, verbs, adjectives, and adverbs with their definitions in Korean and English. Do not include proper nouns.'),
});
export type AnalyzeSentenceOutput = z.infer<typeof AnalyzeSentenceOutputSchema>;

export async function analyzeSentence(input: AnalyzeSentenceInput): Promise<AnalyzeSentenceOutput> {
  return analyzeSentenceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSentencePrompt',
  input: {schema: AnalyzeSentenceInputSchema},
  output: {schema: AnalyzeSentenceOutputSchema},
  prompt: `You are a Spanish language expert. Analyze the following Spanish sentence. Do not include proper nouns in the vocabulary list.

Sentence: {{{sentence}}}

1.  **Translation**: Translate the sentence into Korean.
2.  **Grammar**: Identify key grammatical structures or rules used in the sentence (e.g., Subjunctive mood, Interrogative sentence, Conditional tense). Do not just list parts of speech. For each rule, provide the name of the rule ('term') and a brief explanation ('definition'), **both in Korean only**.
3.  **Vocabulary**: Identify **all nouns, verbs, adjectives, and adverbs** from the sentence, excluding proper nouns. For each word:
    *   **term**: Provide the original Spanish word.
        *   For **nouns**, indicate their gender: (m.) for masculine, (f.) for feminine. Example: "amigo (m.)", "casa (f.)".
        *   For **adjectives** with gender, show both forms using a slash. Example: "bonito/a".
    *   **definition**: Provide its definition in both Korean and English. The definition format must be "한국어 뜻 (English meaning)". Ensure the definition is general and not overly specific to the sentence's context (e.g., for "joven", use "젊은 (young)", not "젊은 남자 (young man)").

Your output must be a JSON object matching the provided schema.`,
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
