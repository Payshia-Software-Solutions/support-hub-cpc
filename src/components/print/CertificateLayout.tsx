
"use client";

import Image from 'next/image';
import { format } from 'date-fns';
import { Roboto } from 'next/font/google';
import { cn } from '@/lib/utils';
import type { ParentCourse } from '@/lib/types';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
});


interface CertificateLayoutProps {
  studentName: string;
  studentIndex: string;
  courseName: string;
  issueDate: string;
  certificateId: string;
  courseData?: ParentCourse;
}

export const CertificateLayout = ({ studentName, studentIndex, courseName, issueDate, certificateId, courseData }: CertificateLayoutProps) => {
  const qrCodeUrl = (courseData?.course_code && studentIndex)
    ? `https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=${encodeURIComponent(`https://pharmacollege.lk/result-view.php?CourseCode=${courseData.course_code}&LoggedUser=${studentIndex}`)}`
    : '';

  return (
    <div className={cn("relative w-[297mm] h-[210mm] bg-white text-black", roboto.className)}
      style={{
        backgroundImage: `url('https://content-provider.pharmacollege.lk/certificates/certificate-bg.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Main content overlay */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-16">

        {/* Body section */}
        <div className="w-full flex-grow flex flex-col justify-center items-start text-left ml-8 max-w-xl">
          <p className="text-2xl text-gray-700 tracking-wider">CERTIFICATE OF PARTICIPATION</p>
          <p className="text-lg text-gray-600 mt-8">This certificate is awarded to</p>
          <h1 className="text-5xl font-bold my-4 text-gray-900 leading-tight">
            L. R. Hasintha Menaka Kumara
          </h1>
          <p className="text-lg text-gray-600 max-w-lg">
            in recognition of the successful participation in the 06 days English program
          </p>
          <p className="text-lg text-gray-600 max-w-lg mt-4">
            conducted by
          </p>
          <h2 className="text-3xl font-bold my-2 text-primary">
            Ceylon Pharma College
          </h2>
        </div>

        {/* Footer section */}
        <div className="w-full flex justify-between items-end ml-8">
          <div className="text-left">
            {qrCodeUrl ? (
                <Image src={qrCodeUrl} alt="QR Code" width={80} height={80} />
            ) : (
                <div className="w-[80px] h-[80px] bg-gray-200 animate-pulse rounded-md"></div>
            )}
            <p className="text-xs text-gray-500 mt-1">Certificate ID: {certificateId}</p>
          </div>

          <div className="text-center">
            <div className="relative h-16 w-48">
              <Image src="https://content-provider.pharmacollege.lk/certificates/hansi-sign-1.png" alt="Instructor Signature" layout="fill" objectFit="contain"/>
            </div>
            <div className="border-t border-gray-600 w-48 mt-1"></div>
            <p className="text-sm font-semibold mt-1">Academic Instructor</p>
          </div>
          
          <div className="text-center">
             <div className="h-16 w-48"></div>
             <div className="border-t border-gray-600 w-48 mt-1"></div>
            <p className="text-sm font-semibold mt-1">Date</p>
            <p className="text-xs text-gray-600">{format(new Date(issueDate), 'MMMM d, yyyy')}</p>
          </div>

           <div className="w-1/4"></div>
        </div>
      </div>
    </div>
  );
};
