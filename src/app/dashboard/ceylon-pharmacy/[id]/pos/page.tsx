
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, PlusCircle, ShoppingCart, CheckCircle, Trash2 } from 'lucide-react';
import { ceylonPharmacyPatients, type Patient, type PrescriptionDrug } from '@/lib/ceylon-pharmacy-data';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';

// Mock prices for drugs
const drugPrices: Record<string, number> = {
  "Metformin 500mg": 15.50,
  "Amoxicillin 250mg/5ml": 250.00,
  "Aspirin 75mg": 5.25,
  "Atorvastatin 20mg": 30.00,
};

interface CartItem extends PrescriptionDrug {
    price: number;
    quantity: number;
}

export default function POSPage() {
    const router = useRouter();
    const params = useParams();
    const isMobile = useIsMobile();
    const patientId = params.id as string;

    const [patient, setPatient] = useState<Patient | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [cashReceived, setCashReceived] = useState<string>('');
    const [isPaid, setIsPaid] = useState(false);

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


    const handleAddToCart = (drug: PrescriptionDrug) => {
        if (cart.some(item => item.id === drug.id)) {
            toast({ variant: 'destructive', title: 'Item already in cart' });
            return;
        }

        const price = drugPrices[drug.correctAnswers.drugName] || 0;
        setCart(prev => [...prev, { ...drug, price, quantity: drug.correctAnswers.quantity }]);
    };
    
    const handleRemoveFromCart = (drugId: string) => {
        setCart(prev => prev.filter(item => item.id !== drugId));
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

    if (!patient) {
        return <div className="p-8 text-center">Loading patient data...</div>;
    }

    const availableItems = patient.prescription.drugs.filter(
        (drug) => !cart.some((cartItem) => cartItem.id === drug.id)
    );
    
    const posContent = (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Available Items</CardTitle>
                    <CardDescription>Add items from the prescription to the bill.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {availableItems.length > 0 ? (
                        availableItems.map(drug => (
                            <div key={drug.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                                <div>
                                    <p className="font-medium">{drug.correctAnswers.drugName}</p>
                                    <p className="text-sm text-muted-foreground">Qty: {drug.correctAnswers.quantity}</p>
                                </div>
                                <Button size="sm" onClick={() => handleAddToCart(drug)} disabled={isPaid}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add
                                </Button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            <p>All prescribed items have been added.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
             <Card className="shadow-xl sticky top-24">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShoppingCart /> Bill</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="min-h-[150px] max-h-[300px] overflow-y-auto pr-2 space-y-2">
                         {cart.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead className="text-center">Qty</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead className="w-[40px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cart.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.correctAnswers.drugName}</TableCell>
                                            <TableCell className="text-center">{item.quantity}</TableCell>
                                            <TableCell className="text-right">{(item.price * item.quantity).toFixed(2)}</TableCell>
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
                     </div>

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
                                <Input id="cash-received" type="number" placeholder="Enter amount..." value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} disabled={cart.length === 0} />
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
    )

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <Button onClick={() => router.back()} variant="ghost" className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patient Hub
                </Button>
            </header>
            <Card className={cn(isMobile && "border-0 shadow-none bg-transparent")}>
                <CardHeader className={cn(isMobile && "p-0")}>
                    <CardTitle>Task 3: POS Billing</CardTitle>
                    <CardDescription>Generate the bill for the patient's prescription.</CardDescription>
                </CardHeader>
                <CardContent className={cn("mt-6", isMobile && "p-0")}>
                   {posContent}
                </CardContent>
            </Card>
        </div>
    );
}
