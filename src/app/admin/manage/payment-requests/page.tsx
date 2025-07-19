
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ExternalLink, RefreshCw, Check, X, Loader2, ZoomIn, ZoomOut, AlertCircle, Link as LinkIcon, FileText } from 'lucide-react';
import { getPaymentRequests, checkDuplicateSlips } from '@/lib/api';
import type { PaymentRequest } from '@/lib/types';
import { format } from 'date-fns';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const ITEMS_PER_PAGE = 25;
const CONTENT_PROVIDER_URL = 'https://content-provider.pharmacollege.lk';

const ViewSlipDialog = ({ slipPath, isOpen, onOpenChange }: { slipPath: string, isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
    if (!isOpen) return null;
    const fullSlipUrl = `${CONTENT_PROVIDER_URL}${slipPath}`;
    const isImage = /\.(jpg|jpeg|png|gif)$/i.test(slipPath);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Duplicate Slip Viewer</DialogTitle>
                </DialogHeader>
                <div className="mt-4 max-h-[70vh] overflow-auto border rounded-lg p-2 bg-muted">
                     {isImage ? (
                        <Image
                            src={fullSlipUrl}
                            alt="Duplicate Payment Slip"
                            width={800}
                            height={1200}
                            className="w-full h-auto object-contain"
                            data-ai-hint="payment slip"
                        />
                    ) : (
                         <div className="flex flex-col items-center justify-center p-8 text-center bg-background rounded-lg">
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


const DuplicateSlipCheck = ({ hashValue, currentRequestId }: { hashValue: string, currentRequestId: string }) => {
    const [viewingSlipPath, setViewingSlipPath] = useState<string | null>(null);

    const { data: duplicateRecords, isLoading, isError } = useQuery<PaymentRequest[]>({
        queryKey: ['duplicateCheck', hashValue],
        queryFn: () => checkDuplicateSlips(hashValue),
        enabled: !!hashValue,
    });

    if (isLoading) {
        return (
            <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-800">
                <AlertCircle className="h-4 w-4 !text-blue-800" />
                <AlertDescription>Checking for duplicate slips...</AlertDescription>
            </Alert>
        );
    }
    
    if (isError) {
        return (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Could not verify duplicate slips.</AlertDescription>
            </Alert>
        )
    }

    if (duplicateRecords && duplicateRecords.length > 1) {
        const otherRecords = duplicateRecords.filter(r => r.id !== currentRequestId);
        return (
            <>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Duplicate Slip Warning</AlertTitle>
                    <AlertDescription asChild>
                        <div>
                            <p className="mb-2">This payment slip has been submitted multiple times. Please verify before approving.</p>
                            <ul className="space-y-2 text-xs">
                                {otherRecords.map(record => (
                                    <li key={record.id} className="flex items-center justify-between p-2 rounded-md bg-destructive/10">
                                        <div className="space-y-0.5">
                                            <p><strong>Ref:</strong> {record.unique_number} ({record.payment_reson})</p>
                                            <p><strong>Status:</strong> {record.payment_status}</p>
                                            <p><strong>Submitted:</strong> {format(new Date(record.created_at), 'Pp')}</p>
                                        </div>
                                        <Button size="sm" variant="ghost" className="h-auto px-2 py-1" onClick={() => setViewingSlipPath(record.slip_path)}>
                                            View Slip
                                            <FileText className="ml-1.5 h-3 w-3"/>
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </AlertDescription>
                </Alert>
                <ViewSlipDialog
                    isOpen={!!viewingSlipPath}
                    onOpenChange={(open) => !open && setViewingSlipPath(null)}
                    slipPath={viewingSlipPath || ''}
                />
            </>
        );
    }

    return null; // No duplicates found or only the current one exists
};

const SlipManagerCell = ({ request }: { request: PaymentRequest }) => {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentType, setPaymentType] = useState('');
    
    const fullSlipUrl = `${CONTENT_PROVIDER_URL}${request.slip_path}`;
    const isImage = /\.(jpg|jpeg|png|gif)$/i.test(request.slip_path);

    // Reset state when dialog opens
    useEffect(() => {
        if (isDialogOpen) {
            setIsZoomed(false);
            setPaymentAmount('');
            setPaymentType('');
        }
    }, [isDialogOpen]);

    // Mock mutation for approving/rejecting.
    const mutation = useMutation({
        mutationFn: async ({ action, amount, type }: { action: 'approve' | 'reject', amount?: string, type?: string }) => {
            // Placeholder: Replace with actual API call
            console.log(`Performing action: ${action} for request ${request.id} with amount ${amount} and type ${type}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (action === 'approve') {
                // Here you would also post to create the payment record
                return { ...request, payment_status: 'Approved' };
            }
            return { ...request, payment_status: 'Rejected' };
        },
        onSuccess: (updatedRequest) => {
            queryClient.setQueryData(['paymentRequests'], (oldData: PaymentRequest[] | undefined) => {
                return oldData?.map(r => r.id === updatedRequest.id ? updatedRequest : r) ?? [];
            });
            toast({
                title: `Request ${updatedRequest.payment_status}`,
                description: `Payment request #${request.unique_number} has been updated.`,
            });
            setIsDialogOpen(false);
        },
        onError: (error: Error) => {
            toast({
                variant: 'destructive',
                title: 'Action Failed',
                description: error.message,
            });
        }
    });
    
    const handleApprove = () => {
        if (!paymentAmount || !paymentType) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide both amount and payment type.' });
            return;
        }
        mutation.mutate({ action: 'approve', amount: paymentAmount, type: paymentType });
    }

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">Manage</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Manage Payment Request</DialogTitle>
                    <DialogDescription>Review the slip and approve or reject the payment for reference #{request.unique_number}.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                     {isDialogOpen && <DuplicateSlipCheck hashValue={request.hash_value} currentRequestId={request.id} />}
                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-4">
                             <div className="space-y-3 rounded-md border p-4 bg-muted/50">
                                <h3 className="font-semibold text-base">Submitted Information</h3>
                                <div className="text-sm space-y-2 text-muted-foreground">
                                    <p><strong className="text-card-foreground">Original Reason:</strong> {request.payment_reson}</p>
                                    <p><strong className="text-card-foreground">Original Amount:</strong> LKR {parseFloat(request.paid_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                    <p><strong className="text-card-foreground">Paid Date:</strong> {format(new Date(request.paid_date), 'PPP')}</p>
                                    <p><strong className="text-card-foreground">Bank:</strong> {request.bank}</p>
                                    <p><strong className="text-card-foreground">Branch:</strong> {request.branch}</p>
                                </div>
                             </div>
                             <div className="space-y-4 pt-4 border-t">
                                 <h3 className="font-semibold text-base">Verification &amp; Approval</h3>
                                 <div className="space-y-2">
                                    <Label htmlFor="payment-amount">Verified Payment Amount (LKR)</Label>
                                    <Input id="payment-amount" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Enter verified amount" />
                                    <p className="text-xs text-muted-foreground">
                                        Suggested amount:{" "}
                                        <button
                                            type="button"
                                            className="text-primary hover:underline font-medium"
                                            onClick={() => setPaymentAmount(request.paid_amount)}
                                        >
                                            LKR {parseFloat(request.paid_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </button>
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="payment-type">Payment Type</Label>
                                    <Select value={paymentType} onValueChange={setPaymentType}>
                                        <SelectTrigger id="payment-type">
                                            <SelectValue placeholder="Select a payment type..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="course_fee">Course Fee</SelectItem>
                                            <SelectItem value="exam_fee">Exam Fee</SelectItem>
                                            <SelectItem value="convocation">Convocation</SelectItem>
                                            <SelectItem value="t_shirt">T-Shirt / Merchandise</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                             </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-lg">Payment Slip</h3>
                                {isImage && (
                                    <Button variant="ghost" size="sm" onClick={() => setIsZoomed(!isZoomed)}>
                                        {isZoomed ? <ZoomOut className="mr-2 h-4 w-4" /> : <ZoomIn className="mr-2 h-4 w-4" />}
                                        {isZoomed ? 'Zoom Out' : 'Zoom In'}
                                    </Button>
                                )}
                            </div>
                            <div className="max-h-[60vh] overflow-auto border rounded-lg p-2 bg-muted">
                                {isImage ? (
                                    <div 
                                        className={cn(
                                            "w-full h-full overflow-auto transition-transform duration-300",
                                            isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
                                        )}
                                        onClick={() => setIsZoomed(!isZoomed)}
                                    >
                                        <Image
                                            src={fullSlipUrl}
                                            alt="Payment Slip"
                                            width={800}
                                            height={1200}
                                            className={cn(
                                                "w-full h-auto object-contain transition-transform duration-300",
                                                isZoomed && "scale-[1.75]"
                                            )}
                                            data-ai-hint="payment slip"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-8 text-center bg-background rounded-lg">
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
                        </div>
                    </div>
                </div>
                 <DialogFooter className="mt-6">
                    <DialogClose asChild>
                        <Button variant="outline" disabled={mutation.isPending}>Cancel</Button>
                    </DialogClose>
                     <Button 
                        variant="destructive" 
                        onClick={() => mutation.mutate({ action: 'reject' })}
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending && mutation.variables?.action === 'reject' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <X className="mr-2 h-4 w-4"/>}
                        Reject
                    </Button>
                    <Button 
                        variant="default" 
                        onClick={handleApprove}
                        disabled={mutation.isPending}
                    >
                         {mutation.isPending && mutation.variables?.action === 'approve' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4"/>}
                        Approve
                    </Button>
                </DialogFooter>
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

    const getStatusVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'destructive';
            case 'approved':
                return 'default';
            default:
                return 'secondary';
        }
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
                                            <Badge variant={getStatusVariant(req.payment_status)}>
                                                {req.payment_status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <SlipManagerCell request={req} />
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
                                     <Badge variant={getStatusVariant(req.payment_status)}>
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
                                    <SlipManagerCell request={req} />
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
