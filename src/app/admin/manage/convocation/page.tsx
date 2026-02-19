"use client";

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
    getConvocationRegistrations, 
    getPackagesByCeremony, 
} from '@/lib/actions/certificates';
import { getParentCourses } from '@/lib/actions/courses';
import type { 
    ConvocationRegistration, 
    ConvocationPackage, 
    ParentCourse, 
} from '@/lib/types';
import { parseISO, isValid } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ArrowLeft, ArrowUp, ArrowDown, ChevronsUpDown, BookUser, Hourglass, CheckCircle, Users, Eye, FileText, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

// Modular Components
import { RegistrationDetailDialog } from '@/components/admin/convocation/RegistrationDetailDialog';

const ITEMS_PER_PAGE = 25;
const PARENT_SEAT_RATE = 750;

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
        staleTime: 1000 * 60 * 15,
        refetchOnWindowFocus: false,
    });
    
    const { data: courses, isLoading: isLoadingCourses } = useQuery<ParentCourse[]>({
        queryKey: ['allParentCourses'],
        queryFn: getParentCourses,
        staleTime: Infinity,
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
        if (!registrations) {
            return { totalBookings: 0, pendingPayments: 0, confirmedPayments: 0, additionalSeats: 0 };
        }
        return {
            totalBookings: registrations.length,
            pendingPayments: registrations.filter(r => r.payment_status.toLowerCase() === 'pending').length,
            confirmedPayments: registrations.filter(r => ['paid', 'approved', 'confirmed'].includes(r.payment_status.toLowerCase())).length,
            additionalSeats: registrations.reduce((acc, reg) => acc + (parseInt(reg.additional_seats, 10) || 0), 0)
        };
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
            const matchesCourse = reg.course_id.split(',').some(id => {
                const course = courses?.find(c => c.id === id.trim());
                return courseFilter === 'all' || course?.id === courseFilter;
            });
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
                    case 'due': return reg.dueAmount;
                    case 'session': return reg.session;
                    case 'course': return reg.course_id;
                    case 'package': return packages?.find(p => p.package_id === reg.package_id)?.package_name || '';
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

            if (typeof valA === 'string' && typeof valB === 'string') return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            if (typeof valA === 'number' && typeof valB === 'number') return direction === 'asc' ? valA - valB : valB - valA;
            return 0;
        });

    }, [registrations, packages, searchTerm, statusFilter, courseFilter, packageFilter, sessionFilter, sortOption, courses]);
    
    useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, courseFilter, packageFilter, sessionFilter, sortOption]);

    const paginatedRegistrations = useMemo(() => {
        return filteredRegistrations.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    }, [filteredRegistrations, currentPage]);
    
    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'bg-yellow-500 text-white';
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

            <header>
                {ceremonyIdFilter && (
                    <Button variant="ghost" onClick={() => router.push('/admin/manage/convocation-ceremonies')} className="-ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Ceremonies
                    </Button>
                )}
                <h1 className="text-3xl font-headline font-semibold mt-2">{ceremonyIdFilter ? "Ceremony Registrations" : "All Convocation Registrations"}</h1>
                <p className="text-muted-foreground">Manage student registrations and verify bookings.</p>
            </header>
            
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Bookings</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{registrationStats.totalBookings}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pending Payments</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{registrationStats.pendingPayments}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Confirmed Payments</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{registrationStats.confirmedPayments}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Additional Seats</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{registrationStats.additionalSeats}</div></CardContent></Card>
            </section>
            
            <Card className="shadow-lg overflow-hidden">
                <CardHeader className="border-b bg-muted/20 pb-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 pt-4">
                        <div className="relative w-full lg:col-span-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search name, student #, ref #" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-10"/>
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
                                        <TableHead className="w-[220px]"><SortableHeader column="student" label="Student Info" /></TableHead>
                                        <TableHead className="min-w-[250px]">Booking Details</TableHead>
                                        <TableHead className="w-[150px]">Status</TableHead>
                                        <TableHead className="w-[180px] text-right"><SortableHeader column="due" label="Payment Details" className="justify-end" /></TableHead>
                                        <TableHead className="w-[100px] text-right pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedRegistrations.length > 0 ? paginatedRegistrations.map((reg) => {
                                        const paidAmount = parseFloat(reg.payment_amount) || 0;
                                        const due = reg.dueAmount - paidAmount;
                                        const packageName = packages?.find(p => p.package_id === reg.package_id)?.package_name || `ID: ${reg.package_id}`;

                                        return (
                                        <TableRow key={reg.registration_id} className={cn("text-xs transition-colors hover:bg-muted/30", reg.isDuplicate && "bg-destructive/5 hover:bg-destructive/10")}>
                                            <TableCell className="py-4 align-top">
                                                <div className="space-y-1">
                                                    <div className="font-mono font-bold text-sm">#{reg.reference_number}</div>
                                                    <div className="font-semibold text-sm text-primary">{reg.student_number}</div>
                                                    <div className="text-[10px] font-medium uppercase tracking-tighter truncate max-w-[180px]">{reg.name_on_certificate}</div>
                                                    <div className="text-[9px] text-muted-foreground pt-1 border-t border-dashed">Ceremony: {reg.ceremony_number || 'N/A'}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 align-top">
                                                <div className="space-y-3">
                                                    <div className="flex flex-col gap-1">
                                                        {reg.course_id.split(',').map(id => (
                                                            <div key={id} className="text-[11px] leading-tight font-medium text-foreground">• {courses?.find(c => c.id === id.trim())?.course_name || `ID: ${id}`}</div>
                                                        ))}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">Pkg: {packageName}</span>
                                                        <Badge variant="outline" className="h-5 text-[9px] px-2 font-bold uppercase">Sess {reg.session}</Badge>
                                                        <span className="text-[10px] font-medium text-muted-foreground">{reg.additional_seats} Guest Seats</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 align-top">
                                                <div className="flex flex-col items-start gap-1.5 pt-1">
                                                    <Badge className={cn("px-2 py-0.5 h-auto text-[9px] uppercase font-bold w-fit", getStatusBadge(reg.payment_status))}>{reg.payment_status}</Badge>
                                                    <Badge variant="secondary" className="px-2 py-0.5 h-auto text-[9px] uppercase font-medium w-fit bg-muted text-muted-foreground">{reg.registration_status}</Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 align-top text-right">
                                                <div className="space-y-1.5">
                                                    <div className="text-[10px] text-muted-foreground font-medium">Total: LKR {reg.dueAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
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
                                        <TableRow><TableCell colSpan={5} className="text-center h-32 text-muted-foreground italic">No registrations found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
                 <CardFooter className="flex items-center justify-center space-x-2 py-4 border-t bg-muted/10">
                     <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Previous</Button>
                     <span className="text-sm font-medium">Page {currentPage} of {Math.ceil(filteredRegistrations.length / ITEMS_PER_PAGE) || 1}</span>
                     <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredRegistrations.length / ITEMS_PER_PAGE)))} disabled={currentPage === Math.ceil(filteredRegistrations.length / ITEMS_PER_PAGE)}>Next</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
