
"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, PlusCircle, Edit, Trash2, Loader2, AlertTriangle, Search, Image as ImageIcon, Pill } from "lucide-react";
import Image from 'next/image';

import type { MediMindItem } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';


const dummyMediMindItems: MediMindItem[] = [
    {
        id: '1',
        name: 'Paracetamol 500mg',
        description: 'A common pain reliever and fever reducer.',
        image_path: 'paracetamol.jpg',
        created_at: new Date().toISOString(),
        created_by: 'Admin'
    },
    {
        id: '2',
        name: 'Amoxicillin 250mg',
        description: 'An antibiotic used to treat a number of bacterial infections.',
        image_path: 'amoxicillin.jpg',
        created_at: new Date().toISOString(),
        created_by: 'Admin'
    },
    {
        id: '3',
        name: 'Loratadine 10mg',
        description: 'An antihistamine used to treat allergies.',
        image_path: 'loratadine.jpg',
        created_at: new Date().toISOString(),
        created_by: 'Admin'
    }
];


const itemFormSchema = z.object({
  name: z.string().min(3, 'Item name must be at least 3 characters.'),
  description: z.string().optional(),
  image: z.any().optional(),
});

type ItemFormValues = z.infer<typeof itemFormSchema>;

const ItemForm = ({ item, onSave, onClose, isSaving }: { item?: MediMindItem | null; onSave: (data: ItemFormValues) => void; onClose: () => void; isSaving: boolean }) => {
    
    const form = useForm<ItemFormValues>({
        resolver: zodResolver(itemFormSchema),
        defaultValues: {
            name: item?.name || '',
            description: item?.description || '',
            image: null,
        }
    });

    const onSubmit = (data: ItemFormValues) => {
        onSave(data);
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Medicine Name</Label>
                <Input id="name" {...form.register('name')} />
                {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea id="description" {...form.register('description')} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="image">Image</Label>
                <Input id="image" type="file" {...form.register('image')} accept="image/*" />
                {item?.image_path && (
                    <div className="mt-2 text-xs text-muted-foreground">
                        Current image:
                        <a href={`https://content-provider.pharmacollege.lk/medimind/${item.image_path}`} target="_blank" rel="noopener noreferrer" className="ml-1 text-primary hover:underline">{item.image_path}</a>
                        <p>Uploading a new file will replace the current one.</p>
                    </div>
                )}
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {item ? 'Save Changes' : 'Create Item'}
                </Button>
            </DialogFooter>
        </form>
    );
};


export default function ManageItemsPage() {
    const router = useRouter();
    const [items, setItems] = useState<MediMindItem[]>(dummyMediMindItems);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<MediMindItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<MediMindItem | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { user } = useAuth();
    
    const filteredItems = useMemo(() => {
        return items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [items, searchTerm]);


    const handleCreate = () => {
        setSelectedItem(null);
        setIsFormOpen(true);
    };

    const handleEdit = (item: MediMindItem) => {
        setSelectedItem(item);
        setIsFormOpen(true);
    };

    const handleSave = (data: ItemFormValues) => {
        setIsSaving(true);
        setTimeout(() => { // Simulate async operation
            if (selectedItem) {
                // Update existing item
                setItems(prevItems => prevItems.map(item =>
                    item.id === selectedItem.id ? { ...item, ...data, image_path: data.image?.[0]?.name || item.image_path } : item
                ));
                toast({ title: "Item Updated" });
            } else {
                // Add new item
                const newItem: MediMindItem = {
                    id: String(Date.now()),
                    name: data.name,
                    description: data.description || '',
                    image_path: data.image?.[0]?.name || 'no-image.png',
                    created_at: new Date().toISOString(),
                    created_by: user?.username || 'admin',
                };
                setItems(prevItems => [newItem, ...prevItems]);
                toast({ title: "Item Created" });
            }
            setIsSaving(false);
            setIsFormOpen(false);
        }, 1000);
    };

    const handleDelete = () => {
        if (!itemToDelete) return;
        setIsSaving(true);
        setTimeout(() => {
            setItems(prev => prev.filter(item => item.id !== itemToDelete.id));
            toast({ title: 'Item Deleted' });
            setItemToDelete(null);
            setIsSaving(false);
        }, 500);
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedItem ? 'Edit' : 'Create'} Medicine Item</DialogTitle>
                        <DialogDescription>Fill in the details for the medicine.</DialogDescription>
                    </DialogHeader>
                    <ItemForm item={selectedItem} onClose={() => setIsFormOpen(false)} onSave={handleSave} isSaving={isSaving} />
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete "{itemToDelete?.name}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isSaving}>
                             {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <Button variant="ghost" onClick={() => router.push('/admin/manage/games/medimind')} className="-ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to MediMind Setup
                    </Button>
                    <h1 className="text-3xl font-headline font-semibold mt-2">Manage Items (Medicines)</h1>
                    <p className="text-muted-foreground">Add, edit, or delete medicines for the game.</p>
                </div>
                <Button onClick={handleCreate}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
                </Button>
            </header>

            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <CardTitle>Item List</CardTitle>
                        <div className="relative w-full md:max-w-xs">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                           <Input 
                                placeholder="Search items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                           />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredItems.length > 0 ? filteredItems.map(item => (
                            <Card key={item.id} className="flex flex-col">
                                <div className="relative w-full h-32 bg-muted rounded-t-lg overflow-hidden">
                                    <Image src={`https://content-provider.pharmacollege.lk/medimind/${item.image_path}`} alt={item.name} layout="fill" objectFit="cover" onError={(e) => e.currentTarget.src = 'https://placehold.co/800x450.png'} />
                                </div>
                                <CardHeader>
                                    <CardTitle className="text-base">{item.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                                </CardContent>
                                <CardFooter className="p-2 border-t mt-auto">
                                    <div className="flex justify-end w-full gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}><Edit className="h-4 w-4"/></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setItemToDelete(item)}><Trash2 className="h-4 w-4"/></Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        )) : (
                            <div className="col-span-full text-center py-10 text-muted-foreground">
                                <Pill className="mx-auto h-12 w-12" />
                                <h3 className="mt-4 text-lg font-semibold">No Items Found</h3>
                                <p>Click "Add New Item" to create the first one.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

