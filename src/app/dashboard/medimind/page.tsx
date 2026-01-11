
"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Check, Lightbulb, RefreshCw, Sparkles, Trophy, ChevronRight, Volume2, Loader2, BrainCircuit, X, CheckCircle, Layers, Pill } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { mediMindGameData, MedicineModule, GameLevel, GameQuestion, AnswerSet } from '@/lib/medimind-data';
import { cn } from '@/lib/utils';
import Image from 'next/image';

type View = 'levels' | 'modules' | 'game' | 'results' | 'all_completed';

export default function MediMindPage() {
  const router = useRouter();
  const [view, setView] = useState<View>('levels');
  const [modules, setModules] = useState<MedicineModule[]>(mediMindGameData.medicine_data);
  const [levels, setLevels] = useState<GameLevel[]>(mediMindGameData.levels);
  const [activeLevel, setActiveLevel] = useState<GameLevel | null>(null);
  const [activeModule, setActiveModule] = useState<MedicineModule | null>(null);
  const [correctlyAnsweredIds, setCorrectlyAnsweredIds] = useState<Set<string>>(new Set());
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [coins, setCoins] = useState(0);
  const [levelScore, setLevelScore] = useState(0);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [firstAttempt, setFirstAttempt] = useState(true);

  const startLevel = (level: GameLevel) => {
    setActiveLevel(level);
    setView('modules');
  };

  const startModule = (module: MedicineModule) => {
    setActiveModule(module);
    setCorrectlyAnsweredIds(new Set());
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    setLevelScore(0);
    setFirstAttempt(true);
    setView('game');
  };

  const handleCheckAnswer = async () => {
    if (!selectedAnswer || !activeModule || !currentQuestion) return;
    const correctAnswer = activeModule.answers[currentQuestion.id];
    const isCorrect = selectedAnswer === correctAnswer;
    setIsAnswerCorrect(isCorrect);
    if (isCorrect) {
      const points = 10;
      setCoins(prev => prev + points);
      setLevelScore(prev => prev + points);
      setCorrectlyAnsweredIds(prev => new Set(prev).add(currentQuestion.id));
      toast({ title: "Correct!", description: `+${points} coins!` });
    } else {
        if (firstAttempt) {
            setCoins(prev => prev - 2);
            toast({ variant: 'destructive', title: "Not quite!", description: "You lost 2 coins." });
        } else {
            toast({ variant: 'destructive', title: "Still not right!" });
        }
        setFirstAttempt(false);
    }
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    setAudioSrc(null);
    setFirstAttempt(true);
    const isModuleComplete = (correctlyAnsweredIds.size === activeLevel?.questions.length);
    if (isModuleComplete) {
      setView('results');
    }
  };
  
  const handleFinishModule = () => {
    const updatedModules = modules.map(m =>
        m.name === activeModule?.name ? { ...m, status: 'completed' } : m
      );
    setModules(updatedModules);
    setActiveModule(null);
    setView('modules');
  }

  const currentQuestion = useMemo(() => {
    if (!activeModule || !activeLevel) return null;
    return activeLevel.questions.find(q => !correctlyAnsweredIds.has(q.id)) || null;
  }, [activeModule, activeLevel, correctlyAnsweredIds]);

  const answerOptions = currentQuestion ? mediMindGameData.answer_sets[currentQuestion.id] : [];
  
  const progress = activeModule && activeLevel ? (correctlyAnsweredIds.size / activeLevel.questions.length) * 100 : 0;
  
  const playAudio = () => {
      audioRef.current?.play();
  };

  const renderLevelSelection = () => (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Select a Level</CardTitle>
        <CardDescription>Choose a level to start the MediMind challenge.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {levels.map((level) => (
          <button key={level.id} onClick={() => startLevel(level)} className="group block h-full text-left">
            <Card className="shadow-md hover:shadow-lg hover:border-primary transition-all h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Layers className="h-6 w-6 text-primary" />
                  <CardTitle className="text-base group-hover:text-primary">{level.title}</CardTitle>
                </div>
              </CardHeader>
            </Card>
          </button>
        ))}
      </CardContent>
    </Card>
  );
  
  const renderModuleSelection = () => {
    if (!activeLevel) return null;
    const levelModules = activeLevel.items.map(itemName => modules.find(m => m.name === itemName)).filter(Boolean) as MedicineModule[];

    return (
      <Card className="shadow-lg">
        <CardHeader>
           <Button variant="ghost" onClick={() => setView('levels')} className="-ml-4 h-auto p-1 mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Levels
          </Button>
          <CardTitle className="text-2xl font-headline">{activeLevel.title}</CardTitle>
          <CardDescription>Select a medicine to begin the quiz.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {levelModules.map((module) => (
            <button key={module.name} onClick={() => startModule(module)} className="group block h-full text-left" disabled={module.status === 'completed'}>
              <Card className={cn("shadow-md h-full", module.status === 'completed' ? "bg-muted/50 opacity-70" : "hover:shadow-lg hover:border-primary/50 transition-all")}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Pill className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-card-foreground">{module.name}</span>
                  </div>
                  {module.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500"/> : <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />}
                </CardContent>
              </Card>
            </button>
          ))}
        </CardContent>
      </Card>
    );
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
                        <p className="text-lg">Your final coin balance is:</p>
                        <p className="text-6xl font-bold my-2">{coins}</p>
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
                            <Button variant="ghost" onClick={() => setView('modules')} className="-ml-4 h-auto p-1 mb-2">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Modules
                            </Button>
                            <CardTitle className="text-2xl font-headline">{activeModule.name}</CardTitle>
                            <CardDescription>Question {correctlyAnsweredIds.size + 1} of {activeLevel?.questions.length || '?'}</CardDescription>
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
                <CardFooter className="flex-col sm:flex-row justify-end gap-2">
                    {isAnswerCorrect !== null ? (
                        <Button onClick={handleNextQuestion}>
                            {correctlyAnsweredIds.size === activeLevel?.questions.length ? 'Finish Module' : 'Next Question'} <Sparkles className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button onClick={handleCheckAnswer} disabled={!selectedAnswer}>
                            <Check className="mr-2 h-4 w-4" /> Check Answer
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
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
            <p className="text-lg">coins in this module.</p>
        </CardContent>
        <CardFooter className="justify-center">
            <Button onClick={handleFinishModule}>
                Back to Modules <ChevronRight className="ml-2 h-4 w-4" />
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
        {view === 'modules' && renderModuleSelection()}
        {view === 'game' && renderGameView()}
        {view === 'results' && renderResultsView()}
        {view === 'all_completed' && (
            <Card className="shadow-lg text-center">
                <CardHeader>
                    <Trophy className="h-24 w-24 text-amber-400 mx-auto mb-4" />
                    <CardTitle className="text-3xl font-bold text-primary">Congratulations!</CardTitle>
                    <CardDescription>You have completed all available medicine modules in all levels.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-lg">Your final coin balance is:</p>
                    <p className="text-6xl font-bold my-2">{coins}</p>
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
