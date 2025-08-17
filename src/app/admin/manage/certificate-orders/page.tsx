
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCertificateOrders, updateCertificateOrderCourses, getUserCertificatePrintStatus, generateCertificate } from '@/lib/actions/certificates';
import { getStudentFullInfo, getStudentBalance } from '@/lib/actions/users';
import type { CertificateOrder, FullStudentData, UpdateCertificateOrderCoursesPayload, UserCertificatePrintStatus, GenerateCertificatePayload, StudentBalanceData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Loader2, XCircle, Search, Wallet, FileDown, Phone, Home, Mail, User, ListOrdered, Award, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';


const ITEMS_PER_PAGE = 25;

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
            // Don't retry for 404s, which are handled as a success(null)
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
    const parentCourseId = order.course_code.split(',')[0]; // Assuming one for now for simplicity
    
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
    const { newEligibleEnrollments, isUpdateAvailable } = useMemo(() => {
        if (!studentData) return { newEligibleEnrollments: [], isUpdateAvailable: false };
        const currentCourses = order.course_code.split(',').map(s => s.trim()).filter(Boolean);
        const allEligibleEnrollments = Object.values(studentData.studentEnrollments).filter(e => e.certificate_eligibility);
        const newEnrollments = allEligibleEnrollments.filter(e => !currentCourses.includes(e.parent_course_id));
        return { newEligibleEnrollments: newEnrollments, isUpdateAvailable: newEnrollments.length > 0 };
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
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

    const filteredOrders = useMemo(() => {
        if (!orders) return [];
        const lowercasedFilter = searchTerm.toLowerCase();
        if (!lowercasedFilter) return orders;
        return orders.filter(order =>
            order.created_by.toLowerCase().includes(lowercasedFilter) ||
            order.name_on_certificate.toLowerCase().includes(lowercasedFilter) ||
            order.id.toLowerCase().includes(lowercasedFilter)
        );
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
    
    if (isLoadingOrders) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;
    if (isError) return (
        <div className="p-8">
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
            </Alert>
        </div>
    );

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header><h1 className="text-3xl font-headline font-semibold">Certificate Orders</h1><p className="text-muted-foreground">View all certificate orders and check student eligibility.</p></header>

            <AlertDialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Update Certificate Order</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                           {orderToUpdate && studentDataMap.get(orderToUpdate.created_by)?.studentData ? (
                             <div className="text-sm">
                                <p className="mb-3">This student is eligible for the following additional course(s). Do you want to add them to this certificate order?</p>
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
                        <AlertDialogAction onClick={handleConfirmUpdate} disabled={isUpdating || !orderToUpdate || !studentDataMap.get(orderToUpdate.created_by)?.studentData}>
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Update Order
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={!!selectedOrderDetails} onOpenChange={(open) => !open && setSelectedOrderDetails(null)}>
                <DialogContent><DialogHeader><DialogTitle>Shipping Details for Order #{selectedOrderDetails?.id}</DialogTitle><DialogDescription>Delivery information provided by {selectedOrderDetails?.created_by}.</DialogDescription></DialogHeader>
                    <div className="py-4 space-y-4 text-sm">
                        <div className="space-y-1"><Label>Full Address</Label><p className="p-2 bg-muted rounded-md text-muted-foreground">{selectedOrderDetails?.address_line1}, {selectedOrderDetails?.address_line2}, {selectedOrderDetails?.city_id}, {selectedOrderDetails?.district}</p></div>
                        <div className="space-y-1"><Label>Contact Number</Label><p className="p-2 bg-muted rounded-md text-muted-foreground">{selectedOrderDetails?.mobile}</p></div>
                    </div>
                </DialogContent>
            </Dialog>

            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div><CardTitle>All Orders</CardTitle><CardDescription>{filteredOrders.length} orders found.</CardDescription></div>
                        <div className="flex items-center gap-2">
                            <div className="relative w-full sm:w-auto sm:max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search student or name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/></div>
                            <Button onClick={() => {}} disabled={true}><FileDown className="mr-2 h-4 w-4" />Export</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto border rounded-lg hidden md:block">
                        <Table><TableHeader><TableRow><TableHead>Order ID</TableHead><TableHead>Student</TableHead><TableHead>Course(s)</TableHead><TableHead>Cert Status</TableHead><TableHead>Convocation Status</TableHead><TableHead>Order Date</TableHead><TableHead>Eligibility</TableHead><TableHead className="text-right">Shipping Details</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {paginatedOrders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell>#{order.id}</TableCell>
                                        <TableCell className="font-medium"><p>{order.created_by}</p><p className="text-xs text-muted-foreground">{order.name_on_certificate}</p></TableCell>
                                        <TableCell>{order.course_code}</TableCell>
                                        <TableCell><div className="flex flex-wrap gap-2 items-center">{order.course_code.split(',').map(code => <CertificateStatusCell key={code.trim()} order={order} studentDataMap={studentDataMap} />)}</div></TableCell>
                                        <TableCell><ConvocationStatusCell studentNumber={order.created_by} /></TableCell>
                                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell><OrderActionsCell order={order} onUpdateClick={() => openUpdateDialog(order)} studentData={studentDataMap.get(order.created_by)?.studentData} balanceData={studentDataMap.get(order.created_by)?.balanceData} isLoading={isLoadingStudentData && !studentDataMap.has(order.created_by)} /></TableCell>
                                        <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => setSelectedOrderDetails(order)}>View</Button></TableCell>
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
                                    <div className="flex items-center justify-between"><p className="text-muted-foreground font-medium">Status</p><Badge variant="secondary">{order.certificate_status}</Badge></div>
                                    <div className="flex items-start justify-between"><p className="text-muted-foreground font-medium shrink-0 pr-2">Convocation</p><ConvocationStatusCell studentNumber={order.created_by} /></div>
                                    <div className="flex flex-col items-start justify-between"><p className="text-muted-foreground font-medium mb-1">Course(s)</p><div className="flex flex-wrap gap-1">{order.course_code.split(',').map(code => <Badge key={code.trim()} variant="outline">{code.trim()}</Badge>)}</div></div>
                                    <div className="flex items-start justify-between"><p className="text-muted-foreground font-medium shrink-0 pr-2">Certificates</p><div className="text-right flex flex-wrap gap-1 justify-end">{order.course_code.split(',').map(code => <CertificateStatusCell key={code.trim()} order={order} studentDataMap={studentDataMap} />)}</div></div>
                                    <div className="flex items-start justify-between"><p className="text-muted-foreground font-medium shrink-0 pr-2">Eligibility</p><div className="text-right"><OrderActionsCell order={order} onUpdateClick={() => openUpdateDialog(order)} studentData={studentDataMap.get(order.created_by)?.studentData} balanceData={studentDataMap.get(order.created_by)?.balanceData} isLoading={isLoadingStudentData && !studentDataMap.has(order.created_by)} /></div></div>
                                    <div className="flex items-center justify-end pt-2 border-t mt-2"><Button variant="outline" size="sm" onClick={() => setSelectedOrderDetails(order)}>View Details</Button></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {(isLoadingStudentData && paginatedOrders.length > 0) && <div className="text-center py-4 text-sm text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Loading student data...</div>}
                    {paginatedOrders.length === 0 && <div className="text-center py-10"><p className="text-muted-foreground">No orders found.</p></div>}
                </CardContent>
                {totalPages > 1 && <CardFooter className="flex items-center justify-center space-x-2 pt-6"><Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Previous</Button><span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span><Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</Button></CardFooter>}
            </Card>
        </div>
    );
}
