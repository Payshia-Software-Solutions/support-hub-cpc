
"use client";

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';

// --- Mock Data for Instructions ---
// In a real app, this would come from an API based on the patient/prescription
const allInstructions = [
  { id: '1', text: 'Take with a full glass of water.' },
  { id: '2', text: 'Complete the full course of medication.' },
  { id: '3', text: 'May cause drowsiness. Do not operate heavy machinery.' },
  { id: '4', text: 'Avoid direct sunlight.' },
  { id: '5', text: 'Take 30 minutes before food.' },
  { id: '6', text: 'Finish all medication even if you feel better.' },
  { id: '7', text: 'None' },
];

const REQUIRED_INSTRUCTIONS = 1;

export default function CounselPage() {
    const router = useRouter();
    const params = useParams();
    const patientId = params.id as string;

    const [selectedInstructionId, setSelectedInstructionId] = useState<string>('');
    const [givenInstructions, setGivenInstructions] = useState<{ id: string; text: string }[]>([]);

    const handleAddInstruction = () => {
        if (!selectedInstructionId) {
            toast({ variant: 'destructive', title: 'No instruction selected' });
            return;
        }

        const instructionToAdd = allInstructions.find(i => i.id === selectedInstructionId);
        if (!instructionToAdd) {
            toast({ variant: 'destructive', title: 'Invalid instruction' });
            return;
        }
        
        if (givenInstructions.some(i => i.id === instructionToAdd.id)) {
            toast({ variant: 'destructive', title: 'Instruction already added' });
            return;
        }
        
        // If "None" is selected, clear others. If others are selected, clear "None".
        if (instructionToAdd.text === 'None') {
            setGivenInstructions([instructionToAdd]);
        } else {
             setGivenInstructions(prev => [...prev.filter(i => i.text !== 'None'), instructionToAdd]);
        }

        setSelectedInstructionId(''); // Reset dropdown
    };

    const handleRemoveInstruction = (instructionId: string) => {
        setGivenInstructions(prev => prev.filter(i => i.id !== instructionId));
    };

    const handleClear = () => {
        setGivenInstructions([]);
    };

    const handleSave = () => {
        if (givenInstructions.length < REQUIRED_INSTRUCTIONS) {
             toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: `You must provide at least ${REQUIRED_INSTRUCTIONS} instruction(s).`,
            });
            return;
        }
        
        // In a real app, this would be a mutation to save the data
        console.log("Saving instructions for patient:", patientId, givenInstructions);
        toast({
            title: 'Instructions Saved!',
            description: 'The patient counselling information has been recorded.',
        });
        // On success, navigate back to the patient hub
        router.push(`/dashboard/ceylon-pharmacy/${patientId}`);
    };

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
             <header>
                <Button onClick={() => router.back()} variant="ghost" className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patient Hub
                </Button>
            </header>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Task 2: Patient Counselling</CardTitle>
                    <CardDescription>Select the correct instructions to provide to the patient based on their prescription.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {givenInstructions.length < REQUIRED_INSTRUCTIONS && (
                        <Alert variant="destructive" className="bg-yellow-100 border-yellow-300 text-yellow-800">
                            <AlertCircle className="h-4 w-4 !text-yellow-800" />
                            <AlertTitle className="font-semibold">Attention</AlertTitle>
                            <AlertDescription>
                                {REQUIRED_INSTRUCTIONS} Instruction(s) must be given!
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-grow space-y-2">
                            <label className="text-sm font-medium">Choice Instruction</label>
                             <Select value={selectedInstructionId} onValueChange={setSelectedInstructionId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an instruction..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {allInstructions.map(instruction => (
                                        <SelectItem key={instruction.id} value={instruction.id}>
                                            {instruction.id} - {instruction.text}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="self-end">
                            <Button onClick={handleAddInstruction} className="w-full sm:w-auto">
                                <Plus className="mr-2 h-4 w-4" /> Add
                            </Button>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-medium mb-2">Given Instructions</h4>
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px]">ID</TableHead>
                                        <TableHead>Instruction</TableHead>
                                        <TableHead className="text-right w-[100px]">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {givenInstructions.length > 0 ? (
                                        givenInstructions.map((inst, index) => (
                                            <TableRow key={inst.id}>
                                                <TableCell className="font-medium">{index + 1}</TableCell>
                                                <TableCell>{inst.text}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="text-destructive hover:text-destructive h-8 w-8"
                                                        onClick={() => handleRemoveInstruction(inst.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                                No instructions have been added yet.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleClear}>
                        <Trash2 className="mr-2 h-4 w-4" /> Clear
                    </Button>
                    <Button onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" /> Save Instructions
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
