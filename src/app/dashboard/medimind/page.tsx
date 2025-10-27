
"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Check, Lightbulb, RefreshCw, Sparkles, Trophy, ChevronRight, Volume2, Loader2, BrainCircuit, X, CheckCircle, BookCopy, SkipForward } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { mediMindGameData, MedicineModule } from '@/lib/medimind-data';
import { cn } from '@/lib/utils';
import { MediMindIcon } from '@/components/icons/module-icons';
import Image from 'next/image';

type View = 'loading' | 'game' | 'results' | 'all_completed';

export default function MediMindPage() {
  const router = useRouter();
  const [view, setView] = useState<View>('loading');
  const [modules, setModules] = useState<MedicineModule[]>(mediMindGameData.medicine_data);
  const [activeModule, setActiveModule] = useState<MedicineModule | null>(null);
  const [correctlyAnsweredIds, setCorrectlyAnsweredIds] = useState<Set<string>>(new Set());
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [levelScore, setLevelScore] = useState(0);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const questionSet = mediMindGameData.question_set;

  const startModule = (module: MedicineModule) => {
    setActiveModule(module);
    setCorrectlyAnsweredIds(new Set());
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    setLevelScore(0);
    setView('game');
  };
  
  const startRandomModule = () => {
    const openModules = modules.filter(m => m.status === 'open');
    if (openModules.length > 0) {
      const randomIndex = Math.floor(Math.random() * openModules.length);
      startModule(openModules[randomIndex]);
    } else {
      setView('all_completed');
    }
  };

  useEffect(() => {
    startRandomModule();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSkipModule = () => {
    const openModules = modules.filter(m => m.status === 'open' && m.name !== activeModule?.name);
    if (openModules.length > 0) {
      const randomIndex = Math.floor(Math.random() * openModules.length);
      const nextModule = openModules[randomIndex];
      startModule(nextModule);
      toast({ title: "Module Skipped", description: `Now trying: ${nextModule.name}` });
    } else {
      toast({ title: "No more modules to skip to!", description: "You've attempted all available modules." });
    }
  };

  const currentQuestion = useMemo(() => {
    if (!activeModule) return null;
    return questionSet.find(q => !correctlyAnsweredIds.has(q.id)) || null;
  }, [activeModule, correctlyAnsweredIds, questionSet]);

  const answerOptions = currentQuestion ? mediMindGameData.answer_sets[currentQuestion.id] : [];

  const handleCheckAnswer = async () => {
    if (!selectedAnswer || !activeModule || !currentQuestion) return;

    const correctAnswer = activeModule.answers[currentQuestion.id];

    if (selectedAnswer === correctAnswer) {
      setIsAnswerCorrect(true);
      const points = 10;
      setScore(prev => prev + points);
      setLevelScore(prev => prev + points);
      setCorrectlyAnsweredIds(prev => new Set(prev).add(currentQuestion.id));
      toast({ title: "Correct!", description: `+${points} points!` });
    } else {
      setIsAnswerCorrect(false);
      toast({ variant: 'destructive', title: "Not quite!", description: "That's not the right answer." });
    }
  };
  
  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    setAudioSrc(null);

    const isModuleComplete = (correctlyAnsweredIds.size === questionSet.length);

    if (isModuleComplete) {
      const updatedModules = modules.map(m =>
        m.name === activeModule?.name ? { ...m, status: 'completed' } : m
      );
      setModules(updatedModules);
      setView('results');
    }
  };

  const handleFinish = () => {
    startRandomModule();
  };
  
  const progress = activeModule ? (correctlyAnsweredIds.size / questionSet.length) * 100 : 0;
  
  const playAudio = () => {
      audioRef.current?.play();
  };

  const renderGameView = () => {
      if (!activeModule || !currentQuestion) {
        if(view === 'all_completed') {
             return (
                <Card className="shadow-lg text-center">
                    <CardHeader>
                        <Trophy className="h-24 w-24 text-amber-400 mx-auto mb-4" />
                        <CardTitle className="text-3xl font-bold text-primary">Congratulations!</CardTitle>
                        <CardDescription>You have completed all available medicine modules.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg">Your final score is:</p>
                        <p className="text-6xl font-bold my-2">{score}</p>
                    </CardContent>
                    <CardFooter className="justify-center">
                        <Button onClick={() => router.push('/dashboard')}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                        </Button>
                    </CardFooter>
                </Card>
            )
        }
        return <Loader2 className="mx-auto h-12 w-12 animate-spin" />;
      };
      
      return (
        <Card className="shadow-lg">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                         <Button variant="ghost" onClick={() => router.back()} className="h-auto p-0 mb-2 text-sm text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                        </Button>
                        <div className="flex items-center gap-4">
                             <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                <Image src={`https://picsum.photos/seed/${activeModule.name}/200`} alt={activeModule.name} layout="fill" objectFit="cover" />
                             </div>
                            <div>
                                <CardTitle className="text-2xl font-headline">{activeModule.name}</CardTitle>
                                <CardDescription>Question {correctlyAnsweredIds.size + 1} of {questionSet.length}</CardDescription>
                            </div>
                        </div>
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
            <CardFooter className="flex-col sm:flex-row justify-between gap-2">
                <Button variant="outline" onClick={handleSkipModule} disabled={isAnswerCorrect !== null}>
                    <SkipForward className="mr-2 h-4 w-4" /> Skip Medicine
                </Button>
                {isAnswerCorrect !== null ? (
                    <Button onClick={handleNextQuestion}>
                        {correctlyAnsweredIds.size === questionSet.length ? 'Finish Module' : 'Next Question'} <Sparkles className="ml-2 h-4 w-4" />
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
                Next Module <ChevronRight className="ml-2 h-4 w-4" />
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
        {view === 'game' && renderGameView()}
        {view === 'results' && renderResultsView()}
        {view === 'loading' && <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />}
        {view === 'all_completed' && (
            <Card className="shadow-lg text-center">
                <CardHeader>
                    <Trophy className="h-24 w-24 text-amber-400 mx-auto mb-4" />
                    <CardTitle className="text-3xl font-bold text-primary">Congratulations!</CardTitle>
                    <CardDescription>You have completed all available medicine modules.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-lg">Your final score is:</p>
                    <p className="text-6xl font-bold my-2">{score}</p>
                </CardContent>
                <CardFooter className="justify-center">
                    <Button onClick={() => router.push('/dashboard')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Button>
                </CardFooter>
            </Card>
        )}
    </div>
  );
}
