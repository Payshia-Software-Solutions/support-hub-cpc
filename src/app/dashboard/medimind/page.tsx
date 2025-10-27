
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Check, Lightbulb, RefreshCw, Sparkles, Trophy, ChevronRight, BrainCircuit, X, CheckCircle, BookCopy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { mediMindGameData, MedicineModule } from '@/lib/medimind-data';
import { cn } from '@/lib/utils';
import { MediMindIcon } from '@/components/icons/module-icons';

type View = 'levels' | 'game' | 'results';

export default function MediMindPage() {
  const router = useRouter();
  const [view, setView] = useState<View>('levels');
  const [modules, setModules] = useState<MedicineModule[]>(mediMindGameData.medicine_data);
  const [activeModule, setActiveModule] = useState<MedicineModule | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [levelScore, setLevelScore] = useState(0);

  const questionSet = mediMindGameData.question_set;

  const startModule = (module: MedicineModule) => {
    setActiveModule(module);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    setLevelScore(0);
    setView('game');
  };

  const handleCheckAnswer = () => {
    if (!selectedAnswer || !activeModule) return;

    const currentQuestion = questionSet[currentQuestionIndex];
    const correctAnswer = activeModule.answers[currentQuestion.id];

    if (selectedAnswer === correctAnswer) {
      setIsAnswerCorrect(true);
      const points = 10;
      setScore(prev => prev + points);
      setLevelScore(prev => prev + points);
      toast({ title: "Correct!", description: `+${points} points!` });
    } else {
      setIsAnswerCorrect(false);
      toast({ variant: 'destructive', title: "Not quite!", description: "That's not the right answer. Try to remember!" });
    }
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);

    if (currentQuestionIndex < questionSet.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Module finished
      const updatedModules = modules.map(m =>
        m.name === activeModule?.name ? { ...m, status: 'completed' } : m
      );
      setModules(updatedModules);
      setView('results');
    }
  };

  const handleFinish = () => {
    setView('levels');
    setActiveModule(null);
  };
  
  const currentQuestion = activeModule ? questionSet[currentQuestionIndex] : null;
  const answerOptions = currentQuestion ? mediMindGameData.answer_sets[currentQuestion.id] : [];
  const progress = activeModule ? ((currentQuestionIndex) / questionSet.length) * 100 : 0;

  const renderLevelSelection = () => (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline flex items-center gap-3"><MediMindIcon className="w-8 h-8"/> MediMind Challenge</CardTitle>
        <CardDescription>Select a medicine to test your pharmacology knowledge.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center p-4 rounded-lg bg-muted">
            <p className="text-muted-foreground">Total Score</p>
            <p className="text-4xl font-bold text-primary">{score}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {modules.map((module) => (
            <button key={module.name} onClick={() => startModule(module)} disabled={module.status === 'completed'} className="group block h-full text-left">
              <Card className={cn("shadow-md hover:shadow-lg hover:border-primary/50 transition-all h-full", module.status === 'completed' && "bg-green-100 border-green-300")}>
                <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                   {module.status === 'completed' ? <CheckCircle className="w-8 h-8 text-green-500" /> : <BookCopy className="w-8 h-8 text-primary group-hover:text-primary/80" />}
                   <span className="text-sm font-semibold text-card-foreground">{module.name}</span>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderGameView = () => {
      if (!activeModule || !currentQuestion) return null;
      return (
        <Card className="shadow-lg">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <Button variant="ghost" onClick={() => setView('levels')} className="h-auto p-0 mb-2 text-sm text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Modules
                        </Button>
                        <CardTitle className="text-2xl font-headline">{activeModule.name}</CardTitle>
                        <CardDescription>Question {currentQuestionIndex + 1} of {questionSet.length}</CardDescription>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-bold text-primary mt-1">Score: {score}</p>
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
                        <AlertTitle>Correct!</AlertTitle>
                        <AlertDescription>The right answer was <span className="font-semibold">{activeModule.answers[currentQuestion.id]}</span></AlertDescription>
                    </Alert>
                )}

                {isAnswerCorrect === false && (
                    <Alert variant="destructive">
                        <X className="h-4 w-4" />
                        <AlertTitle>Incorrect!</AlertTitle>
                        <AlertDescription>The correct answer is <span className="font-semibold">{activeModule.answers[currentQuestion.id]}</span>.</AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {answerOptions.map(answer => (
                        <Button
                            key={answer}
                            variant={selectedAnswer === answer ? 'default' : 'outline'}
                            onClick={() => setSelectedAnswer(answer)}
                            disabled={isAnswerCorrect !== null}
                            className="h-auto py-3 text-sm"
                        >
                            {answer}
                        </Button>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="justify-end">
                {isAnswerCorrect !== null ? (
                    <Button onClick={handleNextQuestion}>
                        {currentQuestionIndex === questionSet.length - 1 ? 'Finish' : 'Next Question'} <Sparkles className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <Button onClick={handleCheckAnswer} disabled={!selectedAnswer}>
                        <Check className="mr-2 h-4 w-4" /> Check Answer
                    </Button>
                )}
            </CardFooter>
        </Card>
      );
  };
  
  const renderResultsView = () => (
    <Card className="shadow-lg text-center">
        <CardHeader>
            <Trophy className="h-24 w-24 text-amber-400 mx-auto mb-4" />
            <CardTitle className="text-3xl font-bold text-primary">Module Complete!</CardTitle>
            <CardDescription>You've successfully answered all questions for {activeModule?.name}.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-lg">You earned</p>
            <p className="text-6xl font-bold my-2">{levelScore}</p>
            <p className="text-lg">points in this module.</p>
        </CardContent>
        <CardFooter className="justify-center">
            <Button onClick={handleFinish}>
                Back to All Modules <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
        </CardFooter>
    </Card>
  );

  return (
    <div className="p-4 md:p-8 space-y-6 pb-20">
      <header>
        <Button onClick={() => router.back()} variant="ghost" className="-ml-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </header>
      {view === 'levels' && renderLevelSelection()}
      {view === 'game' && renderGameView()}
      {view === 'results' && renderResultsView()}
    </div>
  );
}
