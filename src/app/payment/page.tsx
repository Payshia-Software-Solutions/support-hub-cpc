
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, ArrowLeft, ArrowRight, Banknote, ShieldCheck, FileText, Check, User, AlertTriangle, Search, Check as CheckIcon, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getPaymentRequestsByReference } from '@/lib/api';
import type { PaymentRequest } from '@/lib/types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { BankInfoDialog } from '@/components/BankInfoDialog';

const CONTENT_PROVIDER_URL = process.env.NEXT_PUBLIC_CONTENT_PROVIDER_URL || 'https://content-provider.pharmacollege.lk';


const STEPS = [
  { id: 1, title: 'Student Info', icon: User },
  { id: 2, title: 'Payment Details', icon: Banknote },
  { id: 3, title: 'Review', icon: FileText },
];

interface TempUser {
    id: string;
    full_name: string;
    email_address: string;
    phone_number: string;
    nic_number: string;
}

interface Bank {
    id: string;
    bank_code: string;
    bank_name: string;
}

const maskEmail = (email: string) => {
    if (!email) return '';
    const [user, domain] = email.split('@');
    if (user.length <= 2) return `${user.substring(0, 1)}***@${domain}`;
    return `${user.substring(0, 2)}***${user.substring(user.length - 1)}@${domain}`;
};

const maskPhone = (phone: string) => {
    if (!phone || phone.length <= 4) return '****';
    return `******${phone.substring(phone.length - 4)}`;
};

const maskNic = (nic: string) => {
    if (!nic || nic.length <= 4) return '****';
    return `${nic.substring(0, 4)}***${nic.substring(nic.length - 4)}`;
};

const ViewSlipDialog = ({ slipPath, isOpen, onOpenChange }: { slipPath: string | null; isOpen: boolean; onOpenChange: (open: boolean) => void }) => {
    if (!isOpen || !slipPath) return null;
    const fullSlipUrl = `${CONTENT_PROVIDER_URL}${slipPath}`;
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(slipPath);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Payment Slip</DialogTitle></DialogHeader>
                <div className="mt-4 max-h-[70vh] overflow-auto border rounded-lg p-2 bg-muted">
                    {isImage ? (
                        <Image src={fullSlipUrl} alt="Payment Slip" width={800} height={1200} className="w-full h-auto object-contain" />
                    ) : (
                        <div className="flex items-center justify-center p-8"><a href={fullSlipUrl} target="_blank" rel="noopener noreferrer"><Button>Open Slip</Button></a></div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};


export default function PaymentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const registrationIdQuery = searchParams.get('registrationId');
    
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [registrationId, setRegistrationId] = useState(registrationIdQuery || '');
    const [tempUser, setTempUser] = useState<TempUser | null>(null);
    const [isLoadingUser, setIsLoadingUser] = useState(false);
    const [userError, setUserError] = useState<string | null>(null);

    const [paymentReason, setPaymentReason] = useState('Course Fee'); // Hardcoded
    const [amount, setAmount] = useState('15000');
    const [selectedBank, setSelectedBank] = useState<string | null>(null);
    const [branch, setBranch] = useState('');
    const [paymentSlip, setPaymentSlip] = useState<File | null>(null);
    
    const [previousPayments, setPreviousPayments] = useState<PaymentRequest[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [viewingSlipPath, setViewingSlipPath] = useState<string | null>(null);

    const { data: banks, isLoading: isLoadingBanks } = useQuery<Bank[]>({
        queryKey: ['banks'],
        queryFn: async () => {
            const response = await fetch('https://qa-api.pharmacollege.lk/banks');
            if (!response.ok) {
                throw new Error('Failed to fetch banks');
            }
            return response.json();
        },
        staleTime: Infinity,
    });
    
    useEffect(() => {
        if (registrationId.trim()) {
            const handler = setTimeout(() => {
                setIsLoadingUser(true);
                setIsLoadingHistory(true);
                setUserError(null);
                setTempUser(null);
                setPreviousPayments([]);

                const fetchUserData = fetch(`https://qa-api.pharmacollege.lk/temp-users/${registrationId.trim()}`)
                    .then(res => {
                        if (!res.ok) {
                            throw new Error('Student not found for this reference number.');
                        }
                        return res.json();
                    })
                    .then((data: TempUser) => {
                        setTempUser(data);
                    });

                const fetchHistoryData = getPaymentRequestsByReference(registrationId.trim())
                    .then(data => {
                        setPreviousPayments(data);
                    });
                
                Promise.all([fetchUserData, fetchHistoryData])
                    .catch(err => {
                        setUserError(err.message);
                    })
                    .finally(() => {
                        setIsLoadingUser(false);
                        setIsLoadingHistory(false);
                    });

            }, 500);
            return () => clearTimeout(handler);
        } else {
             setTempUser(null);
             setUserError(null);
             setPreviousPayments([]);
        }
    }, [registrationId]);


    const handleNextStep = () => {
        if (currentStep === 1 && !tempUser) {
            toast({ variant: 'destructive', title: 'Invalid Reference', description: 'Please enter a valid reference number to continue.' });
            return;
        }
        if (currentStep === 2) {
            if (!amount) {
                 toast({ variant: 'destructive', title: 'Amount Required', description: 'Please enter the payment amount.' });
                return;
            }
             if (!selectedBank) {
                 toast({ variant: 'destructive', title: 'Bank Not Selected', description: 'Please select the bank you made the payment to.' });
                return;
            }
            if (!paymentSlip) {
                toast({ variant: 'destructive', title: 'Payment Slip Required', description: 'Please upload your payment slip.' });
                return;
            }
        }
        setCurrentStep(prev => prev + 1);
    }
    const handlePrevStep = () => setCurrentStep(prev => prev - 1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tempUser || !paymentReason || !amount || !selectedBank || !paymentSlip) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Cannot submit, some details are missing.' });
            return;
        }
        setIsSubmitting(true);

        const mapReasonToApiValue = (reason: string) => {
            if (reason === 'Course Fee') return 'course';
            return reason.toLowerCase().replace(' ', '_');
        }

        try {
            const formDataToSend = new FormData();
            formDataToSend.append("studentNumber", tempUser.id);
            formDataToSend.append("paymentReason", mapReasonToApiValue(paymentReason));
            formDataToSend.append("number_type", "ref_number");
            formDataToSend.append("amount", amount);
            formDataToSend.append("reference", tempUser.id);
            formDataToSend.append("bank", selectedBank);
            formDataToSend.append("branch", branch);
            formDataToSend.append("slip", paymentSlip); // File upload

            const response = await fetch(
                "https://qa-api.pharmacollege.lk/payment-portal-requests",
                {
                    method: "POST",
                    body: formDataToSend,
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Request failed with status ${response.status}`}));
                throw new Error(errorData.message || 'Submission failed');
            }

            toast({ title: "Payment Slip Submitted!", description: "Your payment is being verified." });
            setCurrentStep(prev => prev + 1);

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Submission Failed",
                description: error instanceof Error ? error.message : "An unknown error occurred.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPaymentSlip(e.target.files[0]);
        }
    };
    
    const BankSelector = () => {
        const [open, setOpen] = React.useState(false)

        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                        disabled={isLoadingBanks}
                    >
                        {isLoadingBanks ? "Loading banks..." : (
                            selectedBank ? banks?.find(bank => bank.id === selectedBank)?.bank_name : "Select a bank..."
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" side="bottom">
                    <Command>
                        <CommandInput placeholder="Search bank..." />
                        <CommandEmpty>No bank found.</CommandEmpty>
                         <ScrollArea className="max-h-60">
                            <CommandGroup>
                                {banks?.map((bank) => (
                                    <CommandItem
                                        key={bank.id}
                                        value={bank.bank_name}
                                        onSelect={() => {
                                            setSelectedBank(bank.id)
                                            setOpen(false)
                                        }}
                                    >
                                        <CheckIcon
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedBank === bank.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {bank.bank_name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </ScrollArea>
                    </Command>
                </PopoverContent>
            </Popover>
        )
    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="ref-number">Reference Number</Label>
                            <Input id="ref-number" value={registrationId} onChange={e => setRegistrationId(e.target.value)} />
                            <p className="text-xs text-muted-foreground">Please enter your registration reference number.</p>
                        </div>
                        {isLoadingUser && (
                            <div className="p-4 border rounded-lg space-y-4">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        )}
                        {userError && !isLoadingUser && (
                             <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{userError}</AlertDescription>
                            </Alert>
                        )}
                        {tempUser && !isLoadingUser && (
                           <>
                             <div className="p-4 border rounded-lg space-y-4 bg-green-50/50">
                                <h3 className="font-semibold text-lg">Student Information</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-muted-foreground">Reference Number</span><span className="font-medium">{tempUser.id}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Full Name</span><span className="font-medium">{tempUser.full_name}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Email Address</span><span className="font-medium">{maskEmail(tempUser.email_address)}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Phone Number</span><span className="font-medium">{maskPhone(tempUser.phone_number)}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">NIC Number</span><span className="font-medium">{maskNic(tempUser.nic_number)}</span></div>
                                </div>
                                <Alert variant="destructive" className="bg-yellow-100 border-yellow-200 text-yellow-800">
                                    <AlertTriangle className="h-4 w-4 !text-yellow-800" />
                                    <AlertDescription>
                                        Please verify that this information is correct. If you notice any discrepancies, contact student support immediately.
                                    </AlertDescription>
                                </Alert>
                            </div>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Submission History</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {isLoadingHistory ? <Skeleton className="h-20 w-full"/> : (
                                        previousPayments.length > 0 ? (
                                            <div className="space-y-2">
                                                {previousPayments.map(p => (
                                                    <div key={p.id} className="text-sm p-2 border rounded-md flex justify-between items-center">
                                                        <div>
                                                            <p><strong>Amount:</strong> LKR {p.paid_amount}</p>
                                                            <p className="text-xs text-muted-foreground">Submitted: {format(new Date(p.created_at), 'Pp')}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant={p.payment_status === 'Pending' ? 'destructive' : p.payment_status === 'Approved' ? 'default' : 'secondary'}>{p.payment_status}</Badge>
                                                            <Button size="sm" variant="outline" onClick={() => setViewingSlipPath(p.slip_path)}>View</Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <p className="text-sm text-muted-foreground text-center">No previous payments found.</p>
                                    )}
                                </CardContent>
                            </Card>
                           </>
                        )}
                    </div>
                );
            case 2:
                return (
                     <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="payment-reason">Payment Reason</Label>
                            <Input id="payment-reason" value="Course Fee" readOnly className="bg-muted"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input id="amount" value={amount} onChange={e => setAmount(e.target.value)} placeholder="LKR 15000" />
                        </div>
                        <div className="space-y-2">
                            <Label>Bank Name</Label>
                            <BankSelector />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="branch">Branch (Optional)</Label>
                            <Input id="branch" value={branch} onChange={e => setBranch(e.target.value)} placeholder="e.g. Colombo 07"/>
                        </div>
                        <div className="pt-2">
                            <BankInfoDialog />
                        </div>
                        <div className="space-y-2 pt-4 border-t">
                            <Label htmlFor="payment-slip">Upload Payment Slip</Label>
                            <Input id="payment-slip" type="file" onChange={handleFileChange} accept="image/*,application/pdf"/>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="text-center p-4">
                        <p className="text-muted-foreground">You have selected <span className="font-semibold text-primary">{banks?.find(b => b.id === selectedBank)?.bank_name || 'the selected bank'}</span>{branch && ` (${branch} branch)`}. Click submit to finalize your payment submission.</p>
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
        <>
        <ViewSlipDialog slipPath={viewingSlipPath} isOpen={!!viewingSlipPath} onOpenChange={(open) => !open && setViewingSlipPath(null)} />
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-100/50 dark:bg-gray-900/50 auth-background">
            <Card className="w-full max-w-lg shadow-2xl">
                <CardHeader className="text-center">
                     <Image src="https://content-provider.pharmacollege.lk/app-icon/android-chrome-192x192.png" alt="Ceylon Pharma College Logo" width={64} height={64} className="w-16 h-16 mx-auto mb-4" />
                    <CardTitle className="text-2xl font-headline">External Student Payment Portal</CardTitle>
                    {currentStep <= STEPS.length && (
                        <div className="flex items-start justify-center pt-8 pb-4">
                            <div className="flex w-full max-w-xs items-center justify-between">
                                {STEPS.map((step, index) => (
                                    <React.Fragment key={step.id}>
                                        <div className="flex flex-col items-center gap-2">
                                            <div
                                                className={cn(
                                                    'h-8 w-8 rounded-full flex items-center justify-center transition-colors border-2',
                                                    currentStep > step.id ? 'bg-primary border-primary text-white' : '',
                                                    currentStep === step.id ? 'bg-primary border-primary text-primary-foreground' : '',
                                                    currentStep < step.id ? 'bg-card text-muted-foreground border-border' : ''
                                                )}
                                            >
                                                {currentStep > step.id ? <Check className="h-5 w-5" /> : <span className="font-bold text-sm">{step.id}</span>}
                                            </div>
                                            <p className={cn(
                                                'text-xs text-center font-medium',
                                                currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'
                                            )}>
                                                {step.title}
                                            </p>
                                        </div>
                                        {index < STEPS.length - 1 && (
                                            <div className={cn(
                                                'flex-1 h-0.5 mb-6 transition-colors',
                                                currentStep > index + 1 ? 'bg-primary' : 'bg-border'
                                            )} />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        {renderStepContent()}
                    </form>
                </CardContent>
                <CardFooter className="flex-col items-stretch gap-4 pt-8">
                     {currentStep <= STEPS.length ? (
                        <>
                            <div className="flex items-center gap-2">
                                {currentStep > 1 && (
                                    <Button type="button" variant="outline" onClick={handlePrevStep} disabled={isSubmitting}>
                                        <ArrowLeft className="mr-2 h-4 w-4"/> Back
                                    </Button>
                                )}
                                {currentStep < STEPS.length && (
                                    <Button type="button" onClick={handleNextStep} className="flex-grow" disabled={currentStep === 1 && !tempUser}>
                                        Continue <ArrowRight className="ml-2 h-4 w-4"/>
                                    </Button>
                                )}
                                {currentStep === STEPS.length && (
                                    <Button type="submit" form="payment-form" disabled={isSubmitting} onClick={handleSubmit} className="flex-grow">
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                        {isSubmitting ? 'Submitting...' : 'Submit Payment Slip'}
                                    </Button>
                                )}
                            </div>
                            <div className="text-center text-sm text-muted-foreground w-full">
                                <p>
                                    Already have an account?{' '}
                                    <Link href="/login" className="text-primary font-semibold hover:underline">
                                        Log In
                                    </Link>
                                </p>
                            </div>
                        </>
                    ) : (
                         <div className="w-full flex flex-col sm:flex-row gap-2">
                            <Link href="/login" className="w-full"><Button className="w-full">Finish & Go to Login</Button></Link>
                        </div>
                    )}
                </CardFooter>
            </Card>
            <BankInfoDialog variant="floating" />
        </div>
        </>

    );
}
