
"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Check, X, Pill, Repeat, Calendar, Hash, RotateCw } from "lucide-react";

const prescriptionSchema = z.object({
  drugName: z.string().nonempty("Drug name is required."),
  dosage: z.string().nonempty("Dosage is required."),
  frequency: z.string().nonempty("Frequency is required."),
  duration: z.string().nonempty("Duration is required."),
  quantity: z.coerce.number().min(1, "Quantity must be greater than 0."),
});

type PrescriptionFormValues = z.infer<typeof prescriptionSchema>;

const correctAnswers: PrescriptionFormValues = {
  drugName: "Paracetamol 500mg",
  dosage: "1", // Assuming one tablet per dose
  frequency: "tds",
  duration: "5d",
  quantity: 15, // 1 tablet * 3 times a day * 5 days
};

type ResultState = {
  [K in keyof PrescriptionFormValues]?: boolean;
};

export default function DPadPage() {
  const [results, setResults] = useState<ResultState | null>(null);
  const { control, handleSubmit, formState: { errors } } = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      drugName: "",
      dosage: "",
      frequency: "",
      duration: "",
      quantity: undefined,
    },
  });

  const onSubmit = (data: PrescriptionFormValues) => {
    const newResults: ResultState = {};
    let allCorrect = true;
    for (const key in correctAnswers) {
      const formKey = key as keyof PrescriptionFormValues;
      if (String(data[formKey]).toLowerCase().trim() === String(correctAnswers[formKey]).toLowerCase().trim()) {
        newResults[formKey] = true;
      } else {
        newResults[formKey] = false;
        allCorrect = false;
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

  return (
    <div className="p-4 md:p-8 space-y-8 pb-20">
      <header>
        <h1 className="text-3xl font-headline font-semibold">D-Pad: Prescription Challenge</h1>
        <p className="text-muted-foreground">Interpret the prescription and fill out the label correctly.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Prescription</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Image
              src="/images/prescription.png"
              alt="Prescription for Paracetamol"
              width={500}
              height={700}
              className="rounded-lg border object-contain"
              data-ai-hint="prescription document"
            />
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
                 <Button type="button" variant="outline" onClick={() => { setResults(null); }}>
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
