
"use client";

import { useState, useMemo, Fragment } from 'react';
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
import { ArrowLeft, PlusCircle, Edit, Trash2, Loader2, FileQuestion, Search } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// --- Mock Data Structure ---
interface GameQuestion {
  id: string;
  text: string;
}

interface AnswerOption {
  id: string;
  questionId: string;
  text: string;
}

const dummyQuestions: GameQuestion[] = [
  { id: 'q1', text: 'What is its primary Drug Class?' },
  { id: 'q2', text: 'What is its primary Indication (use)?' },
  { id: 'q3', text: 'What is its Mechanism of Action?' },
  { id: 'q4', text: 'What is a Common Side Effect?' },
  { id: 'q5', text: 'What is a common Dosage Form?' },
];

const dummyAnswers: AnswerOption[] = [
  { id: 'a1', questionId: 'q1', text: 'Analgesic' },
  { id: 'a2', questionId: 'q1', text: 'Antibiotic' },
  { id: 'a3', questionId: 'q1', text: 'Antihypertensive' },
  { id: 'a4', questionId: 'q2', text: 'Pain and fever' },
  { id: 'a5', questionId: 'q2', text: 'Bacterial infection' },
  { id: 'a6', questionId: 'q5', text: 'Tablet' },
  { id: 'a7', questionId: 'q5', text: 'Capsule' },
  { id: 'a8', questionId: 'q3', text: 'Inhibits COX enzymes' },
  { id: 'a9', questionId: 'q3', text: 'Inhibits bacterial cell wall synthesis' },
  { id: 'a10', questionId: 'q4', text: 'Liver damage (in overdose)' },
];

// --- Form Schema ---
const answerFormSchema = z.object({
  text: z.string().min(1, 'Answer text cannot be empty.'),
});

type AnswerFormValues = z.infer<typeof answerFormSchema>;

// --- Form Component ---
const AnswerForm = ({ answer, onSave, onClose, isSaving }: { answer?: AnswerOption | null; onSave: (data: AnswerFormValues) => void; onClose: () => void; isSaving: boolean }) => {
    const { register, handleSubmit, formState: { errors } } = useForm<AnswerFormValues>({
        resolver: zodResolver(answerFormSchema),
        defaultValues: {
            text: answer?.text || '',
        }
    });

    return (
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="answer-text">Answer Text</Label>
                <Input id="answer-text" {...register('text')} />
                {errors.text && <p className="text-sm text-destructive">{errors.text.message}</p>}
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
    const [answers, setAnswers] = useState<AnswerOption[]>(dummyAnswers);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<AnswerOption | null>(null);
    const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
    const [answerToDelete, setAnswerToDelete] = useState<AnswerOption | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const answersByQuestion = useMemo(() => {
        return dummyQuestions.map(question => ({
            ...question,
            answers: answers.filter(answer => answer.questionId === question.id)
                            .filter(answer => answer.text.toLowerCase().includes(searchTerm.toLowerCase()))
                            .sort((a,b) => a.text.localeCompare(b.text))
        }));
    }, [answers, searchTerm]);

    const handleCreate = (questionId: string) => {
        setSelectedAnswer(null);
        setActiveQuestionId(questionId);
        setIsFormOpen(true);
    };

    const handleEdit = (answer: AnswerOption) => {
        setSelectedAnswer(answer);
        setActiveQuestionId(answer.questionId);
        setIsFormOpen(true);
    };

    const handleSave = (data: AnswerFormValues) => {
        setIsSaving(true);
        setTimeout(() => { // Simulate async operation
            if (selectedAnswer) {
                setAnswers(prev => prev.map(a => a.id === selectedAnswer.id ? { ...a, ...data } : a));
                toast({ title: "Answer Updated" });
            } else if (activeQuestionId) {
                const newAnswer: AnswerOption = { id: `a${Date.now()}`, questionId: activeQuestionId, ...data };
                setAnswers(prev => [newAnswer, ...prev]);
                toast({ title: "Answer Created" });
            }
            setIsSaving(false);
            setIsFormOpen(false);
        }, 1000);
    };

    const handleDelete = () => {
        if (!answerToDelete) return;
        setIsSaving(true);
        setTimeout(() => {
            setAnswers(prev => prev.filter(a => a.id !== answerToDelete.id));
            toast({ title: 'Answer Deleted' });
            setAnswerToDelete(null);
            setIsSaving(false);
        }, 500);
    };

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedAnswer ? 'Edit' : 'Create'} Answer</DialogTitle>
                        <DialogDescription>
                            {selectedAnswer ? `Editing an answer for "${dummyQuestions.find(q => q.id === activeQuestionId)?.text}"` : `Adding a new answer for "${dummyQuestions.find(q => q.id === activeQuestionId)?.text}"`}
                        </DialogDescription>
                    </DialogHeader>
                    <AnswerForm answer={selectedAnswer} onClose={() => setIsFormOpen(false)} onSave={handleSave} isSaving={isSaving} />
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!answerToDelete} onOpenChange={() => setAnswerToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the answer "{answerToDelete?.text}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isSaving}>
                             {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Delete
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
                    <Accordion type="multiple" className="w-full space-y-2">
                        {answersByQuestion.map(questionGroup => (
                            <AccordionItem key={questionGroup.id} value={questionGroup.id} className="border rounded-lg">
                                <AccordionTrigger className="p-4 hover:no-underline">
                                    <div className="flex items-center justify-between w-full">
                                        <div className="text-left">
                                            <h3 className="font-semibold">{questionGroup.text}</h3>
                                            <p className="text-sm text-muted-foreground">{questionGroup.answers.length} answer(s)</p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 pt-0">
                                    <div className="space-y-2">
                                        {questionGroup.answers.map(answer => (
                                            <div key={answer.id} className="flex items-center justify-between p-2 pl-3 border rounded-md bg-muted/50">
                                                <p className="text-sm font-medium">{answer.text}</p>
                                                <div className="flex items-center">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(answer)}><Edit className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setAnswerToDelete(answer)}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </div>
                                        ))}
                                         {questionGroup.answers.length === 0 && searchTerm && (
                                            <p className="text-center text-sm text-muted-foreground py-4">No answers match your search in this category.</p>
                                        )}
                                    </div>
                                    <Button size="sm" variant="outline" className="mt-4" onClick={() => handleCreate(questionGroup.id)}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> Add Answer
                                    </Button>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    );
}

