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
        backgroundImage: `url('https://content-provider.pharmacollege.lk/certificates/english-free-bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Main content overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-between p-16">

        {/* Header section */}
        <div className="w-full flex justify-start">
          {/* This part is in the background image now */}
        </div>

        {/* Body section */}
        <div className="w-full text-left pl-4">
           <h2 className="text-3xl font-bold mb-4 tracking-wider text-gray-800">
                CERTIFICATE OF PARTICIPATION
            </h2>
          <p className="text-lg text-gray-600">This certificate is awarded to</p>
          <h2 className="text-5xl font-bold my-4 text-gray-900 leading-tight">
            L. R. Hasintha Menaka Kumara
          </h2>
          <p className="text-lg text-gray-600">
            in recognition of the successful participation in the 06 days
          </p>
          <h3 className="text-3xl font-bold my-2 text-primary">
             English program 
          </h3>
           <p className="text-lg text-gray-600">
            conducted by
          </p>
          <h3 className="text-2xl font-semibold my-2 text-gray-800">
             Ceylon Pharma College
          </h3>
        </div>

        {/* Footer section */}
        <div className="w-full flex justify-between items-end pl-4">
           <div className="flex-1">
             {/* Intentionally empty for spacing */}
           </div>

          <div className="flex-1 text-left relative -bottom-4">
            <p className="text-xs font-mono text-gray-700">{format(new Date(issueDate), 'MMMM d, yyyy')}</p>
          </div>

           {qrCodeUrl && (
              <div className="flex items-end gap-2 text-left text-xs font-mono text-gray-700">
                <Image
                    src={qrCodeUrl}
                    alt="Certificate QR Code"
                    width={70}
                    height={70}
                    data-ai-hint="qr code"
                />
                <div>
                  <p>Index: {studentIndex}</p>
                  <p>Cert. ID: {certificateId}</p>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
