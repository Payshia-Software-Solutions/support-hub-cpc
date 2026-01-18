
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentFullInfo } from '@/lib/actions/users';
import { getConvocationCeremonies, getPackagesByCeremony, createConvocationRegistration } from '@/lib/actions/certificates';
import type { FullStudentData, StudentEnrollment, ConvocationCeremony, ConvocationPackage } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Loader2, AlertCircle, CheckCircle, GraduationCap, Upload, Users } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PARENT_SEAT_RATE = 500; // As defined in PHP code

type OrderStep = 'loading' | 'form' | 'confirmation' | 'success' | 'error';

export default function ConvocationBookingPage() {
    const { user, isImpersonating } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [step, setStep] = useState<OrderStep>('loading');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [referenceNumber, setReferenceNumber] = useState<string | null>(null);

    // Form State
    const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set());
    const [selectedPackageId, setSelectedPackageId] = useState<string>('');
    const [selectedSession, setSelectedSession] = useState<'1' | '2'>('1');
    const [additionalSeats, setAdditionalSeats] =useState('0');
    const [paymentSlip, setPaymentSlip] = useState<File | null>(null);
    const [nameOnCertificate, setNameOnCertificate] = useState('');
    const [phone, setPhone] = useState('');

    // --- Data Fetching ---
    const { data: studentData, isLoading: isLoadingStudent, isError, error } = useQuery<FullStudentData>({
        queryKey: ['studentFullInfoForConvocation', user?.username],
        queryFn: () => getStudentFullInfo(user!.username!),
        enabled: !!user?.username && (user.role === 'student' || isImpersonating),
        retry: 1,
    });

    const { data: activeCeremony, isLoading: isLoadingCeremony } = useQuery<ConvocationCeremony | null>({
        queryKey: ['activeConvocationCeremony'],
        queryFn: async () => {
            const ceremonies = await getConvocationCeremonies();
            return ceremonies.find(c => c.accept_booking === '1') || null;
        },
    });

    const { data: packages, isLoading: isLoadingPackages } = useQuery<ConvocationPackage[]>({
        queryKey: ['convocationPackages', activeCeremony?.id],
        queryFn: () => getPackagesByCeremony(activeCeremony!.id),
        enabled: !!activeCeremony,
    });

    const eligibleEnrollments = useMemo(() => {
        if (!studentData) return [];
        return Object.values(studentData.studentEnrollments).filter(e => e.certificate_eligibility);
    }, [studentData]);

    const selectedPackage = useMemo(() => {
        return packages?.find(p => p.package_id === selectedPackageId);
    }, [packages, selectedPackageId]);

    const totalPrice = useMemo(() => {
        if (!selectedPackage) return 0;
        const packagePrice = parseFloat(selectedPackage.price) || 0;
        const seatPrice = (parseInt(additionalSeats, 10) || 0) * PARENT_SEAT_RATE;
        return packagePrice + seatPrice;
    }, [selectedPackage, additionalSeats]);
    
     useEffect(() => {
        if(studentData && !nameOnCertificate) {
            setNameOnCertificate(studentData.studentInfo.name_on_certificate || studentData.studentInfo.full_name);
        }
        if(studentData && !phone) {
            setPhone(studentData.studentInfo.telephone_1);
        }
    }, [studentData, nameOnCertificate, phone]);
    
    useEffect(() => {
        const isLoading = isLoadingStudent || isLoadingCeremony;
        if (isLoading) {
            setStep('loading');
            return;
        }
        if (isError) {
            setErrorMessage(error.message);
            setStep('error');
            return;
        }
        if (!activeCeremony) {
            setErrorMessage('There are no active convocation ceremonies at the moment. Please check back later.');
            setStep('error');
            return;
        }
        if (eligibleEnrollments.length === 0) {
            setErrorMessage('You have no courses eligible for convocation booking at this time.');
            setStep('error');
            return;
        }

        // Pre-select all eligible courses by default
        setSelectedCourseIds(new Set(eligibleEnrollments.map(e => e.parent_course_id)));

        setStep('form');
    }, [isLoadingStudent, isLoadingCeremony, isError, studentData, activeCeremony, eligibleEnrollments, error]);

    const createBookingMutation = useMutation({
        mutationFn: (payload: FormData) => createConvocationRegistration(payload),
        onSuccess: (data) => {
            setReferenceNumber(data.reference_number || data.id);
            setStep('success');
            toast({ title: 'Booking Submitted!', description: 'Your convocation registration has been received.' });
        },
        onError: (err: Error) => {
            setErrorMessage(err.message || 'An unknown error occurred.');
            setStep('error');
        },
    });

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedCourseIds.size === 0) {
            toast({ variant: 'destructive', title: 'No Courses Selected', description: 'Please select at least one course.' }); return;
        }
        if (!selectedPackageId) {
            toast({ variant: 'destructive', title: 'No Package Selected', description: 'Please choose a package.' }); return;
        }
        if (!paymentSlip) {
             toast({ variant: 'destructive', title: 'Payment Slip Required', description: 'Please upload your payment slip.' }); return;
        }
        if (!nameOnCertificate || !phone) {
             toast({ variant: 'destructive', title: 'Missing Details', description: 'Please fill in your name and phone number.' }); return;
        }
        setStep('confirmation');
    };

    const handleConfirmAndSubmit = () => {
        if (!studentData || !activeCeremony || !selectedPackage || !paymentSlip) return;

        const formData = new FormData();
        formData.append('student_number', studentData.studentInfo.username);
        formData.append('course_id', Array.from(selectedCourseIds).join(','));
        formData.append('package_id', selectedPackageId);
        formData.append('convocation_id', activeCeremony.id);
        formData.append('payment_amount', String(totalPrice));
        formData.append('additional_seats', additionalSeats);
        formData.append('session', selectedSession);
        formData.append('image', paymentSlip);
        formData.append('name_on_certificate', nameOnCertificate);
        formData.append('telephone_1', phone);
        
        createBookingMutation.mutate(formData);
    };
    
    const renderContent = () => {
        switch (step) {
            case 'loading':
                return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
            
            case 'error':
                 return (
                    <div className="flex flex-col items-center justify-center text-center p-4">
                        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Something Went Wrong</h2>
                        <p className="text-muted-foreground">{errorMessage}</p>
                         <Button onClick={() => router.push('/dashboard')} className="mt-6">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                        </Button>
                    </div>
                 );
            
            case 'form':
                return (
                    <form onSubmit={handleFormSubmit}>
                        <CardHeader>
                            <CardTitle>Convocation Booking</CardTitle>
                            <CardDescription>Register for {activeCeremony?.convocation_name}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                             {/* Course Selection */}
                             <div className="space-y-3">
                                <Label className="text-base font-semibold">1. Select Eligible Course(s)</Label>
                                <div className="space-y-2">
                                {eligibleEnrollments.map(e => (
                                    <div key={e.id} className="flex items-center space-x-2 p-3 border rounded-md has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                                        <Checkbox id={e.id} checked={selectedCourseIds.has(e.parent_course_id)} onCheckedChange={checked => {
                                            const newSet = new Set(selectedCourseIds);
                                            if(checked) newSet.add(e.parent_course_id);
                                            else newSet.delete(e.parent_course_id);
                                            setSelectedCourseIds(newSet);
                                        }} />
                                        <Label htmlFor={e.id} className="flex-1 cursor-pointer">{e.parent_course_name}</Label>
                                    </div>
                                ))}
                                </div>
                            </div>
                            {/* Package Selection */}
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">2. Choose Your Package</Label>
                                {isLoadingPackages ? <Skeleton className="h-24 w-full" /> : (
                                    <RadioGroup value={selectedPackageId} onValueChange={setSelectedPackageId} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {packages?.map(pkg => (
                                            <Label key={pkg.package_id} htmlFor={pkg.package_id} className="block border rounded-lg p-4 cursor-pointer has-[:checked]:ring-2 has-[:checked]:ring-primary">
                                                <RadioGroupItem value={pkg.package_id} id={pkg.package_id} className="sr-only" />
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold">{pkg.package_name}</h4>
                                                    <p className="font-bold text-primary">LKR {parseFloat(pkg.price).toLocaleString()}</p>
                                                </div>
                                                <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                                                    {pkg.graduation_cloth === '1' && <li>Graduation Cloak</li>}
                                                    {pkg.garland === '1' && <li>Garland</li>}
                                                    <li>Student Seat: 1</li>
                                                    <li>Parent Seats: {pkg.parent_seat_count}</li>
                                                </ul>
                                            </Label>
                                        ))}
                                    </RadioGroup>
                                )}
                            </div>
                             {/* Session & Seats */}
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label className="text-base font-semibold">3. Select Your Session</Label>
                                    <RadioGroup value={selectedSession} onValueChange={(v) => setSelectedSession(v as '1' | '2')} className="flex gap-4">
                                        <Label htmlFor="session1" className="flex items-center gap-2 border rounded-md p-3 cursor-pointer has-[:checked]:ring-2 has-[:checked]:ring-primary flex-1 justify-center"><RadioGroupItem value="1" id="session1" />Session 1</Label>
                                        <Label htmlFor="session2" className="flex items-center gap-2 border rounded-md p-3 cursor-pointer has-[:checked]:ring-2 has-[:checked]:ring-primary flex-1 justify-center"><RadioGroupItem value="2" id="session2" />Session 2</Label>
                                    </RadioGroup>
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="additional-seats" className="text-base font-semibold flex items-center gap-2"><Users className="w-5 h-5"/>4. Additional Parent Seats</Label>
                                    <Input id="additional-seats" type="number" min="0" max="8" value={additionalSeats} onChange={e => setAdditionalSeats(e.target.value)} />
                                    <p className="text-xs text-muted-foreground">Each additional seat costs LKR {PARENT_SEAT_RATE}.</p>
                                </div>
                            </div>
                            {/* Total and Payment */}
                            <div className="space-y-4 pt-4 border-t">
                                <div className="text-2xl font-bold flex justify-between">
                                    <span>Total Amount:</span>
                                    <span className="text-primary">LKR {totalPrice.toLocaleString()}</span>
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="payment-slip" className="text-base font-semibold">5. Upload Payment Slip</Label>
                                    <Input id="payment-slip" type="file" required onChange={e => setPaymentSlip(e.target.files ? e.target.files[0] : null)} />
                                </div>
                            </div>
                              <div className="space-y-4 pt-4 border-t">
                                <Label className="text-base font-semibold">6. Confirm Details</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name-on-cert">Name on Certificate</Label>
                                        <Input id="name-on-cert" value={nameOnCertificate} onChange={e => setNameOnCertificate(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Contact Number</Label>
                                        <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} required />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" size="lg" className="w-full">
                                Review Booking <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </form>
                );

            case 'confirmation':
                 return (
                    <>
                        <CardHeader>
                            <Button variant="ghost" onClick={() => setStep('form')} className="w-fit h-auto p-0 mb-2 text-sm text-muted-foreground hover:text-foreground">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Edit
                            </Button>
                            <CardTitle>Confirm Your Booking</CardTitle>
                            <CardDescription>Please review all details before submitting.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p><strong>Courses:</strong> {eligibleEnrollments.filter(e => selectedCourseIds.has(e.parent_course_id)).map(e => e.parent_course_name).join(', ')}</p>
                            <p><strong>Package:</strong> {selectedPackage?.package_name}</p>
                            <p><strong>Session:</strong> {selectedSession}</p>
                            <p><strong>Additional Seats:</strong> {additionalSeats}</p>
                            <p><strong>Total Price:</strong> LKR {totalPrice.toLocaleString()}</p>
                            <p><strong>Payment Slip:</strong> {paymentSlip?.name}</p>
                        </CardContent>
                        <CardFooter>
                            <Button size="lg" className="w-full" onClick={handleConfirmAndSubmit} disabled={createBookingMutation.isPending}>
                               {createBookingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Confirm & Submit
                            </Button>
                        </CardFooter>
                    </>
                );

            case 'success':
                 return (
                    <CardContent className="text-center p-8 flex flex-col items-center gap-4">
                        <CheckCircle className="w-16 h-16 text-green-500" />
                        <h2 className="text-2xl font-bold">Booking Submitted!</h2>
                        <p className="text-muted-foreground">Your reference number is <strong className="font-mono text-primary bg-primary/10 px-2 py-1 rounded">{referenceNumber}</strong>. You will receive a confirmation email shortly.</p>
                        <Button asChild className="mt-4"><Link href="/dashboard">Back to Dashboard</Link></Button>
                    </CardContent>
                );
        }
    }
    
    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <Card className="max-w-4xl mx-auto shadow-lg">
                {renderContent()}
            </Card>
        </div>
    );
}

    