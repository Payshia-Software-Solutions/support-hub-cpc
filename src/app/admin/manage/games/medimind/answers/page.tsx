"use client";

import { useState, useMemo } from 'react';
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
import { ArrowLeft, PlusCircle, Edit, Trash2, Loader2, FileQuestion, Search, AlertTriangle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getMediMindQuestions, getMediMindAnswers, createMediMindAnswer, updateMediMindAnswer, deleteMediMindAnswer } from '@/lib/actions/games';
import type { MediMindQuestion, MediMindAnswer } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

// --- Form Schema ---
const answerFormSchema = z.object({
  answer: z.string().min(1, 'Answer text cannot be empty.'),
});

type AnswerFormValues = z.infer<typeof answerFormSchema>;

// --- Form Component ---
const AnswerForm = ({ answer, onSave, onClose, isSaving }: { answer?: MediMindAnswer | null; onSave: (data: AnswerFormValues) => void; onClose: () => void; isSaving: boolean }) => {
    const { register, handleSubmit, formState: { errors } } = useForm<AnswerFormValues>({
        resolver: zodResolver(answerFormSchema),
        defaultValues: {
            answer: answer?.answer || '',
        }
    });

    return (
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="answer-text">Answer Option Text</Label>
                <Input id="answer-text" {...register('answer')} placeholder="Type an answer option..." />
                {errors.answer && <p className="text-sm text-destructive">{errors.answer.message}</p>}
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Answer
                </Button>
            </DialogFooter>
        </form>
    );
};

// --- Main Page Component ---
export default function ManageAnswersPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<MediMindAnswer | null>(null);
    const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
    const [answerToDelete, setAnswerToDelete] = useState<MediMindAnswer | null>(null);

    const { data: questions = [], isLoading: isLoadingQuestions } = useQuery<MediMindQuestion[]>({
        queryKey: ['mediMindQuestions'],
        queryFn: getMediMindQuestions,
    });

    const { data: answers = [], isLoading: isLoadingAnswers, isError, error } = useQuery<MediMindAnswer[]>({
        queryKey: ['mediMindAnswers'],
        queryFn: getMediMindAnswers,
    });

    const createMutation = useMutation({
        mutationFn: createMediMindAnswer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mediMindAnswers'] });
            toast({ title: "Answer Created", description: "The answer option has been added to the pool." });
            setIsFormOpen(false);
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Create Failed', description: err.message }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: { question_id: number; answer: string } }) => updateMediMindAnswer(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mediMindAnswers'] });
            toast({ title: "Answer Updated" });
            setIsFormOpen(false);
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Update Failed', description: err.message }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteMediMindAnswer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mediMindAnswers'] });
            toast({ title: 'Answer Deleted' });
            setAnswerToDelete(null);
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Delete Failed', description: err.message }),
    });

    const answersByQuestion = useMemo(() => {
        return questions.map(question => ({
            ...question,
            answers: answers.filter(a => String(a.question_id) === String(question.id))
                            .filter(a => a.answer.toLowerCase().includes(searchTerm.toLowerCase()))
                            .sort((a,b) => a.answer.localeCompare(b.answer))
        }));
    }, [questions, answers, searchTerm]);

    const handleCreate = (questionId: string) => {
        setSelectedAnswer(null);
        setActiveQuestionId(questionId);
        setIsFormOpen(true);
    };

    const handleEdit = (answer: MediMindAnswer) => {
        setSelectedAnswer(answer);
        setActiveQuestionId(answer.question_id);
        setIsFormOpen(true);
    };

    const handleSave = (data: AnswerFormValues) => {
        if (!user?.username || !activeQuestionId) return;

        if (selectedAnswer) {
            updateMutation.mutate({ 
                id: selectedAnswer.id, 
                data: { question_id: parseInt(activeQuestionId, 10), answer: data.answer } 
            });
        } else {
            createMutation.mutate({ 
                question_id: parseInt(activeQuestionId, 10), 
                answer: data.answer, 
                created_by: user.username 
            });
        }
    };

    const isLoading = isLoadingQuestions || isLoadingAnswers;

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedAnswer ? 'Edit' : 'Create'} Answer Option</DialogTitle>
                        <DialogDescription>
                            {selectedAnswer ? `Editing an answer for "${questions.find(q => String(q.id) === String(activeQuestionId))?.question}"` : `Adding a new answer for "${questions.find(q => String(q.id) === String(activeQuestionId))?.question}"`}
                        </DialogDescription>
                    </DialogHeader>
                    <AnswerForm 
                        answer={selectedAnswer} 
                        onClose={() => setIsFormOpen(false)} 
                        onSave={handleSave} 
                        isSaving={createMutation.isPending || updateMutation.isPending} 
                    />
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!answerToDelete} onOpenChange={() => setAnswerToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the answer "{answerToDelete?.answer}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => deleteMutation.mutate(answerToDelete!.id)} 
                            disabled={deleteMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                             {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <header>
                <Button variant="ghost" onClick={() => router.push('/admin/manage/games/medimind')} className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to MediMind Setup
                </Button>
                <h1 className="text-3xl font-headline font-semibold mt-2">Manage Answer Options</h1>
                <p className="text-muted-foreground">Manage the pool of possible answers for each question type.</p>
            </header>
            
            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <CardTitle>Answer Pool by Question</CardTitle>
                        <div className="relative w-full md:max-w-xs">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                           <Input 
                                placeholder="Search all answers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                           />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    ) : isError ? (
                        <div className="p-8 text-center text-destructive flex flex-col items-center">
                            <AlertTriangle className="h-10 w-10 mb-2" />
                            <p className="font-semibold">Error Loading Answers</p>
                            <p className="text-sm">{(error as Error).message}</p>
                        </div>
                    ) : (
                        <Accordion type="multiple" className="w-full space-y-2">
                            {answersByQuestion.map(questionGroup => (
                                <AccordionItem key={questionGroup.id} value={String(questionGroup.id)} className="border rounded-lg">
                                    <AccordionTrigger className="p-4 hover:no-underline">
                                        <div className="flex items-center justify-between w-full">
                                            <div className="text-left pr-4">
                                                <h3 className="font-semibold text-sm md:text-base">{questionGroup.question}</h3>
                                                <p className="text-xs text-muted-foreground mt-1">{questionGroup.answers.length} answer(s) available</p>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 pt-0">
                                        <div className="space-y-2 mt-2">
                                            {questionGroup.answers.map(answer => (
                                                <div key={answer.id} className="flex items-center justify-between p-2 pl-3 border rounded-md bg-muted/50 group">
                                                    <p className="text-sm font-medium">{answer.answer}</p>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(answer)}><Edit className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setAnswerToDelete(answer)}><Trash2 className="h-4 w-4" /></Button>
                                                    </div>
                                                </div>
                                            ))}
                                            {questionGroup.answers.length === 0 && (
                                                <div className="text-center py-6 border border-dashed rounded-md bg-muted/20">
                                                    <p className="text-sm text-muted-foreground">{searchTerm ? "No matching answers in this category." : "No answers defined for this question yet."}</p>
                                                </div>
                                            )}
                                        </div>
                                        <Button size="sm" variant="outline" className="mt-4 w-full sm:w-auto" onClick={() => handleCreate(String(questionGroup.id))}>
                                            <PlusCircle className="mr-2 h-4 w-4" /> Add Answer Option
                                        </Button>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
