
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, PlusCircle, Save, Trash2, Loader2, AlertTriangle, Search, Calculator, Check, ChevronsUpDown, Pill, Hash, Repeat, Clock, Calendar as CalendarIcon, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCeylonPharmacyPrescriptions, getPrescriptionDetails, getAllCareInstructions, getMasterProducts, getFormSelectionData, savePrescription } from '@/lib/actions/games';
import type { GamePatient, PrescriptionDetail, Instruction, MasterProduct, FormSelectionData, PrescriptionSubmissionPayload } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useAuth } from '@/contexts/AuthContext';


const drugSchema = z.object({
  id: z.string(),
  coverId: z.string().min(1, 'Cover ID is required'),
  content: z.string().min(1, 'Prescription content is required'),
  correctDrugName: z.string().min(1, 'Correct Drug Name is required'),
  quantity: z.coerce.number().min(1, 'Quantity is required'),
  correctInstructionIds: z.array(z.string()).optional(),
  
  // Fields from student side
  dosageForm: z.string().nonempty("Dosage form is required."),
  morningQty: z.string().nonempty("Morning quantity is required."),
  afternoonQty: z.string().nonempty("Afternoon quantity is required."),
  eveningQty: z.string().nonempty("Evening quantity is required."),
  nightQty: z.string().nonempty("Night quantity is required."),
  mealType: z.string().nonempty("Meal type is required."),
  usingFrequency: z.string().nonempty("Using frequency is required."),
  at_a_time: z.string().nonempty("This field is required."),
  hour_qty: z.string().optional(),
  additionalInstruction: z.string().optional(),
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
  pres_date: z.string().min(1, 'Prescription date is required'),
  doctor_name: z.string().min(1, 'Doctor name is required'),
  notes: z.string().optional(),
  totalBillValue: z.coerce.number().min(0, 'Bill value must be a positive number'),
  
  // Drugs
  drugs: z.array(drugSchema).min(1, 'At least one drug is required'),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;


const SelectionDialog = ({ triggerText, title, options, onSelect, icon: Icon, value }: { triggerText: string, title: string, options: string[], onSelect: (value: string) => void, icon: React.ElementType, value: string; }) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    const filteredOptions = useMemo(() => {
        const sortedOptions = [...options].sort((a, b) => a.localeCompare(b));
        if (!searchTerm) return sortedOptions;
        return sortedOptions.filter(option => option.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [options, searchTerm]);

    return (
        <Dialog onOpenChange={(open) => !open && setSearchTerm('')}>
            <DialogTrigger asChild>
            <Button variant="outline" className="w-full justify-start pl-10 relative h-10 text-sm">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <span className="truncate">{value || triggerText}</span>
            </Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
                <DialogTitle>Select {title}</DialogTitle>
                 <div className="relative pt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search options..." 
                        className="pl-10" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </DialogHeader>
            <ScrollArea className="max-h-[50vh]">
                <div className="py-2 grid grid-cols-2 gap-2 pr-4">
                    {filteredOptions.map((option, index) => (
                    <DialogClose asChild key={`${option}-${index}`}>
                        <Button variant="outline" onClick={() => onSelect(option)} className="h-auto min-h-12 whitespace-normal break-words text-left justify-start p-2">
                            {option}
                        </Button>
                    </DialogClose>
                    ))}
                    {filteredOptions.length === 0 && <p className="col-span-2 text-center text-sm text-muted-foreground py-4">No results found.</p>}
                </div>
            </ScrollArea>
            </DialogContent>
        </Dialog>
    )
};


const InstructionSelectionDialog = ({
    selectedIds,
    onSelectionChange,
    trigger
}: {
    selectedIds: string[],
    onSelectionChange: (newIds: string[]) => void,
    trigger: React.ReactNode,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentSelectedIds, setCurrentSelectedIds] = useState(selectedIds);

    const { data: allInstructions = [], isLoading } = useQuery<Instruction[]>({
        queryKey: ['allCareInstructions'],
        queryFn: getAllCareInstructions,
    });
    
    useEffect(() => {
        if(isOpen) {
            setCurrentSelectedIds(selectedIds);
        }
    }, [isOpen, selectedIds]);

    const uniqueInstructions = useMemo(() => {
        const seen = new Set<string>();
        return allInstructions.filter(instruction => {
            const lowercased = instruction.instruction.toLowerCase();
            if (seen.has(lowercased) || !instruction.instruction) {
                return false;
            }
            seen.add(lowercased);
            return true;
        }).sort((a,b) => a.instruction.localeCompare(b.instruction));
    }, [allInstructions]);

    const filteredInstructions = useMemo(() => {
        if (!searchTerm) return uniqueInstructions;
        return uniqueInstructions.filter(inst => inst.instruction.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [uniqueInstructions, searchTerm]);

    const handleToggle = (instructionId: string) => {
        setCurrentSelectedIds(prev =>
            prev.includes(instructionId) ? prev.filter(id => id !== instructionId) : [...prev, instructionId]
        );
    };

    const handleConfirm = () => {
        onSelectionChange(currentSelectedIds);
        setIsOpen(false);
    };

    return (
         <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Select Counselling Instructions</DialogTitle>
                     <div className="relative pt-2">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
                        <Input placeholder="Search instructions..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </DialogHeader>
                <ScrollArea className="max-h-[50vh] pr-4 -mr-4">
                    <div className="space-y-2">
                        {isLoading ? (
                            <p>Loading instructions...</p>
                        ) : (
                            filteredInstructions.map(inst => (
                                <div key={inst.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50">
                                    <Checkbox
                                        id={`dialog-inst-${inst.id}`}
                                        checked={currentSelectedIds.includes(inst.id)}
                                        onCheckedChange={() => handleToggle(inst.id)}
                                    />
                                    <Label htmlFor={`dialog-inst-${inst.id}`} className="text-sm font-normal w-full cursor-pointer">{inst.instruction}</Label>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirm}>Confirm Selection</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

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


// --- New POS Calculator Component ---
const AdminPOSCalculator = ({ drugs, onUseTotal, closeDialog }: { drugs: { coverId: string; quantity: number, content: string }[]; onUseTotal: (total: number) => void; closeDialog: () => void; }) => {
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
                name: drug.content,
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
        <>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Calculator className="h-5 w-5"/>POS Bill Calculator</DialogTitle>
                    <DialogDescription>Calculate the correct bill total for this prescription.</DialogDescription>
                </DialogHeader>
                {isLoading ? (
                    <div className="space-y-2"><p>Loading product prices...</p><Skeleton className="h-20 w-full" /></div>
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
        </>
    );
};


export default function EditPatientPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId as string; // This is prescription_id
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: patient, isLoading: isLoadingPatient, isError, error } = useQuery<GamePatient>({
      queryKey: ['ceylonPharmacyPatient', patientId],
      queryFn: async () => {
          const allPatients = await getCeylonPharmacyPrescriptions('admin-user', 'CPCC20');
          const foundPatient = allPatients.find(p => p.prescription_id === patientId);
          if (!foundPatient) throw new Error('Patient not found');
          return foundPatient;
      },
      enabled: !!patientId,
  });

  const { data: prescriptionDetails } = useQuery<PrescriptionDetail[]>({
      queryKey: ['prescriptionDetails', patientId],
      queryFn: () => getPrescriptionDetails(patientId),
      enabled: !!patient,
  });
  
  const { data: allInstructions = [] } = useQuery<Instruction[]>({
      queryKey: ['allCareInstructions'],
      queryFn: getAllCareInstructions,
  });
  
  const { data: selectionData, isLoading: isLoadingSelectionData } = useQuery<FormSelectionData>({
    queryKey: ['formSelectionData'],
    queryFn: getFormSelectionData,
  });

  const instructionMap = useMemo(() => {
    return allInstructions.reduce((acc, inst) => {
        acc[inst.id] = inst.instruction;
        return acc;
    }, {} as Record<string, string>);
  }, [allInstructions]);


  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      drugs: [],
    },
  });
  
   const saveMutation = useMutation({
    mutationFn: (data: { prescriptionPayload: PrescriptionSubmissionPayload, drugs: PatientFormValues['drugs'], prescriptionId: string }) => 
        savePrescription(data.prescriptionPayload, data.drugs, data.prescriptionId),
    onSuccess: () => {
        toast({
            title: 'Patient Updated!',
            description: `The prescription details have been saved.`
        });
        queryClient.invalidateQueries({ queryKey: ['ceylonPharmacyPatient', patientId] });
        queryClient.invalidateQueries({ queryKey: ['prescriptionDetails', patientId] });
    },
    onError: (error: Error) => {
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: error.message,
        });
    }
  });


  useEffect(() => {
    if (patient && prescriptionDetails) {
        form.reset({
            name: patient.Pres_Name,
            age: patient.Pres_Age,
            initialTime: 3600, // This is not in the API response, so we use a default
            address: patient.address,
            patient_description: patient.patient_description,
            prescription_name: patient.prescription_name,
            pres_date: patient.pres_date,
            doctor_name: patient.doctor_name,
            notes: patient.notes,
            totalBillValue: 0, // Placeholder
            drugs: prescriptionDetails.map((drug, index) => ({
                id: drug.cover_id,
                coverId: drug.cover_id,
                content: drug.content, 
                correctDrugName: "",
                quantity: 1,
                correctInstructionIds: [],
                dosageForm: "", morningQty: "", afternoonQty: "", eveningQty: "", nightQty: "", mealType: "",
                usingFrequency: "", at_a_time: "", hour_qty: "", additionalInstruction: ""
            })),
        });
    }
  }, [patient, prescriptionDetails, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "drugs",
  });
  
  const watchedDrugs = form.watch('drugs');

  const onSubmit = (data: PatientFormValues) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to save.'});
        return;
    }
    
    const prescriptionPayload: PrescriptionSubmissionPayload = {
      prescription_name: data.prescription_name,
      prescription_status: patient?.prescription_status || "Active",
      created_at: patient?.created_at || format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      created_by: user.username || 'admin',
      Pres_Name: data.name,
      pres_date: data.pres_date,
      Pres_Age: parseInt(data.age, 10),
      Pres_Method: patient?.Pres_Method || 'N/A',
      doctor_name: data.doctor_name,
      notes: data.notes || '',
      patient_description: data.patient_description || '',
      address: data.address || '',
    };
    
    saveMutation.mutate({ prescriptionPayload, drugs: data.drugs, prescriptionId: patient!.prescription_id });
  };
  
  const isLoading = isLoadingPatient || isLoadingSelectionData;

  if (isLoading) {
      return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></div>
  }
  
  if (isError) {
      return (
          <div className="p-8 text-center">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="font-semibold">Failed to load patient data.</p>
              <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
          </div>
      )
  }
  
  const dailyQtyOptions = ['-', '1', '2', '3', '1/2', '4', '5', '1 1/2', '1 Drop', '10ml', '15ml', '1/4', '10U', '2 1/2', '2.5ml', '15U', '1puff', '2puff', '20ml', '30U']; 

  return (
    <div className="p-4 md:p-8 space-y-6 pb-20">
       <header>
            <Button variant="ghost" onClick={() => router.back()} className="-ml-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patient Hub
            </Button>
            <h1 className="text-3xl font-headline font-semibold mt-2">Edit Patient: {patient?.Pres_Name}</h1>
            <p className="text-muted-foreground">Modify the patient's details and prescription for the game.</p>
        </header>

        <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* --- Main Details Row --- */}
            <Card className="shadow-lg mb-6">
                <CardHeader>
                    <CardTitle>Prescription Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                     <div className="space-y-2">
                        <Label>Prescription Name*</Label>
                        <Input {...form.register('prescription_name')} placeholder="e.g. Regular Checkup"/>
                        {form.formState.errors.prescription_name && <p className="text-xs text-destructive">{form.formState.errors.prescription_name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Patient Name*</Label>
                        <SelectionDialog triggerText="Select Name" title="Patient Name" options={selectionData?.name || []} onSelect={(val) => form.setValue("name", val, { shouldValidate: true })} icon={User} value={form.watch('name')} />
                        {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label>Prescription Date*</Label>
                        <Controller
                            control={form.control}
                            name="pres_date"
                            render={({ field }) => (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start text-left font-normal h-10 text-sm">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={field.value ? new Date(field.value) : undefined}
                                            onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}
                        />
                        {form.formState.errors.pres_date && <p className="text-xs text-destructive">{form.formState.errors.pres_date.message}</p>}
                    </div>
                    <div className="space-y-2"><Label>Patient Age*</Label><Input {...form.register('age')} placeholder="e.g. 45 Years" />{form.formState.errors.age && <p className="text-xs text-destructive">{form.formState.errors.age.message}</p>}</div>
                    <div className="space-y-2"><Label>Initial Time (seconds)*</Label><Input type="number" {...form.register('initialTime')} />{form.formState.errors.initialTime && <p className="text-xs text-destructive">{form.formState.errors.initialTime.message}</p>}</div>
                    <div className="space-y-2"><Label>Address</Label><Input {...form.register('address')} /></div>
                    <div className="space-y-2"><Label>Doctor's Name*</Label><Input {...form.register('doctor_name')} />{form.formState.errors.doctor_name && <p className="text-xs text-destructive">{form.formState.errors.doctor_name.message}</p>}</div>
                    <div className="space-y-2 lg:col-span-3"><Label>Patient Description</Label><Textarea {...form.register('patient_description')} rows={2}/></div>
                    <div className="space-y-2 lg:col-span-3"><Label>Prescription Notes</Label><Textarea {...form.register('notes')} rows={2}/></div>
                </CardContent>
            </Card>

            {/* --- Drugs Content Section --- */}
            <Card className="shadow-lg mb-6">
                <CardHeader>
                    <CardTitle>Prescribed Drugs</CardTitle>
                    {form.formState.errors.drugs?.root && <p className="text-sm text-destructive font-medium">{form.formState.errors.drugs.root.message}</p>}
                </CardHeader>
                <CardContent className="space-y-4">
                    {fields.map((field, index) => (
                        <Card key={field.id} className="p-4 bg-muted/50 relative">
                             <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => remove(index)}><Trash2 className="h-4 w-4"/></Button>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Cover ID*</Label>
                                  <Input {...form.register(`drugs.${index}.coverId`)} readOnly className="font-mono bg-gray-200" />
                                </div>
                                <div className="space-y-2">
                                  <Label>Prescription Content*</Label>
                                  <Input {...form.register(`drugs.${index}.content`)} placeholder="e.g. Tab Metformin 500mg..." />
                                  {form.formState.errors.drugs?.[index]?.content && <p className="text-xs text-destructive">Required</p>}
                                </div>
                                <div className="space-y-2">
                                  <Label>Correct Drug Name*</Label>
                                  <SelectionDialog triggerText="Select Drug" title="Correct Drug" options={selectionData?.drug_name || []} onSelect={(val) => form.setValue(`drugs.${index}.correctDrugName`, val)} icon={Pill} value={form.watch(`drugs.${index}.correctDrugName`)} />
                                  {form.formState.errors.drugs?.[index]?.correctDrugName && <p className="text-xs text-destructive">Required</p>}
                                </div>
                                <div className="space-y-2"><Label>Quantity*</Label><Input type="number" {...form.register(`drugs.${index}.quantity`)} />{form.formState.errors.drugs?.[index]?.quantity && <p className="text-xs text-destructive">Required</p>}</div>
                            </div>

                            <Separator className="my-4" />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2"><Label>Morning Qty*</Label><SelectionDialog triggerText="Qty" title="Morning Quantity" options={dailyQtyOptions} onSelect={(val) => form.setValue(`drugs.${index}.morningQty`, val)} icon={Hash} value={form.watch(`drugs.${index}.morningQty`)} /></div>
                                <div className="space-y-2"><Label>Afternoon Qty*</Label><SelectionDialog triggerText="Qty" title="Afternoon Quantity" options={dailyQtyOptions} onSelect={(val) => form.setValue(`drugs.${index}.afternoonQty`, val)} icon={Hash} value={form.watch(`drugs.${index}.afternoonQty`)} /></div>
                                <div className="space-y-2"><Label>Evening Qty*</Label><SelectionDialog triggerText="Qty" title="Evening Quantity" options={dailyQtyOptions} onSelect={(val) => form.setValue(`drugs.${index}.eveningQty`, val)} icon={Hash} value={form.watch(`drugs.${index}.eveningQty`)} /></div>
                                <div className="space-y-2"><Label>Night Qty*</Label><SelectionDialog triggerText="Qty" title="Night Quantity" options={dailyQtyOptions} onSelect={(val) => form.setValue(`drugs.${index}.nightQty`, val)} icon={Hash} value={form.watch(`drugs.${index}.nightQty`)} /></div>
                            </div>
                            
                            <Separator className="my-4" />
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Dosage Form*</Label><SelectionDialog triggerText="Select Form" title="Dosage Form" options={selectionData?.drug_type || []} onSelect={(val) => form.setValue(`drugs.${index}.dosageForm`, val)} icon={Pill} value={form.watch(`drugs.${index}.dosageForm`)} /></div>
                                <div className="space-y-2"><Label>Meal Type*</Label><SelectionDialog triggerText="Select Meal Type" title="Meal Type" options={selectionData?.meal_type || []} onSelect={(val) => form.setValue(`drugs.${index}.mealType`, val)} icon={Pill} value={form.watch(`drugs.${index}.mealType`)} /></div>
                                <div className="space-y-2"><Label>Using Frequency*</Label><SelectionDialog triggerText="Select Frequency" title="Using Frequency" options={selectionData?.using_type || []} onSelect={(val) => form.setValue(`drugs.${index}.usingFrequency`, val)} icon={Repeat} value={form.watch(`drugs.${index}.usingFrequency`)} /></div>
                                <div className="space-y-2"><Label>At a Time*</Label><SelectionDialog triggerText="e.g. 5ml" title="At a Time" options={selectionData?.at_a_time || []} onSelect={(val) => form.setValue(`drugs.${index}.at_a_time`, val)} icon={Hash} value={form.watch(`drugs.${index}.at_a_time`)} /></div>
                                <div className="space-y-2"><Label>Hour Quantity</Label><SelectionDialog triggerText="e.g. 8" title="Hour Quantity" options={selectionData?.hour_qty || []} onSelect={(val) => form.setValue(`drugs.${index}.hour_qty`, val)} icon={Clock} value={form.watch(`drugs.${index}.hour_qty`) || ''} /></div>
                                <div className="space-y-2"><Label>Additional Description</Label><SelectionDialog triggerText="Select Description" title="Additional Description" options={selectionData?.additional_description || []} onSelect={(val) => form.setValue(`drugs.${index}.additionalInstruction`, val)} icon={Pill} value={form.watch(`drugs.${index}.additionalInstruction`) || ''} /></div>
                            </div>
                            
                            <Separator className="my-4" />
                            <div className="md:col-span-2 space-y-2">
                                <Controller
                                    control={form.control}
                                    name={`drugs.${index}.correctInstructionIds`}
                                    render={({ field: { onChange, value } }) => (
                                        <InstructionSelectionDialog
                                            selectedIds={value || []}
                                            onSelectionChange={onChange}
                                            trigger={
                                                <div className="space-y-2">
                                                    <Label>Correct Counselling Instructions</Label>
                                                    <Button type="button" variant="outline" className="w-full justify-start text-left font-normal">
                                                        {value && value.length > 0 ? `${value.length} instruction(s) selected` : "Select instructions..."}
                                                    </Button>
                                                      {value && value.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {value.map(id => (
                                                                <Badge key={id} variant="secondary" className="font-normal">{instructionMap[id] || 'Unknown'}</Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            }
                                        />
                                    )}
                                />
                            </div>
                        </Card>
                    ))}
                    <Button type="button" variant="outline" className="w-full" onClick={() => {
                        const newIndex = fields.length + 1;
                        append({ 
                            id: `new-${Date.now()}`,
                            coverId: `Cover${newIndex}`,
                            content: '', 
                            correctDrugName: '', 
                            quantity: 1, 
                            correctInstructionIds: [], 
                            dosageForm: "", morningQty: "", afternoonQty: "", eveningQty: "", nightQty: "", mealType: "",
                            usingFrequency: "", at_a_time: "", hour_qty: "", additionalInstruction: "" 
                        })
                    }}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Another Drug
                    </Button>
                </CardContent>
            </Card>

             <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Bill Value</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label>Total Bill Value (LKR)*</Label>
                        <div className="flex gap-2">
                            <Input type="number" step="0.01" {...form.register('totalBillValue')} className="flex-grow" />
                            <Dialog open={isCalculatorOpen} onOpenChange={setIsCalculatorOpen}>
                                <DialogTrigger asChild>
                                    <Button type="button" variant="outline" size="icon"><Calculator className="h-4 w-4"/></Button>
                                </DialogTrigger>
                                <AdminPOSCalculator 
                                    drugs={watchedDrugs.map(d => ({ coverId: d.coverId, quantity: d.quantity, content: d.content }))}
                                    onUseTotal={(total) => form.setValue('totalBillValue', total)}
                                    closeDialog={() => setIsCalculatorOpen(false)}
                                />
                            </Dialog>
                        </div>
                        {form.formState.errors.totalBillValue && <p className="text-xs text-destructive">{form.formState.errors.totalBillValue.message}</p>}
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end mt-6">
                <Button type="submit" size="lg" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                    Save All Changes
                </Button>
            </div>
        </form>
    </div>
  );
}
