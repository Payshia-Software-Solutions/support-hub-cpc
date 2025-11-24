
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlusCircle, Edit, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { getShuffledInstructions } from '@/lib/actions/games';
import type { Instruction } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

// Mock mutations as API endpoints don't exist
const useInstructionMutations = () => {
    const queryClient = useQueryClient();

    const addInstruction = useMutation({
        mutationFn: async (text: string) => {
            await new Promise(resolve => setTimeout(resolve, 500));
            const newInstruction: Instruction = { id: `new-${Date.now()}`, instruction: text, pres_code: 'admin', cover_id: 'admin', content: '', created_at: new Date().toISOString() };
            return newInstruction;
        },
        onSuccess: (newInstruction) => {
            queryClient.setQueryData<Instruction[]>(['allInstructions'], (oldData) => [...(oldData || []), newInstruction]);
            toast({ title: 'Instruction Added' });
        }
    });

    const updateInstruction = useMutation({
        mutationFn: async (instruction: { id: string, text: string }) => {
            await new Promise(resolve => setTimeout(resolve, 500));
            return instruction;
        },
        onSuccess: (updated) => {
            queryClient.setQueryData<Instruction[]>(['allInstructions'], (oldData) => 
                oldData?.map(i => i.id === updated.id ? { ...i, instruction: updated.text } : i)
            );
            toast({ title: 'Instruction Updated' });
        }
    });

    const deleteInstruction = useMutation({
         mutationFn: async (id: string) => {
            await new Promise(resolve => setTimeout(resolve, 500));
            return id;
        },
        onSuccess: (id) => {
            queryClient.setQueryData<Instruction[]>(['allInstructions'], (oldData) => 
                oldData?.filter(i => i.id !== id)
            );
            toast({ title: 'Instruction Deleted' });
        }
    });

    return { addInstruction, updateInstruction, deleteInstruction };
};

const InstructionForm = ({ instruction, onSave, onClose, isSaving }: { instruction: Instruction | null; onSave: (text: string) => void; onClose: () => void; isSaving: boolean; }) => {
    const [instructionText, setInstructionText] = useState(instruction?.instruction || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!instructionText.trim()) {
            toast({ variant: 'destructive', title: 'Instruction text cannot be empty.' });
            return;
        }
        onSave(instructionText);
        onClose();
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
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentInstruction, setCurrentInstruction] = useState<Instruction | null>(null);

    const { data: instructions = [], isLoading, isError, error } = useQuery<Instruction[]>({
        queryKey: ['allInstructions'],
        queryFn: () => getShuffledInstructions('any', 'any'), // Using dummy params to fetch all
    });
    
    const { addInstruction, updateInstruction, deleteInstruction } = useInstructionMutations();

    const openDialog = (instruction: Instruction | null = null) => {
        setCurrentInstruction(instruction);
        setIsDialogOpen(true);
    };

    const handleSave = (text: string) => {
        if (currentInstruction) {
            updateInstruction.mutate({ id: currentInstruction.id, text });
        } else {
            addInstruction.mutate(text);
        }
    };
    
    const handleDelete = (id: string) => {
        deleteInstruction.mutate(id);
    }

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
                        isSaving={addInstruction.isPending || updateInstruction.isPending}
                    />
                </DialogContent>
            </Dialog>
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
                    {!isLoading && !isError && instructions.map(instruction => (
                        <div key={instruction.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <p className="text-sm font-medium">{instruction.instruction}</p>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(instruction)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(instruction.id)} disabled={deleteInstruction.isPending}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    ))}
                     {!isLoading && instructions.length === 0 && <p className="text-center text-muted-foreground py-8">No instructions found.</p>}
                </CardContent>
            </Card>
        </div>
    );
}
