

"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, AlertTriangle, User, Wallet, BookOpen, CheckCircle, XCircle, Mail, Phone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { searchStudents, getStudentFullInfo } from '@/lib/api';
import type { StudentSearchResult, FullStudentData, StudentBalance, StudentEnrollment, DeliveryOrder, CertificateRecord, ApiPaymentRecord } from '@/lib/types';


// --- End Type Definitions ---


// --- Sub-components for displaying data ---

const PaymentHistory = ({ balance }: { balance: StudentBalance }) => {
    const paymentRecordsArray = Object.values(balance.paymentRecords || {});
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Full Payment History</CardTitle>
                <CardDescription>A complete record of all payments made by the student.</CardDescription>
            </CardHeader>
            <CardContent>
                {paymentRecordsArray.length > 0 ? (
                    <>
                        {/* Mobile View: List of Cards */}
                        <div className="md:hidden space-y-4">
                            {paymentRecordsArray.map(rec => (
                                <div key={rec.id} className="p-4 border rounded-lg space-y-2 text-sm">
                                    <div className="flex justify-between items-center font-medium">
                                        <span className="break-all">{rec.receipt_number}</span>
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
                                    {paymentRecordsArray.map(rec => (
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
                    </>
                ) : (
                    <p className="text-muted-foreground text-center py-4">No payment records found.</p>
                )}
            </CardContent>
        </Card>
    );
};

const EnrollmentCard = ({ enrollment }: { enrollment: StudentEnrollment }) => (
    <Card>
        <CardHeader>
            <CardTitle>{enrollment.parent_course_name}</CardTitle>
            <CardDescription>Course Code: {enrollment.course_code} | Batch: {enrollment.batch_name}</CardDescription>
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
                                    <p className="text-muted-foreground"><strong className="text-foreground">Tracking #:</strong> <span className="whitespace-nowrap break-all">{d.tracking_number}</span></p>
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

    const [suggestions, setSuggestions] = useState<StudentSearchResult[]>([]);
    const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
    const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const [selectionMade, setSelectionMade] = useState(false);


    useEffect(() => {
        if (selectionMade) {
            setSelectionMade(false);
            return;
        }

        const handler = setTimeout(async () => {
            if (studentId.trim().length > 1) {
                setIsFetchingSuggestions(true);
                try {
                    const results = await searchStudents(studentId.trim());
                    setSuggestions(results);
                    setIsSuggestionsOpen(results.length > 0);
                } catch (err) {
                    console.error("Failed to fetch suggestions:", err);
                    setSuggestions([]);
                    setIsSuggestionsOpen(false);
                } finally {
                    setIsFetchingSuggestions(false);
                }
            } else {
                setSuggestions([]);
                setIsSuggestionsOpen(false);
            }
        }, 300); // 300ms debounce delay

        return () => clearTimeout(handler);
    }, [studentId, selectionMade]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setIsSuggestionsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    const performSearch = async (searchId: string) => {
        setIsLoading(true);
        setError(null);
        setStudentData(null);

        try {
            const data = await getStudentFullInfo(searchId);
            setStudentData(data);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
            toast({ variant: 'destructive', title: 'Search Failed', description: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSuggestionsOpen(false);
        if (!studentId.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a student ID.' });
            return;
        }
        performSearch(studentId);
    };
    
    const handleSuggestionClick = (suggestion: StudentSearchResult) => {
        setIsSuggestionsOpen(false);
        setSelectionMade(true);
        setStudentId(suggestion.student_id);
        performSearch(suggestion.student_id);
    };

    return (
        <div className="p-4 md:p-8 space-y-8 pb-20">
            <header>
                <h1 className="text-3xl font-headline font-semibold">Find Student</h1>
                <p className="text-muted-foreground">Search for a student by their ID to get a full overview.</p>
            </header>

            <Card className="shadow-lg">
                <CardContent className="p-6">
                    <form onSubmit={handleSearchFormSubmit}>
                      <div className="relative" ref={searchContainerRef}>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Input 
                                placeholder="Enter Student ID or Name..." 
                                value={studentId}
                                onChange={(e) => setStudentId(e.target.value)}
                                className="flex-grow"
                                autoComplete="off"
                            />
                            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                Search
                            </Button>
                        </div>
                        {isSuggestionsOpen && (
                             <div className="absolute top-full mt-2 w-full sm:max-w-md rounded-md border bg-popover text-popover-foreground shadow-lg z-50">
                                <ul className="max-h-60 overflow-y-auto">
                                    {isFetchingSuggestions ? (
                                        <li className="p-3 text-center text-sm text-muted-foreground">Loading...</li>
                                    ) : suggestions.length > 0 ? (
                                        suggestions.map((s) => (
                                            <li key={s.student_id}>
                                                <button
                                                    type="button"
                                                    onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(s); }}
                                                    className="w-full text-left p-3 hover:bg-accent transition-colors"
                                                >
                                                    <p className="font-medium">{s.full_name}</p>
                                                    <p className="text-sm text-muted-foreground">{s.student_id}</p>
                                                </button>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="p-3 text-center text-sm text-muted-foreground">No suggestions found.</li>
                                    )}
                                </ul>
                            </div>
                        )}
                       </div>
                    </form>
                </CardContent>
            </Card>

            {isLoading && (
                <div className="space-y-4">
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-10 w-1/2" />
                    <Skeleton className="h-64 w-full" />
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
                                    <div className="mt-2 text-sm text-muted-foreground space-y-1 break-all">
                                        <p className="flex items-center justify-center sm:justify-start gap-2"><User className="h-4 w-4 shrink-0" /> {studentData.studentInfo.nic}</p>
                                        <p className="flex items-center justify-center sm:justify-start gap-2"><Mail className="h-4 w-4 shrink-0" /> {studentData.studentInfo.e_mail}</p>
                                        <p className="flex items-center justify-center sm:justify-start gap-2"><Phone className="h-4 w-4 shrink-0" /> {studentData.studentInfo.telephone_1}</p>
                                    </div>
                                </div>
                                <div className="w-full sm:w-auto grid grid-cols-2 gap-2 text-center pt-4 sm:pt-0 border-t sm:border-t-0 sm:border-l sm:pl-6 mt-4 sm:mt-0">
                                    <div className="p-2">
                                        <p className="text-sm text-muted-foreground">Total Paid</p>
                                        <p className="text-xl font-bold">LKR {studentData.studentBalance.totalPaymentAmount.toLocaleString()}</p>
                                    </div>
                                    <div className="p-2">
                                        <p className="text-sm text-muted-foreground">Outstanding</p>
                                        <p className="text-xl font-bold text-destructive">LKR {studentData.studentBalance.studentBalance.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabs for details */}
                    <Tabs defaultValue="enrollments" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
                            <TabsTrigger value="enrollments">Course Enrollments</TabsTrigger>
                            <TabsTrigger value="payments">Payment History</TabsTrigger>
                        </TabsList>
                        <TabsContent value="enrollments" className="mt-4">
                           <div className="space-y-4">
                                {Object.values(studentData.studentEnrollments).length > 0 ? (
                                    Object.values(studentData.studentEnrollments).map(enrollment => (
                                        <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
                                    ))
                                ) : (
                                    <p className="text-muted-foreground text-center p-4">No enrollments found.</p>
                                )}
                            </div>
                        </TabsContent>
                        <TabsContent value="payments" className="mt-4">
                            <PaymentHistory balance={studentData.studentBalance} />
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </div>
    );
}

    
