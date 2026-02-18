"use client";

import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink } from 'lucide-react';

const CONTENT_PROVIDER_URL = process.env.NEXT_PUBLIC_CONTENT_PROVIDER_URL || 'https://content-provider.pharmacollege.lk';

export const ViewSlipDialog = ({ slipPath, studentName, trigger }: { slipPath: string | null; studentName: string; trigger: React.ReactNode }) => {
    if (!slipPath) return <Button variant="outline" size="sm" disabled>No Slip</Button>;

    const fullSlipUrl = `${CONTENT_PROVIDER_URL}${slipPath}`;
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(slipPath);

    return (
        <Dialog>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Payment Slip for {studentName}</DialogTitle>
                </DialogHeader>
                <div className="mt-4 max-h-[70vh] overflow-auto border rounded-lg p-2 bg-muted">
                    {isImage ? (
                        <div className="relative w-full aspect-[3/4]">
                            <Image src={fullSlipUrl} alt={`Payment Slip for ${studentName}`} layout="fill" objectFit="contain" data-ai-hint="payment slip" />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                            <FileText className="w-16 h-16 text-muted-foreground mb-4"/>
                            <p className="mb-4">This file is not an image. Open it in a new tab to view.</p>
                            <a href={fullSlipUrl} target="_blank" rel="noopener noreferrer"><Button>Open Slip</Button></a>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
