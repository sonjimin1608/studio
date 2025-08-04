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
        term: z.string().describe('The name of the grammatical rule.'),
        definition: z.string().describe('The explanation of the grammatical rule in Korean.'),
      })
    )
    .describe('List of grammatical rules found in the sentence.'),
  vocabulary: z
    .array(
      z.object({
        term: z.string().describe('The vocabulary word in Spanish.'),
        definition: z
          .string()
          .describe('The definition of the word in Korean and English, formatted as "Korean (English)".'),
      })
    )
    .describe('List of all nouns, verbs, adjectives, and adverbs with their definitions in Korean and English.'),
});
export type AnalyzeSentenceOutput = z.infer<typeof AnalyzeSentenceOutputSchema>;

export async function analyzeSentence(input: AnalyzeSentenceInput): Promise<AnalyzeSentenceOutput> {
  return analyzeSentenceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSentencePrompt',
  input: {schema: AnalyzeSentenceInputSchema},
  output: {schema: AnalyzeSentenceOutputSchema},
  prompt: `You are a Spanish language expert. Analyze the following Spanish sentence.

Sentence: {{{sentence}}}

1.  **Translation**: Translate the sentence into Korean.
2.  **Grammar**: Identify key grammatical structures or rules used in the sentence (e.g., Subjunctive mood, Interrogative sentence, Conditional tense). Do not just list parts of speech. For each rule, provide the name of the rule ('term') and a brief explanation ('definition') **in Korean only**.
3.  **Vocabulary**: Identify **all nouns, verbs, adjectives, and adverbs** from the sentence. For each word, provide the original Spanish word ('term') and its definition ('definition') in both Korean and English. The definition format must be "한국어 뜻 (English meaning)".

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
