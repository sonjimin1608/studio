'use client';

import { useState, useEffect, useCallback } from 'react';
import { analyzeSentenceAction, generateNewStoryAction } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Plus, Trash2, Wand2, ChevronRight, BookOpen, ChevronLeft } from 'lucide-react';
import { useWordBank } from '@/context/WordBankContext';
import type { AnalyzeSentenceOutput, VocabularyItem } from '@/ai/flows/analyze-sentence';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

const STORY_STORAGE_KEY = 'novela-story';

interface Story {
  topic: string;
  title: string;
  paragraphs: string[];
}

type SentenceAnalysis = {
  sentence: string;
  analysis: AnalyzeSentenceOutput | null;
  isLoading: boolean;
};

export default function StoryPage() {
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [activeAnalysis, setActiveAnalysis] = useState<SentenceAnalysis | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const [topic, setTopic] = useState('');
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  
  const { toast } = useToast();
  const { addWord, removeWord, isWordSaved, wordBank } = useWordBank();

  const [paragraphAnalyses, setParagraphAnalyses] = useState<Record<number, SentenceAnalysis[]>>({});
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedStoryRaw = localStorage.getItem(STORY_STORAGE_KEY);
        if (savedStoryRaw) {
          const savedStory = JSON.parse(savedStoryRaw);
          setStory(savedStory);
          setCurrentParagraphIndex(0);
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

  const analyzeAndCacheSentence = useCallback(async (sentence: string, paragraphIndex: number) => {
    setParagraphAnalyses(prev => {
        const para = prev[paragraphIndex] || [];
        if (para.some(s => s.sentence === sentence && (s.analysis || s.isLoading))) {
            return prev;
        }
        const newPara = para.map(s => s.sentence === sentence ? { ...s, isLoading: true } : s);
        if (!newPara.some(s => s.sentence === sentence)) {
            newPara.push({ sentence, analysis: null, isLoading: true });
        }
        return { ...prev, [paragraphIndex]: newPara };
    });

    const result = await analyzeSentenceAction(sentence);

    setParagraphAnalyses(prev => {
        const para = prev[paragraphIndex] || [];
        const newPara = para.map(s => s.sentence === sentence ? { ...s, analysis: result.success ? result.data : null, isLoading: false } : s);
        return { ...prev, [paragraphIndex]: newPara };
    });

  }, []);

  const handleToggleWord = (word: VocabularyItem) => {
    const wordInBank = isWordSaved(word.term);
    if (wordInBank) {
      removeWord(word.term);
    } else {
      addWord({
        term: word.term,
        lemma: word.lemma,
        definition: `${word.pos}${word.gender && word.gender !== 'n/a' ? ` (${word.gender})` : ''} - ${word.definition}`,
        type: 'vocabulary'
      });
    }
  }

  const capitalizeFirstLetter = (string: string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const handleGenerateStory = async () => {
    if (!topic.trim()) {
      toast({ title: "오류", description: "이야기 주제를 입력해주세요.", variant: 'destructive' });
      return;
    }
    
    setIsGenerating(true);
    setParagraphAnalyses({});
    const result = await generateNewStoryAction(topic);
    
    if (result.success && result.data?.paragraphs) {
      const newStory: Story = { 
        topic: topic, 
        title: result.data.title,
        paragraphs: result.data.paragraphs
      };
      setStory(newStory);
      setCurrentParagraphIndex(0);
      toast({ title: "성공", description: "새로운 이야기가 생성되었습니다!" });
    } else {
      toast({ title: "오류", description: result.error, variant: 'destructive' });
    }
    setIsGenerating(false);
  };
  
  const handleDeleteStory = () => {
    setStory(null);
    setTopic('');
    setCurrentParagraphIndex(0);
    setParagraphAnalyses({});
    localStorage.removeItem(STORY_STORAGE_KEY);
    toast({ title: "삭제됨", description: "이야기를 삭제했습니다." });
  }

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
  const progressValue = ((currentParagraphIndex + 1) / story.paragraphs.length) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader className="flex flex-row justify-between items-start">
          <div>
            <CardTitle className="font-headline text-3xl mb-2">{capitalizeFirstLetter(story.title)}</CardTitle>
            {!story.title && <CardDescription className="text-lg font-semibold text-foreground">{capitalizeFirstLetter(story.topic)}</CardDescription>}
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon" className="flex-shrink-0">
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">삭제</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>정말로 삭제하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  이 작업은 되돌릴 수 없습니다. 현재 이야기가 영구적으로 삭제됩니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteStory}>삭제</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardHeader>
        <CardContent className="text-lg leading-relaxed space-y-4 min-h-[200px]">
          <TooltipProvider>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <div className="mb-4">
                {sentences.map((sentence, sIndex) => {
                  const sentenceAnalysis = paragraphAnalyses[currentParagraphIndex]?.find(p => p.sentence === sentence);
                  return (
                    <Tooltip key={sIndex} delayDuration={100}>
                      <TooltipTrigger asChild>
                        <span 
                          onMouseEnter={() => analyzeAndCacheSentence(sentence, currentParagraphIndex)}
                          className="cursor-pointer"
                          onClick={() => {
                            if (sentenceAnalysis && sentenceAnalysis.analysis) {
                                setActiveAnalysis(sentenceAnalysis);
                                setIsSheetOpen(true);
                            }
                          }}
                        >
                          {sentence}
                          {' '}
                        </span>
                      </TooltipTrigger>
                      {sentenceAnalysis?.analysis?.translation && (
                        <TooltipContent>
                          <p>{sentenceAnalysis.analysis.translation}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </div>

              <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="font-headline">문장 분석</SheetTitle>
                  <SheetDescription asChild>
                    <div className="mt-2 p-3 bg-muted rounded-md text-sm">{activeAnalysis?.sentence}</div>
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  {activeAnalysis?.isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-1/3" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-8 w-1/3 mt-4" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : activeAnalysis?.analysis ? (
                    <div className="space-y-6">
                       {activeAnalysis.analysis.translation && (
                        <div>
                            <h3 className="font-semibold mb-2 text-lg font-headline">번역</h3>
                            <p className="p-3 bg-secondary/50 rounded-md">{activeAnalysis.analysis.translation}</p>
                        </div>
                       )}
                      <div>
                        <h3 className="font-semibold mb-2 text-lg font-headline">어휘</h3>
                        <ul className="space-y-2">
                          {activeAnalysis.analysis.vocabulary.map((item: VocabularyItem, index: number) => {
                            const saved = isWordSaved(item.term);
                             return (
                              <li key={index} className="flex items-start justify-between p-3 bg-secondary/50 rounded-md">
                                <div>
                                  <p className="font-semibold">{item.term} <span className="text-muted-foreground">({item.lemma})</span></p>
                                  <p className="text-sm text-muted-foreground">{item.pos}{item.gender && item.gender !== 'n/a' ? ` (${item.gender})` : ''} - {item.definition}</p>
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 flex-shrink-0 ml-2"
                                  onClick={() => handleToggleWord(item)}
                                >
                                  {saved ? <Trash2 className="h-4 w-4 text-destructive" /> : <Plus className="h-4 w-4" />}
                                </Button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                      {activeAnalysis.analysis.grammar && activeAnalysis.analysis.grammar.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-2 text-lg font-headline">주요 문법</h3>
                          <ul className="space-y-2">
                            {activeAnalysis.analysis.grammar.map((item: any, index: number) => (
                              <li key={index} className="p-3 bg-secondary/50 rounded-md">
                                <p className="font-semibold">{item.topic}</p>
                                <p className="text-sm text-muted-foreground">{item.explanation}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    activeAnalysis && <p className="text-center text-muted-foreground">분석 결과를 불러오는 데 실패했습니다.</p>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </TooltipProvider>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
           <div className="w-full">
            <Progress value={progressValue} className="w-full" />
           </div>
           <div className="flex justify-between items-center w-full">
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

              <Button 
                onClick={() => {
                  if (!isLastParagraph) {
                    setCurrentParagraphIndex(prev => prev + 1);
                    setActiveAnalysis(null);
                    setIsSheetOpen(false);
                  }
                }} 
                disabled={isLastParagraph}
              >
                다음
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
           </div>
        </CardFooter>
      </Card>
    </div>
  );
}
