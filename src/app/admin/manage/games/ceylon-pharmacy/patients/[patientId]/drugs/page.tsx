
"use client";

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, AlertTriangle, PlusCircle, Edit, Trash2, Save, Search, Pill, Hash, Repeat, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getPrescriptionDetails, updatePrescriptionContent, savePrescriptionContent, getFormSelectionData, getDispensingAnswers } from '@/lib/actions/games';
import type { PrescriptionDetail, FormSelectionData } from '@/lib/types';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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


const AddDrugDialog = ({ patientId, onClose }: { patientId: string, onClose: () => void }) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    
    const form = useForm<AddDrugFormValues>({
        resolver: zodResolver(addDrugSchema),
        defaultValues: { quantity: 1, coverId: `Cover${Math.floor(Date.now() / 1000)}` },
    });
    
    const { data: selectionData, isLoading: isLoadingSelectionData } = useQuery<FormSelectionData>({
        queryKey: ['formSelectionData'],
        queryFn: getFormSelectionData,
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
            onClose();
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
        }
    });

    if (isLoadingSelectionData) {
        return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin"/></div>
    }

    const onSubmit = (data: AddDrugFormValues) => {
        addDrugMutation.mutate(data);
    };

    const dailyQtyOptions = ['-', '1', '2', '3', '1/2', '4', '5', '1 1/2', '1 Drop', '10ml', '15ml', '1/4', '10U', '2 1/2', '2.5ml', '15U', '1puff', '2puff', '20ml', '30U'];

    return (
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>Add New Drug</DialogTitle>
                <DialogDescription>Add a medication and its dispensing answers to this prescription.</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <ScrollArea className="max-h-[60vh] -mr-6 pr-6">
                 <div className="p-4 bg-muted/50 relative space-y-4">
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
                </div>
                </ScrollArea>
                 <DialogFooter className="pt-6">
                     <DialogClose asChild><Button type="button" variant="outline" disabled={addDrugMutation.isPending}>Cancel</Button></DialogClose>
                     <Button type="submit" disabled={addDrugMutation.isPending}>
                        {addDrugMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        <Save className="mr-2 h-4 w-4" /> Save Drug
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    )
}

const DrugItem = ({ drug, patientId, onDelete }: { drug: PrescriptionDetail, patientId: string, onDelete: (drug: PrescriptionDetail) => void }) => {
    const queryClient = useQueryClient();
    const [content, setContent] = useState(drug.content);
    
    const updateMutation = useMutation({
        mutationFn: updatePrescriptionContent,
        onSuccess: (updatedDrug) => {
            queryClient.setQueryData<PrescriptionDetail[]>(['prescriptionDetails', patientId], (oldData) =>
                oldData ? oldData.map(d => d.cover_id === updatedDrug.cover_id ? { ...updatedDrug, pres_code: drug.pres_code } : d) : []
            );
            toast({ title: 'Content Updated', description: `Drug content for ${updatedDrug.cover_id} has been saved.` });
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
            // Revert on error
            setContent(drug.content);
        },
    });

    const handleSave = () => {
        if (content !== drug.content) {
            updateMutation.mutate({ pres_code: drug.pres_code, cover_id: drug.cover_id, content: content });
        }
    };

    return (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 gap-2">
            <Input 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="text-sm font-medium flex-grow bg-background"
                disabled={updateMutation.isPending}
            />
            <div className="flex items-center gap-1">
                 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSave} disabled={updateMutation.isPending || content === drug.content}>
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/manage/games/ceylon-pharmacy/patients/${patientId}/drugs/edit/${drug.cover_id}`}>
                        <Edit className="h-4 w-4 mr-2" /> Answers
                    </Link>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(drug)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};


export default function ManageDrugsPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId as string;
  const [drugToDelete, setDrugToDelete] = useState<PrescriptionDetail | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: prescriptionDetails, isLoading, isError, error } = useQuery<PrescriptionDetail[]>({
    queryKey: ['prescriptionDetails', patientId],
    queryFn: () => getPrescriptionDetails(patientId),
    enabled: !!patientId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (coverId: string) => {
        // Placeholder for delete logic. In a real app, you would call an API endpoint.
        console.log("Deleting drug with coverId:", coverId);
        await new Promise(resolve => setTimeout(resolve, 500)); 
    },
    onSuccess: (data, coverId) => {
      queryClient.setQueryData<PrescriptionDetail[]>(['prescriptionDetails', patientId], (oldData) => 
          oldData ? oldData.filter(d => d.cover_id !== coverId) : []
      );
      toast({ title: 'Drug Removed', description: 'The drug has been removed from the prescription.' });
    },
    onError: (error: Error) => {
        toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
    },
    onSettled: () => setDrugToDelete(null),
  });

  const handleDeleteConfirm = () => {
    if (drugToDelete) {
        // This is a mock deletion since there's no backend endpoint for it yet.
        // It optimistically updates the UI.
        deleteMutation.mutate(drugToDelete.cover_id);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 pb-20">
       <AlertDialog open={!!drugToDelete} onOpenChange={() => setDrugToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete the drug "{drugToDelete?.content}" from this prescription.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>
                    {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
       <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
           <AddDrugDialog patientId={patientId} onClose={() => setIsAddOpen(false)} />
       </Dialog>

      <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <Button variant="ghost" onClick={() => router.back()} className="-ml-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patient Hub
          </Button>
          <h1 className="text-3xl font-headline font-semibold mt-2">Manage Prescription Drugs</h1>
          <p className="text-muted-foreground">Add, edit, or remove medications for this prescription.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4"/> Add Drug
        </Button>
      </header>
      
      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>Drug List</CardTitle>
            <CardDescription>{prescriptionDetails?.length || 0} drugs currently in this prescription.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading && (
                 <div className="space-y-3">
                    <Skeleton className="h-12 w-full"/>
                    <Skeleton className="h-12 w-full"/>
                 </div>
            )}
            {isError && <p className="text-destructive">{(error as Error).message}</p>}
            <div className="space-y-3">
                {!isLoading && !isError && prescriptionDetails && prescriptionDetails.length > 0 ? (
                    prescriptionDetails.map(drug => (
                        <DrugItem key={drug.cover_id} drug={drug} patientId={patientId} onDelete={setDrugToDelete} />
                    ))
                ) : !isLoading && (
                    <p className="text-center py-8 text-muted-foreground">No drugs have been added to this prescription yet.</p>
                )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
