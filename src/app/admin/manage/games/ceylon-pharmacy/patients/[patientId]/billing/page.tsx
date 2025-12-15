
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Calculator, Save, AlertTriangle } from 'lucide-react';
import { getCeylonPharmacyPrescriptions, getPOSCorrectAmount, saveCorrectBillValue } from '@/lib/actions/games';
import type { GamePatient, POSCorrectAnswer } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function ManageBillingPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId as string;
  const queryClient = useQueryClient();

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

  const { data: existingAnswer, isLoading: isLoadingAnswer } = useQuery<POSCorrectAnswer | null>({
    queryKey: ['posCorrectAmount', patientId],
    queryFn: () => getPOSCorrectAmount(patientId),
    enabled: !!patientId,
    retry: (failureCount, error: any) => {
        // Don't retry if the error is a 404, which is a valid "not found" state
        if (error?.message?.includes('404')) {
            return false;
        }
        return failureCount < 2;
    },
  });

  useEffect(() => {
    if (existingAnswer) {
      setBillValue(existingAnswer.value);
    }
  }, [existingAnswer]);
  
  const saveBillMutation = useMutation({
    mutationFn: saveCorrectBillValue,
    onSuccess: () => {
        toast({ title: "Success!", description: "The correct bill value has been saved." });
        queryClient.invalidateQueries({ queryKey: ['posCorrectAmount', patientId] });
    },
    onError: (error: Error) => {
        toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    }
  });

  const handleSave = () => {
    const numericValue = parseFloat(billValue);
    if (isNaN(numericValue) || numericValue < 0) {
        toast({ variant: 'destructive', title: 'Invalid Value', description: 'Please enter a valid positive number for the bill.'});
        return;
    }
    saveBillMutation.mutate({ PresCode: patientId, value: billValue });
  };
  
  const isLoading = isLoadingPatient || isLoadingAnswer;

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
            <CardDescription>Enter the correct final bill amount for this prescription challenge.</CardDescription>
        </CardHeader>
        <CardContent>
           {isLoading ? (
                <div className="max-w-md space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
           ) : (
                <div className="space-y-2 max-w-md">
                    <Label htmlFor="bill-value">Total Bill Value (LKR)</Label>
                    <div className="flex items-center gap-2">
                        <Input id="bill-value" type="number" step="0.01" value={billValue} onChange={(e) => setBillValue(e.target.value)} placeholder="0.00" />
                    </div>
                     {existingAnswer && (
                        <p className="text-xs text-muted-foreground">
                            Last saved value was LKR {existingAnswer.value} on {new Date(existingAnswer.created_at).toLocaleDateString()}.
                        </p>
                    )}
                </div>
           )}
        </CardContent>
        <CardFooter>
            <Button onClick={handleSave} disabled={saveBillMutation.isPending || isLoading}>
                {saveBillMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                Save Bill Value
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
