'use server';

/**
 * @fileOverview Generates a paragraph for a Spanish story based on a given topic and previous context.
 *
 * - generateSpanishStoryParagraph - A function that handles the paragraph generation process.
 * - GenerateSpanishStoryParagraphInput - The input type for the generateSpanishStoryParagraph function.
 * - GenerateSpanishStoryParagraphOutput - The return type for the generateSpanishStoryParagraph function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSpanishStoryParagraphInputSchema = z.object({
  topic: z.string().describe('The overall topic or theme of the story.'),
  previousContext: z
    .string()
    .optional()
    .describe('The preceding paragraphs of the story to maintain context.'),
});
export type GenerateSpanishStoryParagraphInput = z.infer<typeof GenerateSpanishStoryParagraphInputSchema>;

const GenerateSpanishStoryParagraphOutputSchema = z.object({
  title: z
    .string()
    .optional()
    .describe('A creative and fitting title for the story in Spanish. This should only be generated for the first paragraph.'),
  paragraph: z.string().describe('A new paragraph for the Spanish story.'),
});
export type GenerateSpanishStoryParagraphOutput = z.infer<typeof GenerateSpanishStoryParagraphOutputSchema>;

export async function generateSpanishStoryParagraph(input: GenerateSpanishStoryParagraphInput): Promise<GenerateSpanishStoryParagraphOutput> {
  return generateSpanishStoryParagraphFlow(input);
}

const storyPrompt = ai.definePrompt({
  name: 'storyParagraphPrompt',
  input: {schema: GenerateSpanishStoryParagraphInputSchema},
  output: {schema: GenerateSpanishStoryParagraphOutputSchema},
  prompt: `You are a creative writer who specializes in writing short stories in Spanish for language learners.

  The overall topic of the story is: {{topic}}

  {{#if previousContext}}
  Here is the story so far:
  ---
  {{{previousContext}}}
  ---
  Please continue the story with a new, interesting paragraph of about 5-7 sentences. Ensure it flows logically from the previous context. Do not generate a title.
  {{else}}
  Please start a new, interesting story on the given topic. 
  1. Generate a creative, short, and fitting title for the story in Spanish.
  2. Write the first paragraph, about 5-7 sentences long.
  {{/if}}
  
  The paragraph should be engaging and use a variety of vocabulary and grammatical structures suitable for learners.
  Output only the new paragraph (and title if it's the first paragraph).`,
});

const generateSpanishStoryParagraphFlow = ai.defineFlow(
  {
    name: 'generateSpanishStoryParagraphFlow',
    inputSchema: GenerateSpanishStoryParagraphInputSchema,
    outputSchema: GenerateSpanishStoryParagraphOutputSchema,
  },
  async input => {
    const {output} = await storyPrompt(input);
    if (!output) {
      throw new Error('Failed to generate the story paragraph.');
    }
    return output;
  }
);
