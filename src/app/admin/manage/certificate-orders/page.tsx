
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCertificateOrders, updateCertificateOrderCourses, deleteCertificateOrder, generateCertificate, getUserCertificatePrintStatus } from '@/lib/actions/certificates';
import { getStudentFullInfo, getStudentBalance } from '@/lib/actions/users';
import type { CertificateOrder, FullStudentData, UpdateCertificateOrderCoursesPayload, UserCertificatePrintStatus, GenerateCertificatePayload, StudentBalanceData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Loader2, XCircle, Search, Wallet, FileDown, Phone, Home, Mail, User, ListOrdered, Award, Copy, Trash2, Printer, Sparkles, ScrollText, FileText, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const ITEMS_PER_PAGE = 25;
const CONTENT_PROVIDER_URL = process.env.NEXT_PUBLIC_CONTENT_PROVIDER_URL || 'https://content-provider.pharmacollege.lk';

// --- Cell component to check and display convocation status ---
const fetchConvocationStatus = async (studentNumber: string) => {
    if (!studentNumber) return null;
    try {
        const response = await fetch(`https://qa-api.pharmacollege.lk/convocation-registrations/get-records-student-number/${studentNumber}`);
        if (response.status === 404) {
            return null; // No registration found, this is a valid state
        }
        if (!response.ok) {
            throw new Error('Failed to fetch status');
        }
        const data = await response.json();
        return data && data.registration_id ? data : null;
    } catch (error) {
        console.error(`Failed to fetch convocation status for ${studentNumber}:`, error);
        throw error; // Let react-query handle the error state
    }
};

const ConvocationStatusCell = ({ studentNumber }: { studentNumber: string }) => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['convocationStatus', studentNumber],
        queryFn: () => fetchConvocationStatus(studentNumber),
        retry: (failureCount, error: any) => {
            if (error?.message?.includes('404')) return false;
            return failureCount < 2;
        },
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });

    if (isLoading) {
        return <Skeleton className="h-5 w-28" />;
    }

    if (isError) {
        return <Badge variant="outline">Check Failed</Badge>;
    }

    if (data) {
        return <Badge variant="destructive">Convocation Registered</Badge>;
    }

    return <Badge variant="secondary">Normal</Badge>;
};


// --- Certificate Status Component ---
const CertificateStatusCell = ({ order, studentDataMap }: { order: CertificateOrder, studentDataMap: Map<string, { studentData?: FullStudentData, balanceData?: StudentBalanceData }>}) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const studentData = studentDataMap.get(order.created_by)?.studentData;
    const parentCourseId = order.course_code.split(',')[0]; 
    
    const relevantEnrollment = useMemo(() => {
        if (!studentData) return null;
        return Object.values(studentData.studentEnrollments).find(e => e.parent_course_id === parentCourseId);
    }, [studentData, parentCourseId]);

    const courseCode = relevantEnrollment?.course_code;

    const { data: certificateStatusData, isLoading: isLoadingCerts, isError: isErrorCerts } = useQuery<{ certificateStatus: UserCertificatePrintStatus[] }, Error>({
        queryKey: ['userCertificateStatus', order.created_by, courseCode],
        queryFn: () => getUserCertificatePrintStatus(order.created_by, courseCode),
        staleTime: 5 * 60 * 1000,
        enabled: !!courseCode,
    });
    
    const relevantCertificateStatus = useMemo(() => {
        if (!certificateStatusData?.certificateStatus) return null;
        return certificateStatusData.certificateStatus.find(c => c.course_code === courseCode);
    }, [certificateStatusData, courseCode]);

    const { mutate: generateCert, isPending: isGenerating } = useMutation({
        mutationFn: (payload: GenerateCertificatePayload) => generateCertificate(payload),
        onSuccess: () => {
            toast({ title: "Certificate Generated", description: "The certificate record has been created successfully." });
            queryClient.invalidateQueries({ queryKey: ['userCertificateStatus', order.created_by, courseCode] });
        },
        onError: (error: Error) => toast({ variant: 'destructive', title: 'Generation Failed', description: error.message })
    });

    if (order.certificate_id && order.certificate_id !== '0') {
         return (
             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Badge variant={'default'}>
                            {order.certificate_id}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Certificate ID from order record.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }
    
    const isLoading = isLoadingCerts || !studentData;
    
    if (isLoading) return <Skeleton className="h-6 w-24" />;
    if (isErrorCerts) return <Badge variant="destructive">Error</Badge>;
    if (relevantCertificateStatus) {
         return (
             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Badge variant={relevantCertificateStatus.print_status === '1' ? 'default' : 'secondary'}>
                            {relevantCertificateStatus.certificate_id}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Course ID: {relevantCertificateStatus.parent_course_id}</p>
                        <p>{relevantCertificateStatus.type}: {relevantCertificateStatus.certificate_id}</p>
                        <p>Status: {relevantCertificateStatus.print_status === '1' ? 'Printed' : 'Generated'}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }
    
    const handleGenerateClick = () => {
         if (!user?.username) { toast({ variant: 'destructive', title: 'Error', description: 'Could not identify admin user.' }); return; }
        if (!relevantEnrollment) { toast({ variant: 'destructive', title: 'Error', description: 'Student enrollment data not loaded or not found for this course.'}); return; }
        
        generateCert({
            student_number: order.created_by, print_status: "Printed", print_by: user.username, type: "Certificate",
            parentCourseCode: parseInt(relevantEnrollment.parent_course_id, 10), referenceId: parseInt(order.id, 10),
            course_code: relevantEnrollment.course_code, source: "courier"
        });
    };

    return (
        <Button size="sm" variant="outline" onClick={handleGenerateClick} disabled={isGenerating}>
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate
        </Button>
    )
};


// --- Action Component ---
const OrderActionsCell = ({ order, onUpdateClick, studentData, balanceData, isLoading }: { 
    order: CertificateOrder, 
    onUpdateClick: () => void,
    studentData?: FullStudentData,
    balanceData?: StudentBalanceData,
    isLoading: boolean,
}) => {
    const { isUpdateAvailable } = useMemo(() => {
        if (!studentData) return { isUpdateAvailable: false };
        const currentCourses = order.course_code.split(',').map(s => s.trim()).filter(Boolean);
        const allEligibleEnrollments = Object.values(studentData.studentEnrollments).filter(e => e.certificate_eligibility);
        const newEnrollments = allEligibleEnrollments.filter(e => !currentCourses.includes(e.parent_course_id));
        return { isUpdateAvailable: newEnrollments.length > 0 };
    }, [studentData, order.course_code]);
    
    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> <span>Checking...</span>
            </div>
        );
    }
    
    const balance = balanceData?.studentBalance;

    return (
        <div className="flex flex-col items-start sm:items-center gap-2">
            <div className="flex-shrink-0">
                {isUpdateAvailable ? (
                    <Button variant="default" size="sm" onClick={onUpdateClick}>Update Available</Button>
                ) : (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200">Up to date</Badge>
                )}
            </div>
            {balance !== undefined && (
                <div className={cn("flex items-center gap-1.5 text-xs font-medium p-1.5 rounded-md", balance > 0 ? 'bg-destructive/10 text-destructive' : 'bg-green-100 text-green-800')}>
                    <Wallet className="h-3.5 w-3.5" /> <span>LKR {balance.toLocaleString()}</span>
                </div>
            )}
        </div>
    );
};


export default function CertificateOrdersListPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState<CertificateOrder | null>(null);
    const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
    const [orderToUpdate, setOrderToUpdate] = useState<CertificateOrder | null>(null);
    const [orderToDelete, setOrderToDelete] = useState<CertificateOrder | null>(null);

    const [studentDataMap, setStudentDataMap] = useState<Map<string, { studentData?: FullStudentData, balanceData?: StudentBalanceData }>>(new Map());

    const { data: orders, isLoading: isLoadingOrders, isError, error } = useQuery<CertificateOrder[]>({
        queryKey: ['allCertificateOrders'],
        queryFn: getCertificateOrders,
        staleTime: 5 * 60 * 1000,
    });
    
    const queryClient = useQueryClient();
    const { mutate: updateCourses, isPending: isUpdating } = useMutation({
        mutationFn: (payload: UpdateCertificateOrderCoursesPayload) => updateCertificateOrderCourses(payload),
        onSuccess: (data) => {
            toast({ title: "Update Successful", description: "The certificate order has been updated." });
            queryClient.invalidateQueries({ queryKey: ['allCertificateOrders'] });
            setIsUpdateDialogOpen(false); setOrderToUpdate(null);
        },
        onError: (error: Error) => toast({ variant: 'destructive', title: 'Update Failed', description: error.message })
    });
    
    const deleteMutation = useMutation({
        mutationFn: (orderId: string) => deleteCertificateOrder(orderId),
        onSuccess: () => {
            toast({ title: 'Order Deleted', description: 'The certificate order has been removed.' });
            queryClient.invalidateQueries({ queryKey: ['allCertificateOrders'] });
            setOrderToDelete(null);
        },
        onError: (error: Error) => toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message }),
    });


    const filteredOrders = useMemo(() => {
        if (!orders) return [];
        const lowercasedFilter = searchTerm.toLowerCase();
        
        let result = orders;
        if (lowercasedFilter) {
            result = orders.filter(order =>
                order.created_by.toLowerCase().includes(lowercasedFilter) ||
                order.name_on_certificate.toLowerCase().includes(lowercasedFilter) ||
                order.id.toLowerCase().includes(lowercasedFilter)
            );
        }

        return [...result].sort((a, b) => parseInt(b.id, 10) - parseInt(a.id, 10));
    }, [orders, searchTerm]);

    const openUpdateDialog = (order: CertificateOrder) => { setOrderToUpdate(order); setIsUpdateDialogOpen(true); };

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const paginatedOrders = useMemo(() => {
        return filteredOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    }, [filteredOrders, currentPage]);

    const studentNumbersToFetch = useMemo(() => {
        return [...new Set(paginatedOrders.map(o => o.created_by).filter(sn => !studentDataMap.has(sn)))];
    }, [paginatedOrders, studentDataMap]);

    const { isLoading: isLoadingStudentData } = useQuery({
        queryKey: ['batchStudentData', studentNumbersToFetch],
        queryFn: async () => {
            if (studentNumbersToFetch.length === 0) return null;
            const promises = studentNumbersToFetch.map(sn => Promise.all([
                getStudentFullInfo(sn).catch(() => null),
                getStudentBalance(sn).catch(() => null),
            ]));
            const results = await Promise.all(promises);
            const newMap = new Map(studentDataMap);
            results.forEach((res, index) => {
                newMap.set(studentNumbersToFetch[index], { studentData: res[0], balanceData: res[1] });
            });
            setStudentDataMap(newMap);
            return newMap;
        },
        enabled: studentNumbersToFetch.length > 0,
        refetchOnWindowFocus: false,
    });

    const handleConfirmUpdate = () => {
        if (!orderToUpdate) return;
        const studentInfo = studentDataMap.get(orderToUpdate.created_by)?.studentData;
        if (!studentInfo) return;

        const currentCourses = orderToUpdate.course_code.split(',').map(s => s.trim()).filter(Boolean);
        const newEligibleCourseIds = Object.values(studentInfo.studentEnrollments).filter(e => e.certificate_eligibility && !currentCourses.includes(e.parent_course_id)).map(e => e.parent_course_id);
        const allCourseIds = [...currentCourses, ...newEligibleCourseIds];
        updateCourses({ orderId: orderToUpdate.id, courseCodes: allCourseIds.join(',') });
    };

    const handleExport = async () => {
        if (!filteredOrders.length) return;
        setIsExporting(true);
        try {
            const headers = [
                'Order ID',
                'Student ID',
                'Name on Cert',
                'Course Code(s)',
                'Payment (Verified)',
                'Garland',
                'Scroll',
                'File',
                'Order Status',
                'Print Status',
                'Order Date',
                'Mobile',
                'Address Line 1',
                'Address Line 2',
                'City',
                'District'
            ];

            const rows = filteredOrders.map(order => {
                return [
                    order.id,
                    order.created_by,
                    order.name_on_certificate || 'N/A',
                    order.course_code,
                    order.payment || '0.00',
                    order.garlent === '1' ? 'Yes' : 'No',
                    order.scroll === '1' ? 'Yes' : 'No',
                    order.certificate_file === '1' ? 'Yes' : 'No',
                    order.certificate_status,
                    order.print_status || 'Pending',
                    new Date(order.created_at).toLocaleDateString(),
                    order.mobile,
                    order.address_line1,
                    order.address_line2 || '',
                    order.city_id,
                    order.district
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
            link.setAttribute('download', `Certificate_Orders_${format(new Date(), 'yyyyMMdd')}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast({ title: "Export Successful", description: "The order list has been downloaded." });
        } catch (err) {
            toast({ variant: 'destructive', title: "Export Failed", description: "An error occurred during CSV generation." });
        } finally {
            setIsExporting(false);
        }
    };

    const handlePageInputChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const pageNum = parseInt(e.currentTarget.value, 10);
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
                setCurrentPage(pageNum);
            } else {
                 toast({ variant: 'destructive', title: 'Invalid Page Number' });
            }
        }
    };
    
    if (isLoadingOrders) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;
    if (isError) return <div className="p-8"><Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error.message}</AlertDescription></Alert></div>;

    const getStatusVariant = (status: string) => {
        if (status?.toLowerCase() === 'printed') return 'default';
        if (status?.toLowerCase() === 'generated') return 'secondary';
        return 'outline';
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-headline font-semibold">Certificate Orders</h1>
                    <p className="text-muted-foreground">Manage certificate requests, verify payments, and process delivery.</p>
                </div>
                <Button onClick={handleExport} disabled={isExporting || filteredOrders.length === 0}>
                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                    Export to CSV
                </Button>
            </header>

            <AlertDialog open={!!orderToDelete} onOpenChange={() => setOrderToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the order #{orderToDelete?.id}. This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(orderToDelete!.id)} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete Order
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Update Certificate Order</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                           {orderToUpdate && studentDataMap.get(orderToUpdate.created_by)?.studentData ? (
                             <div className="text-sm">
                                <p className="mb-3">This student is eligible for additional courses. Do you want to add them to this order?</p>
                                <div className="space-y-4 rounded-md border bg-muted/50 p-3 max-h-60 overflow-y-auto">
                                    {Object.values(studentDataMap.get(orderToUpdate!.created_by)?.studentData?.studentEnrollments || {}).filter(e => e.certificate_eligibility && !orderToUpdate?.course_code.includes(e.parent_course_id)).map(enrollment => (
                                        <div key={enrollment.parent_course_id}>
                                            <h4 className="font-semibold text-card-foreground">{enrollment.parent_course_name}</h4>
                                            <ul className="mt-1 list-disc list-inside text-xs text-muted-foreground space-y-1 pl-2">
                                                {enrollment.criteria_details.map(c => <li key={c.id} className="flex items-center justify-between"><span>{c.list_name}</span>{c.evaluation.completed ? <CheckCircle className="h-3.5 w-3.5 text-green-600" /> : <XCircle className="h-3.5 w-3.5 text-red-600" />}</li>)}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                           ) : <div><Loader2 className="animate-spin mr-2"/>Loading...</div>}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmUpdate} disabled={isUpdating || !orderToUpdate || !studentDataMap.get(orderToUpdate!.created_by)?.studentData}>
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Update Order
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={!!selectedOrderDetails} onOpenChange={(open) => !open && setSelectedOrderDetails(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Order Details: #{selectedOrderDetails?.id}</DialogTitle>
                        <DialogDescription>Overview of student info, items, and verification documents.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-6 text-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-1"><Label className="text-xs uppercase text-muted-foreground font-bold">Delivery Address</Label><p className="p-3 bg-muted rounded-md text-foreground font-medium leading-relaxed">{selectedOrderDetails?.address_line1}<br/>{selectedOrderDetails?.address_line2 && <>{selectedOrderDetails.address_line2}<br/></>}{selectedOrderDetails?.city_id}, {selectedOrderDetails?.district}</p></div>
                                <div className="space-y-1"><Label className="text-xs uppercase text-muted-foreground font-bold">Contact Phone</Label><p className="p-2 bg-muted rounded-md font-mono">{selectedOrderDetails?.mobile}</p></div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2"><Label className="text-xs uppercase text-muted-foreground font-bold">Additional Items Ordered</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedOrderDetails?.garlent === '1' ? <Badge variant="outline" className="bg-primary/5 gap-1.5"><Sparkles className="h-3.5 w-3.5 text-primary"/> Garland</Badge> : null}
                                        {selectedOrderDetails?.scroll === '1' ? <Badge variant="outline" className="bg-primary/5 gap-1.5"><ScrollText className="h-3.5 w-3.5 text-primary"/> Scroll</Badge> : null}
                                        {selectedOrderDetails?.certificate_file === '1' ? <Badge variant="outline" className="bg-primary/5 gap-1.5"><FileText className="h-3.5 w-3.5 text-primary"/> Cert. File</Badge> : null}
                                        {(!selectedOrderDetails?.garlent || selectedOrderDetails.garlent === '0') && 
                                         (!selectedOrderDetails?.scroll || selectedOrderDetails.scroll === '0') && 
                                         (!selectedOrderDetails?.certificate_file || selectedOrderDetails.certificate_file === '0') && 
                                         <p className="text-muted-foreground italic">No extras requested.</p>}
                                    </div>
                                </div>
                                <div className="space-y-1 pt-2 border-t"><Label className="text-xs uppercase text-muted-foreground font-bold">Verification Amount</Label><p className="text-lg font-bold text-primary">LKR {parseFloat(selectedOrderDetails?.payment || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}</p></div>
                            </div>
                        </div>
                        {selectedOrderDetails?.payment_slip && (
                            <div className="space-y-2 border-t pt-4">
                                <Label className="text-xs uppercase text-muted-foreground font-bold">Payment Verification Document</Label>
                                <div className="relative aspect-[16/9] w-full max-w-sm rounded-lg overflow-hidden border-2 bg-muted mx-auto">
                                    <Image src={`${CONTENT_PROVIDER_URL}${selectedOrderDetails.payment_slip}`} alt="Payment Slip" layout="fill" objectFit="contain" data-ai-hint="payment slip" />
                                    <a href={`${CONTENT_PROVIDER_URL}${selectedOrderDetails.payment_slip}`} target="_blank" rel="noopener noreferrer" className="absolute bottom-2 right-2"><Button size="sm" variant="secondary"><ExternalLink className="h-3.5 w-3.5 mr-1.5"/>Full Size</Button></a>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div><CardTitle>All Certificate Orders</CardTitle><CardDescription>{filteredOrders.length} records found.</CardDescription></div>
                        <div className="relative w-full sm:w-auto sm:max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search student or name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/></div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto border rounded-lg hidden md:block">
                        <Table><TableHeader><TableRow><TableHead>Order ID</TableHead><TableHead>Student</TableHead><TableHead>Course(s)</TableHead><TableHead>Extras</TableHead><TableHead>Payment</TableHead><TableHead>Order Status</TableHead><TableHead>Convocation</TableHead><TableHead>Eligibility</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {paginatedOrders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell>#{order.id}</TableCell>
                                        <TableCell className="font-medium"><p className="text-xs font-bold">{order.created_by}</p><p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{order.name_on_certificate}</p></TableCell>
                                        <TableCell><div className="flex flex-wrap gap-1">{order.course_code.split(',').map(code => <Badge key={code.trim()} variant="outline" className="text-[10px] h-5">{code.trim()}</Badge>)}</div></TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                {order.garlent === '1' && <TooltipProvider><Tooltip><TooltipTrigger asChild><Sparkles className="h-4 w-4 text-primary"/></TooltipTrigger><TooltipContent>Garland</TooltipContent></Tooltip></TooltipProvider>}
                                                {order.scroll === '1' && <TooltipProvider><Tooltip><TooltipTrigger asChild><ScrollText className="h-4 w-4 text-primary"/></TooltipTrigger><TooltipContent>Scroll</TooltipContent></Tooltip></TooltipProvider>}
                                                {order.certificate_file === '1' && <TooltipProvider><Tooltip><TooltipTrigger asChild><FileText className="h-4 w-4 text-primary"/></TooltipTrigger><TooltipContent>Cert. File</TooltipContent></Tooltip></TooltipProvider>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">LKR {parseFloat(order.payment || '0').toLocaleString()}</TableCell>
                                        <TableCell><Badge variant={order.certificate_status === 'Delivered' ? 'default' : 'secondary'} className="text-[10px]">{order.certificate_status}</Badge></TableCell>
                                        <TableCell><ConvocationStatusCell studentNumber={order.created_by} /></TableCell>
                                        <TableCell><OrderActionsCell order={order} onUpdateClick={() => openUpdateDialog(order)} studentData={studentDataMap.get(order.created_by)?.studentData} balanceData={studentDataMap.get(order.created_by)?.balanceData} isLoading={isLoadingStudentData && !studentDataMap.has(order.created_by)} /></TableCell>
                                        <TableCell className="text-right space-x-1">
                                            <Button variant="outline" size="sm" onClick={() => setSelectedOrderDetails(order)}>View</Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setOrderToDelete(order)}><Trash2 className="h-4 w-4"/></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="md:hidden space-y-4">
                        {paginatedOrders.map(order => (
                            <div key={order.id} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                                <div className="flex justify-between items-start"><div><p className="font-bold">{order.created_by}</p><p className="text-sm text-muted-foreground">{order.name_on_certificate}</p></div><div className="text-right text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</div></div>
                                <div className="text-sm space-y-2 pt-2 border-t">
                                    <div className="flex items-center justify-between"><p className="text-muted-foreground font-medium">Verified Payment</p><p className="font-bold text-primary">LKR {parseFloat(order.payment || '0').toLocaleString()}</p></div>
                                    <div className="flex items-center justify-between"><p className="text-muted-foreground font-medium">Extras</p>
                                        <div className="flex gap-2">
                                            {order.garlent === '1' && <Sparkles className="h-4 w-4 text-primary"/>}
                                            {order.scroll === '1' && <ScrollText className="h-4 w-4 text-primary"/>}
                                            {order.certificate_file === '1' && <FileText className="h-4 w-4 text-primary"/>}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between"><p className="text-muted-foreground font-medium">Status</p><Badge variant={order.certificate_status === 'Delivered' ? 'default' : 'secondary'}>{order.certificate_status}</Badge></div>
                                    <div className="flex items-start justify-between"><p className="text-muted-foreground font-medium shrink-0 pr-2">Convocation</p><ConvocationStatusCell studentNumber={order.created_by} /></div>
                                    <div className="flex items-start justify-between"><p className="text-muted-foreground font-medium shrink-0 pr-2">Eligibility</p><div className="text-right"><OrderActionsCell order={order} onUpdateClick={() => openUpdateDialog(order)} studentData={studentDataMap.get(order.created_by)?.studentData} balanceData={studentDataMap.get(order.created_by)?.balanceData} isLoading={isLoadingStudentData && !studentDataMap.has(order.created_by)} /></div></div>
                                    <div className="flex items-center justify-end pt-2 border-t mt-2 gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setSelectedOrderDetails(order)}>Details</Button>
                                        <Button variant="destructive" size="sm" onClick={() => setOrderToDelete(order)}>Delete</Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {paginatedOrders.length === 0 && <div className="text-center py-10"><p className="text-muted-foreground">No orders found.</p></div>}
                </CardContent>
                {totalPages > 1 && (
                    <CardFooter className="flex items-center justify-center space-x-2 pt-6">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Previous</Button>
                        <div className="flex items-center justify-center text-sm font-medium">Page<Input key={currentPage} type="number" defaultValue={currentPage} onKeyDown={handlePageInputChange} className="h-8 w-16 mx-2 text-center" />of {totalPages}</div>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
