
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getCourses } from '@/lib/actions/courses';
import { getStudentsByCourseCode } from '@/lib/actions/delivery';
import { getUserCertificatePrintStatus, generateCertificate } from '@/lib/actions/certificates';
import type { Course, StudentInBatch, GenerateCertificatePayload, UserCertificatePrintStatus } from '@/lib/types';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, Loader2, AlertTriangle, BookOpen, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';

const CertificateGenerationRow = ({ student, course }: { student: StudentInBatch, course: Course }) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    
    const { data: rawCertificateData, isLoading: isLoadingStatus } = useQuery<{ certificateStatus: UserCertificatePrintStatus[] }>({
        queryKey: ['userCertificateStatus', student.username],
        queryFn: () => getUserCertificatePrintStatus(student.username),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: true,
    });

    const generatedCertificate = useMemo(() => {
        const certificateStatus = rawCertificateData?.certificateStatus || [];
        if (certificateStatus.length === 0) return null;
        
        // Find a certificate where the course_code matches the selected batch's courseCode.
        return certificateStatus.find(cert => cert.course_code === course.courseCode && cert.type === 'Certificate');
    }, [rawCertificateData, course.courseCode]);

    const isEligible = true;

    const { mutate, isPending } = useMutation({
        mutationFn: generateCertificate,
        onSuccess: (newCertificateData) => {
            toast({ title: 'Certificate Generated!', description: `Certificate ID ${newCertificateData.certificate_id} created for ${student.full_name}.` });
            
            // Optimistically update the local cache to reflect the new certificate immediately.
            queryClient.setQueryData(['userCertificateStatus', student.username], (oldData: { certificateStatus: UserCertificatePrintStatus[] } | undefined) => {
                const newCert: UserCertificatePrintStatus = {
                    id: newCertificateData.id,
                    student_number: newCertificateData.student_number,
                    certificate_id: newCertificateData.certificate_id,
                    print_date: new Date().toISOString(),
                    print_status: "0",
                    print_by: newCertificateData.print_by,
                    type: "Certificate",
                    course_code: course.courseCode,
                    parent_course_id: course.id,
                };
                 const existingStatuses = oldData?.certificateStatus || [];
                 return { certificateStatus: [...existingStatuses, newCert] };
            });

            // Refetch to ensure data consistency with the server
            queryClient.refetchQueries({ queryKey: ['userCertificateStatus', student.username], exact: true });
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Generation Failed', description: error.message });
        }
    });

    const handleGenerate = () => {
        if (!user?.username) {
            toast({ variant: 'destructive', title: 'Authentication Error', description: 'Could not identify the current user.' });
            return;
        }

        const payload: GenerateCertificatePayload = {
            student_number: student.username,
            print_status: "0",
            print_by: user.username,
            type: "Certificate",
            parentCourseCode: parseInt(course.id, 10),
            referenceId: 0,
            course_code: course.courseCode,
            source: "batch_generation"
        };
        mutate(payload);
    };

    const renderActionCell = () => {
        if (isLoadingStatus) {
            return <Skeleton className="h-9 w-24" />;
        }
        if (generatedCertificate) {
            return null; // Don't show the button if a certificate exists
        }
        return (
            <Button size="sm" onClick={handleGenerate} disabled={!isEligible || isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Award className="mr-2 h-4 w-4" />}
                Generate
            </Button>
        );
    };
    
    const renderCertificateIdCell = () => {
        if (isLoadingStatus) {
            return <Skeleton className="h-6 w-28" />;
        }
        if (generatedCertificate) {
            return <Badge variant="secondary">{generatedCertificate.certificate_id}</Badge>;
        }
        return <Badge variant="outline">None</Badge>;
    }

    return (
        <TableRow>
            <TableCell className="font-medium">{student.username}</TableCell>
            <TableCell>{student.full_name}</TableCell>
            <TableCell>
                <Badge variant={isEligible ? 'default' : 'destructive'}>
                    {isEligible ? "Eligible" : "Not Eligible"}
                </Badge>
            </TableCell>
            <TableCell>
                {renderCertificateIdCell()}
            </TableCell>
            <TableCell className="text-center">
                 <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isLoadingStatus}>
                            <Database className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>API Response for {student.username}</DialogTitle>
                            <DialogDescription>Raw JSON data from the certificate status endpoint.</DialogDescription>
                        </DialogHeader>
                        <div className="mt-4 max-h-[60vh] overflow-y-auto rounded-md bg-muted p-4">
                            <pre className="text-xs">
                                <code>{JSON.stringify(rawCertificateData, null, 2)}</code>
                            </pre>
                        </div>
                    </DialogContent>
                </Dialog>
            </TableCell>
            <TableCell className="text-right">
                {renderActionCell()}
            </TableCell>
        </TableRow>
    );
};

export default function GenerateCertificateBatchPage() {
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const queryClient = useQueryClient();

    const { data: courses, isLoading: isLoadingCourses } = useQuery<Course[]>({
        queryKey: ['coursesForCertGen'],
        queryFn: getCourses,
        staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    });

    const selectedCourse = useMemo(() => {
        return courses?.find(c => c.id === selectedCourseId);
    }, [courses, selectedCourseId]);

    const { data: students, isLoading: isLoadingStudents, isError, error } = useQuery<StudentInBatch[]>({
        queryKey: ['studentsByBatch', selectedCourse?.courseCode],
        queryFn: () => getStudentsByCourseCode(selectedCourse!.courseCode),
        enabled: !!selectedCourse,
    });
    
    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <h1 className="text-3xl font-headline font-semibold">Batch Certificate Generation</h1>
                <p className="text-muted-foreground">Select a batch to view students and generate their certificates.</p>
            </header>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Select a Batch</CardTitle>
                    <CardDescription>Choose the batch for which you want to generate certificates.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Select value={selectedCourseId} onValueChange={setSelectedCourseId} disabled={isLoadingCourses}>
                        <SelectTrigger className="w-full md:w-1/2">
                            <SelectValue placeholder={isLoadingCourses ? "Loading batches..." : "Choose a batch..."} />
                        </SelectTrigger>
                        <SelectContent>
                            {courses?.map(course => (
                                <SelectItem key={course.id} value={course.id}>
                                    {course.name} ({course.courseCode})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {selectedCourse && (
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Students in {selectedCourse.name} ({selectedCourse.courseCode})</CardTitle>
                        <CardDescription>
                            List of students enrolled in this batch.
                            {isLoadingStudents && " Loading students..."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingStudents ? (
                            <div className="space-y-2">
                                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                            </div>
                        ) : isError ? (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Error Loading Students</AlertTitle>
                                <AlertDescription>{(error as Error).message}</AlertDescription>
                            </Alert>
                        ) : students && students.length > 0 ? (
                            <div className="relative w-full overflow-auto border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student ID</TableHead>
                                            <TableHead>Full Name</TableHead>
                                            <TableHead>Eligibility</TableHead>
                                            <TableHead>Certificate ID</TableHead>
                                            <TableHead className="text-center">API Data</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {students.map(student => (
                                            <CertificateGenerationRow key={student.student_course_id} student={student} course={selectedCourse}/>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-10 text-muted-foreground flex flex-col items-center">
                                <BookOpen className="w-12 h-12 mb-4" />
                                <h3 className="text-lg font-semibold">No Students Found</h3>
                                <p>There are no students enrolled in this batch.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
