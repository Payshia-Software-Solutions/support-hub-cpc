

"use client";

import { useState, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Trash2, Save, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getShuffledInstructions, getCorrectInstructions, saveCounsellingAnswer } from '@/lib/actions/games';
import type { Instruction, SaveCounselingAnswerPayload } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

const REQUIRED_INSTRUCTIONS = 1;

export default function CounselPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const patientId = params.id as string; // This is the pres_code
    const coverId = searchParams.get('drug');
    const isMobile = useIsMobile();
    const queryClient = useQueryClient();

    const [givenInstructions, setGivenInstructions] = useState<Instruction[]>([]);
    const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);

    const { data: allInstructions, isLoading, isError, error } = useQuery<Instruction[]>({
        queryKey: ['shuffledInstructions', patientId, coverId],
        queryFn: () => getShuffledInstructions(patientId, coverId!),
        enabled: !!patientId && !!coverId,
    });
    
    const { data: correctInstructions, isLoading: isLoadingCorrect } = useQuery<Instruction[]>({
        queryKey: ['correctInstructions', patientId, coverId],
        queryFn: () => getCorrectInstructions(patientId, coverId!),
        enabled: !!patientId && !!coverId,
    });
    
    const saveAnswersMutation = useMutation({
        mutationFn: (payload: SaveCounselingAnswerPayload) => saveCounsellingAnswer(payload),
        onError: (error: Error, variables) => {
            toast({
                variant: 'destructive',
                title: 'Submission Error',
                description: `Failed to save instruction for ${variables.CoverCode}.`,
            });
        }
    });

    const validationMutation = useMutation({
        mutationFn: async () => {
            if (!correctInstructions) {
                throw new Error("Correct answers not loaded yet.");
            }
            await new Promise(resolve => setTimeout(resolve, 500));

            const givenIds = new Set(givenInstructions.map(i => i.id));
            const correctIds = new Set(correctInstructions.map(i => i.id));

            if (givenIds.size !== correctIds.size) {
                return false;
            }

            for (const id of givenIds) {
                if (!correctIds.has(id)) {
                    return false;
                }
            }
            return true;
        },
        onSuccess: (isCorrect) => {
            setIsAnswerCorrect(isCorrect);
            if (isCorrect) {
                if (!user || !patientId || !coverId) {
                    toast({ variant: "destructive", title: "Error", description: "Missing user or context information." });
                    return;
                }

                const submissionPromises = givenInstructions.map(instruction => {
                    const payload: SaveCounselingAnswerPayload = {
                        LoggedUser: user.username!,
                        PresCode: patientId,
                        Instruction: instruction.id,
                        CoverCode: coverId,
                        ans_status: 'correct'
                    };
                    return saveAnswersMutation.mutateAsync(payload);
                });
                
                Promise.all(submissionPromises).then(() => {
                    toast({
                        title: 'Instructions Saved!',
                        description: 'The patient counselling information is correct and has been saved.',
                    });
                    // In a real app, you might navigate away or show a completion screen
                    router.push(`/dashboard/ceylon-pharmacy/${patientId}`);
                }).catch(() => {
                    // Errors are handled in the mutation's onError
                });

            } else {
                toast({
                    variant: 'destructive',
                    title: 'Incorrect Instructions',
                    description: 'The selected instructions are not correct. Please try again.',
                });
            }
        },
        onError: (error: Error) => {
             toast({
                variant: "destructive",
                title: 'Validation Error',
                description: error.message,
            });
        }
    });

    const handleSelectInstruction = (instruction: Instruction) => {
        if (givenInstructions.some(i => i.id === instruction.id)) {
            toast({ variant: 'destructive', title: 'Instruction already added' });
            return;
        }

        if (instruction.instruction.toLowerCase() === 'none') {
            setGivenInstructions([instruction]);
        } else {
            setGivenInstructions(prev => [...prev.filter(i => i.instruction.toLowerCase() !== 'none'), instruction]);
        }
    };

    const handleRemoveInstruction = (instructionId: string) => {
        setGivenInstructions(prev => prev.filter(i => i.id !== instructionId));
    };

    const handleSave = () => {
        if (givenInstructions.length < 1) {
             toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: `You must provide at least one instruction. Select 'None' if applicable.`,
            });
            return;
        }
        validationMutation.mutate();
    };
    
    const availableInstructions = allInstructions?.filter(
      (inst) => !givenInstructions.some((given) => given.id === inst.id)
    ) || [];
    
    const renderInstructionList = (instructions: Instruction[], isAvailableList: boolean) => (
        <div className="space-y-2">
            {instructions.map(instruction => (
                isAvailableList ? (
                    <Button
                        key={instruction.id}
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-2 whitespace-normal break-words"
                        onClick={() => handleSelectInstruction(instruction)}
                    >
                        <Plus className="mr-2 h-4 w-4 text-primary shrink-0" />
                        {instruction.instruction}
                    </Button>
                ) : (
                    <div key={instruction.id} className="flex items-center justify-between p-2 pl-3 rounded-md bg-background border animate-in fade-in-50">
                        <p className="text-sm font-medium">{instruction.instruction}</p>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive h-7 w-7"
                            onClick={() => handleRemoveInstruction(instruction.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )
            ))}
        </div>
    );

    const availableInstructionsPanel = (
        <div className="space-y-3">
            {!isMobile && <h3 className="font-semibold text-card-foreground">Available Instructions</h3>}
            <Card className="p-3 bg-muted/50 min-h-[200px]">
                {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : isError ? (
                     <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error.message}</AlertDescription></Alert>
                ) : availableInstructions.length === 0 && givenInstructions.length > 0 ? (
                     <div className="flex items-center justify-center h-full min-h-[150px] text-muted-foreground text-center text-sm">
                        <p>All available instructions have been selected.</p>
                    </div>
                ) : (
                    renderInstructionList(availableInstructions, true)
                )}
            </Card>
        </div>
    );
    
    const givenInstructionsPanel = (
         <div className="space-y-3">
             {!isMobile && <h3 className="font-semibold text-card-foreground">Given Instructions</h3>}
            <Card className="p-3 bg-muted/50 min-h-[200px]">
                {givenInstructions.length > 0 ? (
                    renderInstructionList(givenInstructions, false)
                ) : (
                    <div className="flex items-center justify-center h-full min-h-[150px] text-muted-foreground text-center text-sm">
                        <p>Click on an instruction to add it here.</p>
                    </div>
                )}
            </Card>
        </div>
    );

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
                    {(givenInstructions.length < 1 && !isLoading) && (
                        <Alert variant="destructive" className="bg-yellow-100 border-yellow-300 text-yellow-800">
                            <AlertCircle className="h-4 w-4 !text-yellow-800" />
                            <AlertTitle className="font-semibold">Attention</AlertTitle>
                            <AlertDescription>
                                You must provide at least one instruction.
                            </AlertDescription>
                        </Alert>
                    )}
                    
                   {isMobile ? (
                        <Tabs defaultValue="available" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="available">Available</TabsTrigger>
                                <TabsTrigger value="given">
                                    Given
                                    {givenInstructions.length > 0 && <Badge className="ml-2 h-5 px-1.5">{givenInstructions.length}</Badge>}
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="available" className="mt-4">{availableInstructionsPanel}</TabsContent>
                            <TabsContent value="given" className="mt-4">{givenInstructionsPanel}</TabsContent>
                        </Tabs>
                   ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {availableInstructionsPanel}
                           {givenInstructionsPanel}
                        </div>
                   )}

                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button onClick={handleSave} disabled={validationMutation.isPending || isLoading || isLoadingCorrect || saveAnswersMutation.isPending}>
                        {(validationMutation.isPending || saveAnswersMutation.isPending) ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                        Save Instructions
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
