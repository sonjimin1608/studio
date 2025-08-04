'use client';

import { useState, useEffect } from 'react';
import { analyzeSentenceAction, generateStoryAction } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Loader2, Plus, Check } from 'lucide-react';
import { useWordBank } from '@/context/WordBankContext';
import type { AnalyzeSentenceOutput } from '@/ai/flows/analyze-sentence';

const STORY_STORAGE_KEY = 'cuento-diario-story';
const CURRENT_DAY_STORAGE_KEY = 'cuento-diario-current-day';

export default function HomePage() {
  const [dailyLessons, setDailyLessons] = useState<string[]>([]);
  const [currentDay, setCurrentDay] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSentence, setSelectedSentence] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeSentenceOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const { addWord, isWordSaved } = useWordBank();

  useEffect(() => {
    try {
      const savedStory = localStorage.getItem(STORY_STORAGE_KEY);
      const savedDay = localStorage.getItem(CURRENT_DAY_STORAGE_KEY);
      if (savedStory) {
        setDailyLessons(JSON.parse(savedStory));
      }
      if (savedDay) {
        setCurrentDay(parseInt(savedDay, 10));
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
      } catch (error) {
        console.error("현재 날짜를 저장하는 데 실패했습니다.", error);
      }
    }
  }, [currentDay, dailyLessons]);

  const handleGenerateStory = async () => {
    setIsGenerating(true);
    const result = await generateStoryAction();
    if (result.success && result.data) {
      setDailyLessons(result.data);
      setCurrentDay(0);
      try {
        localStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(result.data));
      } catch (error) {
        console.error("이야기를 저장하는 데 실패했습니다.", error);
        toast({ title: "오류", description: "이야기를 로컬에 저장하지 못했습니다. 공간이 부족할 수 있습니다.", variant: 'destructive' });
      }
      toast({ title: "성공", description: "100일 분량의 새로운 이야기가 생성되었습니다!" });
    } else {
      toast({ title: "오류", description: result.error, variant: 'destructive' });
    }
    setIsGenerating(false);
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
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  if (dailyLessons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-[calc(100vh-200px)]">
        <h1 className="text-4xl font-headline mb-4">Cuento Diario에 오신 것을 환영합니다!</h1>
        <p className="text-muted-foreground mb-8 max-w-md">매일 새로운 스페인어 이야기로 즐겁게 학습해보세요. 학습을 시작하려면 먼저 나만의 이야기를 생성해야 합니다.</p>
        <Button onClick={handleGenerateStory} disabled={isGenerating} size="lg" variant="default">
          {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isGenerating ? '이야기 생성 중...' : '나만의 스페인어 이야기 생성하기'}
        </Button>
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
              <Button variant="outline" size="icon" onClick={() => changeDay(1)} disabled={currentDay === dailyLessons.length - 1}>
                <ChevronRight className="h-4 w-4" />
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
                    {sentence}{' '}
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
                      <h3 className="font-semibold mb-2 text-lg font-headline">주요 문법</h3>
                      <ul className="space-y-2">
                        {analysisResult.grammar.map((item, index) => {
                          const [term, ...definitionParts] = item.split(':');
                          const definition = definitionParts.join(':').trim();
                          return (
                            <li key={index} className="flex items-start justify-between p-3 bg-secondary/50 rounded-md">
                              <div>
                                <p className="font-semibold">{term}</p>
                                <p className="text-sm text-muted-foreground">{definition}</p>
                              </div>
                              <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0 ml-2" onClick={() => addWord({term, definition, type: 'grammar'})} disabled={isWordSaved(term)}>
                                {isWordSaved(term) ? <Check className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4" />}
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
                           const [term, ...definitionParts] = item.split(':');
                           const definition = definitionParts.join(':').trim();
                          return (
                            <li key={index} className="flex items-start justify-between p-3 bg-secondary/50 rounded-md">
                              <div>
                                <p className="font-semibold">{term}</p>
                                <p className="text-sm text-muted-foreground">{definition}</p>
                              </div>
                              <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0 ml-2" onClick={() => addWord({term, definition, type: 'vocabulary'})} disabled={isWordSaved(term)}>
                                {isWordSaved(term) ? <Check className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4" />}
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
          <p className="text-sm text-muted-foreground">총 {dailyLessons.length}일 중 {currentDay + 1}일차 학습</p>
        </CardFooter>
      </Card>
    </div>
  );
}
