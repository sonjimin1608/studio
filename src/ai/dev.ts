'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/generate-spanish-story.ts';
import '@/ai/flows/analyze-sentence.ts';
import '@/ai/flows/text-to-speech.ts';
