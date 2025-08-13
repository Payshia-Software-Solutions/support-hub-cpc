"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentFullInfo, generateCertificate } from '@/lib/api';
import type { FullStudentData, StudentEnrollment, GenerateCertificatePayload } from '@/lib/types';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, AlertTriangle, User, Mail, Phone, Award, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


const CertificateEligibilityCard = ({ enrollment, studentNumber }: { enrollment: StudentEnrollment, studentNumber: string }) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    
    const { mutate, isPending } = useMutation({
        mutationFn: generateCertificate,
        onSuccess: (data) => {
            toast({ title: 'Certificate Generated!', description: `Certificate ID ${data.certificate_id} created for ${enrollment.parent_course_name}.` });
            queryClient.invalidateQueries({ queryKey: ['studentFullInfo', studentNumber] });
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
            student_number: studentNumber,
            print_status: "0", // 0 for Not Printed
            print_by: user.username,
            type: "Certificate",
            parentCourseCode: parseInt(enrollment.parent_course_id, 10),
            referenceId: 0, // No specific reference for manual generation
            course_code: enrollment.course_code,
            source: "manual_generation"
        };
        mutate(payload);
    };

    const hasGeneratedCertificate = enrollment.certificateRecords.some(c => c.type === 'Certificate');

    return (
        <div className={cn("p-4 border rounded-lg flex items-center justify-between", enrollment.certificate_eligibility ? "bg-card" : "bg-muted/50")}>
            <div className="flex-1">
                <p className="font-semibold">{enrollment.parent_course_name}</p>
                <div className="flex items-center gap-2 mt-1">
                    <Badge variant={enrollment.certificate_eligibility ? 'default' : 'secondary'}>
                        {enrollment.certificate_eligibility ? "Eligible" : "Not Eligible"}
                    </Badge>
                     {hasGeneratedCertificate && (
                        <Badge variant="outline" className="text-blue-600 border-blue-400">
                           <CheckCircle className="mr-1.5 h-3.5 w-3.5"/> Generated
                        </Badge>
                    )}
                </div>
            </div>
            <Button 
                size="sm" 
                onClick={handleGenerate} 
                disabled={!enrollment.certificate_eligibility || hasGeneratedCertificate || isPending}
            >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Award className="mr-2 h-4 w-4" />}
                {hasGeneratedCertificate ? 'Already Generated' : 'Generate'}
            </Button>
        </div>
    );
};


export default function GenerateCertificatePage() {
    const [studentId, setStudentId] = useState('');
    const [studentData, setStudentData] = useState<FullStudentData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentId.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a student ID.' });
            return;
        }

        setIsLoading(true);
        setError(null);
        setStudentData(null);

        try {
            const data = await getStudentFullInfo(studentId);
            setStudentData(data);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
            toast({ variant: 'destructive', title: 'Search Failed', description: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    const enrollmentsArray = studentData ? Object.values(studentData.studentEnrollments) : [];

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <h1 className="text-3xl font-headline font-semibold">Generate Certificate</h1>
                <p className="text-muted-foreground">Search for a student to check their eligibility and generate certificates.</p>
            </header>

            <Card className="shadow-lg">
                <CardContent className="p-6">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                        <Input 
                            placeholder="Enter Student ID (e.g., PA16642)" 
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            className="flex-grow"
                        />
                        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                            Search
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {isLoading && (
                <div className="space-y-6">
                    <Skeleton className="h-[170px] w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            )}

            {error && !isLoading && (
                <Card className="border-destructive">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle /> An Error Occurred</CardTitle></CardHeader>
                    <CardContent><p>{error}</p></CardContent>
                </Card>
            )}

            {studentData && (
                <div className="space-y-6">
                    {/* Profile Header */}
                    <Card className="shadow-lg">
                        <CardContent className="p-4 md:p-6">
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6">
                                <Avatar className="w-24 h-24 text-4xl border-2 border-primary" data-ai-hint="student avatar">
                                    <AvatarImage src={`https://placehold.co/150x150.png`} alt={studentData.studentInfo.full_name} />
                                    <AvatarFallback>{studentData.studentInfo.full_name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 text-center sm:text-left">
                                    <h2 className="text-2xl font-bold font-headline">{studentData.studentInfo.full_name}</h2>
                                    <p className="text-muted-foreground">{studentData.studentInfo.student_id}</p>
                                    <div className="mt-2 text-sm text-muted-foreground space-y-1 break-all">
                                        <p className="flex items-center justify-center sm:justify-start gap-2"><Mail className="h-4 w-4 shrink-0" /> {studentData.studentInfo.e_mail}</p>
                                        <p className="flex items-center justify-center sm:justify-start gap-2"><Phone className="h-4 w-4 shrink-0" /> {studentData.studentInfo.telephone_1}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Certificate Eligibility */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Certificate Eligibility & Generation</CardTitle>
                            <CardDescription>View course eligibility and generate certificates for this student.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <div className="space-y-4">
                                {enrollmentsArray.length > 0 ? (
                                    enrollmentsArray.map(enrollment => (
                                        <CertificateEligibilityCard key={enrollment.id} enrollment={enrollment} studentNumber={studentData.studentInfo.username} />
                                    ))
                                ) : (
                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>No Enrollments Found</AlertTitle>
                                        <AlertDescription>
                                            This student is not currently enrolled in any courses.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}