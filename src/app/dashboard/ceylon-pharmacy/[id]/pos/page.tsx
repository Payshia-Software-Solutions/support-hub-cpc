
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ArrowLeft, PlusCircle, ShoppingCart, CheckCircle, Trash2, Search, Pill } from 'lucide-react';
import { ceylonPharmacyPatients, generalStoreItems, type Patient, type PrescriptionDrug, type GeneralStoreItem } from '@/lib/ceylon-pharmacy-data';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

type CartItem = (PrescriptionDrug | GeneralStoreItem) & {
    price: number;
    quantity: number;
    type: 'prescription' | 'general';
};

export default function POSPage() {
    const router = useRouter();
    const params = useParams();
    const patientId = params.id as string;

    const [patient, setPatient] = useState<Patient | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [cashReceived, setCashReceived] = useState<string>('');
    const [isPaid, setIsPaid] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [itemToAdd, setItemToAdd] = useState<PrescriptionDrug | GeneralStoreItem | null>(null);
    const [addQuantity, setAddQuantity] = useState('1');

    useEffect(() => {
        const foundPatient = ceylonPharmacyPatients.find(p => p.id === patientId);
        if (foundPatient) {
            setPatient(foundPatient);
        } else {
            toast({ variant: 'destructive', title: 'Patient not found' });
            router.push('/dashboard/ceylon-pharmacy');
        }
    }, [patientId, router]);

    const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.price * item.quantity, 0), [cart]);
    const tax = subtotal * 0.05; // 5% tax
    const total = subtotal + tax;
    const change = useMemo(() => {
        const received = parseFloat(cashReceived);
        if (isNaN(received) || received < total) return 0;
        return received - total;
    }, [cashReceived, total]);
    
    const filteredStoreItems = useMemo(() => {
        if (!searchTerm) return [...(patient?.prescription.drugs || []), ...generalStoreItems];
        
        const lowercasedSearch = searchTerm.toLowerCase();

        const prescribed = (patient?.prescription.drugs || []).filter(drug => 
            drug.correctAnswers.drugName.toLowerCase().includes(lowercasedSearch) ||
            drug.correctAnswers.genericName.toLowerCase().includes(lowercasedSearch)
        );

        const general = generalStoreItems.filter(item => 
            item.name.toLowerCase().includes(lowercasedSearch)
        );

        return [...prescribed, ...general];
    }, [searchTerm, patient]);


    const handleAddToCart = () => {
        if (!itemToAdd) return;

        const quantity = parseFloat(addQuantity);
        if (isNaN(quantity) || quantity <= 0) {
            toast({ variant: 'destructive', title: 'Invalid quantity', description: 'Please enter a valid number greater than 0.' });
            return;
        }

        const isPrescription = 'correctAnswers' in itemToAdd;
        const newItem: CartItem = {
            ...itemToAdd,
            price: itemToAdd.price,
            quantity: quantity,
            type: isPrescription ? 'prescription' : 'general'
        };
        setCart(prev => [...prev, newItem]);
        setItemToAdd(null);
        setAddQuantity('1');
    };
    
    const handleRemoveFromCart = (itemId: string) => {
        setCart(prev => prev.filter(item => item.id !== itemId));
    };
    
    const handleQuantityChange = (itemId: string, newQuantityString: string) => {
        const newQuantity = parseFloat(newQuantityString);
        if (newQuantityString === '' || isNaN(newQuantity) || newQuantity <= 0) {
             setCart(prev => prev.map(item => item.id === itemId ? {...item, quantity: 0} : item));
             return;
        }
        setCart(prev => prev.map(item => item.id === itemId ? {...item, quantity: newQuantity} : item));
    }

    const handleProcessPayment = () => {
        if (parseFloat(cashReceived) < total) {
             toast({ variant: 'destructive', title: 'Insufficient payment', description: 'Cash received is less than the total amount.' });
             return;
        }
        setIsPaid(true);
        toast({ title: 'Payment Successful!', description: `Change to be given: LKR ${change.toFixed(2)}` });
    };
    
    const handleCompleteSale = () => {
        // In a real app, update task status here
        toast({ title: "Task Complete!", description: "POS billing has been successfully completed." });
        router.push(`/dashboard/ceylon-pharmacy/${patientId}`);
    };

    if (!patient) {
        return <div className="p-8 text-center">Loading patient data...</div>;
    }
    
    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <Dialog onOpenChange={(open) => !open && setItemToAdd(null)}>
                <header>
                    <Button onClick={() => router.back()} variant="ghost" className="-ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patient Hub
                    </Button>
                </header>
                <Card className="border-0 shadow-none bg-transparent md:border md:shadow-lg md:bg-card">
                    <CardHeader className="p-0 md:p-6">
                        <CardTitle>Task 3: POS Billing</CardTitle>
                        <CardDescription>Generate the bill for the patient's prescription and any additional items.</CardDescription>
                    </CardHeader>
                    <CardContent className="mt-6 p-0 md:p-6 md:pt-0">
                       <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                            <Card className="shadow-lg lg:col-span-2">
                                <CardHeader>
                                    <CardTitle>Product List</CardTitle>
                                     <div className="relative pt-2">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            placeholder="Search products..." 
                                            className="pl-10" 
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-[500px] pr-3">
                                    <div className="space-y-3">
                                        {filteredStoreItems.length > 0 ? (
                                            filteredStoreItems.map(item => {
                                                const isPrescription = 'correctAnswers' in item;
                                                const name = isPrescription ? item.correctAnswers.drugName : item.name;
                                                const genericName = isPrescription ? item.correctAnswers.genericName : undefined;
                                                const isAdded = cart.some(c => c.id === item.id);

                                                return (
                                                     <div key={item.id} className={cn("flex items-center justify-between p-3 border rounded-md", isAdded ? "bg-muted/30" : "bg-muted/80")}>
                                                        <div>
                                                            <p className="font-medium text-sm">{name}</p>
                                                            {genericName && <p className="text-xs text-muted-foreground">{genericName}</p>}
                                                            <p className="text-xs font-semibold text-primary">LKR {item.price.toFixed(2)}</p>
                                                        </div>
                                                        <DialogTrigger asChild>
                                                            <Button size="sm" onClick={() => setItemToAdd(item)} disabled={isPaid || isAdded}>
                                                                {isAdded ? <CheckCircle className="h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                                                                {isAdded ? "Added" : "Add"}
                                                            </Button>
                                                        </DialogTrigger>
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            <div className="text-center py-10 text-muted-foreground">
                                                <p>No products found.</p>
                                            </div>
                                        )}
                                    </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                            <Card className="shadow-xl sticky top-24 lg:col-span-3">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><ShoppingCart /> Bill</CardTitle>
                                    <CardDescription>Patient: {patient.name}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <ScrollArea className="min-h-[150px] max-h-[300px]">
                                        {cart.length > 0 ? (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-2/5">Item</TableHead>
                                                        <TableHead className="w-1/5 text-center">Qty</TableHead>
                                                        <TableHead className="w-1/5 text-right">Price</TableHead>
                                                        <TableHead className="w-1/5 text-right">Total</TableHead>
                                                        <TableHead className="w-[40px]"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {cart.map(item => (
                                                        <TableRow key={item.id}>
                                                            <TableCell className="font-medium text-sm">
                                                                {'correctAnswers' in item ? item.correctAnswers.drugName : item.name}
                                                                {'correctAnswers' in item && <p className="text-xs text-muted-foreground">{item.correctAnswers.genericName}</p>}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input 
                                                                    type="number" 
                                                                    value={item.quantity === 0 ? '' : item.quantity}
                                                                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                                    className="h-8 w-16 text-center"
                                                                    disabled={isPaid}
                                                                    step="any"
                                                                />
                                                            </TableCell>
                                                            <TableCell className="text-right">{item.price.toFixed(2)}</TableCell>
                                                            <TableCell className="text-right font-semibold">{(item.price * item.quantity).toFixed(2)}</TableCell>
                                                            <TableCell>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveFromCart(item.id)} disabled={isPaid}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        ) : (
                                            <div className="flex items-center justify-center h-full min-h-[150px] text-muted-foreground text-center">
                                                <p>Cart is empty. Add items to begin.</p>
                                            </div>
                                        )}
                                    </ScrollArea>

                                    <Separator />
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span>Subtotal</span><span>LKR {subtotal.toFixed(2)}</span></div>
                                        <div className="flex justify-between"><span>Tax (5%)</span><span>LKR {tax.toFixed(2)}</span></div>
                                        <div className="flex justify-between font-bold text-base"><span className="text-primary">Total</span><span className="text-primary">LKR {total.toFixed(2)}</span></div>
                                    </div>
                                    
                                    {!isPaid ? (
                                        <>
                                            <Separator />
                                            <div className="space-y-2">
                                                <Label htmlFor="cash-received">Cash Received</Label>
                                                <Input id="cash-received" type="number" placeholder="Enter amount..." value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} disabled={cart.length === 0} step="any" />
                                            </div>
                                            <Button className="w-full" onClick={handleProcessPayment} disabled={cart.length === 0 || !cashReceived}>Process Payment</Button>
                                        </>
                                    ) : (
                                        <div className="bg-green-100 border border-green-300 text-green-800 p-4 rounded-lg space-y-2 text-center">
                                            <h3 className="font-bold text-lg">Payment Complete!</h3>
                                            <p className="text-sm">Change Due</p>
                                            <p className="text-3xl font-extrabold">LKR {change.toFixed(2)}</p>
                                            <Button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white" onClick={handleCompleteSale}>
                                                <CheckCircle className="mr-2 h-4 w-4" /> Finish & Complete Task
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                       </div>
                    </CardContent>
                </Card>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Item: {itemToAdd?.name || ('correctAnswers' in (itemToAdd || {}) && itemToAdd.correctAnswers.drugName)}</DialogTitle>
                        <DialogDescription>Enter the quantity you wish to add to the bill.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="add-quantity">Quantity</Label>
                        <Input 
                            id="add-quantity" 
                            type="number" 
                            value={addQuantity} 
                            onChange={(e) => setAddQuantity(e.target.value)} 
                            className="mt-2"
                            min="0"
                            step="any"
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <DialogClose asChild>
                            <Button onClick={handleAddToCart}>Confirm</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
