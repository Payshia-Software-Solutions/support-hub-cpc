"use client";

import { useMemo, useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
    Pill, 
    ArrowLeft, 
    CheckCircle2, 
    XCircle, 
    ChevronRight, 
    History, 
    Trophy, 
    Coins, 
    Brain,
    Loader2,
    RotateCcw,
    Search,
    ShieldCheck,
    Timer
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    getMediMindLevelById, 
    getMediMindItemById, 
    getMediMindLevelQuestionsByLevel, 
    getMediMindMedicineAnswers,
    getMediMindAnswers,
    submitMediMindStudentAnswer,
    getMediMindStudentAnswersByStudent
} from '@/lib/actions/games';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import type { 
    MediMindLevel, 
    MediMindItem, 
    MediMindLevelQuestion, 
    MediMindMedicineAnswer, 
    MediMindAnswer,
    MediMindStudentAnswer
} from '@/lib/types';

export default function MediMindGamePage() {
    const router = useRouter();
    const params = useParams();
    const levelId = params.levelId as string;
    const moduleId = params.moduleId as string;
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // --- State ---
    const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [correctlyAnsweredIds, setCorrectlyAnsweredIds] = useState<Set<string>>(new Set());
    const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [historyInitialized, setHistoryInitialized] = useState(false);

    // --- Data Fetching ---
    const { data: level, isLoading: isLoadingLevel } = useQuery<MediMindLevel>({
        queryKey: ['mediMindLevel', levelId],
        queryFn: () => getMediMindLevelById(levelId),
        enabled: !!levelId,
    });

    const { data: medicine, isLoading: isLoadingMedicine } = useQuery<MediMindItem>({
        queryKey: ['mediMindItem', moduleId],
        queryFn: () => getMediMindItemById(moduleId),
        enabled: !!moduleId,
    });

    const { data: levelQuestions = [], isLoading: isLoadingQuestions } = useQuery<MediMindLevelQuestion[]>({
        queryKey: ['mediMindLevelQuestions', levelId],
        queryFn: () => getMediMindLevelQuestionsByLevel(levelId),
        enabled: !!levelId,
    });

    const { data: allMedicineCorrectAnswers = [], isLoading: isLoadingCorrectAnswers } = useQuery<MediMindMedicineAnswer[]>({
        queryKey: ['mediMindMedicineAnswers'],
        queryFn: getMediMindMedicineAnswers,
    });

    const medicineCorrectAnswers = useMemo(() => {
        return allMedicineCorrectAnswers.filter(m => String(m.medicine_id) === String(moduleId));
    }, [allMedicineCorrectAnswers, moduleId]);

    const { data: allAnswersPool = [], isLoading: isLoadingAnswersPool } = useQuery<MediMindAnswer[]>({
        queryKey: ['mediMindAnswers'],
        queryFn: getMediMindAnswers,
    });

    const { data: studentHistory = [], isLoading: isLoadingHistory } = useQuery<MediMindStudentAnswer[]>({
        queryKey: ['studentMediMindHistory', user?.username],
        queryFn: () => getMediMindStudentAnswersByStudent(user!.username!),
        enabled: !!user?.username,
    });

    // --- Mutations ---
    const totalCoins = useMemo(() => {
        const correct = studentHistory.filter(a => a.correct_status === 'Correct').length;
        const wrong = studentHistory.filter(a => a.correct_status === 'Wrong').length;
        return (correct * 10) - (wrong * 2);
    }, [studentHistory]);

    const submitMutation = useMutation({
        mutationFn: submitMediMindStudentAnswer,
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['studentMediMindHistory', user?.username] });
        }
    });

    // --- Logic: Resume from History ---
    useEffect(() => {
        if (!isLoadingHistory && !historyInitialized && studentHistory.length > 0 && levelQuestions.length > 0) {
            const correctlyIds = new Set<string>();
            studentHistory.forEach(ans => {
                if (String(ans.medicine_id) === String(moduleId) && ans.correct_status === "Correct") {
                    // Check if this answer was for one of the questions in this level
                    if (levelQuestions.some(lq => String(lq.question_id) === String(ans.question_id))) {
                        correctlyIds.add(String(ans.question_id));
                    }
                }
            });
            
            if (correctlyIds.size > 0) {
                setCorrectlyAnsweredIds(correctlyIds);
            }
            setHistoryInitialized(true);
        } else if (!isLoadingHistory && !historyInitialized) {
            setHistoryInitialized(true);
        }
    }, [studentHistory, levelQuestions, isLoadingHistory, historyInitialized, moduleId]);

    // --- Derived State ---
    const currentQuestion = useMemo(() => {
        return levelQuestions.find(q => !correctlyAnsweredIds.has(String(q.question_id)));
    }, [levelQuestions, correctlyAnsweredIds]);

    const options = useMemo(() => {
        if (!currentQuestion) return [];
        // The "Correct" answer for this medicine + question
        const mapping = medicineCorrectAnswers.find(m => String(m.question_id) === String(currentQuestion.question_id));
        if (!mapping) return [];

        const correctAns = allAnswersPool.find(a => String(a.id) === String(mapping.answer_id));
        if (!correctAns) return [];

        // Pick 3 random distractor answers from the pool (that are not the correct one)
        const distractors = allAnswersPool
            .filter(a => String(a.id) !== String(correctAns.id) && String(a.question_id) === String(currentQuestion.question_id))
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);

        return [correctAns, ...distractors].sort(() => 0.5 - Math.random());
    }, [currentQuestion, medicineCorrectAnswers, allAnswersPool]);

    const [autoNextTimer, setAutoNextTimer] = useState<number | null>(null);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (showResult && isCorrect) {
            setAutoNextTimer(5);
            interval = setInterval(() => {
                setAutoNextTimer((prev) => {
                    if (prev !== null && prev > 1) return prev - 1;
                    handleNext();
                    return null;
                });
            }, 1000);
        } else {
            setAutoNextTimer(null);
        }
        return () => clearInterval(interval);
    }, [showResult, isCorrect]);

    // --- Handlers ---
    const handleCheckAnswer = () => {
        if (!selectedAnswerId || !currentQuestion) return;

        const mapping = medicineCorrectAnswers.find(m => String(m.question_id) === String(currentQuestion.question_id));
        const correct = String(selectedAnswerId) === String(mapping?.answer_id);
        
        setIsCorrect(correct);
        setShowResult(true);

        if (correct) {
            setConsecutiveCorrect(prev => prev + 1);
        } else {
            setConsecutiveCorrect(0);
        }

        // Submit to server
        if (user?.username) {
            submitMutation.mutate({
                medicine_id: parseInt(moduleId, 10),
                question_id: parseInt(currentQuestion.question_id as string, 10),
                answer_id: parseInt(selectedAnswerId, 10),
                correct_status: correct ? "Correct" : "Wrong",
                created_by: user.username
            });
        }
    };

    const handleNext = () => {
        if (isCorrect && currentQuestion) {
            const nextCorrectIds = new Set(correctlyAnsweredIds);
            nextCorrectIds.add(String(currentQuestion.question_id));
            setCorrectlyAnsweredIds(nextCorrectIds);
            
            // If that was the last question
            if (nextCorrectIds.size === levelQuestions.length) {
                setIsComplete(true);
            }
        }
        
        setSelectedAnswerId(null);
        setShowResult(false);
        setIsCorrect(null);
    };

    // --- Loading State ---
    const isLoading = isLoadingLevel || isLoadingMedicine || isLoadingQuestions || isLoadingCorrectAnswers || isLoadingAnswersPool || isLoadingHistory || !historyInitialized;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <div className="space-y-2 text-center">
                    <h2 className="text-2xl font-black text-primary animate-pulse uppercase tracking-tighter italic">Initializing Game Engine</h2>
                    <p className="text-muted-foreground font-medium">Fetching medical data and your history...</p>
                </div>
            </div>
        );
    }

    if (!medicine || !level) return <div>Data not found</div>;

    // --- Game Over Screen ---
    if (isComplete) {
        return (
            <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[80vh] space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="relative">
                    <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-20 animate-pulse rounded-full" />
                    <Trophy className="h-40 w-40 text-yellow-500 relative z-10" />
                </div>
                
                <div className="text-center space-y-2">
                    <h1 className="text-5xl font-black text-primary uppercase tracking-tighter italic scale-110">Level Mastered!</h1>
                    <p className="text-xl text-muted-foreground font-medium">You've mastered everything about <span className="text-foreground font-bold">{medicine.medicine_name}</span> in {level.level_name}.</p>
                </div>

                <Card className="w-full max-w-sm bg-gradient-to-br from-primary/10 to-transparent border-primary/20 shadow-2xl overflow-hidden">
                    <CardContent className="p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="bg-primary/10 p-3 rounded-2xl">
                                <History className="h-8 w-8 text-primary" />
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-primary/60 uppercase tracking-widest">Questions</p>
                                <p className="text-4xl font-black text-primary">{levelQuestions.length}/{levelQuestions.length}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="bg-yellow-500/10 p-3 rounded-2xl">
                                <Coins className="h-8 w-8 text-yellow-500" />
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-yellow-500/60 uppercase tracking-widest">Total Balance</p>
                                <p className="text-4xl font-black text-yellow-600">{totalCoins}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex gap-4 w-full max-w-sm">
                    <Button onClick={() => router.push(`/dashboard/medimind/${levelId}`)} className="flex-1 h-14 text-lg font-black uppercase italic tracking-tighter group">
                        Back to Modules <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </div>
        );
    }

    // --- Normal Gameplay ---
    const progress = (correctlyAnsweredIds.size / levelQuestions.length) * 100;

    return (
        <div className="p-4 md:p-8 space-y-6 pb-24">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-muted/30 p-6 rounded-3xl border shadow-inner">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push(`/dashboard/medimind/${levelId}`)} className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center border shadow-sm hover:bg-muted transition-colors">
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                             <Badge variant="secondary" className="px-2 py-0 h-5 text-[10px] font-bold bg-primary/10 text-primary border-primary/20">
                                {level.level_name}
                             </Badge>
                        </div>
                        <h1 className="text-3xl font-bold text-primary leading-none mt-1">
                            {medicine.medicine_name}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-6 pr-4">
                    <div className="text-center group">
                        <p className="text-[10px] font-bold text-muted-foreground mb-1 group-hover:text-primary transition-colors">Total Balance</p>
                        <div className="flex items-center gap-2 bg-background px-4 py-2 rounded-2xl border-2 border-yellow-500/20 shadow-sm relative overflow-hidden">
                             <div className="absolute inset-0 bg-yellow-500/5 group-hover:scale-150 transition-transform duration-1000" />
                             <Coins className="h-5 w-5 text-yellow-500 relative z-10" />
                             <span className="text-2xl font-black text-foreground relative z-10">{totalCoins}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Full Width Medicine Image */}
            {medicine.medicine_image_url && (
                <div 
                    className="w-full aspect-square md:aspect-[21/9] rounded-[2.5rem] overflow-hidden border-4 border-primary/10 shadow-2xl bg-white group/hero cursor-zoom-in relative"
                    onClick={() => window.open(`https://content-provider.pharmacollege.lk${medicine.medicine_image_url}`, '_blank')}
                >
                    <img 
                        src={`https://content-provider.pharmacollege.lk${medicine.medicine_image_url}`} 
                        alt={medicine.medicine_name}
                        className="h-full w-full object-contain p-4 group-hover/hero:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-6 right-6 bg-black/50 backdrop-blur-md p-3 rounded-2xl text-white opacity-0 group-hover/hero:opacity-100 transition-opacity">
                        <Search className="h-6 w-6" />
                    </div>
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/hero:opacity-100 transition-opacity" />
                </div>
            )}

            {/* Game Progress */}
            <div className="space-y-2 px-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <span>Performance</span>
                    <span>{correctlyAnsweredIds.size} / {levelQuestions.length} Done</span>
                </div>
                <div className="h-3 w-full bg-muted rounded-full p-0.5 border border-primary/5">
                    <div className="h-full bg-primary rounded-full transition-all duration-1000 relative" style={{ width: `${progress}%` }}>
                       <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </div>
                </div>
            </div>

            {currentQuestion ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Compact Question UI */}
                    <div className="lg:col-span-5 space-y-4">
                        <Card className="border-none shadow-xl relative overflow-hidden rounded-[2rem] min-h-[180px] flex items-center justify-center bg-primary">
                            <CardContent className="p-8 text-center relative z-10">
                                <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/20">
                                    <Brain className="h-6 w-6 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-white leading-tight tracking-tight">
                                    {currentQuestion.question}
                                </h2>
                            </CardContent>
                        </Card>
                        
                        {!showResult ? (
                            <Button
                                onClick={handleCheckAnswer}
                                disabled={!selectedAnswerId || submitMutation.isPending}
                                className="w-full h-14 text-lg font-bold shadow-lg rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white border-none gap-2 group"
                            >
                                {submitMutation.isPending ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <>
                                        <ShieldCheck className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                        Verify Data
                                    </>
                                )}
                            </Button>
                        ) : (
                            <Button
                                onClick={handleNext}
                                variant={isCorrect ? "default" : "outline"}
                                className={cn(
                                    "w-full h-14 text-lg font-bold shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-500 rounded-2xl gap-2 relative overflow-hidden",
                                    isCorrect ? "bg-green-600 hover:bg-green-700" : "border-red-500 text-red-600 hover:bg-red-50"
                                )}
                            >
                                {isCorrect && autoNextTimer !== null && (
                                    <div 
                                        className="absolute bottom-0 left-0 h-1 bg-white/40 transition-all duration-1000 ease-linear"
                                        style={{ width: `${(autoNextTimer / 5) * 100}%` }}
                                    />
                                )}
                                {isCorrect ? (
                                    <>
                                        <Timer className="h-5 w-5 animate-pulse" />
                                        Next Step {autoNextTimer !== null && `(${autoNextTimer}s)`}
                                        <ChevronRight className="h-5 w-5" />
                                    </>
                                ) : (
                                    <>
                                        Try Again <ChevronRight className="h-5 w-5" />
                                    </>
                                )}
                            </Button>
                        )}
                    </div>

                    {/* Compact Options UI */}
                    <div className="lg:col-span-7">
                        <div className="grid grid-cols-1 gap-2">
                            {options.map((option) => (
                                <button
                                    key={option.id}
                                    disabled={showResult}
                                    onClick={() => setSelectedAnswerId(option.id)}
                                    className={cn(
                                        "w-full p-5 text-left rounded-2xl border-2 transition-all duration-200 font-bold text-base relative group overflow-hidden",
                                        selectedAnswerId === option.id 
                                            ? "border-primary bg-primary/5 ring-2 ring-primary/10 translate-x-1" 
                                            : "border-muted-foreground/10 hover:border-primary/50 hover:bg-muted/50 shadow-sm",
                                        showResult && String(selectedAnswerId) === String(option.id) && isCorrect && "border-green-500 bg-green-50 ring-green-100",
                                        showResult && String(selectedAnswerId) === String(option.id) && !isCorrect && "border-red-500 bg-red-50 ring-red-100 opacity-100",
                                        showResult && String(selectedAnswerId) !== String(option.id) && "opacity-50 grayscale"
                                    )}
                                >
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                                            selectedAnswerId === option.id ? "bg-primary border-primary text-white" : "bg-muted border-muted-foreground/10"
                                        )}>
                                            {String(option.answer).charAt(0).toUpperCase()}
                                        </div>
                                        <span className={cn(
                                            "transition-colors",
                                            selectedAnswerId === option.id ? "text-primary italic" : "text-muted-foreground"
                                        )}>
                                            {option.answer}
                                        </span>
                                    </div>
                                    
                                    {showResult && String(selectedAnswerId) === String(option.id) && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
                                            {isCorrect ? (
                                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                                            ) : (
                                                <XCircle className="h-6 w-6 text-red-500" />
                                            )}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="py-20 text-center space-y-4 bg-muted/20 rounded-[3rem] border-2 border-dashed">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">Loading next challenge...</p>
                </div>
            )}
        </div>
    );
}
