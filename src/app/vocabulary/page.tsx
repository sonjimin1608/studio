
'use client';

import { useState, useRef } from 'react';
import { useWordBank } from '@/context/WordBankContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Bookmark } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { WordBankItem } from '@/lib/types';
import { cn } from '@/lib/utils';
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
} from "@/components/ui/alert-dialog";

export default function VocabularyPage() {
  const { wordBank, removeWord, clearWordBank } = useWordBank();
  const [activeCardLemma, setActiveCardLemma] = useState<string | null>(null);
  const touchTimer = useRef<NodeJS.Timeout | null>(null);

  const vocabulary = wordBank.filter(item => item.type === 'vocabulary');
  const grammar = wordBank.filter(item => item.type === 'grammar');

  const handleTouchStart = (lemma: string) => {
    touchTimer.current = setTimeout(() => {
      setActiveCardLemma(lemma);
    }, 500); // 500ms for long press
  };

  const handleTouchEnd = () => {
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
    }
  };
  
  const handleMouseLeave = () => {
    setActiveCardLemma(null);
  }

  if (wordBank.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-[calc(100vh-200px)]">
        <Bookmark className="h-16 w-16 mb-4 text-muted-foreground" />
        <h1 className="text-4xl font-headline mb-4">단어장이 비어있습니다</h1>
        <p className="text-muted-foreground max-w-md">이야기를 읽으면서 모르는 단어나 문법을 추가하여 나만의 단어장을 만들어보세요.</p>
      </div>
    );
  }

  const WordList = ({ items }: { items: WordBankItem[] }) => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card 
          key={item.lemma} 
          className="flex flex-col relative group"
          onMouseEnter={() => setActiveCardLemma(item.lemma)}
          onMouseLeave={handleMouseLeave}
          onTouchStart={() => handleTouchStart(item.lemma)}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchEnd}
          onContextMenu={(e) => e.preventDefault()} // Prevent context menu on long press
        >
          <CardHeader>
            <div className="flex justify-between items-start gap-2">
              <div>
                <CardTitle className="text-xl">{item.lemma}</CardTitle>
                <Badge variant={item.type === 'grammar' ? 'secondary' : 'outline'} className="mt-2">
                  {item.type === 'grammar' ? '문법' : '어휘'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-muted-foreground">{item.definition}</p>
          </CardContent>
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "absolute top-2 right-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
              { "opacity-100": activeCardLemma === item.lemma }
            )}
            onClick={(e) => {
              e.stopPropagation();
              removeWord(item.lemma);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </Card>
      ))}
    </div>
  );


  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-headline mb-2">나의 단어장</h1>
          <p className="text-muted-foreground">저장한 단어와 문법을 복습하세요.</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              전체 삭제
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>정말로 모든 단어를 삭제하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                이 작업은 되돌릴 수 없습니다. 단어장에 저장된 모든 항목이 영구적으로 삭제됩니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={clearWordBank}>삭제</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
          <TabsTrigger value="all">전체 ({wordBank.length})</TabsTrigger>
          <TabsTrigger value="vocabulary">어휘 ({vocabulary.length})</TabsTrigger>
          <TabsTrigger value="grammar">문법 ({grammar.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          <WordList items={wordBank} />
        </TabsContent>
        <TabsContent value="vocabulary" className="mt-6">
          {vocabulary.length > 0 ? <WordList items={vocabulary} /> : <p className="text-center text-muted-foreground py-10">저장된 어휘가 없습니다.</p>}
        </TabsContent>
        <TabsContent value="grammar" className="mt-6">
          {grammar.length > 0 ? <WordList items={grammar} /> : <p className="text-center text-muted-foreground py-10">저장된 문법이 없습니다.</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
