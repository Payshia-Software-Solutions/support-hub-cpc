
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
import { Check, X, Pill, Repeat, Calendar, Hash, RotateCw, ArrowLeft } from "lucide-react";

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

export default function DPadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const prescriptionId = params.id as string;
  
  const [results, setResults] = useState<ResultState | null>(null);
  
  const currentPrescription = useMemo(() => {
    return prescriptions.find(p => p.id === prescriptionId);
  }, [prescriptionId]);

  const { control, handleSubmit, formState: { errors }, reset } = useForm<PrescriptionFormValues>({
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
    reset({
      drugName: "",
      dosage: "",
      frequency: "",
      duration: "",
      quantity: undefined,
    });
    setResults(null);
  }, [prescriptionId, reset]);

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

  const getResultIcon = (fieldName: keyof PrescriptionFormValues) => {
    if (results === null) return null;
    if (results[fieldName] === true) return <Check className="h-5 w-5 text-green-500" />;
    if (results[fieldName] === false) return <X className="h-5 w-5 text-destructive" />;
    return null;
  };
  
  if (!currentPrescription) {
    return (
        <div className="p-4 md:p-8 text-center">
            <h1 className="text-xl font-semibold">Prescription not found.</h1>
            <Button onClick={() => router.push('/dashboard/d-pad')} className="mt-4">Back to List</Button>
        </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-8 pb-20">
      <header>
         <Button variant="ghost" className="mb-4 -ml-4" onClick={() => router.push('/dashboard/d-pad')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Prescription List
        </Button>
        <h1 className="text-3xl font-headline font-semibold">D-Pad: Prescription Challenge</h1>
        <p className="text-muted-foreground">Interpret the prescription and fill out the label correctly.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Dispensing Label</CardTitle>
            <CardDescription>Fill in the fields based on the prescription.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="drugName">Drug Name & Strength</Label>
                <div className="relative">
                  <Pill className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Controller name="drugName" control={control} render={({ field }) => ( <Input id="drugName" placeholder="e.g., Amoxicillin 250mg" className="pl-10" {...field} /> )} />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">{getResultIcon("drugName")}</div>
                </div>
                {errors.drugName && <p className="text-sm text-destructive">{errors.drugName.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="dosage">Dosage</Label>
                     <div className="relative">
                       <Pill className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <Controller name="dosage" control={control} render={({ field }) => ( <Input id="dosage" placeholder="e.g., 1" className="pl-10" {...field} /> )} />
                       <div className="absolute right-3 top-1/2 -translate-y-1/2">{getResultIcon("dosage")}</div>
                    </div>
                     {errors.dosage && <p className="text-sm text-destructive">{errors.dosage.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="frequency">Frequency</Label>
                     <div className="relative">
                       <Repeat className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Controller name="frequency" control={control} render={({ field }) => ( <Input id="frequency" placeholder="e.g., tds" className="pl-10" {...field} /> )} />
                       <div className="absolute right-3 top-1/2 -translate-y-1/2">{getResultIcon("frequency")}</div>
                    </div>
                     {errors.frequency && <p className="text-sm text-destructive">{errors.frequency.message}</p>}
                </div>
              </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                     <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Controller name="duration" control={control} render={({ field }) => ( <Input id="duration" placeholder="e.g., 5d" className="pl-10" {...field} /> )} />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">{getResultIcon("duration")}</div>
                    </div>
                     {errors.duration && <p className="text-sm text-destructive">{errors.duration.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="quantity">Total Quantity</Label>
                     <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Controller name="quantity" control={control} render={({ field }) => ( <Input id="quantity" type="number" placeholder="e.g., 15" className="pl-10" {...field} /> )} />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">{getResultIcon("quantity")}</div>
                    </div>
                     {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                 <Button type="button" variant="outline" onClick={() => { setResults(null); reset(); }}>
                    <RotateCw className="mr-2 h-4 w-4" />
                    Try Again
                </Button>
                <Button type="submit">Check Answers</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
