
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getAllUserFullDetails, updateCertificateName } from '@/lib/api';
import type { UserFullDetails, UpdateCertificateNamePayload } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Search, Save, Loader2 } from 'lucide-react';

const ITEMS_PER_PAGE = 25;

// Editable cell component to manage its own state
const EditableCell = ({ student, user, mutation }: { student: UserFullDetails, user: any, mutation: any }) => {
    const [name, setName] = useState(student.name_on_certificate);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        setName(student.name_on_certificate);
        setIsDirty(false);
    }, [student.name_on_certificate]);

    const handleSave = () => {
        if (!isDirty || !user?.username) return;
        const payload: UpdateCertificateNamePayload = {
            student_number: student.username,
            name_on_certificate: name,
            updated_by: user.username,
        };
        mutation.mutate(payload, {
            onSuccess: () => {
                setIsDirty(false);
            }
        });
    };

    const isPendingForThisRow = mutation.isPending && mutation.variables?.student_number === student.username;

    return (
        <div className="flex items-center gap-2">
            <Input
                value={name}
                onChange={(e) => {
                    setName(e.target.value);
                    setIsDirty(e.target.value !== student.name_on_certificate);
                }}
                className="flex-grow"
                disabled={isPendingForThisRow}
            />
            <Button
                size="icon"
                onClick={handleSave}
                disabled={!isDirty || isPendingForThisRow}
                aria-label={`Save name for ${student.username}`}
            >
                {isPendingForThisRow ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Save className="h-4 w-4" />
                )}
            </Button>
        </div>
    );
};


export default function BulkNameUpdatePage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const { data: students, isLoading, isError, error } = useQuery<UserFullDetails[]>({
        queryKey: ['allStudentDetails'],
        queryFn: getAllUserFullDetails,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });

    const updateNameMutation = useMutation({
        mutationFn: updateCertificateName,
        onSuccess: (data, variables) => {
            queryClient.setQueryData(['allStudentDetails'], (oldData: UserFullDetails[] | undefined) => {
                if (!oldData) return [];
                return oldData.map(student => 
                    student.username === variables.student_number 
                        ? { ...student, name_on_certificate: variables.name_on_certificate } 
                        : student
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


    const filteredStudents = useMemo(() => {
        if (!students) return [];
        const lowercasedFilter = searchTerm.toLowerCase();
        if (!lowercasedFilter) return students;
        return students.filter(student =>
            student.username?.toLowerCase().includes(lowercasedFilter) ||
            student.name_on_certificate?.toLowerCase().includes(lowercasedFilter) ||
            student.full_name?.toLowerCase().includes(lowercasedFilter)
        );
    }, [students, searchTerm]);

    // Reset to page 1 whenever the search term changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
    const paginatedStudents = useMemo(() => {
        return filteredStudents.slice(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE
        );
    }, [filteredStudents, currentPage]);


    if (isLoading) {
        return (
            <div className="p-4 md:p-8 space-y-6">
                <header>
                    <h1 className="text-3xl font-headline font-semibold">Bulk Name Update</h1>
                    <p className="text-muted-foreground">Update student names for certificates.</p>
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
                <h1 className="text-3xl font-headline font-semibold">Bulk Name Update</h1>
                <p className="text-muted-foreground">Update student names for certificates. Changes are saved per row.</p>
            </header>
            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <CardTitle>All Students</CardTitle>
                            <CardDescription>
                                Showing {paginatedStudents.length} of {filteredStudents.length} students.
                            </CardDescription>
                        </div>
                        <div className="relative w-full md:w-auto md:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by username or name..."
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
                                    <TableHead className="w-[150px]">Username</TableHead>
                                    <TableHead>Full Name</TableHead>
                                    <TableHead>Name on Certificate</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedStudents.length > 0 ? paginatedStudents.map((student) => (
                                    <TableRow key={student.id}>
                                        <TableCell className="font-medium">{student.username}</TableCell>
                                        <TableCell>{student.full_name}</TableCell>
                                        <TableCell>
                                            <EditableCell student={student} user={user} mutation={updateNameMutation} />
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24">No students found matching your search.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden space-y-4">
                        {paginatedStudents.length > 0 ? paginatedStudents.map((student) => (
                             <div key={student.id} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                                <div>
                                    <p className="text-sm text-muted-foreground">Username</p>
                                    <p className="font-medium">{student.username}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Full Name</p>
                                    <p className="font-medium">{student.full_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Name on Certificate</p>
                                    <EditableCell student={student} user={user} mutation={updateNameMutation} />
                                </div>
                            </div>
                        )) : (
                            <div className="text-center h-24 flex items-center justify-center">
                                <p>No students found matching your search.</p>
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
