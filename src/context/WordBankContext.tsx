"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { WordBankItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'next/navigation';

interface WordBankContextType {
  wordBank: WordBankItem[];
  addWord: (item: WordBankItem) => void;
  removeWord: (id: string) => void;
  removeWordByTerm: (term: string) => void;
  isWordSaved: (term: string) => boolean;
}

const WordBankContext = createContext<WordBankContextType | undefined>(undefined);

const getStorageKey = (storyId: string) => `novela-word-bank-${storyId}`;

export const WordBankProvider = ({ children }: { children: ReactNode }) => {
  const params = useParams();
  const storyId = typeof params.id === 'string' ? params.id : '';
  const [wordBank, setWordBank] = useState<WordBankItem[]>([]);
  const { toast } = useToast();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // storyId가 있을 때만 로컬 스토리지에서 데이터를 불러옵니다.
    if (storyId) {
        try {
            const savedBank = localStorage.getItem(getStorageKey(storyId));
            if (savedBank) {
                setWordBank(JSON.parse(savedBank));
            } else {
                setWordBank([]); // 해당 스토리에 대한 단어장이 없으면 초기화
            }
        } catch (error) {
            console.error("단어장을 불러오는 데 실패했습니다:", error);
            setWordBank([]);
        } finally {
            setIsLoaded(true);
        }
    } else {
        // storyId가 없는 페이지(e.g., /vocabulary, /quiz)에서는 모든 단어장을 불러옵니다.
        try {
            let allWords: WordBankItem[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('novela-word-bank-')) {
                    const savedBank = localStorage.getItem(key);
                    if (savedBank) {
                        allWords = allWords.concat(JSON.parse(savedBank));
                    }
                }
            }
            // 중복 제거
            const uniqueWords = allWords.filter((word, index, self) =>
                index === self.findIndex((t) => (
                    t.term === word.term && t.definition === word.definition
                ))
            );
            setWordBank(uniqueWords);
        } catch (error) {
            console.error("전체 단어장을 불러오는 데 실패했습니다:", error);
            setWordBank([]);
        } finally {
            setIsLoaded(true);
        }
    }
  }, [storyId]);


  useEffect(() => {
    if (isLoaded && storyId) {
      try {
        localStorage.setItem(getStorageKey(storyId), JSON.stringify(wordBank));
      } catch (error) {
        console.error("단어장을 저장하는 데 실패했습니다:", error);
      }
    }
  }, [wordBank, isLoaded, storyId]);

  const addWord = (item: WordBankItem) => {
    if (!storyId) {
        toast({
            title: "오류",
            description: "단어를 저장할 이야기를 찾을 수 없습니다.",
            variant: "destructive",
        });
        return;
    }
    if (wordBank.some(i => i.term === item.term)) {
      return;
    }
    setWordBank(prev => [item, ...prev]);
    toast({
      title: "단어장에 추가됨",
      description: `"${item.term}"을(를) 단어장에 추가했습니다.`,
    });
  };

  const removeWord = (id: string) => {
    const itemToRemove = wordBank.find(item => item.id === id);
    if (itemToRemove) {
      // Find which story this word belongs to
      let ownerStoryId = storyId;
      if (!ownerStoryId) {
          for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('novela-word-bank-')) {
                  const savedBank = localStorage.getItem(key);
                  if (savedBank && savedBank.includes(`"id":"${id}"`)) {
                      ownerStoryId = key.replace('novela-word-bank-', '');
                      break;
                  }
              }
          }
      }

      if(ownerStoryId) {
        const storageKey = getStorageKey(ownerStoryId);
        const storedBank = localStorage.getItem(storageKey);
        if(storedBank) {
          const bank: WordBankItem[] = JSON.parse(storedBank);
          const updatedBank = bank.filter(item => item.id !== id);
          localStorage.setItem(storageKey, JSON.stringify(updatedBank));
        }
      }
    }
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
    if (itemToRemove) {
      removeWord(itemToRemove.id);
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