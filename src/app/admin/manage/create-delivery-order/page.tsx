"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, AlertTriangle, User, Mail, Phone, Truck, Package, MapPin, CalendarDays, BookOpen, Tag } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// --- Type Definitions ---
interface StudentInfo {
    id: string;
    student_id: string;
    full_name: string;
    e_mail: string;
    telephone_1: string;
    nic: string;
    address_line_1: string;
    address_line_2: string;
    city: string;
    district: string;
}

interface StudentEnrollment {
    id: string;
    course_code: string;
    batch_name: string;
    parent_course_name: string;
}

interface FullStudentData {
    studentInfo: StudentInfo;
    studentEnrollments: Record<string, StudentEnrollment>;
}

export default function CreateDeliveryOrderPage() {
    const [studentId, setStudentId] = useState('');
    const [studentData, setStudentData] = useState<FullStudentData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state for new delivery
    const [deliveryTitle, setDeliveryTitle] = useState('');
    const [deliveryNotes, setDeliveryNotes] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentId.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a student ID.' });
            return;
        }

        setIsLoading(true);
        setError(null);
        setStudentData(null);

        try {
            const response = await fetch(`https://qa-api.pharmacollege.lk/get-student-full-info?loggedUser=${studentId.trim().toUpperCase()}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Student not found or server error. Status: ${response.status}` }));
                throw new Error(errorData.message || 'Student data is invalid or not found.');
            }
            const data = await response.json();
            if (data && data.studentInfo) {
                setStudentData(data);
                // Pre-fill address from student info
                const fullAddress = [data.studentInfo.address_line_1, data.studentInfo.address_line_2, data.studentInfo.city, data.studentInfo.district]
                    .filter(Boolean)
                    .join(', ');
                setDeliveryAddress(fullAddress);
            } else {
                 throw new Error('Student data is incomplete in the API response.');
            }
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
            toast({ variant: 'destructive', title: 'Search Failed', description: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!deliveryTitle || !deliveryAddress) {
            toast({ variant: 'destructive', title: 'Error', description: 'Delivery title and address are required.' });
            return;
        }

        setIsSubmitting(true);
        // --- API call will go here ---
        console.log("Submitting order:", {
            studentId: studentData?.studentInfo.student_id,
            title: deliveryTitle,
            address: deliveryAddress,
            notes: deliveryNotes,
        });

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        toast({
            title: 'Order Created (Simulated)',
            description: `A new delivery order for ${studentData?.studentInfo.full_name} has been created.`,
        });

        // Reset form
        setDeliveryTitle('');
        setDeliveryNotes('');
        setIsSubmitting(false);
    };

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <h1 className="text-3xl font-headline font-semibold">Create Delivery Order</h1>
                <p className="text-muted-foreground">Find a student and create a new delivery order for them.</p>
            </header>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Step 1: Find Student</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                        <Input 
                            placeholder="Enter Student ID (e.g., PA16642)" 
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            className="flex-grow"
                        />
                        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                            Find Student
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {isLoading && (
                <div className="space-y-6">
                    <Skeleton className="h-[170px] w-full" />
                </div>
            )}

            {error && !isLoading && (
                <Card className="border-destructive">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle /> Search Error</CardTitle></CardHeader>
                    <CardContent><p>{error}</p></CardContent>
                </Card>
            )}

            {studentData && !isLoading && (
                <div className="space-y-6">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Selected Student</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 md:p-6">
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6">
                                <Avatar className="w-24 h-24 text-4xl border-2 border-primary" data-ai-hint="student avatar">
                                    <AvatarImage src={`https://placehold.co/150x150.png`} alt={studentData.studentInfo.full_name} />
                                    <AvatarFallback>{studentData.studentInfo.full_name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 text-center sm:text-left">
                                    <h2 className="text-2xl font-bold font-headline">{studentData.studentInfo.full_name}</h2>
                                    <p className="text-muted-foreground">{studentData.studentInfo.student_id}</p>
                                    <div className="mt-2 text-sm text-muted-foreground space-y-1 break-all">
                                        <p className="flex items-center justify-center sm:justify-start gap-2"><Mail className="h-4 w-4 shrink-0" /> {studentData.studentInfo.e_mail}</p>
                                        <p className="flex items-center justify-center sm:justify-start gap-2"><Phone className="h-4 w-4 shrink-0" /> {studentData.studentInfo.telephone_1}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <form onSubmit={handleCreateOrder}>
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle>Step 2: Delivery Details</CardTitle>
                                <CardDescription>Enter the details for the new delivery.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="delivery-title">Delivery Title</Label>
                                    <Input
                                        id="delivery-title"
                                        placeholder="e.g., Semester 2 Study Pack"
                                        value={deliveryTitle}
                                        onChange={(e) => setDeliveryTitle(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="delivery-address">Delivery Address</Label>
                                    <Textarea
                                        id="delivery-address"
                                        placeholder="Full delivery address"
                                        value={deliveryAddress}
                                        onChange={(e) => setDeliveryAddress(e.target.value)}
                                        required
                                        rows={3}
                                    />
                                    <p className="text-xs text-muted-foreground">Address is pre-filled from the student's profile. You can edit it if needed.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="delivery-notes">Notes (Optional)</Label>
                                    <Textarea
                                        id="delivery-notes"
                                        placeholder="Any special instructions for the courier..."
                                        value={deliveryNotes}
                                        onChange={(e) => setDeliveryNotes(e.target.value)}
                                        rows={2}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-4 w-4" />}
                                    Create Delivery Order
                                </Button>
                            </CardFooter>
                        </Card>
                    </form>
                </div>
            )}
        </div>
    );
}