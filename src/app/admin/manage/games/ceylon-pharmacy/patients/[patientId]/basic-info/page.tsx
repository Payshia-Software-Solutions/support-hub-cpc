
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Loader2, AlertTriangle, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCeylonPharmacyPrescriptions, savePrescription } from '@/lib/actions/games';
import type { GamePatient, PrescriptionSubmissionPayload } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar as CalendarIcon } from 'lucide-react';


const patientFormSchema = z.object({
  name: z.string().min(1, 'Patient name is required'),
  age: z.string().min(1, 'Age is required'),
  address: z.string().optional(),
  patient_description: z.string().optional(),
  prescription_name: z.string().min(1, 'Prescription name is required'),
  pres_date: z.string().min(1, 'Prescription date is required'),
  doctor_name: z.string().min(1, 'Doctor name is required'),
  Pres_Method: z.string().min(1, 'Prescription Method is required.'),
  notes: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;


export default function EditPatientBasicInfoPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId as string;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: patient, isLoading: isLoadingPatient, isError, error } = useQuery<GamePatient>({
      queryKey: ['ceylonPharmacyPatient', patientId],
      queryFn: async () => {
          const allPatients = await getCeylonPharmacyPrescriptions('admin-user', 'CPCC20');
          const foundPatient = allPatients.find(p => p.prescription_id === patientId);
          if (!foundPatient) throw new Error('Patient not found');
          return foundPatient;
      },
      enabled: !!patientId,
  });

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {},
  });
  
   const saveMutation = useMutation({
    mutationFn: (data: { prescriptionPayload: PrescriptionSubmissionPayload, prescriptionId: string }) => 
        savePrescription(data.prescriptionPayload, [], data.prescriptionId), // Pass empty drugs array
    onSuccess: () => {
        toast({
            title: 'Patient Details Updated!',
            description: `The basic information has been saved.`
        });
        queryClient.invalidateQueries({ queryKey: ['ceylonPharmacyPatient', patientId] });
        router.push(`/admin/manage/games/ceylon-pharmacy/patients/${patientId}`);
    },
    onError: (error: Error) => {
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: error.message,
        });
    }
  });


  useEffect(() => {
    if (patient) {
        form.reset({
            name: patient.Pres_Name,
            age: patient.Pres_Age,
            address: patient.address,
            patient_description: patient.patient_description,
            prescription_name: patient.prescription_name,
            pres_date: patient.pres_date,
            doctor_name: patient.doctor_name,
            Pres_Method: patient.Pres_Method,
            notes: patient.notes,
        });
    }
  }, [patient, form]);

  const onSubmit = (data: PatientFormValues) => {
    if (!user || !patient) {
        toast({ variant: 'destructive', title: 'Error', description: 'User or patient data missing.'});
        return;
    }
    
    const prescriptionPayload: PrescriptionSubmissionPayload = {
      prescription_name: data.prescription_name,
      prescription_status: patient.prescription_status || "Active",
      created_at: patient.created_at || format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      created_by: user.username || 'admin',
      Pres_Name: data.name,
      pres_date: data.pres_date,
      Pres_Age: parseInt(data.age, 10),
      Pres_Method: data.Pres_Method,
      doctor_name: data.doctor_name,
      notes: data.notes || '',
      patient_description: data.patient_description || '',
      address: data.address || '',
    };
    
    saveMutation.mutate({ prescriptionPayload, prescriptionId: patient.prescription_id });
  };
  
  if (isLoadingPatient) {
      return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></div>
  }
  
  if (isError) {
      return (
          <div className="p-8 text-center">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="font-semibold">Failed to load patient data.</p>
              <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
          </div>
      )
  }
  
  return (
    <div className="p-4 md:p-8 space-y-6 pb-20">
       <header>
            <Button variant="ghost" onClick={() => router.back()} className="-ml-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patient Hub
            </Button>
            <h1 className="text-3xl font-headline font-semibold mt-2">Edit Basic Info: {patient?.Pres_Name}</h1>
            <p className="text-muted-foreground">Modify the patient's details and prescription header.</p>
        </header>

        <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Patient & Prescription Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                     <div className="space-y-2">
                        <Label>Prescription Name*</Label>
                        <Input {...form.register('prescription_name')} placeholder="e.g. Regular Checkup"/>
                        {form.formState.errors.prescription_name && <p className="text-xs text-destructive">{form.formState.errors.prescription_name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Patient Name*</Label>
                        <Input {...form.register('name')} placeholder="e.g. John Doe"/>
                        {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label>Prescription Date*</Label>
                        <Controller
                            control={form.control}
                            name="pres_date"
                            render={({ field }) => (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start text-left font-normal h-10 text-sm">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
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
                        {form.formState.errors.pres_date && <p className="text-xs text-destructive">{form.formState.errors.pres_date.message}</p>}
                    </div>
                    <div className="space-y-2"><Label>Patient Age*</Label><Input {...form.register('age')} placeholder="e.g. 45 Years" />{form.formState.errors.age && <p className="text-xs text-destructive">{form.formState.errors.age.message}</p>}</div>
                    <div className="space-y-2"><Label>Address</Label><Input {...form.register('address')} /></div>
                    <div className="space-y-2"><Label>Doctor's Name*</Label><Input {...form.register('doctor_name')} />{form.formState.errors.doctor_name && <p className="text-xs text-destructive">{form.formState.errors.doctor_name.message}</p>}</div>
                    <div className="space-y-2"><Label>Prescription Method*</Label><Input {...form.register('Pres_Method')} />{form.formState.errors.Pres_Method && <p className="text-xs text-destructive">{form.formState.errors.Pres_Method.message}</p>}</div>
                    <div className="space-y-2 lg:col-span-3"><Label>Patient Description</Label><Textarea {...form.register('patient_description')} rows={2}/></div>
                    <div className="space-y-2 lg:col-span-3"><Label>Prescription Notes</Label><Textarea {...form.register('notes')} rows={2}/></div>
                </CardContent>
                 <CardFooter>
                    <Button type="submit" size="lg" disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </CardFooter>
            </Card>
        </form>
    </div>
  );
}
