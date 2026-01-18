
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentFullInfo } from '@/lib/actions/users';
import { getConvocationCeremonies, getPackagesByCeremony, createConvocationRegistration } from '@/lib/actions/certificates';
import type { FullStudentData, StudentEnrollment } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, CheckCircle, Award, Loader2, Home, Truck, Copy, AlertCircle, XCircle, ChevronDown, ListOrdered, PlusCircle } from 'lucide-react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Image from 'next/image';

const PARENT_SEAT_RATE = 500; // As defined in PHP code

type OrderStep = 'loading' | 'selection' | 'form' | 'confirmation' | 'success' | 'error';

interface City {
    id: string;
    district_id: string;
    name_en: string;
}
interface District {
    id: string;
    name_en: string;
}


const getCityName = async (cityId: string): Promise<City> => {
    if (!cityId) return { id: '', district_id: '', name_en: 'N/A' };
    const response = await fetch(`https://qa-api.pharmacollege.lk/cities/${cityId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch city data');
    }
    return response.json();
}

const getDistrictName = async (districtId: string): Promise<District> => {
    if (!districtId) return { id: '', name_en: 'N/A' };
    const response = await fetch(`https://qa-api.pharmacollege.lk/districts/${districtId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch district data');
    }
    return response.json();
}

export default function CreateConvocationBookingPage() {
  const { user, isImpersonating } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<OrderStep>('loading');
  const [selectedEnrollments, setSelectedEnrollments] = useState<StudentEnrollment[]>([]);
  const [deselectedEligible, setDeselectedEligible] = useState<StudentEnrollment[]>([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);

  // Form State
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
    enabled: !!user?.username,
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

  const allEnrollments = useMemo(() => {
    if (!studentData) return [];
    return Object.values(studentData.studentEnrollments);
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
    if (studentData) {
        if (allEnrollments.length === 0) {
             setErrorMessage("You are not enrolled in any courses, so you cannot book for the convocation.");
             setStep('error');
             return;
        }

        const eligibleEnrollments = allEnrollments.filter(e => e.certificate_eligibility);
        // Pre-select all eligible courses by default
        setSelectedEnrollments(eligibleEnrollments);
        setDeselectedEligible([]);
        setStep('selection');
    }
  }, [isLoadingStudent, isLoadingCeremony, isError, studentData, activeCeremony, allEnrollments, error]);

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

  const handleSelectionSubmit = () => {
    if (selectedEnrollments.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Courses Selected',
        description: 'Please select at least one eligible course to proceed.',
      });
      return;
    }

    if (deselectedEligible.length > 0) {
        setIsConfirmDialogOpen(true);
    } else {
        setStep('form');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedEnrollments.length === 0) {
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
      formData.append('course_id', selectedEnrollments.map(e => e.parent_course_id).join(','));
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
  
  const copyToClipboard = () => {
    if (referenceNumber) {
      navigator.clipboard.writeText(referenceNumber);
      toast({ title: 'Copied!', description: 'Reference number copied to clipboard.' });
    }
  };

  const handleCheckboxChange = (checked: boolean, enrollment: StudentEnrollment) => {
      setSelectedEnrollments(prev => 
          checked ? [...prev, enrollment] : prev.filter(e => e.id !== enrollment.id)
      );

      if(enrollment.certificate_eligibility) {
          setDeselectedEligible(prev => 
              !checked ? [...prev, enrollment] : prev.filter(e => e.id !== enrollment.id)
          );
      }
  };

  const renderContent = () => {
    switch (step) {
      case 'loading':
        return (
          <CardContent className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Loading your data...</p>
          </CardContent>
        );

      case 'selection':
        return (
          <>
            <CardHeader>
              <Button variant="ghost" onClick={() => router.push('/dashboard/convocation-booking')} className="w-fit h-auto p-0 mb-2 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Bookings
              </Button>
              <CardTitle>Step 1: Select Your Course(s)</CardTitle>
              <CardDescription>Review course eligibility and select courses to include in your convocation booking for {studentData?.studentInfo.full_name}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {deselectedEligible.length > 0 && (
                     <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Warning</AlertTitle>
                        <AlertDescription>
                            You have deselected {deselectedEligible.length} course(s) for which you are eligible. Please ensure this is intentional before proceeding.
                        </AlertDescription>
                    </Alert>
                )}
                {allEnrollments.map(enrollment => {
                    const isEligible = enrollment.certificate_eligibility;
                    return (
                        <Collapsible key={enrollment.id} className="p-4 border rounded-md has-[:disabled]:bg-muted/50 has-[:disabled]:opacity-60 transition-all">
                            <div className="flex items-center space-x-3">
                                <Checkbox 
                                    id={enrollment.id} 
                                    checked={selectedEnrollments.some(e => e.id === enrollment.id)}
                                    disabled={!isEligible}
                                    onCheckedChange={(checked) => handleCheckboxChange(Boolean(checked), enrollment)}
                                />
                                 <div className="flex-1">
                                    <Label htmlFor={enrollment.id} className="font-medium leading-none peer-disabled:cursor-not-allowed">
                                        {enrollment.parent_course_name}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">{enrollment.course_code}</p>
                                </div>
                                <Badge variant={isEligible ? 'default' : 'destructive'} className={cn("shrink-0", isEligible ? 'bg-green-600' : '')}>
                                    {isEligible ? "Eligible" : "Not Eligible"}
                                </Badge>
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="w-9 p-0">
                                        <ChevronDown className="h-4 w-4" />
                                        <span className="sr-only">Toggle details</span>
                                    </Button>
                                </CollapsibleTrigger>
                            </div>
                            <CollapsibleContent className="space-y-2 mt-4 pt-4 border-t">
                               <h4 className="text-sm font-semibold mb-2">Eligibility Criteria</h4>
                               <ul className="space-y-2 text-sm">
                                    {enrollment.criteria_details.map(criterion => (
                                        <li key={criterion.id} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                {criterion.evaluation.completed ? (
                                                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                                ) : (
                                                    <XCircle className="h-4 w-4 text-destructive shrink-0" />
                                                )}
                                                <span className="text-muted-foreground">{criterion.list_name}</span>
                                            </div>
                                            <span className="font-mono text-foreground bg-muted px-1.5 py-0.5 rounded-sm">
                                                {criterion.evaluation.currentValue} / {criterion.evaluation.requiredValue}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </CollapsibleContent>
                        </Collapsible>
                    )
                })}
            </CardContent>
            <CardFooter>
              <Button onClick={handleSelectionSubmit} disabled={selectedEnrollments.length === 0}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </>
        );
      
      case 'form':
              return (
                  <form onSubmit={handleFormSubmit}>
                      <CardHeader>
                        <Button variant="ghost" onClick={() => setStep('selection')} className="w-fit h-auto p-0 mb-2 text-sm text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course Selection
                        </Button>
                        <CardTitle>Step 2: Complete Your Booking</CardTitle>
                        <CardDescription>Choose a package and provide your payment details.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-8">
                           {/* Package Selection */}
                           <div className="space-y-3">
                              <Label className="text-base font-semibold">Choose Your Package</Label>
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
                                  <Label className="text-base font-semibold">Select Your Session</Label>
                                  <RadioGroup value={selectedSession} onValueChange={(v) => setSelectedSession(v as '1' | '2')} className="flex gap-4">
                                      <Label htmlFor="session1" className="flex items-center gap-2 border rounded-md p-3 cursor-pointer has-[:checked]:ring-2 has-[:checked]:ring-primary flex-1 justify-center"><RadioGroupItem value="1" id="session1" />Session 1</Label>
                                      <Label htmlFor="session2" className="flex items-center gap-2 border rounded-md p-3 cursor-pointer has-[:checked]:ring-2 has-[:checked]:ring-primary flex-1 justify-center"><RadioGroupItem value="2" id="session2" />Session 2</Label>
                                  </RadioGroup>
                              </div>
                              <div className="space-y-3">
                                  <Label htmlFor="additional-seats" className="text-base font-semibold flex items-center gap-2"><Users className="w-5 h-5"/>Additional Parent Seats</Label>
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
                                  <Label htmlFor="payment-slip" className="text-base font-semibold">Upload Payment Slip</Label>
                                  <Input id="payment-slip" type="file" required onChange={e => setPaymentSlip(e.target.files ? e.target.files[0] : null)} />
                              </div>
                          </div>
                            <div className="space-y-4 pt-4 border-t">
                              <Label className="text-base font-semibold">Confirm Details</Label>
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
                        <CardTitle>Step 3: Confirm Your Booking</CardTitle>
                        <CardDescription>Please review all details before submitting.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <h3 className="font-semibold text-foreground">Courses:</h3>
                            <p className="text-sm text-muted-foreground">{selectedEnrollments.map(e => e.parent_course_name).join(', ')}</p>
                          </div>
                          <p className="text-sm"><strong className="text-muted-foreground">Package:</strong> {selectedPackage?.package_name}</p>
                          <p className="text-sm"><strong className="text-muted-foreground">Session:</strong> {selectedSession}</p>
                          <p className="text-sm"><strong className="text-muted-foreground">Additional Seats:</strong> {additionalSeats}</p>
                          <p className="text-lg font-bold"><strong className="text-muted-foreground">Total Price:</strong> LKR {totalPrice.toLocaleString()}</p>
                          <p className="text-sm"><strong className="text-muted-foreground">Payment Slip:</strong> {paymentSlip?.name}</p>
                          <p className="text-sm"><strong className="text-muted-foreground">Name on Certificate:</strong> {nameOnCertificate}</p>
                          <p className="text-sm"><strong className="text-muted-foreground">Contact Phone:</strong> {phone}</p>
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
                      <Button asChild className="mt-4"><Link href="/dashboard/convocation-booking">View Booking History</Link></Button>
                  </CardContent>
              );

            case 'error':
                return (
                    <CardContent className="text-center p-8 flex flex-col items-center gap-4">
                       <AlertCircle className="w-16 h-16 text-destructive" />
                       <h2 className="text-xl font-semibold">Something Went Wrong</h2>
                       <p className="text-muted-foreground">{errorMessage}</p>
                       <Button asChild variant="outline" className="mt-4"><Link href="/dashboard/convocation-booking">Back to Bookings</Link></Button>
                    </CardContent>
                );
      }
  };
  
  return (
      <div className="p-4 md:p-8 space-y-8 pb-20">
           <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    You have not selected all eligible courses. Are you sure you want to proceed without including all eligible certificates in this booking?
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Go Back</AlertDialogCancel>
                <AlertDialogAction onClick={() => setStep('form')}>
                    Continue Anyway
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Card className="max-w-4xl mx-auto shadow-lg">
              {renderContent()}
          </Card>
      </div>
  );
}
