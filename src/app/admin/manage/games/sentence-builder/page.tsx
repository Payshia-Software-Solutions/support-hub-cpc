
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlusCircle, Edit, Trash2, BookText, AlertTriangle, Loader2 } from "lucide-react";
import { gameLevels, type GameLevel } from '@/lib/sentence-builder-data';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';

const LevelForm = ({ level, onSave, onCancel }: { level?: GameLevel | null; onSave: (data: { pattern: string }) => void; onCancel: () => void; }) => {
    const [pattern, setPattern] = useState(level?.pattern || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!pattern) {
            toast({ variant: 'destructive', title: 'Pattern is required.' });
            return;
        }
        onSave({ pattern });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="pattern">Level Pattern</Label>
                <Input id="pattern" value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="e.g., S + V + O" />
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save Level</Button>
            </DialogFooter>
        </form>
    );
};


export default function ManageSentenceBuilderPage() {
    const router = useRouter();
    // In a real app, this would come from a useQuery hook.
    const [levels, setLevels] = useState<GameLevel[]>(gameLevels);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [levelToEdit, setLevelToEdit] = useState<GameLevel | null>(null);
    const [levelToDelete, setLevelToDelete] = useState<GameLevel | null>(null);
    
    const handleSaveLevel = (data: { pattern: string }) => {
        if (levelToEdit) {
            // Update existing level
            setLevels(prev => prev.map(l => l.level === levelToEdit.level ? { ...l, pattern: data.pattern } : l));
            toast({ title: 'Level Updated!' });
        } else {
            // Add new level
            const newLevelNumber = levels.length > 0 ? Math.max(...levels.map(l => l.level)) + 1 : 1;
            const newLevel: GameLevel = {
                level: newLevelNumber,
                pattern: data.pattern,
                sentences: [],
            };
            setLevels(prev => [...prev, newLevel]);
            toast({ title: 'Level Added!' });
        }
        closeForm();
    };

    const handleDeleteLevel = (levelNumber: number) => {
        setLevels(prev => prev.filter(l => l.level !== levelNumber));
        setLevelToDelete(null);
        toast({ title: 'Level Deleted' });
    };
    
    const openForm = (level: GameLevel | null = null) => {
        setLevelToEdit(level);
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setLevelToEdit(null);
    };

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{levelToEdit ? `Edit Level ${levelToEdit.level}` : 'Add New Level'}</DialogTitle>
                        <DialogDescription>
                            {levelToEdit ? `Update the pattern for this level.` : `Create a new level. You can add sentences after creating it.`}
                        </DialogDescription>
                    </DialogHeader>
                    <LevelForm level={levelToEdit} onSave={handleSaveLevel} onCancel={closeForm} />
                </DialogContent>
            </Dialog>

             <AlertDialog open={!!levelToDelete} onOpenChange={() => setLevelToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete Level {levelToDelete?.level} and all its sentences. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteLevel(levelToDelete!.level)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                 <div>
                    <Button variant="ghost" onClick={() => router.push('/admin/manage')} className="-ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Management
                    </Button>
                    <h1 className="text-3xl font-headline font-semibold mt-2">Manage Sentence Builder</h1>
                    <p className="text-muted-foreground">Configure levels and sentences for the game.</p>
                </div>
                <Button onClick={() => openForm()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Level
                </Button>
            </header>
            
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Game Levels</CardTitle>
                    <CardDescription>{levels.length} levels configured.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {levels.map(level => (
                        <div key={level.level} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                            <div className="font-medium">
                                <p>Level {level.level}: {level.pattern}</p>
                                <p className="text-xs text-muted-foreground">{level.sentences.length} sentences</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/admin/manage/games/sentence-builder/${level.level}`}>Manage Sentences</Link>
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openForm(level)}><Edit className="h-4 w-4"/></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setLevelToDelete(level)}><Trash2 className="h-4 w-4"/></Button>
                            </div>
                        </div>
                    ))}
                    {levels.length === 0 && (
                        <p className="text-center py-8 text-muted-foreground">No levels created yet. Click "Add New Level" to start.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

