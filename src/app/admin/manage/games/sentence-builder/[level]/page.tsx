
"use client";

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlusCircle, Edit, Trash2, BookText, AlertTriangle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { getLevelById, getSentencesByLevel, createSentence, updateSentence, deleteSentence } from '@/lib/actions/sentence-builder';
import type { Sentence, GameLevel } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';

const SentenceForm = ({ sentence, onSave, onCancel, isSaving }: { sentence?: Sentence | null; onSave: (data: Omit<Sentence, 'id' | 'words'>) => void; onCancel: () => void; isSaving: boolean; }) => {
    const [correct_sentence, setCorrect] = useState(sentence?.correct_sentence || '');
    const [hint, setHint] = useState(sentence?.hint || '');
    const [translation, setTranslation] = useState(sentence?.translation || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!correct_sentence || !hint || !translation) {
            toast({ variant: 'destructive', title: 'All fields are required.' });
            return;
        }
        onSave({ correct_sentence, hint, translation, level_id: sentence?.level_id || 0 });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="correct">Correct Sentence</Label>
                <Input id="correct" value={correct_sentence} onChange={(e) => setCorrect(e.target.value)} placeholder="e.g., I eat apples" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="hint">Hint</Label>
                <Textarea id="hint" value={hint} onChange={(e) => setHint(e.target.value)} placeholder="e.g., Who does the action?"/>
            </div>
             <div className="space-y-2">
                <Label htmlFor="translation">Translation (Sinhala)</Label>
                <Input id="translation" value={translation} onChange={(e) => setTranslation(e.target.value)} />
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Save Sentence
                </Button>
            </DialogFooter>
        </form>
    );
};


export default function ManageSentencesPage() {
    const router = useRouter();
    const params = useParams();
    const levelId = parseInt(params.level as string, 10);
    const queryClient = useQueryClient();
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [sentenceToEdit, setSentenceToEdit] = useState<Sentence | null>(null);
    const [sentenceToDelete, setSentenceToDelete] = useState<Sentence | null>(null);
    
    const { data: level, isLoading: isLoadingLevel } = useQuery<GameLevel>({
        queryKey: ['sentenceBuilderLevel', levelId],
        queryFn: () => getLevelById(levelId),
        enabled: !!levelId,
    });

    const { data: sentences, isLoading: isLoadingSentences, isError, error } = useQuery<Sentence[]>({
        queryKey: ['sentencesForLevel', levelId],
        queryFn: () => getSentencesByLevel(levelId),
        enabled: !!levelId,
    });
    
    const saveMutation = useMutation({
        mutationFn: (data: Partial<Sentence> & { level_id: number }) => {
            if (data.id) {
                return updateSentence(data);
            }
            return createSentence(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sentencesForLevel', levelId] });
            toast({ title: sentenceToEdit ? 'Sentence Updated!' : 'Sentence Added!' });
            closeForm();
        },
        onError: (err: Error) => toast({ variant: "destructive", title: 'Save Failed', description: err.message }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteSentence,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sentencesForLevel', levelId] });
            toast({ title: 'Sentence Deleted' });
        },
        onError: (err: Error) => toast({ variant: "destructive", title: 'Delete Failed', description: err.message }),
        onSettled: () => setSentenceToDelete(null),
    });

    const handleSaveSentence = (data: Omit<Sentence, 'id' | 'words'>) => {
        if (sentenceToEdit) {
            saveMutation.mutate({ ...data, id: sentenceToEdit.id });
        } else {
            saveMutation.mutate({ ...data, level_id: levelId });
        }
    };

    const handleDeleteSentence = (sentenceId: number) => {
        deleteMutation.mutate(sentenceId);
    };

    const openForm = (sentence: Sentence | null = null) => {
        setSentenceToEdit(sentence);
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setSentenceToEdit(null);
    };
    
    if (isLoadingLevel) {
        return (
             <div className="p-4 md:p-8 space-y-6 pb-20 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
             </div>
        )
    }
    
    if (!level) {
        return (
             <div className="p-4 md:p-8 space-y-6 pb-20 text-center">
                <h1 className="text-xl font-bold">Level not found.</h1>
                <Button variant="outline" onClick={() => router.push('/admin/manage/games/sentence-builder')}>Back to Levels</Button>
             </div>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
             <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{sentenceToEdit ? 'Edit Sentence' : 'Add New Sentence'}</DialogTitle>
                        <DialogDescription>
                            The words for the game will be automatically generated from the correct sentence.
                        </DialogDescription>
                    </DialogHeader>
                    <SentenceForm sentence={sentenceToEdit} onSave={handleSaveSentence} onCancel={closeForm} isSaving={saveMutation.isPending} />
                </DialogContent>
            </Dialog>
            <AlertDialog open={!!sentenceToDelete} onOpenChange={() => setSentenceToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the sentence "{sentenceToDelete?.correct_sentence}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteSentence(sentenceToDelete!.id)} disabled={deleteMutation.isPending}>
                             {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                             Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                     <Button variant="ghost" onClick={() => router.push('/admin/manage/games/sentence-builder')} className="-ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Levels
                    </Button>
                    <h1 className="text-3xl font-headline font-semibold mt-2">Manage Sentences for Level {level.level_number}</h1>
                    <p className="text-muted-foreground">Pattern: {level.pattern}</p>
                </div>
                <Button onClick={() => openForm()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Sentence
                </Button>
            </header>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Sentence List</CardTitle>
                    <CardDescription>{isLoadingSentences ? "Loading..." : `${sentences?.length || 0} sentences in this level.`}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {isLoadingSentences && Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                    {isError && <p className="text-center text-destructive">{(error as Error).message}</p>}
                    {!isLoadingSentences && sentences?.map((sentence) => (
                        <div key={sentence.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                            <div className="font-medium">
                                <p>{sentence.correct_sentence}</p>
                                <p className="text-xs text-muted-foreground">Hint: {sentence.hint}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openForm(sentence)}><Edit className="h-4 w-4"/></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setSentenceToDelete(sentence)}><Trash2 className="h-4 w-4"/></Button>
                            </div>
                        </div>
                    ))}
                     {!isLoadingSentences && sentences?.length === 0 && (
                        <p className="text-center py-8 text-muted-foreground">No sentences created for this level yet.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
