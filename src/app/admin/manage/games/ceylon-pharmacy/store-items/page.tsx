

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlusCircle, Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMasterProducts, updateMasterProduct } from '@/lib/actions/games';
import type { MasterProduct } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const ItemForm = ({ item, onSave, onClose, isSaving }: { item: MasterProduct | null; onSave: (data: { name: string, price: string }) => void; onClose: () => void; isSaving: boolean }) => {
    const [name, setName] = useState(item?.DisplayName || '');
    const [price, setPrice] = useState(item?.SellingPrice || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericPrice = parseFloat(price);
        if (!name.trim() || isNaN(numericPrice)) {
            toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please provide a valid item name and price.' });
            return;
        }
        onSave({ name, price: String(numericPrice) });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor="item-name">Item Name</Label>
                <Input id="item-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="item-price">Price (LKR)</Label>
                <Input id="item-price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Item
                </Button>
            </DialogFooter>
        </form>
    );
};

export default function ManageStoreItemsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<MasterProduct | null>(null);
    const [itemToDelete, setItemToDelete] = useState<MasterProduct | null>(null);

    const { data: items = [], isLoading, isError, error } = useQuery<MasterProduct[]>({
        queryKey: ['masterProducts'],
        queryFn: getMasterProducts,
    });

    const updateMutation = useMutation({
        mutationFn: updateMasterProduct,
        onSuccess: (updatedItem) => {
            queryClient.setQueryData<MasterProduct[]>(['masterProducts'], (oldData) => {
                if (!oldData) return [updatedItem];
                return oldData.map(item => item.product_id === updatedItem.product_id ? updatedItem : item);
            });
            toast({ title: 'Item Updated', description: `${updatedItem.DisplayName} has been updated.` });
            setIsDialogOpen(false);
        },
        onError: (err: Error) => {
            toast({ variant: 'destructive', title: 'Update Error', description: err.message });
        }
    });

    const mockDeleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await new Promise(resolve => setTimeout(resolve, 500));
        },
        onSuccess: (data, id) => {
            queryClient.setQueryData<MasterProduct[]>(['masterProducts'], (oldData) => 
                oldData ? oldData.filter(item => item.product_id !== id) : []
            );
            toast({ title: 'Item Deleted' });
            setItemToDelete(null);
        },
        onError: (err: Error) => {
            toast({ variant: 'destructive', title: 'Delete Error', description: err.message });
        }
    });
    
    const openDialog = (item: MasterProduct | null = null) => {
        setCurrentItem(item);
        setIsDialogOpen(true);
    };

    const handleSave = (data: { name: string, price: string }) => {
        if (currentItem) {
            updateMutation.mutate({ productId: currentItem.product_id, ...data });
        } else {
            // Create logic would go here if an endpoint existed.
            toast({ title: 'Create not implemented' });
        }
    };

    if (isError) {
        return <div className="p-8 text-destructive">Error: {(error as Error).message}</div>
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentItem ? 'Edit' : 'Add'} Store Item</DialogTitle>
                        <DialogDescription>Fill in the details for the general store item.</DialogDescription>
                    </DialogHeader>
                    <ItemForm 
                        item={currentItem} 
                        onSave={handleSave} 
                        onClose={() => setIsDialogOpen(false)}
                        isSaving={updateMutation.isPending}
                    />
                </DialogContent>
            </Dialog>
            <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete "{itemToDelete?.DisplayName}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={mockDeleteMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => mockDeleteMutation.mutate(itemToDelete!.product_id)} disabled={mockDeleteMutation.isPending}>
                            {mockDeleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <Button variant="ghost" onClick={() => router.push('/admin/manage/games/ceylon-pharmacy')} className="-ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Game Setup
                    </Button>
                    <h1 className="text-3xl font-headline font-semibold mt-2">Manage Store Items</h1>
                    <p className="text-muted-foreground">Configure items available in the POS system.</p>
                </div>
                <Button onClick={() => openDialog()} disabled>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
                </Button>
            </header>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>General Store Item List</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {isLoading && [...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                            <div className="space-y-2"><Skeleton className="h-4 w-32"/><Skeleton className="h-3 w-24"/></div>
                            <div className="flex gap-1"><Skeleton className="h-8 w-8"/><Skeleton className="h-8 w-8"/></div>
                        </div>
                    ))}
                    {!isLoading && items.map(item => (
                        <div key={item.product_id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                                <p className="font-semibold">{item.DisplayName}</p>
                                <p className="text-sm text-muted-foreground">LKR {parseFloat(item.SellingPrice).toFixed(2)}</p>
                            </div>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(item)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setItemToDelete(item)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    ))}
                     {!isLoading && items.length === 0 && <p className="text-center text-muted-foreground py-8">No items found.</p>}
                </CardContent>
            </Card>
        </div>
    );
}
