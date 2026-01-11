
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, PlusCircle, Trash2, Loader2, Search, Pill } from "lucide-react";
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// --- Mock Data ---
interface GameLevel {
  id: string;
  name: string;
  description: string;
}
interface MediMindItem {
    id: string;
    name: string;
    description: string;
    image_path: string;
    created_at: string;
    created_by: string;
}

const dummyLevels: GameLevel[] = [
  { id: '1', name: 'Level 1: The Basics', description: 'Introduction to common analgesics and antibiotics.' },
  { id: '2', name: 'Level 2: Cardiovascular Care', description: 'Focuses on drugs for hypertension and cholesterol.' },
  { id: '3', name: 'Level 3: Allergy & Asthma', description: 'Covers antihistamines and bronchodilators.' },
];
const allItems: MediMindItem[] = [
    { id: '1', name: 'Paracetamol 500mg', description: 'A common pain reliever and fever reducer.', image_path: 'paracetamol.jpg', created_at: '', created_by: '' },
    { id: '2', name: 'Amoxicillin 250mg', description: 'An antibiotic used to treat a number of bacterial infections.', image_path: 'amoxicillin.jpg', created_at: '', created_by: '' },
    { id: '3', name: 'Loratadine 10mg', description: 'An antihistamine used to treat allergies.', image_path: 'loratadine.jpg', created_at: '', created_by: '' },
    { id: '4', name: 'Atenolol 50mg', description: 'A beta-blocker for high blood pressure.', image_path: 'atenolol.jpg', created_at: '', created_by: '' },
];
const levelItemMap: Record<string, string[]> = {
  '1': ['1', '2'],
  '2': ['4'],
  '3': [],
};

const AddItemDialog = ({ onAddItems, currentItemIds }: { onAddItems: (itemIds: string[]) => void; currentItemIds: string[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const availableItems = useMemo(() => {
        return allItems.filter(item => 
            !currentItemIds.includes(item.id) &&
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [currentItemIds, searchTerm]);

    const handleConfirm = () => {
        onAddItems(selectedIds);
        setIsOpen(false);
        setSelectedIds([]);
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Item(s)</Button>
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
                                <Label htmlFor={`add-${item.id}`} className="font-normal cursor-pointer">{item.name}</Label>
                            </div>
                        ))}
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
    
    const [level, setLevel] = useState<GameLevel | null>(null);
    const [itemIds, setItemIds] = useState<string[]>([]);
    const [itemToRemove, setItemToRemove] = useState<MediMindItem | null>(null);

    useEffect(() => {
        // Simulate fetching level and its items
        const foundLevel = dummyLevels.find(l => l.id === levelId);
        if (foundLevel) {
            setLevel(foundLevel);
            setItemIds(levelItemMap[levelId] || []);
        } else {
            toast({ variant: 'destructive', title: 'Level not found.' });
            router.push('/admin/manage/games/medimind/levels');
        }
    }, [levelId, router]);

    const itemsInLevel = useMemo(() => {
        return allItems.filter(item => itemIds.includes(item.id));
    }, [itemIds]);
    
    const handleAddItems = (newItemIds: string[]) => {
        setItemIds(prev => [...new Set([...prev, ...newItemIds])]);
        toast({ title: `${newItemIds.length} item(s) added.` });
    };

    const handleRemove = () => {
        if (itemToRemove) {
            setItemIds(prev => prev.filter(id => id !== itemToRemove.id));
            toast({ title: 'Item Removed' });
            setItemToRemove(null);
        }
    };

    if (!level) return <div className="p-8"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></div>;

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <AlertDialog open={!!itemToRemove} onOpenChange={() => setItemToRemove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will remove "{itemToRemove?.name}" from this level.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemove}>Remove</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                 <div>
                    <Button variant="ghost" onClick={() => router.push('/admin/manage/games/medimind/levels')} className="-ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Levels
                    </Button>
                    <h1 className="text-3xl font-headline font-semibold mt-2">{level.name}</h1>
                    <p className="text-muted-foreground">{level.description}</p>
                </div>
                <AddItemDialog onAddItems={handleAddItems} currentItemIds={itemIds} />
            </header>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Items in this Level</CardTitle>
                    <CardDescription>{itemsInLevel.length} items are currently assigned.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {itemsInLevel.map(item => (
                            <Card key={item.id} className="relative group">
                                <CardContent className="p-4 flex items-center gap-4">
                                     <div className="w-12 h-12 bg-white rounded-md flex-shrink-0 relative overflow-hidden">
                                        <Image src={`https://content-provider.pharmacollege.lk/medimind/${item.image_path}`} alt={item.name} layout="fill" objectFit="contain" className="p-1" onError={(e) => e.currentTarget.src = 'https://placehold.co/100x100.png'} />
                                    </div>
                                    <p className="font-semibold text-sm">{item.name}</p>
                                </CardContent>
                                <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7 text-destructive opacity-0 group-hover:opacity-100" onClick={() => setItemToRemove(item)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </Card>
                        ))}
                         {itemsInLevel.length === 0 && (
                            <p className="col-span-full text-center py-10 text-muted-foreground">No items assigned to this level yet.</p>
                         )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
