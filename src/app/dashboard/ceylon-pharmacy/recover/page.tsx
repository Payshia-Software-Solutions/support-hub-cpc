
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, HeartPulse, Loader2, AlertCircle, Users, CheckCircle, Skull } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getCeylonPharmacyPrescriptions, recoverPatient, getRecoveredCount } from '@/lib/actions/games';
import type { GamePatient, RecoveryRecord } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const MAX_RECOVERIES = 50;

export default function RecoverPatientPage() {
    const router = useRouter();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [courseCode, setCourseCode] = useState<string | null>(null);

    useEffect(() => {
        const storedCourseCode = localStorage.getItem('selected_course');
        if (storedCourseCode) {
            setCourseCode(storedCourseCode);
        } else {
            // Redirect if no course code is found
            router.replace('/dashboard/select-course');
        }
    }, [router]);

    const { data: allPatients, isLoading: isLoadingPatients, isError: isPatientsError } = useQuery<GamePatient[]>({
        queryKey: ['ceylonPharmacyPrescriptionsForRecovery', user?.username, courseCode],
        queryFn: async () => {
            if (!user?.username || !courseCode) throw new Error("User or course not identified");
            return getCeylonPharmacyPrescriptions(user.username, courseCode);
        },
        enabled: !!user?.username && !!courseCode,
    });
    
    const { data: recoveryRecords, isLoading: isLoadingRecoveries, isError: isRecoveriesError } = useQuery<RecoveryRecord[]>({
        queryKey: ['recoveryRecords', user?.username],
        queryFn: async () => {
            if (!user?.username) throw new Error("User not authenticated");
            return getRecoveredCount(user.username);
        },
        enabled: !!user?.username,
    });

    const { lostPatients, recoveredCount, recoveryLives } = useMemo(() => {
        if (!allPatients) return { lostPatients: [], recoveredCount: 0, recoveryLives: MAX_RECOVERIES };

        const lost: GamePatient[] = allPatients.filter(p => {
             if (p.start_data && p.start_data.patient_status !== 'Recovered') {
                 const startTime = new Date(p.start_data.time).getTime();
                 const elapsed = Math.floor((Date.now() - startTime) / 1000);
                 return elapsed > 3600;
             }
             return false;
        });

        const recovered = recoveryRecords?.length || 0;
        const lives = MAX_RECOVERIES - recovered;

        return { lostPatients: lost, recoveredCount: recovered, recoveryLives: lives };
    }, [allPatients, recoveryRecords]);
    
    const recoverMutation = useMutation({
        mutationFn: (patientIdToRecover: string) => {
            if (!user?.username || !patientIdToRecover) {
                throw new Error("Missing user or patient data.");
            }
            if (recoveryLives <= 0) {
                 throw new Error("No recovery attempts remaining.");
            }
            return recoverPatient(user.username, patientIdToRecover);
        },
        onSuccess: (data, patientIdToRecover) => {
            toast({
                title: "Patient Recovered!",
                description: "The timer has been reset. You can now continue treatment.",
            });
            queryClient.invalidateQueries({ queryKey: ['ceylonPharmacyPatient', patientIdToRecover, user?.username] });
            queryClient.invalidateQueries({ queryKey: ['ceylonPharmacyPrescriptionsForRecovery', user?.username, courseCode] });
            queryClient.invalidateQueries({ queryKey: ['recoveryRecords', user?.username] });
            router.push(`/dashboard/ceylon-pharmacy/${patientIdToRecover}`);
        },
        onError: (error: Error) => {
             toast({
                variant: 'destructive',
                title: "Recovery Failed",
                description: error.message,
            });
        }
    });

    if (isLoadingPatients || isLoadingRecoveries) {
        return (
             <div className="p-4 md:p-8 space-y-6">
                <Skeleton className="h-12 w-1/4" />
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    if (isPatientsError || isRecoveriesError) {
        return (
             <div className="p-4 md:p-8 space-y-6 flex justify-center">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Data</AlertTitle>
                    <AlertDescription>Could not fetch your patient or recovery data. Please try again later.</AlertDescription>
                </Alert>
            </div>
        )
    }
    
     if (!isLoadingPatients && lostPatients.length === 0) {
        return (
             <div className="p-4 md:p-8 space-y-6 flex justify-center">
                <Alert variant="default" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Patients to Recover</AlertTitle>
                    <AlertDescription>You have no patients who have timed out.</AlertDescription>
                     <Button variant="outline" onClick={() => router.back()} className="w-full mt-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Waiting Room
                    </Button>
                </Alert>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                 <Button variant="ghost" onClick={() => router.back()} className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Waiting Room
                </Button>
                <div className="flex items-center gap-4 mt-2">
                    <div className="p-3 bg-destructive/10 rounded-full">
                         <HeartPulse className="w-8 h-8 text-destructive" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-headline font-semibold">Recover a Patient</h1>
                        <p className="text-muted-foreground">Use one of your limited recovery attempts to reset the timer.</p>
                    </div>
                </div>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Lost Patients</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold flex items-center gap-2"><Skull className="h-6 w-6"/> {lostPatients.length}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Recovered Patients</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold flex items-center gap-2"><CheckCircle className="h-6 w-6"/> {recoveredCount}</div></CardContent></Card>
                <Card className="border-primary"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Recoveries Left</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-primary">{recoveryLives} / {MAX_RECOVERIES}</div></CardContent></Card>
            </div>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Lost Patients</CardTitle>
                    <CardDescription>Select a patient below to use one of your recovery attempts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {lostPatients.length > 0 ? (
                        lostPatients.map(patient => (
                            <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={`https://placehold.co/40x40.png?text=${patient.Pres_Name.charAt(0)}`} alt={patient.Pres_Name}/>
                                        <AvatarFallback>{patient.Pres_Name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{patient.Pres_Name}</p>
                                        <p className="text-xs text-muted-foreground">Age: {patient.Pres_Age}</p>
                                    </div>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" disabled={recoverMutation.isPending || recoveryLives <= 0}>
                                            <HeartPulse className="mr-2 h-4 w-4"/> Recover
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Recover {patient.Pres_Name}?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will use one of your {recoveryLives} remaining recovery attempts to reset the timer for this patient. Are you sure you want to proceed?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => recoverMutation.mutate(patient.prescription_id)}>
                                                Use Recovery
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        ))
                    ) : (
                         <div className="text-center py-10 text-muted-foreground">
                            <p>You have no lost patients to recover. Great job!</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
