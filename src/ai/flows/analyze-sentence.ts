'use server';

/**
 * @fileOverview Analyzes a sentence, identifies grammatical elements, and provides vocabulary definitions with lemmas.
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
  translation: z.string().describe('The Korean and English translation of the sentence, formatted as "Korean (English)".'),
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
        term: z.string().describe('The original vocabulary word as it appears in the sentence (e.g., "hablo", "soldados").'),
        lemma: z.string().describe('The base form (lemma) of the word. For verbs, this is the infinitive (e.g., "hablar"). For nouns, the singular form (e.g., "soldado").'),
        definition: z
          .string()
          .describe('The definition of the word in Korean and English, formatted as "Korean (English)".'),
      })
    )
    .describe('List of all nouns, verbs, adjectives, adverbs, and prepositions with their definitions in Korean and English. Do not include proper nouns.'),
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

1.  **Translation**: Translate the sentence in two steps. First, translate the original Spanish sentence into natural, idiomatic English (not a literal translation). Then, translate that English sentence into Korean. The final output format must be "한국어 번역 (English Translation)".
2.  **Grammar**: Identify key grammatical structures or rules used in the sentence (e.g., Subjunctive mood, Interrogative sentence, Conditional tense). Do not just list parts of speech. For each rule, provide the name of the rule ('term') and a brief explanation ('definition'), **both in Korean only**.
3.  **Vocabulary**: Identify **all nouns, verbs, adjectives, adverbs, and prepositions** from the sentence, excluding proper nouns. For each word:
    *   **term**: Provide the original Spanish word as it appears in the sentence.
    *   **lemma**: Provide the dictionary form (lemma) of the word. For verbs, this is the infinitive (e.g., for "hablo", the lemma is "hablar"). For nouns, it's the singular form (e.g., for "soldados", the lemma is "soldado"). For adjectives with gender, show both forms using a slash (e.g., "bonito/a").
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
