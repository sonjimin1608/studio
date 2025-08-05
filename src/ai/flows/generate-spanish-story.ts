'use server';

/**
 * @fileOverview Generates a complete short Spanish story based on a given topic.
 *
 * - generateSpanishStory - A function that handles the story generation process.
 * - GenerateSpanishStoryInput - The input type for the generateSpanishStory function.
 * - GenerateSpanishStoryOutput - The return type for the generateSpanishStory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSpanishStoryInputSchema = z.object({
  topic: z.string().describe('The overall topic or theme of the story.'),
});
export type GenerateSpanishStoryInput = z.infer<typeof GenerateSpanishStoryInputSchema>;

const GenerateSpanishStoryOutputSchema = z.object({
  title: z
    .string()
    .describe('A creative and fitting title for the story in Spanish.'),
  paragraphs: z.array(z.string()).describe('An array of paragraphs for the Spanish story. The story should be approximately 20 paragraphs long.'),
});
export type GenerateSpanishStoryOutput = z.infer<typeof GenerateSpanishStoryOutputSchema>;

export async function generateSpanishStory(input: GenerateSpanishStoryInput): Promise<GenerateSpanishStoryOutput> {
  return generateSpanishStoryFlow(input);
}

const storyPrompt = ai.definePrompt({
  name: 'storyPrompt',
  input: {schema: GenerateSpanishStoryInputSchema},
  output: {schema: GenerateSpanishStoryOutputSchema},
  prompt: `You are a creative writer who specializes in writing short stories in Spanish for language learners.

Your task is to write a complete short story based on the given topic.

The overall topic of the story is: {{topic}}

1.  **Title**: Generate a creative, short, and fitting title for the story in Spanish.
2.  **Story**: Write a complete story consisting of approximately 20 paragraphs. Each paragraph should be about 5-7 sentences long.
    - The story must be engaging and use a variety of vocabulary and grammatical structures suitable for learners.
    - Ensure the story has a clear beginning, middle, and end.
    - Return the paragraphs as an array of strings.

Your output must be a JSON object matching the provided schema.`,
});

const generateSpanishStoryFlow = ai.defineFlow(
  {
    name: 'generateSpanishStoryFlow',
    inputSchema: GenerateSpanishStoryInputSchema,
    outputSchema: GenerateSpanishStoryOutputSchema,
  },
  async input => {
    const {output} = await storyPrompt(input);
    if (!output) {
      throw new Error('Failed to generate the story.');
    }
    return output;
  }
);
