
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { prescriptions } from "@/lib/d-pad-data";
import { Check, X, Pill, Repeat, Calendar, Hash, RotateCw, ArrowLeft, ClipboardList, ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from "@/components/ui/dialog";

const prescriptionSchema = z.object({
  drugName: z.string().nonempty("Drug name is required."),
  dosage: z.string().nonempty("Dosage is required."),
  frequency: z.string().nonempty("Frequency is required."),
  duration: z.string().nonempty("Duration is required."),
  quantity: z.coerce.number().min(1, "Quantity must be greater than 0."),
});

type PrescriptionFormValues = z.infer<typeof prescriptionSchema>;

type ResultState = {
  [K in keyof PrescriptionFormValues]?: boolean;
};

// --- Sub-components ---

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


const DispensingForm = ({
  form,
  results,
  onSubmit,
  onReset,
  currentPrescription,
}: {
  form: any;
  results: ResultState | null;
  onSubmit: (data: PrescriptionFormValues) => void;
  onReset: () => void;
  currentPrescription: (typeof prescriptions)[0];
}) => {
  const { control, handleSubmit, formState: { errors }, setValue, watch } = form;
  const formValues = watch();

  const getResultIcon = (fieldName: keyof PrescriptionFormValues) => {
    if (results === null) return null;
    if (results[fieldName] === true) return <Check className="h-5 w-5 text-green-500" />;
    if (results[fieldName] === false) return <X className="h-5 w-5 text-destructive" />;
    return null;
  };

  const drugOptions = [currentPrescription.correctAnswers.drugName, "Paracetamol 250mg", "Amoxicillin 500mg", "Metformin 250mg"];
  const dosageOptions = ["1", "2", "1/2", "3"];
  const frequencyOptions = ["tds", "bd", "mane", "nocte", "qid", "sos"];
  const durationOptions = [currentPrescription.correctAnswers.duration, "3d", "7d", "10d", "1m"];
  const quantityOptions = [String(currentPrescription.correctAnswers.quantity), "10", "20", "30"];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pr-2">
        <form id="dispensing-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
           <div className="flex justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={onReset} className="text-xs">
                <RotateCw className="mr-2 h-3.5 w-3.5" />
                Reset
              </Button>
          </div>
          
          <div className="space-y-2">
            <Label>Drug Name & Strength</Label>
            <SelectionDialog
              triggerText="Select Drug Name"
              title="Drug Name"
              options={drugOptions}
              onSelect={(val) => setValue("drugName", val)}
              icon={Pill}
              value={formValues.drugName}
              resultIcon={getResultIcon("drugName")}
            />
            {errors.drugName && <p className="text-sm text-destructive">{errors.drugName.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dosage</Label>
               <SelectionDialog
                triggerText="Select Dosage"
                title="Dosage"
                options={dosageOptions}
                onSelect={(val) => setValue("dosage", val)}
                icon={Pill}
                value={formValues.dosage}
                resultIcon={getResultIcon("dosage")}
              />
              {errors.dosage && <p className="text-sm text-destructive">{errors.dosage.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <SelectionDialog
                triggerText="Select Frequency"
                title="Frequency"
                options={frequencyOptions}
                onSelect={(val) => setValue("frequency", val)}
                icon={Repeat}
                value={formValues.frequency}
                resultIcon={getResultIcon("frequency")}
              />
              {errors.frequency && <p className="text-sm text-destructive">{errors.frequency.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duration</Label>
              <SelectionDialog
                triggerText="Select Duration"
                title="Duration"
                options={durationOptions}
                onSelect={(val) => setValue("duration", val)}
                icon={Calendar}
                value={formValues.duration}
                resultIcon={getResultIcon("duration")}
              />
              {errors.duration && <p className="text-sm text-destructive">{errors.duration.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Total Quantity</Label>
               <SelectionDialog
                triggerText="Select Quantity"
                title="Total Quantity"
                options={quantityOptions}
                onSelect={(val) => setValue("quantity", parseInt(val))}
                icon={Hash}
                value={String(formValues.quantity || '')}
                resultIcon={getResultIcon("quantity")}
              />
              {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
            </div>
          </div>
        </form>
      </div>
      <div className="pt-4 mt-auto">
        <Button type="submit" form="dispensing-form" className="w-full" size="lg">
          <ClipboardList className="mr-2 h-5 w-5" />
          Check Answers
        </Button>
      </div>
    </div>
  );
};


export default function DPadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const prescriptionId = params.id as string;
  const isMobile = useIsMobile();
  
  const [results, setResults] = useState<ResultState | null>(null);
  
  const currentPrescription = useMemo(() => {
    return prescriptions.find(p => p.id === prescriptionId);
  }, [prescriptionId]);

  const form = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      drugName: "",
      dosage: "",
      frequency: "",
      duration: "",
      quantity: undefined,
    },
  });
  
  useEffect(() => {
    form.reset({
      drugName: "",
      dosage: "",
      frequency: "",
      duration: "",
      quantity: undefined,
    });
    setResults(null);
  }, [prescriptionId, form]);

  const onSubmit = (data: PrescriptionFormValues) => {
    if (!currentPrescription) return;

    const newResults: ResultState = {};
    let allCorrect = true;
    
    for (const key in currentPrescription.correctAnswers) {
      const formKey = key as keyof PrescriptionFormValues;
      const dataValue = String(data[formKey]).toLowerCase().trim().replace(/\s+/g, ' ');

      if (formKey === 'frequency') {
        if (currentPrescription.acceptedFrequencyAnswers.includes(dataValue)) {
            newResults[formKey] = true;
        } else {
            newResults[formKey] = false;
            allCorrect = false;
        }
      } else {
        const answerValue = String(currentPrescription.correctAnswers[formKey]).toLowerCase().trim().replace(/\s+/g, ' ');
        if (dataValue === answerValue) {
          newResults[formKey] = true;
        } else {
          newResults[formKey] = false;
          allCorrect = false;
        }
      }
    }
    setResults(newResults);

    if (allCorrect) {
      toast({
        title: "Excellent Work!",
        description: "You've filled the prescription correctly.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Check Your Answers",
        description: "Some details are incorrect. Please review the fields.",
      });
    }
  };
  
  if (!currentPrescription) {
    return (
        <div className="p-4 md:p-8 text-center">
            <h1 className="text-xl font-semibold">Prescription not found.</h1>
            <Button onClick={() => router.push('/dashboard/d-pad')} className="mt-4">Back to List</Button>
        </div>
    )
  }

  const formComponent = (
     <DispensingForm 
        form={form} 
        results={results} 
        onSubmit={onSubmit} 
        onReset={() => { setResults(null); form.reset(); }}
        currentPrescription={currentPrescription}
      />
  );

  return (
    <div className="p-4 md:p-8 space-y-8 pb-20">
      <header>
         <Button variant="ghost" className="mb-4 -ml-4" onClick={() => router.push('/dashboard/d-pad')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Prescription List
        </Button>
        <h1 className="text-3xl font-headline font-semibold">D-Pad: Prescription Challenge</h1>
        <p className="text-muted-foreground">Interpret the prescription and fill out the label correctly.</p>
      </header>

      <div className={cn("grid grid-cols-1 gap-8", !isMobile && "lg:grid-cols-2")}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Prescription</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center p-4">
             <div className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-400 w-full max-w-md shadow-sm font-sans text-gray-800">
                <div className="text-center border-b pb-4 mb-4 border-gray-300">
                    <h2 className="text-xl font-bold">{currentPrescription.doctor.name}</h2>
                    <p className="text-sm text-gray-600">{currentPrescription.doctor.specialty}</p>
                    <p className="text-sm text-gray-600">Reg. No: {currentPrescription.doctor.regNo}</p>
                </div>
                
                <div className="flex justify-between text-sm mb-6">
                    <div>
                    <p><span className="font-semibold">Name:</span> {currentPrescription.patient.name}</p>
                    <p><span className="font-semibold">Age:</span> {currentPrescription.patient.age}</p>
                    </div>
                    <div>
                    <p><span className="font-semibold">Date:</span> {currentPrescription.date}</p>
                    </div>
                </div>

                <div className="flex items-center min-h-[200px] pl-10 relative mb-6">
                    <div className="absolute left-0 top-0 text-6xl font-serif text-gray-700 select-none">℞</div>
                    <div className="flex-1 space-y-4 font-mono text-lg text-gray-800 pt-2">
                        {currentPrescription.lines.map((line, index) => (
                            <p key={index}>{line}</p>
                        ))}
                    </div>
                     <div className="w-1/5 flex justify-center items-center">
                         <div className="w-px h-24 bg-gray-400 transform -rotate-12"></div>
                    </div>
                    <div className="w-1/5 flex justify-center items-center font-bold text-xl text-gray-700">
                        {currentPrescription.rightSideText}
                    </div>
                </div>

                <div className="text-right mt-8">
                    <p className="italic font-serif text-xl text-gray-700">{currentPrescription.doctor.name.split(' ').slice(1).join(' ')}</p>
                    <p className="text-xs text-gray-500">Signature</p>
                </div>
            </div>
          </CardContent>
          {isMobile && (
            <CardContent>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button className="w-full" size="lg"><ClipboardList className="mr-2"/> Start Challenge</Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[90%] p-0">
                       <div className="p-6 h-full flex flex-col">
                            <SheetHeader>
                                <SheetTitle>Dispensing Label</SheetTitle>
                                <SheetDescription>Fill in the fields based on the prescription.</SheetDescription>
                            </SheetHeader>
                           {formComponent}
                       </div>
                    </SheetContent>
                </Sheet>
            </CardContent>
          )}
        </Card>

        {!isMobile && (
             <div className="flex flex-col">
                <CardHeader>
                    <CardTitle>Dispensing Label</CardTitle>
                    <CardDescription>Fill in the fields based on the prescription.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                    {formComponent}
                </CardContent>
            </div>
        )}
      </div>
    </div>
  );
}

