
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Patient } from '@/lib/ceylon-pharmacy-data';

export default function CreatePatientPage() {
    const router = useRouter();

    // Form state
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [initialTime, setInitialTime] = useState('300');
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');
    const [prescriptionName, setPrescriptionName] = useState('');
    const [doctorName, setDoctorName] = useState('');
    const [prescriptionNotes, setPrescriptionNotes] = useState('');

    const handleSave = () => {
        if (!name.trim() || !age.trim() || !initialTime.trim() || !prescriptionName.trim() || !doctorName.trim()) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all required patient and prescription fields.' });
            return;
        }

        const newPatient: Patient = {
            id: `patient-${Date.now()}`,
            name,
            age: `${age} Years`,
            status: 'waiting',
            initialTime: parseInt(initialTime, 10),
            description: description,
            address: address,
            createdBy: 'admin', // Placeholder
            createdAt: new Date().toISOString(),
            prescription: {
                id: `rx-${Date.now()}`,
                name: prescriptionName,
                status: "Active",
                doctor: { name: doctorName, specialty: 'General Practice', regNo: '00000' },
                patient: { name, age },
                date: new Date().toISOString().split('T')[0],
                method: 'Standard',
                notes: prescriptionNotes,
                drugs: [],
                totalBillValue: 0,
            },
        };
        
        // In a real app, this would be a useMutation call to the API.
        console.log("Saving new patient:", newPatient);
        toast({ title: 'Patient Created', description: `${name} has been added.` });
        router.push('/admin/manage/games/ceylon-pharmacy/patients');
    };

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                 <Button variant="ghost" onClick={() => router.push('/admin/manage/games/ceylon-pharmacy/patients')} className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patient List
                </Button>
                <h1 className="text-3xl font-headline font-semibold mt-2">Create New Patient</h1>
                <p className="text-muted-foreground">Fill in the patient and initial prescription details.</p>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <Card className="lg:col-span-2 shadow-lg">
                    <CardHeader>
                        <CardTitle>Patient & Prescription Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4 p-4 border rounded-lg">
                             <h4 className="font-semibold text-md">Patient Details</h4>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                 <div className="space-y-1"><Label>Patient Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Nimal Silva" /></div>
                                 <div className="space-y-1"><Label>Age</Label><Input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g., 45" /></div>
                                 <div className="space-y-1"><Label>Initial Time (sec)</Label><Input type="number" value={initialTime} onChange={(e) => setInitialTime(e.target.value)} /></div>
                            </div>
                             <div className="space-y-1"><Label>Address</Label><Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Patient's address" rows={2}/></div>
                             <div className="space-y-1"><Label>Patient Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Any relevant patient notes..." rows={2}/></div>
                        </div>

                        <div className="space-y-4 p-4 border rounded-lg">
                            <h4 className="font-semibold text-md">Initial Prescription Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1"><Label>Prescription Name</Label><Input value={prescriptionName} onChange={(e) => setPrescriptionName(e.target.value)} placeholder="e.g., Weekly Medication" /></div>
                                 <div className="space-y-1"><Label>Doctor's Name</Label><Input value={doctorName} onChange={(e) => setDoctorName(e.target.value)} placeholder="e.g., Dr. Perera" /></div>
                            </div>
                             <div className="space-y-1"><Label>Prescription Notes</Label><Textarea value={prescriptionNotes} onChange={(e) => setPrescriptionNotes(e.target.value)} placeholder="e.g., Review after 1 week" rows={2}/></div>
                        </div>

                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSave}>
                            <Save className="mr-2 h-4 w-4" />
                            Save Patient
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
