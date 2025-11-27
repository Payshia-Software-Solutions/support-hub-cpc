
"use client";

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, HeartPulse, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getCeylonPharmacyPrescriptions, createTreatmentStartRecord } from '@/lib/actions/games';
import type { GamePatient } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function RecoverPatientPage() {
    const router = useRouter();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const courseCode = 'CPCC20';
    const [selectedPatientId, setSelectedPatientId] = useState('');

    const { data: allPatients, isLoading: isLoadingPatients, isError } = useQuery<GamePatient[]>({
        queryKey: ['ceylonPharmacyPrescriptionsForRecovery', user?.username, courseCode],
        queryFn: async () => {
            if (!user?.username) throw new Error("User not authenticated");
            return getCeylonPharmacyPrescriptions(user.username, courseCode);
        },
        enabled: !!user?.username,
    });
    
    const lostPatients = useMemo(() => {
        if (!allPatients) return [];
        return allPatients.filter(p => {
             if (p.start_data && p.start_data.patient_status !== 'Recovered') {
                 const startTime = new Date(p.start_data.time).getTime();
                 const elapsed = Math.floor((Date.now() - startTime) / 1000);
                 return elapsed > 3600;
             }
             return false;
        });
    }, [allPatients]);
    
    const recoverMutation = useMutation({
        mutationFn: (patientIdToRecover: string) => {
            if (!user?.username || !patientIdToRecover) {
                throw new Error("Missing user or patient data.");
            }
            return createTreatmentStartRecord(user.username, patientIdToRecover);
        },
        onSuccess: (data, patientIdToRecover) => {
            toast({
                title: "Patient Recovered!",
                description: "The timer has been reset. You can now continue treatment.",
            });
            queryClient.invalidateQueries({ queryKey: ['ceylonPharmacyPatient', patientIdToRecover, user?.username] });
            queryClient.invalidateQueries({ queryKey: ['ceylonPharmacyPrescriptions', user?.username, courseCode] });
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

    if (isLoadingPatients) {
        return (
             <div className="p-4 md:p-8 space-y-6 flex justify-center">
                <div className="w-full max-w-md">
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        )
    }

    if (isError || lostPatients.length === 0) {
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
        <div className="p-4 md:p-8 space-y-6 pb-20 flex justify-center">
            <Card className="shadow-lg w-full max-w-md">
                 <CardHeader className="text-center items-center">
                    <div className="p-4 bg-destructive/10 rounded-full w-fit">
                        <HeartPulse className="w-10 h-10 text-destructive" />
                    </div>
                    <CardTitle className="mt-4 text-2xl font-headline">Recover Patient</CardTitle>
                    <CardDescription>Pay a fine to reset the timer for a lost patient and continue the challenge.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center">
                        <p className="text-lg font-semibold">Fine Amount</p>
                        <p className="text-4xl font-bold text-destructive">LKR 500.00</p>
                        <p className="text-xs text-muted-foreground mt-2">(This is a simulated payment for game purposes)</p>
                    </div>
                    <div className="space-y-2 pt-4 border-t">
                        <Label htmlFor="patient-select">Select Patient to Recover</Label>
                        <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                            <SelectTrigger id="patient-select">
                                <SelectValue placeholder="Choose a patient..." />
                            </SelectTrigger>
                            <SelectContent>
                                {lostPatients.map(p => (
                                    <SelectItem key={p.id} value={p.prescription_id}>
                                        {p.Pres_Name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    <Button onClick={() => recoverMutation.mutate(selectedPatientId)} className="w-full" disabled={recoverMutation.isPending || !selectedPatientId}>
                        {recoverMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        Pay Fine & Recover
                    </Button>
                     <Button variant="ghost" onClick={() => router.back()} className="w-full">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Waiting Room
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
