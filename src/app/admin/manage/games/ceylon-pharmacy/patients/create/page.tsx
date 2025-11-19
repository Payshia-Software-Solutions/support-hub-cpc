
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, PlusCircle, Save, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { allInstructions } from '@/lib/ceylon-pharmacy-data';
import { Checkbox } from '@/components/ui/checkbox';

const drugSchema = z.object({
    drugName: z.string().min(1, 'Required'),
    genericName: z.string().optional(),
    quantity: z.coerce.number().min(1),
    lines: z.string().min(1, 'Required'),
    correctInstructionIds: z.array(z.string()).optional(),
});

const patientFormSchema = z.object({
  // Patient Details
  name: z.string().min(1, 'Patient name is required'),
  age: z.string().min(1, 'Age is required'),
  initialTime: z.coerce.number().min(30, 'Time must be at least 30 seconds'),
  address: z.string().optional(),
  patient_description: z.string().optional(),

  // Prescription Details
  prescription_name: z.string().min(1, 'Prescription name is required'),
  doctor_name: z.string().min(1, 'Doctor name is required'),
  notes: z.string().optional(),
  totalBillValue: z.coerce.number().min(0, 'Bill value must be a positive number'),
  
  // Drugs
  drugs: z.array(drugSchema).min(1, 'At least one drug is required'),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

export default function CreatePatientPage() {
  const router = useRouter();

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      initialTime: 300,
      totalBillValue: 0,
      drugs: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "drugs",
  });

  const onSubmit = (data: PatientFormValues) => {
    console.log("Submitting New Patient Data:", data);
    toast({
        title: 'Patient Created!',
        description: `${data.name} has been added to the game.`
    });
    router.push('/admin/manage/games/ceylon-pharmacy/patients');
  };

  return (
    <div className="p-4 md:p-8 space-y-6 pb-20">
       <header>
            <Button variant="ghost" onClick={() => router.back()} className="-ml-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patient List
            </Button>
            <h1 className="text-3xl font-headline font-semibold mt-2">Add New Patient</h1>
            <p className="text-muted-foreground">Create a new patient and their full prescription for the game.</p>
        </header>

        <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* --- Patient & Prescription Info Column --- */}
                <div className="lg:col-span-1 space-y-6 sticky top-24">
                     <Card className="shadow-lg">
                        <CardHeader><CardTitle>Patient Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2"><Label>Name*</Label><Input {...form.register('name')} />{form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}</div>
                            <div className="space-y-2"><Label>Age*</Label><Input {...form.register('age')} placeholder="e.g. 45 Years" />{form.formState.errors.age && <p className="text-xs text-destructive">{form.formState.errors.age.message}</p>}</div>
                            <div className="space-y-2"><Label>Initial Time (seconds)*</Label><Input type="number" {...form.register('initialTime')} />{form.formState.errors.initialTime && <p className="text-xs text-destructive">{form.formState.errors.initialTime.message}</p>}</div>
                            <div className="space-y-2"><Label>Address</Label><Textarea {...form.register('address')} rows={2}/></div>
                            <div className="space-y-2"><Label>Patient Description</Label><Textarea {...form.register('patient_description')} rows={2}/></div>
                        </CardContent>
                    </Card>
                     <Card className="shadow-lg">
                        <CardHeader><CardTitle>Prescription Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2"><Label>Prescription Name*</Label><Input {...form.register('prescription_name')} />{form.formState.errors.prescription_name && <p className="text-xs text-destructive">{form.formState.errors.prescription_name.message}</p>}</div>
                            <div className="space-y-2"><Label>Doctor's Name*</Label><Input {...form.register('doctor_name')} />{form.formState.errors.doctor_name && <p className="text-xs text-destructive">{form.formState.errors.doctor_name.message}</p>}</div>
                            <div className="space-y-2"><Label>Total Bill Value (LKR)*</Label><Input type="number" step="0.01" {...form.register('totalBillValue')} />{form.formState.errors.totalBillValue && <p className="text-xs text-destructive">{form.formState.errors.totalBillValue.message}</p>}</div>
                            <div className="space-y-2"><Label>Notes</Label><Textarea {...form.register('notes')} rows={2}/></div>
                        </CardContent>
                    </Card>
                </div>

                {/* --- Drugs Column --- */}
                 <div className="lg:col-span-2 space-y-6">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Prescribed Drugs</CardTitle>
                            {form.formState.errors.drugs?.root && <p className="text-sm text-destructive font-medium">{form.formState.errors.drugs.root.message}</p>}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {fields.map((field, index) => (
                                <Card key={field.id} className="p-4 bg-muted/50 relative">
                                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => remove(index)}><Trash2 className="h-4 w-4"/></Button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label>Drug Name*</Label><Input {...form.register(`drugs.${index}.drugName`)} />{form.formState.errors.drugs?.[index]?.drugName && <p className="text-xs text-destructive">Required</p>}</div>
                                        <div className="space-y-2"><Label>Generic Name</Label><Input {...form.register(`drugs.${index}.genericName`)} /></div>
                                        <div className="space-y-2"><Label>Quantity*</Label><Input type="number" {...form.register(`drugs.${index}.quantity`)} />{form.formState.errors.drugs?.[index]?.quantity && <p className="text-xs text-destructive">Required</p>}</div>
                                        <div className="md:col-span-2 space-y-2"><Label>Prescription Lines (one per line)*</Label><Textarea {...form.register(`drugs.${index}.lines`)} rows={2}/>{form.formState.errors.drugs?.[index]?.lines && <p className="text-xs text-destructive">Required</p>}</div>
                                        <div className="md:col-span-2 space-y-2">
                                            <Label>Correct Counselling Instructions</Label>
                                            <div className="p-3 border rounded-md max-h-32 overflow-y-auto space-y-2 bg-background">
                                                {allInstructions.map(inst => (
                                                    <div key={inst.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`drug-${index}-inst-${inst.id}`}
                                                            onCheckedChange={(checked) => {
                                                                const fieldName = `drugs.${index}.correctInstructionIds`;
                                                                const currentIds = form.getValues(fieldName) || [];
                                                                const newIds = checked ? [...currentIds, inst.id] : currentIds.filter(id => id !== inst.id);
                                                                form.setValue(fieldName, newIds);
                                                            }}
                                                        />
                                                        <Label htmlFor={`drug-${index}-inst-${inst.id}`} className="text-sm font-normal">{inst.text}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            <Button type="button" variant="outline" className="w-full" onClick={() => append({ drugName: '', quantity: 1, lines: '', correctInstructionIds: [] })}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Another Drug
                            </Button>
                        </CardContent>
                    </Card>
                     <div className="flex justify-end">
                        <Button type="submit" size="lg">
                            <Save className="mr-2 h-4 w-4" /> Create Patient
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    </div>
  );
}
