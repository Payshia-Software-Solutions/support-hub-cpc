
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

  return (
    <div className={cn("relative w-[297mm] h-[210mm] bg-white text-black", roboto.className)}
      style={{
        backgroundImage: `url('https://content-provider.pharmacollege.lk/certificates/certificate-bg-english.png')`,
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
        <div className="w-full flex justify-start items-end ml-8 gap-12">
           <div className="text-center">
            <div className="relative h-16 w-48">
              <Image src="https://content-provider.pharmacollege.lk/certificates/hansi-sign-1.png" alt="Academic Instructor Signature" layout="fill" objectFit="contain"/>
            </div>
            <div className="border-t border-gray-600 w-48 mt-1"></div>
            <p className="text-sm font-semibold mt-1">Academic Instructor</p>
          </div>
          
           <div className="text-center">
            <div className="relative h-16 w-48">
              <Image src="https://content-provider.pharmacollege.lk/certificates/sign.png" alt="Director Signature" layout="fill" objectFit="contain"/>
            </div>
            <div className="border-t border-gray-600 w-48 mt-1"></div>
            <p className="text-sm font-semibold mt-1">Director</p>
          </div>

          <div className="text-center">
            <div className="h-16 w-48 flex items-center justify-center">
              <p className="text-sm text-gray-600">{format(new Date(issueDate), 'MMMM d, yyyy')}</p>
            </div>
            <div className="border-t border-gray-600 w-48 mt-1"></div>
            <p className="text-sm font-semibold mt-1">Date</p>
          </div>
        </div>
      </div>
    </div>
  );
};
