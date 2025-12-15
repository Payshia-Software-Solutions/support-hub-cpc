"use client";

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, AlertTriangle, PlusCircle, Edit, Trash2, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getPrescriptionDetails, updatePrescriptionContent, savePrescriptionContent } from '@/lib/actions/games';
import type { PrescriptionDetail } from '@/lib/types';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';


const addDrugSchema = z.object({
  coverId: z.string().min(1, 'Cover ID is required'),
  content: z.string().min(1, 'Prescription content is required'),
});

type AddDrugFormValues = z.infer<typeof addDrugSchema>;

const AddDrugDialog = ({ patientId, onClose }: { patientId: string, onClose: () => void }) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    
    const form = useForm<AddDrugFormValues>({
        resolver: zodResolver(addDrugSchema),
        defaultValues: { coverId: `Cover${Math.floor(Date.now() / 1000)}`, content: '' },
    });
    
     const addDrugMutation = useMutation({
        mutationFn: async (data: AddDrugFormValues) => {
            return savePrescriptionContent({
                pres_code: patientId,
                cover_id: data.coverId,
                content: data.content,
            });
        },
        onSuccess: () => {
            toast({ title: 'Drug Added!', description: 'The new drug has been added to the prescription.' });
            queryClient.invalidateQueries({ queryKey: ['prescriptionDetails', patientId] });
            onClose();
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
        }
    });

    const onSubmit = (data: AddDrugFormValues) => {
        addDrugMutation.mutate(data);
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add New Drug</DialogTitle>
                <DialogDescription>Add a medication to this prescription.</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                 <div className="py-4 space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="coverId">Cover ID*</Label>
                        <Input id="coverId" {...form.register(`coverId`)} placeholder="e.g. Cover1" />
                        {form.formState.errors?.coverId && <p className="text-xs text-destructive">{form.formState.errors.coverId.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="content">Prescription Content*</Label>
                        <Input id="content" {...form.register(`content`)} placeholder="e.g. Tab Metformin 500mg..." />
                        {form.formState.errors?.content && <p className="text-xs text-destructive">{form.formState.errors.content.message}</p>}
                    </div>
                </div>
                 <DialogFooter>
                     <DialogClose asChild><Button type="button" variant="outline" disabled={addDrugMutation.isPending}>Cancel</Button></DialogClose>
                     <Button type="submit" disabled={addDrugMutation.isPending}>
                        {addDrugMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        <Save className="mr-2 h-4 w-4" /> Save Drug
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    )
}

const DrugItem = ({ drug, patientId, onDelete }: { drug: PrescriptionDetail, patientId: string, onDelete: (drug: PrescriptionDetail) => void }) => {
    const queryClient = useQueryClient();
    const [content, setContent] = useState(drug.content);
    
    const updateMutation = useMutation({
        mutationFn: updatePrescriptionContent,
        onSuccess: (updatedDrug) => {
            queryClient.setQueryData<PrescriptionDetail[]>(['prescriptionDetails', patientId], (oldData) =>
                oldData ? oldData.map(d => d.cover_id === updatedDrug.cover_id ? { ...updatedDrug, pres_code: drug.pres_code } : d) : []
            );
            toast({ title: 'Content Updated', description: `Drug content for ${updatedDrug.cover_id} has been saved.` });
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
            // Revert on error
            setContent(drug.content);
        },
    });

    const handleSave = () => {
        if (content !== drug.content) {
            updateMutation.mutate({ pres_code: drug.pres_code, cover_id: drug.cover_id, content: content });
        }
    };

    return (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 gap-2">
            <Input 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="text-sm font-medium flex-grow bg-background"
                disabled={updateMutation.isPending}
            />
            <div className="flex items-center gap-1">
                 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSave} disabled={updateMutation.isPending || content === drug.content}>
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/manage/games/ceylon-pharmacy/patients/${patientId}/drugs/edit/${drug.cover_id}`}>
                        <Edit className="h-4 w-4 mr-2" /> Answers
                    </Link>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(drug)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};


export default function ManageDrugsPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId as string;
  const [drugToDelete, setDrugToDelete] = useState<PrescriptionDetail | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: prescriptionDetails, isLoading, isError, error } = useQuery<PrescriptionDetail[]>({
    queryKey: ['prescriptionDetails', patientId],
    queryFn: () => getPrescriptionDetails(patientId),
    enabled: !!patientId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (coverId: string) => {
        // Placeholder for delete logic. In a real app, you would call an API endpoint.
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
        // This is a mock deletion since there's no backend endpoint for it yet.
        // It optimistically updates the UI.
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
      
       <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
           <AddDrugDialog patientId={patientId} onClose={() => setIsAddOpen(false)} />
       </Dialog>

      <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <Button variant="ghost" onClick={() => router.back()} className="-ml-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patient Hub
          </Button>
          <h1 className="text-3xl font-headline font-semibold mt-2">Manage Prescription Drugs</h1>
          <p className="text-muted-foreground">Add, edit, or remove medications for this prescription.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4"/> Add Drug
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
                        <DrugItem key={drug.cover_id} drug={drug} patientId={patientId} onDelete={setDrugToDelete} />
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