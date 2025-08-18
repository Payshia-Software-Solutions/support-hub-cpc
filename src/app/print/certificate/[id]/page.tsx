
"use client";

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getStudentDetailsByUsername } from '@/lib/actions/users';
import { getParentCourseByCode } from '@/lib/actions/courses';
import { getCertificatePrintStatusById } from '@/lib/actions/certificates';
import type { UserFullDetails, ParentCourse, UserCertificatePrintStatus } from '@/lib/types';
import { CertificateLayout } from '@/components/print/CertificateLayout';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';


export default function PrintCertificatePage() {
    const params = useParams();
    const certificateId = params.id as string;

    const { data: certData, isLoading: isLoadingCert } = useQuery<UserCertificatePrintStatus | null>({
        queryKey: ['certificateData', certificateId],
        queryFn: () => getCertificatePrintStatusById(certificateId),
        enabled: !!certificateId,
    });

    const { data: studentData, isLoading: isLoadingStudent } = useQuery<UserFullDetails>({
        queryKey: ['studentDetailsForCert', certData?.student_number],
        queryFn: () => getStudentDetailsByUsername(certData!.student_number),
        enabled: !!certData?.student_number,
    });
    
    const { data: courseData, isLoading: isLoadingCourse } = useQuery<ParentCourse>({
        queryKey: ['courseDetailsForCert', certData?.course_code],
        queryFn: () => getParentCourseByCode(certData!.course_code),
        enabled: !!certData?.course_code,
    });

    const isLoading = isLoadingCert || isLoadingStudent || isLoadingCourse;

    useEffect(() => {
        if (!isLoading) {
            document.title = `Certificate - ${studentData?.full_name || certificateId}`;
        }
    }, [isLoading, studentData, certificateId]);

    const handlePrint = () => {
        window.print();
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200 p-8">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Loading Certificate...</p>
                <div className="w-[210mm] h-[297mm] bg-white shadow-lg mt-8">
                    <Skeleton className="w-full h-full" />
                </div>
            </div>
        );
    }
    
    if (!certData || !studentData || !courseData) {
        return (
             <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200 p-8">
                <h1 className="text-2xl font-bold text-destructive">Certificate Not Found</h1>
                <p className="text-muted-foreground">The requested certificate could not be loaded.</p>
            </div>
        )
    }

    return (
        <div className="bg-gray-200 print:bg-white">
            <div className="fixed top-4 right-4 z-50 no-print">
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Certificate
                </Button>
            </div>
            <main className="flex justify-center items-start min-h-screen p-8 print:p-0">
                <div className="print-container bg-white shadow-lg print:shadow-none">
                     <CertificateLayout
                        studentName={studentData.name_on_certificate}
                        studentIndex={studentData.username}
                        courseName={courseData.course_name}
                        issueDate={certData.print_date}
                        certificateId={certData.certificate_id}
                     />
                </div>
            </main>
        </div>
    );
}
