
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Calculator, Save, AlertTriangle, Search, Check, ChevronsUpDown, Pill } from 'lucide-react';
import { getCeylonPharmacyPrescriptions, getPOSCorrectAmount, saveCorrectBillValue, getMasterProducts, getPrescriptionDetails, getDispensingAnswers } from '@/lib/actions/games';
import type { GamePatient, POSCorrectAnswer, MasterProduct, PrescriptionDetail, DispensingAnswer } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';


const ProductSelector = ({ products, selected, onSelect, placeholder }: { products: MasterProduct[], selected?: string, onSelect: (value: string) => void, placeholder: string }) => {
    const [open, setOpen] = useState(false);
    
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between h-8 text-xs">
                    <span className="truncate">
                        {selected ? products.find(p => p.product_id === selected)?.DisplayName : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder="Search product..." />
                    <CommandEmpty>No product found.</CommandEmpty>
                    <CommandGroup className="max-h-60 overflow-y-auto">
                        {products.map((product) => (
                            <CommandItem
                                key={product.product_id}
                                value={product.DisplayName}
                                onSelect={() => {
                                    onSelect(product.product_id);
                                    setOpen(false);
                                }}
                            >
                                <Check className={cn("mr-2 h-4 w-4", selected === product.product_id ? "opacity-100" : "opacity-0")} />
                                <span className="truncate">{product.DisplayName}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
};


const POSCalculatorDialog = ({ prescriptionDrugs, drugAnswers, onUseTotal, closeDialog }: { prescriptionDrugs: PrescriptionDetail[], drugAnswers: Record<string, DispensingAnswer | null>, onUseTotal: (total: number) => void, closeDialog: () => void }) => {
    const { data: masterProducts, isLoading } = useQuery<MasterProduct[]>({
        queryKey: ['masterProducts'],
        queryFn: getMasterProducts,
    });

    const [selectedProducts, setSelectedProducts] = useState<Record<string, string>>({});
    const [itemQuantities, setItemQuantities] = useState<Record<number, number>>({});
    const [discount, setDiscount] = useState('0');

    useEffect(() => {
        const initialQuantities: Record<number, number> = {};
        prescriptionDrugs.forEach((drug, index) => {
            const qtyString = drugAnswers[drug.cover_id]?.drug_qty || '1';
            const qty = !isNaN(parseFloat(qtyString)) ? parseFloat(qtyString) : 1;
            initialQuantities[index] = qty;
        });
        setItemQuantities(initialQuantities);
    }, [prescriptionDrugs, drugAnswers]);

    const billItems = useMemo(() => {
        if (!masterProducts || !prescriptionDrugs) return [];
        return prescriptionDrugs.map((drug, index) => {
            const selectedProductId = selectedProducts[index] || '';
            const product = masterProducts.find(p => p.product_id === selectedProductId);
            const price = product ? parseFloat(product.SellingPrice) : 0;
            const quantity = itemQuantities[index] || 1;
            return {
                index: index,
                name: drug.content,
                quantity: quantity,
                price: price,
                total: price * quantity,
                productId: selectedProductId,
            };
        });
    }, [prescriptionDrugs, masterProducts, selectedProducts, itemQuantities]);

    const subtotal = useMemo(() => billItems.reduce((acc, item) => acc + item.total, 0), [billItems]);
    const total = subtotal - parseFloat(discount || '0');

    const handleProductSelect = (drugIndex: number, productId: string) => {
        setSelectedProducts(prev => ({
            ...prev,
            [drugIndex]: productId,
        }));
    };
    
    const handleQuantityChange = (drugIndex: number, qtyString: string) => {
        const qty = parseFloat(qtyString);
        setItemQuantities(prev => ({
            ...prev,
            [drugIndex]: isNaN(qty) ? 0 : qty,
        }));
    };
    
    const getFilteredProducts = (drugName: string) => {
        if (!masterProducts) return [];
        if (!drugName) return masterProducts;
        const searchName = drugName.split(' ')[0].toLowerCase();
        return masterProducts.filter(p => p.DisplayName.toLowerCase().includes(searchName));
    };

    const handleUseTotal = () => {
        onUseTotal(total);
        closeDialog();
    }

    return (
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Calculator className="h-5 w-5"/>POS Bill Calculator</DialogTitle>
                <DialogDescription>Select the corresponding POS item for each drug to calculate the total.</DialogDescription>
            </DialogHeader>
            {isLoading ? (
                <div className="space-y-2"><p>Loading product prices...</p><Skeleton className="h-20 w-full" /></div>
            ) : (
                <div className="space-y-3 py-4">
                    <div className="border rounded-lg max-h-60 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-2 text-left font-medium">Prescription Item</th>
                                    <th className="p-2 text-center font-medium">Qty</th>
                                    <th className="p-2 text-right font-medium">Price</th>
                                    <th className="p-2 text-right font-medium">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {billItems.map((item) => (
                                    <tr key={item.index} className="border-b last:border-none">
                                        <td className="p-2 space-y-1">
                                            <p className="font-medium">{item.name || 'Untitled Drug'}</p>
                                            <ProductSelector
                                                products={getFilteredProducts(item.name)}
                                                selected={item.productId}
                                                onSelect={(productId) => handleProductSelect(item.index, productId)}
                                                placeholder="Select Product..."
                                            />
                                        </td>
                                        <td className="p-2 text-center">
                                            <Input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleQuantityChange(item.index, e.target.value)}
                                                className="h-8 w-20 text-center"
                                                step="any"
                                                min="0"
                                            />
                                        </td>
                                        <td className="p-2 text-right">{item.price.toFixed(2)}</td>
                                        <td className="p-2 text-right font-semibold">{(item.total).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                         <div className="flex justify-between items-center"><span className="text-muted-foreground">Subtotal</span><span>LKR {subtotal.toFixed(2)}</span></div>
                         <div className="flex justify-between items-center">
                            <Label htmlFor="calc-discount" className="text-muted-foreground">Discount</Label>
                            <Input id="calc-discount" type="number" placeholder="0.00" value={discount} onChange={e => setDiscount(e.target.value)} className="h-8 w-24 text-right" />
                        </div>
                         <div className="flex justify-between font-bold text-lg text-primary"><span >Total</span><span>LKR {total.toFixed(2)}</span></div>
                    </div>
                </div>
            )}
             <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleUseTotal} disabled={isLoading}>Use This Total</Button>
            </DialogFooter>
        </DialogContent>
    );
};


export default function ManageBillingPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId as string;
  const queryClient = useQueryClient();
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  const [billValue, setBillValue] = useState('');

  const { data: patient, isLoading: isLoadingPatient } = useQuery<GamePatient>({
      queryKey: ['ceylonPharmacyPatient', patientId],
      queryFn: async () => {
          const allPatients = await getCeylonPharmacyPrescriptions('admin-user', 'CPCC20');
          const foundPatient = allPatients.find(p => p.prescription_id === patientId);
          if (!foundPatient) throw new Error('Patient not found');
          return foundPatient;
      },
      enabled: !!patientId,
  });

  const { data: prescriptionDetails, isLoading: isLoadingDetails } = useQuery<PrescriptionDetail[]>({
      queryKey: ['prescriptionDetails', patientId],
      queryFn: () => getPrescriptionDetails(patientId),
      enabled: !!patient,
  });

  const { data: correctAmountData, isLoading: isLoadingCorrectAmount } = useQuery<POSCorrectAnswer | null>({
    queryKey: ['posCorrectAmount', patientId],
    queryFn: () => getPOSCorrectAmount(patientId),
    enabled: !!patientId,
    retry: (failureCount, error: any) => {
        if (error?.message?.includes('404')) {
            return false;
        }
        return failureCount < 2;
    },
  });

  const { data: drugAnswers, isLoading: isLoadingAllAnswers } = useQuery<Record<string, DispensingAnswer | null>>({
    queryKey: ['allDrugAnswers', patientId, prescriptionDetails],
    queryFn: async () => {
        if (!prescriptionDetails) return {};
        const answerPromises = prescriptionDetails.map(drug => 
            getDispensingAnswers(patientId, drug.cover_id)
        );
        const results = await Promise.allSettled(answerPromises);
        const answers: Record<string, DispensingAnswer | null> = {};
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                answers[prescriptionDetails[index].cover_id] = result.value;
            }
        });
        return answers;
    },
    enabled: !!prescriptionDetails && prescriptionDetails.length > 0
  });

  useEffect(() => {
    if (correctAmountData) {
      setBillValue(correctAmountData.value);
    }
  }, [correctAmountData]);
  
  const saveBillMutation = useMutation({
    mutationFn: saveCorrectBillValue,
    onSuccess: () => {
        toast({ title: "Success!", description: "The correct bill value has been saved." });
        queryClient.invalidateQueries({ queryKey: ['posCorrectAmount', patientId] });
    },
    onError: (error: Error) => {
        toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    }
  });

  const handleSave = () => {
    const numericValue = parseFloat(billValue);
    if (isNaN(numericValue) || numericValue < 0) {
        toast({ variant: 'destructive', title: 'Invalid Value', description: 'Please enter a valid positive number for the bill.'});
        return;
    }
    saveBillMutation.mutate({ PresCode: patientId, value: billValue });
  };
  
  const isLoading = isLoadingPatient || isLoadingCorrectAmount || isLoadingDetails || isLoadingAllAnswers;

  return (
    <div className="p-4 md:p-8 space-y-6 pb-20">
       <Dialog open={isCalculatorOpen} onOpenChange={setIsCalculatorOpen}>
          {prescriptionDetails && drugAnswers && (
              <POSCalculatorDialog 
                  prescriptionDrugs={prescriptionDetails}
                  drugAnswers={drugAnswers}
                  onUseTotal={(total) => setBillValue(total.toFixed(2))}
                  closeDialog={() => setIsCalculatorOpen(false)}
              />
          )}
       </Dialog>
      <header>
        <Button variant="ghost" onClick={() => router.back()} className="-ml-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patient Hub
        </Button>
        <h1 className="text-3xl font-headline font-semibold mt-2">Manage Billing</h1>
        <p className="text-muted-foreground">Set the correct total bill value for {patient?.Pres_Name || 'the patient'}.</p>
      </header>
      
       <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>Billing Information</CardTitle>
            <CardDescription>Enter the correct final bill amount for this prescription challenge.</CardDescription>
        </CardHeader>
        <CardContent>
           {isLoading ? (
                <div className="max-w-md space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
           ) : (
                <div className="space-y-2 max-w-md">
                    <Label htmlFor="bill-value">Total Bill Value (LKR)</Label>
                    <div className="flex items-center gap-2">
                        <Input id="bill-value" type="number" step="0.01" value={billValue} onChange={(e) => setBillValue(e.target.value)} placeholder="0.00" />
                        <Button variant="outline" size="icon" onClick={() => setIsCalculatorOpen(true)} disabled={!prescriptionDetails}>
                            <Calculator className="h-4 w-4" />
                        </Button>
                    </div>
                     {correctAmountData && (
                        <p className="text-xs text-muted-foreground">
                            Last saved value was LKR {correctAmountData.value} on {new Date(correctAmountData.created_at).toLocaleDateString()}.
                        </p>
                    )}
                </div>
           )}
        </CardContent>
        <CardFooter>
            <Button onClick={handleSave} disabled={saveBillMutation.isPending || isLoading}>
                {saveBillMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                Save Bill Value
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
