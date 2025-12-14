
"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, PlusCircle, Save, Trash2, Calculator } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { allInstructions } from '@/lib/ceylon-pharmacy-data';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import type { MasterProduct } from '@/lib/types';
import { getMasterProducts } from '@/lib/actions/games';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const drugSchema = z.object({
  drugName: z.string().min(1, 'Required'),
  quantity: z.coerce.number().min(1),
});

const patientFormSchema = z.object({
  // Patient Details
  name: z.string().min(1, 'Patient name is required'),
  age: z.string().min(1, 'Age is required'),
  initialTime: z.coerce.number().min(30, 'Time must be at least 30 seconds'),
  address: z.string().optional(),
  patient_description: z.string().optional(),

  // Prescription Details
  prescription_name: z.string().min(1, 'Prescription name is required'),
  doctor_name: z.string().min(1, 'Doctor name is required'),
  notes: z.string().optional(),
  totalBillValue: z.coerce.number().min(0, 'Bill value must be a positive number'),
  
  // Drugs
  drugs: z.array(drugSchema).min(1, 'At least one drug is required'),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

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

const AdminPOSCalculator = ({ drugs, onUseTotal, closeDialog }: { drugs: { coverId: string; quantity: number }[]; onUseTotal: (total: number) => void; closeDialog: () => void; }) => {
    const { data: masterProducts, isLoading } = useQuery<MasterProduct[]>({
        queryKey: ['masterProducts'],
        queryFn: getMasterProducts,
    });

    const [selectedProducts, setSelectedProducts] = useState<Record<string, string>>({});
    const [discount, setDiscount] = useState('0');

    const billItems = useMemo(() => {
        if (!masterProducts || !drugs) return [];
        return drugs.map((drug, index) => {
            const selectedProductId = selectedProducts[index] || '';
            const product = masterProducts.find(p => p.product_id === selectedProductId);
            const price = product ? parseFloat(product.SellingPrice) : 0;
            return {
                index: index,
                name: drug.coverId,
                quantity: drug.quantity,
                price: price,
                total: price * drug.quantity,
                productId: selectedProductId,
            };
        });
    }, [drugs, masterProducts, selectedProducts]);

    const subtotal = useMemo(() => billItems.reduce((acc, item) => acc + item.total, 0), [billItems]);
    const total = subtotal - parseFloat(discount || '0');

    const handleProductSelect = (drugIndex: number, productId: string) => {
        setSelectedProducts(prev => ({
            ...prev,
            [drugIndex]: productId,
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
                <DialogDescription>Calculate the correct bill total for this prescription.</DialogDescription>
            </DialogHeader>
            {isLoading ? (
                <div className="space-y-2"><p>Loading product prices...</p></div>
            ) : (
                <div className="space-y-3 py-4">
                    <div className="border rounded-lg max-h-60 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-2 text-left font-medium">Item</th>
                                    <th className="p-2 text-center font-medium">Qty</th>
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
                                        <td className="p-2 text-center">{item.quantity}</td>
                                        <td className="p-2 text-right font-semibold">{item.total.toFixed(2)}</td>
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

export default function CreatePatientPage() {
  const router = useRouter();
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      initialTime: 300,
      totalBillValue: 0,
      drugs: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "drugs",
  });
  
  const watchedDrugs = form.watch('drugs');

  const onSubmit = (data: PatientFormValues) => {
    console.log("Submitting New Patient Data:", data);
    toast({
        title: 'Patient Created!',
        description: `${data.name} has been added to the game.`
    });
    router.push('/admin/manage/games/ceylon-pharmacy/patients');
  };

  return (
    <div className="p-4 md:p-8 space-y-6 pb-20">
       <header>
            <Button variant="ghost" onClick={() => router.back()} className="-ml-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patient List
            </Button>
            <h1 className="text-3xl font-headline font-semibold mt-2">Add New Patient</h1>
            <p className="text-muted-foreground">Create a new patient and their full prescription for the game.</p>
        </header>

        <form onSubmit={form.handleSubmit(onSubmit)}>
             {/* --- Main Details Row --- */}
            <Card className="shadow-lg mb-6">
                <CardHeader>
                    <CardTitle>Prescription Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                    <div className="space-y-2"><Label>Patient Name*</Label><Input {...form.register('name')} />{form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}</div>
                    <div className="space-y-2"><Label>Patient Age*</Label><Input {...form.register('age')} placeholder="e.g. 45 Years" />{form.formState.errors.age && <p className="text-xs text-destructive">{form.formState.errors.age.message}</p>}</div>
                    <div className="space-y-2"><Label>Initial Time (seconds)*</Label><Input type="number" {...form.register('initialTime')} />{form.formState.errors.initialTime && <p className="text-xs text-destructive">{form.formState.errors.initialTime.message}</p>}</div>
                    <div className="space-y-2"><Label>Address</Label><Input {...form.register('address')} /></div>
                    <div className="space-y-2"><Label>Doctor's Name*</Label><Input {...form.register('doctor_name')} />{form.formState.errors.doctor_name && <p className="text-xs text-destructive">{form.formState.errors.doctor_name.message}</p>}</div>
                    <div className="space-y-2">
                        <Label>Total Bill Value (LKR)*</Label>
                        <div className="flex gap-2">
                            <Input type="number" step="0.01" {...form.register('totalBillValue')} className="flex-grow" />
                            <Dialog open={isCalculatorOpen} onOpenChange={setIsCalculatorOpen}>
                                <DialogTrigger asChild>
                                    <Button type="button" variant="outline" size="icon"><Calculator className="h-4 w-4"/></Button>
                                </DialogTrigger>
                                <AdminPOSCalculator 
                                    drugs={watchedDrugs.map(d => ({ coverId: d.drugName, quantity: d.quantity }))}
                                    onUseTotal={(total) => form.setValue('totalBillValue', total)}
                                    closeDialog={() => setIsCalculatorOpen(false)}
                                />
                            </Dialog>
                        </div>
                        {form.formState.errors.totalBillValue && <p className="text-xs text-destructive">{form.formState.errors.totalBillValue.message}</p>}
                    </div>
                     <div className="space-y-2 lg:col-span-3"><Label>Patient Description</Label><Textarea {...form.register('patient_description')} rows={2}/></div>
                     <div className="space-y-2 lg:col-span-3"><Label>Prescription Notes</Label><Textarea {...form.register('notes')} rows={2}/></div>
                </CardContent>
            </Card>

            {/* --- Drugs Content Section --- */}
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Prescribed Drugs (Content)</CardTitle>
                    {form.formState.errors.drugs?.root && <p className="text-sm text-destructive font-medium">{form.formState.errors.drugs.root.message}</p>}
                </CardHeader>
                <CardContent className="space-y-4">
                    {fields.map((field, index) => (
                        <Card key={field.id} className="p-4 bg-muted/50 relative">
                             <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => remove(index)}><Trash2 className="h-4 w-4"/></Button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Cover ID*</Label><Input {...form.register(`drugs.${index}.drugName`)} />{form.formState.errors.drugs?.[index]?.drugName && <p className="text-xs text-destructive">Required</p>}</div>
                                <div className="space-y-2"><Label>Quantity*</Label><Input type="number" {...form.register(`drugs.${index}.quantity`)} />{form.formState.errors.drugs?.[index]?.quantity && <p className="text-xs text-destructive">Required</p>}</div>
                            </div>
                        </Card>
                    ))}
                    <Button type="button" variant="outline" className="w-full" onClick={() => append({ drugName: '', quantity: 1, })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Another Drug
                    </Button>
                </CardContent>
            </Card>

            <div className="flex justify-end mt-6">
                <Button type="submit" size="lg">
                    <Save className="mr-2 h-4 w-4" /> Create Patient
                </Button>
            </div>
        </form>
    </div>
  );
}
