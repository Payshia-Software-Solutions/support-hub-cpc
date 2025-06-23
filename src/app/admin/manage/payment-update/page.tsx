
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, AlertTriangle, User, Mail, Phone, PlusCircle, CalendarIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { dummyCourses } from '@/lib/dummy-data';
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Simplified types for this page, similar to quick-links
interface StudentInfo {
    id: string;
    student_id: string;
    full_name: string;
    e_mail: string;
    telephone_1: string;
    nic: string;
}

interface ApiPaymentRecord {
    id: string;
    receipt_number: string;
    course_code: string;
    paid_amount: string;
    payment_status: string;
    payment_type: string;
    paid_date: string;
}

interface StudentBalance {
    totalPaymentAmount: number;
    studentBalance: number;
    paymentRecords: Record<string, ApiPaymentRecord>;
}

interface FullStudentData {
    studentInfo: StudentInfo;
    studentBalance: StudentBalance;
}

export default function PaymentUpdatePage() {
    const [studentId, setStudentId] = useState('');
    const [studentData, setStudentData] = useState<FullStudentData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    
    // Form state for new payment
    const [newPaymentAmount, setNewPaymentAmount] = useState('');
    const [newPaymentCourseId, setNewPaymentCourseId] = useState('');
    const [newPaymentDate, setNewPaymentDate] = useState<Date | undefined>(new Date());
    const [newReceiptNumber, setNewReceiptNumber] = useState('');

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
                throw new Error(errorData.message || 'Student not found or API response is invalid.');
            }
            const data = await response.json();
            if (data && data.studentInfo && data.studentBalance) {
                setStudentData(data);
            } else {
                 throw new Error('Student data is incomplete or invalid in the API response.');
            }
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
            toast({ variant: 'destructive', title: 'Search Failed', description: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddPayment = () => {
        if (!studentData || !newPaymentAmount || !newPaymentCourseId || !newReceiptNumber) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please fill all fields.' });
            return;
        }

        const course = dummyCourses.find(c => c.id === newPaymentCourseId);
        if (!course) return;

        // Mock addition
        const newRecord: ApiPaymentRecord = {
            id: `new-${Date.now()}`,
            receipt_number: newReceiptNumber,
            course_code: course.courseCode,
            paid_amount: newPaymentAmount,
            payment_status: 'Paid', // Assuming new payments are always paid
            payment_type: 'Manual Entry',
            paid_date: newPaymentDate ? format(newPaymentDate, "yyyy-MM-dd") : new Date().toISOString(),
        };

        const updatedBalance = studentData.studentBalance.studentBalance - parseFloat(newPaymentAmount);
        const updatedTotalPaid = studentData.studentBalance.totalPaymentAmount + parseFloat(newPaymentAmount);
        
        setStudentData({
            ...studentData,
            studentBalance: {
                ...studentData.studentBalance,
                studentBalance: updatedBalance,
                totalPaymentAmount: updatedTotalPaid,
                paymentRecords: {
                    ...studentData.studentBalance.paymentRecords,
                    [newRecord.id]: newRecord,
                },
            }
        });

        toast({
            title: "Payment Added",
            description: `Payment of LKR ${newPaymentAmount} has been recorded for ${studentData.studentInfo.full_name}.`,
        });

        // Reset form and close dialog
        setNewPaymentAmount('');
        setNewPaymentCourseId('');
        setNewReceiptNumber('');
        setNewPaymentDate(new Date());
        setIsAddDialogOpen(false);
    };

    const paymentRecordsArray = studentData ? Object.values(studentData.studentBalance.paymentRecords).sort((a, b) => new Date(b.paid_date).getTime() - new Date(a.paid_date).getTime()) : [];

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20 max-w-4xl mx-auto">
            <header>
                <h1 className="text-3xl font-headline font-semibold">Payment Updates</h1>
                <p className="text-muted-foreground">Find a student to view their balance and add new payments.</p>
            </header>

            <Card className="shadow-lg">
                <CardContent className="p-6">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                        <Input 
                            placeholder="Enter Student ID (e.g., PA16642)" 
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
                    <Skeleton className="h-[150px] w-full" />
                    <Skeleton className="h-[250px] w-full" />
                </div>
            )}

            {error && !isLoading && (
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle /> An Error Occurred</CardTitle>
                    </CardHeader>
                    <CardContent><p>{error}</p></CardContent>
                </Card>
            )}

            {studentData && (
                <div className="space-y-6">
                    {/* Profile Header Card */}
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
                                    <div className="mt-2 text-sm text-muted-foreground space-y-1">
                                        <p className="flex items-center justify-center sm:justify-start gap-2 break-all"><Mail className="h-4 w-4 shrink-0" /> {studentData.studentInfo.e_mail}</p>
                                        <p className="flex items-center justify-center sm:justify-start gap-2"><Phone className="h-4 w-4 shrink-0" /> {studentData.studentInfo.telephone_1}</p>
                                    </div>
                                </div>
                                <div className="w-full sm:w-auto grid grid-cols-2 gap-2 text-center pt-4 sm:pt-0 border-t sm:border-t-0 sm:pl-6 sm:border-l mt-4 sm:mt-0">
                                    <div className="p-2">
                                        <p className="text-sm text-muted-foreground">Total Paid</p>
                                        <p className="text-lg font-bold">LKR {studentData.studentBalance.totalPaymentAmount.toLocaleString()}</p>
                                    </div>
                                    <div className="p-2">
                                        <p className="text-sm text-muted-foreground">Outstanding</p>
                                        <p className="text-lg font-bold text-destructive">LKR {studentData.studentBalance.studentBalance.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment History Card */}
                    <Card className="shadow-lg">
                        <CardHeader className="flex flex-row justify-between items-center">
                            <div className="space-y-1">
                                <CardTitle>Payment History</CardTitle>
                                <CardDescription>All recorded transactions for this student.</CardDescription>
                            </div>
                            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Payment</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add New Payment</DialogTitle>
                                        <DialogDescription>Record a new payment for {studentData.studentInfo.full_name}.</DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4 grid gap-4">
                                        <div className="space-y-2">
                                            <label htmlFor="receipt-number">Receipt Number</label>
                                            <Input id="receipt-number" value={newReceiptNumber} onChange={(e) => setNewReceiptNumber(e.target.value)} placeholder="e.g. 123456" />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="payment-amount">Amount (LKR)</label>
                                            <Input id="payment-amount" type="number" value={newPaymentAmount} onChange={(e) => setNewPaymentAmount(e.target.value)} placeholder="e.g. 5000" />
                                        </div>
                                         <div className="space-y-2">
                                            <label htmlFor="payment-date">Payment Date</label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !newPaymentDate && "text-muted-foreground")}>
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {newPaymentDate ? format(newPaymentDate, "PPP") : <span>Pick a date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar mode="single" selected={newPaymentDate} onSelect={setNewPaymentDate} initialFocus />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="course-select">Associated Course</label>
                                            <Select value={newPaymentCourseId} onValueChange={setNewPaymentCourseId}>
                                                <SelectTrigger id="course-select"><SelectValue placeholder="Select a course..." /></SelectTrigger>
                                                <SelectContent>
                                                    {dummyCourses.map(course => (
                                                        <SelectItem key={course.id} value={course.id}>{course.name} ({course.courseCode})</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                        <Button onClick={handleAddPayment}>Save Payment</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                             {/* Mobile View: List of Cards */}
                            <div className="md:hidden space-y-4">
                                {paymentRecordsArray.length > 0 ? paymentRecordsArray.map(rec => (
                                    <div key={rec.id} className="p-4 border rounded-lg space-y-2 text-sm bg-muted/30">
                                        <div className="flex justify-between items-center font-medium">
                                            <span className="break-all font-semibold">{rec.receipt_number}</span>
                                            <Badge variant={rec.payment_status === 'Paid' ? 'default' : 'secondary'}>{rec.payment_status}</Badge>
                                        </div>
                                        <div className="text-muted-foreground space-y-1">
                                            <p><strong className="text-card-foreground">Course:</strong> {rec.course_code}</p>
                                            <p><strong className="text-card-foreground">Amount:</strong> LKR {parseFloat(rec.paid_amount).toLocaleString()}</p>
                                            <p><strong className="text-card-foreground">Date:</strong> {rec.paid_date}</p>
                                            <p><strong className="text-card-foreground">Type:</strong> {rec.payment_type}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-center text-muted-foreground py-10">No payment records found.</p>
                                )}
                            </div>
                            {/* Desktop View: Table */}
                            <div className="hidden md:block">
                                {paymentRecordsArray.length > 0 ? (
                                <div className="relative w-full overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Receipt #</TableHead>
                                            <TableHead>Course</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Amount (LKR)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paymentRecordsArray.map(rec => (
                                            <TableRow key={rec.id}>
                                                <TableCell className="font-medium whitespace-nowrap">{rec.receipt_number}</TableCell>
                                                <TableCell>{rec.course_code}</TableCell>
                                                <TableCell>{rec.payment_type}</TableCell>
                                                <TableCell className="whitespace-nowrap">{rec.paid_date}</TableCell>
                                                <TableCell><Badge variant={rec.payment_status === 'Paid' ? 'default' : 'secondary'}>{rec.payment_status}</Badge></TableCell>
                                                <TableCell className="text-right font-semibold whitespace-nowrap">{parseFloat(rec.paid_amount).toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                </div>
                                ) : (
                                     <p className="text-center text-muted-foreground py-10">No payment records found.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
