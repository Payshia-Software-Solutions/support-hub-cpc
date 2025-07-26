

"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { prescriptions } from "@/lib/d-pad-data";
import type { PrescriptionFormValues, PrescriptionDrug } from "@/lib/d-pad-data";
import { Check, X, Pill, Repeat, Calendar, Hash, RotateCw, ArrowLeft, ClipboardList, ChevronDown, CheckCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const prescriptionSchema = z.object({
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
  drug,
  onSubmit,
  onReset,
  results,
  patientName
}: {
  drug: PrescriptionDrug;
  onSubmit: (data: PrescriptionFormValues) => void;
  onReset: () => void;
  results: ResultState | null;
  patientName: string;
}) => {
  const form = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      drugName: "",
      dosage: "",
      frequency: "",
      duration: "",
      quantity: undefined,
      dosageForm: "",
      morningQty: "",
      afternoonQty: "",
      eveningQty: "",
      nightQty: "",
      mealType: "",
      usingFrequency: "",
      bagin: "",
      payaWarak: "",
      additionalInstruction: "",
    },
  });

  const { handleSubmit, formState: { errors }, setValue, watch } = form;
  const formValues = watch();

  const handleReset = () => {
    form.reset({
      drugName: "",
      dosage: "",
      frequency: "",
      duration: "",
      quantity: undefined,
      dosageForm: "",
      morningQty: "",
      afternoonQty: "",
      eveningQty: "",
      nightQty: "",
      mealType: "",
      usingFrequency: "",
      bagin: "",
      payaWarak: "",
      additionalInstruction: "",
    });
    onReset();
  }

  const getResultIcon = (fieldName: keyof PrescriptionFormValues) => {
    if (results === null) return null;
    if (results[fieldName] === true) return <Check className="h-5 w-5 text-green-500" />;
    if (results[fieldName] === false) return <X className="h-5 w-5 text-destructive" />;
    return null;
  };

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
           <div className="flex justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="text-xs">
                <RotateCw className="mr-2 h-3.5 w-3.5" />
                Reset Form
              </Button>
          </div>
          
          <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <p className="p-3 border rounded-md text-sm">{new Date().toLocaleDateString()}</p>
                </div>
                 <div className="space-y-2">
                  <Label>Name</Label>
                  <p className="p-3 border rounded-md text-sm truncate">{patientName}</p>
                </div>
              </div>
              <div className="space-y-2">
                 <Label>Drug Name</Label>
                  <SelectionDialog triggerText="Select Drug" title="Drug" options={drugOptions} onSelect={(val) => setValue("drugName", val, { shouldValidate: true })} icon={Pill} value={formValues.drugName} resultIcon={getResultIcon("drugName")} />
              </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dosage Form</Label>
                   <SelectionDialog triggerText="Select Form" title="Dosage Form" options={dosageFormOptions} onSelect={(val) => setValue("dosageForm", val, { shouldValidate: true })} icon={Pill} value={formValues.dosageForm} resultIcon={getResultIcon("dosageForm")} />
                   {errors.dosageForm && <p className="text-sm text-destructive">{errors.dosageForm.message}</p>}
                </div>
                 <div className="space-y-2">
                  <Label>Drug Quantity</Label>
                  <SelectionDialog triggerText="Select Quantity" title="Total Quantity" options={quantityOptions} onSelect={(val) => setValue("quantity", parseInt(val), { shouldValidate: true })} icon={Hash} value={String(formValues.quantity || '')} resultIcon={getResultIcon("quantity")} />
                   {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
                </div>
              </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Drug Quantities</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Morning</Label>
                   <SelectionDialog triggerText="Qty" title="Morning Quantity" options={dailyQtyOptions} onSelect={(val) => setValue("morningQty", val, { shouldValidate: true })} icon={Hash} value={formValues.morningQty} resultIcon={getResultIcon("morningQty")} />
                </div>
                 <div className="space-y-2">
                  <Label>Afternoon</Label>
                  <SelectionDialog triggerText="Qty" title="Afternoon Quantity" options={dailyQtyOptions} onSelect={(val) => setValue("afternoonQty", val, { shouldValidate: true })} icon={Hash} value={formValues.afternoonQty} resultIcon={getResultIcon("afternoonQty")} />
                </div>
                 <div className="space-y-2">
                  <Label>Evening</Label>
                  <SelectionDialog triggerText="Qty" title="Evening Quantity" options={dailyQtyOptions} onSelect={(val) => setValue("eveningQty", val, { shouldValidate: true })} icon={Hash} value={formValues.eveningQty} resultIcon={getResultIcon("eveningQty")} />
                </div>
                 <div className="space-y-2">
                  <Label>Night</Label>
                  <SelectionDialog triggerText="Qty" title="Night Quantity" options={dailyQtyOptions} onSelect={(val) => setValue("nightQty", val, { shouldValidate: true })} icon={Hash} value={formValues.nightQty} resultIcon={getResultIcon("nightQty")} />
                </div>
            </div>
          </div>
          
           <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Other</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Meal Type</Label>
                   <SelectionDialog triggerText="Select Meal Type" title="Meal Type" options={mealTypeOptions} onSelect={(val) => setValue("mealType", val, { shouldValidate: true })} icon={Pill} value={formValues.mealType} resultIcon={getResultIcon("mealType")} />
                </div>
                 <div className="space-y-2">
                  <Label>Using Frequency</Label>
                  <SelectionDialog triggerText="Select Frequency" title="Using Frequency" options={["Daily", "Weekly", "As needed"]} onSelect={(val) => setValue("usingFrequency", val, { shouldValidate: true })} icon={Repeat} value={formValues.usingFrequency} resultIcon={getResultIcon("usingFrequency")} />
                </div>
            </div>
          </div>

        </form>
      </div>
       <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
          <Button type="submit" form={`dispensing-form-${drug.id}`} className="w-full" size="lg">
              <ClipboardList className="mr-2 h-5 w-5" />
              Check Answers
          </Button>
      </div>
    </div>
  );
};

const renderDispensingArea = (
  selectedDrug: PrescriptionDrug | null,
  patientName: string,
  results: Record<string, ResultState>,
  handleSubmit: (drugId: string) => (data: PrescriptionFormValues) => void,
  handleReset: (drugId: string) => void,
  handleGoBack: () => void,
) => {
  return (
    <>
      <div className="flex-1 overflow-hidden px-6 pb-6">
        <DispensingForm
          drug={selectedDrug!}
          results={results[selectedDrug!.id] || null}
          onSubmit={handleSubmit(selectedDrug!.id)}
          onReset={() => handleReset(selectedDrug!.id)}
          patientName={patientName}
        />
      </div>
    </>
  );
};


export default function DPadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const prescriptionId = params.id as string;
  const isMobile = useIsMobile();
  
  const [allResults, setAllResults] = useState<Record<string, ResultState>>({});
  const [selectedDrug, setSelectedDrug] = useState<PrescriptionDrug | null>(null);

  const currentPrescription = useMemo(() => {
    return prescriptions.find(p => p.id === prescriptionId);
  }, [prescriptionId]);

  useEffect(() => {
    setSelectedDrug(null);
    setAllResults({});
  }, [prescriptionId]);

  const handleSubmit = (drugId: string) => (data: PrescriptionFormValues) => {
    if (!currentPrescription) return;
    const drug = currentPrescription.drugs.find(d => d.id === drugId);
    if (!drug) return;

    const newResults: ResultState = {};
    let allCorrect = true;
    
    const checkField = (fieldName: keyof PrescriptionFormValues, formValue: any, correctValue: any) => {
      const isCorrect = String(formValue).toLowerCase().trim() === String(correctValue).toLowerCase().trim();
      newResults[fieldName] = isCorrect;
      if (!isCorrect) allCorrect = false;
    };
    
    checkField('drugName', data.drugName, drug.correctAnswers.drugName);
    checkField('quantity', data.quantity, drug.correctAnswers.quantity);
    checkField('dosageForm', data.dosageForm, drug.correctAnswers.dosageForm);
    checkField('morningQty', data.morningQty, drug.correctAnswers.morningQty);
    checkField('afternoonQty', data.afternoonQty, drug.correctAnswers.afternoonQty);
    checkField('eveningQty', data.eveningQty, drug.correctAnswers.eveningQty);
    checkField('nightQty', data.nightQty, drug.correctAnswers.nightQty);
    checkField('mealType', data.mealType, drug.correctAnswers.mealType);
    checkField('usingFrequency', data.usingFrequency, drug.correctAnswers.usingFrequency);
    
    setAllResults(prev => ({ ...prev, [drugId]: newResults }));

    if (allCorrect) {
      toast({
        title: "Excellent Work!",
        description: `You've filled out the details for ${drug.correctAnswers.drugName} correctly.`,
      });
      setSelectedDrug(null);
    } else {
      toast({
        variant: "destructive",
        title: "Check Your Answers",
        description: "Some details are incorrect. Please review the fields.",
      });
    }
  };

  const handleReset = (drugId: string) => {
    setAllResults(prev => {
        const newResults = { ...prev };
        delete newResults[drugId];
        return newResults;
    });
  }

  const handleGoBack = () => setSelectedDrug(null);
  
  if (!currentPrescription) {
    return (
        <div className="p-4 md:p-8 text-center">
            <h1 className="text-xl font-semibold">Prescription not found.</h1>
            <Button onClick={() => router.push('/dashboard/d-pad')} className="mt-4">Back to List</Button>
        </div>
    )
  }

  const itemListContent = (
    <>
      <div className="p-6 pt-0 space-y-3">
        {currentPrescription.drugs.map((drug) => {
          const isCompleted = !!allResults[drug.id] && Object.values(allResults[drug.id]).every(r => r === true);
          return (
            <button
              key={drug.id}
              onClick={() => setSelectedDrug(drug)}
              className={cn(
                "w-full p-4 border rounded-lg flex items-center justify-between text-left transition-all hover:border-primary/50 hover:bg-accent/50",
                isCompleted ? "bg-green-500/10 border-green-500/30" : ""
              )}
            >
              <div className="font-medium">{drug.correctAnswers.drugName}</div>
              <div className="flex items-center gap-2">
                  {isCompleted ? (
                       <span className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
                          <CheckCircle className="h-4 w-4" />
                          Completed
                      </span>
                  ) : (
                       <span className="text-xs text-muted-foreground">Pending</span>
                  )}
                 <ChevronDown className="h-5 w-5 text-muted-foreground -rotate-90" />
              </div>
            </button>
          )
        })}
      </div>
    </>
  );

  return (
    <div className="p-4 md:p-8 space-y-8 pb-20">
      <header>
         <Button variant="ghost" className="mb-4 -ml-4" onClick={() => router.push('/dashboard/d-pad')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Prescription List
        </Button>
        <h1 className="text-3xl font-headline font-semibold">D-Pad: Prescription Challenge</h1>
        <p className="text-muted-foreground">Interpret the prescription and fill out the label correctly for each item.</p>
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

                <div className="flex items-start min-h-[200px] pl-10 relative mb-6">
                    <div className="absolute left-0 top-0 text-6xl font-serif text-gray-700 select-none">℞</div>
                    <div className="flex-1 space-y-4 font-mono text-lg text-gray-800 pt-2">
                        {currentPrescription.drugs.map(drug => (
                            <div key={drug.id}>
                                {drug.lines.map((line, index) => (
                                    <p key={index}>{line}</p>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="text-right mt-8">
                    <p className="italic font-serif text-xl text-gray-700">{currentPrescription.doctor.name.split(' ').slice(1).join(' ')}</p>
                    <p className="text-xs text-muted-foreground">Signature</p>
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
                       <div className="h-full flex flex-col relative">
                           {selectedDrug ? (
                             <>
                                <SheetHeader className="p-6 pb-2 shrink-0">
                                  <Button variant="ghost" onClick={handleGoBack} className="h-auto p-0 mb-4 text-sm font-medium w-fit text-muted-foreground hover:text-foreground">
                                      <ArrowLeft className="mr-2 h-4 w-4" />
                                      Back to Item List
                                  </Button>
                                  <SheetTitle>Dispensing: {selectedDrug.correctAnswers.drugName}</SheetTitle>
                                  <SheetDescription>Fill in the fields based on the prescription for this item.</SheetDescription>
                                </SheetHeader>
                                {renderDispensingArea(selectedDrug, currentPrescription.patient.name, allResults, handleSubmit, handleReset, handleGoBack)}
                             </>
                           ) : (
                              <>
                                <SheetHeader className="p-6">
                                  <SheetTitle>Dispensing Items</SheetTitle>
                                  <SheetDescription>Select an item to begin filling out the dispensing label.</SheetDescription>
                                </SheetHeader>
                                {itemListContent}
                              </>
                           )}
                       </div>
                    </SheetContent>
                </Sheet>
            </CardContent>
          )}
        </Card>

        {!isMobile && (
             <Card className="flex flex-col">
                <div className="h-full flex flex-col relative">
                    {selectedDrug ? (
                      <>
                        <CardHeader>
                          <Button variant="ghost" onClick={handleGoBack} className="h-auto p-0 mb-4 text-sm font-medium w-fit text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Item List
                          </Button>
                          <CardTitle>Dispensing: {selectedDrug.correctAnswers.drugName}</CardTitle>
                          <CardDescription>Fill in the fields based on the prescription for this item.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden">
                          {renderDispensingArea(selectedDrug, currentPrescription.patient.name, allResults, handleSubmit, handleReset, handleGoBack)}
                        </CardContent>
                      </>
                    ) : (
                      <>
                        <CardHeader>
                          <CardTitle>Dispensing Items</CardTitle>
                          <CardDescription>Select an item to begin filling out the dispensing label.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {itemListContent}
                        </CardContent>
                      </>
                    )}
                </div>
            </Card>
        )}
      </div>
    </div>
  );
}
