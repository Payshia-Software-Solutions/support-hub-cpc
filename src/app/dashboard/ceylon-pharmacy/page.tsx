
"use client";

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, HeartPulse, Users, Clock, ArrowRight, UserHeart } from 'lucide-react';
import { getCeylonPharmacyPrescriptions } from '@/lib/actions/games';
import type { GamePatient } from '@/lib/types';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';


const PatientStatusCard = ({ patient }: { patient: GamePatient }) => {
    const initialTime = 3600; // 1 hour
    const startTime = patient.start_data ? new Date(patient.start_data.time).getTime() : null;
    
    const calculateTimeLeft = () => {
        if (!startTime) return initialTime;
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        return Math.max(0, initialTime - elapsed);
    };
    
    const timeLeft = calculateTimeLeft();
    
    const isDead = patient.start_data && patient.start_data.patient_status !== 'Recovered' && timeLeft <= 0;
    const isRecovered = patient.start_data && patient.start_data.patient_status === 'Recovered';

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    return (
        <Card className="shadow-lg hover:shadow-xl hover:border-primary/50 transition-all duration-200 h-full flex flex-col">
            <CardHeader className="flex-grow">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{patient.Pres_Name}</CardTitle>
                    {isRecovered ? (
                         <Badge variant="default" className="bg-green-600">Recovered</Badge>
                    ) : isDead ? (
                        <Badge variant="destructive">Timeout</Badge>
                    ) : (
                         <Badge variant="secondary">
                            <Clock className="mr-1.5 h-3.5 w-3.5" />
                            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                        </Badge>
                    )}
                </div>
                <CardDescription>Age: {patient.Pres_Age}</CardDescription>
            </CardHeader>
            <CardFooter>
                 {isDead ? (
                      <Button asChild className="w-full" variant="destructive">
                        <Link href={`/dashboard/ceylon-pharmacy/${patient.prescription_id}/recover`}>
                            <UserHeart className="mr-2 h-4 w-4" />
                            Recover Patient
                        </Link>
                      </Button>
                 ) : (
                    <Button asChild className="w-full">
                        <Link href={`/dashboard/ceylon-pharmacy/${patient.prescription_id}`}>
                            {isRecovered ? 'View Case' : 'Treat Patient'}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                 )}
            </CardFooter>
        </Card>
    )
}

// --- MAIN PAGE ---
export default function CeylonPharmacyPage() {
    const { user } = useAuth();
    // Hardcoding course for now as per user instruction context
    const courseCode = 'CPCC20';

    const { data: patients, isLoading, isError, error } = useQuery<GamePatient[]>({
        queryKey: ['ceylonPharmacyPrescriptions', user?.username, courseCode],
        queryFn: () => getCeylonPharmacyPrescriptions(user!.username!, courseCode),
        enabled: !!user?.username,
    });

    const stats = useMemo(() => {
        if (!patients) return { waiting: 0, recovered: 0, lost: 0 };
        
        let recovered = 0;
        let lost = 0;
        
        patients.forEach(p => {
            if (p.start_data?.patient_status === 'Recovered') {
                recovered++;
            }
            if (p.start_data && p.start_data.patient_status !== 'Recovered') {
                 const startTime = new Date(p.start_data.time).getTime();
                 const elapsed = Math.floor((Date.now() - startTime) / 1000);
                 if (elapsed > 3600) {
                    lost++;
                 }
            }
        });

        return {
            waiting: patients.length - recovered - lost,
            recovered,
            lost,
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
                <CardContent><div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-12" /> : stats.waiting}</div></CardContent>
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
        {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardHeader>
                        <CardContent><Skeleton className="h-10 w-full" /></CardContent>
                        <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
                    </Card>
                ))}
            </div>
        ) : isError ? (
            <div className="text-center py-10 text-destructive">
                <p>Error loading patients: {error.message}</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {patients && patients.map(patient => (
                    <PatientStatusCard key={patient.id} patient={patient} />
                ))}
                {(!patients || patients.length === 0) && (
                    <p className="md:col-span-3 text-center text-muted-foreground py-10">No patients are currently waiting.</p>
                )}
            </div>
        )}
      </section>
    </div>
  );
}
