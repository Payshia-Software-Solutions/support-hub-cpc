
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
    <div className={cn("relative w-[210mm] h-[297mm] bg-white text-black", roboto.className)}
      style={{
        backgroundImage: `url('https://storage.googleapis.com/project-isaac-ai/ask-studio/v2-b1-180724/cert.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Main content overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-16">

        {/* This div will hold the vertically centered content */}
        <div className="w-full max-w-lg">
          <h1 className="text-2xl font-bold tracking-widest text-gray-800">
            CERTIFICATE OF PARTICIPATION
          </h1>

          <p className="text-base text-gray-600 mt-12">
            This certificate is awarded to
          </p>

          <h2 className="text-4xl font-bold my-4 text-gray-900">
            {studentName}
          </h2>

          <p className="text-base text-gray-600">
            in recognition of the successful participation in the 06 days 
            <br />
            English program
          </p>
          
          <p className="text-base text-gray-600 mt-6">
              conducted by
          </p>

          <h4 className="text-2xl font-bold text-gray-900 mt-2">
              Ceylon Pharma College
          </h4>
        </div>

        {/* Footer section at the bottom, positioned independently */}
        <div className="absolute bottom-16 left-16 right-16 flex justify-between items-end">
          <div className="flex items-end gap-4">
              {qrCodeUrl && (
                <Image
                    src={qrCodeUrl}
                    alt="Certificate QR Code"
                    width={80}
                    height={80}
                    data-ai-hint="qr code"
                />
              )}
              <div className="text-left text-xs font-mono text-gray-700">
                  <p>Date: {format(new Date(issueDate), 'MMMM d, yyyy')}</p>
                  <p>Index Number: {studentIndex}</p>
                  <p>Certificate ID: {certificateId}</p>
              </div>
          </div>
          <div className="text-xs font-mono text-gray-700">
              <p>PV00253555</p>
          </div>
        </div>
      </div>
    </div>
  );
};
