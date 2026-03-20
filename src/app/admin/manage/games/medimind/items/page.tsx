"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, PlusCircle, Edit, Trash2, Loader2, AlertTriangle, Search, Pill } from "lucide-react";
import Image from 'next/image';

import { getMediMindItems, createMediMindItem, updateMediMindItem, deleteMediMindItem } from '@/lib/actions/games';
import type { MediMindItem } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const CONTENT_PROVIDER_BASE_URL = 'https://content-provider.pharmacollege.lk';

const itemFormSchema = z.object({
  name: z.string().min(3, 'Item name must be at least 3 characters.'),
  image: z.any().optional(),
});

type ItemFormValues = z.infer<typeof itemFormSchema>;

const ItemForm = ({ item, onSave, onClose, isSaving }: { item?: MediMindItem | null; onSave: (data: ItemFormValues) => void; onClose: () => void; isSaving: boolean }) => {
    
    const form = useForm<ItemFormValues>({
        resolver: zodResolver(itemFormSchema),
        defaultValues: {
            name: item?.medicine_name || '',
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
                <Label htmlFor="image">Medicine Image</Label>
                <Input id="image" type="file" {...form.register('image')} accept="image/*" />
                {item?.medicine_image_url && (
                    <div className="mt-2 text-xs text-muted-foreground">
                        Current image:
                        <a href={`${CONTENT_PROVIDER_BASE_URL}${item.medicine_image_url}`} target="_blank" rel="noopener noreferrer" className="ml-1 text-primary hover:underline">{item.medicine_image_url}</a>
                        <p>Uploading a new file will replace the current one.</p>
                    </div>
                )}
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline" disabled={isSaving}>Cancel</Button></DialogClose>
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
    const queryClient = useQueryClient();
    const { user } = useAuth();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<MediMindItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<MediMindItem | null>(null);

    const { data: items = [], isLoading, isError, error } = useQuery<MediMindItem[]>({
        queryKey: ['mediMindItems'],
        queryFn: getMediMindItems,
    });

    const createMutation = useMutation({
        mutationFn: createMediMindItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mediMindItems'] });
            toast({ title: "Item Created" });
            setIsFormOpen(false);
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Create Failed', description: err.message }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, formData }: { id: string, formData: FormData }) => updateMediMindItem(id, formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mediMindItems'] });
            toast({ title: "Item Updated" });
            setIsFormOpen(false);
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Update Failed', description: err.message }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteMediMindItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mediMindItems'] });
            toast({ title: 'Item Deleted' });
            setItemToDelete(null);
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Delete Failed', description: err.message }),
    });
    
    const filteredItems = useMemo(() => {
        if (!items) return [];
        return items.filter(item => item.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()));
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
        if (!user?.username) return;

        const formData = new FormData();
        formData.append('medicine_name', data.name);
        formData.append('created_by', user.username);
        if (data.image?.[0]) {
            formData.append('medicine_image', data.image[0]);
        }

        if (selectedItem) {
            updateMutation.mutate({ id: selectedItem.id, formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedItem ? 'Edit' : 'Create'} Medicine Item</DialogTitle>
                        <DialogDescription>Fill in the details for the medicine.</DialogDescription>
                    </DialogHeader>
                    <ItemForm item={selectedItem} onClose={() => setIsFormOpen(false)} onSave={handleSave} isSaving={isMutating} />
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete "{itemToDelete?.medicine_name}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isMutating}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(itemToDelete!.id)} disabled={isMutating}>
                             {isMutating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Delete
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
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
                        </div>
                    ) : isError ? (
                        <div className="text-center py-10 text-destructive">
                            <AlertTriangle className="h-10 w-10 mx-auto mb-4" />
                            <p>Error loading items: {error.message}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredItems.length > 0 ? filteredItems.map(item => (
                                <Card key={item.id} className="flex flex-col overflow-hidden">
                                    <div className="relative w-full h-40 bg-muted">
                                        {item.medicine_image_url ? (
                                            <Image 
                                                src={`${CONTENT_PROVIDER_BASE_URL}${item.medicine_image_url}`} 
                                                alt={item.medicine_name} 
                                                layout="fill" 
                                                objectFit="contain" 
                                                className="p-4"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Pill className="h-12 w-12 text-muted-foreground/30" />
                                            </div>
                                        )}
                                    </div>
                                    <CardHeader className="p-4">
                                        <CardTitle className="text-base">{item.medicine_name}</CardTitle>
                                        <CardDescription className="text-[10px] uppercase tracking-wider">ID: {item.id}</CardDescription>
                                    </CardHeader>
                                    <CardFooter className="p-4 border-t mt-auto">
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
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
