

"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ArrowLeft, PlusCircle, ShoppingCart, CheckCircle, Trash2, Search, Pill, Library, Loader2, FileText } from 'lucide-react';
import { getCeylonPharmacyPrescriptions, getMasterProducts, getPOSCorrectAmount, submitPOSAnswer, getPrescriptionDetails, updatePatientStatus } from '@/lib/actions/games';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import type { GamePatient, MasterProduct, POSCorrectAnswer, POSSubmissionPayload, PrescriptionDetail } from '@/lib/types';
import Image from 'next/image';
import { format } from 'date-fns';

const POS_IMAGE_BASE_URL = 'https://pos.payshia.com/uploads/product_images/';

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
    
    const { data: correctAmountData, isLoading: isLoadingCorrectAmount } = useQuery<POSCorrectAnswer>({
        queryKey: ['posCorrectAmount', patientId],
        queryFn: () => getPOSCorrectAmount(patientId),
        enabled: !!patientId,
    });

    const { data: masterProducts, isLoading: isLoadingProducts } = useQuery<MasterProduct[]>({
        queryKey: ['masterProducts'],
        queryFn: getMasterProducts,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });

    const { data: prescriptionDetails, isLoading: isLoadingDetails } = useQuery<PrescriptionDetail[]>({
        queryKey: ['prescriptionDetails', patientId],
        queryFn: () => getPrescriptionDetails(patientId),
        enabled: !!patient,
    });

    const updateStatusMutation = useMutation({
        mutationFn: (startDataId: string) => updatePatientStatus(startDataId),
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Status Update Error', description: `Could not mark patient as recovered: ${error.message}` });
        }
    });

    const submitAnswerMutation = useMutation({
        mutationFn: submitPOSAnswer,
        onSuccess: (data, variables) => {
             if (variables.ans_status === 'Answer Correct') {
                setIsPaid(true);
                toast({ title: 'Payment Correct!', description: `The total amount is correct. Change to be given: LKR ${change.toFixed(2)}` });

                if (patient?.start_data?.id) {
                    updateStatusMutation.mutate(patient.start_data.id);
                }
            } else {
                toast({ variant: 'destructive', title: 'Incorrect Total', description: 'The final bill amount is not correct. Please review the prescription and items.' });
            }
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Submission Error', description: error.message });
        }
    });

    useEffect(() => {
        if (!isLoadingPatient && !patient && patientId) {
            toast({ variant: 'destructive', title: 'Patient not found' });
            router.push('/dashboard/ceylon-pharmacy');
        }
    }, [patient, patientId, router, isLoadingPatient]);

    const subtotal = useMemo(() => {
      return cart.reduce((acc, item) => {
        const itemPrice = parseFloat(item.SellingPrice);
        return acc + (itemPrice * item.quantity);
      }, 0);
    }, [cart]);

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
        if (!correctAmountData || !user) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not verify answer. Correct amount or user data is missing.' });
            return;
        }

        const isCorrect = Math.abs(total - parseFloat(correctAmountData.value)) < 0.01;
        const status = isCorrect ? "Answer Correct" : "Answer Incorrect";
        
        const payload: POSSubmissionPayload = {
            student_id: user.username!,
            PresCode: patient!.prescription_id,
            answer: total.toFixed(2),
            created_at: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
            ans_status: status
        };

        submitAnswerMutation.mutate(payload);
    };
    
    const handleCompleteSale = () => {
        // In a real app, update task status here
        toast({ title: "Task Complete!", description: "POS billing has been successfully completed." });
        router.push(`/dashboard/ceylon-pharmacy/${patientId}`);
    };

    if (isLoadingPatient || isLoadingProducts || isLoadingCorrectAmount) {
        return <div className="p-8 text-center flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin"/></div>;
    }

    if (!patient) {
        // This case is handled by the useEffect redirect, but as a fallback:
        return <div className="p-8 text-center">Patient data could not be loaded. Please return to the patient list.</div>;
    }

    const BillComponent = (
        <Card className="shadow-xl sticky top-24 lg:col-span-3">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <ShoppingCart />
                        <CardTitle>Bill</CardTitle>
                    </div>
                     <Dialog>
                        <DialogTrigger asChild>
                             <Button variant="outline"><FileText className="mr-2 h-4 w-4"/>View Prescription</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                           <DialogHeader>
                               <DialogTitle>Prescription Details</DialogTitle>
                               <DialogDescription>Patient: {patient.Pres_Name}</DialogDescription>
                           </DialogHeader>
                           <div className="flex justify-center p-4">
                                <div className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-400 w-full max-w-md shadow-sm font-sans text-gray-800">
                                    <div className="text-center border-b pb-4 mb-4 border-gray-300">
                                        <h2 className="text-xl font-bold">{patient.doctor_name}</h2>
                                        <p className="text-sm text-gray-600">MBBS, MD</p>
                                        <p className="text-sm text-gray-600">Reg. No: {patient.id}</p>
                                    </div>
                                    <div className="flex justify-between text-sm mb-6">
                                        <div><p><span className="font-semibold">Name:</span> {patient.Pres_Name}</p><p><span className="font-semibold">Age:</span> {patient.Pres_Age}</p></div>
                                        <div><p><span className="font-semibold">Date:</span> {patient.pres_date}</p></div>
                                    </div>
                                     <div className="flex items-start min-h-[200px] mb-4">
                                        <div className="text-4xl font-serif text-gray-700 select-none mr-4">℞</div>
                                        <div className="flex-1 grid grid-cols-5 gap-2 font-mono text-base text-gray-800">
                                            <div className="col-span-3 space-y-2">
                                                {isLoadingDetails ? <Loader2 className="animate-spin"/> : prescriptionDetails?.map(detail => (<p key={detail.cover_id}>{detail.content}</p>))}
                                            </div>
                                            <div className="col-span-1 flex items-center justify-center">
                                                <div className="h-full w-[2px] bg-gray-400 transform -rotate-[25deg] origin-center scale-y-110"></div>
                                            </div>
                                            <div className="col-span-1 flex items-center justify-start font-bold">
                                                <span>{patient.Pres_Method}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {patient.notes && (
                                        <div className="mt-4 pt-2 border-t border-dashed">
                                            <p className="font-mono text-xs text-gray-700">{patient.notes}</p>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-end mt-8">
                                        <div className="text-center">
                                            <p className="font-bold">{patient.doctor_name}</p>
                                            <p className="text-xs text-gray-600 border-t border-gray-400 mt-1 pt-1">MBBS</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="italic font-serif text-xl text-gray-700">{patient.doctor_name.split(' ').slice(1).join(' ')}</p>
                                            <p className="text-xs text-muted-foreground non-italic">Signature</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
                <CardDescription>Patient: {patient.Pres_Name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <ScrollArea className="min-h-[150px] max-h-[300px]">
                    {cart.length > 0 ? (
                        <>
                            {/* Desktop Table */}
                            <Table className="hidden md:table">
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
                                        const itemPrice = parseFloat(item.SellingPrice);
                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium text-sm">
                                                    {item.DisplayName}
                                                </TableCell>
                                                <TableCell>
                                                    <Input 
                                                        type="number" 
                                                        value={item.quantity === 0 ? '' : String(item.quantity)}
                                                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                        className="h-8 w-20 text-center"
                                                        disabled={isPaid}
                                                        step="any"
                                                        min="0"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {itemPrice.toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    {(itemPrice * item.quantity).toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveFromCart(item.id)} disabled={isPaid}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                             {/* Mobile List */}
                            <div className="md:hidden space-y-2">
                                {cart.map(item => {
                                    const itemPrice = parseFloat(item.SellingPrice);
                                    return (
                                        <div key={item.id} className="p-2 border rounded-md">
                                            <div className="flex justify-between items-start">
                                                <p className="font-medium text-sm pr-2">{item.DisplayName}</p>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive flex-shrink-0 -mt-1 -mr-1" onClick={() => handleRemoveFromCart(item.id)} disabled={isPaid}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="flex items-center justify-between mt-1">
                                                <div className="flex items-center gap-2">
                                                    <Label htmlFor={`qty-${item.id}`} className="text-xs">Qty:</Label>
                                                    <Input 
                                                        type="number" 
                                                        id={`qty-${item.id}`}
                                                        value={item.quantity === 0 ? '' : String(item.quantity)}
                                                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                        className="h-8 w-20 text-center"
                                                        disabled={isPaid}
                                                        step="any"
                                                        min="0"
                                                    />
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-muted-foreground">@{itemPrice.toFixed(2)}</p>
                                                    <p className="font-semibold text-sm">LKR {(itemPrice * item.quantity).toFixed(2)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
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
                            <Input id="cash-received" type="number" placeholder="Enter amount..." value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} disabled={total <= 0} step="any" />
                        </div>
                        <Button className="w-full" onClick={handleProcessPayment} disabled={total <= 0 || !cashReceived || submitAnswerMutation.isPending}>
                             {submitAnswerMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            Process Payment
                        </Button>
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
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-md flex-shrink-0 relative overflow-hidden">
                                            {item.ImagePath ? (
                                                <Image src={`${POS_IMAGE_BASE_URL}${item.ImagePath}`} alt={item.DisplayName} layout="fill" objectFit="contain" className="p-1"/>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-muted">
                                                    <Pill className="w-6 h-6 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{item.DisplayName}</p>
                                            <p className="text-xs font-semibold text-primary">LKR {parseFloat(item.SellingPrice).toFixed(2)}</p>
                                        </div>
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
