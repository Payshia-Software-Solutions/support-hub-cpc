"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, PlusCircle, Trash2, Loader2, Search, Pill, FileQuestion, AlertTriangle, Calendar, UserCheck, Check, Settings2, X } from "lucide-react";
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { 
    getMediMindLevelById, 
    getMediMindItems, 
    getMediMindQuestions, 
    getMediMindLevelQuestions, 
    addMediMindLevelQuestion, 
    removeMediMindLevelQuestion,
    getMediMindLevelMedicines,
    getMediMindLevelMedicinesByLevel,
    addMediMindLevelMedicine,
    removeMediMindLevelMedicine
} from '@/lib/actions/games';
import type { MediMindLevel, MediMindItem, MediMindQuestion, MediMindLevelQuestion, MediMindLevelMedicine } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

const AddItemDialog = ({ onAddItems, currentItemIds, allItems }: { onAddItems: (itemIds: string[]) => void; currentItemIds: string[]; allItems: MediMindItem[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const availableItems = useMemo(() => {
        return allItems.filter(item => 
            !currentItemIds.includes(item.id) &&
            item.medicine_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [currentItemIds, searchTerm, allItems]);

    const handleConfirm = () => {
        onAddItems(selectedIds);
        setIsOpen(false);
        setSelectedIds([]);
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add Item(s)</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Items to Level</DialogTitle>
                    <div className="relative pt-2">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <Input placeholder="Search items..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </DialogHeader>
                <ScrollArea className="max-h-[50vh] -mx-6 px-6">
                    <div className="space-y-2">
                        {availableItems.map(item => (
                            <div key={item.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted">
                                <Checkbox
                                    id={`add-item-${item.id}`}
                                    checked={selectedIds.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                        setSelectedIds(prev => checked ? [...prev, item.id] : prev.filter(id => id !== item.id));
                                    }}
                                />
                                <Label htmlFor={`add-item-${item.id}`} className="font-normal cursor-pointer flex items-center gap-2">
                                    <div className="w-6 h-6 rounded bg-muted relative overflow-hidden shrink-0">
                                        {item.medicine_image_url && <Image src={`https://content-provider.pharmacollege.lk${item.medicine_image_url}`} alt={item.medicine_name} fill className="object-cover" />}
                                    </div>
                                    {item.medicine_name}
                                </Label>
                            </div>
                        ))}
                        {availableItems.length === 0 && !searchTerm && <p className="text-center py-4 text-muted-foreground text-sm">All available items are already in this level.</p>}
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleConfirm} disabled={selectedIds.length === 0}>Add Selected</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const AddQuestionDialog = ({ 
    levelId, 
    currentMappings, 
    allQuestions 
}: { 
    levelId: string; 
    currentMappings: MediMindLevelQuestion[]; 
    allQuestions: MediMindQuestion[] 
}) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const currentQuestionIds = useMemo(() => currentMappings.map(m => m.question_id), [currentMappings]);

    const filteredQuestions = useMemo(() => {
        return allQuestions.filter(q => 
            q.question.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, allQuestions]);

    const addMutation = useMutation({
        mutationFn: (questionId: number) => addMediMindLevelQuestion({
            level_id: parseInt(levelId, 10),
            question_id: questionId,
            created_by: user?.username || 'admin_user'
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mediMindLevelQuestions'] });
            toast({ title: 'Question added to level.' });
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Action Failed', description: err.message })
    });

    const removeMutation = useMutation({
        mutationFn: (mappingId: string) => removeMediMindLevelQuestion(mappingId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mediMindLevelQuestions'] });
            toast({ title: 'Question removed from level.' });
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Action Failed', description: err.message })
    });

    const handleToggle = (questionId: string) => {
        const existingMapping = currentMappings.find(m => String(m.question_id) === String(questionId));
        if (existingMapping) {
            removeMutation.mutate(existingMapping.id);
        } else {
            addMutation.mutate(parseInt(questionId, 10));
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Settings2 className="mr-2 h-4 w-4" /> Configure Questions</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Configure Assessment Logic</DialogTitle>
                    <DialogDescription>Select which questions should be asked in this level.</DialogDescription>
                    <div className="relative pt-2">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <Input placeholder="Search questions..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </DialogHeader>
                <ScrollArea className="max-h-[50vh] -mx-6 px-6">
                    <div className="space-y-2 py-2">
                        {filteredQuestions.map(q => {
                            const isAssigned = currentQuestionIds.includes(String(q.id));
                            const isPending = (addMutation.isPending && String(addMutation.variables) === String(q.id)) || 
                                             (removeMutation.isPending && currentMappings.find(m => String(m.question_id) === String(q.id))?.id === removeMutation.variables);

                            return (
                                <div key={q.id} className={cn("flex items-start space-x-2 p-3 rounded-md transition-colors border", isAssigned ? "bg-primary/5 border-primary/20" : "hover:bg-muted")}>
                                    <Checkbox
                                        id={`q-logic-${q.id}`}
                                        checked={isAssigned}
                                        disabled={isPending}
                                        onCheckedChange={() => handleToggle(String(q.id))}
                                        className="mt-1"
                                    />
                                    <div className="flex-1 flex items-center justify-between gap-4">
                                        <Label htmlFor={`q-logic-${q.id}`} className="font-medium cursor-pointer text-sm leading-tight pt-0.5 flex-1">
                                            {q.question}
                                        </Label>
                                        {isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground shrink-0"/>}
                                    </div>
                                </div>
                            );
                        })}
                        {filteredQuestions.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">No questions found.</p>}
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <DialogClose asChild><Button variant="secondary">Close</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default function LevelDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const levelId = params.id as string;
    const queryClient = useQueryClient();
    const { user } = useAuth();
    
    const [itemToRemove, setItemToRemove] = useState<MediMindItem | null>(null);
    const [mappingToRemove, setMappingToRemove] = useState<MediMindLevelQuestion | null>(null);

    const { data: level, isLoading: isLoadingLevel, isError: isLevelError, error: levelError } = useQuery<MediMindLevel>({
        queryKey: ['mediMindLevel', levelId],
        queryFn: () => getMediMindLevelById(levelId),
        enabled: !!levelId,
    });

    const { data: allItems = [], isLoading: isLoadingAllItems } = useQuery<MediMindItem[]>({
        queryKey: ['mediMindItems'],
        queryFn: getMediMindItems,
    });

    const { data: allQuestions = [], isLoading: isLoadingAllQuestions } = useQuery<MediMindQuestion[]>({
        queryKey: ['mediMindQuestions'],
        queryFn: getMediMindQuestions,
    });

    const { data: mappings = [], isLoading: isLoadingMappings } = useQuery<MediMindLevelQuestion[]>({
        queryKey: ['mediMindLevelQuestions', levelId],
        queryFn: () => getMediMindLevelQuestions(), // Assuming this already filters or we stick to it?
        // Actually the user didn't provide a level-specific one for level-questions yet.
        // But for level-medicines they DID.
    });

    const { data: levelMedicines = [], isLoading: isLoadingLevelMedicines } = useQuery<MediMindLevelMedicine[]>({
        queryKey: ['mediMindLevelMedicines', levelId],
        queryFn: () => getMediMindLevelMedicinesByLevel(levelId),
        enabled: !!levelId,
    });

    const currentLevelMappings = useMemo(() => {
        return mappings.filter(m => String(m.level_id) === String(levelId));
    }, [mappings, levelId]);

    const currentLevelMedicines = levelMedicines;

    const itemsInLevel = useMemo(() => {
        return allItems.filter(item => currentLevelMedicines.some(m => String(m.medicine_id) === String(item.id)));
    }, [currentLevelMedicines, allItems]);
    
    const addMedicineMutation = useMutation({
        mutationFn: (medicineId: string) => addMediMindLevelMedicine({
            level_id: parseInt(levelId, 10),
            medicine_id: parseInt(medicineId, 10),
            created_by: user?.username || 'admin_user'
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mediMindLevelMedicines'] });
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Action Failed', description: err.message })
    });

    const handleAddItems = async (newItemIds: string[]) => {
        try {
            await Promise.all(newItemIds.map(id => addMedicineMutation.mutateAsync(id)));
            toast({ title: `${newItemIds.length} item(s) added to level.` });
        } catch (error) {
            // Error handled by mutation
        }
    };

    const removeMedicineMutation = useMutation({
        mutationFn: (mappingId: string) => removeMediMindLevelMedicine(mappingId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mediMindLevelMedicines'] });
            toast({ title: 'Item Removed' });
            setItemToRemove(null);
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Action Failed', description: err.message })
    });

    const handleRemoveItem = () => {
        if (itemToRemove) {
            const mapping = currentLevelMedicines.find(m => String(m.medicine_id) === String(itemToRemove.id));
            if (mapping) {
                removeMedicineMutation.mutate(mapping.id);
            } else {
                setItemToRemove(null);
            }
        }
    };

    const removeMappingMutation = useMutation({
        mutationFn: (mappingId: string) => removeMediMindLevelQuestion(mappingId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mediMindLevelQuestions'] });
            toast({ title: 'Question removed from level.' });
            setMappingToRemove(null);
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Action Failed', description: err.message })
    });

    const handleRemoveMapping = () => {
        if (mappingToRemove) {
            removeMappingMutation.mutate(mappingToRemove.id);
        }
    };

    const isLoading = isLoadingLevel || isLoadingAllItems || isLoadingAllQuestions || isLoadingMappings || isLoadingLevelMedicines;

    if (isLoading) return <div className="p-8 flex items-center justify-center h-screen"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    if (isLevelError || !level) {
        return (
            <div className="p-8 text-center text-destructive flex flex-col items-center h-screen justify-center">
                <AlertTriangle className="h-10 w-10 mb-2" />
                <p className="font-semibold">Level Not Found</p>
                <p className="text-sm">{(levelError as Error).message}</p>
                <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/manage/games/medimind/levels')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Levels
                </Button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            {/* Alert for Removing Items */}
            <AlertDialog open={!!itemToRemove} onOpenChange={() => setItemToRemove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will remove "{itemToRemove?.medicine_name}" from the level configuration.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={removeMedicineMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleRemoveItem}
                            disabled={removeMedicineMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {removeMedicineMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Alert for Removing Questions */}
            <AlertDialog open={!!mappingToRemove} onOpenChange={() => setMappingToRemove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Assessment Question?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove "{mappingToRemove?.question}" from this level's assessment pool?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={removeMappingMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleRemoveMapping} 
                            disabled={removeMappingMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {removeMappingMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            Confirm Removal
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <header>
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <Button variant="ghost" onClick={() => router.push('/admin/manage/games/medimind/levels')} className="-ml-4 h-auto p-1 mb-2">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Levels
                        </Button>
                        <h1 className="text-3xl font-headline font-semibold">{level.level_name}</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <UserCheck className="h-3.5 w-3.5" />
                                <span>Created by: {level.created_by}</span>
                            </div>
                            <span className="text-muted-foreground opacity-50">•</span>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{format(new Date(level.created_at), 'PPP')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <Card className="shadow-lg border-primary/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 border-b bg-muted/20">
                        <div>
                            <CardTitle className="text-lg">Level Items</CardTitle>
                            <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground">{itemsInLevel.length} medicines assigned.</CardDescription>
                        </div>
                        <AddItemDialog onAddItems={handleAddItems} currentItemIds={currentLevelMedicines.map(m => String(m.medicine_id))} allItems={allItems} />
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="space-y-2">
                            {itemsInLevel.map(item => (
                                <div key={item.id} className="relative group flex items-center gap-4 p-2 border rounded-md bg-background hover:bg-muted/30 transition-colors">
                                    <div className="w-10 h-10 bg-muted rounded flex-shrink-0 relative overflow-hidden">
                                        {item.medicine_image_url && <Image src={`https://content-provider.pharmacollege.lk${item.medicine_image_url}`} alt={item.medicine_name} fill className="object-contain p-1" />}
                                    </div>
                                    <p className="font-semibold text-sm">{item.medicine_name}</p>
                                    <Button variant="ghost" size="icon" className="ml-auto h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setItemToRemove(item)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                             {itemsInLevel.length === 0 && (
                                <div className="text-center py-10 border border-dashed rounded-lg bg-muted/10">
                                    <Pill className="mx-auto h-10 w-10 text-muted-foreground opacity-20 mb-2" />
                                    <p className="text-sm text-muted-foreground italic">No medicines assigned yet.</p>
                                </div>
                             )}
                        </div>
                    </CardContent>
                </Card>

                 <Card className="shadow-lg border-primary/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 border-b bg-muted/20">
                        <div>
                            <CardTitle className="text-lg">Assessment Logic</CardTitle>
                            <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground">{currentLevelMappings.length} questions assigned.</CardDescription>
                        </div>
                        <AddQuestionDialog 
                            levelId={levelId}
                            currentMappings={currentLevelMappings}
                            allQuestions={allQuestions}
                        />
                    </CardHeader>
                    <CardContent className="pt-4">
                         <div className="space-y-2">
                            {currentLevelMappings.length > 0 ? currentLevelMappings.map(mapping => (
                                <div key={mapping.id} className="flex items-center justify-between p-3 border rounded-md bg-background hover:bg-muted/30 transition-colors group">
                                    <p className="font-medium text-xs flex-1 pr-4">{mapping.question}</p>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[9px] h-4 shrink-0 uppercase">Standard</Badge>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" 
                                            onClick={() => setMappingToRemove(mapping)}
                                            disabled={removeMappingMutation.isPending && removeMappingMutation.variables === mapping.id}
                                        >
                                            {removeMappingMutation.isPending && removeMappingMutation.variables === mapping.id ? (
                                                <Loader2 className="h-3 w-3 animate-spin"/>
                                            ) : (
                                                <X className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-10 border border-dashed rounded-lg bg-muted/10">
                                    <FileQuestion className="mx-auto h-10 w-10 text-muted-foreground opacity-20 mb-2" />
                                    <p className="text-sm text-muted-foreground italic">No assessment questions assigned.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
