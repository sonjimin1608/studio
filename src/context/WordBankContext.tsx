
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { WordBankItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface WordBankContextType {
  wordBank: WordBankItem[];
  addWord: (item: Omit<WordBankItem, 'id'>) => void;
  removeWord: (term: string) => void;
  isWordSaved: (term: string) => boolean;
  clearWordBank: () => void;
}

const WordBankContext = createContext<WordBankContextType | undefined>(undefined);

const WORD_BANK_STORAGE_KEY = 'novela-word-bank';

export const WordBankProvider = ({ children }: { children: ReactNode }) => {
  const [wordBank, setWordBank] = useState<WordBankItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedBank = localStorage.getItem(WORD_BANK_STORAGE_KEY);
      if (savedBank) {
        setWordBank(JSON.parse(savedBank));
      }
    } catch (error) {
      console.error("단어장을 불러오는 데 실패했습니다:", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(WORD_BANK_STORAGE_KEY, JSON.stringify(wordBank));
    } catch (error) {
      console.error("단어장을 저장하는 데 실패했습니다:", error);
    }
  }, [wordBank]);

  const addWord = useCallback((item: Omit<WordBankItem, 'id'>) => {
    setWordBank(prev => {
      if (prev.some(i => i.term === item.term)) {
        return prev;
      }
      const newItem = { ...item, id: `${Date.now()}-${item.term}` };
      return [newItem, ...prev];
    });
     toast({
        title: "단어장에 추가됨",
        description: `"${item.term}"을(를) 단어장에 추가했습니다.`,
      });
  }, [toast]);

  const removeWord = useCallback((term: string) => {
    setWordBank(prev => {
      const newBank = prev.filter(item => item.term !== term);
       if (newBank.length < prev.length) {
         toast({
          title: "단어장에서 삭제됨",
          description: `"${term}"을(를) 단어장에서 삭제했습니다.`,
          variant: "destructive",
        });
      }
      return newBank;
    });
  }, [toast]);

  const isWordSaved = useCallback((term: string) => {
    return wordBank.some(item => item.term === term);
  }, [wordBank]);

  const clearWordBank = useCallback(() => {
    if (wordBank.length > 0) {
      setWordBank([]);
      localStorage.removeItem(WORD_BANK_STORAGE_KEY);
       toast({
          title: "단어장 삭제됨",
          description: "모든 단어를 단어장에서 삭제했습니다.",
          variant: "destructive",
        });
    }
  }, [toast, wordBank.length]);

  return (
    <WordBankContext.Provider value={{ wordBank, addWord, removeWord, isWordSaved, clearWordBank }}>
      {children}
    </WordBankContext.Provider>
  );
};

export const useWordBank = () => {
  const context = useContext(WordBankContext);
  if (context === undefined) {
    throw new Error('useWordBank must be used within a WordBankProvider');
  }
  return context;
};
