
"use client";

import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { savePrescription } from '@/lib/actions/games';
import type { PrescriptionSubmissionPayload } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

const patientFormSchema = z.object({
  name: z.string().min(1, 'Patient name is required'),
  age: z.string().min(1, 'Age is required'),
  initialTime: z.coerce.number().min(30, 'Time must be at least 30 seconds'),
  address: z.string().optional(),
  patient_description: z.string().optional(),
  prescription_name: z.string().min(1, 'Prescription name is required'),
  pres_date: z.string().min(1, 'Prescription date is required'),
  doctor_name: z.string().min(1, 'Doctor name is required'),
  notes: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;


export default function CreatePatientPage() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      initialTime: 3600,
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: { prescriptionPayload: PrescriptionSubmissionPayload, drugs: any[] }) => savePrescription(data.prescriptionPayload, data.drugs),
    onSuccess: (data) => {
        toast({
            title: 'Patient Created!',
            description: `The new patient has been saved. You will now be redirected to edit the prescription.`
        });
        queryClient.invalidateQueries({ queryKey: ['allCeylonPharmacyPatients'] });
        router.push(`/admin/manage/games/ceylon-pharmacy/patients/${data.prescription.prescription_id}`);
    },
    onError: (error: Error) => {
        toast({
            variant: "destructive",
            title: "Creation Failed",
            description: error.message,
        });
    }
  });

  const onSubmit = (data: PatientFormValues) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to save.'});
        return;
    }
    
    const prescriptionPayload: PrescriptionSubmissionPayload = {
      prescription_name: data.prescription_name,
      prescription_status: "Active",
      created_at: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      created_by: user.username || 'admin',
      Pres_Name: data.name,
      pres_date: data.pres_date,
      Pres_Age: parseInt(data.age, 10),
      Pres_Method: 'N/A', // Default value
      doctor_name: data.doctor_name,
      notes: data.notes || '',
      patient_description: data.patient_description || '',
      address: data.address || '',
    };
    
    // Pass an empty array for drugs, as they will be added on the edit page
    saveMutation.mutate({ prescriptionPayload, drugs: [] });
  };
  
  return (
    <div className="p-4 md:p-8 space-y-6 pb-20">
       <header>
            <Button variant="ghost" onClick={() => router.back()} className="-ml-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patient List
            </Button>
            <h1 className="text-3xl font-headline font-semibold mt-2">Add New Patient</h1>
            <p className="text-muted-foreground">Create a new patient record. You can add drugs after saving.</p>
        </header>

        <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card className="shadow-lg mb-6">
                <CardHeader>
                    <CardTitle>Patient &amp; Prescription Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                    <div className="space-y-2"><Label>Patient Name*</Label><Input {...form.register('name')} />{form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}</div>
                    <div className="space-y-2"><Label>Patient Age*</Label><Input {...form.register('age')} placeholder="e.g. 45 Years" />{form.formState.errors.age && <p className="text-xs text-destructive">{form.formState.errors.age.message}</p>}</div>
                    <div className="space-y-2"><Label>Address</Label><Input {...form.register('address')} /></div>
                    <div className="space-y-2"><Label>Prescription Name*</Label><Input {...form.register('prescription_name')} placeholder="e.g. Regular Checkup"/>{form.formState.errors.prescription_name && <p className="text-xs text-destructive">{form.formState.errors.prescription_name.message}</p>}</div>
                    <div className="space-y-2"><Label>Prescription Date*</Label><Input type="date" {...form.register('pres_date')} />{form.formState.errors.pres_date && <p className="text-xs text-destructive">{form.formState.errors.pres_date.message}</p>}</div>
                    <div className="space-y-2"><Label>Doctor's Name*</Label><Input {...form.register('doctor_name')} />{form.formState.errors.doctor_name && <p className="text-xs text-destructive">{form.formState.errors.doctor_name.message}</p>}</div>
                    <div className="space-y-2"><Label>Initial Time (seconds)*</Label><Input type="number" {...form.register('initialTime')} />{form.formState.errors.initialTime && <p className="text-xs text-destructive">{form.formState.errors.initialTime.message}</p>}</div>
                    <div className="space-y-2 lg:col-span-3"><Label>Patient Description</Label><Textarea {...form.register('patient_description')} rows={2}/></div>
                    <div className="space-y-2 lg:col-span-3"><Label>Prescription Notes</Label><Textarea {...form.register('notes')} rows={2}/></div>
                </CardContent>
            </Card>

            <div className="flex justify-end mt-6">
                <Button type="submit" size="lg" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                    Save and Add Drugs
                </Button>
            </div>
        </form>
    </div>
  );
}
