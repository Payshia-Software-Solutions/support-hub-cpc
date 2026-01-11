
"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Check, Sparkles, Trophy, Loader2, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { mediMindGameData } from '@/lib/medimind-data';
import Image from 'next/image';

export default function MediMindGamePage() {
  const router = useRouter();
  const params = useParams();
  const levelId = params.levelId as string;
  const moduleId = params.moduleId as string;

  const [correctlyAnsweredIds, setCorrectlyAnsweredIds] = useState<Set<string>>(new Set());
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [coins, setCoins] = useState(0); // This would come from a global state
  const [levelScore, setLevelScore] = useState(0);
  const [firstAttempt, setFirstAttempt] = useState(true);

  const activeLevel = mediMindGameData.levels.find(l => l.id === levelId);
  const activeModule = mediMindGameData.medicine_data.find(m => m.id === moduleId);

  const currentQuestion = useMemo(() => {
    if (!activeModule || !activeLevel) return null;
    return activeLevel.questions.find(q => !correctlyAnsweredIds.has(q.id)) || null;
  }, [activeModule, activeLevel, correctlyAnsweredIds]);

  const answerOptions = currentQuestion ? mediMindGameData.answer_sets[currentQuestion.id] : [];
  
  const handleCheckAnswer = () => {
    if (!selectedAnswer || !activeModule || !currentQuestion) return;
    const correctAnswer = activeModule.answers[currentQuestion.id];
    const isCorrect = selectedAnswer === correctAnswer;
    
    if (isCorrect) {
      setIsAnswerCorrect(true);
      const points = 10;
      setCoins(prev => prev + points);
      setLevelScore(prev => prev + points);
      setCorrectlyAnsweredIds(prev => new Set(prev).add(currentQuestion.id));
      toast({ title: "Correct!", description: `+${points} coins!` });
    } else {
        setIsAnswerCorrect(false);
        if (firstAttempt) {
            setCoins(prev => prev - 2);
            toast({ variant: 'destructive', title: "Not quite!", description: "You lost 2 coins. Try again!" });
        } else {
            toast({ variant: 'destructive', title: "Still not right!" });
        }
        setFirstAttempt(false);
    }
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    setFirstAttempt(true);
  };
  
  const handleFinishModule = () => {
    toast({ title: "Module Complete!", description: `You earned ${levelScore} coins.` });
    router.push(`/dashboard/medimind/${levelId}`);
  };

  if (!activeLevel || !activeModule) {
    return <div className="p-8 text-center">Loading game...</div>;
  }
  
  const isModuleComplete = correctlyAnsweredIds.size === activeLevel.questions.length;
  const progress = (correctlyAnsweredIds.size / activeLevel.questions.length) * 100;

  return (
    <div className="p-4 md:p-8 space-y-6 pb-20">
      <header>
        <Button onClick={() => router.push(`/dashboard/medimind/${levelId}`)} variant="ghost" className="-ml-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Modules
        </Button>
      </header>
      
      {isModuleComplete ? (
        <Card className="shadow-lg text-center">
            <CardHeader>
                <Trophy className="h-24 w-24 text-amber-400 mx-auto mb-4" />
                <CardTitle className="text-3xl font-bold text-primary">Module Complete!</CardTitle>
                <CardDescription>You've successfully answered all questions for {activeModule.name}.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-lg">You earned</p>
                <p className="text-6xl font-bold my-2">{levelScore}</p>
                <p className="text-lg">coins in this module.</p>
            </CardContent>
            <CardFooter className="justify-center">
                <Button onClick={handleFinishModule}>
                    Back to Modules
                </Button>
            </CardFooter>
        </Card>
      ) : currentQuestion ? (
        <div className="space-y-6">
            <Card className="shadow-lg overflow-hidden">
                <div className="relative aspect-video bg-muted">
                    <Image src={`https://picsum.photos/seed/${activeModule.name}/800/450`} alt={activeModule.name} layout="fill" objectFit="cover" />
                </div>
            </Card>
            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl font-headline">{activeModule.name}</CardTitle>
                            <CardDescription>Question {correctlyAnsweredIds.size + 1} of {activeLevel.questions.length}</CardDescription>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-primary mt-1">Coins: {coins}</p>
                        </div>
                    </div>
                    <Progress value={progress} className="mt-4" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <Card className="bg-muted min-h-[6rem] p-4 flex flex-col justify-center items-center text-center">
                        <h3 className="text-lg font-semibold">{currentQuestion.text}</h3>
                    </Card>
                    {isAnswerCorrect === true && (
                        <Alert variant="default" className="bg-green-100 border-green-300 text-green-800">
                            <Check className="h-4 w-4 !text-green-800" />
                            <AlertTitle>Correct! You earned 10 coins.</AlertTitle>
                        </Alert>
                    )}
                    {isAnswerCorrect === false && (
                        <Alert variant="destructive">
                            <X className="h-4 w-4" />
                            <AlertTitle>Incorrect! Try again.</AlertTitle>
                            <AlertDescription>That wasn't the right answer. Select another option or try again.</AlertDescription>
                        </Alert>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {answerOptions.map(answer => (
                            <Button
                                key={answer}
                                variant={selectedAnswer === answer && isAnswerCorrect === null ? 'default' : selectedAnswer === answer && isAnswerCorrect === false ? 'destructive' : 'outline'}
                                onClick={() => setSelectedAnswer(answer)}
                                disabled={isAnswerCorrect === true}
                                className="h-auto py-3 text-sm"
                            >
                                {answer}
                            </Button>
                        ))}
                    </div>
                </CardContent>
                <CardFooter className="flex-col sm:flex-row justify-end gap-2">
                    {isAnswerCorrect === true ? (
                        <Button onClick={handleNextQuestion}>
                            Next Question <Sparkles className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button onClick={handleCheckAnswer} disabled={!selectedAnswer}>
                            <Check className="mr-2 h-4 w-4" /> Check Answer
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
      ) : null}
    </div>
  );
}
