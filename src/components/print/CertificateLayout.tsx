
"use client";

import Image from 'next/image';
import { format } from 'date-fns';

interface CertificateLayoutProps {
  studentName: string;
  studentIndex: string;
  courseName: string;
  issueDate: string;
  certificateId: string;
}

export const CertificateLayout = ({ studentName, studentIndex, courseName, issueDate, certificateId }: CertificateLayoutProps) => {
  const qrCodeUrl = `https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=${encodeURIComponent(`ID: ${certificateId} | Name: ${studentName}`)}`;

  return (
    <div className="relative w-[210mm] h-[297mm] bg-white p-16 flex flex-col font-sans text-black">

      {/* Main content */}
      <div className="relative z-10 flex flex-col h-full items-center justify-center text-center">

        <h1 className="text-2xl font-bold tracking-widest text-gray-800">
          CERTIFICATE OF COMPLETION
        </h1>

        <p className="text-base text-gray-600 mt-12">
          This certificate is awarded to
        </p>

        <h2 className="text-4xl font-bold my-4 text-gray-900">
          {studentName}
        </h2>

        <p className="text-base text-gray-600">
          in recognition of the <br /> successful completion of the
        </p>
        
        <h3 className="text-2xl font-bold text-gray-800 mt-6">
          {courseName}
        </h3>
        
        <p className="text-base font-semibold text-gray-600 mt-4">
          offered by
        </p>

        <h4 className="text-2xl font-bold text-gray-900">
            Ceylon Pharma College
        </h4>
        
        <p className="text-base text-gray-600 mt-6">
            The certificate award ceremony was held at the<br/>BMICH, Colombo, Sri Lanka.
        </p>

        {/* Footer section at the bottom */}
        <div className="absolute bottom-16 left-16 right-16 flex justify-between items-end">
            <div className="flex items-end gap-4">
                <Image
                    src={qrCodeUrl}
                    alt="Certificate QR Code"
                    width={80}
                    height={80}
                    data-ai-hint="qr code"
                />
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
