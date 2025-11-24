
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
import { ArrowLeft, PlusCircle, Save, Trash2, Loader2, AlertTriangle, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery } from '@tanstack/react-query';
import { getCeylonPharmacyPrescriptions, getPrescriptionDetails, getAllCareInstructions } from '@/lib/actions/games';
import type { GamePatient, PrescriptionDetail, Instruction } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


const drugSchema = z.object({
    id: z.string(), // Keep track of existing drugs
    drugName: z.string().min(1, 'Required'),
    genericName: z.string().optional(),
    quantity: z.coerce.number().min(1),
    lines: z.string().min(1, 'Required'),
    correctInstructionIds: z.array(z.string()).optional(),
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


export default function EditPatientPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId as string; // This is prescription_id

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

  useEffect(() => {
    if (patient && prescriptionDetails) {
        form.reset({
            name: patient.Pres_Name,
            age: patient.Pres_Age,
            initialTime: 3600, // This is not in the API response, so we use a default
            address: patient.address,
            patient_description: patient.patient_description,
            prescription_name: patient.prescription_name,
            doctor_name: patient.doctor_name,
            notes: patient.notes,
            totalBillValue: 0, // Placeholder
            drugs: prescriptionDetails.map(drug => ({
                id: drug.cover_id,
                drugName: drug.content, 
                genericName: '', // Not in API
                quantity: 1, // Not in API
                lines: drug.content, // Not ideal, but what we have
                correctInstructionIds: [], // To be fetched separately
            })),
        });
    }
  }, [patient, prescriptionDetails, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "drugs",
  });

  const onSubmit = (data: PatientFormValues) => {
    console.log("Updating Patient Data:", data);
    toast({
        title: 'Patient Updated!',
        description: `${data.name}'s details have been saved.`
    });
    router.push('/admin/manage/games/ceylon-pharmacy/patients');
  };
  
  if (isLoadingPatient) {
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

  return (
    <div className="p-4 md:p-8 space-y-6 pb-20">
       <header>
            <Button variant="ghost" onClick={() => router.back()} className="-ml-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patient List
            </Button>
            <h1 className="text-3xl font-headline font-semibold mt-2">Edit Patient: {patient?.Pres_Name}</h1>
            <p className="text-muted-foreground">Modify the patient's details and prescription for the game.</p>
        </header>

        <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* --- Patient & Prescription Info Column --- */}
                <div className="lg:col-span-1 space-y-6 sticky top-24">
                     <Card className="shadow-lg">
                        <CardHeader><CardTitle>Patient Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2"><Label>Name*</Label><Input {...form.register('name')} />{form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}</div>
                            <div className="space-y-2"><Label>Age*</Label><Input {...form.register('age')} placeholder="e.g. 45 Years" />{form.formState.errors.age && <p className="text-xs text-destructive">{form.formState.errors.age.message}</p>}</div>
                            <div className="space-y-2"><Label>Initial Time (seconds)*</Label><Input type="number" {...form.register('initialTime')} />{form.formState.errors.initialTime && <p className="text-xs text-destructive">{form.formState.errors.initialTime.message}</p>}</div>
                            <div className="space-y-2"><Label>Address</Label><Textarea {...form.register('address')} rows={2}/></div>
                            <div className="space-y-2"><Label>Patient Description</Label><Textarea {...form.register('patient_description')} rows={2}/></div>
                        </CardContent>
                    </Card>
                     <Card className="shadow-lg">
                        <CardHeader><CardTitle>Prescription Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2"><Label>Prescription Name*</Label><Input {...form.register('prescription_name')} />{form.formState.errors.prescription_name && <p className="text-xs text-destructive">{form.formState.errors.prescription_name.message}</p>}</div>
                            <div className="space-y-2"><Label>Doctor's Name*</Label><Input {...form.register('doctor_name')} />{form.formState.errors.doctor_name && <p className="text-xs text-destructive">{form.formState.errors.doctor_name.message}</p>}</div>
                            <div className="space-y-2"><Label>Total Bill Value (LKR)*</Label><Input type="number" step="0.01" {...form.register('totalBillValue')} />{form.formState.errors.totalBillValue && <p className="text-xs text-destructive">{form.formState.errors.totalBillValue.message}</p>}</div>
                            <div className="space-y-2"><Label>Notes</Label><Textarea {...form.register('notes')} rows={2}/></div>
                        </CardContent>
                    </Card>
                </div>

                {/* --- Drugs Column --- */}
                 <div className="lg:col-span-2 space-y-6">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Prescribed Drugs</CardTitle>
                            {form.formState.errors.drugs?.root && <p className="text-sm text-destructive font-medium">{form.formState.errors.drugs.root.message}</p>}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {fields.map((field, index) => (
                                <Card key={field.id} className="p-4 bg-muted/50 relative">
                                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => remove(index)}><Trash2 className="h-4 w-4"/></Button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label>Drug Name*</Label><Input {...form.register(`drugs.${index}.drugName`)} />{form.formState.errors.drugs?.[index]?.drugName && <p className="text-xs text-destructive">Required</p>}</div>
                                        <div className="space-y-2"><Label>Generic Name</Label><Input {...form.register(`drugs.${index}.genericName`)} /></div>
                                        <div className="space-y-2"><Label>Quantity*</Label><Input type="number" {...form.register(`drugs.${index}.quantity`)} />{form.formState.errors.drugs?.[index]?.quantity && <p className="text-xs text-destructive">Required</p>}</div>
                                        <div className="md:col-span-2 space-y-2"><Label>Prescription Lines (one per line)*</Label><Textarea {...form.register(`drugs.${index}.lines`)} rows={2}/>{form.formState.errors.drugs?.[index]?.lines && <p className="text-xs text-destructive">Required</p>}</div>
                                        
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

                                    </div>
                                </Card>
                            ))}
                            <Button type="button" variant="outline" className="w-full" onClick={() => append({ id: `new-${Date.now()}`, drugName: '', quantity: 1, lines: '', correctInstructionIds: [] })}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Another Drug
                            </Button>
                        </CardContent>
                    </Card>
                     <div className="flex justify-end">
                        <Button type="submit" size="lg">
                            <Save className="mr-2 h-4 w-4" /> Save Changes
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    </div>
  );
}

    