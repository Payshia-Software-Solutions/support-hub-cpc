
"use client";

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Calculator } from 'lucide-react';
import { getCeylonPharmacyPrescriptions } from '@/lib/actions/games';
import type { GamePatient } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ManageBillingPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId as string;

  const [billValue, setBillValue] = useState('');

  const { data: patient, isLoading: isLoadingPatient } = useQuery<GamePatient>({
      queryKey: ['ceylonPharmacyPatient', patientId],
      queryFn: async () => {
          const allPatients = await getCeylonPharmacyPrescriptions('admin-user', 'CPCC20');
          const foundPatient = allPatients.find(p => p.prescription_id === patientId);
          if (!foundPatient) throw new Error('Patient not found');
          return foundPatient;
      },
      enabled: !!patientId,
  });

  return (
    <div className="p-4 md:p-8 space-y-6 pb-20">
      <header>
        <Button variant="ghost" onClick={() => router.back()} className="-ml-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patient Hub
        </Button>
        <h1 className="text-3xl font-headline font-semibold mt-2">Manage Billing</h1>
        <p className="text-muted-foreground">Set the correct total bill value for {patient?.Pres_Name || 'the patient'}.</p>
      </header>
      
       <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>Billing Information</CardTitle>
            <CardDescription>Use the calculator to determine the correct total and enter it below.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-2 max-w-md">
                <Label htmlFor="bill-value">Total Bill Value (LKR)</Label>
                <div className="flex items-center gap-2">
                    <Input id="bill-value" type="number" step="0.01" value={billValue} onChange={(e) => setBillValue(e.target.value)} placeholder="0.00" />
                    <Button type="button" variant="outline" size="icon">
                        <Calculator className="h-4 w-4"/>
                        <span className="sr-only">Open POS Calculator</span>
                    </Button>
                </div>
            </div>
        </CardContent>
      </Card>

    </div>
  );
}
