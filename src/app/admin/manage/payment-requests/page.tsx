
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Search, Hourglass, CheckCircle, XCircle, BookOpen, GraduationCap, Package, AlertTriangle, Check, X } from 'lucide-react';
import { getPaymentRequests, getCourses, updatePaymentRequestStatus } from '@/lib/api';
import type { PaymentRequest, Course } from '@/lib/types';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { PaymentRequestDialog } from '@/components/admin/PaymentRequestDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
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
import { Label } from '@/components/ui/label';


// --- MAIN PAGE COMPONENT ---
export default function PaymentRequestsPage() {
    const queryClient = useQueryClient();
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [reasonFilter, setReasonFilter] = useState('all');
    const [numberTypeFilter, setNumberTypeFilter] = useState('all');
    const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());


    const { data: requests, isLoading, isError, error, refetch, isFetching } = useQuery<PaymentRequest[]>({
        queryKey: ['paymentRequests'],
        queryFn: getPaymentRequests,
        staleTime: 1000 * 60,
    });

    const { data: courses, isLoading: isLoadingCourses } = useQuery<Course[]>({
        queryKey: ['allCoursesForPayment'],
        queryFn: getCourses,
        staleTime: Infinity,
    });
    
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, reasonFilter, numberTypeFilter, itemsPerPage]);
    
    // Clear selection when filters change
    useEffect(() => {
        setSelectedRows(new Set());
    }, [searchTerm, statusFilter, reasonFilter, numberTypeFilter, currentPage, itemsPerPage]);

    const requestStats = useMemo(() => {
        if (!requests) return { status: { total: 0, pending: 0, approved: 0, rejected: 0 }, reasons: {} };
        const status = {
            total: requests.length,
            pending: requests.filter(r => r.payment_status === 'Pending').length,
            approved: requests.filter(r => r.payment_status === 'Approved').length,
            rejected: requests.filter(r => r.payment_status === 'Rejected').length,
        };
        const reasons = requests.reduce((acc, req) => {
            const reason = req.payment_reson || 'unknown';
            acc[reason] = (acc[reason] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return { status, reasons };
    }, [requests]);

    const filteredRequests = useMemo(() => {
        if (!requests) return [];
        const lowercasedFilter = searchTerm.toLowerCase();

        return requests.filter(req => {
            const matchesSearch = lowercasedFilter ? (req.id?.toLowerCase() || '').includes(lowercasedFilter) || (req.unique_number?.toLowerCase() || '').includes(lowercasedFilter) || (req.payment_reson?.toLowerCase() || '').includes(lowercasedFilter) : true;
            const matchesStatus = statusFilter === 'all' || req.payment_status === statusFilter;
            const matchesReason = reasonFilter === 'all' || req.payment_reson === reasonFilter;
            const matchesNumberType = numberTypeFilter === 'all' || req.number_type === numberTypeFilter;
            return matchesSearch && matchesStatus && matchesReason && matchesNumberType;
        }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    }, [requests, searchTerm, statusFilter, reasonFilter, numberTypeFilter]);

    const totalPages = Math.ceil((filteredRequests.length) / itemsPerPage);
    const paginatedRequests = useMemo(() => {
        return filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filteredRequests, currentPage, itemsPerPage]);

    const bulkUpdateMutation = useMutation({
        mutationFn: ({ ids, status }: { ids: string[], status: 'Approved' | 'Rejected' }) => {
            const updatePromises = ids.map(id => {
                const requestToUpdate = requests?.find(r => r.id === id);
                if (!requestToUpdate) return Promise.reject(`Request with ID ${id} not found`);
                return updatePaymentRequestStatus(requestToUpdate, status);
            });
            return Promise.allSettled(updatePromises);
        },
        onSuccess: (results, { status }) => {
            const successfulCount = results.filter(r => r.status === 'fulfilled').length;
            const failedCount = results.length - successfulCount;
            
            toast({
                title: 'Bulk Update Complete',
                description: `${successfulCount} request(s) were successfully marked as ${status}. ${failedCount > 0 ? `${failedCount} failed.` : ''}`,
            });
            refetch();
            setSelectedRows(new Set());
        },
        onError: (error: Error) => {
            toast({
                variant: 'destructive',
                title: 'Bulk Update Failed',
                description: error.message,
            });
        },
    });
    
    const handleBulkUpdate = (status: 'Approved' | 'Rejected') => {
        bulkUpdateMutation.mutate({ ids: Array.from(selectedRows), status });
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

    if (isLoading || isLoadingCourses) {
        return (
            <div className="p-4 md:p-8 space-y-6">
                <header><h1 className="text-3xl font-headline font-semibold">Payment Requests</h1><p className="text-muted-foreground">View and manage incoming payment requests from the portal.</p></header>
                <Card className="shadow-lg"><CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-4 md:p-8 space-y-6">
                 <header><h1 className="text-3xl font-headline font-semibold text-destructive">An Error Occurred</h1></header>
                <Card className="border-destructive"><CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle/> Failed to Load Requests</CardTitle></CardHeader><CardContent><p>{error?.message}</p></CardContent></Card>
            </div>
        );
    }

    const getStatusVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'destructive';
            case 'approved': return 'default';
            default: return 'secondary';
        }
    }

    const reasonIcons: Record<string, React.ReactNode> = {
        course: <BookOpen className="w-6 h-6 text-primary" />,
        convocation: <GraduationCap className="w-6 h-6 text-primary" />,
        default: <Package className="w-6 h-6 text-primary" />,
    }

    const BulkActions = () => (
        <div className="flex flex-col sm:flex-row items-center gap-2 border border-primary/20 bg-primary/5 p-2 rounded-lg mb-4">
             <div className="flex items-center gap-3 w-full sm:w-auto">
                 <div className="flex items-center space-x-2">
                    <Checkbox
                        id="select-all-current-page"
                        checked={paginatedRequests.length > 0 && paginatedRequests.every(req => selectedRows.has(req.id))}
                        onCheckedChange={(checked) => {
                            const newSelectedRows = new Set(selectedRows);
                            if (checked) {
                                paginatedRequests.forEach(req => newSelectedRows.add(req.id));
                            } else {
                                paginatedRequests.forEach(req => newSelectedRows.delete(req.id));
                            }
                            setSelectedRows(newSelectedRows);
                        }}
                        aria-label="Select all on page"
                    />
                    <Label htmlFor="select-all-current-page" className="text-sm font-medium">Select All</Label>
                </div>
                <p className="text-sm font-medium sm:flex-grow">{selectedRows.size} item(s) selected</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button size="sm" variant="outline" className="flex-1 sm:flex-grow-0" disabled={bulkUpdateMutation.isPending}><Check className="mr-2 h-4 w-4"/>Approve</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Approve {selectedRows.size} Requests?</AlertDialogTitle><AlertDialogDescription>This will mark all selected requests as "Approved". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleBulkUpdate('Approved')}>Confirm</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button size="sm" variant="destructive" className="flex-1 sm:flex-grow-0" disabled={bulkUpdateMutation.isPending}><X className="mr-2 h-4 w-4"/>Reject</Button>
                    </AlertDialogTrigger>
                     <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Reject {selectedRows.size} Requests?</AlertDialogTitle><AlertDialogDescription>This will mark all selected requests as "Rejected". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleBulkUpdate('Rejected')}>Confirm</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header><h1 className="text-3xl font-headline font-semibold">Payment Requests</h1><p className="text-muted-foreground">View and manage incoming payment requests from the portal.</p></header>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold font-headline">Overview by Status</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pending</CardTitle><Hourglass className="w-4 h-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold"><AnimatedCounter value={requestStats.status.pending} /></div></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Approved</CardTitle><CheckCircle className="w-4 h-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold"><AnimatedCounter value={requestStats.status.approved} /></div></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Rejected</CardTitle><XCircle className="w-4 h-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold"><AnimatedCounter value={requestStats.status.rejected} /></div></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total</CardTitle><Package className="w-4 h-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold"><AnimatedCounter value={requestStats.status.total} /></div></CardContent></Card>
                </div>
            </section>

            <section className="space-y-4">
                 <h2 className="text-xl font-semibold font-headline">Overview by Reason</h2>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(requestStats.reasons).map(([reason, count]) => (
                        <Card key={reason}><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium capitalize">{reason.replace('_', ' ')}</CardTitle>{reasonIcons[reason] || reasonIcons.default}</CardHeader><CardContent><div className="text-2xl font-bold"><AnimatedCounter value={count} /></div></CardContent></Card>
                    ))}
                 </div>
            </section>

            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                             <div><CardTitle>All Requests</CardTitle><CardDescription>Showing {paginatedRequests.length} of {filteredRequests.length} records.</CardDescription></div>
                            <Button onClick={() => refetch()} disabled={isFetching} className="w-full sm:w-auto"><RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />Refresh</Button>
                        </div>
                        <div className="flex flex-col lg:flex-row gap-2">
                            <div className="relative flex-grow"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by ID, Ref #..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full"/></div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue placeholder="Filter by status"/></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Approved">Approved</SelectItem><SelectItem value="Rejected">Rejected</SelectItem></SelectContent></Select>
                                <Select value={reasonFilter} onValueChange={setReasonFilter}><SelectTrigger><SelectValue placeholder="Filter by reason"/></SelectTrigger><SelectContent><SelectItem value="all">All Reasons</SelectItem>{Object.keys(requestStats.reasons).map(reason => (<SelectItem key={reason} value={reason} className="capitalize">{reason.replace('_', ' ')}</SelectItem>))}</SelectContent></Select>
                                <Select value={numberTypeFilter} onValueChange={setNumberTypeFilter}><SelectTrigger><SelectValue placeholder="Filter by type"/></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="ref_number">Reference #</SelectItem><SelectItem value="student_number">Student Number</SelectItem></SelectContent></Select>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {selectedRows.size > 0 && <BulkActions />}
                    <div className="relative w-full overflow-auto border rounded-lg hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead padding="checkbox" className="w-12">
                                        <Checkbox
                                            checked={paginatedRequests.length > 0 && paginatedRequests.every(req => selectedRows.has(req.id))}
                                            onCheckedChange={(checked) => {
                                                const newSelectedRows = new Set(selectedRows);
                                                if (checked) {
                                                    paginatedRequests.forEach(req => newSelectedRows.add(req.id));
                                                } else {
                                                    paginatedRequests.forEach(req => newSelectedRows.delete(req.id));
                                                }
                                                setSelectedRows(newSelectedRows);
                                            }}
                                            aria-label="Select all"
                                        />
                                    </TableHead>
                                    <TableHead>Request ID</TableHead><TableHead>Reference #</TableHead><TableHead>Reason</TableHead><TableHead>Amount (LKR)</TableHead><TableHead>Paid Date</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedRequests.map(req => (
                                    <TableRow key={req.id} data-state={selectedRows.has(req.id) && "selected"}>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={selectedRows.has(req.id)}
                                                onCheckedChange={(checked) => {
                                                    const newSelectedRows = new Set(selectedRows);
                                                    if (checked) {
                                                        newSelectedRows.add(req.id);
                                                    } else {
                                                        newSelectedRows.delete(req.id);
                                                    }
                                                    setSelectedRows(newSelectedRows);
                                                }}
                                                aria-label="Select row"
                                            />
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{req.id}</TableCell>
                                        <TableCell className="font-medium">{req.unique_number}</TableCell>
                                        <TableCell>{req.payment_reson}</TableCell>
                                        <TableCell className="font-semibold">{parseFloat(req.paid_amount).toLocaleString('en-US', {minimumFractionDigits: 2})}</TableCell>
                                        <TableCell>{format(new Date(req.paid_date), 'yyyy-MM-dd')}</TableCell>
                                        <TableCell><Badge variant={getStatusVariant(req.payment_status)}>{req.payment_status}</Badge></TableCell>
                                        <TableCell><Button variant="outline" size="sm" onClick={() => setSelectedRequest(req)} disabled={req.payment_status !== 'Pending'}>Manage</Button></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="md:hidden space-y-4">
                        {paginatedRequests.map(req => (
                            <div key={req.id} className="p-4 border rounded-lg space-y-3 bg-muted/30 relative">
                                <div className="absolute top-3 right-3">
                                      <Checkbox
                                        checked={selectedRows.has(req.id)}
                                        onCheckedChange={(checked) => {
                                            const newSelectedRows = new Set(selectedRows);
                                            if (checked) newSelectedRows.add(req.id); else newSelectedRows.delete(req.id);
                                            setSelectedRows(newSelectedRows);
                                        }}
                                        aria-label="Select row"
                                    />
                                </div>
                                <div className="flex justify-between items-start">
                                    <div><p className="font-bold">{req.unique_number}</p><p className="text-xs text-muted-foreground">ID: {req.id}</p><p className="text-sm text-muted-foreground">{req.payment_reson}</p></div>
                                    <Badge variant={getStatusVariant(req.payment_status)} className="mr-10">{req.payment_status}</Badge>
                                </div>
                                <div className="text-sm space-y-2 pt-2 border-t">
                                     <div className="flex items-center justify-between"><p className="text-muted-foreground font-medium">Amount</p><p className="font-semibold">LKR {parseFloat(req.paid_amount).toLocaleString('en-US', {minimumFractionDigits: 2})}</p></div>
                                    <div className="flex items-center justify-between"><p className="text-muted-foreground font-medium">Paid Date</p><p>{format(new Date(req.paid_date), 'PP')}</p></div>
                                </div>
                                 <div className="flex items-center justify-end pt-2 border-t mt-2"><Button variant="outline" size="sm" onClick={() => setSelectedRequest(req)} disabled={req.payment_status !== 'Pending'}>Manage</Button></div>
                            </div>
                        ))}
                    </div>
                    {paginatedRequests.length === 0 && (<div className="text-center py-10"><p className="text-muted-foreground">No payment requests found matching your filters.</p></div>)}
                </CardContent>
                {totalPages > 0 && (
                     <CardFooter className="flex flex-col-reverse items-center gap-y-4 gap-x-6 sm:flex-row sm:justify-between pt-6">
                        <div className="text-sm text-muted-foreground">
                            {selectedRows.size} of {filteredRequests.length} row(s) selected.
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <div className="flex items-center space-x-2">
                                <Label htmlFor="rows-per-page" className="whitespace-nowrap text-sm font-normal">Rows</Label>
                                <Select
                                    value={`${itemsPerPage}`}
                                    onValueChange={(value) => {
                                        setItemsPerPage(Number(value));
                                    }}
                                >
                                    <SelectTrigger id="rows-per-page" className="h-8 w-[70px]">
                                        <SelectValue placeholder={`${itemsPerPage}`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[10, 25, 50, 100].map((pageSize) => (
                                            <SelectItem key={pageSize} value={`${pageSize}`}>
                                                {pageSize}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-center text-sm font-medium">
                                Page 
                                <Input
                                    key={currentPage}
                                    type="number"
                                    defaultValue={currentPage}
                                    onKeyDown={handlePageInputChange}
                                    className="h-8 w-12 mx-2 text-center"
                                />
                                of {totalPages}
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </CardFooter>
                )}
            </Card>

            {courses && <PaymentRequestDialog
                isOpen={!!selectedRequest}
                onOpenChange={(open) => !open && setSelectedRequest(null)}
                request={selectedRequest}
                courses={courses}
                onSuccess={() => refetch()}
            />}
        </div>
    );
}

