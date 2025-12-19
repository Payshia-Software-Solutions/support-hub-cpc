
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Loader2, ArrowLeft, ArrowRight, Banknote, ShieldCheck, FileText, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Link from 'next/link';

const STEPS = [
  { id: 1, title: 'Payment', icon: Banknote },
  { id: 2, title: 'Bank Details', icon: ShieldCheck },
  { id: 3, title: 'Review', icon: FileText },
];

export default function PaymentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const registrationId = searchParams.get('registrationId');
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedBank, setSelectedBank] = useState<string | null>(null);

    const handleNextStep = () => setCurrentStep(prev => prev + 1);
    const handlePrevStep = () => setCurrentStep(prev => prev - 1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Mock submission
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSubmitting(false);
        setCurrentStep(prev => prev + 1);
        toast({ title: "Payment Slip Submitted!", description: "Your payment is being verified." });
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="ref-number">Reference Number</Label>
                            <Input id="ref-number" value={registrationId || ''} readOnly />
                            <p className="text-xs text-muted-foreground">This is your unique registration ID. Use it for bank payments.</p>
                        </div>
                         <div className="space-y-2">
                            <Label>Payment Type</Label>
                            <RadioGroup defaultValue="registration" className="grid grid-cols-2 gap-4">
                                <div>
                                    <RadioGroupItem value="registration" id="r1" className="peer sr-only" />
                                    <Label htmlFor="r1" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                        Registration Fee
                                    </Label>
                                </div>
                                <div>
                                    <RadioGroupItem value="course" id="r2" className="peer sr-only" />
                                    <Label htmlFor="r2" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                        Course Fee
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>
                );
            case 2:
                return (
                     <div className="space-y-4">
                        <p className="text-sm text-center text-muted-foreground">Select the bank you made the payment to and upload the payment slip.</p>
                        <RadioGroup value={selectedBank || ''} onValueChange={setSelectedBank} className="space-y-2">
                            <Label htmlFor="boc" className="flex items-center gap-4 p-4 border rounded-md cursor-pointer hover:bg-accent/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                                <RadioGroupItem value="boc" id="boc" />
                                <div>
                                    <p className="font-medium">Bank of Ceylon</p>
                                    <p className="text-xs text-muted-foreground">Acc: 12345678</p>
                                </div>
                            </Label>
                             <Label htmlFor="sampath" className="flex items-center gap-4 p-4 border rounded-md cursor-pointer hover:bg-accent/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                                <RadioGroupItem value="sampath" id="sampath" />
                                <div>
                                    <p className="font-medium">Sampath Bank</p>
                                    <p className="text-xs text-muted-foreground">Acc: 87654321</p>
                                </div>
                            </Label>
                        </RadioGroup>
                        <div className="space-y-2 pt-4 border-t">
                            <Label htmlFor="payment-slip">Upload Payment Slip</Label>
                            <Input id="payment-slip" type="file" />
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="text-center p-4">
                        <p className="text-muted-foreground">You have selected <span className="font-semibold text-primary">{selectedBank?.toUpperCase()}</span>. Click submit to finalize your payment submission.</p>
                    </div>
                );
            case 4:
                return (
                     <div className="text-center p-8 flex flex-col items-center gap-4">
                        <Check className="w-16 h-16 bg-green-100 text-green-600 p-2 rounded-full"/>
                        <h2 className="text-2xl font-bold">Submission Complete!</h2>
                        <p className="text-muted-foreground">Your payment slip has been submitted and is now under review. You will be notified once it's approved.</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-background">
            <Card className="w-full max-w-lg shadow-2xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-headline">Student Payment Portal</CardTitle>
                    <CardDescription>Follow the steps below to confirm your payment.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        {renderStepContent()}
                    </form>
                </CardContent>
                <CardFooter className="flex items-center gap-2 pt-8">
                     {currentStep <= STEPS.length ? (
                        <>
                            {currentStep > 1 && (
                                <Button type="button" variant="outline" onClick={handlePrevStep} disabled={isSubmitting}>
                                    <ArrowLeft className="mr-2 h-4 w-4"/> Back
                                </Button>
                            )}
                            {currentStep < STEPS.length && (
                                <Button type="button" onClick={handleNextStep} className="flex-grow">
                                    Next <ArrowRight className="ml-2 h-4 w-4"/>
                                </Button>
                            )}
                            {currentStep === STEPS.length && (
                                <Button type="submit" form="payment-form" disabled={isSubmitting} onClick={handleSubmit} className="flex-grow">
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                    {isSubmitting ? 'Submitting...' : 'Submit Payment Slip'}
                                </Button>
                            )}
                        </>
                    ) : (
                         <Link href="/login" className="w-full"><Button className="w-full">Finish & Go to Login</Button></Link>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
