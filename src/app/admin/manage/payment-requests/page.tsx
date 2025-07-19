

"use client";

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, RefreshCw, Check, X, Loader2, ZoomIn, ZoomOut, AlertCircle, FileText, Search, Hourglass, CheckCircle, XCircle, BookOpen, GraduationCap, Package, RotateCw, FlipHorizontal, FlipVertical, ArrowLeft, Briefcase } from 'lucide-react';
import { getPaymentRequests, checkDuplicateSlips, getStudentEnrollments, getCourses } from '@/lib/api';
import type { PaymentRequest, StudentEnrollmentInfo, Course } from '@/lib/types';
import { format } from 'date-fns';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    const [showSuccess, setShowSuccess] = useState(false);

    const { data: duplicateRecords, isLoading, isError } = useQuery<PaymentRequest[]>({
        queryKey: ['duplicateCheck', hashValue],
        queryFn: () => checkDuplicateSlips(hashValue),
        enabled: !!hashValue,
    });
    
    useEffect(() => {
        if (!isLoading && !isError && duplicateRecords) {
            if (duplicateRecords.length <= 1) {
                setShowSuccess(true);
                const timer = setTimeout(() => setShowSuccess(false), 3000);
                return () => clearTimeout(timer);
            }
        }
    }, [isLoading, isError, duplicateRecords]);


    if (isLoading && hashValue) {
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

    if (showSuccess) {
         return (
            <Alert variant="default" className="bg-green-50 border-green-200 text-green-800 animate-in fade-in-50">
                <CheckCircle className="h-4 w-4 !text-green-800" />
                <AlertDescription>No duplicate slips found.</AlertDescription>
            </Alert>
        );
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
                                            <p><strong>Req ID:</strong> {record.id}</p>
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

    return null; 
};

const SlipManagerCell = ({ request, courses }: { request: PaymentRequest, courses: Course[] }) => {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<'course' | 'convocation' | 'other' | null>(null);

    const [paymentAmount, setPaymentAmount] = useState('');
    const [selectedCourseCode, setSelectedCourseCode] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [discountAmount, setDiscountAmount] = useState('');
    const [isMobileView, setIsMobileView] = useState(false);
    
    const { data: enrollments, isLoading: isLoadingEnrollments } = useQuery<StudentEnrollmentInfo[]>({
        queryKey: ['studentEnrollments', request.unique_number],
        queryFn: () => getStudentEnrollments(request.unique_number),
        enabled: isDialogOpen,
    });
    
    // Reset state when dialog opens or category changes
    useEffect(() => {
        if (isDialogOpen) {
            setPaymentAmount('');
            setSelectedCourseCode('');
            setPaymentMethod('');
            setDiscountAmount('');
            
            const checkMobile = () => setIsMobileView(window.innerWidth < 768);
            checkMobile();
            window.addEventListener('resize', checkMobile);
            return () => {
                window.removeEventListener('resize', checkMobile);
                setSelectedCategory(null); // Reset category on dialog close
            }
        }
    }, [isDialogOpen]);

    // Mock mutation for approving/rejecting.
    const mutation = useMutation({
        mutationFn: async ({ action, amount, type }: { action: 'approve' | 'reject', amount?: string, type?: string }) => {
            // Placeholder: Replace with actual API call
            console.log(`Performing action: ${action} for request ${request.id} with payload:`, {
                amount,
                type: selectedCategory,
                method: paymentMethod,
                courseCode: selectedCourseCode,
                discount: discountAmount
            });
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
        if (!paymentAmount || !paymentMethod || !selectedCourseCode) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Amount, method, and batch are required.' });
            return;
        }
        mutation.mutate({ action: 'approve', amount: paymentAmount });
    }

    const CoursePaymentForm = () => (
        <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="payment-amount">Verified Amount (LKR)</Label>
                    <Input id="payment-amount" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="e.g., 5000" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="discount-amount">Discount (LKR)</Label>
                    <Input id="discount-amount" type="number" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} placeholder="e.g., 500" />
                </div>
            </div>
             <p className="text-xs text-muted-foreground -mt-2">
                Suggested amount:{" "}
                <button type="button" className="text-primary hover:underline font-medium" onClick={() => setPaymentAmount(request.paid_amount)} >
                    LKR {parseFloat(request.paid_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </button>
            </p>

            <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger id="payment-method"><SelectValue placeholder="Select a payment method..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="Card Payment">Card Payment</SelectItem>
                        <SelectItem value="Online Gateway">Online Gateway</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="course-select">Associated Batch</Label>
                <Select value={selectedCourseCode} onValueChange={setSelectedCourseCode} disabled={isLoadingEnrollments}>
                    <SelectTrigger id="course-select"><SelectValue placeholder={isLoadingEnrollments ? "Loading batches..." : "Select an enrolled batch..."} /></SelectTrigger>
                    <SelectContent>
                        {enrollments?.map(enrollment => {
                            const courseInfo = courses.find(c => c.courseCode === enrollment.course_code);
                            const courseName = courseInfo ? courseInfo.name : 'Unknown Course';
                            return (
                                <SelectItem key={enrollment.student_course_id} value={enrollment.course_code}>
                                    {courseName} ({enrollment.course_code})
                                </SelectItem>
                            )
                        })}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
    
    const CategorySelection = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
            <Card onClick={() => setSelectedCategory('course')} className="hover:border-primary hover:shadow-lg transition-all cursor-pointer">
                <CardHeader className="items-center text-center">
                    <BookOpen className="w-10 h-10 text-primary mb-2"/>
                    <CardTitle>Course Fee</CardTitle>
                </CardHeader>
            </Card>
            <Card onClick={() => setSelectedCategory('convocation')} className="hover:border-primary hover:shadow-lg transition-all cursor-pointer">
                 <CardHeader className="items-center text-center">
                    <GraduationCap className="w-10 h-10 text-primary mb-2"/>
                    <CardTitle>Convocation</CardTitle>
                </CardHeader>
            </Card>
            <Card onClick={() => setSelectedCategory('other')} className="hover:border-primary hover:shadow-lg transition-all cursor-pointer">
                 <CardHeader className="items-center text-center">
                    <Briefcase className="w-10 h-10 text-primary mb-2"/>
                    <CardTitle>Other</CardTitle>
                </CardHeader>
            </Card>
        </div>
    );

    const FormContent = () => {
        if (!selectedCategory) {
            return <CategorySelection />;
        }
        switch (selectedCategory) {
            case 'course':
                return <CoursePaymentForm />;
            case 'convocation':
                return <p className="text-center text-muted-foreground py-8">Convocation payment form placeholder.</p>;
            case 'other':
                return <p className="text-center text-muted-foreground py-8">Other payment form placeholder.</p>;
            default:
                return null;
        }
    };
    
    const DetailsSection = () => (
        <div className="space-y-4">
            <div className="space-y-3 rounded-md border p-4 bg-muted/50">
                <h3 className="font-semibold text-base">Submitted Information</h3>
                <div className="text-sm space-y-2 text-muted-foreground">
                    <p><strong className="text-card-foreground">Request ID:</strong> {request.id}</p>
                    <p><strong className="text-card-foreground">Student / Ref #:</strong> {request.unique_number}</p>
                    <p><strong className="text-card-foreground">Original Reason:</strong> {request.payment_reson}</p>
                    <p><strong className="text-card-foreground">Original Amount:</strong> LKR {parseFloat(request.paid_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    <p><strong className="text-card-foreground">Paid Date:</strong> {format(new Date(request.paid_date), 'PPP')}</p>
                    <p><strong className="text-card-foreground">Bank:</strong> {request.bank}</p>
                    <p><strong className="text-card-foreground">Branch:</strong> {request.branch}</p>
                </div>
            </div>
            <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                    {selectedCategory && (
                        <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)} className="pl-1">
                            <ArrowLeft className="h-4 w-4 mr-1" /> Back
                        </Button>
                    )}
                    <h3 className="font-semibold text-base">Verification &amp; Approval</h3>
                </div>
                <FormContent />
            </div>
        </div>
    );
    
    const SlipSection = () => {
        const [isZoomed, setIsZoomed] = useState(false);
        const [rotation, setRotation] = useState(0);
        const [scaleX, setScaleX] = useState(1);
        const [scaleY, setScaleY] = useState(1);

        const fullSlipUrl = `${CONTENT_PROVIDER_URL}${request.slip_path}`;
        const isImage = /\.(jpg|jpeg|png|gif)$/i.test(request.slip_path);
        
        const handleRotate = () => setRotation(prev => (prev + 90) % 360);
        const handleFlipHorizontal = () => setScaleX(prev => prev * -1);
        const handleFlipVertical = () => setScaleY(prev => prev * -1);

        const transformStyle = `scale(${isZoomed ? 2 : 1}) rotate(${rotation}deg) scaleX(${scaleX}) scaleY(${scaleY})`;

        return (
             <div className="space-y-2">
                <div className="flex justify-between items-center flex-wrap gap-2">
                    <h3 className="font-semibold text-lg">Payment Slip</h3>
                    {isImage && (
                         <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsZoomed(!isZoomed)}><span className="sr-only">Zoom</span>{isZoomed ? <ZoomOut /> : <ZoomIn />}</Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRotate}><span className="sr-only">Rotate</span><RotateCw /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleFlipHorizontal}><span className="sr-only">Flip Horizontal</span><FlipHorizontal /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleFlipVertical}><span className="sr-only">Flip Vertical</span><FlipVertical /></Button>
                        </div>
                    )}
                </div>
                <div className="max-h-[60vh] overflow-auto border rounded-lg p-2 bg-muted">
                    {isImage ? (
                        <div 
                            className={cn( "w-full h-full overflow-auto transition-transform duration-300", isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in' )}
                            onClick={() => setIsZoomed(!isZoomed)}
                        >
                            <Image
                                src={fullSlipUrl}
                                alt="Payment Slip"
                                width={800}
                                height={1200}
                                className={cn( "w-full h-auto object-contain transition-transform duration-300" )}
                                style={{ transform: transformStyle }}
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
        );
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">Manage</Button>
            </DialogTrigger>
            <DialogContent className={cn(
                "max-w-4xl p-0 flex flex-col",
                isMobileView ? "h-screen w-screen max-w-full rounded-none" : "h-[90vh]"
            )}>
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Manage Payment Request</DialogTitle>
                    <DialogDescription>Review the slip and approve or reject the payment for reference #{request.unique_number}.</DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto px-6 pt-2 pb-6">
                    <div className="mt-4 space-y-4">
                        {isDialogOpen && <DuplicateSlipCheck hashValue={request.hash_value} currentRequestId={request.id} />}
                        
                        {isMobileView ? (
                            <Tabs defaultValue="details" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="details">Details</TabsTrigger>
                                    <TabsTrigger value="slip">Slip</TabsTrigger>
                                </TabsList>
                                <TabsContent value="details" className="pt-4"><DetailsSection /></TabsContent>
                                <TabsContent value="slip" className="pt-4"><SlipSection /></TabsContent>
                            </Tabs>
                        ) : (
                             <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                                <DetailsSection />
                                <SlipSection />
                             </div>
                        )}
                    </div>
                </div>

                 <DialogFooter className="mt-auto p-6 bg-card border-t flex-shrink-0">
                    <div className="flex justify-end gap-2 w-full">
                         <Button 
                            variant="destructive" 
                            onClick={() => mutation.mutate({ action: 'reject' })}
                            disabled={mutation.isPending}
                            size="sm"
                        >
                            {mutation.isPending && mutation.variables?.action === 'reject' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <X className="mr-2 h-4 w-4"/>}
                            Reject
                        </Button>
                        <Button 
                            variant="default" 
                            onClick={handleApprove}
                            disabled={mutation.isPending || isLoadingEnrollments || !selectedCategory}
                             size="sm"
                        >
                             {(mutation.isPending && mutation.variables?.action === 'approve') || isLoadingEnrollments ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4"/>}
                            Approve
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export default function PaymentRequestsPage() {
    const queryClient = useQueryClient();
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [reasonFilter, setReasonFilter] = useState('all');

    const { data: requests, isLoading, isError, error, refetch, isFetching } = useQuery<PaymentRequest[]>({
        queryKey: ['paymentRequests'],
        queryFn: getPaymentRequests,
        staleTime: 1000 * 60, // 1 minute stale time
    });

    const { data: courses, isLoading: isLoadingCourses } = useQuery<Course[]>({
        queryKey: ['allCoursesForPayment'],
        queryFn: getCourses,
        staleTime: Infinity, // Courses don't change often, cache indefinitely
    });
    
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, reasonFilter]);

    const requestStats = useMemo(() => {
        if (!requests) {
            return {
                status: { total: 0, pending: 0, approved: 0, rejected: 0 },
                reasons: {}
            };
        }
        
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
        
        const filtered = requests.filter(req => {
            const matchesSearch = lowercasedFilter ? 
                (req.id?.toLowerCase() || '').includes(lowercasedFilter) ||
                (req.unique_number?.toLowerCase() || '').includes(lowercasedFilter) ||
                (req.payment_reson?.toLowerCase() || '').includes(lowercasedFilter)
                : true;
            
            const matchesStatus = statusFilter === 'all' || req.payment_status === statusFilter;
            const matchesReason = reasonFilter === 'all' || req.payment_reson === reasonFilter;

            return matchesSearch && matchesStatus && matchesReason;
        });

        // Sort by created_at date, newest first
        return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    }, [requests, searchTerm, statusFilter, reasonFilter]);


    const totalPages = Math.ceil((filteredRequests.length) / ITEMS_PER_PAGE);
    const paginatedRequests = useMemo(() => {
        return filteredRequests.slice(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE
        );
    }, [filteredRequests, currentPage]);

    if (isLoading || isLoadingCourses) {
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
    
    const reasonIcons: Record<string, React.ReactNode> = {
        course: <BookOpen className="w-6 h-6 text-primary" />,
        convocation: <GraduationCap className="w-6 h-6 text-primary" />,
        default: <Package className="w-6 h-6 text-primary" />,
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <h1 className="text-3xl font-headline font-semibold">Payment Requests</h1>
                <p className="text-muted-foreground">View and manage incoming payment requests from the portal.</p>
            </header>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold font-headline">Overview by Status</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                           <CardTitle className="text-sm font-medium">Pending</CardTitle>
                           <Hourglass className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold"><AnimatedCounter value={requestStats.status.pending} /></div></CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                           <CardTitle className="text-sm font-medium">Approved</CardTitle>
                           <CheckCircle className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold"><AnimatedCounter value={requestStats.status.approved} /></div></CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                           <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                           <XCircle className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold"><AnimatedCounter value={requestStats.status.rejected} /></div></CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                           <CardTitle className="text-sm font-medium">Total</CardTitle>
                           <Package className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold"><AnimatedCounter value={requestStats.status.total} /></div></CardContent>
                    </Card>
                </div>
            </section>
            
            <section className="space-y-4">
                 <h2 className="text-xl font-semibold font-headline">Overview by Reason</h2>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(requestStats.reasons).map(([reason, count]) => (
                        <Card key={reason}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                               <CardTitle className="text-sm font-medium capitalize">{reason.replace('_', ' ')}</CardTitle>
                               {reasonIcons[reason] || reasonIcons.default}
                            </CardHeader>
                            <CardContent><div className="text-2xl font-bold"><AnimatedCounter value={count} /></div></CardContent>
                        </Card>
                    ))}
                 </div>
            </section>

            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                             <div>
                                <CardTitle>All Requests</CardTitle>
                                <CardDescription>
                                    Showing {paginatedRequests.length} of {filteredRequests.length} records.
                                </CardDescription>
                            </div>
                            <Button onClick={() => refetch()} disabled={isFetching} className="w-full sm:w-auto">
                                <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                        <div className="flex flex-col md:flex-row gap-2">
                            <div className="relative flex-grow">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by ID, Ref #..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 w-full"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger><SelectValue placeholder="Filter by status"/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="Approved">Approved</SelectItem>
                                        <SelectItem value="Rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={reasonFilter} onValueChange={setReasonFilter}>
                                    <SelectTrigger><SelectValue placeholder="Filter by reason"/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Reasons</SelectItem>
                                        {Object.keys(requestStats.reasons).map(reason => (
                                            <SelectItem key={reason} value={reason} className="capitalize">{reason.replace('_', ' ')}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Desktop Table */}
                    <div className="relative w-full overflow-auto border rounded-lg hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Request ID</TableHead>
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
                                        <TableCell className="font-mono text-xs">{req.id}</TableCell>
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
                                            <SlipManagerCell request={req} courses={courses || []} />
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
                                        <p className="text-xs text-muted-foreground">ID: {req.id}</p>
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
                                    <SlipManagerCell request={req} courses={courses || []} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {paginatedRequests.length === 0 && (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground">No payment requests found matching your filters.</p>
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
