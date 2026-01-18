
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getConvocationRegistrations, getPackagesByCeremony } from '@/lib/actions/certificates';
import { getParentCourses } from '@/lib/actions/courses';
import type { ConvocationRegistration, ConvocationPackage, ParentCourse } from '@/lib/types';
import { format, isValid } from 'date-fns';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Search, FileText, ArrowLeft } from 'lucide-react';

const ITEMS_PER_PAGE = 25;
const CONTENT_PROVIDER_URL = process.env.NEXT_PUBLIC_CONTENT_PROVIDER_URL || 'https://content-provider.pharmacollege.lk';

const ViewSlipDialog = ({ slipPath, studentName }: { slipPath: string | null; studentName: string; }) => {
    if (!slipPath) return <Button variant="outline" size="sm" disabled>No Slip</Button>;

    const fullSlipUrl = `${CONTENT_PROVIDER_URL}${slipPath}`;
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(slipPath);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">View</Button>
            </DialogTrigger>
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
    const [currentPage, setCurrentPage] = useState(1);

    const { data: registrations, isLoading, isError, error } = useQuery<ConvocationRegistration[]>({
        queryKey: ['convocationRegistrations', ceremonyIdFilter],
        queryFn: () => getConvocationRegistrations(ceremonyIdFilter || undefined),
        staleTime: 1000 * 60 * 5, // 5 minutes
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


    const filteredRegistrations = useMemo(() => {
        if (!registrations) return [];
        const lowercasedSearch = searchTerm.toLowerCase();
        
        return registrations.filter(reg => {
            const matchesSearch = lowercasedSearch === '' || 
                reg.student_number.toLowerCase().includes(lowercasedSearch) ||
                reg.name_on_certificate.toLowerCase().includes(lowercasedSearch) ||
                reg.reference_number.toLowerCase().includes(lowercasedSearch);
            
            const matchesStatus = statusFilter === 'all' || reg.payment_status.toLowerCase() === statusFilter.toLowerCase();
            const matchesCourse = courseFilter === 'all' || reg.course_id.split(',').map(s => s.trim()).includes(courseFilter);
            const matchesPackage = packageFilter === 'all' || reg.package_id === packageFilter;
            const matchesSession = sessionFilter === 'all' || reg.session === sessionFilter;
            
            return matchesSearch && matchesStatus && matchesCourse && matchesPackage && matchesSession;
        }).sort((a,b) => {
            const dateA = new Date(a.registered_at);
            const dateB = new Date(b.registered_at);
            if (!isValid(dateA)) return 1;
            if (!isValid(dateB)) return -1;
            return dateB.getTime() - dateA.getTime();
        });
    }, [registrations, searchTerm, statusFilter, courseFilter, packageFilter, sessionFilter]);
    
    useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, courseFilter, packageFilter, sessionFilter]);

    const totalPages = Math.ceil(filteredRegistrations.length / ITEMS_PER_PAGE);
    const paginatedRegistrations = useMemo(() => {
        return filteredRegistrations.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    }, [filteredRegistrations, currentPage]);

    const getStatusVariant = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'paid':
            case 'completed':
                return 'default';
            case 'pending':
                return 'destructive';
            default:
                return 'secondary';
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

    const isLoadingData = isLoading || isLoadingPackages || isLoadingCourses;

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
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
            
            <Card className="shadow-lg">
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
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={sessionFilter} onValueChange={setSessionFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by session" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sessions</SelectItem>
                                    <SelectItem value="1">Session 1</SelectItem>
                                    <SelectItem value="2">Session 2</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={courseFilter} onValueChange={setCourseFilter} disabled={isLoadingCourses}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by course" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Courses</SelectItem>
                                    {courses?.map(c => <SelectItem key={c.id} value={c.id}>{c.course_name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                             <Select value={packageFilter} onValueChange={setPackageFilter} disabled={isLoadingPackages}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by package" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Packages</SelectItem>
                                    {packages?.filter(p => !ceremonyIdFilter || p.convocation_id === ceremonyIdFilter).map(p => <SelectItem key={p.package_id} value={p.package_id}>{p.package_name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoadingData ? (
                         <div className="space-y-2">
                           <Skeleton className="h-12 w-full" />
                           <Skeleton className="h-12 w-full" />
                           <Skeleton className="h-12 w-full" />
                        </div>
                    ) : (
                        <div className="relative w-full overflow-auto border rounded-lg">
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Ref #</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Ceremony #</TableHead>
                                        <TableHead>Due</TableHead>
                                        <TableHead>2nd Payment</TableHead>
                                        <TableHead>Student #</TableHead>
                                        <TableHead>Session</TableHead>
                                        <TableHead>Courses</TableHead>
                                        <TableHead>Package</TableHead>
                                        <TableHead>Additional Seats</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedRegistrations.length > 0 ? paginatedRegistrations.map((reg) => (
                                        <TableRow key={reg.registration_id}>
                                            <TableCell>{reg.reference_number}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 w-20">
                                                    <ViewSlipDialog slipPath={reg.image_path} studentName={reg.name_on_certificate} />
                                                    <Button variant="outline" size="sm">Send</Button>
                                                </div>
                                            </TableCell>
                                            <TableCell>{reg.ceremony_number}</TableCell>
                                            <TableCell>{parseFloat(reg.price || '0').toFixed(2)}</TableCell>
                                            <TableCell>
                                                 <Button variant="outline" size="sm" disabled className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100">No Payment Request</Button>
                                            </TableCell>
                                            <TableCell>{reg.student_number}</TableCell>
                                            <TableCell>
                                                 <Select defaultValue={reg.session} onValueChange={(value) => console.log('TODO: Update session to', value)}>
                                                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="1">1</SelectItem>
                                                        <SelectItem value="2">2</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="min-w-[200px]">
                                                {reg.course_id.split(',').map(id => {
                                                    const courseName = courses?.find(c => c.id === id.trim())?.course_name || `ID: ${id}`;
                                                    return <div key={id}>{courseName}</div>
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                 <Select defaultValue={reg.package_id} onValueChange={(value) => console.log('TODO: Update package to', value)}>
                                                    <SelectTrigger className="w-48"><SelectValue placeholder="Select Package" /></SelectTrigger>
                                                    <SelectContent>
                                                        {packages?.filter(p => p.convocation_id === reg.convocation_id).map(p => <SelectItem key={p.package_id} value={p.package_id}>{p.package_name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Select defaultValue={reg.additional_seats} onValueChange={(value) => console.log('TODO: Update seats to', value)}>
                                                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {[0,1,2,3,4,5].map(i => <SelectItem key={i} value={String(i)}>{i}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={10} className="text-center h-24">No registrations found.</TableCell>
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
