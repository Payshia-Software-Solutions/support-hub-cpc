
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ceylonPharmacyPatients, type Patient, type PrescriptionDrug, type PrescriptionFormValues } from '@/lib/ceylon-pharmacy-data';
import { toast } from '@/hooks/use-toast';
import { useForm, Controller, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ArrowLeft, Check, X, Pill, Repeat, Calendar as CalendarIcon, Hash, RotateCw, ClipboardList, User } from 'lucide-react';


const prescriptionSchema = z.object({
  date: z.string().nonempty("Date is required."),
  patientName: z.string().nonempty("Patient name is required."),
  drugName: z.string().nonempty("Drug name is required."),
  dosage: z.string().nonempty("Dosage is required."),
  frequency: z.string().nonempty("Frequency is required."),
  duration: z.string().nonempty("Duration is required."),
  quantity: z.coerce.number().min(1, "Quantity must be greater than 0."),
  dosageForm: z.string().nonempty("Dosage form is required."),
  morningQty: z.string().nonempty("Morning quantity is required."),
  afternoonQty: z.string().nonempty("Afternoon quantity is required."),
  eveningQty: z.string().nonempty("Evening quantity is required."),
  nightQty: z.string().nonempty("Night quantity is required."),
  mealType: z.string().nonempty("Meal type is required."),
  usingFrequency: z.string().nonempty("Using frequency is required."),
  bagin: z.string().nonempty("This field is required."),
  payaWarak: z.string().nonempty("This field is required."),
  additionalInstruction: z.string().optional(),
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
      <div className="py-4 grid grid-cols-2 gap-2">
        {options.map((option, index) => (
           <DialogClose asChild key={`${option}-${index}`}>
              <Button variant="outline" onClick={() => onSelect(option)}>
                {option}
              </Button>
          </DialogClose>
        ))}
      </div>
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
  drug,
  onSubmit,
  onReset,
  results,
  patientName,
  prescriptionDate,
}: {
  drug: PrescriptionDrug;
  onSubmit: (data: PrescriptionFormValues) => void;
  onReset: () => void;
  results: ResultState | null;
  patientName: string;
  prescriptionDate: string;
}) => {
  const form = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      date: "", patientName: "", drugName: "", dosage: "", frequency: "", duration: "", quantity: undefined,
      dosageForm: "", morningQty: "", afternoonQty: "", eveningQty: "", nightQty: "", mealType: "",
      usingFrequency: "", bagin: "", payaWarak: "", additionalInstruction: "",
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
  
  const nameOptions = [patientName, "John Smith", "Jane Doe", "Peter Pan"];
  const drugOptions = [drug.correctAnswers.drugName, "Paracetamol 250mg", "Amoxicillin 500mg", "Metformin 250mg"];
  const dosageOptions = ["1", "2", "1/2", "3"];
  const frequencyOptions = ["tds", "bd", "mane", "nocte", "qid", "sos"];
  const durationOptions = [drug.correctAnswers.duration, "3d", "7d", "10d", "1m"];
  const quantityOptions = [String(drug.correctAnswers.quantity), "10", "20", "30"];
  const dosageFormOptions = ["Tablet", "Capsule", "Syrup", "Inhaler"];
  const mealTypeOptions = ["Before Meal", "With Meal", "After Meal", "N/A"];
  const dailyQtyOptions = ["-", "1", "2", "3", "1/2"];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto pr-2 pb-24">
        <form id={`dispensing-form-${drug.id}`} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                 <div className="space-y-2"> <Label>Using Frequency</Label> <SelectionDialog triggerText="Select Frequency" title="Using Frequency" options={["Daily", "Weekly", "As needed"]} onSelect={(val) => setValue("usingFrequency", val, { shouldValidate: true })} icon={Repeat} value={formValues.usingFrequency} resultIcon={getResultIcon("usingFrequency")} /> </div>
            </div>
          </div>
        </form>
      </div>
       <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
          <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={handleReset} className="w-auto"> <RotateCw className="mr-2 h-4 w-4" /> Reset </Button>
              <Button type="submit" form={`dispensing-form-${drug.id}`} className="flex-grow"> <ClipboardList className="mr-2 h-5 w-5" /> Check Answers </Button>
          </div>
      </div>
    </div>
  );
};


export default function DispensePage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const patientId = params.id as string;
    const drugId = searchParams.get('drug');

    const [patient, setPatient] = useState<Patient | null>(null);
    const [drugToDispense, setDrugToDispense] = useState<PrescriptionDrug | null>(null);
    const [dispenseFormResults, setDispenseFormResults] = useState<Record<string, ResultState>>({});

    useEffect(() => {
        const foundPatient = ceylonPharmacyPatients.find(p => p.id === patientId);
        if (foundPatient) {
            setPatient(foundPatient);
            const foundDrug = foundPatient.prescription.drugs.find(d => d.id === drugId);
            if (foundDrug) {
                setDrugToDispense(foundDrug);
            } else {
                 toast({ variant: 'destructive', title: 'Drug not found' });
                 router.push(`/dashboard/ceylon-pharmacy/${patientId}`);
            }
        } else {
             toast({ variant: 'destructive', title: 'Patient not found' });
            router.push('/dashboard/ceylon-pharmacy');
        }
    }, [patientId, drugId, router]);

    const handleDispenseSubmit = (drug: PrescriptionDrug) => (data: PrescriptionFormValues) => {
        const newResults: ResultState = {};
        let allCorrect = true;

        (Object.keys(drug.correctAnswers) as Array<keyof PrescriptionFormValues>).forEach(key => {
            const isCorrect = String(data[key]).toLowerCase().trim() === String(drug.correctAnswers[key]).toLowerCase().trim();
            newResults[key] = isCorrect;
            if (!isCorrect) allCorrect = false;
        });

        setDispenseFormResults(prev => ({ ...prev, [drug.id]: newResults }));

        if (allCorrect) {
            toast({
                title: "Drug Verified!",
                description: `${drug.correctAnswers.drugName} details are correct.`,
            });
            // In a real app, you would set the task as complete here
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

    if (!patient || !drugToDispense) {
        return <div className="p-8 text-center">Loading patient data...</div>;
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <Button onClick={() => router.back()} variant="ghost" className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patient Hub
                </Button>
            </header>
            <Card>
                <CardHeader>
                    <CardTitle>Task 1: Dispense Prescription</CardTitle>
                    <CardDescription>Fill out the label for <span className="font-semibold">{drugToDispense.correctAnswers.drugName}</span></CardDescription>
                </CardHeader>
                <CardContent className="h-[calc(100vh-250px)] relative">
                    <DispensingForm 
                        drug={drugToDispense}
                        onSubmit={handleDispenseSubmit(drugToDispense)}
                        onReset={() => handleDispenseReset(drugToDispense.id)}
                        results={dispenseFormResults[drugToDispense.id] || null}
                        patientName={patient.prescription.patient.name}
                        prescriptionDate={patient.prescription.date}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
