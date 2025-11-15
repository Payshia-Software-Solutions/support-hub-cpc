

"use client";

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, HeartPulse, Users, Clock, ArrowRight } from 'lucide-react';
import { getCeylonPharmacyPrescriptions } from '@/lib/actions/games';
import type { GamePrescription } from '@/lib/types';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

const PatientStatusCard = ({ prescription }: { prescription: GamePrescription }) => {
    // Using a default time as it's not in the API response
    const initialTime = 300; 
    const minutes = Math.floor(initialTime / 60);
    const seconds = initialTime % 60;
    
    // We assume all fetched patients are 'waiting' for this game version
    const isDead = false;

    return (
        <Card className="shadow-lg hover:shadow-xl hover:border-primary/50 transition-all duration-200 h-full flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{prescription.Pres_Name}</CardTitle>
                    <Badge variant="secondary">
                        <Clock className="mr-1.5 h-3.5 w-3.5" />
                        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                    </Badge>
                </div>
                <CardDescription>Age: {prescription.Pres_Age}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {prescription.notes || 'No specific drugs listed.'}
                </p>
            </CardContent>
            <CardFooter>
                 <Button asChild className="w-full" disabled={isDead}>
                    <Link href={`/dashboard/ceylon-pharmacy/${prescription.prescription_id}`}>
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
    const { data: prescriptions, isLoading, isError, error } = useQuery<GamePrescription[]>({
        queryKey: ['ceylonPharmacyPrescriptions'],
        queryFn: getCeylonPharmacyPrescriptions,
    });

    const stats = useMemo(() => {
        if (!prescriptions) return { waiting: 0, recovered: 0, lost: 0 };
        return {
            waiting: prescriptions.length, // All fetched are considered waiting
            recovered: 0, // Mocked for now
            lost: 0, // Mocked for now
        };
    }, [prescriptions]);
    
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
                {prescriptions && prescriptions.map(prescription => (
                    <PatientStatusCard key={prescription.id} prescription={prescription} />
                ))}
                {(!prescriptions || prescriptions.length === 0) && (
                    <p className="md:col-span-3 text-center text-muted-foreground py-10">No patients are currently waiting.</p>
                )}
            </div>
        )}
      </section>
    </div>
  );
}

