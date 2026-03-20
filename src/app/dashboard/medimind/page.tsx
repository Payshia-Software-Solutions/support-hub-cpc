"use client";

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, Loader2, AlertTriangle } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { getMediMindLevels, getMediMindLevelMedicines, getMediMindStudentAnswersByStudent } from '@/lib/actions/games';
import type { MediMindLevel, MediMindLevelMedicine, MediMindStudentAnswer } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Coins, History as HistoryIcon } from 'lucide-react';

export default function MediMindLevelsPage() {
    const router = useRouter();
    const { user } = useAuth();

    const { data: levels = [], isLoading: isLoadingLevels } = useQuery<MediMindLevel[]>({
        queryKey: ['mediMindLevels'],
        queryFn: getMediMindLevels,
    });

    const { data: levelMedicines = [], isLoading: isLoadingLevelMedicines } = useQuery<MediMindLevelMedicine[]>({
        queryKey: ['mediMindLevelMedicines'],
        queryFn: getMediMindLevelMedicines,
    });

    const { data: studentAnswers = [], isLoading: isLoadingHistory } = useQuery<MediMindStudentAnswer[]>({
        queryKey: ['studentMediMindHistory', user?.username],
        queryFn: () => getMediMindStudentAnswersByStudent(user!.username!),
        enabled: !!user?.username,
    });

    const totalCoins = useMemo(() => {
        const correct = studentAnswers.filter(a => a.correct_status === 'Correct').length;
        const wrong = studentAnswers.filter(a => a.correct_status === 'Wrong').length;
        return (correct * 10) - (wrong * 2);
    }, [studentAnswers]);

    const isLoading = isLoadingLevels || isLoadingLevelMedicines || (!!user?.username && isLoadingHistory);

    if (isLoading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse font-medium">Loading levels...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex-1">
                    <Button onClick={() => router.push('/dashboard')} variant="ghost" className="-ml-4 hover:bg-primary/10 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Games
                    </Button>
                    <h1 className="text-4xl font-headline font-bold mt-2 text-primary">MediMind Challenge</h1>
                    <p className="text-muted-foreground text-lg">Pick a challenge level to test your medical knowledge.</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <Button 
                        onClick={() => router.push('/dashboard/medimind/history')}
                        variant="outline"
                        className="rounded-2xl h-14 px-6 border-primary/20 hover:bg-primary/5 group"
                    >
                        <HistoryIcon className="mr-2 h-5 w-5 text-primary group-hover:rotate-[-45deg] transition-transform" />
                        <span className="font-bold">Game History</span>
                    </Button>

                    <div className="bg-primary/5 px-6 py-3 rounded-2xl border-2 border-yellow-500/20 shadow-sm flex items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-700">
                        <div className="text-right">
                           <p className="text-[10px] font-bold text-primary/60 leading-none mb-1">Total Balance</p>
                           <p className="text-2xl font-black text-foreground leading-none flex items-center gap-2">
                                <Coins className="h-6 w-6 text-yellow-500 animate-bounce" />
                                {totalCoins}
                           </p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {levels.map((level) => {
                    const medicineCount = levelMedicines.filter(m => String(m.level_id) === String(level.id)).length;
                    return (
                        <button 
                            key={level.id} 
                            onClick={() => router.push(`/dashboard/medimind/${level.id}`)} 
                            className="group block h-full text-left focus:outline-none focus:ring-2 focus:ring-primary rounded-xl"
                        >
                            <Card className="shadow-lg hover:shadow-2xl hover:border-primary/50 transition-all h-full border-2 overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <div className="bg-primary h-24 w-24 rounded-full" />
                                </div>
                                <CardHeader className="flex flex-row items-center justify-between p-6">
                                    <div className="space-y-1 pr-6 flex-1">
                                        <CardTitle className="text-xl group-hover:text-primary transition-colors font-bold truncate">
                                            {level.level_name}
                                        </CardTitle>
                                        <CardDescription className="text-sm font-semibold flex items-center gap-2">
                                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
                                                {medicineCount} Medicines
                                            </span>
                                        </CardDescription>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0">
                                        <ChevronRight className="h-6 w-6 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </CardHeader>
                            </Card>
                        </button>
                    );
                })}
                {levels.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-muted/30 border-2 border-dashed rounded-2xl">
                        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-bold">No Levels Available</h3>
                        <p className="text-muted-foreground">Admin hasn't configured any game levels yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
