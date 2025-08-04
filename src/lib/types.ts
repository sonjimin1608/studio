export interface WordBankItem {
  id: string;
  term: string;
  definition: string;
  type: 'vocabulary' | 'grammar';
}
