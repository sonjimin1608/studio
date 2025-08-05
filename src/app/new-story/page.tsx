'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateNewStoryAction } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2 } from 'lucide-react';
import type { Story } from '@/lib/types';

const STORIES_STORAGE_KEY = 'novela-stories';

export default function NewStoryPage() {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleGenerateStory = async () => {
    if (!topic.trim()) {
      toast({ title: "오류", description: "이야기 주제를 입력해주세요.", variant: 'destructive' });
      return;
    }
    
    setIsGenerating(true);
    const result = await generateNewStoryAction(topic);
    
    if (result.success && result.data) {
      const newStory = result.data;
      try {
        const savedStoriesRaw = localStorage.getItem(STORIES_STORAGE_KEY);
        const savedStories: Story[] = savedStoriesRaw ? JSON.parse(savedStoriesRaw) : [];
        const updatedStories = [newStory, ...savedStories];
        localStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify(updatedStories));
        
        toast({ title: "성공", description: "새로운 이야기가 시작되었습니다!" });
        router.push(`/story/${newStory.id}`);
      } catch (e) {
         toast({ title: "저장 오류", description: "이야기 저장에 실패했습니다.", variant: 'destructive' });
      }
    } else {
      toast({ title: "오류", description: result.error, variant: 'destructive' });
    }
    setIsGenerating(false);
  };

  return (
    <div className="flex flex-col items-center justify-center text-center h-[calc(100vh-200px)]">
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
