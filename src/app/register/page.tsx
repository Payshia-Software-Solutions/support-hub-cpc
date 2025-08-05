
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, ArrowLeft, ArrowRight, User, MapPin, Calendar, Phone, BookOpen, Upload } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const STEPS = [
  { id: 1, title: 'Basic Information', icon: User },
  { id: 2, title: 'Address Details', icon: MapPin },
  { id: 3, title: 'Personal Details', icon: Calendar },
  { id: 4, title: 'Contact Details', icon: Phone },
  { id: 5, title: 'Course & Payment', icon: BookOpen },
];

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');

  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [nic, setNic] = useState('');

  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');

  const [course, setCourse] = useState('');
  const [paymentSlip, setPaymentSlip] = useState<File | null>(null);

  const [isRegistering, setIsRegistering] = useState(false);
  
  const progressValue = (currentStep / STEPS.length) * 100;

  const handleNextStep = () => {
    // Add validation logic for each step before proceeding
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  };
  
  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation before submit
    if (currentStep !== STEPS.length) {
      toast({ variant: "destructive", title: "Incomplete Form", description: "Please complete all steps before submitting." });
      return;
    }

    setIsRegistering(true);
    
    // In a real app, this would call an API endpoint.
    setTimeout(() => {
        console.log("Registering user with all details");
        toast({
            title: "Registration Successful!",
            description: "Your application has been submitted for review.",
        });
        router.push('/login');
        setIsRegistering(false);
    }, 2000);
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <Image src="https://content-provider.pharmacollege.lk/app-icon/android-chrome-192x192.png" alt="SOS App Logo" width={64} height={64} className="w-16 h-16" />
            </div>
          <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
          <CardDescription>
            Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}
          </CardDescription>
           <Progress value={progressValue} className="w-full mt-4" />
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in-50">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>First Name</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required /></div>
                        <div className="space-y-2"><Label>Last Name</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} required /></div>
                     </div>
                     <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                     <div className="space-y-2"><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                     <div className="space-y-2"><Label>Confirm Password</Label><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></div>
                </div>
            )}
            {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in-50">
                    <div className="space-y-2"><Label>Address Line 1</Label><Input value={address1} onChange={(e) => setAddress1(e.target.value)} required /></div>
                    <div className="space-y-2"><Label>Address Line 2</Label><Input value={address2} onChange={(e) => setAddress2(e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>City</Label><Input value={city} onChange={(e) => setCity(e.target.value)} required /></div>
                        <div className="space-y-2"><Label>District</Label><Input value={district} onChange={(e) => setDistrict(e.target.value)} required /></div>
                    </div>
                </div>
            )}
             {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in-50">
                    <div className="space-y-2"><Label>Gender</Label><Input value={gender} onChange={(e) => setGender(e.target.value)} placeholder="e.g. Male/Female" required /></div>
                    <div className="space-y-2"><Label>Date of Birth</Label><Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required /></div>
                    <div className="space-y-2"><Label>NIC Number</Label><Input value={nic} onChange={(e) => setNic(e.target.value)} required /></div>
                </div>
            )}
             {currentStep === 4 && (
                <div className="space-y-4 animate-in fade-in-50">
                    <div className="space-y-2"><Label>Primary Phone Number</Label><Input type="tel" value={phone1} onChange={(e) => setPhone1(e.target.value)} required /></div>
                    <div className="space-y-2"><Label>Secondary Phone (Optional)</Label><Input type="tel" value={phone2} onChange={(e) => setPhone2(e.target.value)} /></div>
                </div>
            )}
            {currentStep === 5 && (
                <div className="space-y-4 animate-in fade-in-50">
                    <div className="space-y-2"><Label>Select Course</Label><Input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g. Certificate Course in Pharmacy Practice" required /></div>
                    <div className="space-y-2">
                        <Label>Payment Slip</Label>
                        <div className="flex items-center gap-2 p-2 border rounded-lg">
                            <Upload className="h-5 w-5 text-muted-foreground"/>
                            <Input type="file" onChange={(e) => setPaymentSlip(e.target.files ? e.target.files[0] : null)} className="border-0 shadow-none file:mr-2 file:rounded-full file:bg-primary/10 file:text-primary file:font-semibold file:border-0 file:px-2 file:py-1 file:text-xs" required />
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center pt-4">
                 <Button type="button" variant="outline" onClick={handlePrevStep} disabled={currentStep === 1 || isRegistering}>
                    <ArrowLeft className="mr-2 h-4 w-4"/> Back
                </Button>
                {currentStep < STEPS.length ? (
                    <Button type="button" onClick={handleNextStep}>
                        Next <ArrowRight className="ml-2 h-4 w-4"/>
                    </Button>
                ) : (
                    <Button type="submit" disabled={isRegistering}>
                        {isRegistering ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        {isRegistering ? 'Submitting...' : 'Complete Registration'}
                    </Button>
                )}
            </div>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
            <p className="w-full">
                Already have an account?{' '}
                <Link href="/login" className="text-primary font-semibold hover:underline">
                    Log In
                </Link>
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
