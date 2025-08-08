
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Check, Lightbulb, RefreshCw, Sparkles, Trophy, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { gameLevels, GameLevel } from '@/lib/sentence-builder-data';
import { cn } from '@/lib/utils';
import Confetti from 'react-confetti';

interface Word {
  text: string;
  id: number;
}

export default function SentenceBuilderPage() {
  const router = useRouter();
  const [view, setView] = useState<'levels' | 'game'>('levels');
  const [levelIndex, setLevelIndex] = useState(0);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [builtSentence, setBuiltSentence] = useState<Word[]>([]);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [completedLevels, setCompletedLevels] = useState<Set<number>>(new Set());

  const currentLevel = gameLevels[levelIndex];
  const currentSentence = currentLevel.sentences[sentenceIndex];
  
  const jumbledWords = useMemo(() => {
    if (!currentSentence) return [];
    return currentSentence.words
      .map((word, index) => ({ text: word, id: index }))
      .sort(() => Math.random() - 0.5);
  }, [currentSentence]);
  
  const availableWords = useMemo(() => {
    const builtWordIds = new Set(builtSentence.map(w => w.id));
    return jumbledWords.filter(w => !builtWordIds.has(w.id));
  }, [jumbledWords, builtSentence]);

  const handleSelectLevel = (index: number) => {
    setLevelIndex(index);
    setSentenceIndex(0);
    setBuiltSentence([]);
    setIsCorrect(null);
    setShowHint(false);
    setView('game');
  };

  const handleBackToLevels = () => {
    setView('levels');
  };

  const handleWordClick = (word: Word) => {
    setBuiltSentence(prev => [...prev, word]);
  };

  const handleRemoveWord = (wordToRemove: Word) => {
    const indexToRemove = builtSentence.findIndex(w => w.id === wordToRemove.id);
    if (indexToRemove > -1) {
        setBuiltSentence(prev => {
            const newSentence = [...prev];
            newSentence.splice(indexToRemove, 1);
            return newSentence;
        });
    }
  };
  
  const handleCheckAnswer = () => {
    const userAnswer = builtSentence.map(w => w.text).join(' ');
    if (userAnswer === currentSentence.correct) {
      setIsCorrect(true);
      const points = showHint ? 1 : 2;
      setScore(prev => prev + points);
      toast({ title: "Correct!", description: `+${points} point(s)!` });

      const isLastSentenceInLevel = sentenceIndex === currentLevel.sentences.length - 1;
      const isLastLevel = levelIndex === gameLevels.length - 1;

      if (isLastSentenceInLevel) {
          setCompletedLevels(prev => new Set(prev).add(currentLevel.level));
          if(isLastLevel) {
            setShowConfetti(true);
          }
      }
    } else {
      setIsCorrect(false);
      toast({ variant: 'destructive', title: "Not quite!", description: "Try again or use a hint." });
    }
  };
  
  const handleNext = () => {
    setIsCorrect(null);
    setShowHint(false);
    setBuiltSentence([]);
    if (sentenceIndex < currentLevel.sentences.length - 1) {
      setSentenceIndex(prev => prev + 1);
    } else {
      toast({ title: `Level ${currentLevel.level} Complete!`, description: `Great job! Select another level to continue.` });
      handleBackToLevels();
    }
  };
  
  const handleReset = () => {
    setBuiltSentence([]);
    setShowHint(false);
    setIsCorrect(null);
  };
  
  const progress = ((sentenceIndex) / (currentLevel.sentences.length)) * 100;
  
  const isLevelComplete = sentenceIndex === currentLevel.sentences.length - 1 && isCorrect;

  const renderLevelSelection = () => (
    <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="text-2xl font-headline">Sentence Builder Challenge</CardTitle>
            <CardDescription>Select a level to begin arranging words into correct sentences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gameLevels.map((level, index) => {
                    const isCompleted = completedLevels.has(level.level);
                    return (
                        <button key={level.level} onClick={() => handleSelectLevel(index)} className="group block h-full text-left">
                           <Card className={cn("shadow-md hover:shadow-lg hover:border-primary/50 transition-all h-full", isCompleted && "bg-green-100 border-green-300")}>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base group-hover:text-primary">Level {level.level}</CardTitle>
                                        <CardDescription className="text-xs">{level.pattern}</CardDescription>
                                    </div>
                                    {isCompleted ? <Check className="h-5 w-5 text-green-500" /> : <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />}
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground italic">e.g., "{level.sentences[0].correct}"</p>
                                </CardContent>
                            </Card>
                        </button>
                    )
                })}
            </div>
        </CardContent>
    </Card>
  );

  const renderGameView = () => (
     <Card className="shadow-lg">
        <CardHeader>
            <div className="flex justify-between items-start">
                 <div>
                    <Button variant="ghost" onClick={handleBackToLevels} className="h-auto p-0 mb-2 text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Levels
                    </Button>
                    <CardTitle className="text-2xl font-headline">Level {currentLevel.level}: {currentLevel.pattern}</CardTitle>
                    <CardDescription>Arrange the words to form a correct sentence.</CardDescription>
                </div>
                <div className="text-right">
                    <Badge variant="secondary" className="text-lg">Question {sentenceIndex + 1} / {currentLevel.sentences.length}</Badge>
                    <p className="text-sm font-bold text-primary mt-1">Score: {score}</p>
                </div>
            </div>
             <Progress value={progress} className="mt-4" />
        </CardHeader>
        <CardContent className="space-y-6">
            {isLevelComplete && completedLevels.has(currentLevel.level) ? (
                 <div className="text-center py-10">
                    <Trophy className="h-24 w-24 text-amber-400 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-primary">Level {currentLevel.level} Complete!</h2>
                    <p className="text-muted-foreground mt-2">You have completed all sentences for this level!</p>
                    <p className="text-2xl font-bold mt-4">Current Score: {score}</p>
                </div>
            ) : (
                <>
                    <Card className="bg-muted min-h-[8rem] p-4 flex flex-wrap items-center gap-2">
                      {builtSentence.length > 0 ? (
                        builtSentence.map((word, index) => (
                           <Button key={`${word.id}-${index}`} variant="secondary" onClick={() => handleRemoveWord(word)} className="text-base h-auto py-2 px-4 shadow-sm animate-in zoom-in-50">
                            {word.text}
                          </Button>
                        ))
                      ) : (
                        <p className="text-muted-foreground italic w-full text-center">Click words from the word bank below to build your sentence here.</p>
                      )}
                    </Card>

                    {isCorrect !== null && (
                         <Alert variant={isCorrect ? "default" : "destructive"} className={cn(isCorrect && "bg-green-100 border-green-300 text-green-800")}>
                            <AlertTitle>{isCorrect ? "Correct!" : "Incorrect!"}</AlertTitle>
                            <AlertDescription>
                                {isCorrect ? "Great job! Click 'Next' to continue." : "That's not right. Try rearranging the words or use a hint."}
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-3">
                         <h3 className="font-semibold text-muted-foreground text-center">Word Bank</h3>
                        <Card className="p-4 flex flex-wrap justify-center gap-3">
                          {availableWords.map((word) => (
                            <Button key={word.id} onClick={() => handleWordClick(word)} className="text-base h-auto py-2 px-4">
                              {word.text}
                            </Button>
                          ))}
                        </Card>
                    </div>

                     {showHint && (
                        <Alert className="bg-blue-100 border-blue-300 text-blue-800">
                          <Lightbulb className="h-4 w-4 !text-blue-800" />
                          <AlertTitle>Hint</AlertTitle>
                          <AlertDescription>
                              <p>{currentSentence.hint}</p>
                              <p className="mt-2 font-semibold">Translation: {currentSentence.translation}</p>
                          </AlertDescription>
                        </Alert>
                      )}
                </>
            )}

        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-2">
            <div>
                 <Button variant="outline" onClick={() => setShowHint(true)} disabled={showHint || isCorrect === true || isLevelComplete}>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Hint
                </Button>
            </div>
            <div className="flex gap-2">
                 <Button variant="secondary" onClick={handleReset} disabled={isCorrect === true || isLevelComplete}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset
                </Button>
                {isCorrect ? (
                    <Button onClick={handleNext} className="bg-green-600 hover:bg-green-700">
                      {isLevelComplete ? 'Finish Level' : 'Next Sentence'} <Sparkles className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <Button onClick={handleCheckAnswer}>
                      <Check className="mr-2 h-4 w-4" />
                      Check Answer
                    </Button>
                )}
            </div>
        </CardFooter>
      </Card>
  );


  return (
     <div className="p-4 md:p-8 space-y-6 pb-20">
        {showConfetti && <Confetti recycle={false} onConfettiComplete={() => setShowConfetti(false)} />}
        <header>
            <Button onClick={() => router.back()} variant="ghost" className="-ml-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
        </header>
       {view === 'levels' ? renderLevelSelection() : renderGameView()}
    </div>
  );
}
