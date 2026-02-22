
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    updateConvocationBooking, 
    updateConvocationPackage,
    updateConvocationPayment,
    updateCeremonyNumber,
    getConvocationSessionCounts, 
    getConvocationRegistrationsByStudent,
    getCertificateOrdersByStudent,
    getTcPayments,
    deleteConvocationPayment
} from '@/lib/actions/certificates';
import { getStudentFullInfo } from '@/lib/actions/users';
import type { 
    ConvocationRegistration, 
    ConvocationPackage, 
    FullStudentData, 
    SessionCount,
    CertificateOrder,
    StudentEnrollment,
    TcPaymentRecord,
    UserFullDetails,
    StudentBalanceData
} from '@/lib/types';
import Image from 'next/image';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Loader2, Save, Edit2, X, ChevronDown, CheckCircle, XCircle, Banknote, UserCheck, ListOrdered, Calculator, FileText, Paperclip, Hourglass, AlertTriangle, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EnrollmentDetailAccordion } from './EnrollmentDetailAccordion';
import { ViewSlipDialog } from './ViewSlipDialog';

const PARENT_SEAT_RATE = 750;

function TempUserInfo({ user }: { user: any }) {
    return (
        <div className="space-y-2 text-muted-foreground text-sm">
            <p className="flex items-center gap-2"><UserCheck className="h-4 w-4 text-primary shrink-0" /><strong className="text-card-foreground">{user.full_name}</strong></p>
            <p className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary shrink-0" /><span className="truncate">{user.email_address}</span></p>
            {user.phone_number && (
                <div className="flex items-center gap-2">
                    <span className="font-medium text-card-foreground">{user.phone_number}</span>
                </div>
            )}
        </div>
    )
}

function RegisteredStudentInfo({ user, studentNumber }: { user: UserFullDetails, studentNumber: string }) {
    const { data: balanceData, isLoading: isLoadingBalance } = useQuery<StudentBalanceData>({
        queryKey: ['studentBalance', studentNumber],
        queryFn: () => getStudentFullInfo(studentNumber),
        enabled: !!studentNumber,
    });

    return (
        <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Student Details</TabsTrigger>
                <TabsTrigger value="payment">Payment History</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="pt-4 space-y-2 text-muted-foreground text-sm">
                <p className="flex items-center gap-2"><UserCheck className="h-4 w-4 text-primary shrink-0" /><strong className="text-card-foreground">{user.full_name}</strong></p>
                <p className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary shrink-0" /><span className="truncate">{user.e_mail}</span></p>
                <div className="flex items-center gap-2">
                    <span className="font-medium text-card-foreground">{user.telephone_1}</span>
                </div>
            </TabsContent>
             <TabsContent value="payment">
                {isLoadingBalance ? <Skeleton className="h-40"/> : balanceData && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <Card><CardHeader className="p-2"><CardTitle className="text-xs">Total Paid</CardTitle></CardHeader><CardContent className="p-2 pt-0"><p className="text-sm font-bold">LKR {balanceData.totalPaymentAmount.toLocaleString()}</p></CardContent></Card>
                            <Card><CardHeader className="p-2"><CardTitle className="text-xs">Outstanding</CardTitle></CardHeader><CardContent className="p-2 pt-0"><p className="text-sm font-bold text-destructive">LKR {balanceData.studentBalance.toLocaleString()}</p></CardContent></Card>
                        </div>
                    </div>
                )}
            </TabsContent>
        </Tabs>
    );
};

function DuplicateSlipCheck({ hashValue, currentRegistrationId }: { hashValue: string, currentRegistrationId: string }) {
    const [isInfoOpen, setIsInfoOpen] = useState(false);

    const { data: duplicateRecords, isLoading, isError } = useQuery<any[]>({
        queryKey: ['duplicateCheck', hashValue],
        queryFn: async () => {
            if (!hashValue) return [];
            const response = await fetch(`https://qa-api.pharmacollege.lk/payment-portal-requests/check-hash?hashValue=${hashValue}`);
            if (response.status === 404) return [];
            if (!response.ok) throw new Error('Failed check');
            return response.json();
        },
        enabled: !!hashValue,
    });

    if (isLoading) return <div className="text-[10px] text-muted-foreground animate-pulse flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin"/> Verifying...</div>;
    
    if (isError || !hashValue) return null;

    // Filter out the record we are currently viewing
    const otherRecords = duplicateRecords?.filter(r => 
        (r.registration_id && String(r.registration_id) !== String(currentRegistrationId)) || 
        (r.id && String(r.id) !== String(currentRegistrationId))
    ) || [];

    const isDuplicate = otherRecords.length > 0;

    if (isDuplicate) {
        return (
            <div className="mt-1">
                <div className="flex items-center gap-2 text-destructive font-bold text-[10px] bg-destructive/10 p-1 px-2 rounded w-fit border border-destructive/20">
                    <AlertTriangle className="h-3 w-3" />
                    DUPLICATE DETECTED
                    <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
                        <DialogTrigger asChild>
                            <Button variant="link" size="sm" className="h-auto p-0 text-[10px] text-destructive underline ml-1 font-bold">
                                View Records
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Conflicting Records</DialogTitle>
                                <DialogDescription>
                                    The following records were found sharing the same payment slip hash.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4 border rounded-md overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-xs">Student ID</TableHead>
                                            <TableHead className="text-xs">Ref #</TableHead>
                                            <TableHead className="text-xs">Amount</TableHead>
                                            <TableHead className="text-xs">Status</TableHead>
                                            <TableHead className="text-xs">Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {duplicateRecords?.map((record, idx) => (
                                            <TableRow key={idx} className={cn(String(record.registration_id || record.id) === String(currentRegistrationId) && "bg-muted/50 font-bold")}>
                                                <TableCell className="text-xs">{record.unique_number || record.student_number}</TableCell>
                                                <TableCell className="text-xs">{record.reference_number || record.payment_reference || record.id}</TableCell>
                                                <TableCell className="text-xs">LKR {record.payment_amount || record.paid_amount}</TableCell>
                                                <TableCell className="text-xs">
                                                    <Badge variant="outline" className="text-[10px] uppercase h-4">{record.payment_status || record.registration_status}</Badge>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {record.registered_at ? format(new Date(record.registered_at), 'yyyy-MM-dd') : 
                                                     record.paid_date ? format(new Date(record.paid_date), 'yyyy-MM-dd') : 'N/A'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="secondary">Close</Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-1 flex items-center gap-1 text-green-600 font-bold text-[10px] bg-green-50 p-1 px-2 rounded w-fit border border-green-200">
            <CheckCircle className="h-3 w-3" />
            NO DUPLICATES
        </div>
    );
}

export const RegistrationDetailDialog = ({ registration, open, onOpenChange, packages }: { 
    registration: ConvocationRegistration | null, 
    open: boolean, 
    onOpenChange: (open: boolean) => void,
    packages?: ConvocationPackage[]
}) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isConfirmAttendanceDialogOpen, setIsConfirmAttendanceDialogOpen] = useState(false);
    const [isPackageConfirmOpen, setIsPackageConfirmOpen] = useState(false);

    const [editPackageId, setEditPackageId] = useState('');
    const [pendingPackageId, setPendingPackageId] = useState('');
    const [editSession, setEditSession] = useState<'1' | '2'>('1');
    const [editSeats, setEditSeats] = useState('0');
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editCourseIds, setEditCourseIds] = useState<string[]>([]);

    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [ceremonyNumber, setCeremonyNumber] = useState('');

    const { data: studentInfo, isLoading: isLoadingStudentData } = useQuery<FullStudentData>({
        queryKey: ['studentFullInfoForConvocationDetail', registration?.student_number],
        queryFn: () => getStudentFullInfo(registration!.student_number),
        enabled: !!registration?.student_number,
    });

    const { data: allTcPayments, isLoading: isLoadingTcPayments } = useQuery<TcPaymentRecord[]>({
        queryKey: ['tcPayments', registration?.student_number],
        queryFn: () => getTcPayments(registration!.student_number),
        enabled: !!registration?.student_number,
    });

    const tcPayments = useMemo(() => {
        if (!allTcPayments || !registration) return [];
        const referKey = `covocation-payment-${registration.convocation_id}`;
        return allTcPayments.filter(p => p.reference_key === referKey);
    }, [allTcPayments, registration]);

    const { data: portalPayments, isLoading: isLoadingPortalSlips } = useQuery<any[]>({
        queryKey: ['paymentRequests', registration?.student_number],
        queryFn: () => {
            if (!registration?.student_number) return Promise.resolve([]);
            return fetch(`https://qa-api.pharmacollege.lk/payment-portal-requests/by-reference/${registration.student_number}`).then(res => res.status === 404 ? [] : res.json());
        },
        enabled: !!registration?.student_number,
    });

    const { data: otherBookings } = useQuery<ConvocationRegistration[]>({
        queryKey: ['convocationRegistrationsByStudent', registration?.student_number],
        queryFn: () => getConvocationRegistrationsByStudent(registration!.student_number),
        enabled: !!registration?.student_number,
    });

    const { data: certOrders } = useQuery<CertificateOrder[]>({
        queryKey: ['certificateOrdersByStudent', registration?.student_number],
        queryFn: () => getCertificateOrdersByStudent(registration!.student_number),
        enabled: !!registration?.student_number,
    });

    const { data: sessionCounts } = useQuery<SessionCount[]>({
        queryKey: ['convocationSessionCounts', registration?.convocation_id],
        queryFn: () => getConvocationSessionCounts(registration!.convocation_id),
        enabled: !!registration?.convocation_id,
    });

    const balanceSlips = useMemo(() => {
        if (!portalPayments || !registration) return [];
        const reasonKey = `convocation2nd-${registration.convocation_id}`;
        return portalPayments.filter(p => p.payment_reson === reasonKey);
    }, [portalPayments, registration]);

    const refreshAllData = () => {
        queryClient.invalidateQueries({ queryKey: ['convocationRegistrations'] });
        if (registration?.student_number) {
            queryClient.invalidateQueries({ queryKey: ['studentFullInfoForConvocationDetail', registration.student_number] });
            queryClient.invalidateQueries({ queryKey: ['tcPayments', registration.student_number] });
            queryClient.invalidateQueries({ queryKey: ['paymentRequests', registration.student_number] });
        }
    };

    const updateMutation = useMutation({
        mutationFn: async (payload: any) => {
            return updateConvocationBooking(registration!.registration_id, payload);
        },
        onSuccess: () => {
            toast({ title: 'Success', description: 'Booking updated successfully.' });
            refreshAllData();
            setIsEditing(false);
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Update Failed', description: err.message })
    });

    const updatePaymentMutation = useMutation({
        mutationFn: (payload: { payment_status: string; payment_amount: number; created_by: string }) => 
            updateConvocationPayment(registration!.registration_id, payload),
        onSuccess: () => {
            toast({ title: 'Success', description: 'Payment details verified and updated.' });
            refreshAllData();
            setIsPaymentDialogOpen(false);
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        },
    });

    const packageUpdateMutation = useMutation({
        mutationFn: (newPackageId: string) => updateConvocationPackage(registration!.registration_id, newPackageId),
        onSuccess: () => {
            toast({ title: 'Package Updated', description: 'The convocation package has been updated.' });
            refreshAllData();
            setIsPackageConfirmOpen(false);
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Update Failed', description: err.message })
    });

    const updateCeremonyMutation = useMutation({
        mutationFn: (ceremonyNum: string) => updateCeremonyNumber(registration!.registration_id, ceremonyNum),
        onSuccess: () => {
            toast({ title: 'Attendance Confirmed', description: 'Ceremony number assigned successfully.' });
            refreshAllData();
            setIsConfirmAttendanceDialogOpen(false);
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Confirmation Failed', description: error.message });
        },
    });

    const deletePaymentMutation = useMutation({
        mutationFn: (paymentId: string) => deleteConvocationPayment(registration!.registration_id, paymentId),
        onSuccess: () => {
            toast({ title: 'Payment Deleted', description: 'The verified payment record has been removed.' });
            refreshAllData();
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Deletion Failed', description: err.message })
    });

    const totalPaidFromRecords = useMemo(() => {
        if (!tcPayments) return 0;
        return tcPayments.reduce((acc, rec) => acc + (parseFloat(rec.payment_amount) || 0), 0);
    }, [tcPayments]);

    const totalPayable = useMemo(() => {
        const pkg = packages?.find(p => p.package_id === editPackageId);
        const packagePrice = pkg ? parseFloat(pkg.price) : 0;
        const numSeats = parseInt(editSeats, 10) || 0;
        return packagePrice + (numSeats * PARENT_SEAT_RATE);
    }, [editPackageId, editSeats, packages]);

    const bookedElsewhereIds = useMemo(() => {
        if (!otherBookings || !registration) return new Set<string>();
        const ids = new Set<string>();
        otherBookings
            .filter(b => b.registration_id !== registration.registration_id && b.registration_status !== 'Rejected' && b.registration_status !== 'Canceled')
            .forEach(b => b.course_id.split(',').forEach(id => ids.add(id.trim())));
        return ids;
    }, [otherBookings, registration]);

    const orderedElsewhereIds = useMemo(() => {
        if (!certOrders) return new Set<string>();
        const ids = new Set<string>();
        certOrders
            .filter(o => o.certificate_status !== 'Delivered')
            .forEach(o => o.course_code.split(',').forEach(id => ids.add(id.trim())));
        return ids;
    }, [certOrders]);

    const courseGrouping = useMemo(() => {
        if (!studentInfo || !registration) return { included: [], others: [] };
        
        const allEnrollments = Object.values(studentInfo.studentEnrollments);
        const currentBookingIds = registration.course_id.split(',').map(s => s.trim()).filter(Boolean);
        
        const included: StudentEnrollment[] = [];
        const others: StudentEnrollment[] = [];

        allEnrollments.forEach(enrollment => {
            if (currentBookingIds.includes(enrollment.parent_course_id)) {
                included.push(enrollment);
            } else {
                others.push(enrollment);
            }
        });

        return { included, others };
    }, [studentInfo, registration]);

    useEffect(() => {
        if (registration) {
            setEditPackageId(registration.package_id || '');
            setEditSession(registration.session as '1' | '2' || '1');
            setEditSeats(registration.additional_seats || '0');
            setEditName(registration.name_on_certificate || '');
            setEditPhone(registration.telephone_1 || '');
            setEditCourseIds(registration.course_id.split(',').map(s => s.trim()).filter(Boolean));
            setPaymentStatus(registration.payment_status || 'Pending');
            setCeremonyNumber(registration.ceremony_number || '');
            setIsEditing(false);
        }
    }, [registration]);

    useEffect(() => {
        if (studentInfo && !editName && !registration?.name_on_certificate) {
            setEditName(studentInfo.studentInfo.name_on_certificate || studentInfo.studentInfo.full_name);
        }
        if (studentInfo && !editPhone && !registration?.telephone_1) {
            setEditPhone(studentInfo.studentInfo.telephone_1);
        }
    }, [studentInfo, registration, editName, editPhone]);

    const handleVerifiedAmountChange = (val: string) => {
        setPaymentAmount(val);
        const verifiedInput = parseFloat(val) || 0;
        const totalVerifiedSoFar = totalPaidFromRecords + verifiedInput;

        if (totalVerifiedSoFar >= totalPayable && totalPayable > 0) {
            setPaymentStatus('Paid');
        } else if (totalVerifiedSoFar > 0 && totalVerifiedSoFar < totalPayable) {
            setPaymentStatus('Partially Paid');
        } else if (totalVerifiedSoFar === 0) {
            setPaymentStatus('Pending');
        }
    };

    const handleUpdate = async () => {
        if (!registration) return;
        
        const fullPayload = {
            ...registration,
            package_id: editPackageId,
            session: editSession,
            additional_seats: editSeats,
            name_on_certificate: editName,
            telephone_1: editPhone,
            course_id: editCourseIds.join(','),
            updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        };

        updateMutation.mutate(fullPayload);
    };

    const handlePaymentUpdate = () => {
        if (!paymentAmount) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter the verified payment amount.' });
            return;
        }

        let statusToSubmit = paymentStatus;
        if (paymentStatus === 'Partially Paid' || paymentStatus.toLowerCase() === 'partially-paid') {
            statusToSubmit = 'partially-paid';
        } else {
            statusToSubmit = paymentStatus.toLowerCase();
        }

        updatePaymentMutation.mutate({
            payment_status: statusToSubmit,
            payment_amount: totalPaidFromRecords + parseFloat(paymentAmount),
            created_by: user?.username || 'admin',
        });
    };

    const handleAttendanceConfirmation = () => {
        if (!ceremonyNumber) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a ceremony number.' });
            return;
        }
        updateCeremonyMutation.mutate(ceremonyNumber);
    };

    const handleDeletePayment = (paymentId: string) => {
        if (confirm('Are you sure you want to delete this payment record? This will affect the student balance.')) {
            deletePaymentMutation.mutate(paymentId);
        }
    };

    if (!open || !registration) return null;

    const seatsAvailable = (() => {
        if (!registration.convocation_id || !sessionCounts) return { s1: 0, s2: 0 };
        const s1 = parseInt(sessionCounts.find(s => s.session === '1')?.sessionCounts || '0', 10);
        const s2 = parseInt(sessionCounts.find(s => s.session === '2')?.sessionCounts || '0', 10);
        return { s1, s2 };
    })();

    const currentPackage = packages?.find(p => p.package_id === registration.package_id);
    const remainingToVerify = totalPayable - totalPaidFromRecords;
    const balanceAfterCurrentCheck = remainingToVerify - (parseFloat(paymentAmount) || 0);

    const EnrollmentItem = ({ enrollment, isIncluded }: { enrollment: StudentEnrollment, isIncluded: boolean }) => {
        const isEligible = enrollment.certificate_eligibility;
        const isBookedElsewhere = bookedElsewhereIds.has(enrollment.parent_course_id);
        const isOrderedElsewhere = orderedElsewhereIds.has(enrollment.parent_course_id);
        const isDisabled = isBookedElsewhere || isOrderedElsewhere;

        return (
            <Collapsible className={cn(
                "border rounded-md p-3 transition-colors",
                isIncluded && "bg-primary/5 border-primary/20",
                isDisabled && !isIncluded && "opacity-60 bg-muted/50"
            )}>
                <div className="flex items-start gap-3">
                    {isEditing || !isIncluded ? (
                        <Checkbox 
                            id={`edit-course-${enrollment.id}`} 
                            checked={isIncluded || editCourseIds.includes(enrollment.parent_course_id)}
                            disabled={isDisabled}
                            onCheckedChange={(checked) => {
                                setEditCourseIds(prev => checked ? [...prev, enrollment.parent_course_id] : prev.filter(id => id !== enrollment.parent_course_id))
                            }}
                            className="mt-1"
                        />
                    ) : (
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                    )}
                    <div className="flex-1 space-y-1">
                        <Label htmlFor={`edit-course-${enrollment.id}`} className="text-xs font-bold leading-tight block cursor-pointer">
                            {enrollment.parent_course_name}
                        </Label>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {isIncluded && <Badge variant="default" className="text-[9px] h-4 px-1 bg-green-100 text-green-700 border-green-200">Included</Badge>}
                            {isBookedElsewhere && <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-purple-100 text-purple-800">Booked Elsewhere</Badge>}
                            {isOrderedElsewhere && <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-amber-100 text-amber-800 border-amber-200">Already Ordered</Badge>}
                            {!isEligible && <Badge variant="destructive" className="text-[9px] h-4 px-1">Not Eligible</Badge>}
                        </div>
                    </div>
                    {!isEligible && (
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="xs" className="h-6 w-6 p-0"><ChevronDown className="h-3 w-3" /></Button>
                        </CollapsibleTrigger>
                    )}
                </div>
                <CollapsibleContent className="mt-2 pt-2 border-t text-[10px] space-y-1 text-muted-foreground">
                    <p className="font-bold text-foreground">Pending Requirements:</p>
                    {enrollment.criteria_details.filter(c => !c.evaluation.completed).map(c => (
                        <div key={c.id} className="flex justify-between">
                            <span>• {c.list_name}</span>
                            <span>{c.evaluation.currentValue} / {c.evaluation.requiredValue}</span>
                        </div>
                    ))}
                </CollapsibleContent>
            </Collapsible>
        );
    };

    return (
        <>
        <AlertDialog open={isPackageConfirmOpen} onOpenChange={setIsPackageConfirmOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Change Package?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to change the package to <strong>"{packages?.find(p => p.package_id === pendingPackageId)?.package_name}"</strong>? This will update the booking record immediately.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={() => {
                            packageUpdateMutation.mutate(pendingPackageId);
                            setEditPackageId(pendingPackageId);
                        }} 
                        disabled={packageUpdateMutation.isPending}
                    >
                        {packageUpdateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Change
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2 shrink-0 border-b">
                    <DialogTitle>Booking Details: #{registration.reference_number}</DialogTitle>
                    <DialogDescription>
                        Detailed overview and editing for student {registration.student_number}.
                    </DialogDescription>
                </DialogHeader>
                
                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-6">
                        {/* Booking Info Card */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-base uppercase tracking-wider text-muted-foreground">Booking Information</CardTitle>
                                {!isEditing ? (
                                    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                                        <Edit2 className="h-4 w-4 mr-2" /> Edit Info
                                    </Button>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                                            <X className="h-4 w-4 mr-2" /> Cancel
                                        </Button>
                                        <Button size="sm" onClick={handleUpdate} disabled={updateMutation.isPending}>
                                            {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                            Save Changes
                                        </Button>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {isEditing ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in-50">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Package</Label>
                                            <Select 
                                                value={editPackageId} 
                                                onValueChange={(val) => {
                                                    setPendingPackageId(val);
                                                    setIsPackageConfirmOpen(true);
                                                }}
                                            >
                                                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {packages?.filter(p => p.convocation_id === registration.convocation_id).map(p => (
                                                        <SelectItem key={p.package_id} value={p.package_id} className="text-xs">{p.package_name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Session (S1: {seatsAvailable.s1} reg | S2: {seatsAvailable.s2} reg)</Label>
                                            <Select value={editSession} onValueChange={(v) => setEditSession(v as '1' | '2')}>
                                                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent><SelectItem value="1">Session 1</SelectItem><SelectItem value="2">Session 2</SelectItem></SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Additional Seats</Label>
                                            <Select value={editSeats} onValueChange={setEditSeats}>
                                                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent>{[0,1,2,3,4,5].map(i => <SelectItem key={i} value={String(i)}>{i}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5 md:col-span-1 lg:col-span-1">
                                            <Label className="text-xs">Name on Certificate</Label>
                                            <input 
                                                value={editName} 
                                                onChange={e => setEditName(e.target.value)} 
                                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                placeholder={studentInfo?.studentInfo.name_on_certificate || "Enter name..."}
                                            />
                                        </div>
                                        <div className="space-y-1.5 md:col-span-1 lg:col-span-1">
                                            <Label className="text-xs">Phone Number</Label>
                                            <input 
                                                value={editPhone} 
                                                onChange={e => setEditPhone(e.target.value)} 
                                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                placeholder={studentInfo?.studentInfo.telephone_1 || "Enter phone..."}
                                            />
                                        </div>
                                        <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
                                            <Label className="text-xs">Total Payable (Auto-calc)</Label>
                                            <div className="h-9 flex items-center px-3 border rounded-md bg-muted/50 font-mono font-bold text-primary">
                                                LKR {totalPayable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in-50">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Selected Package</p>
                                            <p className="text-sm font-semibold">{currentPackage?.package_name || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Session & Seats</p>
                                            <div className="flex gap-2">
                                                <Badge variant="outline">Session {registration.session}</Badge>
                                                <Badge variant="outline">{registration.additional_seats} Guest Seats</Badge>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Certificate Details</p>
                                            <p className="text-sm font-semibold">{registration.name_on_certificate || studentInfo?.studentInfo.name_on_certificate || studentInfo?.studentInfo.full_name || 'N/A'}</p>
                                            <p className="text-xs text-muted-foreground">{registration.telephone_1 || studentInfo?.studentInfo.telephone_1 || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Calculated Payable</p>
                                            <p className="text-sm font-bold text-primary">LKR {totalPayable.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-6 pt-4 border-t">
                                    <div className="space-y-3">
                                        <Label className="text-xs font-semibold uppercase tracking-wider text-primary">Included in this Booking</Label>
                                        {isLoadingStudentData ? <Skeleton className="h-20 w-full" /> : studentInfo && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {courseGrouping.included.length > 0 ? (
                                                    courseGrouping.included.map(enrollment => (
                                                        <EnrollmentItem key={enrollment.id} enrollment={enrollment} isIncluded={true} />
                                                    ))
                                                ) : (
                                                    <p className="text-xs text-muted-foreground italic col-span-2">No courses are currently assigned to this booking.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3 pt-4 border-t">
                                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Other Enrollments (Available to Add)</Label>
                                        {isLoadingStudentData ? <Skeleton className="h-20 w-full" /> : studentInfo && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {courseGrouping.others.length > 0 ? (
                                                    courseGrouping.others.map(enrollment => (
                                                        <EnrollmentItem key={enrollment.id} enrollment={enrollment} isIncluded={false} />
                                                    ))
                                                ) : (
                                                    <p className="text-xs text-muted-foreground italic col-span-2">No other enrollments available.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Financials & Documents */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="text-base uppercase tracking-wider text-muted-foreground">Financial Overview</CardTitle>
                                    <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button size="sm" variant="outline"><Banknote className="mr-2 h-4 w-4" />Update Payment</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Update Payment Details</DialogTitle>
                                                <DialogDescription>Manually verify and set the cumulative payment status for this registration.</DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-muted-foreground">Total Required Amount:</span>
                                                        <div className="font-bold font-mono">
                                                            LKR {totalPayable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex justify-between items-center text-sm text-green-600 border-t pt-2 border-dashed">
                                                        <div className="flex items-center gap-2">
                                                            <ListOrdered className="h-3.5 w-3.5" />
                                                            <span>Already Verified:</span>
                                                        </div>
                                                        <div className="font-bold font-mono">
                                                            LKR {totalPaidFromRecords.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between items-center text-sm font-bold border-t pt-2 mt-2">
                                                        <span className="text-muted-foreground">Remaining to Verify:</span>
                                                        <div className="font-mono text-primary">
                                                            LKR {remainingToVerify.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-3 bg-primary/5 rounded-lg flex justify-between items-center text-sm border border-primary/20">
                                                    <div className="flex items-center gap-2 font-semibold">
                                                        <Calculator className="h-4 w-4" />
                                                        <span>Due Balance (Final):</span>
                                                    </div>
                                                    <div className={cn(
                                                        "font-bold font-mono text-lg",
                                                        balanceAfterCurrentCheck > 0 ? "text-destructive" : "text-green-600"
                                                    )}>
                                                        LKR {balanceAfterCurrentCheck.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </div>
                                                </div>

                                                <div className="space-y-2 pt-2">
                                                    <Label className="text-xs">Verified Amount in CURRENT Slip (LKR)</Label>
                                                    <input 
                                                        type="number" 
                                                        value={paymentAmount} 
                                                        onChange={e => handleVerifiedAmountChange(e.target.value)} 
                                                        placeholder="Type verified amount..."
                                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">New Payment Status</Label>
                                                    <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                                                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Pending" className="text-xs">Pending</SelectItem>
                                                            <SelectItem value="Partially Paid" className="text-xs">Partially Paid</SelectItem>
                                                            <SelectItem value="Paid" className="text-xs">Paid</SelectItem>
                                                            <SelectItem value="Rejected" className="text-xs">Rejected</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
                                                <Button onClick={handlePaymentUpdate} disabled={updatePaymentMutation.isPending}>
                                                    {updatePaymentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Update Financials
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        {isLoadingStudentData ? <Skeleton className="h-20 w-full" /> : studentInfo && (
                                            <>
                                                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Registration Fee:</span> <span className="font-semibold">LKR {studentInfo.studentBalance.TotalRegistrationFee.toLocaleString()}</span></div>
                                                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Verified Payments:</span> <span className="font-semibold text-green-600">LKR {studentInfo.studentBalance.totalPaymentAmount.toLocaleString()}</span></div>
                                                <div className="flex justify-between text-lg font-bold pt-2 border-t mt-2"><span className="text-muted-foreground">Student Balance:</span> <span className={cn(studentInfo.studentBalance.studentBalance > 0 ? 'text-destructive' : 'text-green-600')}>LKR {studentInfo.studentBalance.studentBalance.toLocaleString()}</span></div>
                                            </>
                                        )}
                                    </div>
                                    <div className="pt-4 border-t">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Booking Payment Verification</p>
                                            <Badge className={cn(
                                                "uppercase text-[10px]",
                                                registration.payment_status?.toLowerCase() === 'paid' ? 'bg-green-600' : 
                                                (registration.payment_status?.toLowerCase() === 'partially-paid' || registration.payment_status?.toLowerCase() === 'partially paid') ? 'bg-orange-500' : 
                                                'bg-destructive'
                                            )}>{registration.payment_status}</Badge>
                                        </div>
                                        <p className="text-sm font-bold">Total Verified: LKR {totalPaidFromRecords.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    
                                    <div className="pt-4 border-t space-y-3">
                                        <h4 className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-2">
                                            <ListOrdered className="h-3.5 w-3.5" /> Verified Transaction Trail
                                        </h4>
                                        {isLoadingTcPayments ? (
                                            <div className="space-y-2">
                                                <Skeleton className="h-8 w-full" />
                                                <Skeleton className="h-8 w-full" />
                                            </div>
                                        ) : tcPayments && tcPayments.length > 0 ? (
                                            <div className="border rounded-md overflow-hidden overflow-x-auto bg-muted/10">
                                                <Table>
                                                    <TableHeader className="bg-muted/50">
                                                        <TableRow className="h-8">
                                                            <TableHead className="text-[10px] h-8">Date</TableHead>
                                                            <TableHead className="text-[10px] h-8">Transaction ID</TableHead>
                                                            <TableHead className="text-[10px] h-8 text-right">Amount</TableHead>
                                                            <TableHead className="text-[10px] h-8 text-right">Action</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {tcPayments.map(payment => (
                                                            <TableRow key={payment.id} className="h-8">
                                                                <TableCell className="text-[10px] py-1">{format(new Date(payment.created_at), 'yyyy-MM-dd')}</TableCell>
                                                                <TableCell className="text-[10px] py-1 font-mono">{payment.transaction_id || 'N/A'}</TableCell>
                                                                <TableCell className="text-[10px] py-1 text-right font-semibold">LKR {parseFloat(payment.payment_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                                                                <TableCell className="text-[10px] py-1 text-right">
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                                                        onClick={() => handleDeletePayment(payment.id)}
                                                                        disabled={deletePaymentMutation.isPending}
                                                                    >
                                                                        {deletePaymentMutation.isPending && deletePaymentMutation.variables === payment.id ? (
                                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                                        ) : (
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        )}
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        ) : (
                                            <p className="text-[10px] text-muted-foreground italic p-2 text-center border border-dashed rounded-md">No transaction records found for this student.</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader><CardTitle className="text-base uppercase tracking-wider text-muted-foreground">Verification Documents</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                                            <Paperclip className="h-3 w-3" /> All Submitted Slips
                                        </Label>
                                        <div className="grid grid-cols-1 gap-2">
                                            {/* Initial Slip */}
                                            {registration.image_path ? (
                                                <div className="flex flex-col gap-1">
                                                    <ViewSlipDialog 
                                                        title="Initial Booking Slip"
                                                        slipPath={registration.image_path}
                                                        studentName={registration.student_number}
                                                        trigger={
                                                            <Button variant="outline" size="sm" className="justify-start h-auto py-2.5 px-3">
                                                                <FileText className="h-4 w-4 mr-3 text-primary" />
                                                                <div className="text-left">
                                                                    <p className="text-xs font-semibold">Initial Registration Slip</p>
                                                                    <p className="text-[10px] text-muted-foreground">Main verification</p>
                                                                </div>
                                                            </Button>
                                                        }
                                                    />
                                                    {registration.hash_value && (
                                                        <DuplicateSlipCheck 
                                                            hashValue={registration.hash_value} 
                                                            currentRegistrationId={registration.registration_id} 
                                                        />
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="h-16 border-2 border-dashed rounded-md flex items-center justify-center text-muted-foreground italic text-xs">No initial slip</div>
                                            )}

                                            {/* Balance Slips */}
                                            {isLoadingPortalSlips ? (
                                                <Skeleton className="h-10 w-full" />
                                            ) : balanceSlips.map((p, idx) => (
                                                <div key={p.id} className="flex flex-col gap-1">
                                                    <ViewSlipDialog 
                                                        title={`Balance Payment Slip #${idx + 1}`}
                                                        slipPath={p.slip_path}
                                                        studentName={registration.student_number}
                                                        trigger={
                                                            <Button variant="outline" size="sm" className="justify-start h-auto py-2.5 px-3 border-dashed">
                                                                <FileText className="h-4 w-4 mr-3 text-orange-500" />
                                                                <div className="text-left">
                                                                    <p className="text-xs font-semibold">Balance Slip ({format(new Date(p.created_at), 'MMM d')})</p>
                                                                    <p className="text-[10px] text-muted-foreground">Status: {p.payment_status}</p>
                                                                </div>
                                                            </Button>
                                                        }
                                                    />
                                                    {p.hash_value && (
                                                        <DuplicateSlipCheck 
                                                            hashValue={p.hash_value} 
                                                            currentRegistrationId={p.id} 
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-4 pb-10">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold font-headline">Course Performance & Eligibility</h3>
                                {isLoadingStudentData ? <Skeleton className="h-5 w-16" /> : studentInfo && <Badge variant="secondary" className="font-mono text-xs">{Object.keys(studentInfo.studentEnrollments).length} Total Enrollments</Badge>}
                            </div>
                            <div className="space-y-4">
                                {isLoadingStudentData ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-16 w-full" />
                                        <Skeleton className="h-16 w-full" />
                                    </div>
                                ) : studentInfo ? (
                                    Object.values(studentInfo.studentEnrollments).map(enrollment => (
                                        <EnrollmentDetailAccordion key={enrollment.id} enrollment={enrollment} />
                                    ))
                                ) : null}
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="p-4 bg-muted/20 border-t shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="h-8 uppercase">Registration: {registration.registration_status}</Badge>
                        {registration.ceremony_number && <Badge variant="default" className="h-8 bg-blue-600">Attendance #: {registration.ceremony_number}</Badge>}
                    </div>
                    <Dialog open={isConfirmAttendanceDialogOpen} onOpenChange={setIsConfirmAttendanceDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90">
                                <UserCheck className="mr-2 h-4 w-4" />
                                Confirm & Assign Ceremony #
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Confirm Convocation Attendance</DialogTitle>
                                <DialogDescription>
                                    Assign a ceremony number to this student. This will automatically update their registration status to <strong>Confirmed</strong>.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-2">
                                <Label>Ceremony Number</Label>
                                <input 
                                    placeholder="Enter ceremony number (e.g., 402)" 
                                    value={ceremonyNumber} 
                                    onChange={e => setCeremonyNumber(e.target.value)} 
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsConfirmAttendanceDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleAttendanceConfirmation} disabled={updateCeremonyMutation.isPending}>
                                    {updateCeremonyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Confirm Attendance
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
};
