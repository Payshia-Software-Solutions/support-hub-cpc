
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlusCircle, Edit, Trash2 } from "lucide-react";
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generalStoreItems } from '@/lib/ceylon-pharmacy-data';
import type { GeneralStoreItem } from '@/lib/ceylon-pharmacy-data';

type ItemCategory = 'Vitamins' | 'First-Aid' | 'Personal Care';

export default function ManageStoreItemsPage() {
    const router = useRouter();
    const [items, setItems] = useState<GeneralStoreItem[]>(generalStoreItems);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<GeneralStoreItem | null>(null);
    
    // Form state
    const [itemName, setItemName] = useState('');
    const [itemPrice, setItemPrice] = useState('');
    const [itemCategory, setItemCategory] = useState<ItemCategory | ''>('');


    const openDialog = (item: GeneralStoreItem | null = null) => {
        setCurrentItem(item);
        if (item) {
            setItemName(item.name);
            setItemPrice(String(item.price));
            setItemCategory(item.category);
        } else {
            setItemName('');
            setItemPrice('');
            setItemCategory('');
        }
        setIsDialogOpen(true);
    };

    const handleSave = () => {
        if (!itemName.trim() || !itemPrice.trim() || !itemCategory) {
            toast({ variant: 'destructive', title: 'All fields are required.' });
            return;
        }

        const price = parseFloat(itemPrice);
        if (isNaN(price) || price < 0) {
            toast({ variant: 'destructive', title: 'Invalid price.' });
            return;
        }

        if (currentItem) {
            // Edit existing
            setItems(items.map(i => i.id === currentItem.id ? { ...i, name: itemName, price, category: itemCategory } : i));
            toast({ title: 'Item Updated' });
        } else {
            // Add new
            const newItem: GeneralStoreItem = { id: `new-${Date.now()}`, name: itemName, price, category: itemCategory };
            setItems([...items, newItem]);
            toast({ title: 'Item Added' });
        }
        setIsDialogOpen(false);
    };
    
    const handleDelete = (id: string) => {
        setItems(items.filter(i => i.id !== id));
        toast({ title: 'Item Deleted' });
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentItem ? 'Edit' : 'Add'} Store Item</DialogTitle>
                        <DialogDescription>Fill in the details for the general store item.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="item-name">Item Name</Label>
                            <Input id="item-name" value={itemName} onChange={(e) => setItemName(e.target.value)} />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="item-price">Price (LKR)</Label>
                                <Input id="item-price" type="number" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="item-category">Category</Label>
                                 <Select value={itemCategory} onValueChange={(value) => setItemCategory(value as ItemCategory)}>
                                    <SelectTrigger id="item-category"><SelectValue placeholder="Select category..."/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Vitamins">Vitamins</SelectItem>
                                        <SelectItem value="First-Aid">First-Aid</SelectItem>
                                        <SelectItem value="Personal Care">Personal Care</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleSave}>Save Item</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <Button variant="ghost" onClick={() => router.push('/admin/manage/games/ceylon-pharmacy')} className="-ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Game Setup
                    </Button>
                    <h1 className="text-3xl font-headline font-semibold mt-2">Manage Store Items</h1>
                    <p className="text-muted-foreground">Configure items available in the POS system.</p>
                </div>
                <Button onClick={() => openDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
                </Button>
            </header>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>General Store Item List</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {items.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                                <p className="font-semibold">{item.name}</p>
                                <p className="text-sm text-muted-foreground">LKR {item.price.toFixed(2)} - <span className="italic">{item.category}</span></p>
                            </div>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(item)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
