"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { 
    ArrowLeft, 
    Search, 
    Trash2, 
    Loader2, 
    AlertTriangle, 
    CheckCircle, 
    XCircle, 
    User, 
    Pill, 
    FileQuestion,
    Filter
} from "lucide-react";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle, 
    AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

import { getMediMindStudentAnswers, deleteMediMindStudentAnswer } from '@/lib/actions/games';
import type { MediMindStudentAnswer } from '@/lib/types';

export default function StudentSubmissionsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Correct' | 'Wrong'>('All');

    // --- Data Fetching ---
    const { data: submissions = [], isLoading } = useQuery<MediMindStudentAnswer[]>({
        queryKey: ['mediMindStudentAnswers'],
        queryFn: getMediMindStudentAnswers,
    });

    // --- Mutations ---
    const deleteMutation = useMutation({
        mutationFn: deleteMediMindStudentAnswer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mediMindStudentAnswers'] });
            toast({ title: "Submission Deleted", description: "The student attempt has been removed." });
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Delete Failed', description: err.message }),
    });

    // --- Filtered Data ---
    const filteredSubmissions = useMemo(() => {
        return submissions.filter(sub => {
            const matchesSearch = 
                (sub.created_by?.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
                (sub.medicine_name?.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesStatus = statusFilter === 'All' || sub.correct_status === statusFilter;
            
            return matchesSearch && matchesStatus;
        }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [submissions, searchTerm, statusFilter]);

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Button variant="ghost" onClick={() => router.push('/admin/manage/games/medimind')} className="-ml-4 hover:bg-primary/10 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to MediMind Setup
                    </Button>
                    <h1 className="text-3xl font-headline font-semibold mt-2">Student Submissions</h1>
                    <p className="text-muted-foreground">Monitor and manage all student attempts in the MediMind game.</p>
                </div>
                <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
                    <Button 
                        variant={statusFilter === 'All' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        onClick={() => setStatusFilter('All')}
                        className="text-xs h-8"
                    >
                        All
                    </Button>
                    <Button 
                        variant={statusFilter === 'Correct' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        onClick={() => setStatusFilter('Correct')}
                        className="text-xs h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                        Correct
                    </Button>
                    <Button 
                        variant={statusFilter === 'Wrong' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        onClick={() => setStatusFilter('Wrong')}
                        className="text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        Wrong
                    </Button>
                </div>
            </header>

            <Card className="shadow-xl border-none ring-1 ring-primary/10">
                <CardHeader className="bg-muted/30 border-b">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by Student ID or Medicine..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-10 bg-background"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium bg-background px-4 h-10 rounded-md border shrink-0">
                            <Filter className="h-4 w-4" />
                            <span>Showing {filteredSubmissions.length} of {submissions.length} attempts</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-20 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-muted-foreground font-medium animate-pulse">Loading submission data...</p>
                        </div>
                    ) : filteredSubmissions.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                                        <TableHead className="w-[120px]">Student ID</TableHead>
                                        <TableHead>Medicine</TableHead>
                                        <TableHead className="hidden lg:table-cell">Question</TableHead>
                                        <TableHead className="hidden md:table-cell">Selected Answer</TableHead>
                                        <TableHead className="w-[100px]">Status</TableHead>
                                        <TableHead className="w-[150px]">Date & Time</TableHead>
                                        <TableHead className="w-[80px] text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSubmissions.map((sub) => (
                                        <TableRow key={sub.id} className="group hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-mono font-bold text-primary">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-3 w-3 text-muted-foreground" />
                                                    {sub.created_by}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Pill className="h-3 w-3 text-primary opacity-50" />
                                                    {sub.medicine_name || <span className="text-muted-foreground italic text-xs">Unknown Medicine</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate hidden lg:table-cell text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <FileQuestion className="h-3 w-3 shrink-0" />
                                                    {sub.question}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell italic font-medium">
                                                "{sub.answer}"
                                            </TableCell>
                                            <TableCell>
                                                <Badge 
                                                    variant={sub.correct_status === 'Correct' ? 'outline' : 'destructive'}
                                                    className={sub.correct_status === 'Correct' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                                >
                                                    {sub.correct_status === 'Correct' ? (
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                    ) : (
                                                        <XCircle className="h-3 w-3 mr-1" />
                                                    )}
                                                    {sub.correct_status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {format(new Date(sub.created_at), 'MMM dd, yyyy • HH:mm')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Submission?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will permanently remove this game record. This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction 
                                                                onClick={() => deleteMutation.mutate(sub.id)}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                {deleteMutation.isPending && deleteMutation.variables === sub.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : "Delete"}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="p-20 text-center flex flex-col items-center justify-center gap-3">
                            <AlertTriangle className="h-12 w-12 text-amber-500 opacity-20" />
                            <h3 className="text-xl font-bold text-muted-foreground">No Submissions Found</h3>
                            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                {searchTerm || statusFilter !== 'All' 
                                    ? "Try adjusting your search or filters to find what you're looking for." 
                                    : "Student attempts will appear here once they start playing the game."}
                            </p>
                            {(searchTerm || statusFilter !== 'All') && (
                                <Button 
                                    variant="link" 
                                    className="text-primary mt-2"
                                    onClick={() => { setSearchTerm(''); setStatusFilter('All'); }}
                                >
                                    Clear all filters
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
