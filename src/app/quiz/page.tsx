'use client';

import { useState } from 'react';
import { useWordBank } from '@/context/WordBankContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BrainCircuit, BookCopy, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { WordBankProvider } from '@/context/WordBankContext';


interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

const MIN_WORDS_FOR_QUIZ = 4;

function QuizComponent() {
  const { wordBank } = useWordBank();
  const [quizState, setQuizState] = useState<'idle' | 'running' | 'finished'>('idle');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);

  const startQuiz = () => {
    if (wordBank.length < MIN_WORDS_FOR_QUIZ) {
      return;
    }
    
    const shuffledBank = [...wordBank].sort(() => 0.5 - Math.random());
    const quizQuestions: QuizQuestion[] = shuffledBank.map((item, _index, arr) => {
      const correctAnswer = item.definition;
      
      let wrongAnswers = arr
        .filter(i => i.id !== item.id)
        .map(i => i.definition);
      
      // Shuffle wrong answers and take 3
      wrongAnswers = wrongAnswers.sort(() => 0.5 - Math.random()).slice(0, 3);
        
      while(wrongAnswers.length < 3) {
          wrongAnswers.push(`오답 예시 ${wrongAnswers.length + 1}`);
      }

      const options = [...wrongAnswers, correctAnswer].sort(() => 0.5 - Math.random());
      
      return {
        question: item.term,
        options,
        correctAnswer,
      };
    });

    setQuestions(quizQuestions);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setQuizState('running');
  };

  const handleAnswer = (answer: string) => {
    if (isAnswered) return;
    setSelectedAnswer(answer);
    setIsAnswered(true);
    if (answer === questions[currentQuestionIndex].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setQuizState('finished');
    }
  };

  if (quizState === 'idle') {
    if (wordBank.length < MIN_WORDS_FOR_QUIZ) {
      return (
        <div className="flex flex-col items-center justify-center text-center h-[calc(100vh-200px)]">
          <BookCopy className="h-16 w-16 mb-4 text-muted-foreground" />
          <h1 className="text-4xl font-headline mb-4">퀴즈를 만들 수 없습니다</h1>
          <p className="text-muted-foreground max-w-md">퀴즈를 생성하려면 단어장에 최소 {MIN_WORDS_FOR_QUIZ}개의 항목이 필요합니다. 현재 {wordBank.length}개가 있습니다.</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center text-center h-[calc(100vh-200px)]">
        <BrainCircuit className="h-16 w-16 mb-4 text-primary" />
        <h1 className="text-4xl font-headline mb-4">단어장 퀴즈</h1>
        <p className="text-muted-foreground max-w-md mb-8">단어장에 추가한 항목들을 바탕으로 4지선다 퀴즈를 풀어보며 복습하세요.</p>
        <Button onClick={startQuiz} size="lg">퀴즈 시작하기</Button>
      </div>
    );
  }

  if (quizState === 'finished') {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <Card className="max-w-2xl mx-auto text-center">
        <CardHeader>
          <BarChart3 className="h-12 w-12 mx-auto text-primary" />
          <CardTitle className="font-headline text-3xl mt-4">퀴즈 결과</CardTitle>
          <CardDescription>수고하셨습니다!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-4xl font-bold">{percentage}%</p>
          <p className="text-lg text-muted-foreground">{questions.length}개 중 {score}개를 맞혔습니다.</p>
          <Button onClick={startQuiz} size="lg">다시 풀어보기</Button>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progressValue = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-4">
        <Progress value={progressValue} className="mb-2" />
        <p className="text-sm text-muted-foreground">질문 {currentQuestionIndex + 1} / {questions.length}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-3xl md:text-4xl font-normal py-8">{currentQuestion.question}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQuestion.options.map((option, index) => {
            const isCorrect = option === currentQuestion.correctAnswer;
            const isSelected = option === selectedAnswer;
            return (
              <Button
                key={index}
                variant="outline"
                className={cn(
                  "h-auto p-4 text-base text-left justify-start whitespace-normal transition-all duration-300",
                  isAnswered && isCorrect && "bg-green-100 border-green-400 text-green-900 hover:bg-green-200 dark:bg-green-900/50 dark:border-green-700 dark:text-green-200",
                  isAnswered && isSelected && !isCorrect && "bg-red-100 border-red-400 text-red-900 hover:bg-red-200 dark:bg-red-900/50 dark:border-red-700 dark:text-red-200",
                  !isAnswered && "hover:bg-accent/50"
                )}
                onClick={() => handleAnswer(option)}
                disabled={isAnswered}
              >
                {option}
              </Button>
            );
          })}
        </CardContent>
        {isAnswered && (
          <CardContent className="text-center mt-4">
            <Button onClick={nextQuestion} className="w-full md:w-auto" size="lg">
              {currentQuestionIndex < questions.length - 1 ? '다음 문제' : '결과 보기'}
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default function QuizPage() {
    return (
        <WordBankProvider>
            <QuizComponent />
        </WordBankProvider>
    )
}
