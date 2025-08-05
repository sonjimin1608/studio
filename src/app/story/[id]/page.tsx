
'use client';

import { useState, useEffect, useMemo } from 'react';
import { analyzeSentenceAction, continueStoryAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Loader2, Plus, Trash2 } from 'lucide-react';
import { WordBankProvider, useWordBank } from '@/context/WordBankContext';
import type { AnalyzeSentenceOutput } from '@/ai/flows/analyze-sentence';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { WordBankItem, Story } from '@/lib/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const STORIES_STORAGE_KEY = 'novela-stories';


function StoryComponent({ storyId }: { storyId: string }) {
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSentence, setSelectedSentence] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeSentenceOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const { addWord, removeWordByTerm, isWordSaved, wordBank } = useWordBank();
  
  useEffect(() => {
    // This check is important to prevent errors during server-side rendering or in environments where localStorage is not available.
    if (typeof window !== 'undefined') {
      try {
        const savedStoriesRaw = localStorage.getItem(STORIES_STORAGE_KEY);
        if (savedStoriesRaw) {
          const savedStories: Story[] = JSON.parse(savedStoriesRaw);
          const currentStory = savedStories.find(s => s.id === storyId);
          setStory(currentStory || null);
        } else {
          // No stories found at all
          setStory(null);
        }
      } catch (error) {
        console.error("저장된 이야기를 불러오는 데 실패했습니다.", error);
        setStory(null); // Set to null on error
      } finally {
        setIsLoading(false);
      }
    }
  }, [storyId]);

  const updateStoryInStorage = (updatedStory: Story) => {
    try {
      const savedStoriesRaw = localStorage.getItem(STORIES_STORAGE_KEY);
      const savedStories: Story[] = savedStoriesRaw ? JSON.parse(savedStoriesRaw) : [];
      const storyIndex = savedStories.findIndex(s => s.id === storyId);
      if (storyIndex !== -1) {
        savedStories[storyIndex] = updatedStory;
        localStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify(savedStories));
      }
    } catch (error) {
      console.error("이야기를 저장하는 데 실패했습니다.", error);
    }
  };

  const handleNextDay = async () => {
    if (!story) return;

    if (story.currentDay < story.lessons.length - 1) {
      const newDay = story.currentDay + 1;
      const updatedStory = { ...story, currentDay: newDay };
      setStory(updatedStory);
      updateStoryInStorage(updatedStory);
    } else {
      setIsGenerating(true);
      const newParagraph = await continueStoryAction(story);
      
      if (newParagraph) {
        const updatedStory = {
          ...story,
          lessons: [...story.lessons, newParagraph],
          currentDay: story.lessons.length
        };
        setStory(updatedStory);
        updateStoryInStorage(updatedStory);
      } else {
        toast({ title: "오류", description: "다음 단락을 생성하는 데 실패했습니다.", variant: 'destructive' });
      }
      setIsGenerating(false);
    }
  };
  
  const handleSentenceClick = async (sentence: string) => {
    setSelectedSentence(sentence);
    setIsAnalyzing(true);
    setAnalysisResult(null);
    const result = await analyzeSentenceAction(sentence);
    if (result.success && result.data) {
      setAnalysisResult(result.data);
    } else {
      toast({ title: "분석 오류", description: result.error, variant: 'destructive' });
      setSelectedSentence(null);
    }
    setIsAnalyzing(false);
  };

  const changeDay = (offset: number) => {
    if (!story) return;
    const newDay = story.currentDay + offset;
    if (newDay >= 0 && newDay < story.lessons.length) {
      const updatedStory = { ...story, currentDay: newDay };
      setStory(updatedStory);
      updateStoryInStorage(updatedStory);
    }
  };
  
  const wordBankMap = useMemo(() => {
    const map = new Map<string, WordBankItem>();
    wordBank.forEach(item => {
      map.set(item.term.toLowerCase().split(' ')[0], item);
    });
    return map;
  }, [wordBank]);

  const highlightWords = (text: string) => {
      const wordsAndPunctuation = text.split(/(\b[\w\u00C0-\u017F']+\b|[.,?!;])/);
      return wordsAndPunctuation.map((part, index) => {
          const lowerPart = part.toLowerCase();
          if (wordBankMap.has(lowerPart)) {
              const item = wordBankMap.get(lowerPart)!;
              return (
                  <Tooltip key={index}>
                      <TooltipTrigger asChild>
                          <span className="bg-red-300/50 dark:bg-red-800/50 rounded-md cursor-help">{part}</span>
                      </TooltipTrigger>
                      <TooltipContent>{item.definition}</TooltipContent>
                  </Tooltip>
              );
          }
          return part;
      });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  if (!story) {
    return (
        <div className="text-center py-20">
            <h1 className="text-2xl font-bold">이야기를 찾을 수 없습니다.</h1>
            <p className="text-muted-foreground mt-2">삭제되었거나 잘못된 주소일 수 있습니다.</p>
            <Button asChild className="mt-4">
                <Link href="/">홈으로 돌아가기</Link>
            </Button>
        </div>
    );
  }

  const lessonText = story.lessons[story.currentDay];
  const sentences = lessonText.split(/(?<=[.?!])\s+/).filter(s => s.trim() !== '');

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="font-headline text-3xl">Day {story.currentDay + 1}</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => changeDay(-1)} disabled={story.currentDay === 0}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextDay} disabled={isGenerating}>
                 {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <CardDescription>문장을 클릭하여 문법과 단어 분석을 확인하세요.</CardDescription>
        </CardHeader>
        <CardContent className="text-lg leading-relaxed space-y-4">
          <TooltipProvider>
            <Sheet open={!!selectedSentence} onOpenChange={(isOpen) => !isOpen && setSelectedSentence(null)}>
              <div>
                {sentences.map((sentence, index) => (
                  <SheetTrigger asChild key={index}>
                    <span
                      onClick={() => handleSentenceClick(sentence)}
                      className="cursor-pointer hover:bg-accent/50 p-1 rounded-md transition-colors"
                    >
                      {highlightWords(sentence)}{' '}
                    </span>
                  </SheetTrigger>
                ))}
              </div>
              <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="font-headline">문장 분석</SheetTitle>
                  <SheetDescription asChild>
                    <div className="mt-2 p-3 bg-muted rounded-md text-sm">{selectedSentence}</div>
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  {isAnalyzing ? (
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-1/3" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-8 w-1/3 mt-4" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : analysisResult ? (
                    <div className="space-y-6">
                       <div>
                        <h3 className="font-semibold mb-2 text-lg font-headline">번역</h3>
                         <p className="p-3 bg-secondary/50 rounded-md text-sm">{analysisResult.translation}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2 text-lg font-headline">주요 문법</h3>
                        <ul className="space-y-2">
                          {analysisResult.grammar.map((item, index) => {
                            const saved = isWordSaved(item.term);
                            return (
                              <li key={index} className="flex items-start justify-between p-3 bg-secondary/50 rounded-md">
                                <div>
                                  <p className="font-semibold">{item.term}</p>
                                  <p className="text-sm text-muted-foreground">{item.definition}</p>
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 flex-shrink-0 ml-2"
                                  onClick={() => saved ? removeWordByTerm(item.term) : addWord({id: `${storyId}-${item.term}`, term: item.term, definition: item.definition, type: 'grammar'})}
                                >
                                  {saved ? <Trash2 className="h-4 w-4 text-destructive" /> : <Plus className="h-4 w-4" />}
                                </Button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2 text-lg font-headline">어휘</h3>
                        <ul className="space-y-2">
                          {analysisResult.vocabulary.map((item, index) => {
                            const saved = isWordSaved(item.term);
                            return (
                              <li key={index} className="flex items-start justify-between p-3 bg-secondary/50 rounded-md">
                                <div>
                                  <p className="font-semibold">{item.term}</p>
                                  <p className="text-sm text-muted-foreground">{item.definition}</p>
                                </div>
                                 <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 flex-shrink-0 ml-2"
                                  onClick={() => saved ? removeWordByTerm(item.term) : addWord({id: `${storyId}-${item.term}`, term: item.term, definition: item.definition, type: 'vocabulary'})}
                                >
                                  {saved ? <Trash2 className="h-4 w-4 text-destructive" /> : <Plus className="h-4 w-4" />}
                                </Button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  ) : null}
                </div>
              </SheetContent>
            </Sheet>
          </TooltipProvider>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">{story.topic}</p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function StoryPage({ params }: { params: { id: string } }) {
  return (
    <WordBankProvider>
      <StoryComponent storyId={params.id} />
    </WordBankProvider>
  )
}
