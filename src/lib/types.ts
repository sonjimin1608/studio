export interface WordBankItem {
  id: string;
  term: string;
  definition: string;
  type: 'vocabulary' | 'grammar';
}

// Story type is now managed within page.tsx as it's no longer shared across pages.
