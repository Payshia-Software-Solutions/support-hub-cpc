"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getCertificateOrders, updateCertificateOrderCourses, deleteCertificateOrder, generateCertificate, getUserCertificatePrintStatus } from '@/lib/actions/certificates';
import { getStudentFullInfo, getStudentBalance } from '@/lib/actions/users';
import { getParentCourses } from '@/lib/actions/courses';
import type { CertificateOrder, FullStudentData, UpdateCertificateOrderCoursesPayload, UserCertificatePrintStatus, GenerateCertificatePayload, StudentBalanceData, ParentCourse } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Loader2, XCircle, Search, Wallet, FileDown, Phone, Home, Mail, User, ListOrdered, Award, Copy, Trash2, Printer, Sparkles, ScrollText, FileText, ExternalLink, FileCheck } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { format } from 'date-fns';

const ITEMS_PER_PAGE = 25;
const CONTENT_PROVIDER_URL = process.env.NEXT_PUBLIC_CONTENT_PROVIDER_URL || 'https://content-provider.pharmacollege.lk';

// --- Cell component to check and display convocation status ---
const fetchConvocationStatus = async (studentNumber: string) => {
    if (!studentNumber) return null;
    try {
        const response = await fetch(`https://qa-api.pharmacollege.lk/convocation-registrations/get-records-student-number/${studentNumber}`);
        if (response.status === 404) {
            return null;
        }
        if (!response.ok) {
            throw new Error('Failed to fetch status');
        }
        const data = await response.json();
        return data && data.registration_id ? data : null;
    } catch (error) {
        console.error(`Failed to fetch convocation status for ${studentNumber}:`, error);
        throw error;
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
        staleTime: 1000 * 60 * 5,
    });

    if (isLoading) return <Skeleton className="h-5 w-28" />;
    if (isError) return <Badge variant="outline">Check Failed</Badge>;
    if (data) return <Badge variant="destructive">Convocation Registered</Badge>;
    return <Badge variant="secondary">Normal</Badge>;
};


// --- Certificate Management Component ---
const CertificateStatusCell = ({ 
    order, 
    studentDataMap, 
    courseNameMap 
}: { 
    order: CertificateOrder, 
    studentDataMap: Map<string, { studentData?: FullStudentData, balanceData?: StudentBalanceData }>,
    courseNameMap: Map<string, string>
}) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const studentData = studentDataMap.get(order.created_by)?.studentData;
    const courseIds = order.course_code.split(',').map(id => id.trim()).filter(Boolean);

    const { data: certStatus, isLoading: isLoadingCerts, refetch } = useQuery<{ certificateStatus: UserCertificatePrintStatus[] }>({
        queryKey: ['userCertificateStatus', order.created_by],
        queryFn: () => getUserCertificatePrintStatus(order.created_by),
        staleTime: 5 * 60 * 1000,
        enabled: !!order.created_by,
    });

    const generateCertMutation = useMutation({
        mutationFn: (payload: GenerateCertificatePayload) => generateCertificate(payload),
        onSuccess: () => {
            toast({ title: "Certificate Generated", description: "Document record created successfully." });
            refetch();
        },
        onError: (error: Error) => toast({ variant: 'destructive', title: 'Generation Failed', description: error.message })
    });

    const getGeneratedDoc = (courseId: string) => {
        return certStatus?.certificateStatus?.find(c => c.parent_course_id === courseId && (c.type === 'Certificate' || c.type === 'Workshop-Certificate'));
    };

    if (isLoadingCerts || !studentData) return <div className="space-y-2"><Skeleton className="h-6 w-24" /><Skeleton className="h-6 w-24" /></div>;

    return (
        <div className="flex flex-col gap-3 min-w-[200px]">
            {courseIds.map(id => {
                const cert = getGeneratedDoc(id);
                const enrollment = Object.values(studentData.studentEnrollments).find(e => e.parent_course_id === id);
                
                // Individual Certificate Print URL logic
                const certPrintUrl = `https://admin.pharmacollege.lk/assets/content/lms-management/certification/print-view/courier-list-certificate?courseCode=${id}&tableMode=0&fixedStudentNumber=${order.created_by}`;

                // Individual Transcript Print URL logic
                let transPrintUrl = '';
                if (id === '1') {
                    transPrintUrl = `https://admin.pharmacollege.lk//assets/content/lms-management/certification/print-view/courier-print-all-transcript?courseCode=1&tableMode=0&fixedStudentNumber=${order.created_by}`;
                } else if (id === '2') {
                    transPrintUrl = `https://admin.pharmacollege.lk//assets/content/lms-management/certification/print-view/courier-print-all-transcript-advanced?courseCode=2&tableMode=0&fixedStudentNumber=${order.created_by}`;
                } else {
                    const transBaseUrl = 'https://admin.pharmacollege.lk/assets/content/lms-management/certification/print-view/print-all-transcript.php';
                    transPrintUrl = `${transBaseUrl}?courseCode=${id}&showSession=1&tableMode=0&fixedStudentNumber=${order.created_by}`;
                }

                return (
                    <div key={id} className="space-y-1.5 border-l-2 border-muted pl-2 py-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1 leading-tight">{courseNameMap.get(id) || `ID: ${id}`}</p>
                        <div className="flex flex-wrap items-center gap-2">
                            {cert ? (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center gap-1">
                                                <Badge variant={cert.print_status === '1' ? 'default' : 'secondary'} className="font-mono text-[9px] h-5 px-1.5">
                                                    <FileCheck className="h-2.5 w-2.5 mr-1" />
                                                    {cert.certificate_id}
                                                </Badge>
                                                <Button asChild size="icon" variant="ghost" className="h-6 w-6">
                                                    <a href={certPrintUrl} target="_blank" rel="noopener noreferrer">
                                                        <Printer className="h-3.5 w-3.5" title="Print Certificate" />
                                                    </a>
                                                </Button>
                                                {/* Transcript Button */}
                                                <Button asChild size="icon" variant="ghost" className="h-6 w-6">
                                                    <a href={transPrintUrl} target="_blank" rel="noopener noreferrer">
                                                        <Printer className="h-3.5 w-3.5 text-blue-600" title="Print Transcript" />
                                                    </a>
                                                </Button>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            <p className="text-xs font-bold">Issued Documents</p>
                                            <p className="text-[10px] opacity-70">Cert Status: {cert.print_status === '1' ? 'Printed' : 'Generated'}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ) : (
                                <Button 
                                    size="xs" 
                                    variant="outline" 
                                    className="h-6 text-[10px] font-bold"
                                    onClick={() => {
                                        if (!user?.username) { toast({ variant: 'destructive', title: 'Auth Error' }); return; }
                                        if (!enrollment) { toast({ variant: 'destructive', title: 'Enrollment not found' }); return; }
                                        generateCertMutation.mutate({
                                            student_number: order.created_by,
                                            print_status: "0",
                                            print_by: user.username,
                                            type: "Certificate",
                                            parentCourseCode: parseInt(id, 10),
                                            referenceId: parseInt(order.id, 10),
                                            course_code: enrollment.course_code,
                                            source: "courier"
                                        });
                                    }}
                                    disabled={generateCertMutation.isPending}
                                >
                                    {generateCertMutation.isPending ? <Loader2 className="h-2.5 w-2.5 animate-spin mr-1"/> : <Award className="h-2.5 w-2.5 mr-1"/>}
                                    Generate
                                </Button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
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
        const currentCourses = order.course_code.split(',').map(id => id.trim()).filter(Boolean);
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
    const [courseFilter, setCourseFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState<CertificateOrder | null>(null);
    const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
    const [orderToUpdate, setOrderToUpdate] = useState<CertificateOrder | null>(null);
    const [orderToDelete, setOrderToDelete] = useState<CertificateOrder | null>(null);
    const [rangeFrom, setRangeFrom] = useState('');
    const [rangeTo, setRangeTo] = useState('');

    const [studentDataMap, setStudentDataMap] = useState<Map<string, { studentData?: FullStudentData, balanceData?: StudentBalanceData }>>(new Map());

    const { data: orders, isLoading: isLoadingOrders, isError, error } = useQuery<CertificateOrder[]>({
        queryKey: ['certificateOrders'],
        queryFn: getCertificateOrders,
        staleTime: 5 * 60 * 1000,
    });

    const { data: parentCourses } = useQuery<ParentCourse[]>({
        queryKey: ['parentCourses'],
        queryFn: getParentCourses,
        staleTime: Infinity,
    });

    const courseNameMap = useMemo(() => {
        const map = new Map<string, string>();
        parentCourses?.forEach(course => map.set(course.id, course.course_name));
        return map;
    }, [parentCourses]);
    
    const queryClient = useQueryClient();
    const { mutate: updateCourses, isPending: isUpdating } = useMutation({
        mutationFn: (payload: UpdateCertificateOrderCoursesPayload) => updateCertificateOrderCourses(payload),
        onSuccess: (data) => {
            toast({ title: "Update Successful", description: "The certificate order has been updated." });
            queryClient.invalidateQueries({ queryKey: ['certificateOrders'] });
            setIsUpdateDialogOpen(false); setOrderToUpdate(null);
        },
        onError: (error: Error) => toast({ variant: 'destructive', title: 'Update Failed', description: error.message })
    });
    
    const deleteMutation = useMutation({
        mutationFn: (orderId: string) => deleteCertificateOrder(orderId),
        onSuccess: () => {
            toast({ title: 'Order Deleted', description: 'The certificate order has been removed.' });
            queryClient.invalidateQueries({ queryKey: ['certificateOrders'] });
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

        if (courseFilter !== 'all') {
            result = result.filter(order => 
                order.course_code.split(',').map(s => s.trim()).includes(courseFilter)
            );
        }

        return [...result].sort((a, b) => parseInt(b.id, 10) - parseInt(a.id, 10));
    }, [orders, searchTerm, courseFilter]);

    const openUpdateDialog = (order: CertificateOrder) => { setOrderToUpdate(order); setIsUpdateDialogOpen(true); };

    useEffect(() => { setCurrentPage(1); }, [searchTerm, courseFilter]);

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
            const headers = ['Order ID', 'Student ID', 'Name on Cert', 'Course Code(s)', 'Payment', 'Garland', 'Scroll', 'File', 'Status', 'Print Status', 'Order Date'];
            const rows = filteredOrders.map(order => [
                order.id, order.created_by, order.name_on_certificate || 'N/A', order.course_code, order.payment || '0.00',
                order.garlent === '1' ? 'Yes' : 'No', order.scroll === '1' ? 'Yes' : 'No', order.certificate_file === '1' ? 'Yes' : 'No',
                order.certificate_status, order.print_status || 'Pending', new Date(order.created_at).toLocaleDateString()
            ]);

            const csvContent = [headers.join(','), ...rows.map(row => row.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `Certificate_Orders_${format(new Date(), 'yyyyMMdd')}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast({ title: "Export Successful" });
        } catch (err) {
            toast({ variant: 'destructive', title: "Export Failed" });
        } finally {
            setIsExporting(false);
        }
    };

    const handlePageInputChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const pageNum = parseInt(e.currentTarget.value, 10);
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) setCurrentPage(pageNum);
        }
    };

    // Bulk print URL helpers for Certificates
    const getBulkPrintBaseUrl = (courseId: string) => {
        return 'https://admin.pharmacollege.lk/assets/content/lms-management/certification/print-view/courier-list-certificate';
    };

    // Bulk print URL helpers for Transcripts
    const getBulkTranscriptPrintBaseUrl = (courseId: string) => {
        if (courseId === '1') return 'https://admin.pharmacollege.lk//assets/content/lms-management/certification/print-view/courier-print-all-transcript';
        if (courseId === '2') return 'https://admin.pharmacollege.lk//assets/content/lms-management/certification/print-view/courier-print-all-transcript-advanced';
        return 'https://admin.pharmacollege.lk/assets/content/lms-management/certification/print-view/print-all-transcript.php';
    };
    
    if (isLoadingOrders) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;
    if (isError) return <div className="p-8"><Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error.message}</AlertDescription></Alert></div>;

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-headline font-semibold">Certificate Orders</h1>
                    <p className="text-muted-foreground">Manage certificate requests, verify payments, and issue documents.</p>
                </div>
                <Button onClick={handleExport} disabled={isExporting || filteredOrders.length === 0}>
                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                    Export to CSV
                </Button>
            </header>

            <AlertDialog open={!!orderToDelete} onOpenChange={() => setOrderToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the order #{orderToDelete?.id}.</AlertDialogDescription></AlertDialogHeader>
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
                                            <ul className="mt-1 list-disc list-inside text-xs text-muted-foreground pl-2">
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
                        <AlertDialogAction onClick={handleConfirmUpdate} disabled={isUpdating || !orderToUpdate}>
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Update Order
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={!!selectedOrderDetails} onOpenChange={(open) => !open && setSelectedOrderDetails(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Order Details: #{selectedOrderDetails?.id}</DialogTitle>
                        <DialogDescription>Student info and verification documents.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-6 text-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-1"><Label className="text-xs uppercase text-muted-foreground font-bold">Delivery Address</Label><p className="p-3 bg-muted rounded-md font-medium leading-relaxed">{selectedOrderDetails?.address_line1}<br/>{selectedOrderDetails?.address_line2 && <>{selectedOrderDetails.address_line2}<br/></>}{selectedOrderDetails?.city_id}, {selectedOrderDetails?.district}</p></div>
                                <div className="space-y-1"><Label className="text-xs uppercase text-muted-foreground font-bold">Contact Phone</Label><p className="p-2 bg-muted rounded-md font-mono">{selectedOrderDetails?.mobile}</p></div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2"><Label className="text-xs uppercase text-muted-foreground font-bold">Additional Items Ordered</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedOrderDetails?.garlent === '1' && <Badge variant="outline" className="gap-1.5"><Sparkles className="h-3.5 w-3.5 text-primary"/> Garland</Badge>}
                                        {selectedOrderDetails?.scroll === '1' && <Badge variant="outline" className="gap-1.5"><ScrollText className="h-3.5 w-3.5 text-primary"/> Scroll</Badge>}
                                        {selectedOrderDetails?.certificate_file === '1' && <Badge variant="outline" className="gap-1.5"><FileText className="h-3.5 w-3.5 text-primary"/> Cert. File</Badge>}
                                    </div>
                                </div>
                                <div className="space-y-1 pt-2 border-t"><Label className="text-xs uppercase text-muted-foreground font-bold">Verification Amount</Label><p className="text-lg font-bold text-primary">LKR {parseFloat(selectedOrderDetails?.payment || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}</p></div>
                            </div>
                        </div>
                        {selectedOrderDetails?.payment_slip && (
                            <div className="space-y-2 border-t pt-4">
                                <Label className="text-xs uppercase text-muted-foreground font-bold">Payment Verification Document</Label>
                                <div className="relative aspect-[16/9] w-full max-w-sm rounded-lg overflow-hidden border-2 bg-muted mx-auto">
                                    <Image src={`${CONTENT_PROVIDER_URL}/content-provider/uploads/certificate-payment-slips/${selectedOrderDetails.payment_slip}`} alt="Payment Slip" layout="fill" objectFit="contain" data-ai-hint="payment slip" />
                                    <a href={`${CONTENT_PROVIDER_URL}/content-provider/uploads/certificate-payment-slips/${selectedOrderDetails.payment_slip}`} target="_blank" rel="noopener noreferrer" className="absolute bottom-2 right-2"><Button size="sm" variant="secondary"><ExternalLink className="h-3.5 w-3.5 mr-1.5"/>Full Size</Button></a>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Bulk Printing Actions */}
            {/* Bulk Printing Actions */}
            <Card className={cn("border-primary/20 bg-primary/5 shadow-md transition-all", courseFilter === 'all' && "opacity-60")}>
                <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-full">
                                <Printer className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-bold">Bulk Actions{courseFilter !== 'all' ? `: ${courseNameMap.get(courseFilter)}` : ''}</p>
                                <p className="text-xs text-muted-foreground">
                                    {courseFilter === 'all' ? 'Select a course filter to enable batch printing.' : 'Batch document management.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                                <Label htmlFor="rangeFrom" className="text-[10px] font-bold uppercase text-muted-foreground">From</Label>
                                <Input 
                                    id="rangeFrom"
                                    type="number" 
                                    placeholder="Start ID" 
                                    className="h-8 w-20 text-xs px-2" 
                                    value={rangeFrom} 
                                    onChange={(e) => setRangeFrom(e.target.value)}
                                    disabled={courseFilter === 'all'}
                                />
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Label htmlFor="rangeTo" className="text-[10px] font-bold uppercase text-muted-foreground">To</Label>
                                <Input 
                                    id="rangeTo"
                                    type="number" 
                                    placeholder="End ID" 
                                    className="h-8 w-20 text-xs px-2" 
                                    value={rangeTo} 
                                    onChange={(e) => setRangeTo(e.target.value)}
                                    disabled={courseFilter === 'all'}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        <Button asChild variant="outline" size="xs" className="flex-1 md:flex-initial bg-background text-[10px]" disabled={courseFilter === 'all'}>
                            <a href={courseFilter !== 'all' ? `${getBulkPrintBaseUrl(courseFilter)}?courseCode=${courseFilter}&tableMode=1${rangeFrom ? `&rangeFrom=${rangeFrom}` : ''}${rangeTo ? `&rangeTo=${rangeTo}` : ''}` : '#'} target="_blank" rel="noopener noreferrer">
                                <ListOrdered className="mr-1.5 h-3 w-3 text-primary" /> List Table
                            </a>
                        </Button>
                        <Button asChild variant="outline" size="xs" className="flex-1 md:flex-initial bg-background text-[10px]" disabled={courseFilter === 'all'}>
                            <a href={courseFilter !== 'all' ? `${getBulkPrintBaseUrl(courseFilter)}?courseCode=${courseFilter}&tableMode=0${rangeFrom ? `&rangeFrom=${rangeFrom}` : ''}${rangeTo ? `&rangeTo=${rangeTo}` : ''}` : '#'} target="_blank" rel="noopener noreferrer">
                                <Award className="mr-1.5 h-3 w-3 text-primary" /> Batch Certs
                            </a>
                        </Button>
                        <Button asChild variant="outline" size="xs" className="flex-1 md:flex-initial bg-background text-[10px]" disabled={courseFilter === 'all'}>
                            <a href={courseFilter !== 'all' ? `${getBulkTranscriptPrintBaseUrl(courseFilter)}?courseCode=${courseFilter}&tableMode=1${rangeFrom ? `&rangeFrom=${rangeFrom}` : ''}${rangeTo ? `&rangeTo=${rangeTo}` : ''}` : '#'} target="_blank" rel="noopener noreferrer">
                                <ListOrdered className="mr-1.5 h-3 w-3 text-blue-600" /> Trans Table
                            </a>
                        </Button>
                        <Button asChild variant="outline" size="xs" className="flex-1 md:flex-initial bg-background text-[10px]" disabled={courseFilter === 'all'}>
                            <a href={courseFilter !== 'all' ? `${getBulkTranscriptPrintBaseUrl(courseFilter)}?courseCode=${courseFilter}&tableMode=0${rangeFrom ? `&rangeFrom=${rangeFrom}` : ''}${rangeTo ? `&rangeTo=${rangeTo}` : ''}` : '#'} target="_blank" rel="noopener noreferrer">
                                <FileText className="mr-1.5 h-3 w-3 text-blue-600" /> Batch Trans
                            </a>
                        </Button>
                        <Button asChild variant="default" size="xs" className="flex-1 md:flex-initial text-[10px]" disabled={courseFilter === 'all'}>
                            <Link href={courseFilter !== 'all' ? `/print/certificate-address-list?courseCode=${courseFilter}${rangeFrom ? `&rangeFrom=${rangeFrom}` : ''}${rangeTo ? `&rangeTo=${rangeTo}` : ''}` : '#'} target="_blank">
                                <Home className="mr-1.5 h-3 w-3" /> Address List
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div><CardTitle>Certificate Orders</CardTitle><CardDescription>{filteredOrders.length} records found.</CardDescription></div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <Select value={courseFilter} onValueChange={setCourseFilter}>
                                <SelectTrigger className="w-full sm:w-[200px]">
                                    <SelectValue placeholder="Filter by Course" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Courses</SelectItem>
                                    {Array.from(courseNameMap.entries()).map(([id, name]) => (
                                        <SelectItem key={id} value={id}>{name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="relative w-full sm:w-auto sm:max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search student or name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto border rounded-lg hidden md:block">
                        <Table><TableHeader><TableRow><TableHead>Order ID</TableHead><TableHead>Student</TableHead><TableHead>Course(s)</TableHead><TableHead>Extras</TableHead><TableHead>Payment</TableHead><TableHead>Convocation</TableHead><TableHead>Issuance & Print</TableHead><TableHead>Eligibility</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {paginatedOrders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell>#{order.id}</TableCell>
                                        <TableCell className="font-medium text-xs"><strong>{order.created_by}</strong><br/>{order.name_on_certificate}</TableCell>
                                        <TableCell className="min-w-[180px]">
                                            <div className="flex flex-col gap-1.5">
                                                {order.course_code.split(',').map(id => (
                                                    <Badge key={id} variant="secondary" className="justify-start h-auto py-1 px-2 text-[10px] font-medium border-primary/10">
                                                        {courseNameMap.get(id.trim()) || `ID: ${id}`}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                {order.garlent === '1' && <Sparkles className="h-4 w-4 text-primary"/>}
                                                {order.scroll === '1' && <ScrollText className="h-4 w-4 text-primary"/>}
                                                {order.certificate_file === '1' && <FileText className="h-4 w-4 text-primary"/>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">LKR {parseFloat(order.payment || '0').toLocaleString()}</TableCell>
                                        <TableCell><ConvocationStatusCell studentNumber={order.created_by} /></TableCell>
                                        <TableCell>
                                            <CertificateStatusCell 
                                                order={order} 
                                                studentDataMap={studentDataMap} 
                                                courseNameMap={courseNameMap} 
                                            />
                                        </TableCell>
                                        <TableCell><OrderActionsCell order={order} onUpdateClick={() => openUpdateDialog(order)} studentData={studentDataMap.get(order.created_by)?.studentData} balanceData={studentDataMap.get(order.created_by)?.balanceData} isLoading={isLoadingStudentData && !studentDataMap.has(order.created_by)} /></TableCell>
                                        <TableCell className="text-right space-x-1">
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={`/print/certificate-address-list?courseCode=${order.course_code.split(',')[0].trim()}&rangeFrom=${order.id}&rangeTo=${order.id}`} target="_blank" rel="noopener noreferrer">
                                                    <Printer className="h-3.5 w-3.5 mr-1" /> Label
                                                </a>
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => setSelectedOrderDetails(order)}>View</Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setOrderToDelete(order)}><Trash2 className="h-4 w-4"/></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    {/* Mobile View Omitted for Brevity in this block, but maintained functionality */}
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
