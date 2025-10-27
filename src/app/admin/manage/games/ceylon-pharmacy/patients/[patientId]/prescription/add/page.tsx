
"use client";

import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, PlusCircle, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { allInstructions, type PrescriptionDrug, type PrescriptionFormValues } from '@/lib/ceylon-pharmacy-data';

const drugSchema = z.object({
  drugName: z.string().min(1, 'Drug name is required'),
  genericName: z.string().optional(),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  lines: z.string().transform(val => val.split('\n').filter(Boolean)),
  correctInstructionIds: z.array(z.string()).optional(),
});

type DrugFormValues = z.infer<typeof drugSchema>;

export default function AddPrescriptionDrugPage() {
    const router = useRouter();
    const params = useParams();
    const patientId = params.patientId as string;

    const form = useForm<DrugFormValues>({
        resolver: zodResolver(drugSchema),
        defaultValues: {
            drugName: '',
            genericName: '',
            quantity: 1,
            lines: '',
            correctInstructionIds: [],
        },
    });

    const onSubmit = (data: DrugFormValues) => {
        // In a real app, this would be a useMutation call to the API.
        console.log('Adding new drug to patient:', patientId, data);
        toast({
            title: 'Drug Added!',
            description: `Successfully added "${data.drugName}" to the prescription.`
        });
        router.push(`/admin/manage/games/ceylon-pharmacy/patients/${patientId}`);
    };

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                 <Button variant="ghost" onClick={() => router.back()} className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patient
                </Button>
                <h1 className="text-3xl font-headline font-semibold mt-2">Add New Drug</h1>
                <p className="text-muted-foreground">Add a new medication to the prescription for this patient.</p>
            </header>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Medication Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2"><Label>Drug Name*</Label><Input {...form.register('drugName')} />{form.formState.errors.drugName && <p className="text-sm text-destructive">{form.formState.errors.drugName.message}</p>}</div>
                        <div className="space-y-2"><Label>Generic Name</Label><Input {...form.register('genericName')} /></div>
                        <div className="space-y-2"><Label>Quantity*</Label><Input type="number" {...form.register('quantity')} />{form.formState.errors.quantity && <p className="text-sm text-destructive">{form.formState.errors.quantity.message}</p>}</div>
                        <div className="md:col-span-2 space-y-2"><Label>Prescription Lines (one per line)</Label><Textarea {...form.register('lines')} rows={3}/></div>
                        <div className="md:col-span-2 space-y-2">
                            <Label>Correct Counselling Instructions</Label>
                            <div className="p-3 border rounded-md max-h-48 overflow-y-auto space-y-2">
                                {allInstructions.map(inst => (
                                    <div key={inst.id} className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={`inst-${inst.id}`}
                                            onCheckedChange={(checked) => {
                                                const currentIds = form.getValues('correctInstructionIds') || [];
                                                const newIds = checked ? [...currentIds, inst.id] : currentIds.filter(id => id !== inst.id);
                                                form.setValue('correctInstructionIds', newIds);
                                            }}
                                        />
                                        <Label htmlFor={`inst-${inst.id}`} className="text-sm font-normal">{inst.text}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit">
                            <Save className="mr-2 h-4 w-4" /> Save Drug
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
