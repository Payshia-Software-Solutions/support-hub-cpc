
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCertificateOrders, getStudentFullInfo } from '@/lib/api';
import type { CertificateOrder, FullStudentData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Loader2, XCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const ITEMS_PER_PAGE = 25;

// --- Eligibility Status Component ---
const EligibilityStatusCell = ({ studentNumber, courseId }: { studentNumber: string, courseId: string }) => {
    const { data: studentData, isLoading, isError, isFetching } = useQuery<FullStudentData, Error>({
        queryKey: ['studentFullInfoForEligibility', studentNumber],
        queryFn: () => getStudentFullInfo(studentNumber),
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        enabled: !!studentNumber,
    });

    const eligibilityStatus = useMemo(() => {
        if (!studentData) return null;
        const enrollment = Object.values(studentData.studentEnrollments).find(e => e.parent_course_id === courseId);
        if (!enrollment) return 'not_found';
        return enrollment.certificate_eligibility;
    }, [studentData, courseId]);

    if (isLoading || isFetching) {
        return (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Checking...</span>
            </div>
        );
    }

    if (isError) {
        return <Badge variant="destructive">Check Failed</Badge>;
    }

    if (eligibilityStatus === 'not_found') {
        return <Badge variant="secondary">Enrollment Not Found</Badge>;
    }

    if (eligibilityStatus) {
        return (
            <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200">
                <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                Eligible
            </Badge>
        );
    }

    return (
        <Badge variant="destructive">
            <XCircle className="mr-1.5 h-3.5 w-3.5" />
            Not Eligible
        </Badge>
    );
};

export default function CertificateOrdersListPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const { data: orders, isLoading: isLoadingOrders, isError, error } = useQuery<CertificateOrder[]>({
        queryKey: ['allCertificateOrders'],
        queryFn: getCertificateOrders,
        staleTime: 5 * 60 * 1000,
    });

    const filteredOrders = useMemo(() => {
        if (!orders) return [];
        const lowercasedFilter = searchTerm.toLowerCase();
        if (!lowercasedFilter) return orders;
        return orders.filter(order =>
            order.created_by.toLowerCase().includes(lowercasedFilter) ||
            order.name_on_certificate.toLowerCase().includes(lowercasedFilter)
        );
    }, [orders, searchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const paginatedOrders = useMemo(() => {
        return filteredOrders.slice(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE
        );
    }, [filteredOrders, currentPage]);

    if (isLoadingOrders) {
        return (
            <div className="p-4 md:p-8 space-y-6">
                <header>
                    <h1 className="text-3xl font-headline font-semibold">Certificate Orders</h1>
                    <p className="text-muted-foreground">Loading all certificate orders...</p>
                </header>
                <Card className="shadow-lg">
                    <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
                    <CardContent><Skeleton className="h-64 w-full" /></CardContent>
                </Card>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-4 md:p-8 space-y-6">
                 <header>
                    <h1 className="text-3xl font-headline font-semibold text-destructive">An Error Occurred</h1>
                </header>
                <Card className="border-destructive">
                    <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle/> Failed to Load Orders</CardTitle></CardHeader>
                    <CardContent><p>{error?.message}</p></CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <h1 className="text-3xl font-headline font-semibold">Certificate Orders</h1>
                <p className="text-muted-foreground">View all certificate orders and check student eligibility.</p>
            </header>

            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                            <CardTitle>All Orders</CardTitle>
                            <CardDescription>
                                Showing {paginatedOrders.length} of {filteredOrders.length} certificate orders.
                            </CardDescription>
                        </div>
                        <div className="relative w-full sm:w-auto sm:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search student or name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Desktop Table */}
                    <div className="relative w-full overflow-auto border rounded-lg hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Name on Certificate</TableHead>
                                    <TableHead>Course ID</TableHead>
                                    <TableHead>Order Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Eligibility</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedOrders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">{order.created_by}</TableCell>
                                        <TableCell>{order.name_on_certificate}</TableCell>
                                        <TableCell>{order.course_code}</TableCell>
                                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell><Badge variant="secondary">{order.certificate_status}</Badge></TableCell>
                                        <TableCell>
                                            <EligibilityStatusCell studentNumber={order.created_by} courseId={order.course_code} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile List */}
                    <div className="md:hidden space-y-4">
                        {paginatedOrders.map(order => (
                            <div key={order.id} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold">{order.created_by}</p>
                                        <p className="text-sm text-muted-foreground">{order.name_on_certificate}</p>
                                    </div>
                                    <div className="text-right text-xs text-muted-foreground">
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="text-sm space-y-2 pt-2 border-t">
                                     <div className="flex items-center justify-between">
                                        <p className="text-muted-foreground font-medium">Status</p>
                                        <Badge variant="secondary">{order.certificate_status}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-muted-foreground font-medium">Course ID</p>
                                        <p>{order.course_code}</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-muted-foreground font-medium">Eligibility</p>
                                        <EligibilityStatusCell studentNumber={order.created_by} courseId={order.course_code} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {paginatedOrders.length === 0 && (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground">No orders found matching your search.</p>
                        </div>
                    )}
                </CardContent>
                {totalPages > 1 && (
                    <CardFooter className="flex items-center justify-center space-x-2 pt-6">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Previous</Button>
                        <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
