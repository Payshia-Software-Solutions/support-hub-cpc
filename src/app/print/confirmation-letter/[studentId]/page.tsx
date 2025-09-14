"use client";

import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Roboto } from 'next/font/google';
import { cn } from '@/lib/utils';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
});

// --- Type Definitions ---
interface StudentInfo {
    id: string;
    student_id: string;
    full_name: string;
    nic: string;
    gender: 'Male' | 'Female' | string;
}

const getGenderTitle = (gender: string) => {
    if (gender === 'Male') return 'Mr.';
    if (gender === 'Female') return 'Miss';
    return ''; // Default if gender is not specified or other
}


// --- Letter Component ---
const ConfirmationLetter = ({ student }: { student: StudentInfo }) => {
    const studentTitle = getGenderTitle(student.gender);
    return (
        <div 
            className={cn("bg-white text-black w-[210mm] h-[297mm] relative", roboto.className)}
            style={{
                backgroundImage: `url('https://content-provider.pharmacollege.lk/site-images/lettter_page-0001.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            <div className="absolute top-[250px] left-[50px] right-[50px]">
                <div className="flex justify-between items-start mb-12">
                    <div></div>
                    <div className="text-right">
                        <p className="font-semibold">{format(new Date(), 'MMMM dd, yyyy')}</p>
                    </div>
                </div>

                <div className="mt-6">
                    <p className="mb-4">To whom it may concern,</p>
                    <h2 className="text-lg font-bold underline text-center mb-6">Confirmation of Studentship</h2>
                </div>

                <div className="text-base leading-relaxed space-y-4 text-justify">
                    <p>This is to formally certify that <strong className="font-bold">{studentTitle} {student.full_name}</strong>, holder of National Identity Card (NIC) number <strong className="font-bold">{student.nic}</strong> and student number <strong className="font-bold">{student.student_id.replace(/\//g, '')}</strong>, is a duly registered student of Ceylon Pharma College.</p>
                    
                    <p>{studentTitle} {student.full_name.split(' ')[0]} has successfully completed the Certificate Course in Pharmacy Practice offered by our institution. She remains an active student and is entitled to all the rights and privileges associated with her studentship at Ceylon Pharma College.</p>

                    <p>This letter serves as official confirmation of {studentTitle} {student.full_name.split(' ')[0]}’s enrollment and academic status. It may be presented as valid proof for interviews, examinations, and other official purposes during her tenure with us.</p>
                    
                    <p>Should you require any additional information or clarification, please feel free to contact us via email at info@pharmacollege.lk.</p>
                </div>

                <div className="mt-6">
                    <p>Yours faithfully,</p>
                    <p>Sincerely,</p>
                </div>

                <div className="mt-2">
                     <div className="relative h-16 w-48">
                        <Image src="https://content-provider.pharmacollege.lk/certificates/sign.png" alt="Director Signature" layout="fill" objectFit="contain"/>
                    </div>
                    <p className="font-semibold">_________________________</p>
                    <p className="font-bold">Dilip Fonseka,</p>
                    <p>Course Director,</p>
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
        <>
            <style jsx global>{`
                @media print {
                  @page {
                    size: A4 portrait;
                    margin: 0;
                  }
                  body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }
                  .no-print {
                    display: none;
                  }
                  .print-container {
                    width: 210mm;
                    height: 297mm;
                    margin: 0;
                    padding: 0;
                    box-shadow: none;
                    border: none;
                  }
                }
            `}</style>
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
        </>
    );
}
