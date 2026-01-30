
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentFullInfo } from '@/lib/actions/users';
import { createCertificateOrder } from '@/lib/actions/certificates';
import type { FullStudentData, StudentEnrollment } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, CheckCircle, Award, Loader2, Home, Truck, Copy, AlertCircle, XCircle, ChevronDown, ListOrdered, PlusCircle, FileText, Sparkles, ScrollText, Check } from 'lucide-react';
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
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);
  const [cityName, setCityName] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  
  const [orderGarland, setOrderGarland] = useState(false);
  const [orderScroll, setOrderScroll] = useState(false);
  const [orderCertificateFile, setOrderCertificateFile] = useState(false);
  const [paymentSlip, setPaymentSlip] = useState<File | null>(null);
  
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

  const allEnrollments = useMemo(() => {
    if (!studentData) return [];
    return Object.values(studentData.studentEnrollments);
  }, [studentData]);
  
  const resetAllState = () => {
    setStep('loading');
    setSelectedEnrollments([]);
    setDeselectedEligible([]);
    setAddressData(null);
    setErrorMessage('');
    form.reset();
  };

  useEffect(() => {
    resetAllState();
    if (isLoadingStudent) {
      setStep('loading');
      return;
    }
    if (isError) {
      setErrorMessage(error.message);
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
      
      if (allEnrollments.length > 0) {
        const eligibleEnrollments = allEnrollments.filter(e => e.certificate_eligibility);
        setSelectedEnrollments(eligibleEnrollments);
        setDeselectedEligible([]);
        setStep('selection');
      } else {
        setErrorMessage("You do not have any courses eligible for a certificate request at this time.");
        setStep('error');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingStudent, isError, studentData, error, allEnrollments, form]);


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
        setErrorMessage(err.message || 'An unknown error occurred while submitting the order.');
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

  const handleConfirmAndSubmit = () => {
    const studentUsername = studentData?.studentInfo.username;
    if (!studentUsername || !addressData || selectedEnrollments.length === 0) {
      setErrorMessage("Missing required information to submit the order.");
      setStep('error');
      return;
    }
     if (totalPrice > 0 && !paymentSlip) {
      setErrorMessage("Payment slip is required for orders with additional items.");
      setStep('error');
      return;
    }
    
    const submissionData = new FormData();
    submissionData.append("address_line1", addressData.addressLine1);
    submissionData.append("address_line2", addressData.addressLine2 || "");
    submissionData.append("city_id", cityName);
    submissionData.append("district", districtName);
    submissionData.append("mobile", addressData.phone);
    submissionData.append("created_by", studentUsername);
    submissionData.append("type", "1");
    submissionData.append("payment_amount", String(totalPrice));
    submissionData.append("package_id", "default");
    submissionData.append("certificate_id", "0");
    submissionData.append("certificate_status", "Pending");

    if (orderGarland) submissionData.append("garland", "1");
    if (orderScroll) submissionData.append("scroll", "1");
    if (orderCertificateFile) submissionData.append("certificate_file", "1");
    if (paymentSlip) submissionData.append("image", paymentSlip);

    selectedEnrollments.forEach((enrollment) => {
      submissionData.append("course_id[]", enrollment.parent_course_id);
    });
    
    createOrderMutation.mutate(submissionData);
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
                        <div className="space-y-2">
                            <Label htmlFor="payment-slip" className="text-base font-semibold">Upload Payment Slip</Label>
                            <Input id="payment-slip" type="file" required={totalPrice > 0} onChange={e => setPaymentSlip(e.target.files ? e.target.files[0] : null)} />
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
              <CardDescription>Please review all the details below before submitting the request.</CardDescription>
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
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Slip Uploaded: {paymentSlip?.name}
                        </p>
                    </div>
                )}
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
              <Button onClick={handleConfirmAndSubmit} disabled={createOrderMutation.isPending}>
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
               <AlertCircle className="h-16 w-16 text-destructive mb-4" />
               <CardTitle>An Error Occurred</CardTitle>
               <CardDescription>We couldn't process the request.</CardDescription>
            </CardHeader>
            <CardContent>
                <Alert variant="destructive">
                    <AlertTitle>Error Details</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
            </CardContent>
            <CardFooter className="justify-center">
              <Button asChild variant="outline">
                <Link href="/dashboard/certificate-order">
                  <Home className="mr-2 h-4 w-4" /> Back to Order History
                </Link>
              </Button>
            </CardFooter>
          </>
        )
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
