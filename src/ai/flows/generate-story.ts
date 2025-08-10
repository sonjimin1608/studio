'use server';

/**
 * @fileOverview Generates a complete short story in a specified language and difficulty level.
 *
 * - generateStory - A function that handles the story generation process.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateStoryInputSchema = z.object({
  topic: z.string().describe('The overall topic or theme of the story.'),
  language: z.string().describe('The language the story should be written in (e.g., "Spanish", "English").'),
  level: z.number().min(1).max(10).describe('The vocabulary difficulty level, from 1 (easiest) to 10 (hardest).'),
});
export type GenerateStoryInput = z.infer<typeof GenerateStoryInputSchema>;

const GenerateStoryOutputSchema = z.object({
  title: z
    .string()
    .describe('A creative and fitting title for the story in the specified language.'),
  paragraphs: z.array(z.string()).describe('An array of paragraphs for the story. The story should be approximately 15-20 paragraphs long.'),
});
export type GenerateStoryOutput = z.infer<typeof GenerateStoryOutputSchema>;


export async function generateStory(input: GenerateStoryInput): Promise<GenerateStoryOutput> {
  return generateStoryFlow(input);
}

const storyPrompt = ai.definePrompt({
  name: 'storyPrompt',
  input: {schema: GenerateStoryInputSchema},
  output: {schema: GenerateStoryOutputSchema},
  prompt: `You are a creative writer who specializes in writing short stories for language learners.

Your task is to write a complete short story based on the given topic, language, and difficulty level.

Language: {{language}}
Vocabulary Level: {{level}} (1=beginner, 10=advanced)
The overall topic of the story is: {{topic}}

**Instructions:**
1.  **Title**: Generate a creative, short, and fitting title for the story in the specified language.
2.  **Story**: Write a complete story consisting of approximately 15-20 paragraphs. Each paragraph must be between 4 and 6 sentences long.
    - **Targeted Level**: The vocabulary and grammatical structures must be appropriate for the specified level.
    - **Consistent Point of View**: The story must be written in a consistent third-person point of view. Do not switch to first-person ("I", "we").
    - **Dialogue**: Enclose all character dialogue in double quotation marks (e.g., "Hola, ¿cómo estás?").
    - The story must be engaging and have a clear beginning, middle, and end.
    - Return the paragraphs as an array of strings.

Your output must be a JSON object matching the provided schema.`,
});

const generateStoryFlow = ai.defineFlow(
  {
    name: 'generateStoryFlow',
    inputSchema: GenerateStoryInputSchema,
    outputSchema: GenerateStoryOutputSchema,
  },
  async input => {
    const {output} = await storyPrompt(input);
    if (!output) {
      throw new Error('Failed to generate the story.');
    }
    return output;
  }
);
