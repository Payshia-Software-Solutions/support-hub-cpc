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
import { ArrowLeft, PlusCircle, Edit, Trash2, Loader2, Layers, ArrowRight, AlertTriangle, Calendar } from "lucide-react";
import Link from 'next/link';
import { getMediMindLevels, createMediMindLevel, updateMediMindLevel, deleteMediMindLevel } from '@/lib/actions/games';
import type { MediMindLevel } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

// --- Form Schema ---
const levelFormSchema = z.object({
  level_name: z.string().min(3, 'Level name must be at least 3 characters.'),
});

type LevelFormValues = z.infer<typeof levelFormSchema>;

// --- Form Component ---
const LevelForm = ({ level, onSave, onClose, isSaving }: { level?: MediMindLevel | null; onSave: (data: LevelFormValues) => void; onClose: () => void; isSaving: boolean }) => {
    const { register, handleSubmit, formState: { errors } } = useForm<LevelFormValues>({
        resolver: zodResolver(levelFormSchema),
        defaultValues: {
            level_name: level?.level_name || '',
        }
    });

    return (
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="level_name">Level Name</Label>
                <Input id="level_name" {...register('level_name')} placeholder="e.g. Intermediate" />
                {errors.level_name && <p className="text-sm text-destructive">{errors.level_name.message}</p>}
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {level ? 'Save Changes' : 'Create Level'}
                </Button>
            </DialogFooter>
        </form>
    );
};

// --- Main Page Component ---
export default function ManageLevelsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState<MediMindLevel | null>(null);
    const [levelToDelete, setLevelToDelete] = useState<MediMindLevel | null>(null);

    const { data: levels = [], isLoading, isError, error } = useQuery<MediMindLevel[]>({
        queryKey: ['mediMindLevels'],
        queryFn: getMediMindLevels,
    });

    const createMutation = useMutation({
        mutationFn: createMediMindLevel,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mediMindLevels'] });
            toast({ title: "Level Created", description: "The new level has been added to the game." });
            setIsFormOpen(false);
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Create Failed', description: err.message }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: LevelFormValues }) => updateMediMindLevel(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mediMindLevels'] });
            toast({ title: "Level Updated", description: "The level details have been updated." });
            setIsFormOpen(false);
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Update Failed', description: err.message }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteMediMindLevel,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mediMindLevels'] });
            toast({ title: "Level Deleted" });
            setLevelToDelete(null);
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Delete Failed', description: err.message }),
    });

    const handleCreate = () => {
        setSelectedLevel(null);
        setIsFormOpen(true);
    };

    const handleEdit = (level: MediMindLevel) => {
        setSelectedLevel(level);
        setIsFormOpen(true);
    };

    const handleSave = (data: LevelFormValues) => {
        if (selectedLevel) {
            updateMutation.mutate({ id: selectedLevel.id, data });
        } else {
            createMutation.mutate({ 
                level_name: data.level_name, 
                created_by: user?.username || 'admin_user' 
            });
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedLevel ? 'Edit' : 'Create'} Level</DialogTitle>
                        <DialogDescription>
                            Define a new level for the MediMind game challenge.
                        </DialogDescription>
                    </DialogHeader>
                    <LevelForm 
                        level={selectedLevel} 
                        onClose={() => setIsFormOpen(false)} 
                        onSave={handleSave} 
                        isSaving={createMutation.isPending || updateMutation.isPending} 
                    />
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!levelToDelete} onOpenChange={() => setLevelToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the level "{levelToDelete?.level_name}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => deleteMutation.mutate(levelToDelete!.id)} 
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
                    <h1 className="text-3xl font-headline font-semibold mt-2">Manage Game Levels</h1>
                    <p className="text-muted-foreground">Define the different levels players will progress through.</p>
                </div>
                 <Button onClick={handleCreate}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Level
                </Button>
            </header>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Level List</CardTitle>
                    <CardDescription>{isLoading ? "Loading levels..." : `${levels.length} levels configured.`}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {isLoading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse bg-muted/50">
                                <Skeleton className="h-5 w-48" />
                                <div className="flex gap-2"><Skeleton className="h-8 w-24" /><Skeleton className="h-8 w-8" /></div>
                            </div>
                        ))
                    ) : isError ? (
                        <div className="p-8 text-center text-destructive flex flex-col items-center">
                            <AlertTriangle className="h-10 w-10 mb-2" />
                            <p className="font-semibold">Error Loading Levels</p>
                            <p className="text-sm">{(error as Error).message}</p>
                        </div>
                    ) : levels.length > 0 ? (
                        levels.map(level => (
                         <div key={level.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-md bg-primary/10">
                                    <Layers className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold text-card-foreground">{level.level_name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Author: {level.created_by}</p>
                                        <span className="text-[10px] text-muted-foreground">•</span>
                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-2.5 w-2.5" />
                                            {format(new Date(level.created_at), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(level)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/admin/manage/games/medimind/levels/${level.id}`}>
                                        Configure <ArrowRight className="ml-2 h-4 w-4"/>
                                    </Link>
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setLevelToDelete(level)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    ))
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            <Layers className="mx-auto h-12 w-12 opacity-20" />
                            <h3 className="mt-4 text-lg font-semibold">No Levels Found</h3>
                            <p>Click "Add New Level" to create the first one.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
