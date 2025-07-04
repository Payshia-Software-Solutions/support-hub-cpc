
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getCertificateOrders, updateCertificateName } from '@/lib/api';
import type { CertificateOrder, UpdateCertificateNamePayload } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Search, Save, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Badge } from '@/components/ui/badge';

const ITEMS_PER_PAGE = 25;

// Cell component to check and display convocation status
const fetchConvocationStatus = async (studentNumber: string) => {
    if (!studentNumber) return null;
    try {
        const response = await fetch(`https://qa-api.pharmacollege.lk/convocation-registrations/get-records-student-number/${studentNumber}`);
        if (response.status === 404) {
            return null; // No registration found, this is a valid state
        }
        if (!response.ok) {
            throw new Error('Failed to fetch status');
        }
        const data = await response.json();
        return data && data.registration_id ? data : null;
    } catch (error) {
        // Log the error but don't crash the cell
        console.error(`Failed to fetch convocation status for ${studentNumber}:`, error);
        throw error; // Let react-query handle the error state
    }
};

const ConvocationStatusCell = ({ studentNumber }: { studentNumber: string }) => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['convocationStatus', studentNumber],
        queryFn: () => fetchConvocationStatus(studentNumber),
        retry: (failureCount, error: any) => {
            // Don't retry for 404s, which are handled as a success(null)
            if (error?.message?.includes('404')) return false;
            return failureCount < 2;
        },
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });

    if (isLoading) {
        return <Skeleton className="h-5 w-28" />;
    }

    if (isError) {
        return <Badge variant="outline">Check Failed</Badge>;
    }

    if (data) {
        return <Badge variant="destructive">Convocation Registered</Badge>;
    }

    return <Badge variant="secondary">Normal</Badge>;
};


// Editable cell component to manage its own state
const EditableCell = ({ record, user, mutation }: { record: CertificateOrder, user: any, mutation: any }) => {
    const [name, setName] = useState(record.name_on_certificate);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        setName(record.name_on_certificate);
        setIsDirty(false);
    }, [record.name_on_certificate]);

    const handleSave = () => {
        if (!isDirty || !user?.username) return;
        const payload: UpdateCertificateNamePayload = {
            student_number: record.created_by, // Use `created_by` as the student identifier
            name_on_certificate: name,
            updated_by: user.username,
        };
        mutation.mutate(payload, {
            onSuccess: () => {
                setIsDirty(false);
            }
        });
    };

    const isPendingForThisRow = mutation.isPending && mutation.variables?.student_number === record.created_by;
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
                    aria-label={`Save name for ${record.created_by}`}
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


export default function CertificateOrderNameEditsPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const { data: records, isLoading, isError, error } = useQuery<CertificateOrder[]>({
        queryKey: ['certificateOrders'],
        queryFn: getCertificateOrders,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });

    const updateNameMutation = useMutation({
        mutationFn: updateCertificateName,
        onSuccess: (data, variables) => {
            queryClient.setQueryData(['certificateOrders'], (oldData: CertificateOrder[] | undefined) => {
                if (!oldData) return [];
                return oldData.map(record => 
                    record.created_by === variables.student_number 
                        ? { ...record, name_on_certificate: variables.name_on_certificate } 
                        : record
                );
            });
            toast({
                title: 'Success!',
                description: `Successfully updated name for student ${variables.student_number}.`
            });
        },
        onError: (error: Error, variables) => {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: `Could not update name for student ${variables.student_number}: ${error.message}`,
            });
        },
    });


    const filteredRecords = useMemo(() => {
        if (!records) return [];
        const lowercasedFilter = searchTerm.toLowerCase();
        if (!lowercasedFilter) return records;
        return records.filter(record =>
            record.created_by?.toLowerCase().includes(lowercasedFilter) ||
            record.name_on_certificate?.toLowerCase().includes(lowercasedFilter)
        );
    }, [records, searchTerm]);

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
                    <h1 className="text-3xl font-headline font-semibold">Certificate Order Name Edits</h1>
                    <p className="text-muted-foreground">Update student names for certificate orders.</p>
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
                <h1 className="text-3xl font-headline font-semibold">Certificate Order Name Edits</h1>
                <p className="text-muted-foreground">Update student names for certificate orders. Changes are saved per row.</p>
            </header>
            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <CardTitle>Certificate Order Records</CardTitle>
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
                    {/* Desktop View */}
                    <div className="relative w-full overflow-auto border rounded-lg hidden md:block">
                        <Table>
                            <TableHeader className="sticky top-0 bg-muted/50 z-10">
                                <TableRow>
                                    <TableHead className="w-[150px]">Student Number</TableHead>
                                    <TableHead>Name on Certificate</TableHead>
                                    <TableHead>Convocation Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedRecords.length > 0 ? paginatedRecords.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell className="font-medium">{record.created_by}</TableCell>
                                        <TableCell>
                                            <EditableCell record={record} user={user} mutation={updateNameMutation} />
                                        </TableCell>
                                        <TableCell>
                                            <ConvocationStatusCell studentNumber={record.created_by} />
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

                    {/* Mobile View */}
                    <div className="md:hidden space-y-4">
                        {paginatedRecords.length > 0 ? paginatedRecords.map((record) => (
                             <div key={record.id} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                                <div>
                                    <p className="text-sm text-muted-foreground">Student Number</p>
                                    <p className="font-medium">{record.created_by}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Name on Certificate</p>
                                    <EditableCell record={record} user={user} mutation={updateNameMutation} />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Convocation Status</p>
                                    <div className="mt-1">
                                        <ConvocationStatusCell studentNumber={record.created_by} />
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center h-24 flex items-center justify-center">
                                <p>No records found matching your search.</p>
                            </div>
                        )}
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
