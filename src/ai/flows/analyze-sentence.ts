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

const VocabularyItemSchema = z.object({
  term: z.string().describe('The original vocabulary word as it appears in the sentence (e.g., "hablo", "soldados").'),
  lemma: z.string().describe('The base form (lemma) of the word. For verbs, this is the infinitive (e.g., "hablar"). For nouns, the singular form (e.g., "soldado").'),
  pos: z.string().describe('The part of speech (e.g., Noun, Verb, Adjective).'),
  gender: z.enum(['m', 'f', 'n/a']).optional().describe("The grammatical gender of the noun, if applicable. Use 'm' for masculine, 'f' for feminine."),
  definition: z.string().describe('A concise definition of the lemma in Korean, followed by the English definition in parentheses. Example: "군인 (soldier)".'),
});

const AnalyzeSentenceOutputSchema = z.object({
  vocabulary: z.array(VocabularyItemSchema).describe('List of all words with their definitions. Do not include proper nouns.'),
});
export type AnalyzeSentenceOutput = z.infer<typeof AnalyzeSentenceOutputSchema>;

export async function analyzeSentence(input: AnalyzeSentenceInput): Promise<AnalyzeSentenceOutput> {
  return analyzeSentenceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSentencePrompt',
  input: {schema: AnalyzeSentenceInputSchema},
  output: {schema: AnalyzeSentenceOutputSchema},
  prompt: `You are a Spanish language expert. For each word in the following Spanish sentence, provide its lemma, part of speech, and definition in Korean and English.

Sentence: {{{sentence}}}

For each word, provide:
1.  **term**: The original word from the sentence.
2.  **lemma**: The base form (dictionary form).
3.  **pos**: The part of speech.
4.  **gender**: For nouns, specify 'm' (masculine) or 'f' (feminine). Otherwise, 'n/a'.
5.  **definition**: A concise definition of the lemma in Korean, followed by the English definition in parentheses. Example: "군인 (soldier)".

Your output must be a JSON object matching the provided schema, containing a list of these vocabulary items. Do not analyze punctuation.`,
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
