
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getConvocationRegistrations, updateCertificateName, sendCertificateNameSms } from '@/lib/api';
import type { ConvocationRegistration, UpdateCertificateNamePayload, SendSmsPayload } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Search, Save, Loader2, AlertTriangle, Send } from 'lucide-react';
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ITEMS_PER_PAGE = 25;

// Editable cell component to manage its own state
const EditableCell = ({ record, user, mutation }: { record: ConvocationRegistration, user: any, mutation: any }) => {
    const [name, setName] = useState(record.name_on_certificate);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        setName(record.name_on_certificate);
        setIsDirty(false);
    }, [record.name_on_certificate]);

    const handleSave = () => {
        if (!isDirty || !user?.username) return;
        const payload: UpdateCertificateNamePayload = {
            student_number: record.student_number,
            name_on_certificate: name,
            updated_by: user.username,
        };
        mutation.mutate(payload, {
            onSuccess: () => {
                setIsDirty(false);
            }
        });
    };

    const isPendingForThisRow = mutation.isPending && mutation.variables?.student_number === record.student_number;
    const characterCount = name ? name.length : 0;
    const isOverLimit = characterCount > 30;

    return (
        <div>
            <div className="flex items-center gap-2">
                <Input
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        setIsDirty(e.target.value !== record.name_on_certificate);
                    }}
                    className={cn(
                        "flex-grow",
                        isOverLimit && "border-amber-500 focus-visible:ring-amber-500 text-amber-700"
                    )}
                    disabled={isPendingForThisRow}
                />
                <Button
                    size="icon"
                    onClick={handleSave}
                    disabled={!isDirty || isPendingForThisRow}
                    aria-label={`Save name for ${record.student_number}`}
                >
                    {isPendingForThisRow ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4" />
                    )}
                </Button>
            </div>
             {isOverLimit && (
                <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Warning: Name exceeds 30 characters ({characterCount}/30).
                </p>
            )}
        </div>
    );
};


export default function ConvocationNameEditsPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const { data: records, isLoading, isError, error } = useQuery<ConvocationRegistration[]>({
        queryKey: ['convocationRegistrations'],
        queryFn: getConvocationRegistrations,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });

    const updateNameMutation = useMutation({
        mutationFn: updateCertificateName,
        onSuccess: (data, variables) => {
            queryClient.setQueryData(['convocationRegistrations'], (oldData: ConvocationRegistration[] | undefined) => {
                if (!oldData) return [];
                return oldData.map(record => 
                    record.student_number === variables.student_number 
                        ? { ...record, name_on_certificate: variables.name_on_certificate } 
                        : record
                );
            });
            toast({
                title: 'Success!',
                description: `Successfully updated name for ${variables.student_number}.`
            });
        },
        onError: (error: Error, variables) => {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: `Could not update name for ${variables.student_number}: ${error.message}`,
            });
        },
    });

    const sendSmsMutation = useMutation({
        mutationFn: (payload: SendSmsPayload) => sendCertificateNameSms(payload),
        onSuccess: (data, variables) => {
            toast({
                title: 'SMS Sent!',
                description: `Message sent to ${variables.studenNumber} successfully.`
            });
        },
        onError: (error: Error, variables) => {
            toast({
                variant: 'destructive',
                title: 'SMS Failed',
                description: `Could not send SMS to ${variables.studenNumber}: ${error.message}`
            })
        }
    });


    const filteredRecords = useMemo(() => {
        if (!records) return [];
        const lowercasedFilter = searchTerm.toLowerCase();
        if (!lowercasedFilter) return records;
        return records.filter(record =>
            record.student_number?.toLowerCase().includes(lowercasedFilter) ||
            record.name_on_certificate?.toLowerCase().includes(lowercasedFilter)
        );
    }, [records, searchTerm]);

    // Reset to page 1 whenever the search term changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
    const paginatedRecords = useMemo(() => {
        return filteredRecords.slice(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE
        );
    }, [filteredRecords, currentPage]);


    if (isLoading) {
        return (
            <div className="p-4 md:p-8 space-y-6">
                <header>
                    <h1 className="text-3xl font-headline font-semibold">Convocation Name Edits</h1>
                    <p className="text-muted-foreground">Update student names for convocation certificates.</p>
                </header>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-4 md:p-8">
                <h1 className="text-3xl font-headline font-semibold text-destructive">An Error Occurred</h1>
                <p className="text-muted-foreground">{error?.message}</p>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <h1 className="text-3xl font-headline font-semibold">Convocation Name Edits</h1>
                <p className="text-muted-foreground">Update student names for convocation certificates. Changes are saved per row.</p>
            </header>
            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <CardTitle>Convocation Records</CardTitle>
                            <CardDescription>
                                Showing {paginatedRecords.length} of {filteredRecords.length} records.
                            </CardDescription>
                        </div>
                        <div className="relative w-full md:w-auto md:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by student number or name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto border rounded-lg">
                        <Table>
                            <TableHeader className="sticky top-0 bg-muted/50 z-10">
                                <TableRow>
                                    <TableHead className="w-[150px]">Student Number</TableHead>
                                    <TableHead>Name on Certificate</TableHead>
                                    <TableHead className="w-[100px] text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedRecords.length > 0 ? paginatedRecords.map((record) => (
                                    <TableRow key={record.registration_id}>
                                        <TableCell className="font-medium">{record.student_number}</TableCell>
                                        <TableCell>
                                            <EditableCell record={record} user={user} mutation={updateNameMutation} />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button 
                                                        variant="outline" 
                                                        size="icon" 
                                                        disabled={
                                                            !record.telephone_1 || 
                                                            (sendSmsMutation.isPending && sendSmsMutation.variables?.studenNumber === record.student_number)
                                                        }
                                                        aria-label={`Send SMS to ${record.student_number}`}
                                                    >
                                                        {(sendSmsMutation.isPending && sendSmsMutation.variables?.studenNumber === record.student_number) ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Send className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Confirm SMS</AlertDialogTitle>
                                                        <AlertDialogDescription asChild>
                                                            <div>
                                                                <p>This will send the certificate name to the student.</p>
                                                                <div className="mt-4 space-y-1 text-sm text-foreground">
                                                                    <p><strong>Student:</strong> {record.student_number}</p>
                                                                    <p><strong>Phone:</strong> {record.telephone_1}</p>
                                                                    <p><strong>Name:</strong> {record.name_on_certificate}</p>
                                                                </div>
                                                            </div>
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => {
                                                            sendSmsMutation.mutate({
                                                                mobile: record.telephone_1!,
                                                                studentNameOnCertificate: record.name_on_certificate,
                                                                studenNumber: record.student_number,
                                                            })
                                                        }}>
                                                            Send SMS
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24">No records found matching your search.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                 <CardFooter className="flex items-center justify-center space-x-2 pt-4">
                     <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                     >
                        Previous
                     </Button>
                     <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages || 1}
                     </span>
                     <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || totalPages === 0}
                     >
                        Next
                     </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
