
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentFullInfo, createCertificateOrder } from '@/lib/api';
import type { FullStudentData, StudentEnrollment, CreateCertificateOrderPayload } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, CheckCircle, Award, Loader2, Home, Truck, Copy, AlertCircle } from 'lucide-react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";


const addressFormSchema = z.object({
  addressLine1: z.string().min(5, { message: "Address Line 1 must be at least 5 characters." }),
  addressLine2: z.string().optional(),
  city: z.string().min(3, { message: "City must be at least 3 characters." }),
  district: z.string().min(3, { message: "District must be at least 3 characters." }),
  phone: z.string().regex(/^(\+94|0)?\d{9}$/, { message: "Please enter a valid Sri Lankan phone number." }),
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

type OrderStep = 'loading' | 'selection' | 'form' | 'confirmation' | 'success' | 'error';

export default function CertificateOrderPage() {
  const { user } = useAuth();
  const [step, setStep] = useState<OrderStep>('loading');
  const [selectedEnrollments, setSelectedEnrollments] = useState<StudentEnrollment[]>([]);
  const [addressData, setAddressData] = useState<AddressFormValues | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);

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
    queryKey: ['studentFullInfoForCertOrder', 'PA15002'],
    queryFn: () => getStudentFullInfo('PA15002'),
    enabled: true,
    retry: 1,
  });

  const eligibleEnrollments = useMemo(() => {
    if (!studentData) return [];
    return Object.values(studentData.studentEnrollments).filter(e => e.certificate_eligibility);
  }, [studentData]);

  useEffect(() => {
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
      // Pre-populate form with student's existing address
      form.reset({
        addressLine1: studentData.studentInfo.address_line_1 || "",
        addressLine2: studentData.studentInfo.address_line_2 || "",
        city: studentData.studentInfo.city || "",
        district: studentData.studentInfo.district || "",
        phone: studentData.studentInfo.telephone_1 || "",
      });

      if (eligibleEnrollments.length > 0) {
        // Pre-select all eligible enrollments
        setSelectedEnrollments(eligibleEnrollments);
        setStep('selection');
      } else {
        setErrorMessage("You do not have any courses eligible for a certificate at this time.");
        setStep('error');
      }
    }
  }, [isLoadingStudent, isError, studentData, error, eligibleEnrollments, form]);


  const createOrderMutation = useMutation({
    mutationFn: (payload: CreateCertificateOrderPayload) => createCertificateOrder(payload),
    onSuccess: (data) => {
        setReferenceNumber(data.reference_number || data.id);
        setStep('success');
        toast({
            title: 'Order Submitted!',
            description: `Your certificate request has been received.`,
        });
    },
    onError: (err: Error) => {
        setErrorMessage(err.message || 'An unknown error occurred while submitting your order.');
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
    setStep('form');
  };

  const handleFormSubmit = (values: AddressFormValues) => {
    setAddressData(values);
    setStep('confirmation');
  };

  const handleConfirmAndSubmit = () => {
    if (!user || !addressData || selectedEnrollments.length === 0) {
      setErrorMessage("Missing required information to submit the order.");
      setStep('error');
      return;
    }

    const courseCodes = selectedEnrollments.map(e => e.course_code).join(',');

    const payload: CreateCertificateOrderPayload = {
      created_by: user.username!,
      course_code: courseCodes,
      mobile: addressData.phone,
      address_line1: addressData.addressLine1,
      address_line2: addressData.addressLine2 || '',
      city_id: addressData.city, // Assuming city name is used as ID for now
      district: addressData.district,
      type: 'courier',
      payment: 'unpaid', // Defaulting to unpaid
      package_id: 'default', // Placeholder
      certificate_id: 'pending', // Placeholder
      certificate_status: 'Pending',
      cod_amount: '0.00', // Placeholder
      is_active: '1',
    };
    
    createOrderMutation.mutate(payload);
  };
  
  const copyToClipboard = () => {
    if (referenceNumber) {
      navigator.clipboard.writeText(referenceNumber);
      toast({ title: 'Copied!', description: 'Reference number copied to clipboard.' });
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'loading':
        return (
          <CardContent className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        );

      case 'selection':
        return (
          <>
            <CardHeader>
              <CardTitle>Step 1: Select Your Course(s)</CardTitle>
              <CardDescription>Review and confirm the courses you are requesting a certificate for. Only eligible courses are shown.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {eligibleEnrollments.map(enrollment => (
                <div key={enrollment.id} className="flex items-center space-x-3 p-4 border rounded-md">
                   <Checkbox 
                     id={enrollment.id} 
                     checked={selectedEnrollments.some(e => e.id === enrollment.id)}
                     onCheckedChange={(checked) => {
                         setSelectedEnrollments(prev => 
                             checked ? [...prev, enrollment] : prev.filter(e => e.id !== enrollment.id)
                         );
                     }}
                   />
                   <Label htmlFor={enrollment.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {enrollment.parent_course_name} <span className="text-xs text-muted-foreground">({enrollment.course_code})</span>
                   </Label>
                </div>
              ))}
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
                <CardTitle>Step 2: Enter Your Delivery Address</CardTitle>
                <CardDescription>Please provide the address where you would like to receive your certificate(s).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="addressLine1" render={({ field }) => ( <FormItem><FormLabel>Address Line 1</FormLabel><FormControl><Input placeholder="e.g., No. 123, Main Street" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="addressLine2" render={({ field }) => ( <FormItem><FormLabel>Address Line 2 (Optional)</FormLabel><FormControl><Input placeholder="e.g., Apartment 4B, Near the junction" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="city" render={({ field }) => ( <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="e.g., Colombo" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="district" render={({ field }) => ( <FormItem><FormLabel>District</FormLabel><FormControl><Input placeholder="e.g., Colombo" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="e.g., 0771234567" {...field} /></FormControl><FormMessage /></FormItem> )} />
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
              <CardDescription>Please review all the details below before submitting your request.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <h3 className="font-semibold text-foreground flex items-center gap-2"><Award className="h-5 w-5 text-primary"/>Requested Certificate(s)</h3>
                    <ul className="list-disc list-inside pl-2 text-muted-foreground text-sm">
                        {selectedEnrollments.map(e => <li key={e.id}>{e.parent_course_name}</li>)}
                    </ul>
                </div>
                <div className="space-y-2">
                    <h3 className="font-semibold text-foreground flex items-center gap-2"><Truck className="h-5 w-5 text-primary"/>Delivery Address</h3>
                    <div className="text-sm text-muted-foreground pl-4 border-l-2 border-primary ml-2">
                        <p>{addressData?.addressLine1}</p>
                        {addressData?.addressLine2 && <p>{addressData.addressLine2}</p>}
                        <p>{addressData?.city}, {addressData?.district}</p>
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
              <CardDescription>Your certificate order has been successfully placed. You will be notified once it is processed.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">Your Reference Number is:</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                    <p className="text-2xl font-bold font-mono tracking-widest text-primary p-2 border-2 border-dashed rounded-lg">{referenceNumber}</p>
                    <Button variant="ghost" size="icon" onClick={copyToClipboard}><Copy className="h-5 w-5"/></Button>
                </div>
            </CardContent>
             <CardFooter className="justify-center">
              <Button asChild>
                <a href="/dashboard">
                  <Home className="mr-2 h-4 w-4" /> Back to Dashboard
                </a>
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
               <CardDescription>We couldn't process your request.</CardDescription>
            </CardHeader>
            <CardContent>
                <Alert variant="destructive">
                    <AlertTitle>Error Details</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
            </CardContent>
            <CardFooter className="justify-center">
              <Button asChild variant="outline">
                <a href="/dashboard">
                  <Home className="mr-2 h-4 w-4" /> Back to Dashboard
                </a>
              </Button>
            </CardFooter>
          </>
        )
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 pb-20">
       <header>
          <h1 className="text-3xl font-headline font-semibold">Request a Certificate</h1>
          <p className="text-muted-foreground">Follow the steps to order your course certificates.</p>
        </header>
      <Card className="w-full">
        {renderContent()}
      </Card>
    </div>
  );
}
