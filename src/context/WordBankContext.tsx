
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { WordBankItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface WordBankContextType {
  wordBank: WordBankItem[];
  addWord: (item: Omit<WordBankItem, 'id'>) => void;
  removeWord: (lemma: string) => void;
  isWordSaved: (lemma: string) => boolean;
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
      if (prev.some(i => i.lemma === item.lemma)) {
        return prev;
      }
      toast({
        title: "단어장에 추가됨",
        description: `"${item.lemma}"을(를) 단어장에 추가했습니다.`,
      });
      const newItem = { ...item, id: `${Date.now()}-${item.lemma}` };
      return [newItem, ...prev];
    });
  }, [toast]);

  const removeWord = useCallback((lemma: string) => {
    setWordBank(prev => {
      const itemExists = prev.some(item => item.lemma === lemma);
      const newBank = prev.filter(item => item.lemma !== lemma);
      if (itemExists) {
        toast({
          title: "단어장에서 삭제됨",
          description: `"${lemma}"을(를) 단어장에서 삭제했습니다.`,
          variant: "destructive",
        });
      }
      return newBank;
    });
  }, [toast]);

  const isWordSaved = useCallback((lemma: string) => {
    return wordBank.some(item => item.lemma === lemma);
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
