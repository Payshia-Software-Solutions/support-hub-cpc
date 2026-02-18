
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { getConvocationRegistrations, getPackagesByCeremony, getConvocationSessionCounts, updateConvocationCourses, getUserCertificatePrintStatus, generateCertificate } from '@/lib/actions/certificates';
import { getStudentFullInfo, getStudentBalance } from '@/lib/actions/users';
import { getParentCourses } from '@/lib/actions/courses';
import { getPaymentRequests } from '@/lib/actions/payments';
import type { ConvocationRegistration, ConvocationPackage, ParentCourse, PaymentRequest, FullStudentData, StudentEnrollment, ApiPaymentRecord, UserCertificatePrintStatus, GenerateCertificatePayload, StudentBalanceData } from '@/lib/types';
import { format, isValid, parseISO } from 'date-fns';
import Image from 'next/image';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Search, FileText, ArrowLeft, ArrowUp, ArrowDown, ChevronsUpDown, BookUser, Hourglass, CheckCircle, Users, Wallet, FileDown, Phone, Home, Mail, User, ListOrdered, Award, Copy, Trash2, Printer, Eye, Gamepad2, ClipboardCheck, XCircle, Truck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from '@/contexts/AuthContext';


const ITEMS_PER_PAGE = 25;
const CONTENT_PROVIDER_URL = process.env.NEXT_PUBLIC_CONTENT_PROVIDER_URL || 'https://content-provider.pharmacollege.lk';
const PARENT_SEAT_RATE = 750;

const InfoBox = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="p-3 bg-muted/50 rounded-md">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold text-sm">{value || 'N/A'}</p>
    </div>
);

// --- Detailed Enrollment Sub-components ---

const GameProgressInfo = ({ enrollment }: { enrollment: StudentEnrollment }) => {
    const hasAnyGame = enrollment.ceylon_pharmacy || enrollment.pharma_hunter || enrollment.pharma_hunter_pro;
    if (!hasAnyGame) return null;

    return (
        <div className="space-y-4 mt-2">
            <h4 className="font-semibold text-sm flex items-center gap-2"><Gamepad2 className="h-4 w-4" /> Game Progress</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {enrollment.ceylon_pharmacy && (
                    <div className="p-3 border rounded-md bg-muted/30">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Ceylon Pharmacy</p>
                        <p className="text-sm font-medium">Recovered: {enrollment.ceylon_pharmacy.recoveredCount}</p>
                    </div>
                )}
                {enrollment.pharma_hunter && (
                    <div className="p-3 border rounded-md bg-muted/30">
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Pharma Hunter</p>
                        <div className="text-sm font-medium space-y-0.5">
                            <p>Correct: {enrollment.pharma_hunter.correctCount}</p>
                            <p className="text-[10px] text-muted-foreground">Gems: {enrollment.pharma_hunter.gemCount} | Coins: {enrollment.pharma_hunter.coinCount}</p>
                        </div>
                    </div>
                )}
                {enrollment.pharma_hunter_pro && (
                    <div className="p-3 border rounded-md bg-muted/30">
                        <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1">Pharma Hunter Pro</p>
                        <div className="text-sm font-medium space-y-0.5">
                            <p>Progress: {enrollment.pharma_hunter_pro.results.progressPercentage}%</p>
                            <p className="text-[10px] text-muted-foreground">Correct: {enrollment.pharma_hunter_pro.results.correctCount}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const EnrollmentDetailAccordion = ({ enrollment }: { enrollment: StudentEnrollment }) => {
    return (
        <Accordion key={enrollment.id} type="multiple" className="w-full border rounded-md px-4 bg-background">
            <AccordionItem value="main" className="border-b-0">
                <AccordionTrigger className="py-3 text-left hover:no-underline">
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm md:text-base">{enrollment.parent_course_name}</span>
                        <span className="text-[10px] md:text-xs text-muted-foreground font-normal">{enrollment.course_code} | Batch: {enrollment.batch_name}</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pt-2 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Assignments */}
                        <div className="space-y-2">
                            <h4 className="font-semibold text-xs uppercase text-muted-foreground flex items-center gap-2">
                                <ClipboardCheck className="h-3.5 w-3.5" /> 
                                Assignments (Avg: {enrollment.assignment_grades.average_grade}%)
                            </h4>
                            <div className="border rounded-md overflow-hidden bg-muted/10">
                                <Table>
                                    <TableBody>
                                        {enrollment.assignment_grades.assignments.length > 0 ? (
                                            enrollment.assignment_grades.assignments.map(a => (
                                                <TableRow key={a.assignment_id}>
                                                    <TableCell className="py-2 text-[11px] leading-tight">{a.assignment_name}</TableCell>
                                                    <TableCell className="py-2 text-[11px] text-right font-medium">{parseFloat(a.grade).toFixed(2)}%</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow><TableCell className="py-4 text-center text-xs text-muted-foreground italic">No assignments found</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* Deliveries */}
                        <div className="space-y-2">
                            <h4 className="font-semibold text-xs uppercase text-muted-foreground flex items-center gap-2">
                                <Truck className="h-3.5 w-3.5" /> 
                                Delivery Orders
                            </h4>
                            <div className="space-y-2">
                                {enrollment.deliveryOrders.length > 0 ? (
                                    enrollment.deliveryOrders.map(d => (
                                        <div key={d.id} className="text-xs p-2 border rounded-md bg-muted/20">
                                            <p className="font-medium">{d.delivery_title}</p>
                                            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                                                <span>Tracking: {d.tracking_number}</span>
                                                <Badge variant="outline" className="h-4 px-1 text-[9px] uppercase">{d.active_status}</Badge>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-muted-foreground p-4 border border-dashed rounded-md text-center italic">No delivery orders</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Certificates */}
                        <div className="space-y-2">
                            <h4 className="font-semibold text-xs uppercase text-muted-foreground flex items-center gap-2">
                                <Award className="h-3.5 w-3.5" /> 
                                Certificate Records
                            </h4>
                            <div className="space-y-2">
                                {enrollment.certificateRecords.length > 0 ? (
                                    enrollment.certificateRecords.map(c => (
                                        <div key={c.id} className="text-xs p-2 border rounded-md bg-muted/20 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium">{c.type}</p>
                                                <p className="text-[10px] text-muted-foreground">ID: {c.certificate_id}</p>
                                            </div>
                                            <Badge variant="secondary" className="text-[9px] h-4 px-1">{new Date(c.print_date).toLocaleDateString()}</Badge>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-muted-foreground p-4 border border-dashed rounded-md text-center italic">No certificate records</p>
                                )}
                            </div>
                        </div>

                        {/* Eligibility */}
                        <div className="space-y-2">
                            <h4 className="font-semibold text-xs uppercase text-muted-foreground flex items-center gap-2">
                                <Award className="h-3.5 w-3.5" /> Eligibility Details
                                <Badge variant={enrollment.certificate_eligibility ? 'default' : 'destructive'} className="ml-auto text-[9px] h-4 px-1 uppercase">
                                    {enrollment.certificate_eligibility ? "Eligible" : "Not Eligible"}
                                </Badge>
                            </h4>
                            <div className="border rounded-md bg-muted/5 divide-y">
                                {enrollment.criteria_details.map(c => (
                                    <div key={c.id} className="flex items-center justify-between text-xs p-2">
                                        <div className="flex items-center gap-2">
                                            {c.evaluation.completed ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-red-500" />}
                                            <span className="font-medium">{c.list_name}</span>
                                        </div>
                                        <span className="text-muted-foreground text-[10px] bg-muted px-1.5 py-0.5 rounded-sm">{c.evaluation.currentValue} / {c.evaluation.requiredValue}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Game Progress */}
                    <GameProgressInfo enrollment={enrollment} />
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
};

const RegistrationDetailDialog = ({ registration, open, onOpenChange, courses, packages, studentData, isLoading: isLoadingStudentData, isError, error }: { 
    registration: ConvocationRegistration | null, 
    open: boolean, 
    onOpenChange: (open: boolean) => void,
    courses?: ParentCourse[],
    packages?: ConvocationPackage[],
    studentData?: FullStudentData | null,
    isLoading: boolean,
    isError: boolean,
    error: Error | null
}) => {
    const { data: paymentRequests, isLoading: isLoadingPaymentRequests } = useQuery<PaymentRequest[]>({
        queryKey: ['convocationPaymentRequests', registration?.reference_number],
        queryFn: () => getPaymentRequestsByReference(registration!.reference_number),
        enabled: !!registration?.reference_number,
    });

    if (!registration) return null;

    const getCourseNames = (courseIds: string) => {
        if (!courses) return 'Loading...';
        return courseIds.split(',').map(id => {
            const course = courses.find(c => c.id === id.trim());
            return course?.course_name || `Unknown Course (${id})`;
        }).join(', ');
    };

    const getPackageName = (packageId: string) => {
        if (!packages) return 'Loading...';
        return packages.find(p => p.package_id === packageId)?.package_name || 'Unknown Package';
    };

    const getPaymentRequestsByReference = async (reference: string): Promise<PaymentRequest[]> => {
        const response = await fetch(`https://qa-api.pharmacollege.lk/payment-portal-requests/by-reference/${reference}`);
        if (response.status === 404) {
            return [];
        }
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to fetch payment requests by reference' }));
            throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }
        return response.json();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2 shrink-0 border-b">
                    <DialogTitle>Booking Details: #{registration.reference_number}</DialogTitle>
                    <DialogDescription>
                        Detailed overview for student {registration.student_number}.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-6">
                        <div className="space-y-6 pb-10">
                            {/* Booking Info Card - Always visible */}
                            <Card>
                                <CardHeader><CardTitle className="text-base uppercase tracking-wider text-muted-foreground">Booking Info</CardTitle></CardHeader>
                                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <InfoBox label="Ref #" value={registration.reference_number} />
                                    <InfoBox label="Student Number" value={registration.student_number} />
                                    <InfoBox label="Courses" value={getCourseNames(registration.course_id)} />
                                    <InfoBox label="Payment Status" value={<Badge className="uppercase text-[10px]">{registration.payment_status}</Badge>} />
                                    <InfoBox 
                                        label="Overall Balance" 
                                        value={isLoadingStudentData ? <Skeleton className="h-4 w-16" /> : `LKR ${studentData?.studentBalance.studentBalance.toLocaleString() || '0'}`} 
                                    />
                                    <InfoBox label="Additional Seats" value={registration.additional_seats} />
                                    <InfoBox label="Payable Amount" value={`LKR ${parseFloat(registration.payment_amount).toLocaleString()}`} />
                                    <InfoBox label="Package" value={getPackageName(registration.package_id)} />
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                                {/* Student Account Balance Card */}
                                <Card>
                                    <CardHeader><CardTitle className="text-base uppercase tracking-wider text-muted-foreground">Student Account Balance</CardTitle></CardHeader>
                                    <CardContent className="space-y-2">
                                        {isLoadingStudentData ? (
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-full" />
                                                <Skeleton className="h-4 w-full" />
                                                <Skeleton className="h-8 w-full mt-4" />
                                            </div>
                                        ) : isError ? (
                                            <p className="text-sm text-destructive">Error loading balance</p>
                                        ) : studentData ? (
                                            <>
                                                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Due:</span> <span className="font-semibold">LKR {studentData.studentBalance.TotalRegistrationFee.toLocaleString()}</span></div>
                                                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Payments:</span> <span className="font-semibold text-green-600">LKR {studentData.studentBalance.totalPaymentAmount.toLocaleString()}</span></div>
                                                <div className="flex justify-between text-lg font-bold pt-2 border-t mt-2"><span className="text-muted-foreground">Balance:</span> <span className={cn(studentData.studentBalance.studentBalance > 0 ? 'text-destructive' : 'text-green-600')}>LKR {studentData.studentBalance.studentBalance.toLocaleString()}</span></div>
                                            </>
                                        ) : null}
                                    </CardContent>
                                </Card>

                                {/* Convocation Payment Request Card */}
                                <Card>
                                    <CardHeader><CardTitle className="text-base uppercase tracking-wider text-muted-foreground">Convocation Payment Request</CardTitle></CardHeader>
                                    <CardContent>
                                        {isLoadingPaymentRequests ? <Skeleton className="h-16 w-full" /> : (
                                            paymentRequests && paymentRequests.length > 0 ? (
                                                paymentRequests.map(req => (
                                                    <div key={req.id} className="text-sm p-3 border rounded-md flex justify-between items-center mb-2 last:mb-0">
                                                        <div>
                                                            <p className="text-[10px] text-muted-foreground uppercase font-bold">{req.payment_reference || `Req #${req.id}`}</p>
                                                            <p className="text-xs text-muted-foreground mb-1">{format(new Date(req.paid_date), 'PP')}</p>
                                                            <p className="font-bold text-lg">LKR {parseFloat(req.paid_amount).toLocaleString()}</p>
                                                        </div>
                                                        <div className="text-right flex flex-col items-end gap-2">
                                                            <Badge className={cn(
                                                                req.payment_status === 'Approved' && 'bg-green-600',
                                                                req.payment_status === 'Pending' && 'bg-yellow-500 text-yellow-900',
                                                                req.payment_status === 'Rejected' && 'bg-destructive'
                                                            )}>{req.payment_status}</Badge>
                                                            <ViewSlipDialog slipPath={req.slip_path} studentName={registration.name_on_certificate} trigger={<Button variant="outline" size="xs">View Slip</Button>} />
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-center text-muted-foreground italic py-4">No specific payment record found.</p>
                                            )
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Student Enrollments Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold font-headline">Student Enrollments</h3>
                                    {isLoadingStudentData ? <Skeleton className="h-5 w-16" /> : studentData && <Badge variant="secondary" className="font-mono text-xs">{Object.keys(studentData.studentEnrollments).length} Total</Badge>}
                                </div>
                                <div className="space-y-4">
                                    {isLoadingStudentData ? (
                                        <>
                                            <Skeleton className="h-16 w-full" />
                                            <Skeleton className="h-16 w-full" />
                                        </>
                                    ) : studentData ? (
                                        Object.values(studentData.studentEnrollments).map(enrollment => (
                                            <EnrollmentDetailAccordion key={enrollment.id} enrollment={enrollment} />
                                        ))
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

const ViewSlipDialog = ({ slipPath, studentName, trigger }: { slipPath: string | null; studentName: string; trigger: React.ReactNode }) => {
    if (!slipPath) return <Button variant="outline" size="sm" disabled>No Slip</Button>;

    const fullSlipUrl = `${CONTENT_PROVIDER_URL}${slipPath}`;
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(slipPath);

    return (
        <Dialog>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Payment Slip for {studentName}</DialogTitle>
                </DialogHeader>
                <div className="mt-4 max-h-[70vh] overflow-auto border rounded-lg p-2 bg-muted">
                    {isImage ? (
                        <Image src={fullSlipUrl} alt={`Payment Slip for ${studentName}`} width={800} height={1200} className="w-full h-auto object-contain" data-ai-hint="payment slip" />
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                            <FileText className="w-16 h-16 text-muted-foreground mb-4"/>
                            <p className="mb-4">This file is not an image. Open it in a new tab to view.</p>
                            <a href={fullSlipUrl} target="_blank" rel="noopener noreferrer"><Button>Open Slip</Button></a>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default function ConvocationListPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const ceremonyIdFilter = searchParams.get('ceremonyId');

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [courseFilter, setCourseFilter] = useState('all');
    const [packageFilter, setPackageFilter] = useState('all');
    const [sessionFilter, setSessionFilter] = useState('all');
    const [sortOption, setSortOption] = useState('date-desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [viewingDetails, setViewingDetails] = useState<ConvocationRegistration | null>(null);

    const { data: registrations, isLoading, isError, error } = useQuery<ConvocationRegistration[]>({
        queryKey: ['convocationRegistrations', ceremonyIdFilter],
        queryFn: () => getConvocationRegistrations(ceremonyIdFilter || undefined),
        staleTime: 1000 * 60 * 15,
        refetchOnWindowFocus: false,
    });

    const { data: packages, isLoading: isLoadingPackages } = useQuery<ConvocationPackage[]>({
        queryKey: ['convocationPackages', ceremonyIdFilter],
        queryFn: () => getPackagesByCeremony(ceremonyIdFilter || ''),
        enabled: !!ceremonyIdFilter,
        staleTime: 1000 * 60 * 15,
        refetchOnWindowFocus: false,
    });
    
    const { data: courses, isLoading: isLoadingCourses } = useQuery<ParentCourse[]>({
        queryKey: ['allParentCourses'],
        queryFn: getParentCourses,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
    });
    
    const { data: paymentRequests, isLoading: isLoadingPayments } = useQuery<PaymentRequest[]>({
        queryKey: ['allPaymentRequests'],
        queryFn: () => getPaymentRequests(),
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    const { data: studentData, isLoading: isLoadingStudentData, isError: isErrorStudentData, error: studentDataError } = useQuery({
        queryKey: ['studentFullInfoForConvocationDetail', viewingDetails?.student_number],
        queryFn: () => getStudentFullInfo(viewingDetails!.student_number),
        enabled: !!viewingDetails,
        refetchOnWindowFocus: false,
    });

    type SortableColumn = 'date' | 'student' | 'ref' | 'ceremony' | 'due' | 'session' | 'course' | 'package' | 'seats';

    const handleSort = (column: SortableColumn) => {
        const isCurrentlySorted = sortOption.startsWith(column);
        const currentDirection = sortOption.split('-')[1];

        if (isCurrentlySorted) {
            const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
            setSortOption(`${column}-${newDirection}`);
        } else {
            const newDirection = column === 'date' ? 'desc' : 'asc';
            setSortOption(`${column}-${newDirection}`);
        }
    };
    
    const SortableHeader = ({ column, label }: { column: SortableColumn, label: string }) => {
        const isSorted = sortOption.startsWith(column);
        const isAsc = isSorted && sortOption.endsWith('asc');

        return (
            <Button variant="ghost" onClick={() => handleSort(column)} className="px-2 py-1 h-auto -ml-2 text-xs font-semibold hover:bg-transparent">
                {label}
                {isSorted ? (
                    isAsc ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                ) : (
                    <ChevronsUpDown className="ml-1 h-3 w-3 opacity-30" />
                )}
            </Button>
        );
    };

    const registrationStats = useMemo(() => {
        if (!registrations) {
            return {
                totalBookings: 0,
                pendingPayments: 0,
                confirmedPayments: 0,
                additionalSeats: 0,
            };
        }

        const totalBookings = registrations.length;
        const pendingPayments = registrations.filter(r => r.payment_status.toLowerCase() === 'pending').length;
        const confirmedPayments = registrations.filter(r => ['paid', 'approved', 'confirmed'].includes(r.payment_status.toLowerCase())).length;
        const additionalSeats = registrations.reduce((acc, reg) => {
            const seats = parseInt(reg.additional_seats, 10);
            return acc + (isNaN(seats) ? 0 : seats);
        }, 0);

        return { totalBookings, pendingPayments, confirmedPayments, additionalSeats };
    }, [registrations]);


    const filteredRegistrations = useMemo(() => {
        if (!registrations || !packages) return [];
        const lowercasedSearch = searchTerm.toLowerCase();
        
        const seenHashes = new Set<string>();

        const filtered = registrations.map(reg => {
            const isDuplicate = seenHashes.has(reg.hash_value);
            if (reg.hash_value) seenHashes.add(reg.hash_value);
            
            const pkg = packages.find(p => p.package_id === reg.package_id);
            const dueAmount = pkg ? parseFloat(pkg.price) + (parseInt(reg.additional_seats, 10) * PARENT_SEAT_RATE) : 0;
            
            return { ...reg, isDuplicate, dueAmount };
        })
        .filter(reg => {
            const matchesSearch = lowercasedSearch === '' || 
                reg.student_number.toLowerCase().includes(lowercasedSearch) ||
                reg.name_on_certificate.toLowerCase().includes(lowercasedSearch) ||
                reg.reference_number.toLowerCase().includes(lowercasedSearch);
            
            const matchesStatus = statusFilter === 'all' || reg.payment_status.toLowerCase() === statusFilter.toLowerCase();
            const matchesCourse = courseFilter === 'all' || reg.course_id.split(',').map(s => s.trim()).includes(courseFilter);
            const matchesPackage = packageFilter === 'all' || reg.package_id === packageFilter;
            const matchesSession = sessionFilter === 'all' || reg.session === sessionFilter;
            
            return matchesSearch && matchesStatus && matchesCourse && matchesPackage && matchesSession;
        });

        return filtered.sort((a, b) => {
            const getSortableValue = (reg: typeof a, column: SortableColumn) => {
                switch(column) {
                    case 'student': return reg.student_number;
                    case 'ref': return parseInt(reg.reference_number, 10);
                    case 'ceremony': return reg.ceremony_number || '';
                    case 'due': {
                        const isPaid = ['paid', 'approved', 'confirmed'].includes(reg.payment_status.toLowerCase());
                        return isPaid ? reg.dueAmount - parseFloat(reg.payment_amount) : reg.dueAmount;
                    }
                    case 'session': return reg.session;
                    case 'course': return reg.course_id;
                    case 'package':
                        const pkg = packages?.find(p => p.package_id === reg.package_id)?.package_name || '';
                        return pkg;
                    case 'seats': return parseInt(reg.additional_seats, 10);
                    case 'date':
                    default:
                        const date = parseISO(reg.registered_at);
                        return isValid(date) ? date.getTime() : 0;
                }
            }

            const [column, direction] = sortOption.split('-') as [SortableColumn, 'asc' | 'desc'];
            
            const valA = getSortableValue(a, column);
            const valB = getSortableValue(b, column);

            if (typeof valA === 'string' && typeof valB === 'string') {
                return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            if (typeof valA === 'number' && typeof valB === 'number') {
                 return direction === 'asc' ? valA - valB : valB - valA;
            }
            return 0;
        });

    }, [registrations, packages, searchTerm, statusFilter, courseFilter, packageFilter, sessionFilter, sortOption]);
    
    useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, courseFilter, packageFilter, sessionFilter, sortOption]);

    const totalPages = Math.ceil(filteredRegistrations.length / ITEMS_PER_PAGE);
    const paginatedRegistrations = useMemo(() => {
        return filteredRegistrations.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    }, [filteredRegistrations, currentPage]);
    
    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'bg-yellow-500 text-white';
            case 'partially paid': return 'bg-amber-600 text-white';
            case 'paid':
            case 'approved': 
                return 'bg-green-600 text-white';
            case 'confirmed': return 'bg-blue-600 text-white';
            case 'canceled': 
            case 'rejected':
                return 'bg-destructive';
            default: return 'bg-info';
        }
    };

    if (isError) {
        return (
             <div className="p-4 md:p-8">
                <h1 className="text-3xl font-headline font-semibold text-destructive">An Error Occurred</h1>
                <p className="text-muted-foreground">{(error as Error).message}</p>
            </div>
        )
    }

    const isLoadingData = isLoading || isLoadingPackages || isLoadingCourses || isLoadingPayments;

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <RegistrationDetailDialog
                registration={viewingDetails}
                open={!!viewingDetails}
                onOpenChange={(open) => !open && setViewingDetails(null)}
                courses={courses}
                packages={packages}
                studentData={studentData}
                isLoading={isLoadingStudentData}
                isError={isErrorStudentData}
                error={studentDataError}
            />

            <header>
                {ceremonyIdFilter ? (
                    <Button variant="ghost" onClick={() => router.push('/admin/manage/convocation-ceremonies')} className="-ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Ceremonies
                    </Button>
                ) : null}
                <h1 className="text-3xl font-headline font-semibold mt-2">{ceremonyIdFilter ? "Ceremony Registrations" : "All Convocation Registrations"}</h1>
                <p className="text-muted-foreground">
                    {ceremonyIdFilter 
                        ? `Showing registrations for ceremony ID ${ceremonyIdFilter}.`
                        : "View and manage all student registrations for convocation."}
                </p>
            </header>
            
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                        <BookUser className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{registrationStats.totalBookings}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                        <Hourglass className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{registrationStats.pendingPayments}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Confirmed Payments</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{registrationStats.confirmedPayments}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Additional Seats</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{registrationStats.additionalSeats}</div></CardContent>
                </Card>
            </section>
            
            <Card className="shadow-lg relative w-full overflow-hidden">
                <CardHeader className="border-b bg-muted/20 pb-6">
                     <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <CardTitle>All Registrations</CardTitle>
                             <CardDescription>
                                {isLoading ? "Loading..." : `${filteredRegistrations.length} registrations found.`}
                            </CardDescription>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 pt-4">
                        <div className="relative w-full lg:col-span-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search name, student #, ref #" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-10"/>
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-10"><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent>
                        </Select>
                        <Select value={sessionFilter} onValueChange={setSessionFilter}>
                            <SelectTrigger className="h-10"><SelectValue placeholder="Session" /></SelectTrigger>
                            <SelectContent><SelectItem value="all">All Sessions</SelectItem><SelectItem value="1">Session 1</SelectItem><SelectItem value="2">Session 2</SelectItem></SelectContent>
                        </Select>
                        <Select value={courseFilter} onValueChange={setCourseFilter} disabled={isLoadingCourses}>
                            <SelectTrigger className="h-10"><SelectValue placeholder="Course" /></SelectTrigger>
                            <SelectContent><SelectItem value="all">All Courses</SelectItem>{courses?.map(c => <SelectItem key={c.id} value={c.id}>{c.course_name}</SelectItem>)}</SelectContent>
                        </Select>
                         <Select value={packageFilter} onValueChange={setPackageFilter} disabled={isLoadingPackages}>
                            <SelectTrigger className="h-10"><SelectValue placeholder="Package" /></SelectTrigger>
                            <SelectContent><SelectItem value="all">All Packages</SelectItem>{packages?.filter(p => !ceremonyIdFilter || p.convocation_id === ceremonyIdFilter).map(p => <SelectItem key={p.package_id} value={p.package_id}>{p.package_name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoadingData ? (
                         <div className="p-6 space-y-2">
                           <Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" />
                        </div>
                    ) : (
                        <div className="w-full overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/10">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[120px]"><SortableHeader column="ref" label="Ref / Cerem" /></TableHead>
                                        <TableHead className="min-w-[180px]"><SortableHeader column="student" label="Student Details" /></TableHead>
                                        <TableHead className="min-w-[200px]">Selection (Course/Pkg)</TableHead>
                                        <TableHead className="w-[100px] text-center">Booking</TableHead>
                                        <TableHead className="w-[120px] text-right"><SortableHeader column="due" label="Financials" /></TableHead>
                                        <TableHead className="w-[140px]">Status</TableHead>
                                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedRegistrations.length > 0 ? paginatedRegistrations.map((reg) => {
                                        const lastPaymentRequest = paymentRequests?.filter(pr => pr.unique_number === reg.student_number).pop();
                                        const isPaid = ['paid', 'approved', 'confirmed'].includes(reg.payment_status.toLowerCase());
                                        const due = isPaid ? reg.dueAmount - parseFloat(reg.payment_amount) : reg.dueAmount;

                                        return (
                                        <TableRow key={reg.registration_id} className={cn("text-xs transition-colors", reg.isDuplicate && "bg-destructive/5 hover:bg-destructive/10")}>
                                            <TableCell>
                                                <div className="font-mono font-bold text-sm">#{reg.reference_number}</div>
                                                <div className="text-[10px] text-muted-foreground">Ceremony: {reg.ceremony_number}</div>
                                            </TableCell>
                                            
                                            <TableCell>
                                                <div className="font-semibold text-sm">{reg.student_number}</div>
                                                <div className="text-[10px] text-muted-foreground truncate max-w-[160px]" title={reg.name_on_certificate}>
                                                    {reg.name_on_certificate}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex flex-col gap-1 mb-1.5 max-w-[200px]">
                                                    {reg.course_id.split(',').map(id => {
                                                        const course = courses?.find(c => c.id === id.trim());
                                                        return (
                                                            <div key={id} className="text-[10px] leading-tight font-medium text-foreground">
                                                                • {course?.course_name || `ID: ${id}`}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                                <Select defaultValue={reg.package_id} onValueChange={(value) => console.log('Update package', value)}>
                                                    <SelectTrigger className="h-7 px-2 text-[10px] w-full max-w-[160px] bg-background"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {packages?.filter(p => p.convocation_id === reg.convocation_id).map(p => (
                                                            <SelectItem key={p.package_id} value={p.package_id} className="text-xs">{p.package_name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex flex-col gap-1 items-center">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] text-muted-foreground">Sess:</span>
                                                        <Select defaultValue={reg.session} onValueChange={(value) => console.log('Update session', value)}>
                                                            <SelectTrigger className="h-6 px-1 w-10 text-[10px] bg-background"><SelectValue /></SelectTrigger>
                                                            <SelectContent><SelectItem value="1">1</SelectItem><SelectItem value="2">2</SelectItem></SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] text-muted-foreground">Seats:</span>
                                                        <Select defaultValue={reg.additional_seats} onValueChange={(value) => console.log('Update seats', value)}>
                                                            <SelectTrigger className="h-6 px-1 w-10 text-[10px] bg-background"><SelectValue /></SelectTrigger>
                                                            <SelectContent>{[0,1,2].map(i => <SelectItem key={i} value={String(i)}>{i}</SelectItem>)}</SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <div className={cn("font-mono font-bold text-sm", due > 0 ? "text-destructive" : "text-green-600")}>
                                                    {due.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    Paid: {parseFloat(reg.payment_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <Badge className={cn("px-1.5 py-0 h-4 text-[9px] uppercase font-bold", getStatusBadge(reg.payment_status))}>{reg.payment_status}</Badge>
                                                        {reg.isDuplicate && <Badge variant="destructive" className="px-1.5 py-0 h-4 text-[8px] animate-pulse">DUP</Badge>}
                                                    </div>
                                                    <Badge variant="secondary" className="px-1.5 py-0 h-4 text-[9px] uppercase font-medium w-fit">{reg.registration_status}</Badge>
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="flex items-center gap-1">
                                                        <Button variant="outline" size="sm" onClick={() => setViewingDetails(reg)} className="h-7 px-2 text-[10px]">
                                                            <Eye className="h-3 w-3 mr-1" /> View
                                                        </Button>
                                                        <ViewSlipDialog slipPath={reg.image_path} studentName={reg.name_on_certificate} trigger={
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10">
                                                                <FileText className="h-4 w-4"/>
                                                            </Button>
                                                        } />
                                                    </div>
                                                    {lastPaymentRequest?.slip_path && (
                                                        <ViewSlipDialog slipPath={lastPaymentRequest.slip_path} studentName={reg.name_on_certificate} trigger={
                                                            <Button variant="ghost" size="xs" className="h-5 px-1.5 text-[9px] underline underline-offset-2 decoration-dotted text-blue-600">
                                                                2nd Payment Slip
                                                            </Button>
                                                        }/>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        )
                                    }) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center h-32 text-muted-foreground italic">No registrations found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
                 <CardFooter className="flex items-center justify-center space-x-2 py-4 border-t bg-muted/10">
                     <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Previous</Button>
                     <span className="text-sm font-medium">Page {currentPage} of {totalPages || 1}</span>
                     <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}>Next</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
