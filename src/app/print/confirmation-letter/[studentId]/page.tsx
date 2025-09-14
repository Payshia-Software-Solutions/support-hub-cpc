
"use client";

import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// --- Type Definitions ---
interface StudentInfo {
    id: string;
    student_id: string;
    full_name: string;
    nic: string;
}

// --- Letter Component ---
const ConfirmationLetter = ({ student }: { student: StudentInfo }) => {
    return (
        <div 
            className="bg-white text-black font-serif w-[210mm] min-h-[297mm] relative"
            style={{
                backgroundImage: `url('https://content-provider.pharmacollege.lk/site-images/lettter_page-0001.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            <div className="absolute top-[200px] left-[100px] right-[100px]">
                <div className="flex justify-between items-start mb-16">
                    <div></div>
                    <div className="text-right">
                        <p className="font-semibold">{format(new Date(), 'MMMM dd, yyyy')}</p>
                    </div>
                </div>

                <div className="mt-16">
                    <h2 className="text-lg font-bold underline text-center">TO WHOM IT MAY CONCERN</h2>
                </div>

                <div className="mt-12 text-base leading-loose">
                    <p>This is to certify that <strong className="font-bold">{student.full_name}</strong>, holding National Identity Card number <strong className="font-bold">{student.nic}</strong>, is a registered student at Ceylon Pharma College.</p>
                    <br />
                    <p>The student's registration number is <strong className="font-bold">{student.student_id.replace(/\//g, '')}</strong>.</p>
                    <br />
                    <p>This letter is issued upon the request of the student for whatever purpose it may serve.</p>
                    <br />
                    <p>Yours faithfully,</p>
                </div>

                <div className="mt-24">
                    <p className="font-semibold">_________________________</p>
                    <p className="font-bold">Director,</p>
                    <p>Ceylon Pharma College</p>
                </div>
            </div>
        </div>
    );
};


// --- Main Page Component ---
export default function PrintConfirmationLetterPage() {
    const params = useParams();
    const studentId = params.studentId as string;

    const { data: studentData, isLoading, isError } = useQuery<{ studentInfo: StudentInfo }>({
        queryKey: ['studentInfoForLetter', studentId],
        queryFn: async () => {
             const response = await fetch(`https://qa-api.pharmacollege.lk/get-student-full-info?loggedUser=${studentId.trim().toUpperCase()}`);
             if (!response.ok) {
                throw new Error('Student not found');
             }
             return response.json();
        },
        enabled: !!studentId,
    });
    
    useEffect(() => {
        if (!isLoading && studentData) {
            document.title = `Confirmation Letter - ${studentData.studentInfo.student_id}`;
            // Automatically trigger print dialog
            const timeout = setTimeout(() => window.print(), 1000);
            return () => clearTimeout(timeout);
        }
    }, [isLoading, studentData]);


    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200 p-8">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Loading Confirmation Letter...</p>
                 <div className="w-[210mm] h-[297mm] bg-white shadow-lg mt-8">
                    <Skeleton className="w-full h-full" />
                </div>
            </div>
        );
    }
    
    if (isError || !studentData?.studentInfo) {
        return (
             <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200 p-8">
                <h1 className="text-2xl font-bold text-destructive">Student Not Found</h1>
                <p className="text-muted-foreground">The student ID might be invalid or there was an error.</p>
            </div>
        )
    }

    return (
        <div className="bg-gray-200 print:bg-white">
            <div className="fixed top-4 right-4 z-50 no-print">
                <Button onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Letter
                </Button>
            </div>
            <main className="flex justify-center items-start min-h-screen p-8 print:p-0">
                <div className="print-container bg-white shadow-lg print:shadow-none">
                     <ConfirmationLetter student={studentData.studentInfo} />
                </div>
            </main>
        </div>
    );
}
