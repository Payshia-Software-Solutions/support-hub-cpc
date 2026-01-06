
"use client";

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlusCircle, Edit, Trash2 } from "lucide-react";
import { gameLevels, type GameLevel, type Sentence } from '@/lib/sentence-builder-data';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

const SentenceForm = ({ sentence, onSave, onCancel }: { sentence?: Sentence | null; onSave: (data: Omit<Sentence, 'words'>) => void; onCancel: () => void; }) => {
    const [correct, setCorrect] = useState(sentence?.correct || '');
    const [hint, setHint] = useState(sentence?.hint || '');
    const [translation, setTranslation] = useState(sentence?.translation || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!correct || !hint || !translation) {
            toast({ variant: 'destructive', title: 'All fields are required.' });
            return;
        }
        onSave({ correct, hint, translation });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="correct">Correct Sentence</Label>
                <Input id="correct" value={correct} onChange={(e) => setCorrect(e.target.value)} placeholder="e.g., I eat apples" />
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
                <Button type="submit">Save Sentence</Button>
            </DialogFooter>
        </form>
    );
};


export default function ManageSentencesPage() {
    const router = useRouter();
    const params = useParams();
    const levelNumber = parseInt(params.level as string, 10);
    
    // In a real app, this would come from a useQuery hook.
    const [level, setLevel] = useState<GameLevel | undefined>(() => gameLevels.find(l => l.level === levelNumber));
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [sentenceToEdit, setSentenceToEdit] = useState<Sentence | null>(null);
    const [sentenceToDelete, setSentenceToDelete] = useState<Sentence | null>(null);
    
    const handleSaveSentence = (data: Omit<Sentence, 'words'>) => {
        if (!level) return;

        let updatedSentences;
        if (sentenceToEdit) {
            // Update existing sentence
            updatedSentences = level.sentences.map(s => 
                s.correct === sentenceToEdit.correct ? { ...data, words: data.correct.split(' ') } : s
            );
            toast({ title: 'Sentence Updated!' });
        } else {
            // Add new sentence
            const newSentence = { ...data, words: data.correct.split(' ') };
            updatedSentences = [...level.sentences, newSentence];
            toast({ title: 'Sentence Added!' });
        }
        
        setLevel({ ...level, sentences: updatedSentences });
        closeForm();
    };

    const handleDeleteSentence = (correctSentence: string) => {
        if (!level) return;
        setLevel(prev => prev ? { ...prev, sentences: prev.sentences.filter(s => s.correct !== correctSentence) } : undefined);
        setSentenceToDelete(null);
        toast({ title: 'Sentence Deleted' });
    };

    const openForm = (sentence: Sentence | null = null) => {
        setSentenceToEdit(sentence);
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setSentenceToEdit(null);
    };
    
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
                    <SentenceForm sentence={sentenceToEdit} onSave={handleSaveSentence} onCancel={closeForm} />
                </DialogContent>
            </Dialog>
            <AlertDialog open={!!sentenceToDelete} onOpenChange={() => setSentenceToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the sentence "{sentenceToDelete?.correct}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteSentence(sentenceToDelete!.correct)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                     <Button variant="ghost" onClick={() => router.push('/admin/manage/games/sentence-builder')} className="-ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Levels
                    </Button>
                    <h1 className="text-3xl font-headline font-semibold mt-2">Manage Sentences for Level {level.level}</h1>
                    <p className="text-muted-foreground">Pattern: {level.pattern}</p>
                </div>
                <Button onClick={() => openForm()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Sentence
                </Button>
            </header>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Sentence List</CardTitle>
                    <CardDescription>{level.sentences.length} sentences in this level.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {level.sentences.map((sentence, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                            <div className="font-medium">
                                <p>{sentence.correct}</p>
                                <p className="text-xs text-muted-foreground">Hint: {sentence.hint}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openForm(sentence)}><Edit className="h-4 w-4"/></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setSentenceToDelete(sentence)}><Trash2 className="h-4 w-4"/></Button>
                            </div>
                        </div>
                    ))}
                     {level.sentences.length === 0 && (
                        <p className="text-center py-8 text-muted-foreground">No sentences created for this level yet.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

