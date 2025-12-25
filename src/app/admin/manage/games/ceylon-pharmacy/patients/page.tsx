
"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, User, PlusCircle, AlertTriangle, Search, Trash2, Loader2 } from "lucide-react";
import Link from 'next/link';
import { getCeylonPharmacyPrescriptions, deleteGamePatient } from '@/lib/actions/games';
import type { GamePatient } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ManagePatientsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [patientToDelete, setPatientToDelete] = useState<GamePatient | null>(null);

    const { data: patients, isLoading, isError, error } = useQuery<GamePatient[]>({
        queryKey: ['allCeylonPharmacyPatients'],
        queryFn: () => getCeylonPharmacyPrescriptions('admin-user', 'CPCC20'),
        enabled: !!user,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteGamePatient,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allCeylonPharmacyPatients'] });
            toast({ title: "Patient Deleted", description: "The patient record has been successfully removed." });
        },
        onError: (err: Error) => {
            toast({ variant: 'destructive', title: 'Deletion Failed', description: err.message });
        },
        onSettled: () => {
            setPatientToDelete(null);
        }
    });
    
    const sortedPatients = useMemo(() => {
        if (!patients) return [];
        return [...patients].sort((a, b) => parseInt(b.prescription_id, 10) - parseInt(a.prescription_id, 10));
    }, [patients]);

    const filteredPatients = useMemo(() => {
        if (!sortedPatients) return [];
        const lowercasedSearch = searchTerm.toLowerCase();
        if (!lowercasedSearch) return sortedPatients;

        return sortedPatients.filter(patient =>
            (patient.Pres_Name?.toLowerCase() || '').includes(lowercasedSearch) ||
            (patient.prescription_id?.toLowerCase() || '').includes(lowercasedSearch)
        );
    }, [sortedPatients, searchTerm]);


    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <AlertDialog open={!!patientToDelete} onOpenChange={() => setPatientToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the patient "{patientToDelete?.Pres_Name}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(patientToDelete!.prescription_id)} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                 <div>
                    <Button variant="ghost" onClick={() => router.push('/admin/manage/games/ceylon-pharmacy')} className="-ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Game Setup
                    </Button>
                    <h1 className="text-3xl font-headline font-semibold mt-2">Manage Patients & Prescriptions</h1>
                    <p className="text-muted-foreground">Add new patients or select one to edit their profile and prescription details.</p>
                </div>
                 <Button asChild>
                    <Link href="/admin/manage/games/ceylon-pharmacy/patients/create">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Patient
                    </Link>
                </Button>
            </header>
            
            <Card className="shadow-lg">
                <CardHeader>
                     <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <CardTitle>Patient List</CardTitle>
                            <CardDescription>
                                {isLoading ? 'Loading patients...' : `${filteredPatients?.length || 0} patients found.`}
                            </CardDescription>
                        </div>
                        <div className="relative w-full md:max-w-xs">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                           <Input 
                                placeholder="Search by name or PRE code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                           />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {isLoading && [...Array(3)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-4 flex items-center gap-4">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {isError && (
                        <div className="md:col-span-3 text-center py-10 text-destructive">
                             <AlertTriangle className="h-8 w-8 mx-auto mb-2"/>
                            <p className="font-semibold">Failed to load patients</p>
                            <p className="text-sm">{error.message}</p>
                        </div>
                    )}
                    {!isLoading && !isError && filteredPatients?.map(patient => {
                        const patientName = patient.Pres_Name || 'Unknown Patient';
                        const fallbackInitial = patientName.charAt(0) || 'P';
                        return (
                            <Card key={patient.prescription_id} className="hover:shadow-md hover:border-primary/50 transition-all">
                                <div className="p-4 flex items-center gap-4">
                                    <Avatar className="h-12 w-12 text-lg">
                                        <AvatarImage src={`https://placehold.co/100x100.png?text=${fallbackInitial}`} alt={patientName} />
                                        <AvatarFallback>{fallbackInitial}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-semibold text-card-foreground">{patientName}</p>
                                        <p className="text-sm text-muted-foreground">{patient.prescription_id} | Age: {patient.Pres_Age}</p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                                            <Link href={`/admin/manage/games/ceylon-pharmacy/patients/${patient.prescription_id}`} onClick={(e) => e.stopPropagation()}>
                                                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                            </Link>
                                        </Button>
                                         <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setPatientToDelete(patient); }}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                     {!isLoading && !isError && filteredPatients?.length === 0 && (
                        <div className="md:col-span-3 text-center py-10 text-muted-foreground">
                            <p>No patients found for your search term.</p>
                        </div>
                     )}
                </CardContent>
            </Card>
        </div>
    );
}
