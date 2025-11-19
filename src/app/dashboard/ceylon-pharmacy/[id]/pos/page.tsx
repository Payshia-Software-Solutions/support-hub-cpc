

"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ArrowLeft, PlusCircle, ShoppingCart, CheckCircle, Trash2, Search, Pill, Library, Loader2 } from 'lucide-react';
import { getCeylonPharmacyPrescriptions, getMasterProducts } from '@/lib/actions/games';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import type { GamePatient, MasterProduct } from '@/lib/types';


type CartItem = (MasterProduct) & {
    id: string; // Ensure all cart items have a unique ID, whether it's product_id or a generated one.
    quantity: number;
    type: 'prescription' | 'general';
    // For prescription items
    correctAnswers?: any; 
};

export default function POSPage() {
    const router = useRouter();
    const params = useParams();
    const patientId = params.id as string;
    const isMobile = useIsMobile();
    const { user } = useAuth();
    const courseCode = 'CPCC20';

    const [cart, setCart] = useState<CartItem[]>([]);
    const [cashReceived, setCashReceived] = useState<string>('');
    const [discount, setDiscount] = useState<string>('');
    const [isPaid, setIsPaid] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [itemToAdd, setItemToAdd] = useState<MasterProduct | null>(null);
    const [addQuantity, setAddQuantity] = useState('1');

    const { data: patient, isLoading: isLoadingPatient } = useQuery<GamePatient>({
        queryKey: ['ceylonPharmacyPatientForPOS', patientId, user?.username],
        queryFn: async () => {
            if (!user?.username) throw new Error("User not authenticated");
            const prescriptions = await getCeylonPharmacyPrescriptions(user.username, courseCode);
            const found = prescriptions.find(p => p.prescription_id === patientId);
            if (!found) throw new Error("Patient not found");
            return found;
        },
        enabled: !!patientId && !!user?.username,
        retry: false,
        refetchOnWindowFocus: false,
    });

    const { data: masterProducts, isLoading: isLoadingProducts } = useQuery<MasterProduct[]>({
        queryKey: ['masterProducts'],
        queryFn: getMasterProducts,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });


    useEffect(() => {
        if (patient) {
            // Mocking prescription drugs being added to the cart initially.
            // In a real scenario, you'd fetch prescription drugs associated with the patient.
            const prescriptionItems: CartItem[] = [
                // This would be populated from patient.prescription.drugs if it existed on the type
            ];
            setCart(prescriptionItems);
        } else if (!isLoadingPatient && patientId) {
            // If fetching is done and no patient is found
            toast({ variant: 'destructive', title: 'Patient not found' });
            router.push('/dashboard/ceylon-pharmacy');
        }
    }, [patient, patientId, router, isLoadingPatient]);

    const subtotal = useMemo(() => {
      if(!patient) return 0;
      // Using a fixed value since totalBillValue is not on the GamePatient type
      const prescriptionTotal = patient ? 1500.00 : 0; // Example fixed value
      const generalItemsTotal = cart
          .filter(item => item.type === 'general')
          .reduce((acc, item) => acc + (parseFloat(item.SellingPrice) * item.quantity), 0);
      return prescriptionTotal + generalItemsTotal;
    }, [cart, patient]);

    const discountAmount = useMemo(() => {
        const parsedDiscount = parseFloat(discount);
        return isNaN(parsedDiscount) ? 0 : parsedDiscount;
    }, [discount]);

    const total = subtotal - discountAmount;
    const change = useMemo(() => {
        const received = parseFloat(cashReceived);
        if (isNaN(received) || received < total) return 0;
        return received - total;
    }, [cashReceived, total]);
    
    const filteredStoreItems = useMemo(() => {
        if (!masterProducts) return [];
        if (!searchTerm) return masterProducts;
        const lowercasedSearch = searchTerm.toLowerCase();
        return masterProducts.filter(item => 
            item.DisplayName.toLowerCase().includes(lowercasedSearch)
        );
    }, [searchTerm, masterProducts]);


    const handleAddToCart = () => {
        if (!itemToAdd) return;

        const quantity = parseFloat(addQuantity);
        if (isNaN(quantity) || quantity <= 0) {
            toast({ variant: 'destructive', title: 'Invalid quantity', description: 'Please enter a valid number greater than 0.' });
            return;
        }

        const newItem: CartItem = {
            ...itemToAdd,
            id: itemToAdd.product_id, // Use product_id for uniqueness
            quantity: quantity,
            type: 'general'
        };
        setCart(prev => [...prev, newItem]);
        setItemToAdd(null);
        setAddQuantity('1');
    };
    
    const handleRemoveFromCart = (itemId: string) => {
        const itemToRemove = cart.find(item => item.id === itemId);
        if (itemToRemove?.type === 'prescription') {
            toast({ variant: "destructive", description: "Prescription items cannot be removed." });
            return;
        }
        setCart(prev => prev.filter(item => item.id !== itemId));
    };
    
    const handleQuantityChange = (itemId: string, newQuantityString: string) => {
        if (newQuantityString === '') {
            setCart(prev => prev.map(item => (item.id === itemId) ? { ...item, quantity: 0 } : item));
            return;
        }

        const newQuantity = parseFloat(newQuantityString);
        if (!isNaN(newQuantity) && newQuantity >= 0) {
            setCart(prev => prev.map(item => (item.id === itemId) ? { ...item, quantity: newQuantity } : item));
        }
    };
    

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

    if (isLoadingPatient) {
        return <div className="p-8 text-center flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin"/></div>;
    }

    if (!patient) {
        // This case is handled by the useEffect redirect, but as a fallback:
        return <div className="p-8 text-center">Patient data could not be loaded. Please return to the patient list.</div>;
    }

    const BillComponent = (
        <Card className="shadow-xl sticky top-24 lg:col-span-3">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShoppingCart /> Bill</CardTitle>
                <CardDescription>Patient: {patient.Pres_Name}</CardDescription>
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
                                {cart.map(item => {
                                    const isGeneral = item.type === 'general';
                                    const generalItem = isGeneral ? (item as MasterProduct) : null;
                                    const prescriptItem = !isGeneral ? (item as any) : null; // Prescription drug
                                    const itemId = item.id;
                                    const itemName = generalItem ? generalItem.DisplayName : prescriptItem!.correctAnswers.drugName;
                                    const itemPrice = generalItem ? parseFloat(generalItem.SellingPrice) : null;

                                    return (
                                        <TableRow key={itemId}>
                                            <TableCell className="font-medium text-sm">
                                                {itemName}
                                                {prescriptItem && <p className="text-xs text-muted-foreground">{prescriptItem.correctAnswers.genericName}</p>}
                                            </TableCell>
                                            <TableCell>
                                                <Input 
                                                    type="number" 
                                                    value={item.quantity === 0 ? '' : String(item.quantity)}
                                                    onChange={(e) => handleQuantityChange(itemId, e.target.value)}
                                                    className="h-8 w-20 text-center"
                                                    disabled={isPaid || item.type === 'prescription'}
                                                    step="any"
                                                    min="0"
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {itemPrice !== null ? itemPrice.toFixed(2) : '-'}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {itemPrice !== null ? (itemPrice * item.quantity).toFixed(2) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveFromCart(itemId)} disabled={isPaid || item.type === 'prescription'}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
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
                    <div className="flex justify-between items-center">
                        <Label htmlFor="discount" className="text-sm">Discount</Label>
                        <Input
                            id="discount"
                            type="number"
                            placeholder="0.00"
                            value={discount}
                            onChange={(e) => setDiscount(e.target.value)}
                            className="h-8 w-24 text-right"
                            disabled={isPaid}
                        />
                    </div>
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
             {isMobile && (
                <CardFooter>
                    <SheetTrigger asChild>
                         <Button variant="outline" className="w-full"><Library className="mr-2 h-4 w-4" /> Browse Products</Button>
                    </SheetTrigger>
                </CardFooter>
             )}
        </Card>
    );

    const ProductListComponent = (
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
                    {isLoadingProducts && <p>Loading products...</p>}
                    {!isLoadingProducts && filteredStoreItems.length > 0 ? (
                        filteredStoreItems.map(item => {
                            const isAdded = cart.some(c => c.id === item.product_id);
                            return (
                                 <div key={item.product_id} className={cn("flex items-center justify-between p-3 border rounded-md", isAdded ? "bg-muted/30" : "bg-muted/80")}>
                                    <div>
                                        <p className="font-medium text-sm">{item.DisplayName}</p>
                                        <p className="text-xs font-semibold text-primary">LKR {parseFloat(item.SellingPrice).toFixed(2)}</p>
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
                        !isLoadingProducts && <div className="text-center py-10 text-muted-foreground">
                            <p>No products found.</p>
                        </div>
                    )}
                </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );

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
                       {isMobile ? (
                            <Sheet>
                                {BillComponent}
                                <SheetContent side="bottom" className="h-[90vh] p-0">
                                    <div className="flex flex-col h-full">
                                        <SheetHeader className="p-6 pb-2 shrink-0">
                                            <SheetTitle>Browse Products</SheetTitle>
                                            <SheetDescription>Select items to add to the bill.</SheetDescription>
                                        </SheetHeader>
                                        <div className="px-6 pb-6 flex-1 overflow-hidden">
                                           {ProductListComponent}
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                       ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                                {ProductListComponent}
                                {BillComponent}
                            </div>
                       )}
                    </CardContent>
                </Card>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Item: {itemToAdd?.DisplayName}</DialogTitle>
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
                            min="1"
                            step="1"
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
