
"use client";

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getStudentDetailsByUsername } from '@/lib/actions/users';
import { getBatchByCode, getParentCourseById } from '@/lib/actions/courses';
import { getCertificatePrintStatusById } from '@/lib/actions/certificates';
import type { UserFullDetails, ParentCourse, UserCertificatePrintStatus, ApiCourse } from '@/lib/types';
import { CertificateLayout } from '@/components/print/CertificateLayout';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';


export default function PrintCertificatePage() {
    const params = useParams();
    const certificateId = params.id as string;

    // Step 1: Fetch the core certificate data first.
    const { data: certData, isLoading: isLoadingCert, isError: isErrorCert } = useQuery<UserCertificatePrintStatus | null>({
        queryKey: ['certificateData', certificateId],
        queryFn: () => getCertificatePrintStatusById(certificateId),
        enabled: !!certificateId,
        retry: false, // Don't retry if the certificate is not found
    });

    // Step 2: Fetch student details only if certData is available.
    const { data: studentData, isLoading: isLoadingStudent } = useQuery<UserFullDetails>({
        queryKey: ['studentDetailsForCert', certData?.student_number],
        queryFn: () => getStudentDetailsByUsername(certData!.student_number),
        enabled: !!certData?.student_number,
    });
    
    // Step 3: Fetch batch details only if certData is available.
    const { data: batchData, isLoading: isLoadingBatch } = useQuery<ApiCourse>({
        queryKey: ['batchDataForCert', certData?.course_code],
        queryFn: () => getBatchByCode(certData!.course_code),
        enabled: !!certData?.course_code,
    });

    // Step 4: Fetch parent course details only if batchData is available.
    const { data: courseData, isLoading: isLoadingCourse } = useQuery<ParentCourse>({
        queryKey: ['parentCourseDataForCert', batchData?.parent_course_id],
        queryFn: () => getParentCourseById(batchData!.parent_course_id),
        enabled: !!batchData?.parent_course_id,
    });
    
    useEffect(() => {
        if (!isLoadingCert && certData) {
            document.title = `Certificate - ${certData.student_number}`;
        }
    }, [isLoadingCert, certData]);

    const handlePrint = () => {
        window.print();
    };

    // Show a full-screen loader only for the initial certificate data fetch.
    if (isLoadingCert) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200 p-8">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Loading Certificate Data...</p>
                 <div className="w-[210mm] h-[297mm] bg-white shadow-lg mt-8">
                    <Skeleton className="w-full h-full" />
                </div>
            </div>
        );
    }
    
    // Show an error if the initial certificate data fails to load.
    if (isErrorCert || !certData) {
        return (
             <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200 p-8">
                <h1 className="text-2xl font-bold text-destructive">Certificate Not Found</h1>
                <p className="text-muted-foreground">The certificate ID might be invalid or there was an error.</p>
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
                        studentName={studentData?.name_on_certificate || 'Loading Student...'}
                        studentIndex={certData.student_number}
                        courseName={courseData?.course_name || 'Loading Course...'}
                        issueDate={certData.print_date}
                        certificateId={certData.certificate_id}
                        courseData={courseData}
                     />
                </div>
            </main>
        </div>
    );
}

