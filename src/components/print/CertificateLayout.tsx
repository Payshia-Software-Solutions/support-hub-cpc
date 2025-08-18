
"use client";

import Image from 'next/image';
import { format } from 'date-fns';

interface CertificateLayoutProps {
  studentName: string;
  courseName: string;
  issueDate: string;
  certificateId: string;
}

export const CertificateLayout = ({ studentName, courseName, issueDate, certificateId }: CertificateLayoutProps) => {
  return (
    <div className="relative w-[210mm] h-[297mm] bg-white p-12 flex flex-col text-black font-serif">
      {/* Background watermark */}
      <div className="absolute inset-0 flex items-center justify-center z-0">
        <Image
          src="https://content-provider.pharmacollege.lk/app-icon/android-chrome-192x192.png"
          alt="Logo Watermark"
          width={400}
          height={400}
          className="opacity-5"
          data-ai-hint="logo"
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <header className="text-center mb-12">
            <Image
                src="https://content-provider.pharmacollege.lk/app-icon/android-chrome-192x192.png"
                alt="Ceylon Pharma College Logo"
                width={80}
                height={80}
                className="mx-auto mb-4"
                data-ai-hint="logo"
            />
          <h1 className="text-4xl font-bold tracking-wider text-blue-900">Ceylon Pharma College</h1>
          <p className="text-lg text-gray-600 mt-2">SRI LANKA</p>
        </header>

        {/* Certificate Title */}
        <div className="text-center my-8">
          <p className="text-xl tracking-widest text-gray-700">This is to certify that</p>
          <h2 className="text-5xl font-bold my-6 px-4 py-2 border-y-2 border-blue-800 inline-block">
            {studentName}
          </h2>
          <p className="text-xl text-gray-700">
            has successfully completed the
          </p>
          <h3 className="text-3xl font-semibold text-blue-800 mt-4">
            {courseName}
          </h3>
        </div>

        {/* Body */}
        <div className="flex-grow text-center text-gray-600 text-lg leading-relaxed">
          <p>
            This course was conducted by the Ceylon Pharma College, fulfilling all the
            requirements as prescribed by the academic board. The recipient has demonstrated
            the necessary skills and knowledge in the field.
          </p>
        </div>

        {/* Footer & Signatures */}
        <footer className="mt-16">
          <div className="flex justify-between items-end">
            <div className="text-center">
              <div className="w-48 h-0.5 bg-gray-700 mx-auto"></div>
              <p className="text-sm font-semibold mt-2">DIRECTOR</p>
            </div>
            <div className="text-center">
                <p className="text-xs text-gray-500">Issued On</p>
                <p className="font-semibold">{format(new Date(issueDate), 'MMMM do, yyyy')}</p>
            </div>
            <div className="text-center">
              <div className="w-48 h-0.5 bg-gray-700 mx-auto"></div>
              <p className="text-sm font-semibold mt-2">HEAD OF ACADEMICS</p>
            </div>
          </div>
           <p className="text-center text-xs text-gray-400 mt-8">
            Certificate ID: {certificateId}
          </p>
        </footer>
      </div>
    </div>
  );
};
