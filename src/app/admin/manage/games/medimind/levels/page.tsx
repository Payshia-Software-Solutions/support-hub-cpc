
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, PlusCircle, Edit, Trash2, Loader2, Layers } from "lucide-react";

// --- Mock Data ---
interface GameLevel {
  id: string;
  name: string;
  description: string;
}

const dummyLevels: GameLevel[] = [
  { id: '1', name: 'Level 1: The Basics', description: 'Introduction to common analgesics and antibiotics.' },
  { id: '2', name: 'Level 2: Cardiovascular Care', description: 'Focuses on drugs for hypertension and cholesterol.' },
  { id: '3', name: 'Level 3: Allergy & Asthma', description: 'Covers antihistamines and bronchodilators.' },
];

// --- Form Schema ---
const levelFormSchema = z.object({
  name: z.string().min(5, 'Level name must be at least 5 characters.'),
  description: z.string().optional(),
});

type LevelFormValues = z.infer<typeof levelFormSchema>;

// --- Form Component ---
const LevelForm = ({ level, onSave, onClose, isSaving }: { level?: GameLevel | null; onSave: (data: LevelFormValues) => void; onClose: () => void; isSaving: boolean }) => {
    const { register, handleSubmit, formState: { errors } } = useForm<LevelFormValues>({
        resolver: zodResolver(levelFormSchema),
        defaultValues: {
            name: level?.name || '',
            description: level?.description || '',
        }
    });

    return (
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="level-name">Level Name</Label>
                <Input id="level-name" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="level-description">Description</Label>
                <Textarea id="level-description" {...register('description')} />
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Level
                </Button>
            </DialogFooter>
        </form>
    );
};

// --- Main Page Component ---
export default function ManageLevelsPage() {
    const router = useRouter();
    const [levels, setLevels] = useState<GameLevel[]>(dummyLevels);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState<GameLevel | null>(null);
    const [levelToDelete, setLevelToDelete] = useState<GameLevel | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleCreate = () => {
        setSelectedLevel(null);
        setIsFormOpen(true);
    };

    const handleEdit = (level: GameLevel) => {
        setSelectedLevel(level);
        setIsFormOpen(true);
    };

    const handleSave = (data: LevelFormValues) => {
        setIsSaving(true);
        setTimeout(() => { // Simulate async operation
            if (selectedLevel) {
                setLevels(prev => prev.map(l => l.id === selectedLevel.id ? { ...l, ...data } : l));
                toast({ title: "Level Updated" });
            } else {
                const newLevel: GameLevel = { id: String(Date.now()), ...data };
                setLevels(prev => [newLevel, ...prev]);
                toast({ title: "Level Created" });
            }
            setIsSaving(false);
            setIsFormOpen(false);
        }, 1000);
    };

    const handleDelete = () => {
        if (!levelToDelete) return;
        setIsSaving(true);
        setTimeout(() => {
            setLevels(prev => prev.filter(l => l.id !== levelToDelete.id));
            toast({ title: 'Level Deleted' });
            setLevelToDelete(null);
            setIsSaving(false);
        }, 500);
    };

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedLevel ? 'Edit' : 'Create'} Level</DialogTitle>
                        <DialogDescription>Fill in the details for the game level.</DialogDescription>
                    </DialogHeader>
                    <LevelForm level={selectedLevel} onClose={() => setIsFormOpen(false)} onSave={handleSave} isSaving={isSaving} />
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!levelToDelete} onOpenChange={() => setLevelToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete "{levelToDelete?.name}".</AlertDialogDescription>
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
                </CardHeader>
                <CardContent className="space-y-3">
                    {levels.length > 0 ? levels.map(level => (
                         <div key={level.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                                <p className="font-semibold">{level.name}</p>
                                <p className="text-sm text-muted-foreground">{level.description}</p>
                            </div>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(level)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setLevelToDelete(level)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-10 text-muted-foreground">
                            <Layers className="mx-auto h-12 w-12" />
                            <h3 className="mt-4 text-lg font-semibold">No Levels Found</h3>
                            <p>Click "Add New Level" to create the first one.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
