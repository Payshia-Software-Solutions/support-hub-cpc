
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentFullInfo } from '@/lib/actions/users';
import { createCertificateOrder, getConvocationRegistrationsByStudent, getCertificateOrdersByStudent } from '@/lib/actions/certificates';
import type { FullStudentData, StudentEnrollment, ConvocationRegistration, CertificateOrder } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, CheckCircle, Award, Loader2, Home, Truck, Copy, AlertCircle, XCircle, ChevronDown, ListOrdered, PlusCircle, FileText, Sparkles, ScrollText, Check, Paperclip } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const addressFormSchema = z.object({
  addressLine1: z.string().min(5, { message: "Address Line 1 must be at least 5 characters." }),
  addressLine2: z.string().optional(),
  city: z.string().min(1, { message: "City is required." }),
  district: z.string().min(1, { message: "District is required." }),
  phone: z.string().regex(/^(\+94|0)?\d{9}$/, { message: "Please enter a valid Sri Lankan phone number." }),
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

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

const GARLAND_PRICE = 2000;
const SCROLL_PRICE = 1000;
const CERTIFICATE_FILE_PRICE = 750;


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

export default function CreateCertificateOrderPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<OrderStep>('loading');
  const [selectedEnrollments, setSelectedEnrollments] = useState<StudentEnrollment[]>([]);
  const [deselectedEligible, setDeselectedEligible] = useState<StudentEnrollment[]>([]);
  const [addressData, setAddressData] = useState<AddressFormValues | null>(null);
  const [errorDetails, setErrorDetails] = useState<{ message: string; enrollments?: StudentEnrollment[] } | null>(null);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);
  const [cityName, setCityName] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  
  const [orderGarland, setOrderGarland] = useState(false);
  const [orderScroll, setOrderScroll] = useState(false);
  const [orderCertificateFile, setOrderCertificateFile] = useState(false);
  const [paymentSlip, setPaymentSlip] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const totalPrice = useMemo(() => {
    let total = 0;
    if (orderGarland) total += GARLAND_PRICE;
    if (orderScroll) total += SCROLL_PRICE;
    if (orderCertificateFile) total += CERTIFICATE_FILE_PRICE;
    return total;
  }, [orderGarland, orderScroll, orderCertificateFile]);

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      addressLine1: "",
      addressLine2: "",
      city: "",
      district: "",
      phone: "",
    },
  });

  const { data: studentData, isLoading: isLoadingStudent, isError, error } = useQuery<FullStudentData>({
    queryKey: ['studentFullInfoForCertOrder', user?.username],
    queryFn: () => getStudentFullInfo(user!.username!),
    enabled: !!user?.username,
    retry: 1,
  });

  const { data: convocationBookings, isLoading: isLoadingBookings } = useQuery<ConvocationRegistration[]>({
    queryKey: ['studentConvocationBookingsForCertOrder', user?.username],
    queryFn: () => getConvocationRegistrationsByStudent(user!.username!),
    enabled: !!user?.username,
  });
  
  const { data: certificateOrders, isLoading: isLoadingOrders } = useQuery<CertificateOrder[]>({
    queryKey: ['studentCertificateOrders', user?.username],
    queryFn: () => getCertificateOrdersByStudent(user!.username!),
    enabled: !!user?.username,
  });

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
  
  const allEnrollments = useMemo(() => {
    if (!studentData) return [];
    return Object.values(studentData.studentEnrollments);
  }, [studentData]);
  
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
    setSelectedEnrollments([]);
    setDeselectedEligible([]);
    setErrorDetails(null);
    form.reset();
  };

  useEffect(() => {
    resetAllState();
    const isLoading = isLoadingStudent || isLoadingBookings || isLoadingOrders;
    if (isLoading) {
      setStep('loading');
      return;
    }
    if (isError) {
      setErrorDetails({ message: error.message });
      setStep('error');
      return;
    }
    if (studentData) {
        
      const cityId = studentData.studentInfo.city || "";
      
      form.reset({
        addressLine1: studentData.studentInfo.address_line_1 || "",
        addressLine2: studentData.studentInfo.address_line_2 || "",
        city: cityId,
        district: studentData.studentInfo.district || "",
        phone: studentData.studentInfo.telephone_1 || "",
      });

      if (cityId) {
          getCityName(cityId).then(city => {
              setCityName(city.name_en);
              if (city.district_id) {
                  form.setValue('district', city.district_id);
                  getDistrictName(city.district_id).then(district => {
                      setDistrictName(district.name_en);
                  }).catch(() => setDistrictName(''));
              }
          }).catch(() => setCityName(''));
      }
      
      const hasActiveOrder = certificateOrders && certificateOrders.some(order => order.certificate_status === 'Pending' || order.certificate_status === 'Printed');

      if (hasActiveOrder) {
          setErrorDetails({ message: "You already have an active certificate order. Please wait for it to be completed before placing a new one." });
          setStep('error');
          return;
      }
      
      if (allEnrollments.length > 0) {
        const eligibleEnrollments = allEnrollments.filter(e => e.certificate_eligibility);
        const availableForOrder = eligibleEnrollments.filter(e => 
            !activeBookedCourseIds.has(e.parent_course_id)
        );

        if (availableForOrder.length === 0) {
             setErrorDetails({
                message: "All your eligible courses have either been booked for convocation or already have a pending certificate order. There are no new courses available to order at this time.",
                enrollments: allEnrollments
             });
            setStep('error');
            return;
        }

        setSelectedEnrollments(availableForOrder);
        setDeselectedEligible([]);
        setStep('selection');
      } else {
        setErrorDetails({ message: "You have no course enrollments." });
        setStep('error');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingStudent, isLoadingBookings, isLoadingOrders, isError, studentData, error]);


  const createOrderMutation = useMutation({
    mutationFn: (payload: FormData) => createCertificateOrder(payload),
    onSuccess: (data) => {
        setReferenceNumber(data.reference_number || data.id);
        setStep('success');
        toast({
            title: 'Order Submitted!',
            description: `Your certificate request has been received.`,
        });
    },
    onError: (err: Error) => {
        setErrorDetails({ message: err.message || 'An unknown error occurred while submitting the order.' });
        setStep('error');
    }
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

  const handleFormSubmit = (values: AddressFormValues) => {
    if (totalPrice > 0 && !paymentSlip) {
        toast({
            variant: "destructive",
            title: "Payment Slip Required",
            description: "Please upload your payment slip for the additional items.",
        });
        return;
    }
    setAddressData(values);
    setStep('confirmation');
  };
  
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast({
                    variant: "destructive",
                    title: "File too large",
                    description: "Please select a file smaller than 5MB.",
                });
                if (fileInputRef.current) fileInputRef.current.value = "";
                return;
            }
            setPaymentSlip(file);
        }
    };


  const handleConfirmAndSubmit = () => {
    const studentUsername = user?.username;
    if (!studentUsername || !addressData || selectedEnrollments.length === 0) {
      setErrorDetails({ message: "Missing required information to submit the order." });
      setStep('error');
      return;
    }
     if (totalPrice > 0 && !paymentSlip) {
      setErrorDetails({ message: "Payment slip is required for orders with additional items." });
      setStep('error');
      return;
    }
    
    const formData = new FormData();
    formData.append("created_by", studentUsername);
    formData.append("mobile", addressData.phone);
    formData.append("address_line1", addressData.addressLine1);
    formData.append("address_line2", addressData.addressLine2 || "");
    formData.append("city_id", addressData.city);
    formData.append("district", districtName);
    formData.append("type", "Delivery");
    formData.append("payment_amount", String(totalPrice));
    formData.append("package_id", "1"); // Default package ID
    formData.append("certificate_id", "0");
    formData.append("certificate_status", "Pending");
    formData.append("is_active", "1");
    
    selectedEnrollments.forEach(enrollment => {
        formData.append("course_id[]", enrollment.parent_course_id);
    });

    if (orderGarland) formData.append("garlent", "1");
    if (orderScroll) formData.append("scroll", "1");
    if (orderCertificateFile) formData.append("certificate_file", "1");
    
    if (paymentSlip) {
        formData.append("payment_slip", paymentSlip);
    }
    
    createOrderMutation.mutate(formData);
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
              <Button variant="ghost" onClick={() => router.push('/dashboard/certificate-order')} className="w-fit h-auto p-0 mb-2 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to History
              </Button>
              <CardTitle>Step 1: Select Your Course(s)</CardTitle>
              <CardDescription>Review course eligibility and select the certificates to order for {studentData?.studentInfo.full_name}.</CardDescription>
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
                    const isBookedForConvocation = activeBookedCourseIds.has(enrollment.parent_course_id);
                    const isDisabled = !isEligible || isBookedForConvocation;

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
                                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">Booked for Convocation</Badge>
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
              <Button onClick={handleSelectionSubmit} disabled={selectedEnrollments.length === 0}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </>
        );
      
      case 'form':
        return (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)}>
              <CardHeader>
                  <Button variant="ghost" onClick={() => setStep('selection')} className="w-fit h-auto p-0 mb-2 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Selection
                  </Button>
                <CardTitle>Step 2: Delivery & Payment</CardTitle>
                <CardDescription>Provide the delivery address and payment details if required.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="addressLine1" render={({ field }) => ( <FormItem><FormLabel>Address Line 1</FormLabel><FormControl><Input placeholder="e.g., No. 123, Main Street" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="addressLine2" render={({ field }) => ( <FormItem><FormLabel>Address Line 2 (Optional)</FormLabel><FormControl><Input placeholder="e.g., Apartment 4B, Near the junction" {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                        <Input 
                            placeholder="e.g., Colombo" 
                            value={cityName}
                            onChange={(e) => {
                                setCityName(e.target.value);
                            }}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                 <FormItem>
                    <FormLabel>District</FormLabel>
                    <FormControl>
                        <Input 
                            placeholder="e.g., Colombo" 
                            value={districtName}
                            onChange={(e) => {
                                setDistrictName(e.target.value);
                            }}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="e.g., 0771234567" {...field} /></FormControl><FormMessage /></FormItem> )} />

                <div className="space-y-4 pt-6 border-t">
                    <h3 className="font-semibold text-foreground">Additional Items (Optional)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Label htmlFor="garland" className={cn("block border rounded-lg p-4 cursor-pointer relative transition-all", orderGarland && "ring-2 ring-primary border-primary")}>
                            <Checkbox id="garland" checked={orderGarland} onCheckedChange={(checked) => setOrderGarland(Boolean(checked))} className="sr-only"/>
                            {orderGarland && (<div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5"><Check className="h-3 w-3" /></div>)}
                            <div className="flex flex-col items-center gap-2 text-center">
                                <Sparkles className="h-8 w-8 text-primary"/>
                                <p className="font-semibold text-sm">Order Garland</p>
                                <p className="text-xs text-muted-foreground">LKR {GARLAND_PRICE.toFixed(2)}</p>
                            </div>
                        </Label>
                        <Label htmlFor="scroll" className={cn("block border rounded-lg p-4 cursor-pointer relative transition-all", orderScroll && "ring-2 ring-primary border-primary")}>
                            <Checkbox id="scroll" checked={orderScroll} onCheckedChange={(checked) => setOrderScroll(Boolean(checked))} className="sr-only"/>
                             {orderScroll && (<div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5"><Check className="h-3 w-3" /></div>)}
                             <div className="flex flex-col items-center gap-2 text-center">
                                <ScrollText className="h-8 w-8 text-primary"/>
                                <p className="font-semibold text-sm">Order Scroll</p>
                                <p className="text-xs text-muted-foreground">LKR {SCROLL_PRICE.toFixed(2)}</p>
                            </div>
                        </Label>
                        <Label htmlFor="certificate_file" className={cn("block border rounded-lg p-4 cursor-pointer relative transition-all", orderCertificateFile && "ring-2 ring-primary border-primary")}>
                            <Checkbox id="certificate_file" checked={orderCertificateFile} onCheckedChange={(checked) => setOrderCertificateFile(Boolean(checked))} className="sr-only"/>
                            {orderCertificateFile && (<div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5"><Check className="h-3 w-3" /></div>)}
                            <div className="flex flex-col items-center gap-2 text-center">
                                <FileText className="h-8 w-8 text-primary"/>
                                <p className="font-semibold text-sm">Certificate File</p>
                                <p className="text-xs text-muted-foreground">LKR {CERTIFICATE_FILE_PRICE.toFixed(2)}</p>
                            </div>
                        </Label>
                    </div>
                </div>
                
                {totalPrice > 0 && (
                  <div className="space-y-4 pt-6 border-t animate-in fade-in-50">
                    <div className="text-xl font-bold flex justify-between">
                        <span>Total Amount:</span>
                        <span className="text-primary">LKR {totalPrice.toLocaleString()}</span>
                    </div>
                     <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700/50 dark:text-blue-300">
                        <AlertCircle className="h-4 w-4 !text-blue-800 dark:!text-blue-300" />
                        <AlertTitle>Please Note</AlertTitle>
                        <AlertDescription>
                            <p>The total amount does not include the delivery fee. This will be charged upon delivery.</p>
                            <p className="mt-1">ඉහත මුළු මුදලට බෙදාහැරීමේ ගාස්තුව ඇතුළත් නොවේ. එය භාණ්ඩය ලැබුණු පසු අය කරනු ලැබේ.</p>
                        </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                        <Label className="text-base font-semibold">Upload Payment Slip</Label>
                        <div className="flex items-center justify-between p-2 pl-4 border rounded-md">
                            {paymentSlip ? (
                                <>
                                    <div className="flex items-center gap-2 truncate">
                                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground truncate">{paymentSlip.name}</span>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            setPaymentSlip(null);
                                            if (fileInputRef.current) fileInputRef.current.value = "";
                                        }}
                                        className="text-destructive hover:text-destructive h-7 w-7"
                                    >
                                        <XCircle className="h-5 w-5" />
                                    </Button>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">No file selected.</p>
                            )}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                className="shrink-0"
                            >
                                Choose File
                            </Button>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*,application/pdf"
                        />
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit">
                  Review Order <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </form>
          </Form>
        );

      case 'confirmation':
               return (
                  <>
                      <CardHeader>
                         <Button variant="ghost" onClick={() => setStep('form')} className="w-fit h-auto p-0 mb-2 text-sm text-muted-foreground hover:text-foreground">
                              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Edit
                          </Button>
                        <CardTitle>Step 3: Confirm Your Order</CardTitle>
                        <CardDescription>Please review all details below before submitting the request.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                          <div className="space-y-4">
                              <h3 className="font-semibold text-foreground flex items-center gap-2"><Award className="h-5 w-5 text-primary"/>Requested Certificate(s)</h3>
                              <div className="space-y-4">
                                  {selectedEnrollments.map(enrollment => (
                                      <div key={enrollment.id} className="p-3 border rounded-md">
                                          <h4 className="font-semibold text-card-foreground">{enrollment.parent_course_name}</h4>
                                          <p className="text-xs text-muted-foreground mb-2">Average Grade: {parseFloat(enrollment.assignment_grades.average_grade).toFixed(2)}%</p>
                                      </div>
                                  ))}
                              </div>
                          </div>
                          {(orderGarland || orderScroll || orderCertificateFile) && (
                              <div className="space-y-2 pt-4 border-t">
                                  <h3 className="font-semibold text-foreground">Additional Items</h3>
                                  <div className="text-sm text-muted-foreground space-y-1">
                                      {orderGarland && <div className="flex justify-between items-center"><span>Garland</span><span>LKR {GARLAND_PRICE.toFixed(2)}</span></div>}
                                      {orderScroll && <div className="flex justify-between items-center"><span>Scroll</span><span>LKR {SCROLL_PRICE.toFixed(2)}</span></div>}
                                      {orderCertificateFile && <div className="flex justify-between items-center"><span>Certificate File</span><span>LKR {CERTIFICATE_FILE_PRICE.toFixed(2)}</span></div>}
                                  </div>
                              </div>
                          )}
                          {totalPrice > 0 && (
                              <div className="space-y-2 pt-4 border-t">
                                  <h3 className="font-semibold text-foreground">Payment Details</h3>
                                  <div className="flex justify-between items-baseline">
                                      <p className="text-muted-foreground">Total:</p>
                                      <p className="text-2xl font-bold text-primary">LKR {totalPrice.toLocaleString()}</p>
                                  </div>
                                  {paymentSlip && (
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Slip Uploaded: {paymentSlip?.name}
                                    </p>
                                  )}
                              </div>
                          )}
                           <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700/50 dark:text-blue-300">
                              <AlertCircle className="h-4 w-4 !text-blue-800 dark:!text-blue-300" />
                              <AlertTitle>Please Note</AlertTitle>
                              <AlertDescription>
                                  <p>The total amount above does not include the delivery fee. This will be charged upon delivery.</p>
                                  <p className="mt-1">ඉහත මුළු මුදලට බෙදාහැරීමේ ගාස්තුව ඇතුළත් නොවේ. එය භාණ්ඩය ලැබුණු පසු අය කරනු ලැබේ.</p>
                              </AlertDescription>
                          </Alert>
                          <div className="space-y-2 pt-4 border-t">
                              <h3 className="font-semibold text-foreground flex items-center gap-2"><Truck className="h-5 w-5 text-primary"/>Delivery Address</h3>
                              <div className="text-sm text-muted-foreground pl-4 border-l-2 border-primary ml-2">
                                  <p>{addressData?.addressLine1}</p>
                                  {addressData?.addressLine2 && <p>{addressData.addressLine2}</p>}
                                  <p>{cityName}, {districtName}</p>
                                  <p>Phone: {addressData?.phone}</p>
                              </div>
                          </div>
                      </CardContent>
                      <CardFooter>
                        <Button size="lg" className="w-full" onClick={handleConfirmAndSubmit} disabled={createOrderMutation.isPending}>
                             {createOrderMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
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
              <CardDescription>The certificate order has been successfully placed. You will be notified of its status.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">Reference Number is:</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                    <p className="text-2xl font-bold font-mono tracking-widest text-primary p-2 border-2 border-dashed rounded-lg">{referenceNumber}</p>
                    <Button variant="ghost" size="icon" onClick={copyToClipboard}><Copy className="h-5 w-5"/></Button>
                </div>
            </CardContent>
             <CardFooter className="justify-center">
              <Button onClick={() => router.push('/dashboard/certificate-order')}>
                  <Home className="mr-2 h-4 w-4" /> View Order History
              </Button>
            </CardFooter>
          </>
        );

            case 'error':
                return (
                    <>
                        <CardHeader className="items-center text-center">
                           <AlertCircle className="w-16 h-16 text-destructive" />
                           <CardTitle>Order Not Available</CardTitle>
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
                                            statusBadge = <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">Booked for Convocation</Badge>;
                                        } else if (isOrdered) {
                                            statusBadge = <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">Already Ordered</Badge>;
                                        } else if (isEligible) {
                                            statusBadge = <Badge variant="default" className="bg-green-600">Eligible to Order</Badge>;
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
                            <Button asChild variant="outline"><Link href="/dashboard/certificate-order">Back to Orders</Link></Button>
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
                    You have not selected all eligible courses. Are you sure you want to proceed without ordering all available certificates?
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

