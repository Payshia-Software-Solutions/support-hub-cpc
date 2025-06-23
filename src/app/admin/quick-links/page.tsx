
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, AlertTriangle, User, Wallet, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from '@/components/ui/skeleton';

// --- Type Definitions for the API response ---
interface StudentInfo {
    id: string;
    student_id: string;
    username: string;
    full_name: string;
    name_with_initials: string;
    name_on_certificate: string;
    e_mail: string;
    telephone_1: string;
    telephone_2: string;
    address_line_1: string;
    address_line_2: string;
    city: string;
    district: string;
    postal_code: string;
    nic: string;
    gender: string;
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
    TotalStudentPaymentRecords: number;
    studentBalance: number;
    paymentRecords: Record<string, ApiPaymentRecord>;
}

interface AssignmentGrade {
    assignment_id: string;
    assignment_name: string;
    grade: string;
}

interface DeliveryOrder {
    id: string;
    delivery_id: string;
    tracking_number: string;
    order_date: string;
    current_status: string;
    delivery_title: string;
    active_status: string;
}

interface CertificateRecord {
    id: string;
    certificate_id: string;
    print_date: string;
    print_status: string;
    type: string;
    course_code: string;
}

interface CriteriaDetail {
    id: string;
    list_name: string;
    moq: string;
    evaluation: {
        completed: boolean;
        currentValue: number;
        requiredValue: number;
    };
}

interface StudentEnrollment {
    id: string;
    course_code: string;
    batch_name: string;
    parent_course_name: string;
    assignment_grades: {
        assignments: AssignmentGrade[];
        average_grade: string;
    };
    deliveryOrders: DeliveryOrder[];
    certificateRecords: CertificateRecord[];
    studentBalance: number;
    certificate_eligibility: boolean;
    criteria_details: CriteriaDetail[];
}

interface FullStudentData {
    studentInfo: StudentInfo;
    studentBalance: StudentBalance;
    studentEnrollments: Record<string, StudentEnrollment>;
}

// --- End Type Definitions ---


// --- Sub-components for displaying data ---

const StudentInfoCard = ({ info }: { info: StudentInfo }) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <User className="h-6 w-6 text-primary" />
                Student Information
            </CardTitle>
            <CardDescription>{info.full_name} ({info.student_id})</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="break-words"><strong>Email:</strong> {info.e_mail}</div>
            <div className="break-words"><strong>NIC:</strong> {info.nic}</div>
            <div className="break-words"><strong>Phone 1:</strong> {info.telephone_1}</div>
            <div className="break-words"><strong>Phone 2:</strong> {info.telephone_2}</div>
            <div className="md:col-span-2 break-words">
                <strong>Address:</strong> {`${info.address_line_1 || ''} ${info.address_line_2 || ''}, ${info.city || ''}, ${info.postal_code || ''}`}
            </div>
        </CardContent>
    </Card>
);

const StudentBalanceCard = ({ balance }: { balance: StudentBalance }) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Wallet className="h-6 w-6 text-primary" />
                Financial Overview
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
                <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Paid</p>
                    <p className="text-2xl font-bold">LKR {balance.totalPaymentAmount.toLocaleString()}</p>
                </div>
                 <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Outstanding</p>
                    <p className="text-2xl font-bold">LKR {balance.studentBalance.toLocaleString()}</p>
                </div>
                 <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Records</p>
                    <p className="text-2xl font-bold">{Object.keys(balance.paymentRecords).length}</p>
                </div>
            </div>
            <h4 className="font-semibold mb-2">Payment History</h4>
             {/* Mobile View: List of Cards */}
            <div className="md:hidden space-y-4">
                {Object.values(balance.paymentRecords).map(rec => (
                    <div key={rec.id} className="p-4 border rounded-lg space-y-2 text-sm">
                        <div className="flex justify-between items-center font-medium">
                            <span>{rec.receipt_number}</span>
                            <Badge variant={rec.payment_status === 'Paid' ? 'default' : 'secondary'}>{rec.payment_status}</Badge>
                        </div>
                        <div className="text-muted-foreground">
                            <p><strong className="text-foreground">Course:</strong> {rec.course_code}</p>
                            <p><strong className="text-foreground">Amount:</strong> LKR {parseFloat(rec.paid_amount).toLocaleString()}</p>
                            <p><strong className="text-foreground">Date:</strong> {rec.paid_date}</p>
                        </div>
                    </div>
                ))}
            </div>
            {/* Desktop View: Table */}
            <div className="hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Receipt #</TableHead>
                            <TableHead>Course</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.values(balance.paymentRecords).map(rec => (
                            <TableRow key={rec.id}>
                                <TableCell className="font-medium whitespace-nowrap">{rec.receipt_number}</TableCell>
                                <TableCell>{rec.course_code}</TableCell>
                                <TableCell className="text-right whitespace-nowrap">LKR {parseFloat(rec.paid_amount).toLocaleString()}</TableCell>
                                <TableCell className="whitespace-nowrap">{rec.paid_date}</TableCell>
                                <TableCell><Badge variant={rec.payment_status === 'Paid' ? 'default' : 'secondary'}>{rec.payment_status}</Badge></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
    </Card>
);

const EnrollmentCard = ({ enrollment }: { enrollment: StudentEnrollment }) => (
    <Card className="bg-muted/40">
        <CardHeader>
            <CardTitle>{enrollment.parent_course_name}</CardTitle>
            <CardDescription>Course Code: {enrollment.course_code}</CardDescription>
        </CardHeader>
        <CardContent>
            <Accordion type="multiple" className="w-full">
                <AccordionItem value="assignments">
                    <AccordionTrigger>Assignment Grades (Avg: {enrollment.assignment_grades.average_grade}%)</AccordionTrigger>
                    <AccordionContent>
                        <Table>
                           <TableHeader><TableRow><TableHead>Assignment</TableHead><TableHead className="text-right">Grade</TableHead></TableRow></TableHeader>
                           <TableBody>
                                {enrollment.assignment_grades.assignments.map(a => (
                                    <TableRow key={a.assignment_id}><TableCell>{a.assignment_name}</TableCell><TableCell className="text-right">{parseFloat(a.grade).toFixed(2)}%</TableCell></TableRow>
                                ))}
                           </TableBody>
                        </Table>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="deliveries">
                    <AccordionTrigger>Delivery Orders ({enrollment.deliveryOrders.length})</AccordionTrigger>
                     <AccordionContent>
                        {/* Mobile view */}
                        <div className="md:hidden space-y-3">
                            {enrollment.deliveryOrders.map(d => (
                                <div key={d.id} className="p-3 border rounded-md text-sm space-y-1">
                                    <p className="font-medium">{d.delivery_title}</p>
                                    <p className="text-muted-foreground"><strong className="text-foreground">Tracking #:</strong> <span className="whitespace-nowrap">{d.tracking_number}</span></p>
                                    <p className="text-muted-foreground"><strong className="text-foreground">Status:</strong> {d.active_status}</p>
                                </div>
                            ))}
                        </div>
                        {/* Desktop view */}
                        <div className="hidden md:block">
                            <Table>
                               <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Tracking #</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                               <TableBody>
                                    {enrollment.deliveryOrders.map(d => (
                                        <TableRow key={d.id}>
                                            <TableCell>{d.delivery_title}</TableCell>
                                            <TableCell className="whitespace-nowrap">{d.tracking_number}</TableCell>
                                            <TableCell>{d.active_status}</TableCell>
                                        </TableRow>
                                    ))}
                               </TableBody>
                            </Table>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="certificates">
                    <AccordionTrigger>Certificate Records ({enrollment.certificateRecords.length})</AccordionTrigger>
                     <AccordionContent>
                        {/* Mobile view */}
                        <div className="md:hidden space-y-3">
                            {enrollment.certificateRecords.map(c => (
                                <div key={c.id} className="p-3 border rounded-md text-sm space-y-1">
                                    <p className="font-medium">{c.type}</p>
                                    <p className="text-muted-foreground"><strong className="text-foreground">ID:</strong> {c.certificate_id}</p>
                                    <p className="text-muted-foreground"><strong className="text-foreground">Printed On:</strong> <span className="whitespace-nowrap">{new Date(c.print_date).toLocaleDateString()}</span></p>
                                </div>
                            ))}
                        </div>
                        {/* Desktop view */}
                        <div className="hidden md:block">
                            <Table>
                               <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>ID</TableHead><TableHead>Printed On</TableHead></TableRow></TableHeader>
                               <TableBody>
                                    {enrollment.certificateRecords.map(c => (
                                        <TableRow key={c.id}>
                                            <TableCell>{c.type}</TableCell>
                                            <TableCell>{c.certificate_id}</TableCell>
                                            <TableCell className="whitespace-nowrap">{new Date(c.print_date).toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    ))}
                               </TableBody>
                            </Table>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="eligibility">
                    <AccordionTrigger className="flex items-center gap-2">
                        Certificate Eligibility 
                        <Badge variant={enrollment.certificate_eligibility ? 'default' : 'destructive'}>
                            {enrollment.certificate_eligibility ? "Eligible" : "Not Eligible"}
                        </Badge>
                    </AccordionTrigger>
                    <AccordionContent>
                        <ul className="space-y-2">
                            {enrollment.criteria_details.map(c => (
                                <li key={c.id} className="flex items-center justify-between p-2 rounded-md border">
                                    <div className="flex items-center gap-2">
                                        {c.evaluation.completed ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                                        <span>{c.list_name}</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">({c.evaluation.currentValue} / {c.evaluation.requiredValue})</span>
                                </li>
                            ))}
                        </ul>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </CardContent>
    </Card>
);

// --- Main Page Component ---

export default function AdminQuickLinksPage() {
    const [studentId, setStudentId] = useState('');
    const [studentData, setStudentData] = useState<FullStudentData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            const response = await fetch(`https://qa-api.pharmacollege.lk/get-student-full-info?loggedUser=${studentId.trim()}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Student not found or server error. Status: ${response.status}` }));
                throw new Error(errorData.message || 'Student not found or API response is invalid.');
            }
            const data = await response.json();
            if (data && data.studentInfo) {
                setStudentData(data);
            } else {
                 throw new Error('Student not found or API response is invalid.');
            }
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
            toast({ variant: 'destructive', title: 'Search Failed', description: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8">
            <header>
                <h1 className="text-3xl font-headline font-semibold">Quick Links - Student Lookup</h1>
                <p className="text-muted-foreground">Search for a student by their ID to get a full overview.</p>
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
                <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            )}

            {error && !isLoading && (
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle />
                            An Error Occurred
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{error}</p>
                    </CardContent>
                </Card>
            )}

            {studentData && (
                <div className="space-y-6">
                    <StudentInfoCard info={studentData.studentInfo} />
                    <StudentBalanceCard balance={studentData.studentBalance} />

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-6 w-6 text-primary" />
                                Course Enrollments
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {Object.values(studentData.studentEnrollments).map(enrollment => (
                                <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
                            ))}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
