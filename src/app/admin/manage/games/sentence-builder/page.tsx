
"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlusCircle, Edit, Trash2, BookText, AlertTriangle, Loader2 } from "lucide-react";
import { getLevels, createLevel, updateLevel, deleteLevel } from '@/lib/actions/sentence-builder';
import type { GameLevel } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

const LevelForm = ({ level, onSave, onCancel, isSaving }: { level?: GameLevel | null; onSave: (data: { level_number?: number; pattern: string }) => void; onCancel: () => void; isSaving: boolean; }) => {
    const [pattern, setPattern] = useState(level?.pattern || '');
    const [levelNumber, setLevelNumber] = useState(level?.level_number || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!pattern || (!level && !levelNumber)) {
            toast({ variant: 'destructive', title: 'Pattern and Level Number are required.' });
            return;
        }
        const numericLevel = Number(levelNumber);
        if(!level && (isNaN(numericLevel) || numericLevel <= 0)) {
            toast({ variant: 'destructive', title: 'Level Number must be a positive number.' });
            return;
        }
        onSave({ level_number: numericLevel, pattern });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             {!level && (
                <div className="space-y-2">
                    <Label htmlFor="level_number">Level Number</Label>
                    <Input id="level_number" type="number" value={levelNumber} onChange={(e) => setLevelNumber(e.target.value)} placeholder="e.g., 1" />
                </div>
            )}
            <div className="space-y-2">
                <Label htmlFor="pattern">Level Pattern</Label>
                <Input id="pattern" value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="e.g., S + V + O" />
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Save Level
                </Button>
            </DialogFooter>
        </form>
    );
};


export default function ManageSentenceBuilderPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [levelToEdit, setLevelToEdit] = useState<GameLevel | null>(null);
    const [levelToDelete, setLevelToDelete] = useState<GameLevel | null>(null);
    
    const { data: levels, isLoading, isError, error } = useQuery<GameLevel[]>({
        queryKey: ['sentenceBuilderLevels'],
        queryFn: getLevels
    });

    const sortedLevels = useMemo(() => {
        if (!levels) return [];
        return [...levels].sort((a, b) => a.level_number - b.level_number);
    }, [levels]);

    const saveMutation = useMutation({
        mutationFn: (data: { id?: number; level_number?: number, pattern: string }) => {
            if (data.id) {
                return updateLevel({ id: data.id, pattern: data.pattern });
            }
            return createLevel({ level_number: data.level_number!, pattern: data.pattern });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sentenceBuilderLevels'] });
            toast({ title: levelToEdit ? 'Level Updated!' : 'Level Added!' });
            closeForm();
        },
        onError: (err: Error) => toast({ variant: "destructive", title: 'Save Failed', description: err.message }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteLevel,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sentenceBuilderLevels'] });
            toast({ title: 'Level Deleted' });
        },
        onError: (err: Error) => toast({ variant: "destructive", title: 'Delete Failed', description: err.message }),
        onSettled: () => setLevelToDelete(null),
    });
    
    const handleSaveLevel = (data: { level_number?: number; pattern: string }) => {
        if (levelToEdit) {
            saveMutation.mutate({ id: levelToEdit.id, pattern: data.pattern });
        } else {
            saveMutation.mutate({ level_number: data.level_number, pattern: data.pattern });
        }
    };

    const handleDeleteLevel = (levelId: number) => {
        deleteMutation.mutate(levelId);
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
                        <DialogTitle>{levelToEdit ? `Edit Level ${levelToEdit.level_number}` : 'Add New Level'}</DialogTitle>
                        <DialogDescription>
                            {levelToEdit ? `Update the pattern for this level.` : `Create a new level. You can add sentences after creating it.`}
                        </DialogDescription>
                    </DialogHeader>
                    <LevelForm level={levelToEdit} onSave={handleSaveLevel} onCancel={closeForm} isSaving={saveMutation.isPending} />
                </DialogContent>
            </Dialog>

             <AlertDialog open={!!levelToDelete} onOpenChange={() => setLevelToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete Level {levelToDelete?.level_number} and all its sentences. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteLevel(levelToDelete!.id)} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Delete
                        </AlertDialogAction>
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
                    <CardDescription>{isLoading ? "Loading..." : `${sortedLevels?.length || 0} levels configured.`}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {isLoading && Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-32" /></div>
                            <div className="flex items-center gap-2"><Skeleton className="h-8 w-32" /><Skeleton className="h-8 w-8" /></div>
                        </div>
                    ))}
                    {isError && <p className="text-destructive text-center">{(error as Error).message}</p>}
                    {!isLoading && sortedLevels.map(level => (
                        <div key={level.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                            <div className="font-medium">
                                <p>Level {level.level_number}: {level.pattern}</p>
                                <p className="text-xs text-muted-foreground">{level.sentences?.length || 0} sentences</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/admin/manage/games/sentence-builder/${level.id}`}>Manage Sentences</Link>
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openForm(level)}><Edit className="h-4 w-4"/></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setLevelToDelete(level)}><Trash2 className="h-4 w-4"/></Button>
                            </div>
                        </div>
                    ))}
                    {!isLoading && sortedLevels.length === 0 && (
                        <p className="text-center py-8 text-muted-foreground">No levels created yet. Click "Add New Level" to start.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
