
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, HeartPulse, Users, Clock, ArrowRight } from 'lucide-react';
import { ceylonPharmacyPatients, type Patient } from '@/lib/ceylon-pharmacy-data';
import Link from 'next/link';

const PatientStatusCard = ({ patient }: { patient: Patient }) => {
    const minutes = Math.floor(patient.initialTime / 60);
    const seconds = patient.initialTime % 60;
    
    const isDead = patient.status === 'dead';

    return (
        <Card className="shadow-lg hover:shadow-xl hover:border-primary/50 transition-all duration-200 h-full flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{patient.name}</CardTitle>
                    <Badge variant="secondary">
                        <Clock className="mr-1.5 h-3.5 w-3.5" />
                        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                    </Badge>
                </div>
                <CardDescription>Age: {patient.age}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">
                    {patient.prescription.drugs.map(d => d.correctAnswers.drugName).join(', ')}
                </p>
            </CardContent>
            <CardFooter>
                 <Button asChild className="w-full" disabled={isDead}>
                    <Link href={`/dashboard/ceylon-pharmacy/${patient.id}`}>
                        {isDead ? 'Patient Lost' : 'Treat Patient'}
                        {!isDead && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}

// --- MAIN PAGE ---
export default function CeylonPharmacyPage() {
    const [patients, setPatients] = useState<Patient[]>(ceylonPharmacyPatients);

    const stats = useMemo(() => {
        return {
            recovered: patients.filter(p => p.status === 'recovered').length,
            waiting: patients.filter(p => p.status === 'waiting').length,
            lost: patients.filter(p => p.status === 'dead').length,
        };
    }, [patients]);
    
  return (
    <div className="p-4 md:p-8 space-y-8 pb-20">
      <header>
        <h1 className="text-3xl font-headline font-semibold">Ceylon Pharmacy Challenge</h1>
        <p className="text-muted-foreground">Treat patients by completing dispensing tasks before time runs out.</p>
      </header>
      
       <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Waiting</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.waiting}</div></CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Recovered</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.recovered}</div></CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Lost</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.lost}</div></CardContent>
            </Card>
       </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Waiting Room</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients.filter(p => p.status === 'waiting').map(patient => (
                <PatientStatusCard key={patient.id} patient={patient} />
            ))}
            {stats.waiting === 0 && (
                <p className="md:col-span-3 text-center text-muted-foreground py-10">No patients are currently waiting.</p>
            )}
        </div>
      </section>
    </div>
  );
}
