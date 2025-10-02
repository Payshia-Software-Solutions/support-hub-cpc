
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, PlusCircle, Edit, Trash2, MessageSquare } from "lucide-react";
import { ceylonPharmacyPatients, allInstructions as mockAllInstructions, type Patient, type PrescriptionDrug, type PrescriptionFormValues } from '@/lib/ceylon-pharmacy-data';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

// This component now only displays the list of drugs and links to edit/add pages.
const PrescriptionItem = ({ patientId, drug }: { patientId: string; drug: PrescriptionDrug; }) => {
    const correctInstructions = mockAllInstructions.filter(inst => drug.correctInstructionIds.includes(inst.id));

    const handleDeleteDrug = () => {
        // This would be a mutation in a real app. For now, we'll just show a toast.
        toast({ title: 'Delete Clicked', description: `Would delete drug: ${drug.correctAnswers.drugName}` });
    };

    return (
        <div className="p-3 border rounded-lg bg-muted/50">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-semibold">{drug.correctAnswers.drugName}</p>
                    <div className="text-xs text-muted-foreground space-x-2">
                        <span>Qty: {drug.correctAnswers.quantity}</span>
                    </div>
                </div>
                <div className="flex gap-1">
                    <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                       <Link href={`/admin/manage/games/ceylon-pharmacy/patients/${patientId}/prescription/edit/${drug.id}`}>
                         <Edit className="h-4 w-4" />
                       </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={handleDeleteDrug}><Trash2 className="h-4 w-4" /></Button>
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
            setPatient(JSON.parse(JSON.stringify(foundPatient))); // Deep copy to allow editing
        } else {
            toast({ variant: 'destructive', title: 'Patient not found' });
            router.push('/admin/manage/games/ceylon-pharmacy/patients');
        }
    }, [patientId, router]);
    
    const handlePatientDetailChange = (field: keyof Patient, value: string | number) => {
        if (!patient) return;
        setPatient(prev => prev ? { ...prev, [field]: value } : null);
    }

    const handlePrescriptionDetailChange = (field: keyof Patient['prescription'], value: any) => {
        if (!patient) return;
        setPatient(prev => {
            if (!prev) return null;
            return {
                ...prev,
                prescription: {
                    ...prev.prescription,
                    [field]: value
                }
            };
        });
    };
    
    const handleSavePatientDetails = () => {
        // In a real app, this would be a mutation to an API
        console.log("Saving patient details:", patient);
        toast({ title: 'Patient details saved!' });
    };

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
                            <Input id="patient-name" value={patient.name} onChange={(e) => handlePatientDetailChange('name', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="patient-age">Age</Label>
                            <Input id="patient-age" value={patient.age} onChange={(e) => handlePatientDetailChange('age', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="patient-time">Initial Time (seconds)</Label>
                            <Input id="patient-time" type="number" value={patient.initialTime} onChange={(e) => handlePatientDetailChange('initialTime', Number(e.target.value))} />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSavePatientDetails}>Save Patient Details</Button>
                    </CardFooter>
                </Card>

                <Card className="shadow-lg lg:col-span-2">
                    <CardHeader className="flex flex-row justify-between items-center">
                        <div>
                            <CardTitle>Prescription Management</CardTitle>
                            <CardDescription>Drugs prescribed to {patient.name}.</CardDescription>
                        </div>
                        <Button variant="outline" asChild>
                           <Link href={`/admin/manage/games/ceylon-pharmacy/patients/${patientId}/prescription/add`}>
                             <PlusCircle className="mr-2 h-4 w-4"/> Add Drug
                           </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="total-bill-value">Total Bill Value (LKR)</Label>
                            <Input 
                                id="total-bill-value" 
                                type="number" 
                                value={patient.prescription.totalBillValue} 
                                onChange={(e) => handlePrescriptionDetailChange('totalBillValue', Number(e.target.value))}
                                placeholder="e.g., 1250.00"
                            />
                        </div>
                        <div className="space-y-3 pt-4 border-t">
                            <h4 className="font-medium text-sm">Prescribed Drugs</h4>
                            {patient.prescription.drugs.map(drug => (
                                <PrescriptionItem 
                                    key={drug.id} 
                                    patientId={patientId}
                                    drug={drug} 
                                />
                            ))}
                            {patient.prescription.drugs.length === 0 && (
                                <p className="text-center text-muted-foreground py-8">No drugs in this prescription yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
