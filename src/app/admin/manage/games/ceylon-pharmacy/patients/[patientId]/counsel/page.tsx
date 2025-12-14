
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Save, Loader2, MessageSquare, Check } from "lucide-react";
import { toast } from '@/hooks/use-toast';
import { getPrescriptionDetails, getAllCareInstructions, getCorrectInstructions, saveCounsellingAnswer } from '@/lib/actions/games';
import type { PrescriptionDetail, Instruction, SaveCounselingAnswerPayload } from '@/lib/types';
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
        }).sort((a,b) => a.instruction.localeCompare(b.instruction));
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
                                <div key={inst.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50">
                                    <Checkbox
                                        id={`dialog-inst-${inst.id}`}
                                        checked={currentSelectedIds.includes(inst.id)}
                                        onCheckedChange={() => handleToggle(inst.id)}
                                    />
                                    <Label htmlFor={`dialog-inst-${inst.id}`} className="text-sm font-normal w-full cursor-pointer">{inst.instruction}</Label>
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
    const { user } = useAuth();
    
    const { data: correctInstructions } = useQuery<Instruction[]>({
        queryKey: ['correctInstructions', patientId, drug.cover_id],
        queryFn: () => getCorrectInstructions(patientId, drug.cover_id),
    });

    const [selectedInstructionIds, setSelectedInstructionIds] = useState<string[]>([]);

    useEffect(() => {
        if (correctInstructions) {
            setSelectedInstructionIds(correctInstructions.map(i => i.id));
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
        mutationFn: async (instructionIds: string[]) => {
            if (!user) throw new Error("Not authenticated");
            // Here you might want to clear old answers before saving new ones if the API supports it.
            // For now, we just save the new set.
            const promises = instructionIds.map(id => 
                saveCounsellingAnswer({
                    LoggedUser: user.username!,
                    PresCode: patientId,
                    CoverCode: drug.cover_id,
                    Instruction: id,
                    ans_status: 'Correct'
                })
            );
            return Promise.all(promises);
        },
        onSuccess: () => {
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
                        <div className="space-y-2">
                            <Label>Correct Instructions</Label>
                            <Button type="button" variant="outline" className="w-full justify-start text-left font-normal h-auto min-h-10">
                                {selectedInstructionIds.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                        {selectedInstructionIds.map(id => (
                                            <Badge key={id} variant="secondary">{instructionMap.get(id) || 'Unknown'}</Badge>
                                        ))}
                                    </div>
                                ) : "Select instructions..."}
                            </Button>
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
                <CardContent className="space-y-4">
                    {isLoading && <p>Loading drugs...</p>}
                    {isError && <p className="text-destructive">Error: {(error as Error).message}</p>}
                    {prescriptionDetails?.map(drug => (
                        <DrugCounselingCard key={drug.cover_id} drug={drug} patientId={patientId} />
                    ))}
                </CardContent>
             </Card>
        </div>
    );
}
