
"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Check, Lightbulb, RefreshCw, Sparkles, Trophy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { gameLevels } from '@/lib/sentence-builder-data';
import { cn } from '@/lib/utils';
import Confetti from 'react-confetti';

export default function SentenceBuilderPage() {
  const router = useRouter();
  const [levelIndex, setLevelIndex] = useState(0);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [builtSentence, setBuiltSentence] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const currentLevel = gameLevels[levelIndex];
  const currentSentence = currentLevel.sentences[sentenceIndex];
  
  const jumbledWords = useMemo(() => {
    // This ensures the shuffle is consistent for a given sentence but different for different sentences
    return [...currentSentence.words].sort(() => Math.random() - 0.5);
  }, [currentSentence]);

  const handleWordClick = (word: string, index: number) => {
    if (builtSentence.includes(word)) return;
    setBuiltSentence(prev => [...prev, word]);
  };

  const handleRemoveWord = (word: string) => {
    setBuiltSentence(prev => prev.filter(w => w !== word));
  };
  
  const handleCheckAnswer = () => {
    const userAnswer = builtSentence.join(' ');
    if (userAnswer === currentSentence.correct) {
      setIsCorrect(true);
      const points = showHint ? 1 : 2;
      setScore(prev => prev + points);
      toast({ title: "Correct!", description: `+${points} point(s)!` });
      if(levelIndex === gameLevels.length - 1 && sentenceIndex === currentLevel.sentences.length - 1) {
        setShowConfetti(true);
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
    } else if (levelIndex < gameLevels.length - 1) {
      setLevelIndex(prev => prev + 1);
      setSentenceIndex(0);
       toast({ title: `Level Up!`, description: `You've reached Level ${levelIndex + 2}.` });
    }
  };
  
  const handleReset = () => {
    setBuiltSentence([]);
    setShowHint(false);
    setIsCorrect(null);
  }
  
  const progress = ((levelIndex * currentLevel.sentences.length + sentenceIndex) / (gameLevels.length * currentLevel.sentences.length)) * 100;
  
  const allLevelsComplete = levelIndex === gameLevels.length - 1 && sentenceIndex === currentLevel.sentences.length - 1 && isCorrect;

  return (
     <div className="p-4 md:p-8 space-y-6 pb-20">
      {showConfetti && <Confetti recycle={false} onConfettiComplete={() => setShowConfetti(false)} />}
      <header>
        <Button onClick={() => router.back()} variant="ghost" className="-ml-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </header>
       <Card className="shadow-lg max-w-4xl mx-auto">
        <CardHeader>
            <div className="flex justify-between items-start">
                 <div>
                    <CardTitle className="text-2xl font-headline">Sentence Builder Challenge</CardTitle>
                    <CardDescription>Arrange the words to form a correct sentence.</CardDescription>
                </div>
                <div className="text-right">
                    <Badge variant="secondary" className="text-lg">Level {currentLevel.level}</Badge>
                    <p className="text-sm font-bold text-primary mt-1">Score: {score}</p>
                </div>
            </div>
             <Progress value={progress} className="mt-4" />
        </CardHeader>
        <CardContent className="space-y-6">
            {allLevelsComplete ? (
                 <div className="text-center py-10">
                    <Trophy className="h-24 w-24 text-amber-400 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-primary">Congratulations!</h2>
                    <p className="text-muted-foreground mt-2">You have completed all the levels!</p>
                    <p className="text-2xl font-bold mt-4">Final Score: {score}</p>
                </div>
            ) : (
                <>
                    <Card className="bg-muted min-h-[8rem] p-4 flex flex-wrap items-center gap-2">
                      {builtSentence.length > 0 ? (
                        builtSentence.map((word, i) => (
                           <Button key={i} variant="secondary" onClick={() => handleRemoveWord(word)} className="text-base h-auto py-2 px-4 shadow-sm animate-in zoom-in-50">
                            {word}
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
                          {jumbledWords.map((word, i) => {
                            const isUsed = builtSentence.includes(word);
                            return (
                               <Button key={i} onClick={() => handleWordClick(word, i)} disabled={isUsed} className="text-base h-auto py-2 px-4">
                                {word}
                              </Button>
                            )
                          })}
                        </Card>
                    </div>

                     {showHint && (
                        <Alert className="bg-blue-100 border-blue-300 text-blue-800">
                          <Lightbulb className="h-4 w-4 !text-blue-800" />
                          <AlertTitle>Hint</AlertTitle>
                          <AlertDescription>{currentSentence.hint}</AlertDescription>
                        </Alert>
                      )}
                </>
            )}

        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-2">
            <div>
                 <Button variant="outline" onClick={() => setShowHint(true)} disabled={showHint || isCorrect === true || allLevelsComplete}>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Hint
                </Button>
            </div>
            <div className="flex gap-2">
                 <Button variant="secondary" onClick={handleReset} disabled={isCorrect === true || allLevelsComplete}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset
                </Button>
                {isCorrect ? (
                    <Button onClick={handleNext} className="bg-green-600 hover:bg-green-700">
                      Next Sentence <Sparkles className="ml-2 h-4 w-4" />
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
    </div>
  );
}
