"use client";

import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill, ArrowLeft, ChevronRight, CheckCircle, Loader2, AlertTriangle, BookOpen, Coins, History as HistoryIcon } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { 
    getMediMindLevelById, 
    getMediMindLevelMedicinesByLevel, 
    getMediMindItems,
    getMediMindStudentAnswersByStudent,
    getMediMindLevelQuestionsByLevel
} from '@/lib/actions/games';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { MediMindLevel, MediMindLevelMedicine, MediMindItem, MediMindStudentAnswer, MediMindLevelQuestion } from '@/lib/types';

export default function MediMindModulesPage() {
  const router = useRouter();
  const params = useParams();
  const levelId = params.levelId as string;
  const { user } = useAuth();

  // --- Data Fetching ---
  const { data: level, isLoading: isLoadingLevel } = useQuery<MediMindLevel>({
    queryKey: ['mediMindLevel', levelId],
    queryFn: () => getMediMindLevelById(levelId),
    enabled: !!levelId,
  });

  const { data: levelMedicines = [], isLoading: isLoadingLevelMedicines } = useQuery<MediMindLevelMedicine[]>({
    queryKey: ['mediMindLevelMedicines', levelId],
    queryFn: () => getMediMindLevelMedicinesByLevel(levelId),
    enabled: !!levelId,
  });

  const { data: levelQuestions = [], isLoading: isLoadingLevelQuestions } = useQuery<MediMindLevelQuestion[]>({
    queryKey: ['mediMindLevelQuestions', levelId],
    queryFn: () => getMediMindLevelQuestionsByLevel(levelId),
    enabled: !!levelId,
  });

  const { data: allMedicines = [], isLoading: isLoadingAllMedicines } = useQuery<MediMindItem[]>({
    queryKey: ['mediMindItems'],
    queryFn: getMediMindItems,
  });

  const { data: studentAnswers = [], isLoading: isLoadingHistory, refetch: refetchHistory } = useQuery<MediMindStudentAnswer[]>({
    queryKey: ['studentMediMindHistory', user?.username],
    queryFn: () => getMediMindStudentAnswersByStudent(user!.username!),
    enabled: !!user?.username,
    staleTime: 0,
    refetchOnMount: true,
  });

  const totalCoins = useMemo(() => {
    const correct = studentAnswers.filter(a => a.correct_status === 'Correct').length;
    const wrong = studentAnswers.filter(a => a.correct_status === 'Wrong').length;
    return (correct * 10) - (wrong * 2);
  }, [studentAnswers]);

  // --- Derived State ---
  const levelModules = useMemo(() => {
    return allMedicines.filter(item => 
      levelMedicines.some(m => String(m.medicine_id) === String(item.id))
    );
  }, [allMedicines, levelMedicines]);

  const moduleProgress = useMemo(() => {
    const progress: Record<string, { correct: number, total: number }> = {};
    const totalQuestions = levelQuestions.length;

    levelModules.forEach(mod => {
        // Count distinct questions correctly answered for THIS medicine
        const correctAnswers = studentAnswers.filter(ans => 
            String(ans.medicine_id) === String(mod.id) && 
            ans.correct_status === "Correct" &&
            levelQuestions.some(lq => String(lq.question_id) === String(ans.question_id))
        );
        
        const uniqueCorrectQuestionIds = new Set(correctAnswers.map(a => String(a.question_id)));
        
        progress[mod.id] = {
            correct: uniqueCorrectQuestionIds.size,
            total: totalQuestions
        };
    });

    return progress;
  }, [levelModules, studentAnswers, levelQuestions]);

  const totalMastered = useMemo(() => {
    return Object.values(moduleProgress).filter(p => p.total > 0 && p.correct === p.total).length;
  }, [moduleProgress]);

  const isLoading = isLoadingLevel || isLoadingLevelMedicines || isLoadingLevelQuestions || isLoadingAllMedicines || (!!user?.id && isLoadingHistory);

  if (isLoading) {
    return (
        <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse font-medium">Preparing modules...</p>
        </div>
    );
  }

  if (!level) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center min-h-[60vh]">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-xl font-bold">Level Not Found</h1>
        <p className="text-muted-foreground">The level you are looking for might have been moved or deleted.</p>
        <Button onClick={() => router.push('/dashboard/medimind')} className="mt-6" variant="outline">
            Back to Levels
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 pb-20">
      <header className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-muted/30 p-6 rounded-3xl border shadow-inner">
            <div className="flex items-center gap-4">
                <button onClick={() => router.push('/dashboard/medimind')} className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center border shadow-sm hover:bg-muted transition-colors">
                    <ArrowLeft className="h-6 w-6" />
                </button>
                <div>
                    <h1 className="text-3xl font-headline font-bold text-primary leading-tight">{level.level_name}</h1>
                    <p className="text-muted-foreground font-medium">Earn coins by mastering these medicines.</p>
                </div>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
                <Button 
                    onClick={() => router.push('/dashboard/medimind/history')}
                    variant="outline"
                    className="rounded-2xl h-14 border-primary/20 hover:bg-primary/5 hidden sm:flex"
                >
                    <HistoryIcon className="mr-2 h-5 w-5 text-primary" />
                    <span className="font-bold">History</span>
                </Button>

                <div className="bg-background px-6 py-3 rounded-2xl border-2 border-yellow-500/20 shadow-sm flex items-center gap-4">
                    <div className="text-right">
                       <p className="text-[10px] font-bold text-primary/60 leading-none mb-1">Total Balance</p>
                       <p className="text-2xl font-black text-foreground leading-none flex items-center gap-2">
                            <Coins className="h-6 w-6 text-yellow-500" />
                            {totalCoins}
                       </p>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-primary/5 px-6 py-4 rounded-2xl border border-primary/10 flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-full">
                <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
               <p className="text-xs font-bold text-primary/60 uppercase tracking-wider leading-none">Your Progress</p>
               <p className="text-2xl font-black text-primary leading-tight">
                {totalMastered} <span className="text-sm font-medium text-muted-foreground">/ {levelModules.length} Mastered</span>
               </p>
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {levelModules.map((module) => {
          const prog = moduleProgress[module.id] || { correct: 0, total: 0 };
          const isCompleted = prog.total > 0 && prog.correct === prog.total;
          
          return (
            <button 
                key={module.id} 
                onClick={() => router.push(`/dashboard/medimind/${levelId}/${module.id}`)} 
                className="group block h-full text-left focus:outline-none"
            >
              <Card className={cn(
                "shadow-lg h-full transition-all border-2 relative overflow-hidden", 
                isCompleted 
                  ? "bg-muted/30 border-green-500/20" 
                  : "hover:shadow-2xl hover:border-primary/50"
              )}>
                {isCompleted && (
                    <div className="absolute top-0 right-0 p-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                )}
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        {module.medicine_image_url ? (
                            <div className="h-16 w-16 rounded-2xl overflow-hidden border-2 border-primary/10 shadow-sm bg-white shrink-0 group-hover:border-primary/30 transition-colors p-2">
                                <img 
                                    src={`https://content-provider.pharmacollege.lk${module.medicine_image_url}`} 
                                    alt={module.medicine_name}
                                    className="h-full w-full object-contain"
                                />
                            </div>
                        ) : (
                            <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                                <Pill className="h-8 w-8 text-primary" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <span className={cn(
                                "font-bold text-xl block truncate",
                                isCompleted ? "text-muted-foreground" : "text-card-foreground group-hover:text-primary transition-colors"
                            )}>
                                {module.medicine_name}
                            </span>
                            <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                    {isCompleted ? "Mastered" : "In Progress"}
                                </p>
                                <span className="text-[10px] font-bold bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                    {prog.correct} / {prog.total}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Progress Bar for each medicine */}
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-2">
                        <div 
                            className={cn(
                                "h-full transition-all duration-1000",
                                isCompleted ? "bg-green-500" : "bg-primary"
                            )} 
                            style={{ width: `${(prog.correct / (prog.total || 1)) * 100}%` }}
                        />
                    </div>

                    {!isCompleted && (
                        <div className="flex items-center text-primary text-sm font-bold pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {prog.correct > 0 ? "Continue Quiz" : "Start Quiz"} <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5" />
                        </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </button>
          )
        })}
        {levelModules.length === 0 && (
            <div className="col-span-full py-16 text-center bg-muted/20 border-2 border-dashed rounded-3xl">
                <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4 opacity-30" />
                <h3 className="text-xl font-bold">No Medicines Found</h3>
                <p className="text-muted-foreground">Admin hasn't assigned any medicines to this level yet.</p>
                <Button onClick={() => router.push('/dashboard/medimind')} variant="ghost" className="mt-4">
                    Choose Another Level
                </Button>
            </div>
        )}
      </div>
    </div>
  );
}
