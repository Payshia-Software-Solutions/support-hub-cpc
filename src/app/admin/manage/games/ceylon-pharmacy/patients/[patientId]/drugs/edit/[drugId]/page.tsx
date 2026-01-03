
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Loader2, AlertTriangle, Search, Check, ChevronsUpDown, Pill, Hash, Repeat, Clock, Calendar as CalendarIcon, User, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPrescriptionDetails, getFormSelectionData, saveOrUpdateDispensingAnswer, getDispensingAnswers } from '@/lib/actions/games';
import type { PrescriptionDetail, FormSelectionData, DispensingAnswer } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

const drugSchema = z.object({
  date: z.string().nonempty("Date is required."),
  patientName: z.string().nonempty("Patient name is required."),
  correctDrugName: z.string().min(1, 'Correct Drug Name is required'),
  quantity: z.string().min(1, 'Quantity is required'),
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

type EditDrugFormValues = z.infer<typeof drugSchema>;

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


export default function EditDrugPage() {
    const router = useRouter();
    const params = useParams();
    const { patientId, drugId } = params as { patientId: string; drugId: string };
    const queryClient = useQueryClient();
    const { user } = useAuth();
    
    const { data: drugDetails, isLoading: isLoadingDetails, isError: isDetailsError } = useQuery<PrescriptionDetail[]>({
        queryKey: ['prescriptionDetails', patientId],
        queryFn: () => getPrescriptionDetails(patientId),
        enabled: !!patientId,
    });
    
    const { data: drugAnswers, isLoading: isLoadingAnswers, isError: isAnswersError, error: answersError } = useQuery<DispensingAnswer | null>({
        queryKey: ['dispensingAnswers', patientId, drugId],
        queryFn: () => getDispensingAnswers(patientId, drugId),
        enabled: !!drugId && !!patientId,
        retry: (failureCount, error: any) => {
            if (error?.message?.includes('404')) {
                return false;
            }
            return failureCount < 2;
        },
    });
    
    const { data: selectionData, isLoading: isLoadingSelectionData } = useQuery<FormSelectionData>({
        queryKey: ['formSelectionData'],
        queryFn: getFormSelectionData,
    });
    

    const form = useForm<EditDrugFormValues>({
        resolver: zodResolver(drugSchema),
        defaultValues: {},
    });

    const drugToEdit = useMemo(() => drugDetails?.find(d => d.cover_id === drugId), [drugDetails, drugId]);
    
    const saveMutation = useMutation({
        mutationFn: saveOrUpdateDispensingAnswer,
        onSuccess: () => {
            toast({ title: 'Success', description: 'Dispensing answers have been saved.' });
            queryClient.invalidateQueries({ queryKey: ['dispensingAnswers', patientId, drugId] });
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
        }
    });

    useEffect(() => {
        if (drugToEdit) {
            const defaultValues: Partial<EditDrugFormValues> = {
                date: drugToEdit?.pres_date || format(new Date(), 'yyyy-MM-dd'),
                patientName: drugToEdit?.pres_name || '',
                quantity: "1", 
                correctDrugName: "",
                dosageForm: "",
                morningQty: "",
                afternoonQty: "",
                eveningQty: "",
                nightQty: "",
                mealType: "",
                usingFrequency: "",
                at_a_time: "",
                hour_qty: "",
                additionalInstruction: "",
            };
            
            if (drugAnswers) {
                Object.assign(defaultValues, {
                    date: drugAnswers.date || defaultValues.date,
                    patientName: drugAnswers.name || defaultValues.patientName,
                    correctDrugName: drugAnswers.drug_name || "",
                    quantity: drugAnswers.drug_qty || "1",
                    dosageForm: drugAnswers.drug_type || "",
                    morningQty: drugAnswers.morning_qty || "",
                    afternoonQty: drugAnswers.afternoon_qty || "",
                    eveningQty: drugAnswers.evening_qty || "",
                    nightQty: drugAnswers.night_qty || "",
                    mealType: drugAnswers.meal_type || "",
                    usingFrequency: drugAnswers.using_type || "",
                    at_a_time: drugAnswers.at_a_time || "",
                    hour_qty: drugAnswers.hour_qty || "",
                    additionalInstruction: drugAnswers.additional_description || "",
                });
            }
            form.reset(defaultValues as EditDrugFormValues);
        }
    }, [drugToEdit, drugAnswers, form]);
    
    const onSubmit = (data: EditDrugFormValues) => {
        if (!user || !drugToEdit) {
            toast({ variant: 'destructive', title: 'Error', description: 'User or drug data missing.' });
            return;
        }

        const payload: Omit<DispensingAnswer, 'id' | 'created_at'> & { answer_id?: string } = {
            answer_id: drugAnswers?.answer_id,
            pres_id: patientId,
            cover_id: drugId,
            date: data.date,
            name: data.patientName,
            drug_name: data.correctDrugName,
            drug_type: data.dosageForm,
            drug_qty: String(data.quantity),
            morning_qty: data.morningQty,
            afternoon_qty: data.afternoonQty,
            evening_qty: data.eveningQty,
            night_qty: data.nightQty,
            meal_type: data.mealType,
            using_type: data.usingFrequency,
            at_a_time: data.at_a_time,
            hour_qty: data.hour_qty,
            additional_description: data.additionalInstruction || '',
            created_by: user.username!,
        };
        
        saveMutation.mutate(payload);
    };

    if (isLoadingDetails || isLoadingSelectionData || isLoadingAnswers) {
        return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></div>
    }

    if (isDetailsError || !drugToEdit) {
        return (
            <div className="p-8 text-center">
                <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="font-semibold">Failed to load drug data.</p>
                <p className="text-sm text-muted-foreground">The requested drug could not be found in the prescription.</p>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                 <Button variant="ghost" onClick={() => router.back()} className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Drug List
                </Button>
                <h1 className="text-3xl font-headline font-semibold mt-2">Edit Dispensing Answers</h1>
                 <p className="text-muted-foreground">Correct answers for: {drugToEdit.content}</p>
            </header>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                 <Card className="p-4 bg-muted/50 relative shadow-lg">
                    <CardContent className="p-0">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date*</Label>
                                <Controller
                                    control={form.control}
                                    name="date"
                                    render={({ field }) => (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start text-left font-normal h-10 text-sm">
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {field.value && new Date(field.value).toString() !== 'Invalid Date' ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
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
                                {form.formState.errors.date && <p className="text-xs text-destructive">{form.formState.errors.date.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Patient Name*</Label>
                                <SelectionDialog triggerText="Select Name" title="Patient Name" options={selectionData!.name} onSelect={(val) => form.setValue("patientName", val, { shouldValidate: true })} icon={User} value={form.watch('patientName')} />
                                {form.formState.errors?.patientName && <p className="text-xs text-destructive">{form.formState.errors.patientName.message}</p>}
                            </div>
                        </div>

                         <Separator className="my-4" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                            <Label>Correct Drug Name*</Label>
                            <SelectionDialog triggerText="Select Drug" title="Correct Drug" options={selectionData!.drug_name} onSelect={(val) => form.setValue(`correctDrugName`, val)} icon={Pill} value={form.watch(`correctDrugName`)} />
                            {form.formState.errors?.correctDrugName && <p className="text-xs text-destructive">Required</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Quantity*</Label>
                                <SelectionDialog triggerText="Select Quantity" title="Quantity" options={selectionData!.drug_qty} onSelect={(val) => form.setValue("quantity", val, { shouldValidate: true })} icon={Hash} value={form.watch('quantity')} />
                                {form.formState.errors?.quantity && <p className="text-xs text-destructive">{form.formState.errors.quantity.message}</p>}
                            </div>
                        </div>
                    </CardContent>

                    <Separator className="my-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2"><Label>Morning Qty*</Label><SelectionDialog triggerText="Qty" title="Morning Quantity" options={selectionData?.morning_qty || []} onSelect={(val) => form.setValue(`morningQty`, val)} icon={Hash} value={form.watch(`morningQty`)} /></div>
                        <div className="space-y-2"><Label>Afternoon Qty*</Label><SelectionDialog triggerText="Qty" title="Afternoon Quantity" options={selectionData?.afternoon_qty || []} onSelect={(val) => form.setValue(`afternoonQty`, val)} icon={Hash} value={form.watch(`afternoonQty`)} /></div>
                        <div className="space-y-2"><Label>Evening Qty*</Label><SelectionDialog triggerText="Qty" title="Evening Quantity" options={selectionData?.evening_qty || []} onSelect={(val) => form.setValue(`eveningQty`, val)} icon={Hash} value={form.watch(`eveningQty`)} /></div>
                        <div className="space-y-2"><Label>Night Qty*</Label><SelectionDialog triggerText="Qty" title="Night Quantity" options={selectionData?.night_qty || []} onSelect={(val) => form.setValue(`nightQty`, val)} icon={Hash} value={form.watch(`nightQty`)} /></div>
                    </div>
                    
                    <Separator className="my-4" />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Dosage Form*</Label><SelectionDialog triggerText="Select Form" title="Dosage Form" options={selectionData!.drug_type || []} onSelect={(val) => form.setValue(`dosageForm`, val)} icon={Pill} value={form.watch(`dosageForm`)} /></div>
                        <div className="space-y-2"><Label>Meal Type*</Label><SelectionDialog triggerText="Select Meal Type" title="Meal Type" options={selectionData!.meal_type || []} onSelect={(val) => form.setValue(`mealType`, val)} icon={Pill} value={form.watch(`mealType`)} /></div>
                        <div className="space-y-2"><Label>Using Frequency*</Label><SelectionDialog triggerText="Select Frequency" title="Using Frequency" options={selectionData!.using_type || []} onSelect={(val) => form.setValue(`usingFrequency`, val)} icon={Repeat} value={form.watch(`usingFrequency`)} /></div>
                        <div className="space-y-2"><Label>At a Time*</Label><SelectionDialog triggerText="e.g. 5ml" title="At a Time" options={selectionData!.at_a_time || []} onSelect={(val) => form.setValue(`at_a_time`, val)} icon={Hash} value={form.watch(`at_a_time`)} /></div>
                        <div className="space-y-2"><Label>Hour Quantity</Label><SelectionDialog triggerText="e.g. 8" title="Hour Quantity" options={selectionData!.hour_qty || []} onSelect={(val) => form.setValue(`hour_qty`, val)} icon={Clock} value={form.watch(`hour_qty`) || ''} /></div>
                        <div className="space-y-2"><Label>Additional Description</Label><SelectionDialog triggerText="Select Description" title="Additional Description" options={selectionData!.additional_description || []} onSelect={(val) => form.setValue(`additionalInstruction`, val)} icon={Pill} value={form.watch(`additionalInstruction`) || ''} /></div>
                    </div>
                    
                     <CardFooter className="p-0 pt-6">
                        <Button type="submit" disabled={saveMutation.isPending}>
                            {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            <Save className="mr-2 h-4 w-4" /> Save Dispensing Answers
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
