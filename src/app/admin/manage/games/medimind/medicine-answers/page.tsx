"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Search, Pill, FileQuestion, Check, Loader2, AlertTriangle, ChevronRight, BrainCircuit } from "lucide-react";
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';

import { 
    getMediMindItems, 
    getMediMindQuestions, 
    getMediMindAnswers, 
    getMediMindMedicineAnswers, 
    saveMediMindMedicineAnswer, 
    deleteMediMindMedicineAnswer 
} from '@/lib/actions/games';
import type { MediMindItem, MediMindQuestion, MediMindAnswer, MediMindMedicineAnswer } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

const CONTENT_PROVIDER_BASE_URL = 'https://content-provider.pharmacollege.lk';

export default function MedicineAnswersPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMedicineId, setSelectedMedicineId] = useState<string | null>(null);

    // --- Data Fetching ---
    const { data: items = [], isLoading: isLoadingItems } = useQuery<MediMindItem[]>({
        queryKey: ['mediMindItems'],
        queryFn: getMediMindItems,
    });

    const { data: questions = [], isLoading: isLoadingQuestions } = useQuery<MediMindQuestion[]>({
        queryKey: ['mediMindQuestions'],
        queryFn: getMediMindQuestions,
    });

    const { data: allAnswers = [], isLoading: isLoadingAnswers } = useQuery<MediMindAnswer[]>({
        queryKey: ['mediMindAnswers'],
        queryFn: getMediMindAnswers,
    });

    const { data: existingMappings = [], isLoading: isLoadingMappings } = useQuery<MediMindMedicineAnswer[]>({
        queryKey: ['mediMindMedicineAnswers'],
        queryFn: getMediMindMedicineAnswers,
    });

    // --- Mutations ---
    const saveMutation = useMutation({
        mutationFn: saveMediMindMedicineAnswer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mediMindMedicineAnswers'] });
            toast({ title: "Mapping Saved", description: "The correct answer has been updated for this medicine." });
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Save Failed', description: err.message }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteMediMindMedicineAnswer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mediMindMedicineAnswers'] });
            toast({ title: "Mapping Removed" });
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Delete Failed', description: err.message }),
    });

    // --- Derived State ---
    const filteredItems = useMemo(() => {
        return items.filter(item => item.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [items, searchTerm]);

    const selectedMedicine = useMemo(() => {
        return items.find(item => item.id === selectedMedicineId);
    }, [items, selectedMedicineId]);

    const medicineMappings = useMemo(() => {
        return existingMappings.filter(m => String(m.medicine_id) === String(selectedMedicineId));
    }, [existingMappings, selectedMedicineId]);

    const handleSelectAnswer = (questionId: string, answerId: string) => {
        if (!user?.username || !selectedMedicineId) return;

        // If 'none' or empty, we probably want to delete? 
        // But for now let's just use it to set.
        if (answerId === 'none') {
            const existing = medicineMappings.find(m => String(m.question_id) === String(questionId));
            if (existing) {
                deleteMutation.mutate(existing.id);
            }
            return;
        }

        saveMutation.mutate({
            medicine_id: parseInt(selectedMedicineId, 10),
            question_id: parseInt(questionId, 10),
            answer_id: parseInt(answerId, 10),
            created_by: user.username
        });
    };

    const isLoading = isLoadingItems || isLoadingQuestions || isLoadingAnswers || isLoadingMappings;

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <Button variant="ghost" onClick={() => router.push('/admin/manage/games/medimind')} className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to MediMind Setup
                </Button>
                <h1 className="text-3xl font-headline font-semibold mt-2">Configure Medicine Answers</h1>
                <p className="text-muted-foreground">Map correct answers to medicines for each game challenge.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Medicine List */}
                <Card className="lg:col-span-1 shadow-lg h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg">Select Medicine</CardTitle>
                        <div className="relative mt-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search medicines..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-9"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 border-t">
                        {isLoadingItems ? (
                            <div className="p-4 space-y-2">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ) : (
                            <div className="max-h-[60vh] overflow-y-auto">
                                {filteredItems.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => setSelectedMedicineId(item.id)}
                                        className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors border-b last:border-0 ${selectedMedicineId === item.id ? 'bg-primary/5 border-r-4 border-r-primary' : ''}`}
                                    >
                                        <div className="w-10 h-10 bg-muted rounded relative overflow-hidden shrink-0 border">
                                            {item.medicine_image_url ? (
                                                <Image 
                                                    src={`${CONTENT_PROVIDER_BASE_URL}${item.medicine_image_url}`} 
                                                    alt={item.medicine_name}
                                                    fill
                                                    className="object-contain p-1"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Pill className="w-5 h-5 text-muted-foreground/30" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-medium truncate ${selectedMedicineId === item.id ? 'text-primary' : ''}`}>{item.medicine_name}</p>
                                            <p className="text-[10px] uppercase text-muted-foreground">ID: {item.id}</p>
                                        </div>
                                        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${selectedMedicineId === item.id ? 'translate-x-1 text-primary' : ''}`} />
                                    </button>
                                ))}
                                {filteredItems.length === 0 && (
                                    <div className="p-8 text-center text-muted-foreground">
                                        <p className="text-sm italic">No medicines found</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Question Mapping Form */}
                <Card className="lg:col-span-2 shadow-lg min-h-[400px]">
                    <CardHeader className="border-b bg-muted/20">
                        {selectedMedicine ? (
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-background rounded-lg relative overflow-hidden border shadow-sm shrink-0">
                                    {selectedMedicine.medicine_image_url ? (
                                        <Image 
                                            src={`${CONTENT_PROVIDER_BASE_URL}${selectedMedicine.medicine_image_url}`} 
                                            alt={selectedMedicine.medicine_name}
                                            fill
                                            className="object-contain p-1"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Pill className="w-6 h-6 text-muted-foreground/30" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Answers for {selectedMedicine.medicine_name}</CardTitle>
                                    <CardDescription>Select the correct answer for each available question.</CardDescription>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <CardTitle className="text-xl">Answer Configuration</CardTitle>
                                <CardDescription>Please select a medicine from the list to start mapping answers.</CardDescription>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="pt-6">
                        {!selectedMedicineId ? (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/50">
                                <BrainCircuit className="h-16 w-16 mb-4 opacity-20" />
                                <p className="text-lg italic">Select a medicine to begin configuration</p>
                            </div>
                        ) : isLoading ? (
                            <div className="space-y-6">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="space-y-2">
                                        <Skeleton className="h-4 w-1/3" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {questions.map(question => {
                                    const currentMapping = medicineMappings.find(m => String(m.question_id) === String(question.id));
                                    const availableAnswers = allAnswers.filter(a => String(a.question_id) === String(question.id));
                                    const isSaving = saveMutation.isPending && (saveMutation.variables as any)?.question_id === parseInt(question.id, 10);

                                    return (
                                        <div key={question.id} className="space-y-3 p-4 rounded-lg border bg-card hover:shadow-md transition-all">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-1 p-1 bg-primary/10 rounded-md shrink-0">
                                                        <FileQuestion className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <Label className="text-base font-semibold leading-relaxed pt-0.5">{question.question}</Label>
                                                </div>
                                                {currentMapping && (
                                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase shrink-0">
                                                        <Check className="h-3 w-3" /> Configured
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                                <Select
                                                    value={currentMapping ? String(currentMapping.answer_id) : "none"}
                                                    onValueChange={(val) => handleSelectAnswer(question.id, val)}
                                                    disabled={isSaving}
                                                >
                                                    <SelectTrigger className={`w-full ${currentMapping ? 'border-primary/50 ring-1 ring-primary/20' : ''}`}>
                                                        {isSaving ? (
                                                            <div className="flex items-center gap-2">
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                <span>Saving...</span>
                                                            </div>
                                                        ) : (
                                                            <SelectValue placeholder="Select correct answer..." />
                                                        )}
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none" className="text-muted-foreground italic">No correct answer selected</SelectItem>
                                                        {availableAnswers.map(answer => (
                                                            <SelectItem key={answer.id} value={answer.id}>
                                                                {answer.answer}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {currentMapping && !isSaving && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="text-destructive h-9 px-3 hover:bg-destructive/10"
                                                        onClick={() => deleteMutation.mutate(currentMapping.id)}
                                                        disabled={deleteMutation.isPending && deleteMutation.variables === currentMapping.id}
                                                    >
                                                        {deleteMutation.isPending && deleteMutation.variables === currentMapping.id ? <Loader2 className="h-4 w-4 animate-spin"/> : "Clear"}
                                                    </Button>
                                                )}
                                            </div>
                                            {availableAnswers.length === 0 && (
                                                <p className="text-xs text-amber-600 flex items-center gap-1.5 font-medium mt-1">
                                                    <AlertTriangle className="h-3 w-3" /> No answers defined in the pool for this question.
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}

                                {questions.length === 0 && (
                                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl">
                                        <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                        <p className="font-semibold text-lg">No Questions Found</p>
                                        <p className="text-sm">Please define questions first under "Manage Questions".</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                    {selectedMedicineId && (
                        <CardFooter className="border-t bg-muted/5 py-4">
                            <p className="text-xs text-muted-foreground italic">
                                Changes are saved automatically when you select an answer from the dropdown.
                            </p>
                        </CardFooter>
                    )}
                </Card>
            </div>
        </div>
    );
}
