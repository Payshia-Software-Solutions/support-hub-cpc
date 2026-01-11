
"use client";

import { useState, useMemo } from 'react';
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
import { ArrowLeft, PlusCircle, Edit, Trash2, Loader2, HelpCircle, Search } from "lucide-react";

// --- Mock Data Structure ---
interface AnswerOption {
  id: string;
  text: string;
}

const dummyAnswers: AnswerOption[] = [
  { id: 'a1', text: 'Analgesic' },
  { id: 'a2', text: 'Antibiotic' },
  { id: 'a3', text: 'Antihypertensive' },
  { id: 'a4', text: 'Pain and fever' },
  { id: 'a5', text: 'Bacterial infection' },
  { id: 'a6', text: 'Tablet' },
  { id: 'a7', text: 'Capsule' },
  { id: 'a8', text: 'Inhibits COX enzymes' },
  { id: 'a9', text: 'Inhibits bacterial cell wall synthesis' },
  { id: 'a10', text: 'Liver damage (in overdose)' },
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
    const [answerToDelete, setAnswerToDelete] = useState<AnswerOption | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const filteredAnswers = useMemo(() => {
        return answers.filter(answer => answer.text.toLowerCase().includes(searchTerm.toLowerCase()))
                      .sort((a,b) => a.text.localeCompare(b.text));
    }, [answers, searchTerm]);

    const handleCreate = () => {
        setSelectedAnswer(null);
        setIsFormOpen(true);
    };

    const handleEdit = (answer: AnswerOption) => {
        setSelectedAnswer(answer);
        setIsFormOpen(true);
    };

    const handleSave = (data: AnswerFormValues) => {
        setIsSaving(true);
        setTimeout(() => { // Simulate async operation
            if (selectedAnswer) {
                setAnswers(prev => prev.map(a => a.id === selectedAnswer.id ? { ...a, ...data } : a));
                toast({ title: "Answer Updated" });
            } else {
                const newAnswer: AnswerOption = { id: `a${Date.now()}`, ...data };
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
                        <DialogTitle>{selectedAnswer ? 'Edit' : 'Create'} Answer Option</DialogTitle>
                        <DialogDescription>Enter the text for a possible answer.</DialogDescription>
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

            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <Button variant="ghost" onClick={() => router.push('/admin/manage/games/medimind')} className="-ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to MediMind Setup
                    </Button>
                    <h1 className="text-3xl font-headline font-semibold mt-2">Manage Answer Options</h1>
                    <p className="text-muted-foreground">Manage the pool of possible answers for all questions.</p>
                </div>
                 <Button onClick={handleCreate}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Answer
                </Button>
            </header>
            
            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <CardTitle>Answer Pool</CardTitle>
                        <div className="relative w-full md:max-w-xs">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                           <Input 
                                placeholder="Search answers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                           />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2">
                     {filteredAnswers.length > 0 ? filteredAnswers.map(answer => (
                        <div key={answer.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <p className="font-medium text-sm">{answer.text}</p>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(answer)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setAnswerToDelete(answer)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-10 text-muted-foreground">
                            <HelpCircle className="mx-auto h-12 w-12" />
                            <h3 className="mt-4 text-lg font-semibold">No Answers Found</h3>
                            <p>Click "Add New Answer" to create the first one.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
