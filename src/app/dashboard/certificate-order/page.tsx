

"use client";

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentFullInfo, createCertificateOrder } from '@/lib/api';
import type { FullStudentData, StudentEnrollment } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, CheckCircle, Award, Loader2, Home, Truck, Copy, AlertCircle, XCircle, ChevronDown } from 'lucide-react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from '@/lib/utils';


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


const CityName = ({ cityId }: { cityId: string | undefined }) => {
    const { data: city, isLoading, isError } = useQuery<City>({
        queryKey: ['city', cityId],
        queryFn: () => getCityName(cityId!),
        enabled: !!cityId,
    });

    if (isLoading) return <Skeleton className="h-5 w-24 inline-block" />;
    if (isError) return <span className="text-destructive">Error</span>;
    return <span>{city?.name_en || 'Unknown City'}</span>;
};

const DistrictName = ({ districtId }: { districtId: string | undefined }) => {
    const { data: district, isLoading, isError } = useQuery<District>({
        queryKey: ['district', districtId],
        queryFn: () => getDistrictName(districtId!),
        enabled: !!districtId,
    });

    if (isLoading) return <Skeleton className="h-5 w-24 inline-block" />;
    if (isError) return <span className="text-destructive">Error</span>;
    return <span>{district?.name_en || 'Unknown District'}</span>;
};


export default function CertificateOrderPage() {
  const { user } = useAuth();
  const [step, setStep] = useState<OrderStep>('loading');
  const [selectedEnrollments, setSelectedEnrollments] = useState<StudentEnrollment[]>([]);
  const [deselectedEligible, setDeselectedEligible] = useState<StudentEnrollment[]>([]);
  const [addressData, setAddressData] = useState<AddressFormValues | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);
  const [cityName, setCityName] = useState('');
  const [districtName, setDistrictName] = useState('');


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
    queryKey: ['studentFullInfoForCertOrder', 'PA19218'],
    queryFn: () => getStudentFullInfo('PA19218'),
    enabled: !!user,
    retry: 1,
  });

  const allEnrollments = useMemo(() => {
    if (!studentData) return [];
    return Object.values(studentData.studentEnrollments);
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
        setErrorMessage("You do not have any courses to request a certificate for at this time.");
        setStep('error');
      }
    }
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
    if (!user || !user.username || !addressData || selectedEnrollments.length === 0) {
      setErrorMessage("Missing required information to submit the order.");
      setStep('error');
      return;
    }
    
    const submissionData = new FormData();
    submissionData.append("address_line1", addressData.addressLine1);
    submissionData.append("address_line2", addressData.addressLine2 || "");
    submissionData.append("city_id", cityName);
    submissionData.append("district", districtName);
    submissionData.append("mobile", addressData.phone);
    submissionData.append("created_by", "PA19218");
    submissionData.append("type", "1");
    submissionData.append("payment_amount", "0");
    submissionData.append("package_id", "default");
    submissionData.append("certificate_id", "0");
    submissionData.append("certificate_status", "Pending");

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
          </CardContent>
        );

      case 'selection':
        return (
          <>
            <CardHeader>
              <CardTitle>Step 1: Select Your Course(s)</CardTitle>
              <CardDescription>Review your course eligibility and select the certificates you wish to order.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {deselectedEligible.length > 0 && (
                     <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Warning</AlertTitle>
                        <AlertDescription>
                            You have deselected {deselectedEligible.length} course(s) for which you are eligible to receive a certificate. Please ensure this is intentional before proceeding.
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
                <CardTitle>Step 2: Enter Your Delivery Address</CardTitle>
                <CardDescription>Please provide the address where you would like to receive your certificate(s).</CardDescription>
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
                <div className="space-y-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2"><Award className="h-5 w-5 text-primary"/>Requested Certificate(s)</h3>
                    <div className="space-y-4">
                        {selectedEnrollments.map(enrollment => (
                            <div key={enrollment.id} className="p-3 border rounded-md">
                                <h4 className="font-semibold text-card-foreground">{enrollment.parent_course_name}</h4>
                                <p className="text-xs text-muted-foreground mb-2">Average Grade: {parseFloat(enrollment.assignment_grades.average_grade).toFixed(2)}%</p>
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
                            </div>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
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
      <Card className="shadow-lg w-full">
        {renderContent()}
      </Card>
    </div>
  );
}

