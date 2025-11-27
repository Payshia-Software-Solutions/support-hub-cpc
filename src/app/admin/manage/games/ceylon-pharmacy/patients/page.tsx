
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, User, PlusCircle, AlertTriangle } from "lucide-react";
import Link from 'next/link';
import { getCeylonPharmacyPrescriptions } from '@/lib/actions/games';
import type { GamePatient } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

export default function ManagePatientsPage() {
    const router = useRouter();
    const { user } = useAuth();

    // Fetch all patients using the API. We assume admin gets all patients.
    // For the API to work, we might need a specific admin endpoint or use a known admin user.
    // Here, we'll use a placeholder 'admin' username for the query key, assuming the API grants access.
    const { data: patients, isLoading, isError, error } = useQuery<GamePatient[]>({
        queryKey: ['allCeylonPharmacyPatients'],
        queryFn: () => getCeylonPharmacyPrescriptions('admin-user', 'CPCC20'), // Using a generic user for fetching all
        enabled: !!user,
    });


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
                    <CardDescription>
                        {isLoading ? 'Loading patients...' : `${patients?.length || 0} patients configured for the game.`}
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {isLoading && [...Array(3)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-4 flex items-center gap-4">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {isError && (
                        <div className="md:col-span-3 text-center py-10 text-destructive">
                             <AlertTriangle className="h-8 w-8 mx-auto mb-2"/>
                            <p className="font-semibold">Failed to load patients</p>
                            <p className="text-sm">{error.message}</p>
                        </div>
                    )}
                    {!isLoading && !isError && patients?.map(patient => (
                        <Link key={patient.prescription_id} href={`/admin/manage/games/ceylon-pharmacy/patients/${patient.prescription_id}`} className="group block">
                            <Card className="hover:shadow-md hover:border-primary transition-all">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <Avatar className="h-12 w-12 text-lg">
                                        <AvatarImage src={`https://placehold.co/100x100.png?text=${patient.Pres_Name.charAt(0)}`} alt={patient.Pres_Name} />
                                        <AvatarFallback>{patient.Pres_Name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-semibold text-card-foreground group-hover:text-primary">{patient.Pres_Name}</p>
                                        <p className="text-sm text-muted-foreground">{patient.Pres_Age}</p>
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
