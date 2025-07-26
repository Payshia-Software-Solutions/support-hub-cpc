
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, HeartPulse, Users, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import { ceylonPharmacyPatients, type Patient } from '@/lib/ceylon-pharmacy-data';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const PatientStatusCard = ({ patient, onSelectPatient }: { patient: Patient, onSelectPatient: (patient: Patient) => void }) => {
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
                    {patient.prescription.drugs.map(d => d.name).join(', ')}
                </p>
            </CardContent>
            <CardFooter>
                 <Button className="w-full" onClick={() => onSelectPatient(patient)} disabled={isDead}>
                    {isDead ? 'Patient Lost' : 'Treat Patient'}
                    {!isDead && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
            </CardFooter>
        </Card>
    )
}

const CountdownTimer = ({ initialTime, onTimeEnd }: { initialTime: number, onTimeEnd: () => void }) => {
    const [timeLeft, setTimeLeft] = useState(initialTime);

    useEffect(() => {
        if (timeLeft <= 0) {
            onTimeEnd();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, onTimeEnd]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const isCritical = timeLeft < 60 && timeLeft > 0;

     return (
        <Badge variant={isCritical ? 'destructive' : 'default'} className={cn("text-lg", isCritical && "animate-pulse")}>
            <Clock className="mr-2 h-5 w-5" />
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </Badge>
    );
}


export default function CeylonPharmacyPage() {
    const [patients, setPatients] = useState<Patient[]>(ceylonPharmacyPatients);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    const stats = useMemo(() => {
        return {
            recovered: patients.filter(p => p.status === 'recovered').length,
            waiting: patients.filter(p => p.status === 'waiting').length,
            lost: patients.filter(p => p.status === 'dead').length,
        };
    }, [patients]);
    
    const handleTimeEnd = () => {
        if (selectedPatient) {
            setPatients(prev => prev.map(p => 
                p.id === selectedPatient.id ? { ...p, status: 'dead' } : p
            ));
            toast({
                variant: 'destructive',
                title: 'Patient Lost',
                description: `Time ran out for ${selectedPatient.name}.`,
            });
            setSelectedPatient(null);
        }
    }

    if (selectedPatient) {
        return (
             <div className="p-4 md:p-8 space-y-6 pb-20">
                <Card className="shadow-xl">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <Button onClick={() => setSelectedPatient(null)} variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Waiting Room
                            </Button>
                             <CountdownTimer initialTime={selectedPatient.initialTime} onTimeEnd={handleTimeEnd} />
                        </div>
                        <div className="pt-4">
                            <CardTitle className="text-2xl">Treating: {selectedPatient.name}</CardTitle>
                            <CardDescription>Complete the tasks below to save the patient.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Task 1: Prescription Label</CardTitle>
                                <CardDescription>Fill the dispensing label correctly based on the prescription.</CardDescription>
                            </CardHeader>
                            <CardContent><p>D-Pad component will go here.</p></CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Task 2: Counselling Unit</CardTitle>
                                <CardDescription>Provide the correct instructions for the patient.</CardDescription>
                            </CardHeader>
                            <CardContent><p>Counselling component will go here.</p></CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Task 3: POS Training</CardTitle>
                                <CardDescription>Use the POS system to correctly bill the patient.</CardDescription>
                            </CardHeader>
                            <CardContent><p>POS component will go here.</p></CardContent>
                        </Card>
                    </CardContent>
                </Card>
            </div>
        )
    }

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
                <PatientStatusCard key={patient.id} patient={patient} onSelectPatient={setSelectedPatient} />
            ))}
            {stats.waiting === 0 && (
                <p className="md:col-span-3 text-center text-muted-foreground py-10">No patients are currently waiting.</p>
            )}
        </div>
      </section>
    </div>
  );
}
