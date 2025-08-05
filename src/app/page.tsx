'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, BookOpen } from 'lucide-react';
import type { Story } from '@/lib/types';
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

const STORIES_STORAGE_KEY = 'novela-stories';

export default function StoryListPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedStories = localStorage.getItem(STORIES_STORAGE_KEY);
      if (savedStories) {
        setStories(JSON.parse(savedStories));
      }
    } catch (error) {
      console.error("저장된 이야기를 불러오는 데 실패했습니다.", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDeleteStory = (storyId: string) => {
    const updatedStories = stories.filter(story => story.id !== storyId);
    setStories(updatedStories);
    try {
      localStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify(updatedStories));
      toast({ title: "성공", description: "이야기를 삭제했습니다." });
    } catch (error) {
      console.error("이야기를 삭제하는 데 실패했습니다.", error);
      toast({ title: "오류", description: "이야기를 삭제하는 데 실패했습니다.", variant: 'destructive' });
      // Revert state if saving fails
      setStories(stories);
    }
  };
  
  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-headline">나의 이야기들</h1>
        <Button asChild>
          <Link href="/new-story">
            <Plus className="mr-2 h-4 w-4" /> 새 이야기 만들기
          </Link>
        </Button>
      </div>

      {stories.length === 0 ? (
        <div className="text-center py-20 flex flex-col items-center">
            <BookOpen className="h-16 w-16 mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">아직 이야기가 없습니다.</h2>
            <p className="text-muted-foreground mb-4">새로운 이야기를 만들어 스페인어 학습을 시작해보세요.</p>
            <Button asChild size="lg">
                <Link href="/new-story">
                    <Plus className="mr-2 h-4 w-4" /> 첫 이야기 시작하기
                </Link>
            </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stories.map(story => (
            <Card key={story.id} className="flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="truncate">{story.topic}</CardTitle>
                <CardDescription>
                  {new Date(story.createdAt).toLocaleDateString()} 생성됨
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                 <p className="text-sm text-muted-foreground line-clamp-3">
                   {story.lessons[0] || '내용 없음'}
                 </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button asChild variant="secondary" className="flex-grow mr-2">
                  <Link href={`/story/${story.id}`}>이야기 읽기</Link>
                </Button>
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
                      <AlertDialogDescription>
                        이 작업은 되돌릴 수 없습니다. 이 이야기는 영구적으로 삭제됩니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteStory(story.id)}>
                        삭제
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}