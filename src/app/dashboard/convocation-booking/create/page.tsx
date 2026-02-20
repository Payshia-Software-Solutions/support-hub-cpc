
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentFullInfo } from '@/lib/actions/users';
import { getConvocationCeremonies, getPackagesByCeremony, createConvocationRegistration, getConvocationSessionCounts, getCertificateOrdersByStudent, getConvocationRegistrationsByStudent } from '@/lib/actions/certificates';
import type { FullStudentData, StudentEnrollment, ConvocationCeremony, ConvocationPackage, SessionCount, CertificateOrder } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, CheckCircle, Award, Loader2, Home, Truck, Copy, AlertCircle, XCircle, ChevronDown, ListOrdered, PlusCircle, FileText, Sparkles, ScrollText, Check, Paperclip, User, Users, Star, Video, Coffee, GraduationCap } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const PARENT_SEAT_RATE = 750; 

type OrderStep = 'loading' | 'ceremony_selection' | 'course_selection' | 'form' | 'confirmation' | 'success' | 'error';

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
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<OrderStep>('loading');
  const [selectedCeremonyId, setSelectedCeremonyId] = useState<string>('');
  const [selectedEnrollments, setSelectedEnrollments] = useState<StudentEnrollment[]>([]);
  const [deselectedEligible, setDeselectedEligible] = useState<StudentEnrollment[]>([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  
  const [errorDetails, setErrorDetails] = useState<{ message: string; enrollments?: StudentEnrollment[] } | null>(null);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);

  // Form State
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<'1' | '2'>('1');
  const [additionalSeats, setAdditionalSeats] = useState('0');
  const [paymentSlip, setPaymentSlip] = useState<File | null>(null);
  const [nameOnCertificate, setNameOnCertificate] = useState('');
  const [phone, setPhone] = useState('');

  // --- Data Fetching ---
  const { data: studentData, isLoading: isLoadingStudent, isError: isStudentError, error: studentError } = useQuery<FullStudentData>({
    queryKey: ['studentFullInfoForConvocation', user?.username],
    queryFn: () => getStudentFullInfo(user!.username!),
    enabled: !!user?.username,
    retry: 1,
  });

  const { data: allCeremonies, isLoading: isLoadingCeremonies, isError: isCeremonyError, error: ceremonyError } = useQuery<ConvocationCeremony[]>({
      queryKey: ['allConvocationCeremonies'],
      queryFn: getConvocationCeremonies,
  });

  const activeCeremonies = useMemo(() => {
    return allCeremonies?.filter(c => c.accept_booking === '1') || [];
  }, [allCeremonies]);
  
  const { data: packages, isLoading: isLoadingPackages } = useQuery<ConvocationPackage[]>({
      queryKey: ['convocationPackages', selectedCeremonyId],
      queryFn: () => getPackagesByCeremony(selectedCeremonyId),
      enabled: !!selectedCeremonyId,
  });

  const { data: sessionCounts, isLoading: isLoadingCounts } = useQuery<SessionCount[]>({
      queryKey: ['convocationSessionCounts', selectedCeremonyId],
      queryFn: () => getConvocationSessionCounts(selectedCeremonyId),
      enabled: !!selectedCeremonyId,
  });

  const { data: certificateOrders, isLoading: isLoadingOrders } = useQuery<CertificateOrder[]>({
      queryKey: ['studentCertificateOrders', user?.username],
      queryFn: () => getCertificateOrdersByStudent(user!.username!),
      enabled: !!user?.username,
      staleTime: 5 * 60 * 1000,
  });
  
  const { data: convocationBookings, isLoading: isLoadingBookings } = useQuery<ConvocationRegistration[]>({
    queryKey: ['studentConvocationBookingsForCertOrder', user?.username],
    queryFn: () => getConvocationRegistrationsByStudent(user!.username!),
    enabled: !!user?.username,
  });

  const allEnrollments = useMemo(() => {
    if (!studentData) return [];
    return Object.values(studentData.studentEnrollments);
  }, [studentData]);
  
  const activeBookedCourseIds = useMemo(() => {
    if (!convocationBookings) return new Set<string>();
    const ids = new Set<string>();
    convocationBookings
      .filter(booking => booking.registration_status !== 'Rejected' && booking.registration_status !== 'Canceled')
      .forEach(booking => {
        booking.course_id.split(',').forEach(id => {
          if (id.trim()) ids.add(id.trim());
        });
      });
    return ids;
  }, [convocationBookings]);
  
  const activeOrderedCourseIds = useMemo(() => {
    if (!certificateOrders) return new Set<string>();
    const ids = new Set<string>();
    certificateOrders
      .filter(order => order.certificate_status === 'Pending' || order.certificate_status === 'Printed')
      .forEach(order => {
        order.course_code.split(',').forEach(id => {
          if (id.trim()) ids.add(id.trim());
        });
      });
    return ids;
  }, [certificateOrders]);

  const resetAllState = () => {
    setStep('loading');
    setSelectedCeremonyId('');
    setSelectedEnrollments([]);
    setDeselectedEligible([]);
    setErrorDetails(null);
    setReferenceNumber(null);
  };

  useEffect(() => {
    resetAllState();
    const isLoading = isLoadingStudent || isLoadingCeremonies || isLoadingOrders || isLoadingBookings;
    if (isLoading) {
      setStep('loading');
      return;
    }
    const anyError = isStudentError || isCeremonyError;
    if (anyError) {
      setErrorDetails({ message: (studentError?.message || ceremonyError?.message) ?? 'Failed to load initial data.' });
      setStep('error');
      return;
    }

    if (studentData) {
      
      if (allEnrollments.length === 0) {
        setErrorDetails({ message: "You have no course enrollments." });
        setStep('error');
        return;
      }
      
      const eligibleEnrollments = allEnrollments.filter(e => e.certificate_eligibility);
      
      if (eligibleEnrollments.length === 0) {
        setErrorDetails({ 
            message: "You do not have any courses eligible for a convocation booking at this time.",
            enrollments: allEnrollments
        });
        setStep('error');
        return;
      }
      
      const availableForBooking = eligibleEnrollments.filter(e => 
        !activeBookedCourseIds.has(e.parent_course_id) &&
        !activeOrderedCourseIds.has(e.parent_course_id)
      );

      if (availableForBooking.length === 0) {
        setErrorDetails({
            message: "All your eligible courses have already been booked for convocation or have a pending certificate order. There are no new courses available to book at this time.",
            enrollments: allEnrollments
        });
        setStep('error');
        return;
      }

      if (!allCeremonies || activeCeremonies.length === 0) {
        setErrorDetails({ message: 'There are no active convocation ceremonies at the moment. Please check back later.' });
        setStep('error');
        return;
      }

      setNameOnCertificate(studentData.studentInfo.name_on_certificate || studentData.studentInfo.full_name);
      setPhone(studentData.studentInfo.telephone_1);
      
      setStep('ceremony_selection');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingStudent, isLoadingCeremonies, isLoadingOrders, isLoadingBookings, isStudentError, isCeremonyError, studentData, allEnrollments, activeBookedCourseIds, activeOrderedCourseIds]);


  const createBookingMutation = useMutation({
      mutationFn: (payload: FormData) => createConvocationRegistration(payload),
      onSuccess: (data) => {
          setReferenceNumber(data.reference_number || data.id);
          setStep('success');
          toast({ title: 'Booking Submitted!', description: 'Your convocation registration has been received.' });
      },
      onError: (err: Error) => {
          setErrorDetails({ message: err.message || 'An unknown error occurred.' });
          setStep('error');
      }
  });
  
  const selectedCeremony = useMemo(() => {
    return allCeremonies?.find(c => c.id === selectedCeremonyId);
  }, [allCeremonies, selectedCeremonyId]);

  const seatsAvailable = useMemo(() => {
    if (!selectedCeremony || !sessionCounts) {
      return { session1: undefined, session2: undefined };
    }
    const totalSeatsS1 = parseInt(selectedCeremony.student_seats, 10);
    const totalSeatsS2 = parseInt(selectedCeremony.session_2, 10);

    const registeredS1 = parseInt(sessionCounts.find(s => s.session === '1')?.sessionCounts || '0', 10);
    const registeredS2 = parseInt(sessionCounts.find(s => s.session === '2')?.sessionCounts || '0', 10);
    
    return {
      session1: totalSeatsS1 - registeredS1,
      session2: totalSeatsS2 - registeredS2,
    };
  }, [selectedCeremony, sessionCounts]);

  // Prevent selection of full session
  useEffect(() => {
    if (seatsAvailable.session1 !== undefined && seatsAvailable.session2 !== undefined) {
        if (selectedSession === '1' && seatsAvailable.session1 <= 0) {
            if (seatsAvailable.session2 > 0) {
                setSelectedSession('2');
            }
        } else if (selectedSession === '2' && seatsAvailable.session2 <= 0) {
            if (seatsAvailable.session1 > 0) {
                setSelectedSession('1');
            }
        }
    }
  }, [seatsAvailable, selectedSession]);


  const handleCeremonySelection = () => {
    if (!selectedCeremonyId) {
        toast({ variant: 'destructive', title: 'No Ceremony Selected', description: 'Please select a ceremony to continue.' });
        return;
    }
    const availableForBooking = allEnrollments.filter(e => 
        e.certificate_eligibility && 
        !activeBookedCourseIds.has(e.parent_course_id) &&
        !activeOrderedCourseIds.has(e.parent_course_id)
    );
    setSelectedEnrollments(availableForBooking);
    setDeselectedEligible([]);
    setStep('course_selection');
  }

  const handleCourseSelectionSubmit = () => {
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
          toast({ variant: 'destructive', title: 'No Courses Selected' }); return;
      }
      if (!selectedPackageId) {
          toast({ variant: 'destructive', title: 'No Package Selected' }); return;
      }
      if (!paymentSlip) {
           toast({ variant: 'destructive', title: 'Payment Slip Required' }); return;
      }
      if (!nameOnCertificate || !phone) {
           toast({ variant: 'destructive', title: 'Missing Details' }); return;
      }
      setStep('confirmation');
  };

  const handleConfirmAndSubmit = () => {
    if (!studentData?.studentInfo?.username || !selectedCeremonyId || !selectedPackageId || !paymentSlip || selectedEnrollments.length === 0) {
      setErrorDetails({ message: "Missing required information to submit the order." });
      setStep('error');
      return;
    }
    
    const formData = new FormData();
    formData.append('student_number', studentData.studentInfo.username);
    formData.append('course_id', selectedEnrollments.map(e => e.parent_course_id).join(','));
    formData.append('package_id', selectedPackageId);
    formData.append('convocation_id', selectedCeremonyId);
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
  
  const filteredPackages = useMemo(() => {
    if (!packages || selectedEnrollments.length === 0) {
        return [];
    }

    const selectedCourseIds = new Set(selectedEnrollments.map(e => e.parent_course_id));

    return packages.filter(pkg => {
        if (!pkg.course_list) {
            // Packages with no course list are available for all
            return true;
        }
        const packageCourseIds = pkg.course_list.split(',').map(id => id.trim());
        if (packageCourseIds.length === 0) {
            return true;
        }
        return packageCourseIds.some(id => selectedCourseIds.has(id));
    });
  }, [packages, selectedEnrollments]);


  const selectedPackage = useMemo(() => {
      return packages?.find(p => p.package_id === selectedPackageId);
  }, [packages, selectedPackageId]);

  const totalPrice = useMemo(() => {
    const packagePrice = selectedPackage ? parseFloat(selectedPackage.price) : 0;
    const numAdditionalSeats = parseInt(additionalSeats, 10);
    const safePackagePrice = isNaN(packagePrice) ? 0 : packagePrice;
    const safeSeatPrice = isNaN(numAdditionalSeats) ? 0 : numAdditionalSeats * PARENT_SEAT_RATE;
    return safePackagePrice + safeSeatPrice;
  }, [selectedPackage, additionalSeats]);


  const renderContent = () => {
    switch (step) {
      case 'loading':
        return (
          <CardContent className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Loading your data...</p>
          </CardContent>
        );
      
      case 'ceremony_selection':
        return (
          <>
            <CardHeader>
               <Button variant="ghost" onClick={() => router.push('/dashboard/convocation-booking')} className="w-fit h-auto p-0 mb-2 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Bookings
              </Button>
              <CardTitle>Step 1: Choose a Ceremony</CardTitle>
              <CardDescription>Select the convocation event you wish to register for.</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedCeremonyId} onValueChange={setSelectedCeremonyId} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeCeremonies.map(ceremony => (
                      <Label key={ceremony.id} htmlFor={ceremony.id} className="block border rounded-lg p-4 cursor-pointer has-[:checked]:ring-2 has-[:checked]:ring-primary">
                          <RadioGroupItem value={ceremony.id} id={ceremony.id} className="sr-only" />
                          <div className="flex justify-between items-start">
                              <h4 className="font-bold">{ceremony.convocation_name}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">Date: {format(new Date(ceremony.held_on), 'PPP')}</p>
                      </Label>
                  ))}
              </RadioGroup>
            </CardContent>
            <CardFooter>
                <Button onClick={handleCeremonySelection} disabled={!selectedCeremonyId}>
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
          </>
        );

      case 'course_selection':
        return (
          <>
            <CardHeader>
              <Button variant="ghost" onClick={() => setStep('ceremony_selection')} className="w-fit h-auto p-0 mb-2 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Ceremony Selection
              </Button>
              <CardTitle>Step 2: Select Your Course(s)</CardTitle>
              <CardDescription>Review course eligibility and select the certificates to include in your booking.</CardDescription>
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
                    const hasActiveOrder = activeOrderedCourseIds.has(enrollment.parent_course_id);
                    const isBookedForConvocation = activeBookedCourseIds.has(enrollment.parent_course_id);
                    const isDisabled = !isEligible || hasActiveOrder || isBookedForConvocation;

                    return (
                        <Collapsible key={enrollment.id} className="p-4 border rounded-md has-[:disabled]:bg-muted/50 has-[:disabled]:opacity-60 transition-all">
                            <div className="flex items-center space-x-3">
                                <Checkbox 
                                    id={enrollment.id} 
                                    checked={selectedEnrollments.some(e => e.id === enrollment.id)}
                                    disabled={isDisabled}
                                    onCheckedChange={(checked) => handleCheckboxChange(Boolean(checked), enrollment)}
                                />
                                 <div className="flex-1">
                                    <Label htmlFor={enrollment.id} className={cn("font-medium leading-none", isDisabled ? "cursor-not-allowed" : "peer-disabled:cursor-not-allowed")}>
                                        {enrollment.parent_course_name}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">{enrollment.course_code}</p>
                                </div>
                                {isBookedForConvocation ? (
                                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">Booked</Badge>
                                ) : hasActiveOrder ? (
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">Ordered</Badge>
                                ) : (
                                    <Badge variant={isEligible ? 'default' : 'destructive'} className={cn("shrink-0", isEligible ? 'bg-green-600' : '')}>
                                        {isEligible ? "Eligible" : "Not Eligible"}
                                    </Badge>
                                )}
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
              <Button onClick={handleCourseSelectionSubmit} disabled={selectedEnrollments.length === 0}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </>
        );
      
      case 'form':
        return (
          <form onSubmit={handleFormSubmit}>
              <CardHeader>
                <Button variant="ghost" onClick={() => setStep('course_selection')} className="w-fit h-auto p-0 mb-2 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course Selection
                </Button>
                <CardTitle>Step 3: Complete Your Booking</CardTitle>
                <CardDescription>Choose a package and provide your payment details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                   {/* Package Selection */}
                   <div className="space-y-3">
                      <Label className="text-base font-semibold">Choose Your Package</Label>
                      {isLoadingPackages ? <Skeleton className="h-24 w-full" /> : (
                           <>
                                {filteredPackages.length > 0 ? (
                                  <RadioGroup value={selectedPackageId} onValueChange={setSelectedPackageId} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {filteredPackages.map(pkg => (
                                          <Label key={pkg.package_id} htmlFor={pkg.package_id} className="block border rounded-lg p-4 cursor-pointer has-[:checked]:ring-2 has-[:checked]:ring-primary overflow-hidden">
                                              <RadioGroupItem value={pkg.package_id} id={pkg.package_id} className="sr-only" />
                                              {pkg.cover_image && (
                                                  <div className="relative aspect-video -mt-4 -mx-4 mb-4">
                                                      <Image
                                                          src={`https://content-provider.pharmacollege.lk//content-provider/uploads/package-images/${pkg.cover_image}`}
                                                          alt={pkg.package_name}
                                                          layout="fill"
                                                          objectFit="contain"
                                                          className="bg-muted"
                                                      />
                                                  </div>
                                              )}
                                              <div className="flex justify-between items-start">
                                                  <h4 className="font-bold">{pkg.package_name}</h4>
                                                  <p className="font-bold text-primary">LKR {parseFloat(pkg.price).toLocaleString()}</p>
                                              </div>
                                                <div className="mt-4 space-y-2 text-sm">
                                                    {pkg.description && <p className="text-muted-foreground">{pkg.description}</p>}
                                                    <h5 className="font-semibold pt-2 border-t">What's Included:</h5>
                                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-muted-foreground">
                                                        {pkg.student_seat === '1' && <li className="flex items-center gap-2"><User className="w-4 h-4 text-primary"/> Student Seat</li>}
                                                        {parseInt(pkg.parent_seat_count, 10) > 0 && <li className="flex items-center gap-2"><Users className="w-4 h-4 text-primary"/> {pkg.parent_seat_count} Parent Seat(s)</li>}
                                                        {parseInt(pkg.vip_seat, 10) > 0 && <li className="flex items-center gap-2"><Star className="w-4 h-4 text-primary"/> {pkg.vip_seat} VIP Seat(s)</li>}
                                                        {pkg.graduation_cloth === '1' && <li className="flex items-center gap-2"><Award className="w-4 h-4 text-primary"/> Graduation Cloak</li>}
                                                        {pkg.garland === '1' && <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary"/> Garland</li>}
                                                        {pkg.scroll === '1' && <li className="flex items-center gap-2"><ScrollText className="w-4 h-4 text-primary"/> Scroll</li>}
                                                        {pkg.certificate_file === '1' && <li className="flex items-center gap-2"><FileText className="w-4 h-4 text-primary"/> Certificate File</li>}
                                                        {pkg.photo_package === '1' && <li className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-primary"/> Graduation Hat</li>}
                                                        {pkg.video_360 === '1' && <li className="flex items-center gap-2"><Video className="w-4 h-4 text-primary"/> 360 Video</li>}
                                                        {pkg.refreshments === '1' && <li className="flex items-center gap-2"><Coffee className="w-4 h-4 text-primary"/> Refreshments</li>}
                                                    </ul>
                                                </div>
                                          </Label>
                                      ))}
                                  </RadioGroup>
                                ) : (
                                  <Alert>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>No Packages Available</AlertTitle>
                                    <AlertDescription>
                                      There are no convocation packages available for the course(s) you selected. Please contact support for assistance.
                                    </AlertDescription>
                                  </Alert>
                                )}
                            </>
                      )}
                  </div>
                  
                  {selectedPackageId && (
                     <div className="space-y-8 animate-in fade-in-50">
                        {/* Session & Seats */}
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">Select Your Session</Label>
                                {isLoadingCounts ? (
                                    <div className="flex gap-4">
                                        <Skeleton className="h-12 flex-1" />
                                        <Skeleton className="h-12 flex-1" />
                                    </div>
                                ) : (
                                    <RadioGroup value={selectedSession} onValueChange={(v) => setSelectedSession(v as '1' | '2')} className="flex gap-4">
                                        <Label 
                                            htmlFor="session1" 
                                            className={cn(
                                                "flex flex-col gap-1 border rounded-md p-3 transition-all flex-1 justify-center text-center",
                                                seatsAvailable.session1 !== undefined && seatsAvailable.session1 <= 0 ? "opacity-50 cursor-not-allowed bg-muted" : "cursor-pointer hover:bg-accent has-[:checked]:ring-2 has-[:checked]:ring-primary"
                                            )}
                                        >
                                            <RadioGroupItem value="1" id="session1" className="sr-only" disabled={seatsAvailable.session1 !== undefined && seatsAvailable.session1 <= 0} />
                                            Session 1
                                            {seatsAvailable.session1 !== undefined && (
                                                <span className={cn("text-xs font-bold", seatsAvailable.session1 > 0 ? "text-green-600" : "text-destructive")}>
                                                    {seatsAvailable.session1 > 0 ? `${seatsAvailable.session1} seats left` : "Full"}
                                                </span>
                                            )}
                                        </Label>
                                         <Label 
                                            htmlFor="session2" 
                                            className={cn(
                                                "flex flex-col gap-1 border rounded-md p-3 transition-all flex-1 justify-center text-center",
                                                seatsAvailable.session2 !== undefined && seatsAvailable.session2 <= 0 ? "opacity-50 cursor-not-allowed bg-muted" : "cursor-pointer hover:bg-accent has-[:checked]:ring-2 has-[:checked]:ring-primary"
                                            )}
                                        >
                                            <RadioGroupItem value="2" id="session2" className="sr-only" disabled={seatsAvailable.session2 !== undefined && seatsAvailable.session2 <= 0} />
                                            Session 2
                                            {seatsAvailable.session2 !== undefined && (
                                                <span className={cn("text-xs font-bold", seatsAvailable.session2 > 0 ? "text-green-600" : "text-destructive")}>
                                                    {seatsAvailable.session2 > 0 ? `${seatsAvailable.session2} seats left` : "Full"}
                                                </span>
                                            )}
                                        </Label>
                                    </RadioGroup>
                                )}
                            </div>
                            <div className="space-y-3">
                                <Label className="text-base font-semibold flex items-center gap-2"><Users className="w-5 h-5"/>Additional Parent Seats</Label>
                                <RadioGroup
                                    value={additionalSeats}
                                    onValueChange={setAdditionalSeats}
                                    className="flex gap-2"
                                >
                                    <div className="flex items-center">
                                        <RadioGroupItem value="0" id="seats-0" className="sr-only" />
                                        <Label
                                            htmlFor="seats-0"
                                            className={cn(
                                                "flex w-20 h-20 flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                                                additionalSeats === '0' && "border-primary"
                                            )}
                                        >
                                            <span className="text-2xl font-bold">0</span>
                                            <span className="text-xs">Seats</span>
                                        </Label>
                                    </div>
                                    <div className="flex items-center">
                                        <RadioGroupItem value="1" id="seats-1" className="sr-only" />
                                        <Label
                                            htmlFor="seats-1"
                                            className={cn(
                                                "flex w-20 h-20 flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                                                additionalSeats === '1' && "border-primary"
                                            )}
                                        >
                                            <span className="text-2xl font-bold">1</span>
                                            <span className="text-xs">Seat</span>
                                        </Label>
                                    </div>
                                    <div className="flex items-center">
                                        <RadioGroupItem value="2" id="seats-2" className="sr-only" />
                                        <Label
                                            htmlFor="seats-2"
                                            className={cn(
                                                "flex w-20 h-20 flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                                                additionalSeats === '2' && "border-primary"
                                            )}
                                        >
                                            <span className="text-2xl font-bold">2</span>
                                            <span className="text-xs">Seats</span>
                                        </Label>
                                    </div>
                                </RadioGroup>
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
                    </div>
                  )}

              </CardContent>
              <CardFooter>
                  {selectedPackageId && (
                    <Button type="submit" size="lg" className="w-full animate-in fade-in-50" disabled={!paymentSlip}>
                        Review Booking <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
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
                        <CardTitle>Step 4: Confirm Your Booking</CardTitle>
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
          <>
            <CardHeader className="items-center text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <CardTitle>Request Submitted!</CardTitle>
              <CardDescription>The convocation booking has been successfully placed. You will be notified of its status.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">Your Reference Number is:</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                    <p className="text-2xl font-bold font-mono tracking-widest text-primary p-2 border-2 border-dashed rounded-lg">{referenceNumber}</p>
                    <Button variant="ghost" size="icon" onClick={copyToClipboard}><Copy className="h-5 w-5"/></Button>
                </div>
            </CardContent>
             <CardFooter className="justify-center">
              <Button onClick={() => router.push('/dashboard/convocation-booking')}>
                  <Home className="mr-2 h-4 w-4" /> View Booking History
              </Button>
            </CardFooter>
          </>
        );

            case 'error':
                return (
                    <>
                        <CardHeader className="items-center text-center">
                           <AlertCircle className="w-16 h-16 text-destructive" />
                           <CardTitle>Booking Not Available</CardTitle>
                           <CardDescription>{errorDetails?.message}</CardDescription>
                        </CardHeader>
                        {errorDetails?.enrollments && errorDetails.enrollments.length > 0 && (
                            <CardContent>
                                <div className="w-full max-w-lg mx-auto text-left space-y-4">
                                    <h3 className="font-semibold text-center">Your Course Status Overview</h3>
                                    {errorDetails.enrollments.map(enrollment => {
                                        const isEligible = enrollment.certificate_eligibility;
                                        const isBooked = activeBookedCourseIds.has(enrollment.parent_course_id);
                                        const isOrdered = activeOrderedCourseIds.has(enrollment.parent_course_id);

                                        let statusBadge: React.ReactNode;
                                        if (isBooked) {
                                            statusBadge = <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">Booked</Badge>;
                                        } else if (isOrdered) {
                                            statusBadge = <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">Ordered</Badge>;
                                        } else if (isEligible) {
                                            statusBadge = <Badge variant="default" className="bg-green-600">Eligible</Badge>;
                                        } else {
                                            statusBadge = <Badge variant="destructive">Not Eligible</Badge>;
                                        }

                                        return (
                                            <Collapsible key={enrollment.id} className="p-4 border rounded-md" defaultOpen={!isEligible}>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium">{enrollment.parent_course_name}</p>
                                                        <p className="text-xs text-muted-foreground">{enrollment.course_code}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {statusBadge}
                                                        {!isEligible && <CollapsibleTrigger asChild><Button variant="ghost" size="sm" className="w-9 p-0"><ChevronDown className="h-4 w-4" /></Button></CollapsibleTrigger>}
                                                    </div>
                                                </div>
                                                {!isEligible && (
                                                    <CollapsibleContent className="mt-4 pt-4 border-t">
                                                        <h4 className="text-sm font-semibold mb-2">Reasons for Ineligibility:</h4>
                                                        <ul className="space-y-2 text-sm">
                                                            {enrollment.criteria_details.map(criterion => !criterion.evaluation.completed && (
                                                                <li key={criterion.id} className="flex items-center justify-between text-xs">
                                                                    <div className="flex items-center gap-2">
                                                                        <XCircle className="h-4 w-4 text-destructive shrink-0" />
                                                                        <span className="text-muted-foreground">{criterion.list_name}</span>
                                                                    </div>
                                                                    <span className="font-mono text-foreground bg-muted px-1.5 py-0.5 rounded-sm">
                                                                        {criterion.evaluation.currentValue} / {criterion.evaluation.requiredValue}
                                                                    </span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </CollapsibleContent>
                                                )}
                                            </Collapsible>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        )}
                        <CardFooter className="justify-center">
                            <Button asChild variant="outline"><Link href="/dashboard/convocation-booking">Back to Bookings</Link></Button>
                        </CardFooter>
                    </>
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
          
          {studentData && (
              <Card className="max-w-4xl mx-auto shadow-md">
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    <Avatar className="h-16 w-16 text-xl">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-xl">{studentData.studentInfo.full_name}</CardTitle>
                        <CardDescription>{studentData.studentInfo.student_id}</CardDescription>
                    </div>
                </CardHeader>
              </Card>
          )}

          <Card className="max-w-4xl mx-auto shadow-lg">
              {renderContent()}
          </Card>
      </div>
  );
}
