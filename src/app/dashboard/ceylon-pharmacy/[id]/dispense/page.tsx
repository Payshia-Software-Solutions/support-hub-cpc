

"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useForm, Controller, useController, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ArrowLeft, Check, X, Pill, Repeat, Calendar as CalendarIcon, Hash, RotateCw, ClipboardList, User, Loader2, Search, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { getCeylonPharmacyPrescriptions, getPrescriptionDetails, getDispensingAnswers, getFormSelectionData, validateDispensingAnswer } from '@/lib/actions/games';
import type { GamePatient, PrescriptionDetail, DispensingAnswer, FormSelectionData, ValidateAnswerPayload, ValidateAnswerResponse } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from "@/components/ui/input";
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const prescriptionSchema = z.object({
  date: z.string().nonempty("Date is required."),
  patientName: z.string().nonempty("Patient name is required."),
  drugName: z.string().nonempty("Drug name is required."),
  quantity: z.string().nonempty("Quantity must be greater than 0."),
  dosageForm: z.string().nonempty("Dosage form is required."),
  morningQty: z.string().nonempty("Morning quantity is required."),
  afternoonQty: z.string().nonempty("Afternoon quantity is required."),
  eveningQty: z.string().nonempty("Evening quantity is required."),
  nightQty: z.string().nonempty("Night quantity is required."),
  mealType: z.string().nonempty("Meal type is required."),
  usingFrequency: z.string().nonempty("Using frequency is required."),
  additionalInstruction: z.string().nonempty("Additional instruction is required."),
  at_a_time: z.string().nonempty("This field is required."),
  hour_qty: z.string().optional(),
});

type PrescriptionFormValues = z.infer<typeof prescriptionSchema>;


type ResultState = {
  [K in keyof Omit<PrescriptionFormValues, 'bagin' | 'payaWarak' | 'dosage' | 'frequency' | 'duration'>]?: boolean;
};

interface SelectionDialogProps {
  triggerText: string;
  title: string;
  options: string[];
  onSelect: (value: string) => void;
  icon: React.ElementType;
  value: string;
}

const SelectionDialog = ({ triggerText, title, options, onSelect, icon: Icon, value }: SelectionDialogProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    const filteredOptions = useMemo(() => {
        const sortedOptions = [...options].sort((a, b) => a.localeCompare(b));
        if (!searchTerm) return sortedOptions;
        return sortedOptions.filter(option => option.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [options, searchTerm]);

    return (
        <Dialog onOpenChange={(open) => !open && setSearchTerm('')}>
            <DialogTrigger asChild>
            <Button variant="outline" className="w-full justify-start pl-10 relative h-12 text-base">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
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


const DatePickerField = ({
  control,
}: {
  control: Control<PrescriptionFormValues>;
}) => {
    const isMobile = useIsMobile();
    const { field } = useController({ name: 'date', control });

    if (isMobile) {
        return (
             <Input
                type="date"
                className="w-full h-12 text-base"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
            />
        )
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start pl-10 relative h-12 text-base">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <span className="truncate">{field.value ? format(new Date(field.value), 'PPP') : 'Select Date'}</span>
            </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
            <Calendar
                mode="single"
                captionLayout="dropdown-buttons"
                fromYear={1960}
                toYear={new Date().getFullYear() + 5}
                selected={field.value ? new Date(field.value) : undefined}
                onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                initialFocus
            />
            </PopoverContent>
        </Popover>
    )
};

const DispensingForm = ({
  correctAnswers,
  selectionData,
  onSubmit,
  onReset,
  isSubmitting,
  form
}: {
  correctAnswers: DispensingAnswer;
  selectionData: FormSelectionData;
  onSubmit: (data: PrescriptionFormValues) => void;
  onReset: () => void;
  isSubmitting: boolean;
  form: any;
}) => {
  const { handleSubmit, formState: { errors }, control } = form;
  
  const handleReset = () => { form.reset(); onReset(); }
  
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
  const additionalDescriptionOptions = getOptions('additional_description', correctAnswers.additional_description);
  const atATimeOptions = getOptions('at_a_time', correctAnswers.at_a_time);
  const hourQtyOptions = getOptions('hour_qty', correctAnswers.hour_qty || '-');

  return (
    <div className="h-full flex flex-col">
       <div className="flex-1 overflow-y-auto pr-2">
        <Form {...form}>
        <form id={`dispensing-form-${correctAnswers.cover_id}`} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="date" control={control} render={({ field }) => ( <FormItem><FormLabel>Date</FormLabel><FormControl><DatePickerField control={control} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="patientName" control={control} render={({ field }) => ( <FormItem><FormLabel>Name</FormLabel><FormControl><SelectionDialog triggerText="Select Name" title="Patient Name" options={nameOptions} onSelect={(val) => field.onChange(val)} icon={User} value={field.value} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              <FormField name="drugName" control={control} render={({ field }) => ( <FormItem><FormLabel>Drug Name</FormLabel><FormControl><SelectionDialog triggerText="Select Drug" title="Drug" options={drugOptions} onSelect={(val) => field.onChange(val)} icon={Pill} value={field.value} /></FormControl><FormMessage /></FormItem> )} />
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="dosageForm" control={control} render={({ field }) => ( <FormItem><FormLabel>Dosage Form</FormLabel><FormControl><SelectionDialog triggerText="Select Form" title="Dosage Form" options={dosageFormOptions} onSelect={(val) => field.onChange(val)} icon={Pill} value={field.value} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="quantity" control={control} render={({ field }) => ( <FormItem><FormLabel>Drug Quantity</FormLabel><FormControl><SelectionDialog triggerText="Select Quantity" title="Total Quantity" options={quantityOptions} onSelect={(val) => field.onChange(val)} icon={Hash} value={String(field.value || '')} /></FormControl><FormMessage /></FormItem> )} />
              </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Drug Quantities</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField name="morningQty" control={control} render={({ field }) => ( <FormItem><FormLabel>Morning</FormLabel><FormControl><SelectionDialog triggerText="Qty" title="Morning Quantity" options={dailyQtyOptions} onSelect={(val) => field.onChange(val)} icon={Hash} value={field.value} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="afternoonQty" control={control} render={({ field }) => ( <FormItem><FormLabel>Afternoon</FormLabel><FormControl><SelectionDialog triggerText="Qty" title="Afternoon Quantity" options={dailyQtyOptions} onSelect={(val) => field.onChange(val)} icon={Hash} value={field.value} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="eveningQty" control={control} render={({ field }) => ( <FormItem><FormLabel>Evening</FormLabel><FormControl><SelectionDialog triggerText="Qty" title="Evening Quantity" options={dailyQtyOptions} onSelect={(val) => field.onChange(val)} icon={Hash} value={field.value} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="nightQty" control={control} render={({ field }) => ( <FormItem><FormLabel>Night</FormLabel><FormControl><SelectionDialog triggerText="Qty" title="Night Quantity" options={dailyQtyOptions} onSelect={(val) => field.onChange(val)} icon={Hash} value={field.value} /></FormControl><FormMessage /></FormItem> )} />
            </div>
          </div>
           <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Other</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="mealType" control={control} render={({ field }) => ( <FormItem><FormLabel>Meal Type</FormLabel><FormControl><SelectionDialog triggerText="Select Meal Type" title="Meal Type" options={mealTypeOptions} onSelect={(val) => field.onChange(val)} icon={Pill} value={field.value} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="usingFrequency" control={control} render={({ field }) => ( <FormItem><FormLabel>Using Frequency</FormLabel><FormControl><SelectionDialog triggerText="Select Frequency" title="Using Frequency" options={usingFrequencyOptions} onSelect={(val) => field.onChange(val)} icon={Repeat} value={field.value} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="at_a_time" control={control} render={({ field }) => ( <FormItem><FormLabel>At a Time</FormLabel><FormControl><SelectionDialog triggerText="e.g. 5ml" title="At a Time" options={atATimeOptions} onSelect={(val) => field.onChange(val)} icon={Hash} value={field.value} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="hour_qty" control={control} render={({ field }) => ( <FormItem><FormLabel>Hour Quantity</FormLabel><FormControl><SelectionDialog triggerText="e.g. 8" title="Hour Quantity" options={hourQtyOptions} onSelect={(val) => field.onChange(val)} icon={Clock} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="additionalInstruction" control={control} render={({ field }) => ( <FormItem className="md:col-span-2"><FormLabel>Additional Description</FormLabel><FormControl><SelectionDialog triggerText="Select Description" title="Additional Description" options={additionalDescriptionOptions} onSelect={(val) => field.onChange(val)} icon={Pill} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
            </div>
          </div>
        </form>
        </Form>
      </div>
      <div className="mt-auto p-4 bg-background border-t shrink-0">
        <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={handleReset} className="w-auto"> <RotateCw className="mr-2 h-4 w-4" /> Reset </Button>
            <Button type="submit" form={`dispensing-form-${correctAnswers.cover_id}`} className="flex-grow" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ClipboardList className="mr-2 h-5 w-5" />}
              Check Answers
            </Button>
        </div>
      </div>
    </div>
  );
};


const CountdownTimer = ({ initialTime, startTime, onTimeEnd, isPaused, patientStatus }: { 
    initialTime: number, 
    startTime: number | null, 
    onTimeEnd: () => void, 
    isPaused: boolean,
    patientStatus: 'dead' | 'active' | 'recovered' | 'pending'
}) => {
    const calculateTimeLeft = useCallback(() => {
        if (!startTime) return initialTime;
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        return Math.max(0, initialTime - elapsed);
    }, [startTime, initialTime]);

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

    useEffect(() => {
        if (isPaused || timeLeft <= 0 || !startTime || patientStatus !== 'active') {
            if (timeLeft <= 0 && patientStatus === 'active') onTimeEnd();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, onTimeEnd, isPaused, startTime, calculateTimeLeft, patientStatus]);
    
    if (patientStatus === 'pending') {
      return null; // Don't show the timer if it hasn't started
    }

    if (patientStatus === 'dead') {
         return <Badge variant="destructive" className="text-lg"><Clock className="mr-2 h-5 w-5" />Timeout</Badge>;
    }
     if (patientStatus === 'recovered') {
        return <Badge variant="default" className="bg-green-600 text-lg"><CheckCircle className="mr-2 h-5 w-5" />Recovered</Badge>;
    }

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const isCritical = timeLeft < 60 && timeLeft > 0;

     return (
        <Badge variant={isCritical ? 'destructive' : 'default'} className={cn("text-lg", isCritical && "animate-pulse")}>
            <Clock className="mr-2 h-5 w-5" />
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </Badge>
    );
}

const fieldLabels: Record<string, string> = {
    date: "Date",
    patientName: "Patient Name",
    name: "Patient Name",
    drugName: "Drug Name",
    drug_name: "Drug Name",
    quantity: "Drug Quantity",
    drug_qty: "Drug Quantity",
    dosageForm: "Dosage Form",
    drug_type: "Dosage Form",
    morningQty: "Morning Quantity",
    morning_qty: "Morning Quantity",
    afternoonQty: "Afternoon Quantity",
    afternoon_qty: "Afternoon Quantity",
    eveningQty: "Evening Quantity",
    evening_qty: "Evening Quantity",
    nightQty: "Night Quantity",
    night_qty: "Night Quantity",
    mealType: "Meal Type",
    meal_type: "Meal Type",
    usingFrequency: "Using Frequency",
    using_type: "Using Frequency",
    additionalInstruction: "Additional Description",
    additional_description: "Additional Description",
    at_a_time: "At a Time",
    hour_qty: "Hour Quantity",
};

export default function DispensePage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const isMobile = useIsMobile();
    const { user } = useAuth();
    const courseCode = 'CPCC20';

    const patientId = params.id as string;
    const coverId = searchParams.get('drug');
    
    const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false);
    const [incorrectFields, setIncorrectFields] = useState<string[]>([]);
    const [wasCorrect, setWasCorrect] = useState(false);

    const form = useForm<PrescriptionFormValues>({
      resolver: zodResolver(prescriptionSchema),
      defaultValues: {
        date: "", patientName: "", drugName: "", quantity: "",
        dosageForm: "", morningQty: "", afternoonQty: "", eveningQty: "", nightQty: "", mealType: "",
        usingFrequency: "", additionalInstruction: "", at_a_time: "", hour_qty: ""
      },
    });

    const { data: patient, isLoading: isLoadingPatient } = useQuery<GamePatient>({
        queryKey: ['ceylonPharmacyPatient', patientId, user?.username],
        queryFn: async () => {
            if (!user?.username) throw new Error("User not authenticated");
            const prescriptions = await getCeylonPharmacyPrescriptions(user.username, courseCode);
            const found = prescriptions.find(p => p.prescription_id === patientId);
            if (!found) throw new Error("Patient not found");
            return found;
        },
        enabled: !!patientId && !!user?.username,
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
    
     const validationMutation = useMutation<ValidateAnswerResponse, Error, ValidateAnswerPayload>({
        mutationFn: validateDispensingAnswer,
        onSuccess: (data, variables) => {
             if (data.answer_status !== 'In-Correct') {
                setWasCorrect(true);
                toast({ title: "Drug Verified!", description: `${variables.drug_name} details are correct.` });
                try {
                    const completed = JSON.parse(localStorage.getItem(`completed_drugs_${patientId}`) || '[]');
                    if (!completed.includes(variables.cover_id)) {
                        completed.push(variables.cover_id);
                        localStorage.setItem(`completed_drugs_${patientId}`, JSON.stringify(completed));
                    }
                } catch (e) { console.error(e); }
                router.push(`/dashboard/ceylon-pharmacy/${patientId}`);
            } else {
                setWasCorrect(false);
                setIncorrectFields(data.incorrect_values);
                setIsResultsDialogOpen(true);
            }
        },
        onError: (error) => {
            toast({ variant: "destructive", title: "Validation Failed", description: error.message });
        }
    });

    const drugToDispense = useMemo(() => {
        if (!prescriptionDetails) return null;
        return prescriptionDetails.find(d => d.cover_id === coverId);
    }, [prescriptionDetails, coverId]);


    const startTime = patient?.start_data ? new Date(patient.start_data.time).getTime() : null;
    
    const patientStatus = useMemo<'active' | 'dead' | 'recovered' | 'pending'>(() => {
        if (!patient?.start_data) return 'pending';
        if (patient.start_data.patient_status === 'Recovered') return 'recovered';
        
        const elapsed = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
        if (elapsed > 3600) return 'dead';
        
        return 'active';
    }, [patient, startTime]);


    const handleDispenseSubmit = (data: PrescriptionFormValues) => {
        if (!correctAnswers || !user) return;
        
        const payload: ValidateAnswerPayload = {
            created_by: user.username!,
            user_level: "Student",
            pres_id: correctAnswers.pres_id,
            cover_id: correctAnswers.cover_id,
            date: data.date,
            name: data.patientName,
            drug_name: data.drugName,
            drug_type: data.dosageForm,
            drug_qty: String(data.quantity),
            morning_qty: data.morningQty,
            afternoon_qty: data.afternoonQty,
            evening_qty: data.eveningQty,
            night_qty: data.nightQty,
            meal_type: data.mealType,
            using_type: data.usingFrequency,
            at_a_time: data.at_a_time,
            hour_qty: data.hour_qty || null,
            additional_description: data.additionalInstruction || ''
        };
        
        validationMutation.mutate(payload);
    }

    const handleDispenseReset = () => {
        setIsResultsDialogOpen(false);
        setIncorrectFields([]);
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
            <Dialog open={isResultsDialogOpen} onOpenChange={setIsResultsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                           <AlertCircle className="text-destructive h-6 w-6"/>
                            Incorrect Answers
                        </DialogTitle>
                        <DialogDescription>
                            Please review the following fields and correct your entries.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 max-h-[60vh] overflow-y-auto">
                        <ul className="space-y-2">
                            {incorrectFields.map(field => (
                                <li key={field} className="p-2 border rounded-md bg-muted text-destructive text-sm font-medium">
                                    {fieldLabels[field] || field}
                                </li>
                            ))}
                        </ul>
                    </div>
                </DialogContent>
            </Dialog>

            <header>
                <Button onClick={() => router.back()} variant="ghost" className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patient Hub
                </Button>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <Card className="shadow-lg">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle>Prescription</CardTitle>
                            <CountdownTimer 
                                initialTime={3600} 
                                startTime={startTime}
                                onTimeEnd={() => {}} 
                                isPaused={false}
                                patientStatus={patientStatus}
                            />
                        </div>
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
                                     {prescriptionDetails.map((detail, index) => (
                                        <div key={detail.cover_id} className="flex justify-between items-center">
                                            <p>{detail.content}</p>
                                            {patient.Pres_Method.split(',')[index] && <p className="ml-4 font-sans text-base text-gray-600">#{patient.Pres_Method.split(',')[index].trim()}</p>}
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
                                            onReset={() => handleDispenseReset()}
                                            isSubmitting={validationMutation.isPending}
                                            form={form}
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
                                onReset={() => handleDispenseReset()}
                                isSubmitting={validationMutation.isPending}
                                form={form}
                            />
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
