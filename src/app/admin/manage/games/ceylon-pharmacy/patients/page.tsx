
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, User, PlusCircle } from "lucide-react";
import Link from 'next/link';
import { ceylonPharmacyPatients } from '@/lib/ceylon-pharmacy-data';
import type { Patient } from '@/lib/ceylon-pharmacy-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AddPatientDialog = ({ onAddPatient }: { onAddPatient: (patient: Patient) => void }) => {
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [initialTime, setInitialTime] = useState('300');

    const handleAdd = () => {
        if (!name.trim() || !age.trim() || !initialTime.trim()) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all fields.' });
            return;
        }

        const newPatient: Patient = {
            id: `patient-${Date.now()}`,
            name,
            age: `${age} Years`,
            status: 'waiting',
            initialTime: parseInt(initialTime, 10),
            prescription: {
                id: `rx-${Date.now()}`,
                doctor: { name: 'Dr. Placeholder', specialty: 'General Practice', regNo: '00000' },
                patient: { name, age },
                date: new Date().toISOString().split('T')[0],
                drugs: [],
                totalBillValue: 0,
            },
        };
        onAddPatient(newPatient);
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add New Patient</DialogTitle>
                <DialogDescription>Create a new patient profile for the Ceylon Pharmacy game.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="patient-name">Patient Name</Label>
                    <Input id="patient-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Nimal Silva" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="patient-age">Age</Label>
                        <Input id="patient-age" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g., 45" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="initial-time">Initial Time (seconds)</Label>
                        <Input id="initial-time" type="number" value={initialTime} onChange={(e) => setInitialTime(e.target.value)} placeholder="e.g., 300" />
                    </div>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                    <Button onClick={handleAdd}>Add Patient</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    );
};


export default function ManagePatientsPage() {
    const router = useRouter();
    const [patients, setPatients] = useState<Patient[]>(ceylonPharmacyPatients);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    const handleAddPatient = (newPatient: Patient) => {
        setPatients(prev => [newPatient, ...prev]);
        toast({ title: "Patient Added", description: `${newPatient.name} has been added to the list.` });
    };

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <AddPatientDialog onAddPatient={handleAddPatient} />
            </Dialog>

            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <Button variant="ghost" onClick={() => router.push('/admin/manage/games/ceylon-pharmacy')} className="-ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Game Setup
                    </Button>
                    <h1 className="text-3xl font-headline font-semibold mt-2">Manage Patients & Prescriptions</h1>
                    <p className="text-muted-foreground">Select a patient to view or edit their profile and prescription details.</p>
                </div>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Patient
                </Button>
            </header>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Patient List</CardTitle>
                    <CardDescription>{patients.length} patients configured for the game.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {patients.map(patient => (
                        <Link key={patient.id} href={`/admin/manage/games/ceylon-pharmacy/patients/${patient.id}`} className="group block">
                            <Card className="hover:shadow-md hover:border-primary transition-all">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <Avatar className="h-12 w-12 text-lg">
                                        <AvatarImage src={`https://placehold.co/100x100.png?text=${patient.name.charAt(0)}`} alt={patient.name} />
                                        <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-semibold text-card-foreground group-hover:text-primary">{patient.name}</p>
                                        <p className="text-sm text-muted-foreground">{patient.age}</p>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform"/>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
