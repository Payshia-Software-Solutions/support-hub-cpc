
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { savePrescriptionContent } from '@/lib/actions/games';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';

const addDrugSchema = z.object({
  coverId: z.string().min(1, 'Cover ID is required'),
  content: z.string().min(1, 'Prescription content is required'),
});

type AddDrugFormValues = z.infer<typeof addDrugSchema>;

export const AddDrugDialog = ({ patientId, nextCoverId, onClose, isOpen, onOpenChange }: { 
    patientId: string, 
    nextCoverId: string, 
    onClose: () => void, 
    isOpen: boolean, 
    onOpenChange: (open: boolean) => void 
}) => {
    const queryClient = useQueryClient();
    
    const form = useForm<AddDrugFormValues>({
        resolver: zodResolver(addDrugSchema),
        defaultValues: {
            coverId: nextCoverId,
            content: ''
        },
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
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Drug</DialogTitle>
                    <DialogDescription>Add a medication to this prescription.</DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="coverId">Cover ID*</Label>
                            <Input id="coverId" {...form.register(`coverId`)} readOnly className="bg-muted/50 cursor-not-allowed"/>
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
        </Dialog>
    )
}
