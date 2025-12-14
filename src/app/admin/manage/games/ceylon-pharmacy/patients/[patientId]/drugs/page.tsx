
"use client";

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertTriangle, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getPrescriptionDetails, deleteSection } from '@/lib/actions/games';
import type { PrescriptionDetail } from '@/lib/types';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';

export default function ManageDrugsPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId as string;
  const [drugToDelete, setDrugToDelete] = useState<PrescriptionDetail | null>(null);
  const queryClient = useQueryClient();

  const { data: prescriptionDetails, isLoading, isError, error } = useQuery<PrescriptionDetail[]>({
    queryKey: ['prescriptionDetails', patientId],
    queryFn: () => getPrescriptionDetails(patientId),
    enabled: !!patientId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (coverId: string) => {
        // Placeholder for delete logic
        console.log("Deleting drug with coverId:", coverId);
        await new Promise(resolve => setTimeout(resolve, 500)); 
    },
    onSuccess: (data, coverId) => {
      queryClient.setQueryData<PrescriptionDetail[]>(['prescriptionDetails', patientId], (oldData) => 
          oldData ? oldData.filter(d => d.cover_id !== coverId) : []
      );
      toast({ title: 'Drug Removed', description: 'The drug has been removed from the prescription.' });
    },
    onError: (error: Error) => {
        toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
    },
    onSettled: () => setDrugToDelete(null),
  });

  const handleDeleteConfirm = () => {
    if (drugToDelete) {
        deleteMutation.mutate(drugToDelete.cover_id);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 pb-20">
       <AlertDialog open={!!drugToDelete} onOpenChange={() => setDrugToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete the drug "{drugToDelete?.content}" from this prescription.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>
                    {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <Button variant="ghost" onClick={() => router.back()} className="-ml-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patient Hub
          </Button>
          <h1 className="text-3xl font-headline font-semibold mt-2">Manage Prescription Drugs</h1>
          <p className="text-muted-foreground">Add, edit, or remove medications for this prescription.</p>
        </div>
        <Button asChild>
            <Link href={`/admin/manage/games/ceylon-pharmacy/patients/${patientId}/drugs/add`}>
                <PlusCircle className="mr-2 h-4 w-4"/> Add Drug
            </Link>
        </Button>
      </header>
      
      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>Drug List</CardTitle>
            <CardDescription>{prescriptionDetails?.length || 0} drugs currently in this prescription.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading && (
                 <div className="space-y-3">
                    <Skeleton className="h-12 w-full"/>
                    <Skeleton className="h-12 w-full"/>
                 </div>
            )}
            {isError && <p className="text-destructive">{(error as Error).message}</p>}
            <div className="space-y-3">
                {!isLoading && !isError && prescriptionDetails && prescriptionDetails.length > 0 ? (
                    prescriptionDetails.map(drug => (
                        <div key={drug.cover_id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                            <p className="font-medium text-sm">{drug.content}</p>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" asChild>
                                    <Link href={`/admin/manage/games/ceylon-pharmacy/patients/${patientId}/drugs/edit/${drug.cover_id}`}>
                                        <Edit className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDrugToDelete(drug)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                ) : !isLoading && (
                    <p className="text-center py-8 text-muted-foreground">No drugs have been added to this prescription yet.</p>
                )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
