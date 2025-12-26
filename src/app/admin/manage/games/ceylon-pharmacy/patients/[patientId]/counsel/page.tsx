
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Save, Loader2, MessageSquare, Check } from "lucide-react";
import { toast } from '@/hooks/use-toast';
import { getPrescriptionDetails, getAllCareInstructions, getCorrectInstructions, saveCounsellingInstructionsForDrug } from '@/lib/actions/games';
import type { PrescriptionDetail, Instruction } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';


const InstructionSelectionDialog = ({
    selectedIds,
    onSelectionChange,
    trigger
}: {
    selectedIds: string[],
    onSelectionChange: (newIds: string[]) => void,
    trigger: React.ReactNode,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentSelectedIds, setCurrentSelectedIds] = useState(selectedIds);

    const { data: allInstructions = [], isLoading } = useQuery<Instruction[]>({
        queryKey: ['allCareInstructions'],
        queryFn: getAllCareInstructions,
    });
    
    useEffect(() => {
        if(isOpen) {
            setCurrentSelectedIds(selectedIds);
        }
    }, [isOpen, selectedIds]);

    const uniqueInstructions = useMemo(() => {
        const seen = new Set<string>();
        return allInstructions.filter(instruction => {
            const lowercased = instruction.instruction.toLowerCase();
            if (seen.has(lowercased) || !instruction.instruction) {
                return false;
            }
            seen.add(lowercased);
            return true;
        }).sort((a,b) => parseInt(a.id, 10) - parseInt(b.id, 10)); // Sort by ID numerically
    }, [allInstructions]);

    const filteredInstructions = useMemo(() => {
        if (!searchTerm) return uniqueInstructions;
        return uniqueInstructions.filter(inst => inst.instruction.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [uniqueInstructions, searchTerm]);

    const handleToggle = (instructionId: string) => {
        setCurrentSelectedIds(prev =>
            prev.includes(instructionId) ? prev.filter(id => id !== instructionId) : [...prev, instructionId]
        );
    };

    const handleConfirm = () => {
        onSelectionChange(currentSelectedIds);
        setIsOpen(false);
    };

    return (
         <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Select Counselling Instructions</DialogTitle>
                     <div className="relative pt-2">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
                        <Input placeholder="Search instructions..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </DialogHeader>
                <ScrollArea className="max-h-[50vh] pr-4 -mr-4">
                    <div className="space-y-2">
                        {isLoading ? (
                            <p>Loading instructions...</p>
                        ) : (
                            filteredInstructions.map(inst => (
                                <div key={inst.id} className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50">
                                    <Checkbox
                                        id={`dialog-inst-${inst.id}`}
                                        checked={currentSelectedIds.includes(inst.id)}
                                        onCheckedChange={() => handleToggle(inst.id)}
                                        className="mt-1"
                                    />
                                    <Label htmlFor={`dialog-inst-${inst.id}`} className="text-sm font-normal w-full cursor-pointer">
                                        <span className="font-mono text-xs text-muted-foreground mr-2">[ID: {inst.id}]</span>
                                        {inst.instruction}
                                    </Label>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirm}>Confirm Selection</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const DrugCounselingCard = ({ drug, patientId }: { drug: PrescriptionDetail, patientId: string }) => {
    const queryClient = useQueryClient();
    
    const { data: correctInstructions, isLoading: isLoadingCorrect } = useQuery<Instruction[]>({
        queryKey: ['correctInstructions', patientId, drug.cover_id],
        queryFn: () => getCorrectInstructions(patientId, drug.cover_id),
    });

    const [selectedInstructionIds, setSelectedInstructionIds] = useState<string[]>([]);

    useEffect(() => {
        if (correctInstructions) {
            // The content property from this endpoint is the actual instruction ID from the master list
            setSelectedInstructionIds(correctInstructions.map(i => i.content));
        }
    }, [correctInstructions]);

    const { data: allInstructions = [] } = useQuery<Instruction[]>({
        queryKey: ['allCareInstructions'],
        queryFn: getAllCareInstructions,
    });
    
    const instructionMap = useMemo(() => {
        return allInstructions.reduce((map, inst) => {
            map.set(inst.id, inst.instruction);
            return map;
        }, new Map<string, string>());
    }, [allInstructions]);

    const saveMutation = useMutation({
        mutationFn: (instructionIds: string[]) => {
            const numericIds = instructionIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
            return saveCounsellingInstructionsForDrug({
                pres_code: patientId,
                cover_id: drug.cover_id,
                instructions: numericIds,
            });
        },
        onSuccess: (savedData) => {
            toast({ title: 'Success!', description: 'Counselling instructions saved.'});
            queryClient.invalidateQueries({queryKey: ['correctInstructions', patientId, drug.cover_id]});
        },
        onError: (err: Error) => {
             toast({ variant: 'destructive', title: 'Save Error', description: err.message});
        }
    })

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{drug.content}</CardTitle>
                <CardDescription>Cover ID: {drug.cover_id}</CardDescription>
            </CardHeader>
            <CardContent>
                <InstructionSelectionDialog
                    selectedIds={selectedInstructionIds}
                    onSelectionChange={setSelectedInstructionIds}
                    trigger={
                         <div className="space-y-2 cursor-pointer group">
                            <Label>Correct Instructions</Label>
                             <div className="w-full justify-start text-left font-normal h-auto min-h-10 p-2 border rounded-md group-hover:bg-muted/50 transition-colors">
                                {isLoadingCorrect ? <Loader2 className="h-4 w-4 animate-spin"/> : (
                                    selectedInstructionIds.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {selectedInstructionIds.map(id => (
                                                <Badge key={id} variant="secondary">{instructionMap.get(id) || 'Unknown ID'}</Badge>
                                            ))}
                                        </div>
                                    ) : <span className="text-muted-foreground">Select instructions...</span>
                                )}
                            </div>
                        </div>
                    }
                />
            </CardContent>
            <CardFooter>
                 <Button onClick={() => saveMutation.mutate(selectedInstructionIds)} disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Instructions for this Drug
                </Button>
            </CardFooter>
        </Card>
    );
};


export default function ManageCounselingPage() {
    const router = useRouter();
    const params = useParams();
    const patientId = params.patientId as string;

    const { data: prescriptionDetails, isLoading, isError, error } = useQuery<PrescriptionDetail[]>({
        queryKey: ['prescriptionDetails', patientId],
        queryFn: () => getPrescriptionDetails(patientId),
        enabled: !!patientId,
    });

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <Button variant="ghost" onClick={() => router.back()} className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patient Hub
                </Button>
                <h1 className="text-3xl font-headline font-semibold mt-2">Manage Patient Counselling</h1>
                <p className="text-muted-foreground">Assign the correct counselling instructions for each prescribed medication.</p>
            </header>

             <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Drugs & Instructions</CardTitle>
                    <CardDescription>Set the correct instructions for each drug below.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && <p>Loading drugs...</p>}
                    {isError && <p className="text-destructive">Error: {(error as Error).message}</p>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {prescriptionDetails?.map(drug => (
                            <DrugCounselingCard key={drug.cover_id} drug={drug} patientId={patientId} />
                        ))}
                    </div>
                </CardContent>
             </Card>
        </div>
    );
}
