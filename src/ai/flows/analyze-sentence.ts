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
  grammar: z
    .array(z.string())
    .describe('List of grammatical elements found in the sentence.'),
  vocabulary: z
    .array(z.string())
    .describe('List of vocabulary words with their definitions.'),
});
export type AnalyzeSentenceOutput = z.infer<typeof AnalyzeSentenceOutputSchema>;

export async function analyzeSentence(input: AnalyzeSentenceInput): Promise<AnalyzeSentenceOutput> {
  return analyzeSentenceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSentencePrompt',
  input: {schema: AnalyzeSentenceInputSchema},
  output: {schema: AnalyzeSentenceOutputSchema},
  prompt: `You are a Spanish language expert. Analyze the following sentence and identify the grammatical elements and vocabulary words. Provide definitions for each vocabulary word.\n\nSentence: {{{sentence}}}`,
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
