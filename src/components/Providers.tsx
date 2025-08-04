'use client';

import { WordBankProvider } from '@/context/WordBankContext';
import type { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return <WordBankProvider>{children}</WordBankProvider>;
}
