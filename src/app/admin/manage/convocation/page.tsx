
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getConvocationRegistrations, getPackagesByCeremony } from '@/lib/actions/certificates';
import { getParentCourses } from '@/lib/actions/courses';
import { getPaymentRequests } from '@/lib/actions/payments';
import type { ConvocationRegistration, ConvocationPackage, ParentCourse, PaymentRequest, FullStudentData, StudentEnrollment, ApiPaymentRecord } from '@/lib/types';
import { format, isValid, parseISO } from 'date-fns';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { getStudentFullInfo } from '@/lib/actions/users';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Search, FileText, ArrowLeft, ArrowUp, ArrowDown, ChevronsUpDown, BookUser, Hourglass, CheckCircle, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 25;
const CONTENT_PROVIDER_URL = process.env.NEXT_PUBLIC_CONTENT_PROVIDER_URL || 'https://content-provider.pharmacollege.lk';
const PARENT_SEAT_RATE = 750;

const InfoBox = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="p-3 bg-muted/50 rounded-md">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold text-sm">{value || 'N/A'}</p>
    </div>
);

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

    const paymentRecordsArray = studentData ? Object.values(studentData.studentBalance.paymentRecords).sort((a, b) => new Date(b.paid_date).getTime() - new Date(a.paid_date).getTime()) : [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Booking Details: #{registration.reference_number}</DialogTitle>
                    <DialogDescription>
                        Detailed overview for student {registration.student_number}.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="pr-4 -mr-4">
                    {isLoadingStudentData && (
                        <div className="space-y-4 p-4">
                            <Skeleton className="h-40 w-full" />
                            <Skeleton className="h-64 w-full" />
                        </div>
                    )}
                    {isError && (
                        <div className="text-destructive p-4">Error loading student details: {(error as Error).message}</div>
                    )}
                    {studentData && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader><CardTitle>Booking Info</CardTitle></CardHeader>
                                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <InfoBox label="Ref #" value={registration.reference_number} />
                                    <InfoBox label="Student Number" value={registration.student_number} />
                                    <InfoBox label="Courses" value={getCourseNames(registration.course_id)} />
                                    <InfoBox label="Payment Status" value={<Badge>{registration.payment_status}</Badge>} />
                                    <InfoBox label="Overall Balance" value={`LKR ${studentData.studentBalance.studentBalance.toLocaleString()}`} />
                                    <InfoBox label="Additional Seats" value={registration.additional_seats} />
                                    <InfoBox label="Payable Amount" value={`LKR ${parseFloat(registration.payment_amount).toLocaleString()}`} />
                                    <InfoBox label="Package" value={getPackageName(registration.package_id)} />
                                </CardContent>
                            </Card>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                                <Card>
                                    <CardHeader><CardTitle>Payment Details</CardTitle></CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Due:</span> <span className="font-semibold">LKR {studentData.studentBalance.TotalRegistrationFee.toLocaleString()}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Payments:</span> <span className="font-semibold text-green-600">LKR {studentData.studentBalance.totalPaymentAmount.toLocaleString()}</span></div>
                                        <div className="flex justify-between text-lg font-bold"><span className="text-muted-foreground">Balance:</span> <span className={cn(studentData.studentBalance.studentBalance > 0 ? 'text-destructive' : 'text-green-600')}>LKR {studentData.studentBalance.studentBalance.toLocaleString()}</span></div>
                                        <div className="pt-4">
                                            <a href={`${CONTENT_PROVIDER_URL}${registration.image_path}`} target="_blank" rel="noopener noreferrer">
                                                <Button className="w-full" variant="outline">View Main Payment Slip</Button>
                                            </a>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader><CardTitle>Payment Transactions</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {paymentRecordsArray.length > 0 ? paymentRecordsArray.map(rec => (
                                                <div key={rec.id} className="text-xs p-2 border rounded-md flex justify-between items-center">
                                                    <div>
                                                        <p className="font-semibold">{rec.receipt_number}</p>
                                                        <p>{rec.course_code} - {rec.paid_date}</p>
                                                    </div>
                                                    <p className="font-bold">LKR {parseFloat(rec.paid_amount).toLocaleString()}</p>
                                                </div>
                                            )) : <p className="text-sm text-center text-muted-foreground">No transaction history.</p>}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            <Card>
                                <CardHeader><CardTitle>Enrollments</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    {Object.values(studentData.studentEnrollments).map(enrollment => (
                                        <Accordion key={enrollment.id} type="multiple" className="w-full border rounded-md px-4">
                                            <AccordionItem value="item-1" className="border-b-0">
                                                <AccordionTrigger className="py-3">{enrollment.parent_course_name} ({enrollment.course_code})</AccordionTrigger>
                                                <AccordionContent>
                                                    <p className="text-sm">Average Grade: {enrollment.assignment_grades.average_grade}%</p>
                                                    {/* Further details can be added here if needed */}
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    )}
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
        staleTime: 1000 * 60 * 5, 
    });

    const { data: packages, isLoading: isLoadingPackages } = useQuery<ConvocationPackage[]>({
        queryKey: ['convocationPackages', ceremonyIdFilter],
        queryFn: () => getPackagesByCeremony(ceremonyIdFilter || ''),
        enabled: !!ceremonyIdFilter,
    });
    
    const { data: courses, isLoading: isLoadingCourses } = useQuery<ParentCourse[]>({
        queryKey: ['allParentCourses'],
        queryFn: getParentCourses,
    });
    
    const { data: paymentRequests, isLoading: isLoadingPayments } = useQuery<PaymentRequest[]>({
        queryKey: ['allPaymentRequests'],
        queryFn: getPaymentRequests,
    });

    const { data: studentData, isLoading: isLoadingStudentData, isError: isErrorStudentData, error: studentDataError } = useQuery<FullStudentData>({
        queryKey: ['studentFullInfoForConvocationDetail', viewingDetails?.student_number],
        queryFn: () => getStudentFullInfo(viewingDetails!.student_number),
        enabled: !!viewingDetails,
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
            <Button variant="ghost" onClick={() => handleSort(column)} className="px-2 py-1 h-auto -ml-2">
                {label}
                {isSorted ? (
                    isAsc ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                ) : (
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-30" />
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
            seenHashes.add(reg.hash_value);
            
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
            
            <Card className="shadow-lg relative w-full">
                <CardHeader>
                     <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <CardTitle>All Registrations</CardTitle>
                             <CardDescription>
                                {isLoading ? "Loading..." : `${filteredRegistrations.length} registrations found.`}
                            </CardDescription>
                        </div>
                    </div>
                     <div className="space-y-2 pt-4">
                        <div className="relative w-full md:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search by name, student #, ref #" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                             <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger><SelectValue placeholder="Filter by status" /></SelectTrigger>
                                <SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent>
                            </Select>
                            <Select value={sessionFilter} onValueChange={setSessionFilter}>
                                <SelectTrigger><SelectValue placeholder="Filter by session" /></SelectTrigger>
                                <SelectContent><SelectItem value="all">All Sessions</SelectItem><SelectItem value="1">Session 1</SelectItem><SelectItem value="2">Session 2</SelectItem></SelectContent>
                            </Select>
                            <Select value={courseFilter} onValueChange={setCourseFilter} disabled={isLoadingCourses}>
                                <SelectTrigger><SelectValue placeholder="Filter by course" /></SelectTrigger>
                                <SelectContent><SelectItem value="all">All Courses</SelectItem>{courses?.map(c => <SelectItem key={c.id} value={c.id}>{c.course_name}</SelectItem>)}</SelectContent>
                            </Select>
                             <Select value={packageFilter} onValueChange={setPackageFilter} disabled={isLoadingPackages}>
                                <SelectTrigger><SelectValue placeholder="Filter by package" /></SelectTrigger>
                                <SelectContent><SelectItem value="all">All Packages</SelectItem>{packages?.filter(p => !ceremonyIdFilter || p.convocation_id === ceremonyIdFilter).map(p => <SelectItem key={p.package_id} value={p.package_id}>{p.package_name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoadingData ? (
                         <div className="space-y-2">
                           <Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" />
                        </div>
                    ) : (
                        <div className="w-full overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead><SortableHeader column="ref" label="Ref #" /></TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead><SortableHeader column="ceremony" label="Ceremony #" /></TableHead>
                                        <TableHead><SortableHeader column="due" label="Due" /></TableHead>
                                        <TableHead>2nd Payment</TableHead>
                                        <TableHead><SortableHeader column="student" label="Student #" /></TableHead>
                                        <TableHead><SortableHeader column="session" label="Session" /></TableHead>
                                        <TableHead><SortableHeader column="course" label="Courses" /></TableHead>
                                        <TableHead><SortableHeader column="package" label="Package" /></TableHead>
                                        <TableHead><SortableHeader column="seats" label="Add. Seats" /></TableHead>
                                        <TableHead>Paid</TableHead>
                                        <TableHead>Slip</TableHead>
                                        <TableHead>Duplicate</TableHead>
                                        <TableHead>Payment Status</TableHead>
                                        <TableHead>Registration Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedRegistrations.length > 0 ? paginatedRegistrations.map((reg) => {
                                        const lastPaymentRequest = paymentRequests?.filter(pr => pr.unique_number === reg.student_number).pop();
                                        return (
                                        <TableRow key={reg.registration_id}>
                                            <TableCell>{reg.reference_number}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 w-20">
                                                    <Button variant="outline" size="sm" onClick={() => setViewingDetails(reg)}>View</Button>
                                                </div>
                                            </TableCell>
                                            <TableCell>{reg.ceremony_number}</TableCell>
                                            <TableCell>
                                                {(() => {
                                                    const isPaid = ['paid', 'approved', 'confirmed'].includes(reg.payment_status.toLowerCase());
                                                    const due = isPaid ? reg.dueAmount - parseFloat(reg.payment_amount) : reg.dueAmount;
                                                    return due.toFixed(2);
                                                })()}
                                            </TableCell>
                                            <TableCell>
                                                <ViewSlipDialog slipPath={lastPaymentRequest?.slip_path || null} studentName={reg.name_on_certificate} trigger={
                                                    <Button variant="outline" size="sm" disabled={!lastPaymentRequest?.slip_path}>
                                                        {lastPaymentRequest ? 'View Slip' : 'No Request'}
                                                    </Button>
                                                }/>
                                            </TableCell>
                                            <TableCell>{reg.student_number}</TableCell>
                                            <TableCell>
                                                <Select defaultValue={reg.session} onValueChange={(value) => console.log('TODO: Update session to', value)}><SelectTrigger className="w-20"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">1</SelectItem><SelectItem value="2">2</SelectItem></SelectContent></Select>
                                            </TableCell>
                                            <TableCell>
                                                {reg.course_id.split(',').map(id => {
                                                    const courseName = courses?.find(c => c.id === id.trim())?.course_name || `ID: ${id}`;
                                                    return <div key={id} className="whitespace-nowrap">{courseName}</div>
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                <Select defaultValue={reg.package_id} onValueChange={(value) => console.log('TODO: Update package to', value)}><SelectTrigger><SelectValue placeholder="Select Package" /></SelectTrigger><SelectContent>{packages?.filter(p => p.convocation_id === reg.convocation_id).map(p => <SelectItem key={p.package_id} value={p.package_id}>{p.package_name}</SelectItem>)}</SelectContent></Select>
                                            </TableCell>
                                             <TableCell>
                                                <Select defaultValue={reg.additional_seats} onValueChange={(value) => console.log('TODO: Update seats to', value)}><SelectTrigger className="w-20"><SelectValue /></SelectTrigger><SelectContent>{[0,1,2].map(i => <SelectItem key={i} value={String(i)}>{i}</SelectItem>)}</SelectContent></Select>
                                            </TableCell>
                                            <TableCell>{parseFloat(reg.payment_amount).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <ViewSlipDialog slipPath={reg.image_path} studentName={reg.name_on_certificate} trigger={<Button variant="outline" size="sm">View</Button>} />
                                            </TableCell>
                                            <TableCell>{reg.isDuplicate && <Badge variant="destructive">Duplicate</Badge>}</TableCell>
                                            <TableCell><Badge className={getStatusBadge(reg.payment_status)}>{reg.payment_status}</Badge></TableCell>
                                            <TableCell><Badge variant="secondary">{reg.registration_status}</Badge></TableCell>
                                        </TableRow>
                                        )
                                    }) : (
                                        <TableRow>
                                            <TableCell colSpan={16} className="text-center h-24">No registrations found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
                 <CardFooter className="flex items-center justify-center space-x-2 pt-4">
                     <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Previous</Button>
                     <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages || 1}</span>
                     <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}>Next</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
