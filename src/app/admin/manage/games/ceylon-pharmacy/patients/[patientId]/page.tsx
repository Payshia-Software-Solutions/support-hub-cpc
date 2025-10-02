
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, PlusCircle, Edit, Trash2, MessageSquare } from "lucide-react";
import { ceylonPharmacyPatients, generalStoreItems, type Patient, type PrescriptionDrug } from '@/lib/ceylon-pharmacy-data';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

// Mock data, would be fetched from an API in a real app
const allInstructions = [
  { id: '1', text: 'Take with a full glass of water.' },
  { id: '2', text: 'Complete the full course of medication.' },
  { id: '3', text: 'May cause drowsiness. Do not operate heavy machinery.' },
  { id: '4', text: 'Avoid direct sunlight.' },
  { id: '5', text: 'Take 30 minutes before food.' },
  { id: '6', text: 'Finish all medication even if you feel better.' },
  { id: '7', text: 'None' },
];


// This would be a form in a real application
const PrescriptionItem = ({ drug }: { drug: PrescriptionDrug }) => {
    const correctInstructions = allInstructions.filter(inst => drug.correctInstructionIds.includes(inst.id));

    return (
        <div className="p-3 border rounded-lg bg-muted/50">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-semibold">{drug.correctAnswers.drugName}</p>
                    <div className="text-xs text-muted-foreground space-x-2">
                        <span>{drug.correctAnswers.dosageForm}</span>
                        <span>|</span>
                        <span>Qty: {drug.correctAnswers.quantity}</span>
                    </div>
                </div>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
            </div>
             <div className="mt-2 pt-2 border-t">
                <h4 className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5"/>Correct Instructions</h4>
                 <div className="flex flex-wrap gap-1">
                    {correctInstructions.length > 0 ? (
                        correctInstructions.map(inst => (
                            <Badge key={inst.id} variant="secondary">{inst.text}</Badge>
                        ))
                    ) : (
                        <Badge variant="outline">No specific instructions</Badge>
                    )}
                </div>
            </div>
        </div>
    );
};



export default function PatientDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const patientId = params.patientId as string;

    const [patient, setPatient] = useState<Patient | null>(null);

    useEffect(() => {
        const foundPatient = ceylonPharmacyPatients.find(p => p.id === patientId);
        if (foundPatient) {
            setPatient(foundPatient);
        } else {
            toast({ variant: 'destructive', title: 'Patient not found' });
            router.push('/admin/manage/games/ceylon-pharmacy/patients');
        }
    }, [patientId, router]);
    
    if (!patient) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
             <header>
                <Button variant="ghost" onClick={() => router.push('/admin/manage/games/ceylon-pharmacy/patients')} className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patient List
                </Button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <Card className="shadow-lg lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Patient Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="patient-name">Name</Label>
                            <Input id="patient-name" defaultValue={patient.name} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="patient-age">Age</Label>
                            <Input id="patient-age" defaultValue={patient.age} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="patient-time">Initial Time (seconds)</Label>
                            <Input id="patient-time" type="number" defaultValue={patient.initialTime} />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button>Save Patient Details</Button>
                    </CardFooter>
                </Card>

                <Card className="shadow-lg lg:col-span-2">
                    <CardHeader className="flex flex-row justify-between items-center">
                        <div>
                            <CardTitle>Prescription Management</CardTitle>
                            <CardDescription>Drugs prescribed to {patient.name}.</CardDescription>
                        </div>
                        <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4"/> Add Drug</Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {patient.prescription.drugs.map(drug => (
                            <PrescriptionItem key={drug.id} drug={drug} />
                        ))}
                         {patient.prescription.drugs.length === 0 && (
                            <p className="text-center text-muted-foreground py-8">No drugs in this prescription yet.</p>
                         )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
