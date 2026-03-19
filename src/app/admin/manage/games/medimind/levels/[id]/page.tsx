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
import { ArrowLeft, PlusCircle, Trash2, Loader2, Search, Pill, FileQuestion, AlertTriangle, Calendar, UserCheck } from "lucide-react";
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { getMediMindLevelById, getMediMindItems } from '@/lib/actions/games';
import type { MediMindLevel, MediMindItem } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

// Mock Question data for now as the API for this part is still being defined
interface GameQuestion {
  id: string;
  text: string;
}

const allQuestions: GameQuestion[] = [
  { id: 'q1', text: 'What is its primary Drug Class?' },
  { id: 'q2', text: 'What is its primary Indication (use)?' },
  { id: 'q3', text: 'What is its Mechanism of Action?' },
  { id: 'q4', text: 'What is a Common Side Effect?' },
  { id: 'q5', text: 'What is a common Dosage Form?' },
];

const AddItemDialog = ({ onAddItems, currentItemIds, allItems }: { onAddItems: (itemIds: string[]) => void; currentItemIds: string[]; allItems: MediMindItem[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const availableItems = useMemo(() => {
        return allItems.filter(item => 
            !currentItemIds.includes(item.id) &&
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                                    id={`add-${item.id}`}
                                    checked={selectedIds.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                        setSelectedIds(prev => checked ? [...prev, item.id] : prev.filter(id => id !== item.id));
                                    }}
                                />
                                <Label htmlFor={`add-${item.id}`} className="font-normal cursor-pointer flex items-center gap-2">
                                    <div className="w-6 h-6 rounded bg-muted relative overflow-hidden shrink-0">
                                        {item.image_path && <Image src={`https://content-provider.pharmacollege.lk/medimind/${item.image_path}`} alt={item.name} fill objectFit="cover" />}
                                    </div>
                                    {item.name}
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

export default function LevelDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const levelId = params.id as string;
    const queryClient = useQueryClient();
    
    const [itemToRemove, setItemToRemove] = useState<MediMindItem | null>(null);

    const { data: level, isLoading: isLoadingLevel, isError: isLevelError, error: levelError } = useQuery<MediMindLevel>({
        queryKey: ['mediMindLevel', levelId],
        queryFn: () => getMediMindLevelById(levelId),
        enabled: !!levelId,
    });

    const { data: allItems = [], isLoading: isLoadingAllItems } = useQuery<MediMindItem[]>({
        queryKey: ['mediMindItems'],
        queryFn: getMediMindItems,
    });

    // Mock local state for relationships until those endpoints are ready
    const [itemIds, setItemIds] = useState<string[]>([]);
    const [questionIds, setQuestionIds] = useState<string[]>([]);

    const itemsInLevel = useMemo(() => {
        return allItems.filter(item => itemIds.includes(item.id));
    }, [itemIds, allItems]);
    
    const handleAddItems = (newItemIds: string[]) => {
        setItemIds(prev => [...new Set([...prev, ...newItemIds])]);
        toast({ title: `${newItemIds.length} item(s) added to level configuration.` });
    };

    const handleRemoveItem = () => {
        if (itemToRemove) {
            setItemIds(prev => prev.filter(id => id !== itemToRemove.id));
            toast({ title: 'Item Removed' });
            setItemToRemove(null);
        }
    };

    if (isLoadingLevel) return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    if (isLevelError || !level) {
        return (
            <div className="p-8 text-center text-destructive flex flex-col items-center">
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
            <AlertDialog open={!!itemToRemove} onOpenChange={() => setItemToRemove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will remove "{itemToRemove?.name}" from the level configuration.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemoveItem}>Remove</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <header>
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <Button variant="ghost" onClick={() => router.push('/admin/manage/games/medimind/levels')} className="-ml-4">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Levels
                        </Button>
                        <h1 className="text-3xl font-headline font-semibold mt-2">{level.level_name}</h1>
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
                <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle className="text-lg">Level Items</CardTitle>
                            <CardDescription>{itemsInLevel.length} medicines assigned.</CardDescription>
                        </div>
                        <AddItemDialog onAddItems={handleAddItems} currentItemIds={itemIds} allItems={allItems} />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {itemsInLevel.map(item => (
                                <div key={item.id} className="relative group flex items-center gap-4 p-2 border rounded-md bg-muted/50">
                                    <div className="w-10 h-10 bg-white rounded flex-shrink-0 relative overflow-hidden">
                                        {item.image_path && <Image src={`https://content-provider.pharmacollege.lk/medimind/${item.image_path}`} alt={item.name} layout="fill" objectFit="contain" className="p-1" />}
                                    </div>
                                    <p className="font-semibold text-sm">{item.name}</p>
                                    <Button variant="ghost" size="icon" className="ml-auto h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setItemToRemove(item)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                             {itemsInLevel.length === 0 && (
                                <div className="text-center py-10 border border-dashed rounded-lg">
                                    <Pill className="mx-auto h-10 w-10 text-muted-foreground opacity-20 mb-2" />
                                    <p className="text-sm text-muted-foreground">No medicines assigned yet.</p>
                                </div>
                             )}
                        </div>
                    </CardContent>
                </Card>

                 <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle className="text-lg">Assessment Logic</CardTitle>
                            <CardDescription>Questions asked in this level.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" disabled><PlusCircle className="mr-2 h-4 w-4" /> Edit Logic</Button>
                    </CardHeader>
                    <CardContent>
                         <div className="space-y-2">
                            {allQuestions.map(question => (
                                <div key={question.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                                    <p className="font-medium text-xs">{question.text}</p>
                                    <Badge variant="outline" className="text-[9px] h-4">Standard</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
