
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useForm, Controller, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ArrowLeft, Check, X, Pill, Repeat, Calendar as CalendarIcon, Hash, RotateCw, ClipboardList, User, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { getCeylonPharmacyPrescriptions, getPrescriptionDetails, getDispensingAnswers, getFormSelectionData } from '@/lib/actions/games';
import type { GamePrescription, PrescriptionDetail, DispensingAnswer, FormSelectionData } from '@/lib/types';
import type { PrescriptionFormValues } from '@/lib/ceylon-pharmacy-data';
import { ScrollArea } from '@/components/ui/scroll-area';

const prescriptionSchema = z.object({
  date: z.string().nonempty("Date is required."),
  patientName: z.string().nonempty("Patient name is required."),
  drugName: z.string().nonempty("Drug name is required."),
  quantity: z.coerce.number().min(1, "Quantity must be greater than 0."),
  dosageForm: z.string().nonempty("Dosage form is required."),
  morningQty: z.string().nonempty("Morning quantity is required."),
  afternoonQty: z.string().nonempty("Afternoon quantity is required."),
  eveningQty: z.string().nonempty("Evening quantity is required."),
  nightQty: z.string().nonempty("Night quantity is required."),
  mealType: z.string().nonempty("Meal type is required."),
  usingFrequency: z.string().nonempty("Using frequency is required."),
});

type ResultState = {
  [K in keyof PrescriptionFormValues]?: boolean;
};

interface SelectionDialogProps {
  triggerText: string;
  title: string;
  options: string[];
  onSelect: (value: string) => void;
  icon: React.ElementType;
  value: string;
  resultIcon: React.ReactNode;
}

const SelectionDialog = ({ triggerText, title, options, onSelect, icon: Icon, value, resultIcon }: SelectionDialogProps) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="outline" className="w-full justify-start pl-10 relative h-12 text-base">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <span className="truncate">{value || triggerText}</span>
         <div className="absolute right-3 top-1/2 -translate-y-1/2">{resultIcon}</div>
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Select {title}</DialogTitle>
      </DialogHeader>
      <ScrollArea className="max-h-[50vh]">
        <div className="py-4 grid grid-cols-2 gap-2 pr-4">
            {options.map((option, index) => (
            <DialogClose asChild key={`${option}-${index}`}>
                <Button variant="outline" onClick={() => onSelect(option)}>
                    {option}
                </Button>
            </DialogClose>
            ))}
        </div>
      </ScrollArea>
    </DialogContent>
  </Dialog>
);

const DatePickerField = ({
  control,
  getResultIcon,
}: {
  control: Control<PrescriptionFormValues>;
  getResultIcon: (fieldName: keyof PrescriptionFormValues) => React.ReactNode;
}) => (
  <Controller
    control={control}
    name="date"
    render={({ field }) => (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start pl-10 relative h-12 text-base">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <span className="truncate">{field.value ? format(new Date(field.value), 'PPP') : 'Select Date'}</span>
            <div className="absolute right-3 top-1/2 -translate-y-1/2">{getResultIcon('date')}</div>
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
);

const DispensingForm = ({
  correctAnswers,
  selectionData,
  onSubmit,
  onReset,
  results,
}: {
  correctAnswers: DispensingAnswer;
  selectionData: FormSelectionData;
  onSubmit: (data: PrescriptionFormValues) => void;
  onReset: () => void;
  results: ResultState | null;
}) => {
  const form = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      date: "", patientName: "", drugName: "", quantity: undefined,
      dosageForm: "", morningQty: "", afternoonQty: "", eveningQty: "", nightQty: "", mealType: "",
      usingFrequency: "",
    },
  });

  const { handleSubmit, formState: { errors }, setValue, watch, control } = form;
  const formValues = watch();

  const handleReset = () => { form.reset(); onReset(); }
  const getResultIcon = (fieldName: keyof PrescriptionFormValues) => {
    if (results === null) return null;
    if (results[fieldName] === true) return <Check className="h-5 w-5 text-green-500" />;
    if (results[fieldName] === false) return <X className="h-5 w-5 text-destructive" />;
    return null;
  };
  
  // Combine API options with the correct answer to ensure it's always available
  const getOptions = (key: keyof FormSelectionData, correctAnswer: string) => {
    const options = selectionData[key] || [];
    return [...new Set([correctAnswer, ...options])];
  };
  
  const nameOptions = getOptions('name', correctAnswers.name);
  const drugOptions = getOptions('drug_name', correctAnswers.drug_name);
  const quantityOptions = getOptions('drug_qty', correctAnswers.drug_qty);
  const dosageFormOptions = getOptions('drug_type', correctAnswers.drug_type);
  const mealTypeOptions = getOptions('meal_type', correctAnswers.meal_type);
  const dailyQtyOptions = ['-', '1', '2', '3', '1/2', '4', '5']; 
  const usingFrequencyOptions = getOptions('using_type', correctAnswers.using_type);

  return (
    <div className="h-full flex flex-col">
       <div className="flex-1 overflow-y-auto pr-2">
        <form id={`dispensing-form-${correctAnswers.cover_id}`} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Date</Label>
                    <DatePickerField control={control} getResultIcon={getResultIcon} />
                </div>
                 <div className="space-y-2"> <Label>Name</Label> <SelectionDialog triggerText="Select Name" title="Patient Name" options={nameOptions} onSelect={(val) => setValue("patientName", val, { shouldValidate: true })} icon={User} value={formValues.patientName} resultIcon={getResultIcon("patientName")} /> </div>
              </div>
              <div className="space-y-2"> <Label>Drug Name</Label> <SelectionDialog triggerText="Select Drug" title="Drug" options={drugOptions} onSelect={(val) => setValue("drugName", val, { shouldValidate: true })} icon={Pill} value={formValues.drugName} resultIcon={getResultIcon("drugName")} /> </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"> <Label>Dosage Form</Label> <SelectionDialog triggerText="Select Form" title="Dosage Form" options={dosageFormOptions} onSelect={(val) => setValue("dosageForm", val, { shouldValidate: true })} icon={Pill} value={formValues.dosageForm} resultIcon={getResultIcon("dosageForm")} /> {errors.dosageForm && <p className="text-sm text-destructive">{errors.dosageForm.message}</p>} </div>
                 <div className="space-y-2"> <Label>Drug Quantity</Label> <SelectionDialog triggerText="Select Quantity" title="Total Quantity" options={quantityOptions} onSelect={(val) => setValue("quantity", parseInt(val), { shouldValidate: true })} icon={Hash} value={String(formValues.quantity || '')} resultIcon={getResultIcon("quantity")} /> {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>} </div>
              </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Drug Quantities</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2"> <Label>Morning</Label> <SelectionDialog triggerText="Qty" title="Morning Quantity" options={dailyQtyOptions} onSelect={(val) => setValue("morningQty", val, { shouldValidate: true })} icon={Hash} value={formValues.morningQty} resultIcon={getResultIcon("morningQty")} /> </div>
                 <div className="space-y-2"> <Label>Afternoon</Label> <SelectionDialog triggerText="Qty" title="Afternoon Quantity" options={dailyQtyOptions} onSelect={(val) => setValue("afternoonQty", val, { shouldValidate: true })} icon={Hash} value={formValues.afternoonQty} resultIcon={getResultIcon("afternoonQty")} /> </div>
                 <div className="space-y-2"> <Label>Evening</Label> <SelectionDialog triggerText="Qty" title="Evening Quantity" options={dailyQtyOptions} onSelect={(val) => setValue("eveningQty", val, { shouldValidate: true })} icon={Hash} value={formValues.eveningQty} resultIcon={getResultIcon("eveningQty")} /> </div>
                 <div className="space-y-2"> <Label>Night</Label> <SelectionDialog triggerText="Qty" title="Night Quantity" options={dailyQtyOptions} onSelect={(val) => setValue("nightQty", val, { shouldValidate: true })} icon={Hash} value={formValues.nightQty} resultIcon={getResultIcon("nightQty")} /> </div>
            </div>
          </div>
           <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Other</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"> <Label>Meal Type</Label> <SelectionDialog triggerText="Select Meal Type" title="Meal Type" options={mealTypeOptions} onSelect={(val) => setValue("mealType", val, { shouldValidate: true })} icon={Pill} value={formValues.mealType} resultIcon={getResultIcon("mealType")} /> </div>
                 <div className="space-y-2"> <Label>Using Frequency</Label> <SelectionDialog triggerText="Select Frequency" title="Using Frequency" options={usingFrequencyOptions} onSelect={(val) => setValue("usingFrequency", val, { shouldValidate: true })} icon={Repeat} value={formValues.usingFrequency} resultIcon={getResultIcon("usingFrequency")} /> </div>
            </div>
          </div>
        </form>
      </div>
      <div className="mt-auto p-4 bg-background border-t shrink-0">
        <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={handleReset} className="w-auto"> <RotateCw className="mr-2 h-4 w-4" /> Reset </Button>
            <Button type="submit" form={`dispensing-form-${correctAnswers.cover_id}`} className="flex-grow"> <ClipboardList className="mr-2 h-5 w-5" /> Check Answers </Button>
        </div>
      </div>
    </div>
  );
};


export default function DispensePage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const isMobile = useIsMobile();

    const patientId = params.id as string;
    const coverId = searchParams.get('drug');

    const [dispenseFormResults, setDispenseFormResults] = useState<Record<string, ResultState>>({});

    const { data: patient, isLoading: isLoadingPatient } = useQuery<GamePrescription>({
        queryKey: ['ceylonPharmacyPatient', patientId],
        queryFn: async () => {
            const prescriptions = await getCeylonPharmacyPrescriptions();
            const found = prescriptions.find(p => p.prescription_id === patientId);
            if (!found) throw new Error("Patient not found");
            return found;
        },
        enabled: !!patientId,
    });
    
    const { data: prescriptionDetails, isLoading: isLoadingDetails } = useQuery<PrescriptionDetail[]>({
        queryKey: ['prescriptionDetails', patientId],
        queryFn: () => getPrescriptionDetails(patientId),
        enabled: !!patient,
    });
    
    const { data: correctAnswers, isLoading: isLoadingAnswers } = useQuery<DispensingAnswer>({
        queryKey: ['dispensingAnswers', patientId, coverId],
        queryFn: () => getDispensingAnswers(patientId, coverId!),
        enabled: !!patientId && !!coverId,
    });

    const { data: selectionData, isLoading: isLoadingSelectionData } = useQuery<FormSelectionData>({
        queryKey: ['formSelectionData'],
        queryFn: getFormSelectionData,
    });

    const drugToDispense = useMemo(() => {
        if (!prescriptionDetails) return null;
        return prescriptionDetails.find(d => d.cover_id === coverId);
    }, [prescriptionDetails, coverId]);


    const handleDispenseSubmit = (data: PrescriptionFormValues) => {
        if (!correctAnswers) return;

        const newResults: ResultState = {};
        let allCorrect = true;

        const formToApiMap: Record<keyof PrescriptionFormValues, keyof DispensingAnswer> = {
            patientName: 'name',
            drugName: 'drug_name',
            quantity: 'drug_qty',
            dosageForm: 'drug_type',
            usingFrequency: 'using_type',
            date: 'date',
            morningQty: 'morning_qty',
            afternoonQty: 'afternoon_qty',
            eveningQty: 'evening_qty',
            nightQty: 'night_qty',
            mealType: 'meal_type',
        };

        (Object.keys(formToApiMap) as Array<keyof PrescriptionFormValues>).forEach(formKey => {
            const apiKey = formToApiMap[formKey];
            // @ts-ignore
            const isCorrect = String(data[formKey] ?? '').toLowerCase().trim() === String(correctAnswers[apiKey] ?? '').toLowerCase().trim();
            newResults[formKey] = isCorrect;
            if (!isCorrect) allCorrect = false;
        });

        setDispenseFormResults(prev => ({ ...prev, [correctAnswers.cover_id]: newResults }));

        if (allCorrect) {
            toast({
                title: "Drug Verified!",
                description: `${correctAnswers.drug_name} details are correct.`,
            });
            // Persist completion state
            try {
                const completed = JSON.parse(localStorage.getItem(`completed_drugs_${patientId}`) || '[]');
                if (!completed.includes(coverId)) {
                    completed.push(coverId);
                    localStorage.setItem(`completed_drugs_${patientId}`, JSON.stringify(completed));
                }
            } catch (e) { console.error(e) }
            router.push(`/dashboard/ceylon-pharmacy/${patientId}`);
        } else {
             toast({
                variant: "destructive",
                title: "Check Your Answers",
                description: "Some details are incorrect for this drug.",
            });
        }
    }

    const handleDispenseReset = (drugIdToReset: string) => {
        setDispenseFormResults(prev => {
            const newResults = { ...prev };
            delete newResults[drugIdToReset];
            return newResults;
        });
    }

    const isLoading = isLoadingPatient || isLoadingDetails || isLoadingAnswers || isLoadingSelectionData;

    if (isLoading) {
        return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></div>;
    }

    if (!patient || !drugToDispense || !prescriptionDetails || !correctAnswers || !selectionData) {
        return <div className="p-8 text-center">Error loading game data. Please go back and try again.</div>;
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <Button onClick={() => router.back()} variant="ghost" className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patient Hub
                </Button>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Prescription</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center p-4">
                        <div className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-400 w-full max-w-md shadow-sm font-sans text-gray-800">
                            <div className="text-center border-b pb-4 mb-4 border-gray-300">
                                <h2 className="text-xl font-bold">{patient.doctor_name}</h2>
                                <p className="text-sm text-gray-600">MBBS, MD</p>
                                <p className="text-sm text-gray-600">Reg. No: {patient.id}</p>
                            </div>
                            
                            <div className="flex justify-between text-sm mb-6">
                                <div>
                                <p><span className="font-semibold">Name:</span> {patient.Pres_Name}</p>
                                <p><span className="font-semibold">Age:</span> {patient.Pres_Age}</p>
                                </div>
                                <div>
                                <p><span className="font-semibold">Date:</span> {patient.pres_date}</p>
                                </div>
                            </div>

                            <div className="flex items-start min-h-[200px] pl-10 relative mb-6">
                                <div className="absolute left-0 top-0 text-6xl font-serif text-gray-700 select-none">℞</div>
                                <div className="flex-1 space-y-4 font-mono text-lg text-gray-800 pt-2">
                                     {prescriptionDetails.map(detail => (
                                        <div key={detail.cover_id}>
                                            <p>{detail.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="text-right mt-8">
                                <p className="italic font-serif text-xl text-gray-700">{patient.doctor_name.split(' ').slice(1).join(' ')}</p>
                                <p className="text-xs text-muted-foreground non-italic">Signature</p>
                            </div>
                        </div>
                    </CardContent>
                     {isMobile && (
                        <CardContent>
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button className="w-full" size="lg"><ClipboardList className="mr-2"/> Dispense</Button>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="h-[90%] p-0">
                                <div className="h-full flex flex-col relative">
                                    <SheetHeader className="p-6 pb-2 shrink-0 text-left">
                                        <SheetTitle>Dispensing: {correctAnswers.drug_name}</SheetTitle>
                                        <SheetDescription>Fill in the fields based on the prescription for this item.</SheetDescription>
                                    </SheetHeader>
                                    <div className="flex-1 overflow-hidden px-6 pb-6">
                                        <DispensingForm 
                                            correctAnswers={correctAnswers}
                                            selectionData={selectionData}
                                            onSubmit={handleDispenseSubmit}
                                            onReset={() => handleDispenseReset(correctAnswers.cover_id)}
                                            results={dispenseFormResults[correctAnswers.cover_id] || null}
                                        />
                                    </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </CardContent>
                     )}
                </Card>
                {!isMobile && (
                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle>Dispense: {correctAnswers.drug_name}</CardTitle>
                            <CardDescription>Fill out the label for the selected item.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden">
                             <DispensingForm 
                                correctAnswers={correctAnswers}
                                selectionData={selectionData}
                                onSubmit={handleDispenseSubmit}
                                onReset={() => handleDispenseReset(correctAnswers.cover_id)}
                                results={dispenseFormResults[correctAnswers.cover_id] || null}
                            />
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
