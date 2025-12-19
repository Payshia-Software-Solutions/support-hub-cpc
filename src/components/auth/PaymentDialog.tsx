'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, ArrowLeft, ArrowRight, User, MapPin, BadgeCheck, Phone, BookOpen, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from 'lucide-react';
import { parseNIC } from '@/lib/nic-parser';
import { useIsMobile } from '@/hooks/use-mobile';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


const STEPS = [
  { id: 1, title: 'Personal Info', icon: User },
  { id: 2, title: 'Address', icon: MapPin },
  { id: 3, title: 'Identity', icon: BadgeCheck },
  { id: 4, title: 'Contact', icon: Phone },
  { id: 5, title: 'Course', icon: BookOpen },
];

const courses = [
    { id: 'CS0001', name: 'Certificate Course in Pharmacy Practice', code: 'CS0001', duration: '6 months', fee: 'LKR 15000.00' },
    { id: 'CS0002', name: 'Advanced Course in Pharmacy Practice', code: 'CS0002', duration: '6 months', fee: 'LKR 18000.00' },
    { id: 'CS0003', name: 'Workshop in Pharmacy Practice', code: 'CS0003', duration: '1 Day', fee: 'LKR 2500.00' },
    { id: 'CS0004', name: 'Professional Pharmacy Practice', code: 'CS0004', duration: '6 Months', fee: 'LKR 25000.00' },
]

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const isMobile = useIsMobile();
  const [registrationId, setRegistrationId] = useState<string | null>(null);

  // Step 1 State
  const [civilStatus, setCivilStatus] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nameWithInitials, setNameWithInitials] = useState('');
  const [nameOnCertificate, setNameOnCertificate] = useState('');
  
  // Step 2 State
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  // Step 3 State
  const [nic, setNic] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState<Date | undefined>();

  // Step 4 State
  const [phone1, setPhone1] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  
  // Step 5 State
  const [selectedCourse, setSelectedCourse] = useState('');

  const [isRegistering, setIsRegistering] = useState(false);
  
  const validateStep = (step: number) => {
    const showValidationError = (message: string) => {
        toast({ variant: "destructive", title: "Missing Information", description: message });
    };

    switch (step) {
        case 1:
            if (!civilStatus || !firstName || !lastName || !nameWithInitials || !nameOnCertificate) {
                showValidationError("Please fill all personal information fields.");
                return false;
            }
            break;
        case 2:
            if (!address || !city) {
                showValidationError("Please provide your full address and city.");
                return false;
            }
            break;
        case 3:
            if (!nic || !gender || !dob) {
                showValidationError("Please provide your NIC, gender, and date of birth.");
                return false;
            }
            break;
        case 4:
            if (!phone1 || !email) {
                showValidationError("Please provide your primary phone number and email address.");
                return false;
            }
            // Basic email validation
            if (!/\S+@\S+\.\S+/.test(email)) {
                showValidationError("Please enter a valid email address.");
                return false;
            }
            break;
        case 5:
             if (!selectedCourse) {
                showValidationError("Please select a course to enroll in.");
                return false;
            }
            break;
        default:
            return true;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
        setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };
  
  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleNicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNic = e.target.value;
    setNic(newNic);
    if (newNic.length >= 10) { 
        const result = parseNIC(newNic);
        if (result.error) {
            setDob(undefined);
            setGender(result.gender || '');
        } else {
            if (result.birthday) {
                const [year, month, day] = result.birthday.split('-').map(Number);
                setDob(new Date(year, month - 1, day));
            }
            if (result.gender) {
                setGender(result.gender);
            }
        }
    } else {
        setDob(undefined);
        setGender('');
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(STEPS.length)) {
      return;
    }

    setIsRegistering(true);
    
    const payload = {
        email_address: email,
        civil_status: civilStatus,
        first_name: firstName,
        last_name: lastName,
        password: 'defaultPassword',
        nic_number: nic,
        phone_number: phone1,
        whatsapp_number: whatsapp || phone1,
        address_l1: address.split(',')[0] || '',
        address_l2: address.split(',').slice(1).join(',').trim() || '',
        city: city,
        district: 'N/A', // Placeholder
        postal_code: 'N/A', // Placeholder
        paid_amount: 0,
        aprroved_status: 'Not Approved',
        created_at: new Date().toISOString(),
        full_name: `${firstName} ${lastName}`,
        name_with_initials: nameWithInitials,
        gender: gender,
        index_number: '000', // Placeholder
        name_on_certificate: nameOnCertificate,
        selected_course: selectedCourse,
    };

    try {
      const response = await fetch('https://qa-api.pharmacollege.lk/temp-users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || data.message || `Request failed with status ${response.status}`);
      }

      toast({
        title: "Registration Successful!",
        description: "Your application has been submitted for review.",
      });

      setRegistrationId(data.user_id);
      setCurrentStep(STEPS.length + 1); // Move to success step

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Could not submit your registration.",
      });
    } finally {
      setIsRegistering(false);
    }
  };
  
  const DatePickerField = () => {
    if (isMobile) {
        return (
             <Input
                type="date"
                className="w-full h-10"
                value={dob ? format(dob, 'yyyy-MM-dd') : ''}
                onChange={(e) => setDob(e.target.value ? new Date(e.target.value) : undefined)}
            />
        )
    }
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                variant={"outline"}
                className={cn(
                    "w-full justify-start text-left font-normal",
                    !dob && "text-muted-foreground"
                )}
                >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dob ? format(dob, "PPP") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    captionLayout="dropdown-buttons"
                    fromYear={1960}
                    toYear={new Date().getFullYear()}
                    selected={dob}
                    onSelect={setDob}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    )
  }

  return (
    <div className={cn("flex min-h-screen items-center justify-center p-4", "bg-background")}>
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <Image src="https://content-provider.pharmacollege.lk/app-icon/android-chrome-192x192.png" alt="Ceylon Pharma College Logo" width={64} height={64} className="w-16 h-16" />
            </div>
          <CardTitle className="text-2xl font-headline">Student Registration</CardTitle>
          {currentStep <= STEPS.length && (
            <div className="flex items-start justify-center pt-8 pb-4">
              <div className="flex w-full max-w-md items-center justify-between">
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
            {currentStep > STEPS.length ? (
                <div className="text-center p-8 flex flex-col items-center gap-4 animate-in fade-in-50">
                    <Check className="w-16 h-16 bg-green-100 text-green-600 p-2 rounded-full"/>
                    <h2 className="text-2xl font-bold">Registration Submitted!</h2>
                    <p className="text-muted-foreground">Your application has been received. Your reference ID is below. Please keep it for your records.</p>
                    <div className="p-3 border-2 border-dashed rounded-lg bg-muted">
                        <p className="font-mono text-2xl font-bold text-primary tracking-widest">{registrationId}</p>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {currentStep === 1 && (
                        <div className="space-y-4 animate-in fade-in-50">
                            <div className="space-y-2">
                                <Label>Civil Status</Label>
                                <Select value={civilStatus} onValueChange={setCivilStatus} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Civil Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Single">Single</SelectItem>
                                        <SelectItem value="Married">Married</SelectItem>
                                        <SelectItem value="Divorced">Divorced</SelectItem>
                                        <SelectItem value="Widowed">Widowed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2"><Label>First Name</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required /></div>
                            <div className="space-y-2"><Label>Last Name</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} required /></div>
                            <div className="space-y-2"><Label>Name with Initials</Label><Input value={nameWithInitials} onChange={(e) => setNameWithInitials(e.target.value)} required /></div>
                            <div className="space-y-2"><Label>Name on Certificate</Label><Input value={nameOnCertificate} onChange={(e) => setNameOnCertificate(e.target.value)} required /></div>
                        </div>
                    )}
                    {currentStep === 2 && (
                        <div className="space-y-4 animate-in fade-in-50">
                            <div className="space-y-2"><Label>Street Address</Label><Textarea value={address} onChange={(e) => setAddress(e.target.value)} required /></div>
                            <div className="space-y-2"><Label>City</Label><Input value={city} onChange={(e) => setCity(e.target.value)} required /></div>
                        </div>
                    )}
                     {currentStep === 3 && (
                        <div className="space-y-4 animate-in fade-in-50">
                            <div className="space-y-2">
                                <Label>NIC Number</Label>
                                <Input value={nic} onChange={handleNicChange} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                <Label>Gender</Label>
                                <Select value={gender} onValueChange={setGender} required>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select your gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Date of Birth</Label>
                                    <DatePickerField />
                                </div>
                            </div>
                        </div>
                    )}
                    {currentStep === 4 && (
                         <div className="space-y-4 animate-in fade-in-50">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Phone Number</Label>
                                    <Input type="tel" value={phone1} onChange={(e) => setPhone1(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email Address</Label>
                                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </div>
                                 <div className="space-y-2">
                                    <Label>WhatsApp Number</Label>
                                    <Input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
                                </div>
                            </div>
                         </div>
                    )}
                    {currentStep === 5 && (
                        <div className="space-y-4 animate-in fade-in-50">
                            <div className="space-y-2">
                                <Label className="font-semibold">Select a Course:</Label>
                                 <RadioGroup value={selectedCourse} onValueChange={setSelectedCourse} className="space-y-2">
                                    {courses.map(course => (
                                        <Label key={course.id} htmlFor={course.id} className="flex items-start gap-4 p-4 border rounded-md cursor-pointer hover:bg-accent/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                                            <RadioGroupItem value={course.id} id={course.id} />
                                            <div className="text-left">
                                                <p className="font-medium text-card-foreground">{course.name}</p>
                                                <p className="text-sm text-muted-foreground">{course.code} | Duration: {course.duration}</p>
                                                <p className="text-sm text-muted-foreground">Course Fee: {course.fee}</p>
                                            </div>
                                        </Label>
                                    ))}
                                </RadioGroup>
                            </div>
                        </div>
                    )}
                </form>
            )}
        </CardContent>
        <CardFooter className="flex items-center gap-2 pt-8">
            {currentStep <= STEPS.length ? (
                <>
                    {currentStep > 1 && (
                        <Button type="button" variant="outline" onClick={handlePrevStep} disabled={isRegistering}>
                            <ArrowLeft className="mr-2 h-4 w-4"/> Back
                        </Button>
                    )}
                    {currentStep < STEPS.length ? (
                        <Button type="button" onClick={handleNextStep} className="flex-grow">
                            Next <ArrowRight className="ml-2 h-4 w-4"/>
                        </Button>
                    ) : (
                        <Button type="submit" form="registration-form" disabled={isRegistering} onClick={handleSubmit} className="flex-grow">
                            {isRegistering ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            {isRegistering ? 'Submitting...' : 'Complete Registration'}
                        </Button>
                    )}
                </>
            ) : (
                 <div className="w-full flex flex-col sm:flex-row gap-2">
                    <Button onClick={() => router.push(`/payment?registrationId=${registrationId}`)} className="flex-1">
                        Proceed to Payment
                    </Button>
                    <Button asChild variant="outline" className="flex-1">
                        <Link href="/login">Go to Login</Link>
                    </Button>
                </div>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}