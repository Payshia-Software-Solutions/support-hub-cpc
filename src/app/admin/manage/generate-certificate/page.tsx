
"use client";

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getCourses, getStudentsByCourseCode, generateCertificate, getUserCertificatePrintStatus } from '@/lib/api';
import type { Course, StudentInBatch, GenerateCertificatePayload, UserCertificatePrintStatus } from '@/lib/types';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, Loader2, AlertTriangle, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const CertificateGenerationRow = ({ student, course }: { student: StudentInBatch, course: Course }) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    
    const { data: certificateStatus, isLoading: isLoadingStatus } = useQuery<UserCertificatePrintStatus[]>({
        queryKey: ['userCertificateStatus', student.username],
        queryFn: () => getUserCertificatePrintStatus(student.username),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: true, // This will ensure the query refetches when the window is focused after mutation.
    });

    const generatedCertificate = useMemo(() => {
        if (!certificateStatus) return null;
        return certificateStatus.find(cert => cert.parent_course_id === course.id && cert.type === 'Certificate');
    }, [certificateStatus, course.id]);

    const isEligible = true;

    const { mutate, isPending } = useMutation({
        mutationFn: generateCertificate,
        onSuccess: (data) => {
            toast({ title: 'Certificate Generated!', description: `Certificate ID ${data.certificate_id} created for ${student.full_name}.` });
            queryClient.invalidateQueries({ queryKey: ['userCertificateStatus', student.username] });
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
            return <Skeleton className="h-6 w-24" />;
        }
        if (generatedCertificate) {
            return <Badge variant="secondary">ID: {generatedCertificate.certificate_id}</Badge>;
        }
        return (
            <Button size="sm" onClick={handleGenerate} disabled={!isEligible || isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Award className="mr-2 h-4 w-4" />}
                Generate
            </Button>
        );
    };

    return (
        <TableRow>
            <TableCell className="font-medium">{student.username}</TableCell>
            <TableCell>{student.full_name}</TableCell>
            <TableCell>
                <Badge variant={isEligible ? 'default' : 'destructive'}>
                    {isEligible ? "Eligible" : "Not Eligible"}
                </Badge>
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
                        <CardTitle>Students in {selectedCourse.name}</CardTitle>
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
