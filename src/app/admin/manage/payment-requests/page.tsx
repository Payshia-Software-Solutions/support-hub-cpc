
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { getPaymentRequests } from '@/lib/api';
import type { PaymentRequest } from '@/lib/types';
import { format } from 'date-fns';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const ITEMS_PER_PAGE = 25;

const SlipViewerCell = ({ slipPath }: { slipPath: string }) => {
    const contentProviderUrl = 'https://content-provider.pharmacollege.lk';
    const fullSlipUrl = `${contentProviderUrl}${slipPath}`;

    // Simple check for image extension
    const isImage = /\.(jpg|jpeg|png|gif)$/i.test(slipPath);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">View Slip</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Payment Slip</DialogTitle>
                </DialogHeader>
                <div className="mt-4 max-h-[70vh] overflow-auto">
                    {isImage ? (
                        <Image
                            src={fullSlipUrl}
                            alt="Payment Slip"
                            width={800}
                            height={1200}
                            className="w-full h-auto object-contain"
                            data-ai-hint="payment slip"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-center bg-muted rounded-lg">
                            <p className="mb-4">This file is not an image and cannot be previewed directly.</p>
                            <a href={fullSlipUrl} target="_blank" rel="noopener noreferrer">
                                <Button>
                                    <ExternalLink className="mr-2 h-4 w-4"/>
                                    Open Slip in New Tab
                                </Button>
                            </a>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};


export default function PaymentRequestsPage() {
    const queryClient = useQueryClient();
    const [currentPage, setCurrentPage] = useState(1);

    const { data: requests, isLoading, isError, error, refetch, isFetching } = useQuery<PaymentRequest[]>({
        queryKey: ['paymentRequests'],
        queryFn: getPaymentRequests,
        staleTime: 1000 * 60, // 1 minute stale time
    });

    const totalPages = Math.ceil((requests?.length || 0) / ITEMS_PER_PAGE);
    const paginatedRequests = useMemo(() => {
        if (!requests) return [];
        return requests.slice(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE
        );
    }, [requests, currentPage]);

    if (isLoading) {
        return (
            <div className="p-4 md:p-8 space-y-6">
                <header>
                    <h1 className="text-3xl font-headline font-semibold">Payment Requests</h1>
                    <p className="text-muted-foreground">View and manage incoming payment requests from the portal.</p>
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
                    <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle/> Failed to Load Requests</CardTitle></CardHeader>
                    <CardContent><p>{error?.message}</p></CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <h1 className="text-3xl font-headline font-semibold">Payment Requests</h1>
                <p className="text-muted-foreground">View and manage incoming payment requests from the portal.</p>
            </header>

            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                            <CardTitle>All Requests</CardTitle>
                            <CardDescription>
                                Showing {paginatedRequests.length} of {requests?.length || 0} requests.
                            </CardDescription>
                        </div>
                         <Button onClick={() => refetch()} disabled={isFetching}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Desktop Table */}
                    <div className="relative w-full overflow-auto border rounded-lg hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Reference #</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Amount (LKR)</TableHead>
                                    <TableHead>Paid Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedRequests.map(req => (
                                    <TableRow key={req.id}>
                                        <TableCell className="font-medium">{req.unique_number}</TableCell>
                                        <TableCell>{req.payment_reson}</TableCell>
                                        <TableCell className="font-semibold">{parseFloat(req.paid_amount).toLocaleString('en-US', {minimumFractionDigits: 2})}</TableCell>
                                        <TableCell>{format(new Date(req.paid_date), 'yyyy-MM-dd')}</TableCell>
                                        <TableCell>
                                            <Badge variant={req.payment_status.toLowerCase() === 'pending' ? 'destructive' : 'default'}>
                                                {req.payment_status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <SlipViewerCell slipPath={req.slip_path} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile List */}
                    <div className="md:hidden space-y-4">
                        {paginatedRequests.map(req => (
                            <div key={req.id} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold">{req.unique_number}</p>
                                        <p className="text-sm text-muted-foreground">{req.payment_reson}</p>
                                    </div>
                                    <Badge variant={req.payment_status.toLowerCase() === 'pending' ? 'destructive' : 'default'}>
                                        {req.payment_status}
                                    </Badge>
                                </div>
                                <div className="text-sm space-y-2 pt-2 border-t">
                                     <div className="flex items-center justify-between">
                                        <p className="text-muted-foreground font-medium">Amount</p>
                                        <p className="font-semibold">LKR {parseFloat(req.paid_amount).toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-muted-foreground font-medium">Paid Date</p>
                                        <p>{format(new Date(req.paid_date), 'PP')}</p>
                                    </div>
                                </div>
                                 <div className="flex items-center justify-end pt-2 border-t mt-2">
                                    <SlipViewerCell slipPath={req.slip_path} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {paginatedRequests.length === 0 && (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground">No payment requests found.</p>
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
