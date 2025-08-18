
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getStudentDetailsByUsername } from '@/lib/actions/users';
import { getParentCourse } from '@/lib/actions/courses';
import type { UserFullDetails, ParentCourse } from '@/lib/types';
import { CertificateLayout } from '@/components/print/CertificateLayout';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Simplified type for the certificate data fetched from an imaginary endpoint
interface CertificateData {
    id: string;
    student_number: string;
    course_id: string;
    issue_date: string;
}


// --- Mock function to get certificate data ---
// In a real app, this would be an API call to your backend,
// likely using the certificate ID from the URL params.
const getCertificateData = async (certId: string): Promise<CertificateData | null> => {
    console.log("Fetching certificate data for ID:", certId);
    // This is a placeholder. You'd replace this with a real fetch call.
    // The data might include student number, course ID, issue date, etc.
    if (certId.startsWith('AC-')) { // Example logic for Advanced Certificates
        return {
            id: certId,
            student_number: 'PA15002', // Dummy data
            course_id: '1', // Dummy data, maps to "Certificate Course in Pharmacy Practice"
            issue_date: '2024-08-01'
        };
    }
     if (certId.startsWith('C-')) { // Example logic for Certificates
         return {
            id: certId,
            student_number: 'PA16642', // Dummy data
            course_id: '2', // Dummy data, maps to "Advanced Certificate in Pharmacy Practice"
            issue_date: '2024-07-25'
        };
    }
    return null; // Return null if not found or on error
};


export default function PrintCertificatePage() {
    const params = useParams();
    const certificateId = params.id as string;

    const { data: certData, isLoading: isLoadingCert } = useQuery<CertificateData | null>({
        queryKey: ['certificateData', certificateId],
        queryFn: () => getCertificateData(certificateId),
        enabled: !!certificateId,
    });

    const { data: studentData, isLoading: isLoadingStudent } = useQuery<UserFullDetails>({
        queryKey: ['studentDetailsForCert', certData?.student_number],
        queryFn: () => getStudentDetailsByUsername(certData!.student_number),
        enabled: !!certData?.student_number,
    });
    
    const { data: courseData, isLoading: isLoadingCourse } = useQuery<ParentCourse>({
        queryKey: ['courseDetailsForCert', certData?.course_id],
        queryFn: () => getParentCourse(certData!.course_id),
        enabled: !!certData?.course_id,
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
                        courseName={courseData.course_name}
                        issueDate={certData.issue_date}
                        certificateId={certData.id}
                     />
                </div>
            </main>
        </div>
    );
}

