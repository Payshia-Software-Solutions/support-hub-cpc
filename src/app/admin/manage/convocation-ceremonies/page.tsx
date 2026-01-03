
"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { getConvocationCeremonies, createConvocationCeremony, updateConvocationCeremony, deleteConvocationCeremony } from '@/lib/actions/certificates';
import type { ConvocationCeremony } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PlusCircle, Edit, Trash2, Loader2, AlertTriangle, GraduationCap } from 'lucide-react';
import { Switch } from '@/components/ui/switch';


const ceremonyFormSchema = z.object({
    event_name: z.string().min(5, "Event name must be at least 5 characters."),
    event_date: z.string().min(1, "Event date is required."),
    location: z.string().min(3, "Location is required."),
    is_active: z.boolean(),
});

type CeremonyFormValues = z.infer<typeof ceremonyFormSchema>;

const CeremonyForm = ({ ceremony, onClose }: { ceremony?: ConvocationCeremony | null; onClose: () => void; }) => {
    const queryClient = useQueryClient();
    const form = useForm<CeremonyFormValues>({
        resolver: zodResolver(ceremonyFormSchema),
        defaultValues: {
            event_name: ceremony?.event_name || '',
            event_date: ceremony ? format(new Date(ceremony.event_date), 'yyyy-MM-dd') : '',
            location: ceremony?.location || '',
            is_active: ceremony ? ceremony.is_active === '1' : true,
        },
    });
    
    const mutation = useMutation({
        mutationFn: (data: CeremonyFormValues) => {
            const payload = { ...data, is_active: data.is_active ? '1' : '0' };
            if (ceremony?.id) {
                return updateConvocationCeremony(ceremony.id, payload);
            }
            return createConvocationCeremony(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['convocationCeremonies'] });
            toast({ title: 'Success', description: `Ceremony ${ceremony ? 'updated' : 'created'} successfully.` });
            onClose();
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        },
    });
    
    const onSubmit = (data: CeremonyFormValues) => {
        mutation.mutate(data);
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="event_name">Event Name</Label>
                <Input id="event_name" {...form.register('event_name')} />
                {form.formState.errors.event_name && <p className="text-sm text-destructive">{form.formState.errors.event_name.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="event_date">Event Date</Label>
                <Input id="event_date" type="date" {...form.register('event_date')} />
                {form.formState.errors.event_date && <p className="text-sm text-destructive">{form.formState.errors.event_date.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" {...form.register('location')} />
                {form.formState.errors.location && <p className="text-sm text-destructive">{form.formState.errors.location.message}</p>}
            </div>
            <div className="flex items-center space-x-2">
                 <Switch id="is_active" checked={form.watch('is_active')} onCheckedChange={(checked) => form.setValue('is_active', checked)} />
                <Label htmlFor="is_active">Set as Active</Label>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" disabled={mutation.isPending}>Cancel</Button></DialogClose>
                <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {ceremony ? 'Save Changes' : 'Create Ceremony'}
                </Button>
            </DialogFooter>
        </form>
    );
};


export default function ManageConvocationCeremoniesPage() {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedCeremony, setSelectedCeremony] = useState<ConvocationCeremony | null>(null);
    const [ceremonyToDelete, setCeremonyToDelete] = useState<ConvocationCeremony | null>(null);

    const { data: ceremonies, isLoading, isError, error } = useQuery<ConvocationCeremony[]>({
        queryKey: ['convocationCeremonies'],
        queryFn: getConvocationCeremonies,
    });
    
    const deleteMutation = useMutation({
        mutationFn: deleteConvocationCeremony,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['convocationCeremonies'] });
            toast({ title: 'Success', description: 'Ceremony deleted successfully.' });
        },
        onError: (error: Error) => toast({ variant: 'destructive', title: 'Error', description: error.message }),
        onSettled: () => setCeremonyToDelete(null),
    });
    
    const handleCreate = () => {
        setSelectedCeremony(null);
        setIsFormOpen(true);
    };

    const handleEdit = (ceremony: ConvocationCeremony) => {
        setSelectedCeremony(ceremony);
        setIsFormOpen(true);
    };

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedCeremony ? 'Edit' : 'Create'} Convocation Ceremony</DialogTitle>
                        <DialogDescription>{selectedCeremony ? 'Modify the details of the ceremony.' : 'Add a new convocation event.'}</DialogDescription>
                    </DialogHeader>
                    <CeremonyForm ceremony={selectedCeremony} onClose={() => setIsFormOpen(false)} />
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!ceremonyToDelete} onOpenChange={() => setCeremonyToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete "{ceremonyToDelete?.event_name}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(ceremonyToDelete!.id)} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-headline font-semibold">Manage Convocation Ceremonies</h1>
                    <p className="text-muted-foreground">View, create, and manage convocation events.</p>
                </div>
                <Button onClick={handleCreate}><PlusCircle className="mr-2 h-4 w-4" /> Add New Ceremony</Button>
            </header>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>All Ceremonies</CardTitle>
                    <CardDescription>{isLoading ? "Loading..." : `${ceremonies?.length || 0} ceremonies found.`}</CardDescription>
                </CardHeader>
                <CardContent>
                     {isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" />
                        </div>
                    ) : isError ? (
                         <div className="p-4 text-destructive"><AlertTriangle className="inline-block mr-2" />Error: {(error as Error).message}</div>
                    ) : (
                        <div className="relative w-full overflow-auto border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Event Name</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ceremonies && ceremonies.length > 0 ? (
                                        ceremonies.map(c => (
                                            <TableRow key={c.id}>
                                                <TableCell className="font-medium">{c.event_name}</TableCell>
                                                <TableCell>{format(new Date(c.event_date), 'PPP')}</TableCell>
                                                <TableCell>{c.location}</TableCell>
                                                <TableCell>{c.is_active === '1' ? 'Active' : 'Inactive'}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Edit className="h-4 w-4"/></Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setCeremonyToDelete(c)}><Trash2 className="h-4 w-4"/></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24">No ceremonies found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
