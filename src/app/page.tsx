'use client';

import { useState, useEffect, useMemo } from 'react';
import { analyzeSentenceAction, generateStoryParagraphAction } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Loader2, Plus, Wand2, Trash2 } from 'lucide-react';
import { useWordBank } from '@/context/WordBankContext';
import type { AnalyzeSentenceOutput } from '@/ai/flows/analyze-sentence';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const STORY_STORAGE_KEY = 'cuento-diario-story';
const CURRENT_DAY_STORAGE_KEY = 'cuento-diario-current-day';
const STORY_TOPIC_STORAGE_KEY = 'cuento-diario-story-topic';

export default function HomePage() {
  const [dailyLessons, setDailyLessons] = useState<string[]>([]);
  const [currentDay, setCurrentDay] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSentence, setSelectedSentence] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeSentenceOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const { addWord, removeWordByTerm, isWordSaved, wordBank } = useWordBank();
  const [storyTopic, setStoryTopic] = useState('');
  const [isNewStory, setIsNewStory] = useState(true);

  useEffect(() => {
    try {
      const savedStory = localStorage.getItem(STORY_STORAGE_KEY);
      const savedDay = localStorage.getItem(CURRENT_DAY_STORAGE_KEY);
      const savedTopic = localStorage.getItem(STORY_TOPIC_STORAGE_KEY);
      
      if (savedStory) {
        const parsedStory = JSON.parse(savedStory);
        if(parsedStory.length > 0) {
          setDailyLessons(parsedStory);
          setIsNewStory(false);
        }
      }
      if (savedDay) {
        setCurrentDay(parseInt(savedDay, 10));
      }
      if (savedTopic) {
        setStoryTopic(savedTopic);
      }
    } catch (error) {
      console.error("저장된 데이터를 불러오는 데 실패했습니다.", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (dailyLessons.length > 0) {
      try {
        localStorage.setItem(CURRENT_DAY_STORAGE_KEY, String(currentDay));
        localStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(dailyLessons));
        localStorage.setItem(STORY_TOPIC_STORAGE_KEY, storyTopic);
      } catch (error) {
        console.error("데이터를 저장하는 데 실패했습니다.", error);
      }
    }
  }, [currentDay, dailyLessons, storyTopic]);
  
  const handleGenerateStory = async () => {
    if (!storyTopic.trim()) {
      toast({ title: "오류", description: "이야기 주제를 입력해주세요.", variant: 'destructive' });
      return;
    }
    
    setIsGenerating(true);
    const result = await generateStoryParagraphAction({ topic: storyTopic, previousContext: '' });
    if (result.success && result.data) {
      const newLessons = [result.data];
      setDailyLessons(newLessons);
      setCurrentDay(0);
      setIsNewStory(false);
      toast({ title: "성공", description: "새로운 이야기가 시작되었습니다!" });
    } else {
      toast({ title: "오류", description: result.error, variant: 'destructive' });
    }
    setIsGenerating(false);
  };

  const handleNextDay = async () => {
    if (currentDay < dailyLessons.length - 1) {
      setCurrentDay(currentDay + 1);
    } else {
      setIsGenerating(true);
      const previousContext = dailyLessons.join('\n\n');
      const result = await generateStoryParagraphAction({ topic: storyTopic, previousContext });
      
      if (result.success && result.data) {
        const newLessons = [...dailyLessons, result.data];
        setDailyLessons(newLessons);
        setCurrentDay(newLessons.length - 1);
      } else {
        toast({ title: "오류", description: result.error, variant: 'destructive' });
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
    const newDay = currentDay + offset;
    if (newDay >= 0 && newDay < dailyLessons.length) {
      setCurrentDay(newDay);
    }
  };
  
  const wordBankTerms = useMemo(() => new Set(wordBank.map(item => item.term.toLowerCase())), [wordBank]);

  const highlightWords = (text: string) => {
    const wordsAndPunctuation = text.split(/(\b\w+\b|[.,?!;])/);
    return wordsAndPunctuation.map((part, index) => {
      if (wordBankTerms.has(part.toLowerCase())) {
        return <span key={index} className="bg-yellow-200/50 dark:bg-yellow-700/50 rounded-md">{part}</span>;
      }
      return part;
    });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  if (isNewStory) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-[calc(100vh-200px)]">
        <h1 className="text-4xl font-headline mb-4">Cuento Diario에 오신 것을 환영합니다!</h1>
        <p className="text-muted-foreground mb-8 max-w-md">매일 새로운 스페인어 이야기로 즐겁게 학습해보세요. 시작하려면 이야기의 주제를 정해주세요.</p>
        <div className="w-full max-w-sm space-y-4">
           <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="story-topic">이야기 주제 (영어로)</Label>
            <Input 
              id="story-topic"
              type="text" 
              placeholder="예: a cat who wants to be a pirate" 
              value={storyTopic}
              onChange={(e) => setStoryTopic(e.target.value)}
              className="text-center"
            />
          </div>
          <Button onClick={handleGenerateStory} disabled={isGenerating || !storyTopic.trim()} size="lg" variant="default" className="w-full">
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            {isGenerating ? '이야기 생성 중...' : '새로운 이야기 시작하기'}
          </Button>
        </div>
      </div>
    );
  }

  const lessonText = dailyLessons[currentDay];
  const sentences = lessonText.split(/(?<=[.?!])\s+/).filter(s => s.trim() !== '');

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="font-headline text-3xl">Day {currentDay + 1}</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => changeDay(-1)} disabled={currentDay === 0}>
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
          <Sheet open={!!selectedSentence} onOpenChange={(isOpen) => !isOpen && setSelectedSentence(null)}>
            <p>
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
            </p>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="font-headline">문장 분석</SheetTitle>
                <SheetDescription asChild>
                  <p className="mt-2 p-3 bg-muted rounded-md text-sm">{selectedSentence}</p>
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
                                onClick={() => saved ? removeWordByTerm(item.term) : addWord({...item, type: 'grammar'})}
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
                                onClick={() => saved ? removeWordByTerm(item.term) : addWord({...item, type: 'vocabulary'})}
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
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">{storyTopic}</p>
        </CardFooter>
      </Card>
    </div>
  );
}
