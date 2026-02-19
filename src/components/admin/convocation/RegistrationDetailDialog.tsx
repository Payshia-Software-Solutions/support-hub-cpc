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
    getCertificateOrdersByStudent
} from '@/lib/actions/certificates';
import { getStudentFullInfo } from '@/lib/actions/users';
import type { 
    ConvocationRegistration, 
    ConvocationPackage, 
    FullStudentData, 
    SessionCount,
    CertificateOrder,
    StudentEnrollmentInfo
} from '@/lib/types';
import Image from 'next/image';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Loader2, Save, Edit2, X, ChevronDown, CheckCircle, XCircle, Wallet, FileText, Banknote, UserCheck } from 'lucide-react';
import { EnrollmentDetailAccordion } from './EnrollmentDetailAccordion';
import { ViewSlipDialog } from './ViewSlipDialog';
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

const CONTENT_PROVIDER_URL = process.env.NEXT_PUBLIC_CONTENT_PROVIDER_URL || 'https://content-provider.pharmacollege.lk';
const PARENT_SEAT_RATE = 750;

export const RegistrationDetailDialog = ({ registration, open, onOpenChange, packages }: { 
    registration: ConvocationRegistration | null, 
    open: boolean, 
    onOpenChange: (open: boolean) => void,
    packages?: ConvocationPackage[]
}) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    
    // Dialog control states
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isConfirmAttendanceDialogOpen, setIsConfirmAttendanceDialogOpen] = useState(false);
    const [isPackageConfirmOpen, setIsPackageConfirmOpen] = useState(false);

    // Form state
    const [editPackageId, setEditPackageId] = useState('');
    const [pendingPackageId, setPendingPackageId] = useState('');
    const [editSession, setEditSession] = useState<'1' | '2'>('1');
    const [editSeats, setEditSeats] = useState('0');
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editCourseIds, setEditCourseIds] = useState<string[]>([]);

    // Specific Update States
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [ceremonyNumber, setCeremonyNumber] = useState('');

    const { data: studentData, isLoading: isLoadingStudentData } = useQuery<FullStudentData>({
        queryKey: ['studentFullInfoForConvocationDetail', registration?.student_number],
        queryFn: () => getStudentFullInfo(registration!.student_number),
        enabled: !!registration?.student_number,
    });

    useEffect(() => {
        if (registration) {
            setEditPackageId(registration.package_id || '');
            setEditSession(registration.session as '1' | '2' || '1');
            setEditSeats(registration.additional_seats || '0');
            setEditName(registration.name_on_certificate || '');
            setEditPhone(registration.telephone_1 || '');
            setEditCourseIds(registration.course_id.split(',').map(s => s.trim()).filter(Boolean));
            
            setPaymentAmount('');
            setPaymentStatus(registration.payment_status || 'Pending');
            setCeremonyNumber(registration.ceremony_number || '');
            
            setIsEditing(false);
        }
    }, [registration]);

    useEffect(() => {
        if (studentData && !editName && !registration?.name_on_certificate) {
            setEditName(studentData.studentInfo.name_on_certificate || studentData.studentInfo.full_name);
        }
        if (studentData && !editPhone && !registration?.telephone_1) {
            setEditPhone(studentData.studentInfo.telephone_1);
        }
    }, [studentData, registration, editName, editPhone]);

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

    const { data: sessionCounts } = useQuery<SessionCount[]>({
        queryKey: ['convocationSessionCounts', registration?.convocation_id],
        queryFn: () => getConvocationSessionCounts(registration!.convocation_id),
        enabled: !!registration?.convocation_id,
    });

    const updateMutation = useMutation({
        mutationFn: async (payload: Partial<ConvocationRegistration>) => {
            return updateConvocationBooking(registration!.registration_id, payload);
        },
        onSuccess: () => {
            toast({ title: 'Success', description: 'Booking updated successfully.' });
            queryClient.invalidateQueries({ queryKey: ['convocationRegistrations'] });
            setIsEditing(false);
            setIsPaymentDialogOpen(false);
            setIsConfirmAttendanceDialogOpen(false);
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Update Failed', description: err.message })
    });

    const updatePaymentMutation = useMutation({
        mutationFn: (payload: { payment_status: string; payment_amount: number; created_by: string }) => 
            updateConvocationPayment(registration!.registration_id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['convocationRegistrations'] });
            toast({ title: 'Success', description: 'Payment details updated successfully.' });
            setIsPaymentDialogOpen(false);
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        },
    });

    const packageUpdateMutation = useMutation({
        mutationFn: (newPackageId: string) => updateConvocationPackage(registration!.registration_id, newPackageId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['convocationRegistrations'] });
            toast({ title: 'Package Updated', description: 'The convocation package has been updated.' });
            setIsPackageConfirmOpen(false);
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Update Failed', description: err.message })
    });

    const updateCeremonyMutation = useMutation({
        mutationFn: (ceremonyNum: string) => updateCeremonyNumber(registration!.registration_id, ceremonyNum),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['convocationRegistrations'] });
            toast({ title: 'Attendance Confirmed', description: 'Ceremony number assigned successfully.' });
            setIsConfirmAttendanceDialogOpen(false);
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Confirmation Failed', description: error.message });
        },
    });

    const totalPayable = useMemo(() => {
        const pkg = packages?.find(p => p.package_id === editPackageId);
        const packagePrice = pkg ? parseFloat(pkg.price) : 0;
        const numSeats = parseInt(editSeats, 10) || 0;
        return packagePrice + (numSeats * PARENT_SEAT_RATE);
    }, [editPackageId, editSeats, packages]);

    const handleVerifiedAmountChange = (val: string) => {
        setPaymentAmount(val);
        const verified = parseFloat(val) || 0;
        if (verified >= totalPayable && totalPayable > 0) {
            setPaymentStatus('Paid');
        } else if (verified > 0 && verified < totalPayable) {
            setPaymentStatus('Partially Paid');
        } else if (verified === 0) {
            setPaymentStatus('Pending');
        }
    };

    if (!registration) return null;

    const handleUpdate = () => {
        updateMutation.mutate({
            session: editSession,
            additional_seats: editSeats,
            name_on_certificate: editName,
            telephone_1: editPhone,
            course_id: editCourseIds.join(','),
        });
    };

    const handlePaymentUpdate = () => {
        if (!paymentAmount) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter the verified payment amount.' });
            return;
        }

        // Map status to expected API values
        let statusToSubmit = paymentStatus;
        if (paymentStatus === 'Partially Paid' || paymentStatus.toLowerCase() === 'partially-paid') {
            statusToSubmit = 'partially-paid';
        } else {
            statusToSubmit = paymentStatus.toLowerCase();
        }

        updatePaymentMutation.mutate({
            payment_status: statusToSubmit,
            payment_amount: parseFloat(paymentAmount),
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

    const seatsAvailable = (() => {
        if (!registration.convocation_id || !sessionCounts) return { s1: 0, s2: 0 };
        const s1 = parseInt(sessionCounts.find(s => s.session === '1')?.sessionCounts || '0', 10);
        const s2 = parseInt(sessionCounts.find(s => s.session === '2')?.sessionCounts || '0', 10);
        return { s1, s2 };
    })();

    const currentPackage = packages?.find(p => p.package_id === registration.package_id);

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
                        {packageUpdateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
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
                                            <Input 
                                                value={editName} 
                                                onChange={e => setEditName(e.target.value)} 
                                                className="h-9 text-xs" 
                                                placeholder={studentData?.studentInfo.name_on_certificate || "Enter name..."}
                                            />
                                        </div>
                                        <div className="space-y-1.5 md:col-span-1 lg:col-span-1">
                                            <Label className="text-xs">Phone Number</Label>
                                            <Input 
                                                value={editPhone} 
                                                onChange={e => setEditPhone(e.target.value)} 
                                                className="h-9 text-xs" 
                                                placeholder={studentData?.studentInfo.telephone_1 || "Enter phone..."}
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
                                            <p className="text-sm font-semibold">{registration.name_on_certificate || studentData?.studentInfo.name_on_certificate || studentData?.studentInfo.full_name || 'N/A'}</p>
                                            <p className="text-xs text-muted-foreground">{registration.telephone_1 || studentData?.studentInfo.telephone_1 || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Calculated Payable</p>
                                            <p className="text-sm font-bold text-primary">LKR {totalPayable.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Course Selection */}
                                <div className="space-y-3 pt-4 border-t">
                                    <Label className="text-xs font-semibold">Course(s) in Booking</Label>
                                    {isLoadingStudentData ? <Skeleton className="h-20 w-full" /> : studentData && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {Object.values(studentData.studentEnrollments).map(enrollment => {
                                                const isChecked = editCourseIds.includes(enrollment.parent_course_id);
                                                const isEligible = enrollment.certificate_eligibility;
                                                const isBookedElsewhere = bookedElsewhereIds.has(enrollment.parent_course_id);
                                                const isOrderedElsewhere = orderedElsewhereIds.has(enrollment.parent_course_id);
                                                
                                                const isDisabled = isBookedElsewhere || isOrderedElsewhere;

                                                return (
                                                    <Collapsible key={enrollment.id} className={cn(
                                                        "border rounded-md p-3 transition-colors",
                                                        isChecked && "bg-primary/5 border-primary/20",
                                                        isDisabled && !isChecked && "opacity-60 bg-muted/50"
                                                    )}>
                                                        <div className="flex items-start gap-3">
                                                            {isEditing ? (
                                                                <Checkbox 
                                                                    id={`edit-course-${enrollment.id}`} 
                                                                    checked={isChecked}
                                                                    disabled={isDisabled}
                                                                    onCheckedChange={(checked) => {
                                                                        setEditCourseIds(prev => checked ? [...prev, enrollment.parent_course_id] : prev.filter(id => id !== enrollment.parent_course_id))
                                                                    }}
                                                                    className="mt-1"
                                                                />
                                                            ) : (
                                                                isChecked ? <CheckCircle className="h-4 w-4 text-green-500 mt-1 shrink-0" /> : <div className="w-4 h-4 mt-1 border rounded shrink-0" />
                                                            )}
                                                            <div className="flex-1 space-y-1">
                                                                <Label htmlFor={`edit-course-${enrollment.id}`} className="text-xs font-bold leading-tight block cursor-pointer">
                                                                    {enrollment.parent_course_name}
                                                                </Label>
                                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                                    {isChecked && <Badge variant="default" className="text-[9px] h-4 px-1 bg-primary/20 text-primary border-primary/30">Included</Badge>}
                                                                    {isBookedElsewhere && <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-purple-100 text-purple-800">Booked Elsewhere</Badge>}
                                                                    {isOrderedElsewhere && <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-amber-100 text-amber-800 border-amber-200">Already Ordered</Badge>}
                                                                    {!isEligible && (
                                                                        <Badge variant="destructive" className="text-[9px] h-4 px-1">Not Eligible</Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {!isEligible && (
                                                                <CollapsibleTrigger asChild>
                                                                    <Button variant="ghost" size="xs" className="h-6 w-6 p-0"><ChevronDown className="h-3 w-3"/></Button>
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
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Financials & Slip Preview */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="text-base uppercase tracking-wider text-muted-foreground">Financial Overview</CardTitle>
                                    <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button size="sm" variant="outline"><Banknote className="mr-2 h-4 w-4"/>Update Payment</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Update Payment Details</DialogTitle>
                                                <DialogDescription>Manually verify and set the payment status for this registration.</DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="p-3 bg-muted/50 rounded-lg flex justify-between items-center text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-muted-foreground">Total Required Amount:</span>
                                                        {registration.image_path && (
                                                            <ViewSlipDialog 
                                                                slipPath={registration.image_path} 
                                                                studentName={registration.name_on_certificate} 
                                                                trigger={<Button variant="link" size="xs" className="h-auto p-0 text-[10px]">View Slip</Button>} 
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="font-bold text-primary font-mono">
                                                        LKR {totalPayable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Verified Payment Amount (LKR)</Label>
                                                    <input 
                                                        type="number" 
                                                        value={paymentAmount} 
                                                        onChange={e => handleVerifiedAmountChange(e.target.value)} 
                                                        placeholder="Type verified amount..."
                                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Payment Status</Label>
                                                    <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Pending">Pending</SelectItem>
                                                            <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                                                            <SelectItem value="Paid">Paid</SelectItem>
                                                            <SelectItem value="Rejected">Rejected</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
                                                <Button onClick={handlePaymentUpdate} disabled={updatePaymentMutation.isPending}>
                                                    {updatePaymentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                                    Update Financials
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        {isLoadingStudentData ? <Skeleton className="h-20 w-full" /> : studentData && (
                                            <>
                                                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Due:</span> <span className="font-semibold">LKR {studentData.studentBalance.TotalRegistrationFee.toLocaleString()}</span></div>
                                                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Payments:</span> <span className="font-semibold text-green-600">LKR {studentData.studentBalance.totalPaymentAmount.toLocaleString()}</span></div>
                                                <div className="flex justify-between text-lg font-bold pt-2 border-t mt-2"><span className="text-muted-foreground">Balance:</span> <span className={cn(studentData.studentBalance.studentBalance > 0 ? 'text-destructive' : 'text-green-600')}>LKR {studentData.studentBalance.studentBalance.toLocaleString()}</span></div>
                                            </>
                                        )}
                                    </div>
                                    <div className="pt-4 border-t">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold mb-2">Payment Verification</p>
                                        <div className="flex items-center gap-3">
                                            <Badge className={cn(
                                                "uppercase text-[10px]",
                                                registration.payment_status?.toLowerCase() === 'paid' ? 'bg-green-600' : 
                                                (registration.payment_status?.toLowerCase() === 'partially-paid' || registration.payment_status?.toLowerCase() === 'partially paid') ? 'bg-orange-500' : 
                                                'bg-destructive'
                                            )}>{registration.payment_status}</Badge>
                                            <p className="text-sm font-bold">LKR {parseFloat(registration.payment_amount).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader><CardTitle className="text-base uppercase tracking-wider text-muted-foreground">Payment Slip</CardTitle></CardHeader>
                                <CardContent>
                                    {registration.image_path ? (
                                        <div className="space-y-3">
                                            <div className="relative aspect-video rounded-md overflow-hidden bg-muted group border border-dashed">
                                                <Image src={`${CONTENT_PROVIDER_URL}${registration.image_path}`} alt="Slip Preview" layout="fill" objectFit="cover" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ViewSlipDialog slipPath={registration.image_path} studentName={registration.name_on_certificate} trigger={<Button variant="secondary" size="sm">Full Preview</Button>} />
                                                </div>
                                            </div>
                                            <ViewSlipDialog 
                                                slipPath={registration.image_path} 
                                                studentName={registration.name_on_certificate} 
                                                trigger={<Button variant="outline" className="w-full" size="sm"><FileText className="mr-2 h-4 w-4"/>View Uploaded Document</Button>} 
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-32 border-2 border-dashed rounded-md flex flex-col items-center justify-center text-muted-foreground">
                                            <XCircle className="h-8 w-8 mb-2 opacity-50" />
                                            <p className="text-sm italic">No slip uploaded</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Student Enrollments Deep Dive */}
                        <div className="space-y-4 pb-10">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold font-headline">Course Performance & Eligibility</h3>
                                {isLoadingStudentData ? <Skeleton className="h-5 w-16" /> : studentData && <Badge variant="secondary" className="font-mono text-xs">{Object.keys(studentData.studentEnrollments).length} Total Enrollments</Badge>}
                            </div>
                            <div className="space-y-4">
                                {isLoadingStudentData ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-16 w-full" />
                                        <Skeleton className="h-16 w-full" />
                                    </div>
                                ) : studentData ? (
                                    Object.values(studentData.studentEnrollments).map(enrollment => (
                                        <EnrollmentDetailAccordion key={enrollment.id} enrollment={enrollment} />
                                    ))
                                ) : null}
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="p-4 bg-muted/20 border-t shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="h-8">Current Status: {registration.registration_status}</Badge>
                        {registration.ceremony_number && <Badge variant="default" className="h-8">Ceremony #: {registration.ceremony_number}</Badge>}
                    </div>
                    <Dialog open={isConfirmAttendanceDialogOpen} onOpenChange={setIsConfirmAttendanceDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90">
                                <UserCheck className="mr-2 h-4 w-4"/>
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
                                <Input 
                                    placeholder="Enter ceremony number (e.g., 402)" 
                                    value={ceremonyNumber} 
                                    onChange={e => setCeremonyNumber(e.target.value)} 
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsConfirmAttendanceDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleAttendanceConfirmation} disabled={updateCeremonyMutation.isPending}>
                                    {updateCeremonyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
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
