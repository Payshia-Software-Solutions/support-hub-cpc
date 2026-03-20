"use client";

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    ArrowLeft, 
    History, 
    Coins, 
    CheckCircle2, 
    XCircle, 
    TrendingUp, 
    TrendingDown,
    Loader2,
    Search,
    Calendar,
    Pill
} from "lucide-react";
import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getMediMindStudentAnswersByStudent } from '@/lib/actions/games';
import { Badge } from '@/components/ui/badge';
import type { MediMindStudentAnswer } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';

export default function MediMindHistoryPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Correct' | 'Wrong'>('All');

    const { data: history = [], isLoading } = useQuery<MediMindStudentAnswer[]>({
        queryKey: ['studentMediMindHistory', user?.username],
        queryFn: () => getMediMindStudentAnswersByStudent(user!.username!),
        enabled: !!user?.username,
    });

    const stats = useMemo(() => {
        const correct = history.filter(a => a.correct_status === 'Correct').length;
        const wrong = history.filter(a => a.correct_status === 'Wrong').length;
        return {
            correct,
            wrong,
            total: history.length,
            coins: (correct * 10) - (wrong * 2)
        };
    }, [history]);

    const filteredHistory = useMemo(() => {
        return history.filter(item => {
            const matchesSearch = 
                (item.medicine_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.question?.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesStatus = statusFilter === 'All' || item.correct_status === statusFilter;
            
            return matchesSearch && matchesStatus;
        }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [history, searchTerm, statusFilter]);

    if (isLoading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse font-medium">Retrieving your track record...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center border shadow-sm hover:border-primary/50 transition-all">
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-headline font-bold text-primary italic uppercase tracking-tighter">Your MediMind History</h1>
                        <p className="text-muted-foreground font-medium">Review your performance and coin earnings.</p>
                    </div>
                </div>

                <div className="bg-primary/5 px-6 py-4 rounded-3xl border-2 border-yellow-500/20 shadow-xl flex items-center gap-6 animate-in zoom-in-95 duration-500">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest leading-none mb-1">Total Earnings</p>
                        <p className="text-3xl font-black text-foreground leading-none flex items-center gap-2">
                            <Coins className="h-7 w-7 text-yellow-500" />
                            {stats.coins}
                        </p>
                    </div>
                </div>
            </header>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Card className="rounded-3xl border-none shadow-lg bg-green-500/5 ring-1 ring-green-500/20 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingUp className="h-12 w-12 text-green-600" />
                    </div>
                    <CardContent className="p-6">
                        <p className="text-xs font-black text-green-600 uppercase tracking-widest mb-1">Correct Answers</p>
                        <p className="text-4xl font-black text-green-700">{stats.correct}</p>
                        <p className="text-[10px] mt-2 text-green-600 font-bold">+ {stats.correct * 10} Coins earned</p>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-none shadow-lg bg-red-500/5 ring-1 ring-red-500/20 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingDown className="h-12 w-12 text-red-600" />
                    </div>
                    <CardContent className="p-6">
                        <p className="text-xs font-black text-red-600 uppercase tracking-widest mb-1">Wrong Entries</p>
                        <p className="text-4xl font-black text-red-700">{stats.wrong}</p>
                        <p className="text-[10px] mt-2 text-red-600 font-bold">- {stats.wrong * 2} Coins reduced</p>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-none shadow-lg bg-primary/5 ring-1 ring-primary/20 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <History className="h-12 w-12 text-primary" />
                    </div>
                    <CardContent className="p-6">
                        <p className="text-xs font-black text-primary uppercase tracking-widest mb-1">Total Attempts</p>
                        <p className="text-4xl font-black text-primary">{stats.total}</p>
                        <p className="text-[10px] mt-2 text-muted-foreground font-bold italic">Keep pushing forward!</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Section */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Search medicines or questions..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-14 rounded-2xl bg-muted/30 border-none shadow-inner text-base font-medium"
                    />
                </div>
                <div className="flex items-center gap-2 p-1 bg-muted/30 rounded-2xl border shadow-inner w-full md:w-auto overflow-x-auto">
                    {(['All', 'Correct', 'Wrong'] as const).map((status) => (
                        <Button
                            key={status}
                            variant={statusFilter === status ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setStatusFilter(status)}
                            className={cn(
                                "rounded-xl font-bold px-6 h-10 transition-all",
                                statusFilter === status && "shadow-sm"
                            )}
                        >
                            {status}
                        </Button>
                    ))}
                </div>
            </div>

            {/* History List */}
            <div className="space-y-4">
                {filteredHistory.length > 0 ? (
                    filteredHistory.map((item) => (
                        <Card key={item.id} className="rounded-3xl border-none shadow-md hover:shadow-xl transition-all overflow-hidden group">
                            <CardContent className="p-0">
                                <div className="flex flex-col sm:flex-row items-stretch">
                                    <div className={cn(
                                        "w-2 sm:w-3 shrink-0",
                                        item.correct_status === 'Correct' ? "bg-green-500" : "bg-red-500"
                                    )} />
                                    <div className="flex-1 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-6 flex-1 min-w-0">
                                            <div className="relative shrink-0">
                                                <div className={cn(
                                                    "h-16 w-16 rounded-2xl overflow-hidden border-2 bg-white flex items-center justify-center p-2",
                                                    item.correct_status === 'Correct' ? "border-green-200" : "border-red-200"
                                                )}>
                                                    <img 
                                                        src={`https://content-provider.pharmacollege.lk/uploads/medimind/${item.medicine_id}.jpg`}
                                                        alt={item.medicine_name || ''}
                                                        className="h-full w-full object-contain"
                                                        onError={(e) => {
                                                            // Fallback to Icon if image fails
                                                            (e.target as any).style.display = 'none';
                                                            (e.target as any).parentElement.innerHTML = `
                                                                <div class="h-full w-full flex items-center justify-center">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground opacity-20"><path d="M10.5 21l-7.5-7.5 3.5-3.5 7.5 7.5-3.5 3.5z"/><path d="M14.5 9l3.5-3.5 3 3-3.5 3.5-3-3z"/><path d="M21 21l-4.5-4.5"/></svg>
                                                                </div>
                                                            `;
                                                        }}
                                                    />
                                                </div>
                                                <div className={cn(
                                                    "absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center border shadow-sm",
                                                    item.correct_status === 'Correct' ? "bg-green-500 border-green-600 text-white" : "bg-red-500 border-red-600 text-white"
                                                )}>
                                                    {item.correct_status === 'Correct' ? (
                                                        <CheckCircle2 className="h-3 w-3" />
                                                    ) : (
                                                        <XCircle className="h-3 w-3" />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant="outline" className="text-[10px] uppercase font-black py-0 px-2 rounded-md">
                                                        {item.medicine_name}
                                                    </Badge>
                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-bold italic">
                                                        <Calendar className="h-3 w-3" />
                                                        {format(new Date(item.created_at), 'MMM dd, HH:mm')}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold text-foreground leading-snug truncate pr-6">
                                                    {item.question}
                                                </h3>
                                                <p className="text-sm text-muted-foreground italic truncate">
                                                    Answer: <span className="font-bold text-foreground">"{item.answer}"</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pr-2">
                                            <div className={cn(
                                                "px-4 py-2 rounded-2xl font-black flex items-center gap-2 border-2",
                                                item.correct_status === 'Correct' 
                                                    ? "bg-green-500/10 border-green-500/20 text-green-700" 
                                                    : "bg-red-500/10 border-red-500/20 text-red-700"
                                            )}>
                                                {item.correct_status === 'Correct' ? (
                                                    <TrendingUp className="h-4 w-4" />
                                                ) : (
                                                    <TrendingDown className="h-4 w-4" />
                                                )}
                                                {item.correct_status === 'Correct' ? '+10' : '-2'}
                                                <Coins className={cn(
                                                    "h-4 w-4",
                                                    item.correct_status === 'Correct' ? "text-yellow-600" : "text-red-400"
                                                )} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="py-20 text-center bg-muted/20 border-2 border-dashed rounded-[2.5rem] space-y-4">
                        <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto opacity-40">
                            <AlertTriangle className="h-10 w-10 text-amber-500" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold">No Records Found</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                                {searchTerm || statusFilter !== 'All' 
                                    ? "Try broadening your filters to find your previous attempts." 
                                    : "Start playing the MediMind challenge to see your history and earn coins!"}
                            </p>
                        </div>
                        { (searchTerm || statusFilter !== 'All') && (
                            <Button variant="link" onClick={() => { setSearchTerm(''); setStatusFilter('All'); }}>
                                Reset filters
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

const AlertTriangle = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
);
