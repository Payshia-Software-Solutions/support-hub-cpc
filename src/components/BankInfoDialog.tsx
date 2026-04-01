'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info, Landmark, Copy, Check } from 'lucide-react';
import Image from 'next/image';

interface BankInfoDialogProps {
    variant?: 'default' | 'floating';
}

export function BankInfoDialog({ variant = 'default' }: BankInfoDialogProps = {}) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
      navigator.clipboard.writeText(text);
      setCopiedItem(label);
      setTimeout(() => setCopiedItem(null), 2000);
  };

  const CopyableRow = ({ label, value }: { label: string, value: string }) => (
      <div className="flex justify-between items-center border-b pb-1 last:border-0 last:pb-0">
          <span className="text-muted-foreground leading-none">{label}</span>
          <div className="flex items-center gap-2">
              <span className="font-medium text-right leading-none">{value}</span>
              <button 
                  onClick={() => handleCopy(value, label)}
                  className="text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring rounded-sm"
                  aria-label={`Copy ${label}`}
                  type="button"
              >
                  {copiedItem === label ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
          </div>
      </div>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {variant === 'floating' ? (

            <Button 
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-50 p-0 hover:scale-105 transition-transform" 
                title="View Bank Info"
            >
                <Landmark className="h-6 w-6" />
                <span className="sr-only">View Bank Info</span>
            </Button>
        ) : (
            <Button variant="outline" type="button" className="w-full">
                <Info className="mr-2 h-4 w-4" /> View Bank Info
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bank Information</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
            <div className="text-sm space-y-3 pt-2">
                <CopyableRow label="Account Name" value="Ceylon Pharma College Pvt Ltd" />
                <CopyableRow label="Bank Name" value="Bank Of Ceylon" />
                <CopyableRow label="Account Number" value="89090906" />
                <CopyableRow label="Branch" value="Pelmadulla Branch" />
            </div>
            <div className="mt-4 border rounded-md overflow-hidden bg-muted">
                {/* Ensure the image scales properly within the dialog */}
                <Image 
                    src="/assets/images/bank-info-cpc.jpeg" 
                    alt="Bank Info" 
                    width={800} 
                    height={800} 
                    className="w-full h-auto object-contain" 
                />
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
