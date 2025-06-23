
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, AlertTriangle, User, Mail, Phone, GraduationCap, ClipboardList, Banknote, Calendar, Users, Ticket, Award, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// --- Type Definitions ---
interface StudentInfo {
    id: string;
    student_id: string;
    full_name: string;
    e_mail: string;
    telephone_1: string;
    nic: string;
}
interface FullStudentData {
    studentInfo: StudentInfo;
}
interface ConvocationData {
    registration_id: string;
    reference_number: string;
    student_number: string;
    payment_status: string;
    payment_amount: string;
    registration_status: string;
    registered_at: string;
    image_path: string;
    additional_seats: string;
    session: string;
    ceremony_number: string;
    certificate_print_status: string;
    advanced_print_status: string;
    certificate_id: string;
    advanced_id: string;
}

const DetailItem = ({ icon, label, children, className }: { icon: React.ReactNode, label: string, children: React.ReactNode, className?: string }) => (
    <div className={cn("flex items-start gap-3", className)}>
        <div className="text-primary pt-1">{icon}</div>
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="font-medium text-card-foreground break-all">{children}</div>
        </div>
    </div>
);


export default function ConvocationPage() {
    const [studentId, setStudentId] = useState('');
    const [studentData, setStudentData] = useState<FullStudentData | null>(null);
    const [convocationData, setConvocationData] = useState<ConvocationData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [convocationError, setConvocationError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentId.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a student ID.' });
            return;
        }

        setIsLoading(true);
        setError(null);
        setStudentData(null);
        setConvocationData(null);
        setConvocationError(null);

        try {
            const studentIdTrimmed = studentId.trim().toUpperCase();
            
            const studentInfoPromise = fetch(`https://qa-api.pharmacollege.lk/get-student-full-info?loggedUser=${studentIdTrimmed}`);
            const convocationInfoPromise = fetch(`https://qa-api.pharmacollege.lk/convocation-registrations/get-records-student-number/${studentIdTrimmed}`);

            const [studentInfoRes, convocationInfoRes] = await Promise.all([studentInfoPromise, convocationInfoPromise]);

            if (!studentInfoRes.ok) {
                const errorData = await studentInfoRes.json().catch(() => ({ message: `Student not found. Status: ${studentInfoRes.status}` }));
                throw new Error(errorData.message || 'Student data is invalid or not found.');
            }
            const studentInfoData = await studentInfoRes.json();
            if (studentInfoData && studentInfoData.studentInfo) {
                setStudentData(studentInfoData);
            } else {
                 throw new Error('Student data is incomplete in the API response.');
            }

            if (convocationInfoRes.ok) {
                const convocationJson = await convocationInfoRes.json();
                if (convocationJson && convocationJson.registration_id) {
                    setConvocationData(convocationJson);
                } else {
                    setConvocationError("No convocation registration found for this student.");
                }
            } else {
                 const convocationErrorData = await convocationInfoRes.json().catch(() => ({}));
                 setConvocationError(convocationErrorData.message || `Could not fetch convocation data. Status: ${convocationInfoRes.status}`);
            }

        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
            toast({ variant: 'destructive', title: 'Search Failed', description: err.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <h1 className="text-3xl font-headline font-semibold">Convocation Management</h1>
                <p className="text-muted-foreground">Manage student registrations for convocation.</p>
            </header>

            <Card className="shadow-lg">
                <CardContent className="p-6">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                        <Input 
                            placeholder="Enter Student ID (e.g., PA15002)" 
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            className="flex-grow"
                        />
                        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                            Search
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {isLoading && (
                <div className="space-y-6">
                    <Skeleton className="h-[170px] w-full" />
                    <Skeleton className="h-[400px] w-full" />
                </div>
            )}

            {error && !isLoading && (
                <Card className="border-destructive">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle /> An Error Occurred</CardTitle></CardHeader>
                    <CardContent><p>{error}</p></CardContent>
                </Card>
            )}

            {studentData && !isLoading && (
                <div className="space-y-6">
                    <Card className="shadow-lg">
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
                                        <p className="flex items-center justify-center sm:justify-start gap-2"><User className="h-4 w-4 shrink-0" /> {studentData.studentInfo.nic}</p>
                                        <p className="flex items-center justify-center sm:justify-start gap-2"><Mail className="h-4 w-4 shrink-0" /> {studentData.studentInfo.e_mail}</p>
                                        <p className="flex items-center justify-center sm:justify-start gap-2"><Phone className="h-4 w-4 shrink-0" /> {studentData.studentInfo.telephone_1}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><GraduationCap /> Convocation Registration Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                           {convocationData ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                        <h3 className="md:col-span-2 text-lg font-semibold text-primary border-b pb-2">Registration Info</h3>
                                        <DetailItem icon={<ClipboardList className="h-4 w-4"/>} label="Registration ID">{convocationData.registration_id}</DetailItem>
                                        <DetailItem icon={<ClipboardList className="h-4 w-4"/>} label="Reference Number">{convocationData.reference_number}</DetailItem>
                                        <DetailItem icon={<GraduationCap className="h-4 w-4"/>} label="Registration Status">
                                            <Badge variant={convocationData.registration_status === 'paid' ? 'default' : 'secondary'}>{convocationData.registration_status}</Badge>
                                        </DetailItem>
                                        <DetailItem icon={<Calendar className="h-4 w-4"/>} label="Registered Date">{new Date(convocationData.registered_at).toLocaleString()}</DetailItem>
                                        
                                        <h3 className="md:col-span-2 text-lg font-semibold text-primary border-b pb-2 mt-4">Event & Payment</h3>
                                        <DetailItem icon={<Ticket className="h-4 w-4"/>} label="Session / Ceremony">{convocationData.session} / {convocationData.ceremony_number}</DetailItem>
                                        <DetailItem icon={<Users className="h-4 w-4"/>} label="Additional Seats">{convocationData.additional_seats}</DetailItem>
                                        <DetailItem icon={<Banknote className="h-4 w-4"/>} label="Payment Status">
                                            <Badge variant={convocationData.payment_status === 'paid' || convocationData.payment_status === 'completed' ? 'default' : 'destructive'}>{convocationData.payment_status}</Badge>
                                        </DetailItem>
                                        <DetailItem icon={<Banknote className="h-4 w-4"/>} label="Payment Amount">LKR {convocationData.payment_amount}</DetailItem>

                                        <h3 className="md:col-span-2 text-lg font-semibold text-primary border-b pb-2 mt-4">Certificates</h3>
                                        <DetailItem icon={<Award className="h-4 w-4"/>} label="Certificate Status">
                                            <div className="flex items-center gap-2">
                                                {convocationData.certificate_print_status === 'Generated' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500"/>}
                                                <span>{convocationData.certificate_print_status} ({convocationData.certificate_id})</span>
                                            </div>
                                        </DetailItem>
                                        <DetailItem icon={<Award className="h-4 w-4"/>} label="Advanced Certificate Status">
                                            <div className="flex items-center gap-2">
                                                {convocationData.advanced_print_status === 'Generated' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500"/>}
                                                <span>{convocationData.advanced_print_status} ({convocationData.advanced_id})</span>
                                            </div>
                                        </DetailItem>
                                    </div>
                                </div>
                                <div className="lg:col-span-1 space-y-2">
                                    <h3 className="text-lg font-semibold text-primary border-b pb-2">Payment Slip</h3>
                                    {convocationData.image_path ? (
                                        <div className="relative aspect-[3/4] w-full bg-muted rounded-lg overflow-hidden border">
                                            <Image 
                                                src={`https://qa-api.pharmacollege.lk${convocationData.image_path}`}
                                                alt="Payment Slip"
                                                layout="fill"
                                                objectFit="contain"
                                                data-ai-hint="payment slip"
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">No payment slip image available.</p>
                                    )}
                                </div>
                            </div>
                           ) : (
                                <div className="text-center text-muted-foreground py-10">
                                    <p>{convocationError || 'No convocation data to display.'}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

