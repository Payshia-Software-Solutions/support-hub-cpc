
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, UserHeart, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getCeylonPharmacyPrescriptions, createTreatmentStartRecord } from '@/lib/actions/games';
import type { GamePatient } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function RecoverPatientPage() {
    const router = useRouter();
    const params = useParams();
    const patientId = params.id as string;
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const courseCode = 'CPCC20';

    const { data: patient, isLoading: isLoadingPatient, isError } = useQuery<GamePatient>({
        queryKey: ['ceylonPharmacyPatientForRecovery', patientId, user?.username],
        queryFn: async () => {
            if (!user?.username) throw new Error("User not authenticated");
            const prescriptions = await getCeylonPharmacyPrescriptions(user.username, courseCode);
            const found = prescriptions.find(p => p.prescription_id === patientId);
            if (!found) throw new Error("Patient not found for this user/course");
            return found;
        },
        enabled: !!patientId && !!user?.username,
    });
    
    const recoverMutation = useMutation({
        mutationFn: () => {
            if (!user?.username || !patient) {
                throw new Error("Missing user or patient data.");
            }
            // This is a simulation. In a real app, this might be a more complex API call
            // that resets the timer or status on the backend. Here we just create a new start record.
            return createTreatmentStartRecord(user.username, patient.prescription_id);
        },
        onSuccess: () => {
            toast({
                title: "Patient Recovered!",
                description: "The timer has been reset. You can now continue treatment.",
            });
            // Invalidate queries to refetch patient data on relevant pages
            queryClient.invalidateQueries({ queryKey: ['ceylonPharmacyPatient', patientId, user?.username] });
            queryClient.invalidateQueries({ queryKey: ['ceylonPharmacyPrescriptions', user?.username, courseCode] });
            router.push(`/dashboard/ceylon-pharmacy/${patientId}`);
        },
        onError: (error: Error) => {
             toast({
                variant: 'destructive',
                title: "Recovery Failed",
                description: error.message,
            });
        }
    });

    if (isLoadingPatient) {
        return (
             <div className="p-4 md:p-8 space-y-6 flex justify-center">
                <div className="w-full max-w-md">
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        )
    }

    if (isError || !patient) {
        return (
             <div className="p-4 md:p-8 space-y-6 flex justify-center">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Could not load patient data. They may not be eligible for recovery.</AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20 flex justify-center">
            <Card className="shadow-lg w-full max-w-md">
                 <CardHeader className="text-center items-center">
                    <div className="p-4 bg-destructive/10 rounded-full w-fit">
                        <UserHeart className="w-10 h-10 text-destructive" />
                    </div>
                    <CardTitle className="mt-4 text-2xl font-headline">Recover Patient</CardTitle>
                    <CardDescription>The timer for <strong className="text-foreground">{patient.Pres_Name}</strong> has run out. You can recover the patient by paying a fine.</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-lg font-semibold">Fine Amount</p>
                    <p className="text-4xl font-bold text-destructive">LKR 500.00</p>
                    <p className="text-xs text-muted-foreground mt-2">(This is a simulated payment for game purposes)</p>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    <Button onClick={() => recoverMutation.mutate()} className="w-full" disabled={recoverMutation.isPending}>
                        {recoverMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        Pay Fine & Recover Patient
                    </Button>
                     <Button variant="ghost" onClick={() => router.back()} className="w-full">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Waiting Room
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
