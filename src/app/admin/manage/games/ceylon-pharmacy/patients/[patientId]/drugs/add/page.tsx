
"use client";

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Loader2, Search, Pill, Hash, Repeat, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFormSelectionData, savePrescriptionContent, getCeylonPharmacyPrescriptions } from '@/lib/actions/games';
import type { FormSelectionData, GamePatient } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';


const addDrugSchema = z.object({
  coverId: z.string().min(1, 'Cover ID is required'),
  content: z.string().min(1, 'Prescription content is required'),
  correctDrugName: z.string().min(1, 'Correct Drug Name is required'),
  quantity: z.coerce.number().min(1, 'Quantity is required'),
  correctInstructionIds: z.array(z.string()).optional(),
  
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

type AddDrugFormValues = z.infer<typeof addDrugSchema>;

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


export default function AddDrugPage() {
    const router = useRouter();
    const params = useParams();
    const patientId = params.patientId as string;
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const form = useForm<AddDrugFormValues>({
        resolver: zodResolver(addDrugSchema),
        defaultValues: {
            quantity: 1,
        },
    });

    const { data: selectionData, isLoading: isLoadingSelectionData } = useQuery<FormSelectionData>({
        queryKey: ['formSelectionData'],
        queryFn: getFormSelectionData,
    });
    
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

    const addDrugMutation = useMutation({
        mutationFn: async (data: AddDrugFormValues) => {
            const contentPromise = savePrescriptionContent({
                pres_code: patientId,
                cover_id: data.coverId,
                content: data.content,
            });
            // The answers save needs another function, which isn't built yet.
            // Placeholder for now.
            const answerPromise = new Promise(resolve => setTimeout(resolve, 200));

            return Promise.all([contentPromise, answerPromise]);
        },
        onSuccess: () => {
            toast({ title: 'Drug Added!', description: 'The new drug has been added to the prescription.' });
            queryClient.invalidateQueries({ queryKey: ['prescriptionDetails', patientId] });
            router.push(`/admin/manage/games/ceylon-pharmacy/patients/${patientId}/drugs`);
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
        }
    });

    if (isLoadingPatient || isLoadingSelectionData) {
        return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin"/></div>
    }
    
    if (!patient) {
        return <div className="p-8 text-center">Patient not found.</div>
    }
    
    const onSubmit = (data: AddDrugFormValues) => {
        addDrugMutation.mutate(data);
    };

    const dailyQtyOptions = ['-', '1', '2', '3', '1/2', '4', '5', '1 1/2', '1 Drop', '10ml', '15ml', '1/4', '10U', '2 1/2', '2.5ml', '15U', '1puff', '2puff', '20ml', '30U'];


    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <Button variant="ghost" onClick={() => router.back()} className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Drug List
                </Button>
                <h1 className="text-3xl font-headline font-semibold mt-2">Add Drug to Prescription</h1>
                <p className="text-muted-foreground">For patient: {patient.Pres_Name}</p>
            </header>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card className="p-4 bg-muted/50 relative">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Cover ID*</Label>
                          <Input {...form.register(`coverId`)} placeholder="e.g. Cover1" />
                           {form.formState.errors?.coverId && <p className="text-xs text-destructive">Required</p>}
                        </div>
                        <div className="space-y-2">
                          <Label>Prescription Content*</Label>
                          <Input {...form.register(`content`)} placeholder="e.g. Tab Metformin 500mg..." />
                           {form.formState.errors?.content && <p className="text-xs text-destructive">Required</p>}
                        </div>
                        <div className="space-y-2">
                          <Label>Correct Drug Name*</Label>
                          <SelectionDialog triggerText="Select Drug" title="Correct Drug" options={selectionData?.drug_name || []} onSelect={(val) => form.setValue(`correctDrugName`, val)} icon={Pill} value={form.watch(`correctDrugName`)} />
                           {form.formState.errors?.correctDrugName && <p className="text-xs text-destructive">Required</p>}
                        </div>
                        <div className="space-y-2"><Label>Quantity*</Label><Input type="number" {...form.register(`quantity`)} />{form.formState.errors?.quantity && <p className="text-xs text-destructive">Required</p>}</div>
                    </div>
                     <Separator className="my-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2"><Label>Morning Qty*</Label><SelectionDialog triggerText="Qty" title="Morning Quantity" options={dailyQtyOptions} onSelect={(val) => form.setValue(`morningQty`, val)} icon={Hash} value={form.watch(`morningQty`)} /></div>
                        <div className="space-y-2"><Label>Afternoon Qty*</Label><SelectionDialog triggerText="Qty" title="Afternoon Quantity" options={dailyQtyOptions} onSelect={(val) => form.setValue(`afternoonQty`, val)} icon={Hash} value={form.watch(`afternoonQty`)} /></div>
                        <div className="space-y-2"><Label>Evening Qty*</Label><SelectionDialog triggerText="Qty" title="Evening Quantity" options={dailyQtyOptions} onSelect={(val) => form.setValue(`eveningQty`, val)} icon={Hash} value={form.watch(`eveningQty`)} /></div>
                        <div className="space-y-2"><Label>Night Qty*</Label><SelectionDialog triggerText="Qty" title="Night Quantity" options={dailyQtyOptions} onSelect={(val) => form.setValue(`nightQty`, val)} icon={Hash} value={form.watch(`nightQty`)} /></div>
                    </div>
                    <Separator className="my-4" />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Dosage Form*</Label><SelectionDialog triggerText="Select Form" title="Dosage Form" options={selectionData?.drug_type || []} onSelect={(val) => form.setValue(`dosageForm`, val)} icon={Pill} value={form.watch(`dosageForm`)} /></div>
                        <div className="space-y-2"><Label>Meal Type*</Label><SelectionDialog triggerText="Select Meal Type" title="Meal Type" options={selectionData?.meal_type || []} onSelect={(val) => form.setValue(`mealType`, val)} icon={Pill} value={form.watch(`mealType`)} /></div>
                        <div className="space-y-2"><Label>Using Frequency*</Label><SelectionDialog triggerText="Select Frequency" title="Using Frequency" options={selectionData?.using_type || []} onSelect={(val) => form.setValue(`usingFrequency`, val)} icon={Repeat} value={form.watch(`usingFrequency`)} /></div>
                        <div className="space-y-2"><Label>At a Time*</Label><SelectionDialog triggerText="e.g. 5ml" title="At a Time" options={selectionData?.at_a_time || []} onSelect={(val) => form.setValue(`at_a_time`, val)} icon={Hash} value={form.watch(`at_a_time`)} /></div>
                        <div className="space-y-2"><Label>Hour Quantity</Label><SelectionDialog triggerText="e.g. 8" title="Hour Quantity" options={selectionData?.hour_qty || []} onSelect={(val) => form.setValue(`hour_qty`, val)} icon={Clock} value={form.watch(`hour_qty`) || ''} /></div>
                        <div className="space-y-2"><Label>Additional Description</Label><SelectionDialog triggerText="Select Description" title="Additional Description" options={selectionData?.additional_description || []} onSelect={(val) => form.setValue(`additionalInstruction`, val)} icon={Pill} value={form.watch(`additionalInstruction`) || ''} /></div>
                    </div>
                     <CardFooter className="p-0 pt-6">
                        <Button type="submit" disabled={addDrugMutation.isPending}>
                            {addDrugMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            <Save className="mr-2 h-4 w-4" /> Save Drug
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    )
}
