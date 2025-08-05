export interface WordBankItem {
  id: string;
  term: string;
  definition: string;
  type: 'vocabulary' | 'grammar';
}

export interface Story {
    id: string;
    topic: string;
    lessons: string[];
    createdAt: string;
    currentDay: number;
}
