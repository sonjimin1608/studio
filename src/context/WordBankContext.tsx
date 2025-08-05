"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { WordBankItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface WordBankContextType {
  wordBank: WordBankItem[];
  addWord: (item: WordBankItem) => void;
  removeWord: (id: string) => void;
  removeWordByTerm: (term: string) => void;
  isWordSaved: (term: string) => boolean;
}

const WordBankContext = createContext<WordBankContextType | undefined>(undefined);

const getStorageKey = (storyId: string) => `novela-word-bank-${storyId}`;

interface WordBankProviderProps {
    children: ReactNode;
    storyId?: string;
}

export const WordBankProvider = ({ children, storyId }: WordBankProviderProps) => {
  const [wordBank, setWordBank] = useState<WordBankItem[]>([]);
  const { toast } = useToast();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // storyId가 제공되면 해당 스토리의 단어장을 로드합니다.
    if (storyId) {
        try {
            const savedBank = localStorage.getItem(getStorageKey(storyId));
            if (savedBank) {
                setWordBank(JSON.parse(savedBank));
            } else {
                setWordBank([]);
            }
        } catch (error) {
            console.error("단어장을 불러오는 데 실패했습니다:", error);
            setWordBank([]);
        } finally {
            setIsLoaded(true);
        }
    } else {
        // storyId가 없으면(e.g., /vocabulary, /quiz) 모든 단어장을 불러옵니다.
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
    // isLoaded 상태와 storyId를 확인하여 적절한 때에만 저장합니다.
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
    setWordBank(prev => {
        if (prev.some(i => i.term === item.term)) {
            return prev;
        }
        toast({
            title: "단어장에 추가됨",
            description: `"${item.term}"을(를) 단어장에 추가했습니다.`,
        });
        return [item, ...prev];
    });
  };

  const removeWord = (id: string) => {
    const itemToRemove = wordBank.find(item => item.id === id);

    // 먼저 현재 컨텍스트의 단어장(글로벌 또는 특정 스토리)에서 단어를 제거합니다.
    setWordBank(prev => prev.filter(item => item.id !== id));

    if (itemToRemove) {
      // 어떤 스토리의 단어장에서 이 단어를 삭제해야 하는지 찾습니다.
      let ownerStoryId = storyId; // 현재 storyId를 기본값으로 사용
      
      // 만약 현재 storyId가 없다면(글로벌 단어장 뷰), 해당 단어를 포함하는 스토리의 저장소를 찾아야 합니다.
      if (!ownerStoryId) {
          for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('novela-word-bank-')) {
                  try {
                      const savedBank = localStorage.getItem(key);
                      if (savedBank && savedBank.includes(`"id":"${id}"`)) {
                          ownerStoryId = key.replace('novela-word-bank-', '');
                          break;
                      }
                  } catch (e) {
                      console.error(`Error parsing localStorage key ${key}:`, e);
                  }
              }
          }
      }

      // 소유자 storyId를 찾았다면 해당 로컬 스토리지에서 아이템을 삭제합니다.
      if(ownerStoryId) {
        const storageKey = getStorageKey(ownerStoryId);
        try {
          const storedBankRaw = localStorage.getItem(storageKey);
          if(storedBankRaw) {
            const bank: WordBankItem[] = JSON.parse(storedBankRaw);
            const updatedBank = bank.filter(item => item.id !== id);
            localStorage.setItem(storageKey, JSON.stringify(updatedBank));
          }
        } catch(e) {
           console.error("로컬 스토리지에서 단어장 삭제 중 오류 발생", e)
        }
      }
      
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
