
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlusCircle, Edit, Trash2 } from "lucide-react";
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

// Mock data, would be fetched from an API in a real app
const initialInstructions = [
  { id: '1', text: 'Take with a full glass of water.' },
  { id: '2', text: 'Complete the full course of medication.' },
  { id: '3', text: 'May cause drowsiness. Do not operate heavy machinery.' },
  { id: '4', text: 'Avoid direct sunlight.' },
  { id: '5', text: 'Take 30 minutes before food.' },
  { id: '6', text: 'Finish all medication even if you feel better.' },
  { id: '7', text: 'None' },
];

export default function ManageInstructionsPage() {
    const router = useRouter();
    const [instructions, setInstructions] = useState(initialInstructions);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentInstruction, setCurrentInstruction] = useState<{ id: string; text: string } | null>(null);
    const [instructionText, setInstructionText] = useState('');

    const openDialog = (instruction: { id: string; text: string } | null = null) => {
        setCurrentInstruction(instruction);
        setInstructionText(instruction ? instruction.text : '');
        setIsDialogOpen(true);
    };

    const handleSave = () => {
        if (!instructionText.trim()) {
            toast({ variant: 'destructive', title: 'Instruction text cannot be empty.' });
            return;
        }

        if (currentInstruction) {
            // Edit existing
            setInstructions(instructions.map(i => i.id === currentInstruction.id ? { ...i, text: instructionText } : i));
            toast({ title: 'Instruction Updated' });
        } else {
            // Add new
            const newInstruction = { id: `new-${Date.now()}`, text: instructionText };
            setInstructions([...instructions, newInstruction]);
            toast({ title: 'Instruction Added' });
        }
        setIsDialogOpen(false);
    };
    
    const handleDelete = (id: string) => {
        setInstructions(instructions.filter(i => i.id !== id));
        toast({ title: 'Instruction Deleted' });
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentInstruction ? 'Edit' : 'Add'} Instruction</DialogTitle>
                        <DialogDescription>Enter the text for the counselling instruction.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label htmlFor="instruction-text">Instruction Text</Label>
                        <Input id="instruction-text" value={instructionText} onChange={(e) => setInstructionText(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleSave}>Save</Button>
                    </DialogFooter>
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
                    {instructions.map(instruction => (
                        <div key={instruction.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <p className="text-sm font-medium">{instruction.text}</p>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(instruction)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(instruction.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
