
"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Check, Lightbulb, RefreshCw, Sparkles, Trophy, ChevronRight, Volume2, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getLevels as getGameLevels, getSentencesByLevel, saveStudentAnswer, getStudentSubmissions } from '@/lib/actions/sentence-builder';
import { type GameLevel, type Sentence, type StudentAnswerPayload, type StudentAnswer } from '@/lib/types';
import { cn } from '@/lib/utils';
import { generateAudio } from '@/ai/flows/text-to-speech-flow';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

interface Word {
  text: string;
  id: number;
}

export default function SentenceBuilderPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [view, setView] = useState<'levels' | 'game'>('levels');
  const [levelIndex, setLevelIndex] = useState(0);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [builtSentence, setBuiltSentence] = useState<Word[]>([]);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const { data: gameLevels, isLoading: isLoadingLevels } = useQuery<GameLevel[]>({
    queryKey: ['sentenceBuilderLevels'],
    queryFn: getGameLevels
  });

  const { data: studentSubmissions, isLoading: isLoadingSubmissions } = useQuery<StudentAnswer[]>({
    queryKey: ['studentSubmissions', user?.username],
    queryFn: () => getStudentSubmissions(user!.username!),
    enabled: !!user,
  });

  const currentLevel = gameLevels?.[levelIndex];
  
  const { data: currentSentences, isLoading: isLoadingSentences } = useQuery<Sentence[]>({
      queryKey: ['sentencesForLevel', currentLevel?.id],
      queryFn: () => getSentencesByLevel(currentLevel!.id),
      enabled: !!currentLevel,
  });
  
  const { correctlyAnsweredIds, completedLevels } = useMemo(() => {
    if (!studentSubmissions) return { correctlyAnsweredIds: new Set(), completedLevels: new Set() };

    const correctIds = new Set<string>();
    const submissionsBySentence: Record<string, StudentAnswer> = {};

    for (const sub of studentSubmissions) {
      if (sub.is_correct === '1') {
        if (!submissionsBySentence[sub.sentence_id] || new Date(sub.submitted_at) > new Date(submissionsBySentence[sub.sentence_id].submitted_at)) {
            submissionsBySentence[sub.sentence_id] = sub;
        }
      }
    }
    
    Object.keys(submissionsBySentence).forEach(id => correctIds.add(id));

    const levelsMap = new Map(gameLevels?.map(l => [l.id, l.sentences?.map(s => String(s.id)) || []]));
    const completed = new Set<number>();
    levelsMap.forEach((sentenceIds, levelId) => {
        if (sentenceIds.every(sid => correctIds.has(sid))) {
            const levelNum = gameLevels?.find(l => l.id === levelId)?.level_number;
            if(levelNum) completed.add(levelNum);
        }
    });

    return { correctlyAnsweredIds: correctIds, completedLevels: completed };
  }, [studentSubmissions, gameLevels]);

  useEffect(() => {
    if (studentSubmissions) {
      const totalScore = studentSubmissions.reduce((acc, sub) => acc + parseInt(sub.score_awarded, 10), 0);
      setScore(totalScore);
    }
  }, [studentSubmissions]);

  const currentSentence = currentSentences?.[sentenceIndex];
  
  const jumbledWords = useMemo(() => {
    if (!currentSentence) return [];
    return currentSentence.correct_sentence.split(' ')
      .map((word, index) => ({ text: word, id: index }))
      .sort(() => Math.random() - 0.5);
  }, [currentSentence]);
  
  const availableWords = useMemo(() => {
    const builtWordIds = new Set(builtSentence.map(w => w.id));
    return jumbledWords.filter(w => !builtWordIds.has(w.id));
  }, [jumbledWords, builtSentence]);
  
  const saveAnswerMutation = useMutation({
    mutationFn: saveStudentAnswer,
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Submission Error',
        description: `Could not save your answer: ${error.message}`,
      });
    },
  });

  const handleSelectLevel = (index: number) => {
    const selectedLevel = gameLevels?.[index];
    if (!selectedLevel) return;

    const sentencesInLevel = selectedLevel.sentences || [];
    const firstUnansweredIndex = sentencesInLevel.findIndex(s => !correctlyAnsweredIds.has(String(s.id)));
    
    setLevelIndex(index);
    setSentenceIndex(firstUnansweredIndex >= 0 ? firstUnansweredIndex : 0);
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
    setBuiltSentence(prev => prev.filter(w => w.id !== wordToRemove.id));
  };
  
  const handleCheckAnswer = async () => {
    if (!currentSentence || !user?.username) return;
    const userAnswer = builtSentence.map(w => w.text).join(' ');
    const isAnswerCorrect = userAnswer === currentSentence.correct_sentence;
    const scoreAwarded = isAnswerCorrect ? 10 : -1;
    
    setIsCorrect(isAnswerCorrect);
    setScore(prev => prev + scoreAwarded);

    const submissionPayload: StudentAnswerPayload = {
        student_number: user.username,
        sentence_id: currentSentence.id,
        submitted_answer: userAnswer,
        is_correct: isAnswerCorrect,
        score_awarded: scoreAwarded
    };
    saveAnswerMutation.mutate(submissionPayload);

    if (isAnswerCorrect) {
      toast({ title: "Correct!", description: `+10 points!` });
      correctlyAnsweredIds.add(String(currentSentence.id));
    } else {
      toast({ variant: 'destructive', title: "Not quite!", description: "Try again. You lost 1 point." });
    }
  };
  
  const handleNext = () => {
    setIsCorrect(null);
    setShowHint(false);
    setBuiltSentence([]);
    setAudioSrc(null);
    
    const nextUnansweredIndex = currentSentences?.findIndex((s, i) => i > sentenceIndex && !correctlyAnsweredIds.has(String(s.id)));

    if (nextUnansweredIndex !== undefined && nextUnansweredIndex > -1) {
      setSentenceIndex(nextUnansweredIndex);
    } else if (currentLevel) {
      toast({ title: `Level ${currentLevel.level_number} Complete!`, description: `Great job! Select another level to continue.` });
      handleBackToLevels();
    }
  };
  
  const handleReset = () => {
    setBuiltSentence([]);
    setShowHint(false);
    setIsCorrect(null);
    setAudioSrc(null);
  };
  
  const progress = currentSentences ? ((sentenceIndex) / (currentSentences.length)) * 100 : 0;
  
  const isLevelComplete = currentSentences && sentenceIndex === currentSentences.length - 1 && isCorrect;

  const playAudio = async () => {
    if (audioSrc) {
        audioRef.current?.play();
        return;
    }
    if (!currentSentence) return;
    setIsAudioLoading(true);
    try {
        const audioData = await generateAudio(currentSentence.correct_sentence);
        setAudioSrc(audioData.media);
    } catch (error) {
        console.error("Failed to generate audio:", error);
        toast({ variant: 'destructive', title: 'Audio Error', description: 'Could not generate audio for the sentence.' });
    } finally {
        setIsAudioLoading(false);
    }
  };

  useEffect(() => {
    if (audioSrc && audioRef.current) {
        audioRef.current.play();
    }
  }, [audioSrc]);

  if (isLoadingLevels || isLoadingSubmissions) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  const renderLevelSelection = () => (
    <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="text-2xl font-headline">Sentence Builder Challenge</CardTitle>
            <CardDescription>Select a level to begin arranging words into correct sentences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gameLevels?.map((level, index) => {
                    const isCompleted = completedLevels.has(level.level_number);
                    return (
                        <button key={level.level_number} onClick={() => handleSelectLevel(index)} className="group block h-full text-left">
                           <Card className={cn("shadow-md hover:shadow-lg hover:border-primary/50 transition-all h-full", isCompleted && "bg-green-100 border-green-300")}>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base group-hover:text-primary">Level {level.level_number}</CardTitle>
                                        <CardDescription className="text-xs">{level.pattern}</CardDescription>
                                    </div>
                                    {isCompleted ? <Check className="h-5 w-5 text-green-500" /> : <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />}
                                </CardHeader>
                           </Card>
                        </button>
                    )
                })}
            </div>
        </CardContent>
    </Card>
  );

  const renderGameView = () => {
      if (isLoadingSentences || !currentLevel || !currentSentence) {
           return (
             <Card className="shadow-lg">
                <CardHeader>
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-8 w-48 mt-2" />
                    <Skeleton className="h-4 w-64 mt-1" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-24 w-full" />
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-32" />
                </CardFooter>
            </Card>
           )
      }
      
      return (
        <Card className="shadow-lg">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <Button variant="ghost" onClick={handleBackToLevels} className="h-auto p-0 mb-2 text-sm text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Levels
                        </Button>
                        <CardTitle className="text-2xl font-headline">Level {currentLevel.level_number}: {currentLevel.pattern}</CardTitle>
                        <CardDescription>Arrange the words to form a correct sentence.</CardDescription>
                    </div>
                    <div className="text-right">
                        <Badge variant="secondary" className="text-lg">Question {sentenceIndex + 1} / {currentSentences?.length || 0}</Badge>
                        <p className="text-sm font-bold text-primary mt-1">Score: {score}</p>
                    </div>
                </div>
                <Progress value={progress} className="mt-4" />
            </CardHeader>
            <CardContent className="space-y-6">
                {isLevelComplete && completedLevels.has(currentLevel.level_number) ? (
                    <div className="text-center py-10">
                        <Trophy className="h-24 w-24 text-amber-400 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold text-primary">Level {currentLevel.level_number} Complete!</h2>
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

                        {isCorrect && (
                            <Alert variant="default" className="bg-green-100 border-green-300 text-green-800">
                                <Check className="h-4 w-4 !text-green-800" />
                                <AlertTitle className="flex justify-between items-center">
                                    <span>Correct!</span>
                                    <Button size="sm" variant="ghost" className="h-auto p-1.5" onClick={playAudio} disabled={isAudioLoading}>
                                        {isAudioLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Volume2 className="h-5 w-5"/>}
                                    </Button>
                                </AlertTitle>
                                <AlertDescription>
                                    <p className="font-semibold text-lg">{currentSentence.correct_sentence}</p>
                                    <p className="text-sm italic">{currentSentence.translation}</p>
                                    {audioSrc && <audio ref={audioRef} src={audioSrc} />}
                                </AlertDescription>
                            </Alert>
                        )}

                        {isCorrect === false && (
                            <Alert variant="destructive">
                                <AlertTitle>Incorrect!</AlertTitle>
                                <AlertDescription>That's not right. Try rearranging the words or use a hint.</AlertDescription>
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
                            <Lightbulb className="mr-2 h-4 w-4 !text-blue-800" />
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
                        <Button onClick={handleCheckAnswer} disabled={saveAnswerMutation.isPending}>
                        {saveAnswerMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4" />}
                        Check Answer
                        </Button>
                    )}
                </div>
            </CardFooter>
        </Card>
    )};

  return (
     <div className="p-4 md:p-8 space-y-6 pb-20">
        <header>
            <Button onClick={() => router.back()} variant="ghost" className="-ml-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
        </header>
       {view === 'levels' ? renderLevelSelection() : renderGameView()}
    </div>
  );
}
