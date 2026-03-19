"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, PlusCircle, Edit, Trash2, Loader2, FileQuestion, Calendar, UserCheck } from "lucide-react";
import { getMediMindQuestions, createMediMindQuestion, updateMediMindQuestion, deleteMediMindQuestion } from '@/lib/actions/games';
import type { MediMindQuestion } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

// --- Form Schema ---
const questionFormSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters.'),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

// --- Form Component ---
const QuestionForm = ({ question, onSave, onClose, isSaving }: { question?: MediMindQuestion | null; onSave: (data: QuestionFormValues) => void; onClose: () => void; isSaving: boolean }) => {
    const { register, handleSubmit, formState: { errors } } = useForm<QuestionFormValues>({
        resolver: zodResolver(questionFormSchema),
        defaultValues: {
            question: question?.question || '',
        }
    });

    return (
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="question-text">Question Text</Label>
                <Input id="question-text" {...register('question')} placeholder="e.g. What is the mechanism of action?" />
                {errors.question && <p className="text-sm text-destructive">{errors.question.message}</p>}
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Question
                </Button>
            </DialogFooter>
        </form>
    );
};


// --- Main Page Component ---
export default function ManageQuestionsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<MediMindQuestion | null>(null);
    const [questionToDelete, setQuestionToDelete] = useState<MediMindQuestion | null>(null);

    const { data: questions = [], isLoading, isError, error } = useQuery<MediMindQuestion[]>({
        queryKey: ['mediMindQuestions'],
        queryFn: getMediMindQuestions,
    });

    const createMutation = useMutation({
        mutationFn: createMediMindQuestion,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mediMindQuestions'] });
            toast({ title: "Question Created", description: "The question has been added to the database." });
            setIsFormOpen(false);
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Create Failed', description: err.message }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: QuestionFormValues }) => updateMediMindQuestion(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mediMindQuestions'] });
            toast({ title: "Question Updated" });
            setIsFormOpen(false);
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Update Failed', description: err.message }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteMediMindQuestion,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mediMindQuestions'] });
            toast({ title: 'Question Deleted' });
            setQuestionToDelete(null);
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Delete Failed', description: err.message }),
    });

    const handleCreate = () => {
        setSelectedQuestion(null);
        setIsFormOpen(true);
    };

    const handleEdit = (question: MediMindQuestion) => {
        setSelectedQuestion(question);
        setIsFormOpen(true);
    };

    const handleSave = (data: QuestionFormValues) => {
        if (selectedQuestion) {
            updateMutation.mutate({ id: selectedQuestion.id, data });
        } else {
            createMutation.mutate({ 
                question: data.question, 
                created_by: user?.username || 'admin_user' 
            });
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
             <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedQuestion ? 'Edit' : 'Create'} Question</DialogTitle>
                        <DialogDescription>Define a standard question for the MediMind medicines.</DialogDescription>
                    </DialogHeader>
                    <QuestionForm 
                        question={selectedQuestion} 
                        onClose={() => setIsFormOpen(false)} 
                        onSave={handleSave} 
                        isSaving={createMutation.isPending || updateMutation.isPending} 
                    />
                </DialogContent>
            </Dialog>

             <AlertDialog open={!!questionToDelete} onOpenChange={() => setQuestionToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the question "{questionToDelete?.question}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => deleteMutation.mutate(questionToDelete!.id)} 
                            disabled={deleteMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                             {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <Button variant="ghost" onClick={() => router.push('/admin/manage/games/medimind')} className="-ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to MediMind Setup
                    </Button>
                    <h1 className="text-3xl font-headline font-semibold mt-2">Manage Questions</h1>
                    <p className="text-muted-foreground">Define the set of questions that can be asked about any medicine.</p>
                </div>
                 <Button onClick={handleCreate}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Question
                </Button>
            </header>
            
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Question List</CardTitle>
                    <CardDescription>{isLoading ? "Loading..." : `${questions.length} questions configured.`}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {isLoading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse bg-muted/50">
                                <Skeleton className="h-5 w-3/4" />
                                <div className="flex gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div>
                            </div>
                        ))
                    ) : questions.length > 0 ? (
                        questions.map(q => (
                            <div key={q.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
                                <div className="flex-1 min-w-0 mr-4">
                                    <p className="font-medium text-sm text-card-foreground break-words">{q.question}</p>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider">
                                            <UserCheck className="h-3 w-3" />
                                            <span>Author: {q.created_by}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider">
                                            <Calendar className="h-3 w-3" />
                                            <span>{format(new Date(q.created_at), 'MMM d, yyyy')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(q)}><Edit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setQuestionToDelete(q)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            <FileQuestion className="mx-auto h-12 w-12 opacity-20" />
                            <h3 className="mt-4 text-lg font-semibold">No Questions Found</h3>
                            <p>Click "Add New Question" to create the first one.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
