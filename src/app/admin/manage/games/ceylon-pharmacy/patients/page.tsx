
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, User, PlusCircle, ChevronDown, UserPlus } from "lucide-react";
import Link from 'next/link';
import { ceylonPharmacyPatients } from '@/lib/ceylon-pharmacy-data';
import type { Patient, Prescription } from '@/lib/ceylon-pharmacy-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';


const AddPatientForm = ({ onAddPatient }: { onAddPatient: (patient: Patient) => void }) => {
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [initialTime, setInitialTime] = useState('300');
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');
    const [prescriptionName, setPrescriptionName] = useState('');
    const [doctorName, setDoctorName] = useState('');
    const [prescriptionNotes, setPrescriptionNotes] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const handleAdd = () => {
        if (!name.trim() || !age.trim() || !initialTime.trim() || !prescriptionName.trim() || !doctorName.trim()) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all required fields.' });
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
        onAddPatient(newPatient);
        // Reset form
        setName('');
        setAge('');
        setInitialTime('300');
        setDescription('');
        setAddress('');
        setPrescriptionName('');
        setDoctorName('');
        setPrescriptionNotes('');
        setIsOpen(false);
    };

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card className="shadow-none border-dashed">
                <CardHeader className="p-4">
                    <CollapsibleTrigger asChild>
                        <div className="flex justify-between items-center cursor-pointer">
                             <div className="flex items-center gap-3">
                                <UserPlus className="w-8 h-8 text-primary" />
                                <div>
                                    <CardTitle className="text-lg">Add New Patient</CardTitle>
                                    <CardDescription>Click to expand and create a new patient profile.</CardDescription>
                                </div>
                            </div>
                            <ChevronDown className={cn("h-5 w-5 transition-transform", isOpen && "rotate-180")} />
                        </div>
                    </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                    <CardContent className="p-4 space-y-4">
                        <h4 className="font-semibold text-md">Patient Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div className="space-y-1"><Label>Patient Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Nimal Silva" /></div>
                             <div className="space-y-1"><Label>Age</Label><Input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g., 45" /></div>
                             <div className="space-y-1"><Label>Initial Time (sec)</Label><Input type="number" value={initialTime} onChange={(e) => setInitialTime(e.target.value)} /></div>
                        </div>
                         <div className="space-y-1"><Label>Address</Label><Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Patient's address" rows={2}/></div>
                         <div className="space-y-1"><Label>Patient Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Any relevant patient notes..." rows={2}/></div>
                        
                        <h4 className="font-semibold text-md pt-4 border-t">Prescription Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1"><Label>Prescription Name</Label><Input value={prescriptionName} onChange={(e) => setPrescriptionName(e.target.value)} placeholder="e.g., Weekly Medication" /></div>
                             <div className="space-y-1"><Label>Doctor's Name</Label><Input value={doctorName} onChange={(e) => setDoctorName(e.target.value)} placeholder="e.g., Dr. Perera" /></div>
                        </div>
                         <div className="space-y-1"><Label>Prescription Notes</Label><Textarea value={prescriptionNotes} onChange={(e) => setPrescriptionNotes(e.target.value)} placeholder="e.g., Review after 1 week" rows={2}/></div>

                    </CardContent>
                     <CardFooter className="p-4">
                        <Button onClick={handleAdd}>Save New Patient</Button>
                    </CardFooter>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
};


export default function ManagePatientsPage() {
    const router = useRouter();
    const [patients, setPatients] = useState<Patient[]>(ceylonPharmacyPatients);

    const handleAddPatient = (newPatient: Patient) => {
        setPatients(prev => [newPatient, ...prev]);
        toast({ title: "Patient Added", description: `${newPatient.name} has been added to the list.` });
    };

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <Button variant="ghost" onClick={() => router.push('/admin/manage/games/ceylon-pharmacy')} className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Game Setup
                </Button>
                <h1 className="text-3xl font-headline font-semibold mt-2">Manage Patients & Prescriptions</h1>
                <p className="text-muted-foreground">Add new patients or select one to edit their profile and prescription details.</p>
            </header>
            
            <AddPatientForm onAddPatient={handleAddPatient} />

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
