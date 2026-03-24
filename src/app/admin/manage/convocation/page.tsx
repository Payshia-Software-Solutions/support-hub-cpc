
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
    getConvocationRegistrations, 
    getPackagesByCeremony, 
} from '@/lib/actions/certificates';
import { getParentCourses } from '@/lib/actions/courses';
import { getStudentFullInfo } from '@/lib/actions/users';
import type { 
    ConvocationRegistration, 
    ConvocationPackage, 
    ParentCourse, 
    FullStudentData
} from '@/lib/types';
import { parseISO, isValid, format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ArrowLeft, ArrowUp, ArrowDown, ChevronsUpDown, Eye, FileDown, Loader2, Banknote, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

// Modular Components
import { RegistrationDetailDialog } from '@/components/admin/convocation/RegistrationDetailDialog';

const ITEMS_PER_PAGE = 25;
const PARENT_SEAT_RATE = 750;

export default function ConvocationListPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const ceremonyIdFilter = searchParams.get('ceremonyId');
    const initialPage = parseInt(searchParams.get('page') || '1', 10);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [courseFilter, setCourseFilter] = useState('all');
    const [packageFilter, setPackageFilter] = useState('all');
    const [sessionFilter, setSessionFilter] = useState('all');
    const [sortOption, setSortOption] = useState('ref-desc'); // Default to Latest First (Ref Descending)
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [viewingDetails, setViewingDetails] = useState<ConvocationRegistration | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    
    // Map to store fetched student enrollment details (including marks)
    const [studentDataMap, setStudentDataMap] = useState<Map<string, FullStudentData>>(new Map());

    const { data: registrations, isLoading, isError, error } = useQuery<ConvocationRegistration[]>({
        queryKey: ['convocationRegistrations', ceremonyIdFilter],
        queryFn: () => getConvocationRegistrations(ceremonyIdFilter || undefined),
        staleTime: 1000 * 60 * 15,
        refetchOnWindowFocus: false,
    });

    const { data: packages, isLoading: isLoadingPackages } = useQuery<ConvocationPackage[]>({
        queryKey: ['convocationPackages', ceremonyIdFilter],
        queryFn: () => getPackagesByCeremony(ceremonyIdFilter || ''),
        staleTime: 1000 * 60 * 15,
        refetchOnWindowFocus: false,
    });
    
    const { data: courses, isLoading: isLoadingCourses } = useQuery<ParentCourse[]>({
        queryKey: ['allParentCourses'],
        queryFn: getParentCourses,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
    });

    // Keep the details dialog in sync with updated data when the query refreshes
    useEffect(() => {
        if (viewingDetails && registrations) {
            const updated = registrations.find(r => r.registration_id === viewingDetails.registration_id);
            if (updated) {
                setViewingDetails(updated);
            }
        }
    }, [registrations, viewingDetails]);

    type SortableColumn = 'date' | 'student' | 'ref' | 'ceremony' | 'due' | 'session' | 'course' | 'package' | 'seats';

    const handleSort = (column: SortableColumn) => {
        const isCurrentlySorted = sortOption.startsWith(column);
        const currentDirection = sortOption.split('-')[1];

        if (isCurrentlySorted) {
            const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
            setSortOption(`${column}-${newDirection}`);
        } else {
            const newDirection = column === 'date' || column === 'ref' ? 'desc' : 'asc';
            setSortOption(`${column}-${newDirection}`);
        }
    };
    
    const SortableHeader = ({ column, label, className }: { column: SortableColumn, label: string, className?: string }) => {
        const isSorted = sortOption.startsWith(column);
        const isAsc = isSorted && sortOption.endsWith('asc');

        return (
            <button 
                onClick={() => handleSort(column)} 
                className={cn("flex items-center gap-1 hover:text-primary transition-colors text-xs font-semibold uppercase tracking-wider", className)}
            >
                {label}
                {isSorted ? (
                    isAsc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                ) : (
                    <ChevronsUpDown className="h-3 w-3 opacity-30" />
                )}
            </button>
        );
    };

    const registrationStats = useMemo(() => {
        if (!registrations || !packages) {
            return { totalBookings: 0, pendingPayments: 0, confirmedPayments: 0, additionalSeats: 0, totalVerified: 0, totalDue: 0 };
        }
        
        const activeRegs = registrations.filter(r => 
            !['rejected', 'canceled'].includes(r.registration_status?.toLowerCase() || '')
        );

        const confirmed = activeRegs.filter(r => {
            const pStatus = r.payment_status?.toLowerCase() || '';
            const rStatus = r.registration_status?.toLowerCase() || '';
            return ['paid', 'approved', 'confirmed'].includes(pStatus) || 
                   ['paid', 'approved', 'confirmed'].includes(rStatus);
        });

        let totalVerified = 0;
        let totalDue = 0;

        activeRegs.forEach(reg => {
            const pkg = packages.find(p => p.package_id === reg.package_id);
            const packagePrice = pkg ? parseFloat(pkg.price) : 0;
            const guestSeatsCount = parseInt(reg.additional_seats, 10) || 0;
            const dueAmount = packagePrice + (guestSeatsCount * PARENT_SEAT_RATE);
            const paidAmount = parseFloat(reg.payment_amount) || 0;

            totalVerified += paidAmount;
            totalDue += Math.max(0, dueAmount - paidAmount);
        });

        return {
            totalBookings: activeRegs.length,
            confirmedPayments: confirmed.length,
            pendingPayments: activeRegs.length - confirmed.length,
            additionalSeats: activeRegs.reduce((acc, reg) => acc + (parseInt(reg.additional_seats, 10) || 0), 0),
            totalVerified,
            totalDue
        };
    }, [registrations, packages]);


    const filteredRegistrations = useMemo(() => {
        if (!registrations || !packages) return [];
        const lowercasedSearch = searchTerm.toLowerCase();
        
        const seenHashes = new Set<string>();

        const filtered = registrations.map(reg => {
            const isDuplicate = seenHashes.has(reg.hash_value);
            if (reg.hash_value) seenHashes.add(reg.hash_value);
            
            const pkg = packages.find(p => p.package_id === reg.package_id);
            const packagePrice = pkg ? parseFloat(pkg.price) : 0;
            const guestSeatsCount = parseInt(reg.additional_seats, 10) || 0;
            const dueAmount = packagePrice + (guestSeatsCount * PARENT_SEAT_RATE);
            
            return { ...reg, isDuplicate, dueAmount };
        })
        .filter(reg => {
            const matchesSearch = lowercasedSearch === '' || 
                (reg.student_number?.toLowerCase() || '').includes(lowercasedSearch) ||
                (reg.name_on_certificate?.toLowerCase() || '').includes(lowercasedSearch) ||
                (reg.reference_number?.toLowerCase() || '').includes(lowercasedSearch);
            
            const matchesStatus = statusFilter === 'all' || (reg.payment_status?.toLowerCase() || '') === statusFilter.toLowerCase();
            const matchesCourse = (reg.course_id || '').split(',').some(id => {
                const course = courses?.find(c => c.id === id.trim());
                return courseFilter === 'all' || course?.id === courseFilter;
            });
            const matchesPackage = packageFilter === 'all' || reg.package_id === packageFilter;
            const matchesSession = sessionFilter === 'all' || reg.session === sessionFilter;
            
            return matchesSearch && matchesStatus && matchesCourse && matchesPackage && matchesSession;
        });

        return filtered.sort((a, b) => {
            const getSortableValue = (reg: any, column: SortableColumn) => {
                switch(column) {
                    case 'student': return reg.student_number || '';
                    case 'ref': return parseInt(reg.reference_number || '0', 10);
                    case 'ceremony': return reg.ceremony_number || '';
                    case 'due': return reg.dueAmount || 0;
                    case 'session': return reg.session || '';
                    case 'course': return reg.course_id || '';
                    case 'package': return packages?.find(p => p.package_id === reg.package_id)?.package_name || '';
                    case 'seats': return parseInt(reg.additional_seats || '0', 10);
                    case 'date':
                    default:
                        const date = parseISO(reg.registered_at);
                        return isValid(date) ? date.getTime() : 0;
                }
            }

            const [column, direction] = sortOption.split('-') as [SortableColumn, 'asc' | 'desc'];
            const valA = getSortableValue(a, column);
            const valB = getSortableValue(b, column);

            if (typeof valA === 'string' && typeof valB === 'string') return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            if (typeof valA === 'number' && typeof valB === 'number') return direction === 'asc' ? (valA - valB) : (valB - valA);
            return 0;
        });

    }, [registrations, packages, searchTerm, statusFilter, courseFilter, packageFilter, sessionFilter, sortOption, courses]);
    
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', String(currentPage));
        router.push(`?${params.toString()}`, { scroll: false });
    }, [currentPage, router, searchParams]);

    useEffect(() => { 
        setCurrentPage(1); 
    }, [searchTerm, statusFilter, courseFilter, packageFilter, sessionFilter, sortOption]);

    const totalPages = Math.ceil(filteredRegistrations.length / ITEMS_PER_PAGE);
    const paginatedRegistrations = useMemo(() => {
        return filteredRegistrations.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    }, [filteredRegistrations, currentPage]);

    const studentNumbersToFetch = useMemo(() => {
        return [...new Set(paginatedRegistrations.map(o => o.student_number).filter(sn => !studentDataMap.has(sn)))];
    }, [paginatedRegistrations, studentDataMap]);

    const { isLoading: isLoadingStudentData } = useQuery({
        queryKey: ['batchStudentDataConvocation', studentNumbersToFetch],
        queryFn: async () => {
            if (studentNumbersToFetch.length === 0) return null;
            const results = await Promise.all(
                studentNumbersToFetch.map(sn => getStudentFullInfo(sn).catch(() => null))
            );
            const newMap = new Map(studentDataMap);
            results.forEach((res, index) => {
                if (res) newMap.set(studentNumbersToFetch[index], res);
            });
            setStudentDataMap(newMap);
            return newMap;
        },
        enabled: studentNumbersToFetch.length > 0,
        refetchOnWindowFocus: false,
    });
    
    const handleExport = async () => {
        if (!filteredRegistrations.length) return;
        setIsExporting(true);
        setExportProgress(0);

        try {
            const studentNumbers = [...new Set(filteredRegistrations.map(r => r.student_number))];
            const fullDataMap = new Map<string, FullStudentData>();

            const CHUNK_SIZE = 10;
            const totalSteps = studentNumbers.length;
            
            for (let i = 0; i < studentNumbers.length; i += CHUNK_SIZE) {
                const chunk = studentNumbers.slice(i, i + CHUNK_SIZE);
                const results = await Promise.all(
                    chunk.map(sn => getStudentFullInfo(sn).catch(() => null))
                );
                results.forEach((res, idx) => {
                    if (res) fullDataMap.set(chunk[idx], res);
                });
                setExportProgress(Math.round(((i + chunk.length) / totalSteps) * 100));
            }

            const headers = [
                'Ref #',
                'Ceremony #',
                'Student ID',
                'Student Name (Profile)',
                'Name on Cert (Booking)',
                'Name on Cert (Profile)',
                'Courses',
                'CPP Avg (%)',
                'ACPP Avg (%)',
                'Package',
                'Session',
                'Seats',
                'Payment Status',
                'Reg. Status',
                'Total Payable',
                'Total Paid',
                'Due Balance'
            ];

            const rows = filteredRegistrations.map(reg => {
                const studentFullData = fullDataMap.get(reg.student_number);
                
                const cppEnrollment = studentFullData?.studentEnrollments ? 
                    Object.values(studentFullData.studentEnrollments).find(e => e.parent_course_id === "1") : null;
                const acppEnrollment = studentFullData?.studentEnrollments ? 
                    Object.values(studentFullData.studentEnrollments).find(e => e.parent_course_id === "2") : null;

                const cppAvg = cppEnrollment ? `${parseFloat(cppEnrollment.assignment_grades.average_grade).toFixed(2)}%` : 'N/A';
                const acppAvg = acppEnrollment ? `${parseFloat(acppEnrollment.assignment_grades.average_grade).toFixed(2)}%` : 'N/A';

                const courseNames = reg.course_id.split(',').map(id => {
                    const course = courses?.find(c => c.id === id.trim());
                    return course ? course.course_name : `ID: ${id}`;
                }).join('; ');

                const paidAmount = parseFloat(reg.payment_amount) || 0;
                const due = (reg.dueAmount || 0) - paidAmount;
                const packageName = packages?.find(p => p.package_id === reg.package_id)?.package_name || reg.package_id;

                return [
                    reg.reference_number,
                    reg.ceremony_number || 'N/A',
                    reg.student_number,
                    studentFullData?.studentInfo.full_name || 'N/A',
                    reg.name_on_certificate || 'N/A',
                    studentFullData?.studentInfo.name_on_certificate || 'N/A',
                    courseNames,
                    cppAvg,
                    acppAvg,
                    packageName,
                    reg.session,
                    reg.additional_seats,
                    reg.payment_status,
                    reg.registration_status,
                    reg.dueAmount?.toFixed(2),
                    paidAmount.toFixed(2),
                    due.toFixed(2)
                ];
            });

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `Convocation_Report_${format(new Date(), 'yyyyMMdd')}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast({ title: "Export Successful", description: "Your report has been downloaded." });
        } catch (err) {
            console.error(err);
            toast({ variant: 'destructive', title: "Export Failed", description: "An error occurred while generating the CSV." });
        } finally {
            setIsExporting(false);
            setExportProgress(0);
        }
    };

    const handlePageInputChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const pageNum = parseInt(e.currentTarget.value, 10);
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
                setCurrentPage(pageNum);
            } else {
                 toast({
                    variant: 'destructive',
                    title: 'Invalid Page Number',
                    description: `Please enter a number between 1 and ${totalPages}.`
                });
            }
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'bg-yellow-500 text-white';
            case 'partially-paid':
            case 'partially paid': return 'bg-orange-500 text-white';
            case 'paid':
            case 'approved': return 'bg-green-600 text-white';
            case 'confirmed': return 'bg-blue-600 text-white';
            case 'canceled': 
            case 'rejected': return 'bg-destructive';
            default: return 'bg-info';
        }
    };

    if (isError) return <div className="p-8 text-destructive">Error: {(error as Error).message}</div>;

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <RegistrationDetailDialog
                registration={viewingDetails}
                open={!!viewingDetails}
                onOpenChange={(open) => !open && setViewingDetails(null)}
                packages={packages}
            />

            <Dialog open={isExporting && exportProgress > 0} onOpenChange={() => {}}>
                <DialogContent className="sm:max-w-md" hideCloseButton>
                    <DialogHeader>
                        <DialogTitle>Generating CSV Export</DialogTitle>
                        <DialogDescription>
                            Please wait while we hydrate academic performance data for {filteredRegistrations.length} records.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                        <Progress value={exportProgress} className="h-2" />
                        <p className="text-center text-sm font-medium text-muted-foreground">
                            {exportProgress}% Complete
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    {ceremonyIdFilter && (
                        <Button variant="ghost" onClick={() => router.push('/admin/manage/convocation-ceremonies')} className="-ml-4 h-auto p-1 mb-1">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Ceremonies
                        </Button>
                    )}
                    <h1 className="text-3xl font-headline font-semibold">{ceremonyIdFilter ? "Ceremony Registrations" : "All Convocation Registrations"}</h1>
                    <p className="text-muted-foreground">Manage student registrations and verify bookings.</p>
                </div>
                <Button onClick={handleExport} disabled={isExporting || filteredRegistrations.length === 0}>
                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                    {isExporting ? 'Preparing...' : 'Export to CSV'}
                </Button>
            </header>
            
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Bookings</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold"><AnimatedCounter value={registrationStats.totalBookings} /></div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pending Payments</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold"><AnimatedCounter value={registrationStats.pendingPayments} /></div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Confirmed Payments</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold"><AnimatedCounter value={registrationStats.confirmedPayments} /></div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Additional Seats</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold"><AnimatedCounter value={registrationStats.additionalSeats} /></div></CardContent></Card>
                <Card className="bg-primary/5 border-primary/20"><CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0"><CardTitle className="text-sm font-bold text-primary">Verified Revenue</CardTitle><Banknote className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-xl font-bold text-primary">LKR {registrationStats.totalVerified.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div></CardContent></Card>
                <Card className="bg-destructive/5 border-destructive/20"><CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0"><CardTitle className="text-sm font-bold text-destructive">Due Balance</CardTitle><Wallet className="h-4 w-4 text-destructive" /></CardHeader><CardContent><div className="text-xl font-bold text-destructive">LKR {registrationStats.totalDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div></CardContent></Card>
            </section>
            
            <Card className="shadow-lg overflow-hidden">
                <CardHeader className="border-b bg-muted/20 pb-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 pt-4">
                        <div className="relative lg:col-span-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search student info..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-10"/>
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-10"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent></Select>
                        <Select value={sessionFilter} onValueChange={setSessionFilter}><SelectTrigger className="h-10"><SelectValue placeholder="Session" /></SelectTrigger><SelectContent><SelectItem value="all">All Sessions</SelectItem><SelectItem value="1">Session 1</SelectItem><SelectItem value="2">Session 2</SelectItem></SelectContent></Select>
                        <Select value={courseFilter} onValueChange={setCourseFilter} disabled={isLoadingCourses}><SelectTrigger className="h-10"><SelectValue placeholder="Course" /></SelectTrigger><SelectContent><SelectItem value="all">All Courses</SelectItem>{courses?.map(c => <SelectItem key={c.id} value={c.id}>{c.course_name}</SelectItem>)}</SelectContent></Select>
                         <Select value={packageFilter} onValueChange={setPackageFilter} disabled={isLoadingPackages}><SelectTrigger className="h-10"><SelectValue placeholder="Package" /></SelectTrigger><SelectContent><SelectItem value="all">All Packages</SelectItem>{packages?.filter(p => !ceremonyIdFilter || p.convocation_id === ceremonyIdFilter).map(p => <SelectItem key={p.package_id} value={p.package_id}>{p.package_name}</SelectItem>)}</SelectContent></Select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading || isLoadingPackages || isLoadingCourses ? (
                         <div className="p-6 space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
                    ) : (
                        <div className="w-full overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/10">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[180px]"><SortableHeader column="ref" label="Ref #" /></TableHead>
                                        <TableHead className="w-[220px]">Student Info</TableHead>
                                        <TableHead className="min-w-[200px]">Booking Details</TableHead>
                                        <TableHead className="w-[120px] text-center">CPP Avg (%)</TableHead>
                                        <TableHead className="w-[120px] text-center">ACPP Avg (%)</TableHead>
                                        <TableHead className="w-[150px]">Status</TableHead>
                                        <TableHead className="w-[180px] text-right"><SortableHeader column="due" label="Payment Details" className="justify-end" /></TableHead>
                                        <TableHead className="w-[100px] text-right pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedRegistrations.length > 0 ? paginatedRegistrations.map((reg) => {
                                        const paidAmount = parseFloat(reg.payment_amount) || 0;
                                        const due = (reg.dueAmount || 0) - paidAmount;
                                        const packageName = packages?.find(p => p.package_id === reg.package_id)?.package_name || `ID: ${reg.package_id}`;

                                        const studentFullData = studentDataMap.get(reg.student_number);
                                        const cppEnrollment = studentFullData?.studentEnrollments ? 
                                            Object.values(studentFullData.studentEnrollments).find(e => e.parent_course_id === "1") : null;
                                        const acppEnrollment = studentFullData?.studentEnrollments ? 
                                            Object.values(studentFullData.studentEnrollments).find(e => e.parent_course_id === "2") : null;

                                        return (
                                        <TableRow key={reg.registration_id} className={cn("text-xs transition-colors hover:bg-muted/30", reg.isDuplicate && "bg-destructive/5 hover:bg-destructive/10")}>
                                            <TableCell className="py-4 align-top">
                                                <div className="font-mono font-bold text-sm">#{reg.reference_number}</div>
                                                <div className="text-[9px] text-muted-foreground pt-1">Ceremony: {reg.ceremony_number || 'N/A'}</div>
                                            </TableCell>
                                            <TableCell className="py-4 align-top">
                                                <div className="space-y-1">
                                                    <div className="font-semibold text-sm text-primary">{reg.student_number}</div>
                                                    <div className="text-[10px] font-medium uppercase tracking-tighter truncate max-w-[180px]">{reg.name_on_certificate || 'N/A'}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 align-top">
                                                <div className="space-y-2">
                                                    <div className="flex flex-col gap-1">
                                                        {(reg.course_id || '').split(',').map((id, idIdx) => {
                                                            const trimmedId = id.trim();
                                                            return (
                                                                <div key={`${trimmedId}-${reg.registration_id}-${idIdx}`} className="text-[11px] leading-tight font-medium text-foreground">
                                                                    • {courses?.find(c => c.id === trimmedId)?.course_name || `ID: ${trimmedId}`}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">Pkg: {packageName}</span>
                                                        <Badge variant="outline" className="h-5 text-[9px] px-2 font-bold uppercase">Sess {reg.session}</Badge>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 align-top text-center">
                                                {isLoadingStudentData && !studentFullData ? (
                                                    <Skeleton className="h-5 w-12 mx-auto" />
                                                ) : cppEnrollment ? (
                                                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-mono bg-blue-50 text-blue-700 border-blue-200">
                                                        {parseFloat(cppEnrollment.assignment_grades.average_grade).toFixed(2)}%
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">--</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-4 align-top text-center">
                                                {isLoadingStudentData && !studentFullData ? (
                                                    <Skeleton className="h-5 w-12 mx-auto" />
                                                ) : acppEnrollment ? (
                                                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-mono bg-purple-50 text-purple-700 border-purple-200">
                                                        {parseFloat(acppEnrollment.assignment_grades.average_grade).toFixed(2)}%
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">--</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-4 align-top">
                                                <div className="flex flex-col items-start gap-1.5 pt-1">
                                                    <Badge className={cn("px-2 py-0.5 h-auto text-[9px] uppercase font-bold w-fit", getStatusBadge(reg.payment_status || 'Pending'))}>{reg.payment_status}</Badge>
                                                    <Badge variant="secondary" className="px-2 py-0.5 h-auto text-[9px] uppercase font-medium w-fit bg-muted text-muted-foreground">{reg.registration_status}</Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 align-top text-right">
                                                <div className="space-y-1.5">
                                                    <div className="text-[10px] text-muted-foreground font-medium">Total: LKR {(reg.dueAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                                                    <div className="text-[10px] text-muted-foreground font-medium">Paid: LKR {paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                                                    <div className={cn("font-mono font-bold text-sm pt-1 border-t border-dashed", due > 0 ? "text-destructive" : "text-green-600")}>
                                                        Due: LKR {due.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 pr-6 align-top text-right">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => setViewingDetails(reg)} 
                                                    className="h-8 px-3 text-[11px] font-semibold"
                                                >
                                                    <Eye className="h-3.5 w-3.5 mr-1.5" /> 
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                        )
                                    }) : (
                                        <TableRow><TableCell colSpan={8} className="text-center h-32 text-muted-foreground italic">No registrations found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
                 <CardFooter className="flex items-center justify-center space-x-2 py-4 border-t bg-muted/10">
                     <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Previous</Button>
                     <div className="flex items-center justify-center text-sm font-medium">
                        Page 
                        <Input
                            key={currentPage}
                            type="number"
                            defaultValue={currentPage}
                            onKeyDown={handlePageInputChange}
                            className="h-8 w-[200px] mx-2 text-center"
                        />
                        of {totalPages || 1}
                    </div>
                     <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages || 1))} disabled={currentPage === totalPages || totalPages === 0}>Next</Button>
                </CardFooter>
            </Card>
            {isLoadingStudentData && paginatedRegistrations.length > 0 && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-2xl animate-in fade-in-50 slide-in-from-bottom-4 flex items-center gap-2 text-xs font-bold">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Hydrating Academic Performance Data...
                </div>
            )}
        </div>
    );
}
