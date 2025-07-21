
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCertificateOrders, getStudentFullInfo, updateCertificateOrderCourses, getUserCertificatePrintStatus, generateCertificate, getStudentBalance } from '@/lib/api';
import type { CertificateOrder, FullStudentData, UpdateCertificateOrderCoursesPayload, UserCertificatePrintStatus, GenerateCertificatePayload, StudentBalanceData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Loader2, XCircle, Search, Wallet, FileDown, Phone } from 'lucide-react';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';


const ITEMS_PER_PAGE = 25;

// --- Certificate Status Component ---
const CertificateStatusCell = ({ order, studentNumber, orderCourseCodes }: { order: CertificateOrder, studentNumber: string, orderCourseCodes: string }) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const { data: certificates, isLoading: isLoadingCerts, isError: isErrorCerts } = useQuery<UserCertificatePrintStatus[], Error>({
        queryKey: ['userCertificateStatus', studentNumber],
        queryFn: () => getUserCertificatePrintStatus(studentNumber),
        staleTime: 5 * 60 * 1000,
        enabled: !!studentNumber,
    });

    const { data: fullStudentData, isLoading: isLoadingInfo, isError: isErrorInfo } = useQuery<FullStudentData, Error>({
        queryKey: ['studentFullInfoForCertGen', studentNumber],
        queryFn: () => getStudentFullInfo(studentNumber),
        staleTime: 5 * 60 * 1000,
        enabled: !!studentNumber,
    });

    const { mutate: generateCert, isPending: isGenerating, variables: generatingVariables } = useMutation({
        mutationFn: (payload: GenerateCertificatePayload) => generateCertificate(payload),
        onSuccess: () => {
            toast({
                title: "Certificate Generated",
                description: "The certificate record has been created successfully.",
            });
            // Refetch the status to update the UI
            queryClient.invalidateQueries({ queryKey: ['userCertificateStatus', studentNumber] });
        },
        onError: (error: Error) => {
            toast({
                variant: 'destructive',
                title: 'Generation Failed',
                description: error.message,
            });
        }
    });

    const isLoading = isLoadingCerts || isLoadingInfo;
    const isError = isErrorCerts || isErrorInfo;

    if (isLoading) {
        return <Skeleton className="h-6 w-24" />;
    }

    if (isError) {
        return <Badge variant="destructive">Error</Badge>;
    }

    const orderCourseIds = orderCourseCodes.split(',').map(id => id.trim()).filter(Boolean);

    // A certificate is "generated" if a record exists for it, regardless of print_status.
    const generatedCertificates = certificates?.filter(
        cert => cert.type === 'Certificate' && orderCourseIds.includes(cert.parent_course_id)
    ) || [];

    const generatedCourseIds = generatedCertificates.map(c => c.parent_course_id);
    const ungeneratedCourseIds = orderCourseIds.filter(id => !generatedCourseIds.includes(id));


    return (
        <div className="flex flex-wrap gap-2 items-center">
            {generatedCertificates.map(cert => (
                <TooltipProvider key={cert.id}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Badge variant={cert.print_status === '1' ? 'default' : 'secondary'}>
                                {cert.parent_course_id}: {cert.certificate_id}
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Course ID: {cert.parent_course_id}</p>
                            <p>{cert.type}: {cert.certificate_id}</p>
                            <p>Status: {cert.print_status === '1' ? 'Printed' : 'Generated'}</p>
                            <p>Date: {new Date(cert.print_date).toLocaleDateString()}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ))}
            
            {fullStudentData && ungeneratedCourseIds.map(courseId => {
                const enrollment = Object.values(fullStudentData.studentEnrollments).find(e => e.parent_course_id === courseId);
                if (!enrollment) return null;

                const isGeneratingThisOne = isGenerating && generatingVariables?.parentCourseCode === parseInt(courseId, 10);

                const handleGenerateClick = () => {
                     if (!user || !user.username) {
                        toast({ variant: 'destructive', title: 'Error', description: 'Could not identify admin user.' });
                        return;
                    }
                    const payload: GenerateCertificatePayload = {
                        student_number: studentNumber,
                        print_status: "Printed",
                        print_by: user.username,
                        type: "Certificate",
                        parentCourseCode: parseInt(courseId, 10),
                        referenceId: parseInt(order.id, 10),
                        course_code: enrollment.course_code,
                        source: "courier"
                    };
                    generateCert(payload);
                };

                return (
                    <Button key={courseId} size="sm" variant="outline" onClick={handleGenerateClick} disabled={isGeneratingThisOne}>
                        {isGeneratingThisOne && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generate ({enrollment.course_code})
                    </Button>
                )
            })}

            {generatedCertificates.length === 0 && ungeneratedCourseIds.length === 0 && (
                 <Badge variant="secondary">None</Badge>
            )}
        </div>
    );
};



// --- Action Component ---
const OrderActionsCell = ({ order, onEligibilityStatusChange }: { order: CertificateOrder, onEligibilityStatusChange: (orderId: string, isUpdatable: boolean) => void }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogContent, setDialogContent] = useState<{ title: string, description: React.ReactNode, onConfirm?: () => void }>({});
    const queryClient = useQueryClient();

    const { data: fullStudentData, isLoading, isError } = useQuery<FullStudentData, Error>({
        queryKey: ['studentFullInfoForEligibility', order.created_by],
        queryFn: () => getStudentFullInfo(order.created_by),
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
    
     const { data: studentBalance } = useQuery<StudentBalanceData>({
        queryKey: ['studentBalance', order.created_by],
        queryFn: () => getStudentBalance(order.created_by),
        enabled: !!order.created_by,
        staleTime: 5 * 60 * 1000,
    });

    const { newEligibleEnrollments, isUpdateAvailable } = useMemo(() => {
        if (!fullStudentData) {
            return { newEligibleEnrollments: [], isUpdateAvailable: false };
        }
        
        const currentCourses = order.course_code.split(',').map(s => s.trim()).filter(Boolean);
        
        const allEligibleEnrollments = Object.values(fullStudentData.studentEnrollments)
            .filter(e => e.certificate_eligibility);

        const newEnrollments = allEligibleEnrollments.filter(enrollment => 
            !currentCourses.includes(enrollment.parent_course_id)
        );
        
        return { newEligibleEnrollments: newEnrollments, isUpdateAvailable: newEnrollments.length > 0 };
    }, [fullStudentData, order.course_code]);

    useEffect(() => {
        if (!isLoading) {
            onEligibilityStatusChange(order.id, isUpdateAvailable);
        }
    }, [isLoading, isUpdateAvailable, order.id, onEligibilityStatusChange]);


    const { mutate: updateCourses, isPending: isUpdating } = useMutation({
        mutationFn: (payload: UpdateCertificateOrderCoursesPayload) => updateCertificateOrderCourses(payload),
        onSuccess: (data) => {
            toast({
                title: "Update Successful",
                description: "The certificate order has been updated.",
            });
            queryClient.invalidateQueries({ queryKey: ['allCertificateOrders'] });
            setIsDialogOpen(false);
        },
        onError: (error: Error) => {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: error.message,
            });
        }
    });

    const openUpdateDialog = () => {
        if (!newEligibleEnrollments.length) return;

        const currentCourses = order.course_code.split(',').map(s => s.trim()).filter(Boolean);
        
        const onConfirm = () => {
            const newEligibleCourseIds = newEligibleEnrollments.map(e => e.parent_course_id);
            const allCourseIds = [...currentCourses, ...newEligibleCourseIds];

            updateCourses({
                orderId: order.id,
                courseCodes: allCourseIds.join(','),
            });
        };

        setDialogContent({
            title: "Update Certificate Order",
            description: (
                <div className="text-sm">
                    <p className="mb-3">This student is eligible for the following additional course(s). Do you want to add them to this certificate order?</p>
                    <div className="space-y-4 rounded-md border bg-muted/50 p-3 max-h-60 overflow-y-auto">
                        {newEligibleEnrollments.map(enrollment => (
                            <div key={enrollment.parent_course_id}>
                                <h4 className="font-semibold text-card-foreground">{enrollment.parent_course_name}</h4>
                                <ul className="mt-1 list-disc list-inside text-xs text-muted-foreground space-y-1 pl-2">
                                    {enrollment.criteria_details.map(c => (
                                        <li key={c.id} className="flex items-center justify-between">
                                            <span>{c.list_name}</span>
                                            {c.evaluation.completed ? (
                                                 <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Complete</span>
                                            ) : (
                                                 <span className="text-red-600 font-medium flex items-center gap-1"><XCircle className="h-3.5 w-3.5" /> Incomplete</span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            ),
            onConfirm
        });
        setIsDialogOpen(true);
    };

    if (isLoading) {
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
    
    const balance = studentBalance?.studentBalance;

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex-shrink-0">
                {isUpdateAvailable ? (
                     <>
                        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
                                    <AlertDialogDescription asChild>
                                        {dialogContent.description || <div />}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={dialogContent.onConfirm} disabled={isUpdating}>
                                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Update Order
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <Button variant="default" size="sm" onClick={openUpdateDialog}>
                            Update Available
                        </Button>
                    </>
                ) : (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200">Up to date</Badge>
                )}
            </div>

            {balance !== undefined && (
                <div className={cn("flex items-center gap-1.5 text-xs font-medium p-1.5 rounded-md", balance > 0 ? 'bg-destructive/10 text-destructive' : 'bg-green-100 text-green-800')}>
                    <Wallet className="h-3.5 w-3.5" />
                    <span>LKR {balance.toLocaleString()}</span>
                </div>
            )}
        </div>
    );
};


export default function CertificateOrdersListPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [updatableOrders, setUpdatableOrders] = useState<Record<string, boolean>>({});
    const [isExporting, setIsExporting] = useState(false);

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

    const updatableCount = useMemo(() => {
        return Object.values(updatableOrders).filter(Boolean).length;
    }, [updatableOrders]);

    const handleEligibilityStatusChange = (orderId: string, isUpdatable: boolean) => {
        setUpdatableOrders(prev => ({ ...prev, [orderId]: isUpdatable }));
    };

    useEffect(() => {
        setCurrentPage(1);
        setUpdatableOrders({});
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const paginatedOrders = useMemo(() => {
        return filteredOrders.slice(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE
        );
    }, [filteredOrders, currentPage]);
    
    const handleExport = async () => {
        if (!orders) return;
        
        setIsExporting(true);
        toast({ title: 'Exporting...', description: 'Fetching student balances. This may take a moment.' });
        
        try {
            const studentNumbers = [...new Set(filteredOrders.map(order => order.created_by))];
            const balancePromises = studentNumbers.map(sn => getStudentBalance(sn).catch(() => null));
            const balanceResults = await Promise.all(balancePromises);
            
            const balanceMap = new Map<string, number>();
            balanceResults.forEach((res, index) => {
                if (res) {
                    balanceMap.set(studentNumbers[index], res.studentBalance);
                }
            });

            const csvRows = [
                ['Order ID', 'Student Number', 'Name on Certificate', 'Course Code(s)', 'Mobile', 'Order Date', 'Status', 'Due Balance (LKR)'].join(',')
            ];

            filteredOrders.forEach(order => {
                const balance = balanceMap.get(order.created_by) ?? 0;
                const row = [
                    order.id,
                    order.created_by,
                    `"${order.name_on_certificate.replace(/"/g, '""')}"`,
                    order.course_code,
                    order.mobile,
                    order.created_at,
                    order.certificate_status,
                    balance.toString()
                ];
                csvRows.push(row.join(','));
            });

            const csvString = csvRows.join('\n');
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'certificate_orders_with_balance.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            toast({ title: 'Export Successful', description: 'Your CSV file has been downloaded.' });

        } catch (err) {
            toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not generate the export file.' });
        } finally {
            setIsExporting(false);
        }
    };


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
                                {filteredOrders.length} orders found. {updatableCount > 0 && `(${updatableCount} need updates)`}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                             <div className="relative w-full sm:w-auto sm:max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search student or name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Button onClick={handleExport} disabled={isExporting}>
                                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                                Export
                            </Button>
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
                                    <TableHead>Mobile</TableHead>
                                    <TableHead>Course(s)</TableHead>
                                    <TableHead>Generated Certs</TableHead>
                                    <TableHead>Order Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedOrders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">{order.created_by}</TableCell>
                                        <TableCell>{order.name_on_certificate}</TableCell>
                                        <TableCell>{order.mobile}</TableCell>
                                        <TableCell>{order.course_code}</TableCell>
                                        <TableCell>
                                            <CertificateStatusCell order={order} studentNumber={order.created_by} orderCourseCodes={order.course_code} />
                                        </TableCell>
                                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell><Badge variant="secondary">{order.certificate_status}</Badge></TableCell>
                                        <TableCell>
                                            <OrderActionsCell order={order} onEligibilityStatusChange={handleEligibilityStatusChange} />
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
                                        <p className="text-muted-foreground font-medium">Mobile</p>
                                        <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5"/>{order.mobile}</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-muted-foreground font-medium">Course(s)</p>
                                        <p>{order.course_code}</p>
                                    </div>
                                    <div className="flex items-start justify-between">
                                        <p className="text-muted-foreground font-medium shrink-0 pr-2">Generated Certs</p>
                                        <div className="text-right">
                                            <CertificateStatusCell order={order} studentNumber={order.created_by} orderCourseCodes={order.course_code} />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t mt-2">
                                        <p className="text-muted-foreground font-medium">Actions</p>
                                        <OrderActionsCell order={order} onEligibilityStatusChange={handleEligibilityStatusChange} />
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
