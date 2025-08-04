"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { WordBankItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface WordBankContextType {
  wordBank: WordBankItem[];
  addWord: (item: Omit<WordBankItem, 'id'>) => void;
  removeWord: (id: string) => void;
  removeWordByTerm: (term: string) => void;
  isWordSaved: (term: string) => boolean;
}

const WordBankContext = createContext<WordBankContextType | undefined>(undefined);

const WORD_BANK_STORAGE_KEY = 'cuento-diario-word-bank';

export const WordBankProvider = ({ children }: { children: ReactNode }) => {
  const [wordBank, setWordBank] = useState<WordBankItem[]>([]);
  const { toast } = useToast();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedBank = localStorage.getItem(WORD_BANK_STORAGE_KEY);
      if (savedBank) {
        setWordBank(JSON.parse(savedBank));
      }
    } catch (error) {
      console.error("단어장을 불러오는 데 실패했습니다:", error);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(WORD_BANK_STORAGE_KEY, JSON.stringify(wordBank));
      } catch (error) {
        console.error("단어장을 저장하는 데 실패했습니다:", error);
      }
    }
  }, [wordBank, isLoaded]);

  const addWord = (item: Omit<WordBankItem, 'id'>) => {
    if (wordBank.some(i => i.term === item.term)) {
      toast({
        title: "이미 추가된 항목입니다.",
        description: `"${item.term}"은(는) 이미 단어장에 있습니다.`,
        variant: "default",
      });
      return;
    }
    const newItem = { ...item, id: new Date().toISOString() };
    setWordBank(prev => [newItem, ...prev]);
    toast({
      title: "단어장에 추가됨",
      description: `"${item.term}"을(를) 단어장에 추가했습니다.`,
    });
  };

  const removeWord = (id: string) => {
    const itemToRemove = wordBank.find(item => item.id === id);
    setWordBank(prev => prev.filter(item => item.id !== id));
    if (itemToRemove) {
      toast({
        title: "단어장에서 삭제됨",
        description: `"${itemToRemove.term}"을(를) 단어장에서 삭제했습니다.`,
        variant: "destructive",
      });
    }
  };
  
  const removeWordByTerm = (term: string) => {
    const itemToRemove = wordBank.find(item => item.term === term);
    setWordBank(prev => prev.filter(item => item.term !== term));
    if (itemToRemove) {
        toast({
            title: "단어장에서 삭제됨",
            description: `"${itemToRemove.term}"을(를) 단어장에서 삭제했습니다.`,
            variant: "destructive",
        });
    }
  };

  const isWordSaved = (term: string) => {
    return wordBank.some(item => item.term === term);
  }

  return (
    <WordBankContext.Provider value={{ wordBank, addWord, removeWord, removeWordByTerm, isWordSaved }}>
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
