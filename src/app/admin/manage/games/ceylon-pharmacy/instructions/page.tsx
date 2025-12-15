
"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlusCircle, Edit, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { getAllCareInstructions, createCareInstruction, updateCareInstruction, deleteCareInstruction } from '@/lib/actions/games';
import type { Instruction } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const InstructionForm = ({ instruction, onSave, onClose, isSaving }: { instruction: Instruction | null; onSave: (text: string) => void; onClose: () => void; isSaving: boolean; }) => {
    const [instructionText, setInstructionText] = useState(instruction?.instruction || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!instructionText.trim()) {
            toast({ variant: 'destructive', title: 'Instruction text cannot be empty.' });
            return;
        }
        onSave(instructionText);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="py-4 space-y-2">
                <Label htmlFor="instruction-text">Instruction Text</Label>
                <Input id="instruction-text" value={instructionText} onChange={(e) => setInstructionText(e.target.value)} />
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline" disabled={isSaving}>Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Save
                </Button>
            </DialogFooter>
        </form>
    );
};

export default function ManageInstructionsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentInstruction, setCurrentInstruction] = useState<Instruction | null>(null);
    const [instructionToDelete, setInstructionToDelete] = useState<Instruction | null>(null);

    const { data: allInstructions = [], isLoading, isError, error } = useQuery<Instruction[]>({
        queryKey: ['allCareInstructions'],
        queryFn: getAllCareInstructions,
    });
    
    // Process the data to get unique instructions
    const uniqueInstructions = useMemo(() => {
        const seen = new Set<string>();
        return allInstructions.filter(instruction => {
            const lowercased = instruction.instruction.toLowerCase();
            if (seen.has(lowercased)) {
                return false;
            } else {
                seen.add(lowercased);
                return true;
            }
        }).sort((a,b) => a.instruction.localeCompare(b.instruction));
    }, [allInstructions]);

    const createMutation = useMutation({
        mutationFn: createCareInstruction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allCareInstructions'] });
            toast({ title: 'Instruction Added' });
            setIsDialogOpen(false);
        },
        onError: (err: Error) => {
            toast({ variant: 'destructive', title: 'Create Failed', description: err.message });
        }
    });

    const updateMutation = useMutation({
        mutationFn: updateCareInstruction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allCareInstructions'] });
            toast({ title: 'Instruction Updated' });
            setIsDialogOpen(false);
        },
        onError: (err: Error) => {
            toast({ variant: 'destructive', title: 'Update Failed', description: err.message });
        }
    });

     const deleteMutation = useMutation({
        mutationFn: deleteCareInstruction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allCareInstructions'] });
            toast({ title: 'Instruction Deleted' });
        },
        onError: (err: Error) => {
            toast({ variant: 'destructive', title: 'Delete Failed', description: err.message });
        },
        onSettled: () => {
            setInstructionToDelete(null);
        }
    });


    const openDialog = (instruction: Instruction | null = null) => {
        setCurrentInstruction(instruction);
        setIsDialogOpen(true);
    };

    const handleSave = (text: string) => {
        if (!user?.username) {
            toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
            return;
        }

        if (currentInstruction) {
            updateMutation.mutate({ id: currentInstruction.id, instruction: text });
        } else {
            createMutation.mutate({ instruction: text, created_by: user.username });
        }
    };
    
    const handleDelete = (instruction: Instruction) => {
        setInstructionToDelete(instruction);
    };

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentInstruction ? 'Edit' : 'Add'} Instruction</DialogTitle>
                        <DialogDescription>Enter the text for the counselling instruction.</DialogDescription>
                    </DialogHeader>
                    <InstructionForm
                        instruction={currentInstruction}
                        onSave={handleSave}
                        onClose={() => setIsDialogOpen(false)}
                        isSaving={createMutation.isPending || updateMutation.isPending}
                    />
                </DialogContent>
            </Dialog>
            <AlertDialog open={!!instructionToDelete} onOpenChange={() => setInstructionToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will permanently delete the instruction "{instructionToDelete?.instruction}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteMutation.mutate(instructionToDelete!.id)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <Button variant="ghost" onClick={() => router.push('/admin/manage/games/ceylon-pharmacy')} className="-ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Game Setup
                    </Button>
                    <h1 className="text-3xl font-headline font-semibold mt-2">Manage Instructions</h1>
                    <p className="text-muted-foreground">Add, edit, or delete the counselling instructions available in the game.</p>
                </div>
                <Button onClick={() => openDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Instruction
                </Button>
            </header>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Instruction List</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {isLoading && [...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                            <Skeleton className="h-4 w-3/4" />
                            <div className="flex gap-1"><Skeleton className="h-8 w-8"/><Skeleton className="h-8 w-8"/></div>
                        </div>
                    ))}
                    {isError && <div className="text-destructive"><AlertTriangle className="inline-block mr-2" />Error: {(error as Error).message}</div>}
                    {!isLoading && !isError && uniqueInstructions.map(instruction => (
                        <div key={instruction.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <p className="text-sm font-medium">{instruction.instruction}</p>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(instruction)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(instruction)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    ))}
                     {!isLoading && uniqueInstructions.length === 0 && <p className="text-center text-muted-foreground py-8">No instructions found.</p>}
                </CardContent>
            </Card>
        </div>
    );
}
