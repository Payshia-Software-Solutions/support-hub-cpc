
"use client";

import { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Pill, FileText, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { getCeylonPharmacyPrescriptions, getPrescriptionDetails } from '@/lib/actions/games';
import type { GamePatient, PrescriptionDetail } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function PatientHubPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId as string; // This is prescription_id
  const { user } = useAuth();

  const { data: patient, isLoading: isLoadingPatient, isError: isPatientError, error: patientError } = useQuery<GamePatient>({
      queryKey: ['ceylonPharmacyPatient', patientId],
      queryFn: async () => {
          const allPatients = await getCeylonPharmacyPrescriptions('admin-user', 'CPCC20');
          const foundPatient = allPatients.find(p => p.prescription_id === patientId);
          if (!foundPatient) throw new Error('Patient not found');
          return foundPatient;
      },
      enabled: !!patientId,
  });

  const { data: prescriptionDetails, isLoading: isLoadingDetails } = useQuery<PrescriptionDetail[]>({
      queryKey: ['prescriptionDetails', patientId],
      queryFn: () => getPrescriptionDetails(patientId),
      enabled: !!patient,
  });

  const isLoading = isLoadingPatient || isLoadingDetails;

  if (isLoading) {
    return <div className="p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></div>
  }

  if (isPatientError) {
    return (
        <div className="p-8 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="font-semibold">Failed to load patient data.</p>
            <p className="text-sm text-muted-foreground">{(patientError as Error).message}</p>
        </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6 pb-20">
       <header>
            <Button variant="ghost" onClick={() => router.back()} className="-ml-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patient List
            </Button>
            <h1 className="text-3xl font-headline font-semibold mt-2">Patient Prescription Hub</h1>
            <p className="text-muted-foreground">Manage details for {patient?.Pres_Name || 'patient'}.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Basic Info Card */}
            <Card className="shadow-lg flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User className="h-5 w-5"/> Basic Info</CardTitle>
                    <CardDescription>Patient and doctor details.</CardDescription>
                </CardHeader>
                 <CardContent className="flex-grow">
                    <p className="text-sm"><strong>Patient:</strong> {patient?.Pres_Name}</p>
                    <p className="text-sm"><strong>Age:</strong> {patient?.Pres_Age}</p>
                    <p className="text-sm"><strong>Doctor:</strong> {patient?.doctor_name}</p>
                 </CardContent>
                <CardFooter>
                    <Button variant="outline" asChild className="w-full">
                        <Link href={`/admin/manage/games/ceylon-pharmacy/patients/${patientId}/edit`}>Manage Details <ArrowRight className="ml-2 h-4 w-4"/></Link>
                    </Button>
                </CardFooter>
            </Card>

            {/* Drugs Card */}
             <Card className="shadow-lg flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Pill className="h-5 w-5"/> Prescription Drugs</CardTitle>
                    <CardDescription>Manage the list of prescribed medications.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                     <p className="text-sm">
                        Currently <strong>{prescriptionDetails?.length || 0}</strong> drug(s) on this prescription.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" asChild className="w-full">
                        <Link href={`/admin/manage/games/ceylon-pharmacy/patients/${patientId}/edit`}>Manage Drugs <ArrowRight className="ml-2 h-4 w-4"/></Link>
                    </Button>
                </CardFooter>
            </Card>
            
            {/* Bill Value Card */}
             <Card className="shadow-lg flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5"/> Billing</CardTitle>
                    <CardDescription>Set the final bill value.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                   <p className="text-sm">Manage the total bill value and use the POS calculator.</p>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" asChild className="w-full">
                        <Link href={`/admin/manage/games/ceylon-pharmacy/patients/${patientId}/edit`}>Manage Billing <ArrowRight className="ml-2 h-4 w-4"/></Link>
                    </Button>
                </CardFooter>
            </Card>

        </div>
    </div>
  );
}

