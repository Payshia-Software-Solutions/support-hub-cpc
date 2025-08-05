
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, ArrowLeft, ArrowRight, User, MapPin, Calendar as CalendarIcon, Phone, BookOpen, Upload, ChevronsUpDown, Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { format, addDays, startOfYear } from 'date-fns';


const STEPS = [
  { id: 1, title: 'Basic Information', icon: User },
  { id: 2, title: 'Address Details', icon: MapPin },
  { id: 3, title: 'Personal Details', icon: Calendar },
  { id: 4, title: 'Contact Details', icon: Phone },
  { id: 5, title: 'Course & Payment', icon: BookOpen },
];

interface City {
  id: string;
  name_en: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [cities, setCities] = useState<City[]>([]);
  const [isCityPopoverOpen, setIsCityPopoverOpen] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState<Date | undefined>();
  const [nic, setNic] = useState('');

  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');

  const [course, setCourse] = useState('');
  const [paymentSlip, setPaymentSlip] = useState<File | null>(null);

  const [isRegistering, setIsRegistering] = useState(false);
  
  useEffect(() => {
    async function fetchCities() {
      try {
        const response = await fetch('https://qa-api.pharmacollege.lk/cities');
        const data = await response.json();
        const cityList = Object.values(data).map((c: any) => ({ id: c.id, name_en: c.name_en }));
        setCities(cityList);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load cities',
          description: 'Could not fetch the list of cities. Please try again later.'
        });
      }
    }
    fetchCities();
  }, []);

  const progressValue = (currentStep / STEPS.length) * 100;

  const handleNextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  };
  
  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const parseNicAndSetDob = (nicValue: string) => {
    const nic = nicValue.trim().toUpperCase();
    let year: number;
    let dayOfYear: number;

    if (nic.length === 10 && (nic.endsWith('V') || nic.endsWith('X'))) {
        // Old NIC format: YYDDDXXXX(V/X)
        const yearDigits = parseInt(nic.substring(0, 2), 10);
        year = 1900 + yearDigits;
        dayOfYear = parseInt(nic.substring(2, 5), 10);
    } else if (nic.length === 12) {
        // New NIC format: YYYYDDDXXXXX
        year = parseInt(nic.substring(0, 4), 10);
        dayOfYear = parseInt(nic.substring(4, 7), 10);
    } else {
        return; // Not a valid NIC format
    }
    
    // Adjust for female NICs
    if (dayOfYear > 500) {
        dayOfYear -= 500;
    }

    if (year && dayOfYear && dayOfYear > 0 && dayOfYear <= 366) {
        const date = addDays(startOfYear(new Date(year, 0, 1)), dayOfYear - 1);
        setDob(date);
    }
  };

  const handleNicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNic = e.target.value;
    setNic(newNic);
    parseNicAndSetDob(newNic);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep !== STEPS.length) {
      toast({ variant: "destructive", title: "Incomplete Form", description: "Please complete all steps before submitting." });
      return;
    }

    setIsRegistering(true);
    
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
                    <div className="space-y-2"><Label>Street Address</Label><Textarea value={address} onChange={(e) => setAddress(e.target.value)} required /></div>
                     <div className="space-y-2">
                        <Label>City</Label>
                         <Popover open={isCityPopoverOpen} onOpenChange={setIsCityPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isCityPopoverOpen}
                                className="w-full justify-between"
                                >
                                {city ? cities.find(c => c.name_en === city)?.name_en : "Select city..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search city..." />
                                    <CommandEmpty>No city found.</CommandEmpty>
                                    <CommandGroup className="max-h-60 overflow-y-auto">
                                        {cities.map((c) => (
                                        <CommandItem
                                            key={c.id}
                                            value={c.name_en}
                                            onSelect={(currentValue) => {
                                                setCity(currentValue === city ? "" : c.name_en)
                                                setIsCityPopoverOpen(false)
                                            }}
                                        >
                                            <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                city === c.name_en ? "opacity-100" : "opacity-0"
                                            )}
                                            />
                                            {c.name_en}
                                        </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            )}
             {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in-50">
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
                    <div className="space-y-2"><Label>NIC Number</Label><Input value={nic} onChange={handleNicChange} required /></div>
                     <div className="space-y-2">
                        <Label>Date of Birth</Label>
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
                    </div>
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
          </form>
        </CardContent>
         <CardFooter className="flex justify-between items-center pt-4">
                <Button type="button" variant="outline" onClick={handlePrevStep} disabled={currentStep === 1 || isRegistering}>
                    <ArrowLeft className="mr-2 h-4 w-4"/> Back
                </Button>
                {currentStep < STEPS.length ? (
                    <Button type="button" onClick={handleNextStep}>
                        Next Step <ArrowRight className="ml-2 h-4 w-4"/>
                    </Button>
                ) : (
                    <Button type="submit" form="registration-form" disabled={isRegistering}>
                        {isRegistering ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        {isRegistering ? 'Submitting...' : 'Complete Registration'}
                    </Button>
                )}
            </CardFooter>
      </Card>
    </div>
  );
}
