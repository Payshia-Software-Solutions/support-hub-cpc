
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


export default function ManagePatientsPage() {
    const router = useRouter();
    const [patients, setPatients] = useState<Patient[]>(ceylonPharmacyPatients);

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                 <div>
                    <Button variant="ghost" onClick={() => router.push('/admin/manage/games/ceylon-pharmacy')} className="-ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Game Setup
                    </Button>
                    <h1 className="text-3xl font-headline font-semibold mt-2">Manage Patients & Prescriptions</h1>
                    <p className="text-muted-foreground">Add new patients or select one to edit their profile and prescription details.</p>
                </div>
                 <Button asChild>
                    <Link href="/admin/manage/games/ceylon-pharmacy/patients/create">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Patient
                    </Link>
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
