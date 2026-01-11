
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { ArrowLeft, PlusCircle, Edit, Trash2, Loader2, FileQuestion } from "lucide-react";


// --- Mock Data Structure ---
interface GameQuestion {
  id: string;
  text: string;
}

const dummyQuestions: GameQuestion[] = [
  { id: 'q1', text: 'What is its primary Drug Class?' },
  { id: 'q2', text: 'What is its primary Indication (use)?' },
  { id: 'q3', text: 'What is its Mechanism of Action?' },
  { id: 'q4', text: 'What is a Common Side Effect?' },
  { id: 'q5', text: 'What is a common Dosage Form?' },
];

// --- Form Schema ---
const questionFormSchema = z.object({
  text: z.string().min(10, 'Question must be at least 10 characters.'),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

// --- Form Component ---
const QuestionForm = ({ question, onSave, onClose, isSaving }: { question?: GameQuestion | null; onSave: (data: QuestionFormValues) => void; onClose: () => void; isSaving: boolean }) => {
    const { register, handleSubmit, formState: { errors } } = useForm<QuestionFormValues>({
        resolver: zodResolver(questionFormSchema),
        defaultValues: {
            text: question?.text || '',
        }
    });

    return (
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="question-text">Question Text</Label>
                <Input id="question-text" {...register('text')} />
                {errors.text && <p className="text-sm text-destructive">{errors.text.message}</p>}
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
    const [questions, setQuestions] = useState<GameQuestion[]>(dummyQuestions);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<GameQuestion | null>(null);
    const [questionToDelete, setQuestionToDelete] = useState<GameQuestion | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleCreate = () => {
        setSelectedQuestion(null);
        setIsFormOpen(true);
    };

    const handleEdit = (question: GameQuestion) => {
        setSelectedQuestion(question);
        setIsFormOpen(true);
    };

    const handleSave = (data: QuestionFormValues) => {
        setIsSaving(true);
        setTimeout(() => { // Simulate async operation
            if (selectedQuestion) {
                setQuestions(prev => prev.map(q => q.id === selectedQuestion.id ? { ...q, ...data } : q));
                toast({ title: "Question Updated" });
            } else {
                const newQuestion: GameQuestion = { id: `q${Date.now()}`, ...data };
                setQuestions(prev => [newQuestion, ...prev]);
                toast({ title: "Question Created" });
            }
            setIsSaving(false);
            setIsFormOpen(false);
        }, 1000);
    };

    const handleDelete = () => {
        if (!questionToDelete) return;
        setIsSaving(true);
        setTimeout(() => {
            setQuestions(prev => prev.filter(q => q.id !== questionToDelete.id));
            toast({ title: 'Question Deleted' });
            setQuestionToDelete(null);
            setIsSaving(false);
        }, 500);
    };

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
             <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedQuestion ? 'Edit' : 'Create'} Question</DialogTitle>
                        <DialogDescription>Enter the text for the game question.</DialogDescription>
                    </DialogHeader>
                    <QuestionForm question={selectedQuestion} onClose={() => setIsFormOpen(false)} onSave={handleSave} isSaving={isSaving} />
                </DialogContent>
            </Dialog>

             <AlertDialog open={!!questionToDelete} onOpenChange={() => setQuestionToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the question "{questionToDelete?.text}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isSaving}>
                             {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Delete
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
                    <p className="text-muted-foreground">Define the set of questions that can be asked about a medicine.</p>
                </div>
                 <Button onClick={handleCreate}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Question
                </Button>
            </header>
            
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Question List</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {questions.length > 0 ? questions.map(question => (
                        <div key={question.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                            <p className="font-medium text-sm">{question.text}</p>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(question)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setQuestionToDelete(question)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-10 text-muted-foreground">
                            <FileQuestion className="mx-auto h-12 w-12" />
                            <h3 className="mt-4 text-lg font-semibold">No Questions Found</h3>
                            <p>Click "Add New Question" to create the first one.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
