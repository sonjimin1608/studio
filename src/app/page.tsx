'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { analyzeSentenceAction, generateNewStoryAction, textToSpeechAction } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Plus, Trash2, Wand2, ChevronRight, BookOpen, ChevronLeft, Volume2 } from 'lucide-react';
import { useWordBank } from '@/context/WordBankContext';
import type { AnalyzeSentenceOutput, VocabularyItem } from '@/ai/flows/analyze-sentence';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

const STORY_STORAGE_KEY = 'novela-story';

interface Story {
  topic: string;
  language: string;
  level: number;
  title: string;
  paragraphs: string[];
}

type SentenceAnalysis = {
  sentence: string;
  analysis: AnalyzeSentenceOutput | null;
  isLoading: boolean;
};

const LANGUAGES = [
  { value: 'Spanish', label: '스페인어' },
  { value: 'English', label: '영어' },
  { value: 'German', label: '독일어' },
  { value: 'Chinese', label: '중국어' },
  { value: 'Japanese', label: '일본어' },
];

export default function StoryPage() {
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [activeAnalysis, setActiveAnalysis] = useState<SentenceAnalysis | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState('Spanish');
  const [level, setLevel] = useState(4);

  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingWord, setSpeakingWord] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { toast } = useToast();
  const { addWord, removeWord, isWordSaved } = useWordBank();

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
    
    // Setup audio element
    if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.onended = () => {
          setIsSpeaking(false);
          setSpeakingWord(null);
        }
    }
  }, []);

  useEffect(() => {
    if (story) {
      localStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(story));
    }
  }, [story]);

  const analyzeAndCacheSentence = useCallback(async (sentence: string, paragraphIndex: number): Promise<SentenceAnalysis> => {
    const cachedAnalysis = paragraphAnalyses[paragraphIndex]?.find(p => p.sentence === sentence);
    if (cachedAnalysis && (cachedAnalysis.analysis || cachedAnalysis.isLoading)) {
      return cachedAnalysis;
    }

    const analysisState: SentenceAnalysis = { sentence, analysis: null, isLoading: true };
    
    setParagraphAnalyses(prev => {
        const para = prev[paragraphIndex] || [];
        if (!para.some(s => s.sentence === sentence)) {
             return { ...prev, [paragraphIndex]: [...para, analysisState] };
        }
        return prev;
    });
    
    setActiveAnalysis(analysisState);
    setIsSheetOpen(true);

    const result = await analyzeSentenceAction(sentence, story?.language || 'Spanish');
    
    const finalAnalysis: SentenceAnalysis = { 
        ...analysisState, 
        analysis: result.success ? result.data : null, 
        isLoading: false 
    };

    setParagraphAnalyses(prev => {
        const para = prev[paragraphIndex] || [];
        const newPara = para.map(s => s.sentence === sentence ? finalAnalysis : s);
        return { ...prev, [paragraphIndex]: newPara };
    });

    setActiveAnalysis(finalAnalysis);
    return finalAnalysis;
  }, [paragraphAnalyses, story?.language]);


  const handleSentenceClick = async (sentence: string, paragraphIndex: number) => {
    const analysis = await analyzeAndCacheSentence(sentence, paragraphIndex);
    setActiveAnalysis(analysis);
    setIsSheetOpen(true);
  }

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

  const handleSpeak = async (text: string, isWord: boolean = false) => {
    if (isSpeaking || speakingWord) return;

    if(isWord) {
      setSpeakingWord(text);
    } else {
      setIsSpeaking(true);
    }

    const result = await textToSpeechAction(text);

    if (result.success && audioRef.current) {
      audioRef.current.src = result.data.audioDataUri;
      audioRef.current.play().catch(e => {
        console.error("오디오 재생에 실패했습니다.", e);
        setIsSpeaking(false);
        setSpeakingWord(null);
      });
    } else {
      toast({ title: "오류", description: result.error, variant: 'destructive' });
      setIsSpeaking(false);
      setSpeakingWord(null);
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
    const result = await generateNewStoryAction(topic, language, level);
    
    if (result.success && result.data?.paragraphs) {
      const newStory: Story = { 
        topic: topic, 
        language,
        level,
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
        <p className="text-muted-foreground mb-8 max-w-md">학습하고 싶은 이야기의 주제와 언어, 난이도를 자유롭게 설정해보세요.</p>
        <div className="w-full max-w-sm space-y-6">
           <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="story-topic">이야기 주제</Label>
            <Input 
              id="story-topic"
              type="text" 
              placeholder="예: 해적이 되고 싶은 고양이" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="text-center"
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label>언어</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="언어를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="level">어휘 수준 (1: 쉬움, 10: 어려움)</Label>
            <Slider
              id="level"
              min={1}
              max={10}
              step={1}
              value={[level]}
              onValueChange={(value) => setLevel(value[0])}
            />
            <div className="text-center font-bold text-lg">{level}</div>
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
  const sentences = currentParagraph.split(/(?<=[.?!。！？])\s+/).filter(s => s.trim() !== '');
  const isLastParagraph = currentParagraphIndex === story.paragraphs.length - 1;
  const progressValue = ((currentParagraphIndex + 1) / story.paragraphs.length) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader className="flex flex-row justify-between items-start">
          <div>
            <CardTitle className="font-headline text-3xl mb-2">{capitalizeFirstLetter(story.title)}</CardTitle>
            <CardDescription className="text-lg font-semibold text-foreground">{story.topic}</CardDescription>
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
          
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <div className="mb-4 select-text">
                {sentences.map((sentence, sIndex) => (
                  <span 
                    key={sIndex}
                    className="cursor-pointer hover:bg-accent/30"
                    onClick={() => handleSentenceClick(sentence, currentParagraphIndex)}
                  >
                    {sentence}
                    {' '}
                  </span>
                ))}
              </div>

              <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                   <div className="flex items-center gap-2">
                    <SheetTitle className="font-headline">문장 분석</SheetTitle>
                    <Button variant="ghost" size="icon" onClick={() => activeAnalysis?.sentence && handleSpeak(activeAnalysis.sentence)} disabled={isSpeaking || !!speakingWord}>
                      {isSpeaking ? <Loader2 className="h-5 w-5 animate-spin" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                  </div>
                  <SheetDescription asChild>
                    <div className="mt-2 p-3 bg-muted rounded-md text-sm select-text">{activeAnalysis?.sentence}</div>
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4 select-text">
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
                                <div className="flex items-center gap-2 flex-grow">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 flex-shrink-0"
                                    onClick={() => handleSpeak(item.term, true)}
                                    disabled={isSpeaking || !!speakingWord}
                                  >
                                    {speakingWord === item.term ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
                                  </Button>
                                  <div className="flex-grow">
                                    <p className="font-semibold">{item.term} <span className="text-muted-foreground">({item.lemma})</span></p>
                                    {item.pinyin && <p className="text-sm text-muted-foreground">{item.pinyin}</p>}
                                    <p className="text-sm text-muted-foreground">{item.pos}{item.gender && item.gender !== 'n/a' ? ` (${item.gender})` : ''} - {item.definition}</p>
                                  </div>
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
