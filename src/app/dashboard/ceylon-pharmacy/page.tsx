
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, HeartPulse, Users, Clock, ArrowRight, ArrowLeft, Pill, Hash, Repeat, User, Calendar as CalendarIcon, RotateCw, ClipboardList, Check, X } from 'lucide-react';
import { ceylonPharmacyPatients, type Patient } from '@/lib/ceylon-pharmacy-data';
import type { PrescriptionFormValues, PrescriptionDrug } from "@/lib/d-pad-data";
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

// --- D-Pad Form Schema and related components ---
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
      date: "",
      patientName: "",
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

  const { handleSubmit, formState: { errors }, setValue, watch, control } = form;
  const formValues = watch();

  const handleReset = () => {
    form.reset();
    onReset();
  }

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
                    <Controller
                        control={control}
                        name="date"
                        render={({ field }) => (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start pl-10 relative h-12 text-base">
                                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <span className="truncate">{field.value ? format(new Date(field.value), "PPP") : "Select Date"}</span>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">{getResultIcon("date")}</div>
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
                </div>
                 <div className="space-y-2">
                  <Label>Name</Label>
                  <SelectionDialog triggerText="Select Name" title="Patient Name" options={nameOptions} onSelect={(val) => setValue("patientName", val, { shouldValidate: true })} icon={User} value={formValues.patientName} resultIcon={getResultIcon("patientName")} />
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
          <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="lg" onClick={handleReset} className="w-auto">
                <RotateCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button type="submit" form={`dispensing-form-${drug.id}`} className="flex-grow" size="lg">
                  <ClipboardList className="mr-2 h-5 w-5" />
                  Check Answers
              </Button>
          </div>
      </div>
    </div>
  );
};


const PatientStatusCard = ({ patient, onSelectPatient }: { patient: Patient, onSelectPatient: (patient: Patient) => void }) => {
    const minutes = Math.floor(patient.initialTime / 60);
    const seconds = patient.initialTime % 60;
    
    const isDead = patient.status === 'dead';

    return (
        <Card className="shadow-lg hover:shadow-xl hover:border-primary/50 transition-all duration-200 h-full flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{patient.name}</CardTitle>
                    <Badge variant="secondary">
                        <Clock className="mr-1.5 h-3.5 w-3.5" />
                        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                    </Badge>
                </div>
                <CardDescription>Age: {patient.age}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">
                    {patient.prescription.drugs.map(d => d.correctAnswers.drugName).join(', ')}
                </p>
            </CardContent>
            <CardFooter>
                 <Button className="w-full" onClick={() => onSelectPatient(patient)} disabled={isDead}>
                    {isDead ? 'Patient Lost' : 'Treat Patient'}
                    {!isDead && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
            </CardFooter>
        </Card>
    )
}

const CountdownTimer = ({ initialTime, onTimeEnd }: { initialTime: number, onTimeEnd: () => void }) => {
    const [timeLeft, setTimeLeft] = useState(initialTime);

    useEffect(() => {
        if (timeLeft <= 0) {
            onTimeEnd();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, onTimeEnd]);

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

// --- MAIN PAGE ---
export default function CeylonPharmacyPage() {
    const [patients, setPatients] = useState<Patient[]>(ceylonPharmacyPatients);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [taskCompletion, setTaskCompletion] = useState({ task1: false, task2: false, task3: false });
    const [dispenseFormResults, setDispenseFormResults] = useState<Record<string, ResultState>>({});

    const stats = useMemo(() => {
        return {
            recovered: patients.filter(p => p.status === 'recovered').length,
            waiting: patients.filter(p => p.status === 'waiting').length,
            lost: patients.filter(p => p.status === 'dead').length,
        };
    }, [patients]);
    
    const handleTimeEnd = () => {
        if (selectedPatient) {
            setPatients(prev => prev.map(p => 
                p.id === selectedPatient.id ? { ...p, status: 'dead' } : p
            ));
            toast({
                variant: 'destructive',
                title: 'Patient Lost',
                description: `Time ran out for ${selectedPatient.name}.`,
            });
            setSelectedPatient(null);
            setTaskCompletion({ task1: false, task2: false, task3: false });
        }
    }

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
        } else {
             toast({
                variant: "destructive",
                title: "Check Your Answers",
                description: "Some details are incorrect for this drug.",
            });
        }

        // Check if all drugs in prescription are now correct
        if (selectedPatient) {
            const allDrugs = selectedPatient.prescription.drugs;
            const updatedResults = { ...dispenseFormResults, [drug.id]: newResults };

            const allDrugsVerified = allDrugs.every(d => {
                const drugResult = updatedResults[d.id];
                return drugResult && Object.values(drugResult).every(r => r === true);
            });

            if(allDrugsVerified) {
                setTaskCompletion(prev => ({...prev, task1: true}));
                toast({
                    title: "Task 1 Complete!",
                    description: "Prescription verification successful."
                });
            }
        }
    }

    const handleDispenseReset = (drugId: string) => {
        setDispenseFormResults(prev => {
            const newResults = { ...prev };
            delete newResults[drugId];
            return newResults;
        });
    }

    const currentPrescription = selectedPatient?.prescription;

    if (selectedPatient && currentPrescription) {
        return (
             <div className="p-4 md:p-8 space-y-6 pb-20">
                <Card className="shadow-xl">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <Button onClick={() => setSelectedPatient(null)} variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Waiting Room
                            </Button>
                             <CountdownTimer initialTime={selectedPatient.initialTime} onTimeEnd={handleTimeEnd} />
                        </div>
                        <div className="pt-4">
                            <CardTitle className="text-2xl">Treating: {selectedPatient.name}</CardTitle>
                            <CardDescription>Complete the tasks below to save the patient.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Task 1: Prescription Label</CardTitle>
                                    <CardDescription>Fill the dispensing label correctly based on the prescription.</CardDescription>
                                </div>
                                {taskCompletion.task1 && <CheckCircle className="h-6 w-6 text-green-500" />}
                            </CardHeader>
                            <CardContent>
                                {currentPrescription.drugs.map(drug => (
                                    <details key={drug.id} className="border-t p-4 last:border-b">
                                        <summary className="cursor-pointer font-medium">{drug.correctAnswers.drugName}</summary>
                                        <div className="mt-4">
                                            <DispensingForm 
                                                drug={drug}
                                                onSubmit={handleDispenseSubmit(drug)}
                                                onReset={() => handleDispenseReset(drug.id)}
                                                results={dispenseFormResults[drug.id] || null}
                                                patientName={currentPrescription.patient.name}
                                                prescriptionDate={currentPrescription.date}
                                            />
                                        </div>
                                    </details>
                                ))}
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Task 2: Counselling Unit</CardTitle>
                                <CardDescription>Provide the correct instructions for the patient.</CardDescription>
                            </CardHeader>
                            <CardContent><p>Counselling component will go here.</p></CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Task 3: POS Training</CardTitle>
                                <CardDescription>Use the POS system to correctly bill the patient.</CardDescription>
                            </CardHeader>
                            <CardContent><p>POS component will go here.</p></CardContent>
                        </Card>
                    </CardContent>
                </Card>
            </div>
        )
    }

  return (
    <div className="p-4 md:p-8 space-y-8 pb-20">
      <header>
        <h1 className="text-3xl font-headline font-semibold">Ceylon Pharmacy Challenge</h1>
        <p className="text-muted-foreground">Treat patients by completing dispensing tasks before time runs out.</p>
      </header>
      
       <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Waiting</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.waiting}</div></CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Recovered</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.recovered}</div></CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Lost</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.lost}</div></CardContent>
            </Card>
       </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Waiting Room</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients.filter(p => p.status === 'waiting').map(patient => (
                <PatientStatusCard key={patient.id} patient={patient} onSelectPatient={setSelectedPatient} />
            ))}
            {stats.waiting === 0 && (
                <p className="md:col-span-3 text-center text-muted-foreground py-10">No patients are currently waiting.</p>
            )}
        </div>
      </section>
    </div>
  );
}
