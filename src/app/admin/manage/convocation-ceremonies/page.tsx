
"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO } from 'date-fns';
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
import { PlusCircle, Edit, Trash2, Loader2, AlertTriangle, GraduationCap, Package, Users, Award, FileUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { CsvUploadDialog } from '@/components/admin/convocation/CsvUploadDialog';


const ceremonyFormSchema = z.object({
    convocation_name: z.string().min(5, "Event name must be at least 5 characters."),
    held_on: z.string().min(1, "Event date is required."),
    session_count: z.coerce.number().min(1, "There must be at least 1 session."),
    parent_seats: z.coerce.number().min(0, "Parent seats cannot be negative."),
    student_seats: z.coerce.number().min(0, "Student seats cannot be negative."),
    session_2: z.coerce.number().min(0, "Session 2 seats cannot be negative."),
    accept_booking: z.boolean().default(true),
});

type CeremonyFormValues = z.infer<typeof ceremonyFormSchema>;

const CeremonyForm = ({ ceremony, onClose }: { ceremony?: ConvocationCeremony | null; onClose: () => void; }) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const form = useForm<CeremonyFormValues>({
        resolver: zodResolver(ceremonyFormSchema),
        defaultValues: {
            convocation_name: ceremony?.convocation_name || '',
            held_on: ceremony ? format(parseISO(ceremony.held_on), 'yyyy-MM-dd') : '',
            session_count: ceremony ? parseInt(ceremony.session_count, 10) : 1,
            parent_seats: ceremony ? parseInt(ceremony.parent_seats, 10) : 0,
            student_seats: ceremony ? parseInt(ceremony.student_seats, 10) : 0,
            session_2: ceremony ? parseInt(ceremony.session_2, 10) : 0,
            accept_booking: ceremony ? ceremony.accept_booking === '1' : true,
        },
    });
    
    const mutation = useMutation({
        mutationFn: (data: CeremonyFormValues) => {
            if (!user?.username) throw new Error("User not authenticated");
            const payload = { ...data, created_by: user.username, created_at: new Date().toISOString() };

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
                <Label htmlFor="convocation_name">Event Name</Label>
                <Input id="convocation_name" {...form.register('convocation_name')} />
                {form.formState.errors.convocation_name && <p className="text-sm text-destructive">{form.formState.errors.convocation_name.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="held_on">Event Date</Label>
                <Input id="held_on" type="date" {...form.register('held_on')} />
                {form.formState.errors.held_on && <p className="text-sm text-destructive">{form.formState.errors.held_on.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="session_count">Session Count</Label>
                    <Input id="session_count" type="number" {...form.register('session_count')} />
                    {form.formState.errors.session_count && <p className="text-sm text-destructive">{form.formState.errors.session_count.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="student_seats">Student Seats</Label>
                    <Input id="student_seats" type="number" {...form.register('student_seats')} />
                    {form.formState.errors.student_seats && <p className="text-sm text-destructive">{form.formState.errors.student_seats.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="parent_seats">Parent Seats</Label>
                    <Input id="parent_seats" type="number" {...form.register('parent_seats')} />
                    {form.formState.errors.parent_seats && <p className="text-sm text-destructive">{form.formState.errors.parent_seats.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="session_2">Session 2 Seats</Label>
                    <Input id="session_2" type="number" {...form.register('session_2')} />
                    {form.formState.errors.session_2 && <p className="text-sm text-destructive">{form.formState.errors.session_2.message}</p>}
                </div>
            </div>
            <div className="md:col-span-2 flex items-center space-x-2 pt-4">
                <Controller
                    name="accept_booking"
                    control={form.control}
                    render={({ field }) => (
                        <Switch
                            id="accept_booking"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                    )}
                />
                <Label htmlFor="accept_booking" className="cursor-pointer">Accept new bookings for this convocation</Label>
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
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [ceremonyForUpload, setCeremonyForUpload] = useState<ConvocationCeremony | null>(null);

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

            <CsvUploadDialog 
                open={isUploadDialogOpen}
                onOpenChange={setIsUploadDialogOpen}
                convocationId={ceremonyForUpload?.id || ''}
                convocationName={ceremonyForUpload?.convocation_name || ''}
            />

            <AlertDialog open={!!ceremonyToDelete} onOpenChange={() => setCeremonyToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete "{ceremonyToDelete?.convocation_name}".</AlertDialogDescription>
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
                                        <TableHead>Sessions</TableHead>
                                        <TableHead>Student Seats</TableHead>
                                        <TableHead>Booking Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ceremonies && ceremonies.length > 0 ? (
                                        ceremonies.map(c => (
                                            <TableRow key={c.id}>
                                                <TableCell className="font-medium">{c.convocation_name}</TableCell>
                                                <TableCell>{format(new Date(c.held_on), 'PPP')}</TableCell>
                                                <TableCell>{c.session_count}</TableCell>
                                                <TableCell>{c.student_seats}</TableCell>
                                                <TableCell>
                                                    <Badge variant={c.accept_booking === '1' ? 'default' : 'secondary'}>
                                                        {c.accept_booking === '1' ? 'Open' : 'Closed'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right space-x-1">
                                                     <Button asChild variant="outline" size="sm">
                                                        <Link href={`/admin/manage/convocation?ceremonyId=${c.id}`}>
                                                            <Users className="mr-2 h-4 w-4" /> Registrations
                                                        </Link>
                                                    </Button>
                                                     <Button asChild variant="outline" size="sm">
                                                        <Link href={`/admin/manage/convocation-generate?ceremonyId=${c.id}`}>
                                                            <Award className="mr-2 h-4 w-4" /> Generate
                                                        </Link>
                                                    </Button>
                                                     <Button asChild variant="outline" size="sm">
                                                        <Link href={`/admin/manage/convocation-ceremonies/${c.id}`}>
                                                            <Package className="mr-2 h-4 w-4" /> Packages
                                                        </Link>
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => {
                                                        setCeremonyForUpload(c);
                                                        setIsUploadDialogOpen(true);
                                                    }}>
                                                        <FileUp className="mr-2 h-4 w-4" /> CSV Upload
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Edit className="h-4 w-4"/></Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setCeremonyToDelete(c)}><Trash2 className="h-4 w-4"/></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center h-24">No ceremonies found.</TableCell>
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
