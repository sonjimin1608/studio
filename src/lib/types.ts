export interface WordBankItem {
  id: string;
  term: string; // The word as it appeared in the text, serves as the primary key.
  lemma: string; // The base form of the word, used for highlighting.
  definition: string;
  type: 'vocabulary' | 'grammar';
}
