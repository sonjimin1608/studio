export interface WordBankItem {
  id: string;
  term: string; // The word as it appeared in the text
  lemma: string; // The base form of the word
  definition: string;
  type: 'vocabulary' | 'grammar';
}
