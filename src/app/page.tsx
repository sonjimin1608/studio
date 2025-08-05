'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { analyzeSentenceAction, generateNewStoryAction, continueStoryAction } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Plus, Trash2, Wand2, ChevronRight, BookOpen, ChevronLeft } from 'lucide-react';
import { useWordBank } from '@/context/WordBankContext';
import type { AnalyzeSentenceOutput } from '@/ai/flows/analyze-sentence';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { WordBankItem } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const STORY_STORAGE_KEY = 'novela-story';

interface Story {
  topic: string;
  title: string;
  paragraphs: string[];
}

export default function StoryPage() {
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [selectedSentence, setSelectedSentence] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeSentenceOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [topic, setTopic] = useState('');
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  
  const { toast } = useToast();
  const { addWord, removeWordByTerm, isWordSaved, wordBank, clearWordBank } = useWordBank();
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedStoryRaw = localStorage.getItem(STORY_STORAGE_KEY);
        if (savedStoryRaw) {
          const savedStory = JSON.parse(savedStoryRaw);
          setStory(savedStory);
          setCurrentParagraphIndex(savedStory.paragraphs.length - 1);
        }
      } catch (error) {
        console.error("이야기를 불러오는 데 실패했습니다.", error);
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (story) {
      localStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(story));
    }
  }, [story]);

  const handleGenerateStory = async () => {
    if (!topic.trim()) {
      toast({ title: "오류", description: "이야기 주제를 입력해주세요.", variant: 'destructive' });
      return;
    }
    
    setIsGenerating(true);
    const result = await generateNewStoryAction(topic);
    
    if (result.success && result.data?.paragraph) {
      const newStory: Story = { 
        topic: topic, 
        title: result.data.title || topic,
        paragraphs: [result.data.paragraph] 
      };
      setStory(newStory);
      setCurrentParagraphIndex(0);
      clearWordBank();
      toast({ title: "성공", description: "새로운 이야기가 생성되었습니다!" });
    } else {
      toast({ title: "오류", description: result.error, variant: 'destructive' });
    }
    setIsGenerating(false);
  };

  const handleContinueStory = async () => {
    if (!story) return;
    setIsContinuing(true);
    const previousContext = story.paragraphs.join('\n\n');
    const newParagraph = await continueStoryAction(story.topic, previousContext);
    if (newParagraph) {
      setStory(prev => {
        if (!prev) return null;
        const updatedStory = { ...prev, paragraphs: [...prev.paragraphs, newParagraph] };
        setCurrentParagraphIndex(updatedStory.paragraphs.length - 1);
        return updatedStory;
      });
    } else {
      toast({ title: "오류", description: "다음 단락을 생성하는데 실패했습니다.", variant: "destructive" });
    }
    setIsContinuing(false);
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

  const handleDeleteStory = () => {
    setStory(null);
    setTopic('');
    setCurrentParagraphIndex(0);
    clearWordBank();
    localStorage.removeItem(STORY_STORAGE_KEY);
    toast({ title: "삭제됨", description: "이야기를 삭제했습니다." });
  }
  
  const wordBankMap = useMemo(() => {
    const map = new Map<string, WordBankItem>();
    wordBank.forEach(item => {
      map.set(item.term.toLowerCase().split(' ')[0], item);
    });
    return map;
  }, [wordBank]);

  const highlightWords = useCallback((text: string) => {
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
  }, [wordBankMap]);

  const capitalizeFirstLetter = (string: string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  if (!story) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-[calc(100vh-200px)]">
        <BookOpen className="h-16 w-16 mb-4 text-muted-foreground" />
        <h1 className="text-4xl font-headline mb-4">새로운 이야기 만들기</h1>
        <p className="text-muted-foreground mb-8 max-w-md">학습하고 싶은 이야기의 주제를 자유롭게 정해보세요.</p>
        <div className="w-full max-w-sm space-y-4">
           <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="story-topic">이야기 주제 (영어로)</Label>
            <Input 
              id="story-topic"
              type="text" 
              placeholder="예: a cat who wants to be a pirate" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerateStory()}
              className="text-center"
            />
          </div>
          <Button onClick={handleGenerateStory} disabled={isGenerating || !topic.trim()} size="lg" variant="default" className="w-full">
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            {isGenerating ? '이야기 생성 중...' : '이야기 시작하기'}
          </Button>
        </div>
      </div>
    );
  }

  const currentParagraph = story.paragraphs[currentParagraphIndex];
  const sentences = currentParagraph.split(/(?<=[.?!])\s+/).filter(s => s.trim() !== '');
  const isLastParagraph = currentParagraphIndex === story.paragraphs.length - 1;

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader className="flex flex-row justify-between items-start">
          <div className="flex-grow">
            <CardTitle className="font-headline text-3xl mb-2">{capitalizeFirstLetter(story.title)}</CardTitle>
            <p className="text-lg font-semibold text-foreground">주제: {capitalizeFirstLetter(story.topic)}</p>
          </div>
          <Button variant="destructive" size="icon" onClick={handleDeleteStory} className="flex-shrink-0">
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">삭제</span>
          </Button>
        </CardHeader>
        <CardContent className="text-lg leading-relaxed space-y-4 min-h-[200px]">
          <TooltipProvider>
            <Sheet open={!!selectedSentence} onOpenChange={(isOpen) => !isOpen && setSelectedSentence(null)}>
              <div>
                <p className="mb-4">
                  {sentences.map((sentence, sIndex) => (
                    <SheetTrigger asChild key={sIndex}>
                      <span
                        onClick={() => handleSentenceClick(sentence)}
                        className="cursor-pointer hover:bg-accent/50 p-1 rounded-md transition-colors"
                      >
                        {highlightWords(sentence)}{' '}
                      </span>
                    </SheetTrigger>
                  ))}
                </p>
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
                                  onClick={() => saved ? removeWordByTerm(item.term) : addWord({term: item.term, definition: item.definition, type: 'grammar'})}
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
                                  onClick={() => saved ? removeWordByTerm(item.term) : addWord({term: item.term, definition: item.definition, type: 'vocabulary'})}
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
        <CardFooter className="flex justify-between items-center">
          <Button 
            onClick={() => setCurrentParagraphIndex(prev => prev - 1)} 
            disabled={currentParagraphIndex === 0}
            variant="outline"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            이전
          </Button>

          <div className="text-sm text-muted-foreground">
            {currentParagraphIndex + 1} / {story.paragraphs.length}
          </div>

          {isLastParagraph ? (
            <Button onClick={handleContinueStory} disabled={isContinuing}>
              {isContinuing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : '이야기 이어하기'}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={() => setCurrentParagraphIndex(prev => prev + 1)} 
              disabled={isLastParagraph}
            >
              다음
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
