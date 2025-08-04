'use server';

/**
 * @fileOverview Generates a unique Spanish-language short story of approximately 1000 sentences,
 * and automatically splits it into 100 daily lessons.
 *
 * - generateSpanishStory - A function that handles the story generation and splitting process.
 * - GenerateSpanishStoryInput - The input type for the generateSpanishStory function.
 * - GenerateSpanishStoryOutput - The return type for the generateSpanishStory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSpanishStoryInputSchema = z.object({
  numberOfSentences: z
    .number()
    .default(1000)
    .describe('The approximate number of sentences in the story.'),
  numberOfDays: z
    .number()
    .default(100)
    .describe('The number of daily lessons to split the story into.'),
});
export type GenerateSpanishStoryInput = z.infer<typeof GenerateSpanishStoryInputSchema>;

const GenerateSpanishStoryOutputSchema = z.object({
  dailyLessons: z
    .array(z.string())
    .describe('An array of strings, where each string is a daily lesson.'),
  progress: z.string().describe('Short progress summary'),
});
export type GenerateSpanishStoryOutput = z.infer<typeof GenerateSpanishStoryOutputSchema>;

export async function generateSpanishStory(input: GenerateSpanishStoryInput): Promise<GenerateSpanishStoryOutput> {
  return generateSpanishStoryFlow(input);
}

const storyPrompt = ai.definePrompt({
  name: 'storyPrompt',
  input: {schema: GenerateSpanishStoryInputSchema},
  output: {schema: z.string().describe('A Spanish-language short story.')},
  prompt: `You are a creative writer who specializes in writing short stories in Spanish.

  Please write a unique Spanish-language short story of approximately {{numberOfSentences}} sentences.
  The story should be engaging and suitable for Spanish language learners.
  Focus on using a variety of vocabulary and grammatical structures appropriate for learners.
  Do not split the story into multiple sections. Just output the entire story.`,
});

const generateSpanishStoryFlow = ai.defineFlow(
  {
    name: 'generateSpanishStoryFlow',
    inputSchema: GenerateSpanishStoryInputSchema,
    outputSchema: GenerateSpanishStoryOutputSchema,
  },
  async input => {
    const {output: story} = await storyPrompt(input);

    if (!story) {
      throw new Error('Failed to generate the story.');
    }

    const sentences = story.split(/[.?!]/).filter(s => s.trim() !== '');
    const sentencesPerDay = Math.ceil(sentences.length / input.numberOfDays);

    const dailyLessons: string[] = [];
    for (let i = 0; i < input.numberOfDays; i++) {
      const start = i * sentencesPerDay;
      const end = Math.min(start + sentencesPerDay, sentences.length);
      const lessonSentences = sentences.slice(start, end);
      dailyLessons.push(lessonSentences.join('. ') + '.');
    }

    return {
      dailyLessons: dailyLessons,
      progress: 'Successfully generated a Spanish story and split it into daily lessons.',
    };
  }
);
