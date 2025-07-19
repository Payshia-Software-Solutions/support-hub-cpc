
"use client";

import { useState, useEffect, Dispatch, SetStateAction, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentEnrollments, getCourses, addStudentEnrollment, removeStudentEnrollment, createStudentPayment, updatePaymentRequestStatus, checkDuplicateSlips } from '@/lib/api';
import type { PaymentRequest, StudentEnrollmentInfo, Course, CreatePaymentPayload } from '@/lib/types';
import { format } from 'date-fns';
import Image from 'next/image';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ExternalLink, Check, X, Loader2, ZoomIn, ZoomOut, AlertCircle, FileText,
  Hourglass, CheckCircle, XCircle, BookOpen, GraduationCap, Package,
  RotateCw, FlipHorizontal, FlipVertical, ArrowLeft, Briefcase, Trash2, PlusCircle
} from 'lucide-react';


const CONTENT_PROVIDER_URL = 'https://content-provider.pharmacollege.lk';

// --- Sub-components for the dialog, defined at the top-level for stability ---

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

const ManageEnrollmentsDialog = ({ isOpen, onOpenChange, studentNumber, allCourses, currentEnrollments, onEnrollmentsChange }: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    studentNumber: string;
    allCourses: Course[];
    currentEnrollments: StudentEnrollmentInfo[];
    onEnrollmentsChange: () => void;
}) => {
    const [newCourseCode, setNewCourseCode] = useState('');

    const addMutation = useMutation({
        mutationFn: addStudentEnrollment,
        onSuccess: () => {
            toast({ title: 'Enrollment Added' });
            onEnrollmentsChange(); 
            setNewCourseCode('');
        },
        onError: (error: Error) => toast({ variant: 'destructive', title: 'Failed to Add Enrollment', description: error.message })
    });

    const removeMutation = useMutation({
        mutationFn: removeStudentEnrollment,
        onSuccess: () => {
            toast({ title: 'Enrollment Removed' });
            onEnrollmentsChange();
        },
        onError: (error: Error) => toast({ variant: 'destructive', title: 'Failed to Remove Enrollment', description: error.message })
    });

    const availableCourses = useMemo(() => {
        return allCourses.filter(course => !currentEnrollments.some(e => e.course_code === course.courseCode));
    }, [allCourses, currentEnrollments]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Enrollments for {studentNumber}</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div>
                        <Label>Current Enrollments</Label>
                        <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-2">
                            {currentEnrollments.length > 0 ? currentEnrollments.map(e => (
                                <div key={e.student_course_id} className="flex items-center justify-between p-2 border rounded-md">
                                    <p className="text-sm font-medium">
                                        {allCourses.find(c => c.courseCode === e.course_code)?.name || e.course_code}
                                        <span className="text-muted-foreground"> ({e.course_code})</span>
                                    </p>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeMutation.mutate(e.student_course_id)} disabled={removeMutation.isPending && removeMutation.variables === e.student_course_id}>
                                        {removeMutation.isPending && removeMutation.variables === e.student_course_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </Button>
                                </div>
                            )) : <p className="text-sm text-muted-foreground text-center p-4">No enrollments found.</p>}
                        </div>
                    </div>
                    <div className="pt-4 border-t">
                        <Label>Add New Enrollment</Label>
                        <div className="mt-2 flex gap-2">
                            <Select value={newCourseCode} onValueChange={setNewCourseCode}>
                                <SelectTrigger><SelectValue placeholder="Select a course..." /></SelectTrigger>
                                <SelectContent>
                                    {availableCourses.map(c => <SelectItem key={c.id} value={c.courseCode}>{c.name} ({c.courseCode})</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Button onClick={() => addMutation.mutate({ student_id: currentEnrollments[0]?.student_id, course_code: newCourseCode })} disabled={addMutation.isPending || !newCourseCode || !currentEnrollments[0]?.student_id}>
                                {addMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />} Add
                            </Button>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const CoursePaymentForm = ({ request, paymentAmount, setPaymentAmount, discountAmount, setDiscountAmount, paymentMethod, setPaymentMethod, selectedCourseCode, setSelectedCourseCode, setIsEnrollmentDialogOpen, enrollments, isLoadingEnrollments, courses }: {
    request: PaymentRequest;
    paymentAmount: string; setPaymentAmount: Dispatch<SetStateAction<string>>;
    discountAmount: string; setDiscountAmount: Dispatch<SetStateAction<string>>;
    paymentMethod: string; setPaymentMethod: Dispatch<SetStateAction<string>>;
    selectedCourseCode: string; setSelectedCourseCode: Dispatch<SetStateAction<string>>;
    setIsEnrollmentDialogOpen: Dispatch<SetStateAction<boolean>>;
    enrollments: StudentEnrollmentInfo[] | undefined;
    isLoadingEnrollments: boolean;
    courses: Course[];
}) => {
    return (
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
                Suggested: <button type="button" className="text-primary hover:underline font-medium" onClick={() => setPaymentAmount(request.paid_amount)}>LKR {parseFloat(request.paid_amount).toLocaleString('en-US')}</button>
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
                <div className="flex items-center justify-between">
                    <Label htmlFor="course-select">Associated Batch</Label>
                    <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={() => setIsEnrollmentDialogOpen(true)} disabled={isLoadingEnrollments}>Manage</Button>
                </div>
                <Select value={selectedCourseCode} onValueChange={setSelectedCourseCode} disabled={isLoadingEnrollments}>
                    <SelectTrigger id="course-select"><SelectValue placeholder={isLoadingEnrollments ? "Loading..." : "Select enrolled batch..."} /></SelectTrigger>
                    <SelectContent>
                        {enrollments?.map((e) => <SelectItem key={e.student_course_id} value={e.course_code}>{courses.find(c => c.courseCode === e.course_code)?.name || e.course_code}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};

const CategorySelection = ({ setSelectedCategory }: { setSelectedCategory: (category: 'course' | 'convocation' | 'other') => void }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
        <Card onClick={() => setSelectedCategory('course')} className="hover:border-primary hover:shadow-lg transition-all cursor-pointer"><CardHeader className="items-center text-center p-4"><BookOpen className="w-8 h-8 text-primary mb-2"/><CardTitle className="text-sm">Course Fee</CardTitle></CardHeader></Card>
        <Card onClick={() => setSelectedCategory('convocation')} className="hover:border-primary hover:shadow-lg transition-all cursor-pointer"><CardHeader className="items-center text-center p-4"><GraduationCap className="w-8 h-8 text-primary mb-2"/><CardTitle className="text-sm">Convocation</CardTitle></CardHeader></Card>
        <Card onClick={() => setSelectedCategory('other')} className="hover:border-primary hover:shadow-lg transition-all cursor-pointer"><CardHeader className="items-center text-center p-4"><Briefcase className="w-8 h-8 text-primary mb-2"/><CardTitle className="text-sm">Other</CardTitle></CardHeader></Card>
    </div>
);


const DetailsSection = ({ request, selectedCategory, setSelectedCategory, paymentAmount, setPaymentAmount, discountAmount, setDiscountAmount, paymentMethod, setPaymentMethod, selectedCourseCode, setSelectedCourseCode, isEnrollmentDialogOpen, setIsEnrollmentDialogOpen, enrollments, isLoadingEnrollments, courses }: {
    request: PaymentRequest;
    selectedCategory: 'course' | 'convocation' | 'other' | null;
    setSelectedCategory: Dispatch<SetStateAction<'course' | 'convocation' | 'other' | null>>;
    paymentAmount: string;
    setPaymentAmount: Dispatch<SetStateAction<string>>;
    discountAmount: string;
    setDiscountAmount: Dispatch<SetStateAction<string>>;
    paymentMethod: string;
    setPaymentMethod: Dispatch<SetStateAction<string>>;
    selectedCourseCode: string;
    setSelectedCourseCode: Dispatch<SetStateAction<string>>;
    isEnrollmentDialogOpen: boolean;
    setIsEnrollmentDialogOpen: Dispatch<SetStateAction<boolean>>;
    enrollments: StudentEnrollmentInfo[] | undefined;
    isLoadingEnrollments: boolean;
    courses: Course[];
    
}) => {
    
    const FormContent = () => {
        if (!selectedCategory) return <CategorySelection setSelectedCategory={setSelectedCategory} />;
        switch (selectedCategory) {
            case 'course':
                return <CoursePaymentForm request={request} paymentAmount={paymentAmount} setPaymentAmount={setPaymentAmount} discountAmount={discountAmount} setDiscountAmount={setDiscountAmount} paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} selectedCourseCode={selectedCourseCode} setSelectedCourseCode={setSelectedCourseCode} setIsEnrollmentDialogOpen={setIsEnrollmentDialogOpen} enrollments={enrollments} isLoadingEnrollments={isLoadingEnrollments} courses={courses} />;
            case 'convocation': return <p className="text-center text-muted-foreground py-8">Convocation payment form placeholder.</p>;
            case 'other': return <p className="text-center text-muted-foreground py-8">Other payment form placeholder.</p>;
            default: return null;
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-3 rounded-md border p-4 bg-muted/50">
                <h3 className="font-semibold text-base">Submitted Information</h3>
                <div className="text-sm space-y-2 text-muted-foreground">
                    <p><strong className="text-card-foreground">Request ID:</strong> {request.id}</p>
                    <p><strong className="text-card-foreground">Student / Ref #:</strong> {request.unique_number}</p>
                    <p><strong className="text-card-foreground">Reason:</strong> {request.payment_reson}</p>
                    <p><strong className="text-card-foreground">Amount:</strong> LKR {parseFloat(request.paid_amount).toLocaleString()}</p>
                    <p><strong className="text-card-foreground">Paid Date:</strong> {format(new Date(request.paid_date), 'PPP')}</p>
                </div>
            </div>
            <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                    {selectedCategory && <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)} className="pl-1"><ArrowLeft className="h-4 w-4 mr-1"/>Back</Button>}
                    <h3 className="font-semibold text-base">Verification &amp; Approval</h3>
                </div>
                <FormContent />
            </div>
        </div>
    );
};

const SlipSection = ({ request }: { request: PaymentRequest }) => {
    const [isZoomed, setIsZoomed] = useState(false);
    const [rotation, setRotation] = useState(0);
    const fullSlipUrl = `${CONTENT_PROVIDER_URL}${request.slip_path}`;
    const isImage = /\.(jpg|jpeg|png|gif)$/i.test(request.slip_path);
    
    const transformStyle = `scale(${isZoomed ? 2 : 1}) rotate(${rotation}deg)`;

    return (
         <div className="space-y-2">
            <div className="flex justify-between items-center flex-wrap gap-2">
                <h3 className="font-semibold text-lg">Payment Slip</h3>
                {isImage && <div className="flex items-center gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsZoomed(!isZoomed)}><span className="sr-only">Zoom</span>{isZoomed ? <ZoomOut /> : <ZoomIn />}</Button><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRotation(p => (p + 90) % 360)}><span className="sr-only">Rotate</span><RotateCw /></Button></div>}
            </div>
            <div className="max-h-[60vh] overflow-auto border rounded-lg p-2 bg-muted">
                {isImage ? (<div className={cn("w-full h-full overflow-auto transition-transform duration-300", isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in')} onClick={() => setIsZoomed(!isZoomed)}><Image src={fullSlipUrl} alt="Payment Slip" width={800} height={1200} className={cn("w-full h-auto object-contain transition-transform duration-300")} style={{ transform: transformStyle }} data-ai-hint="payment slip"/></div>) 
                         : (<div className="flex flex-col items-center justify-center p-8 text-center bg-background rounded-lg"><p className="mb-4">Cannot preview file.</p><a href={fullSlipUrl} target="_blank" rel="noopener noreferrer"><Button><ExternalLink className="mr-2 h-4 w-4"/>Open in New Tab</Button></a></div>)}
            </div>
        </div>
    );
};


// --- THE MAIN DIALOG COMPONENT ---

export function PaymentRequestDialog({ isOpen, onOpenChange, request, courses, onSuccess }: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    request: PaymentRequest | null;
    courses: Course[];
    onSuccess: () => void;
}) {
    const { user: adminUser } = useAuth();
    const [selectedCategory, setSelectedCategory] = useState<'course' | 'convocation' | 'other' | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [selectedCourseCode, setSelectedCourseCode] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [discountAmount, setDiscountAmount] = useState('');
    const [isMobileView, setIsMobileView] = useState(false);
    const [isEnrollmentDialogOpen, setIsEnrollmentDialogOpen] = useState(false);
    
    const { data: enrollments, isLoading: isLoadingEnrollments, refetch: refetchEnrollments } = useQuery({
        queryKey: ['studentEnrollments', request?.unique_number],
        queryFn: () => getStudentEnrollments(request!.unique_number),
        enabled: !!request,
    });
    
    useEffect(() => {
        if (request) {
            setPaymentAmount('');
            setSelectedCourseCode('');
            setPaymentMethod('');
            setDiscountAmount('');
            setSelectedCategory(null);
            const checkMobile = () => setIsMobileView(window.innerWidth < 768);
            checkMobile();
            window.addEventListener('resize', checkMobile);
            return () => window.removeEventListener('resize', checkMobile);
        }
    }, [request]);

    const recordAndApproveMutation = useMutation({
        mutationFn: async (paymentPayload: CreatePaymentPayload) => {
            await createStudentPayment(paymentPayload);
            await updatePaymentRequestStatus(request!, 'Approved');
        },
        onSuccess: () => {
            toast({ title: 'Request Approved!', description: `Payment for #${request!.unique_number} recorded.` });
            onSuccess();
            onOpenChange(false);
        },
        onError: (error: Error) => toast({ variant: 'destructive', title: 'Approval Failed', description: error.message })
    });

    const markApprovedMutation = useMutation({
        mutationFn: (req: PaymentRequest) => updatePaymentRequestStatus(req, 'Approved'),
        onSuccess: () => {
            toast({ title: 'Request Marked as Approved' });
            onSuccess();
            onOpenChange(false);
        },
        onError: (error: Error) => toast({ variant: 'destructive', title: 'Update Failed', description: error.message })
    });
    
    const rejectionMutation = useMutation({
        mutationFn: (req: PaymentRequest) => updatePaymentRequestStatus(req, 'Rejected'),
        onSuccess: () => {
            toast({ title: 'Request Rejected' });
            onSuccess();
            onOpenChange(false);
        },
        onError: (error: Error) => toast({ variant: 'destructive', title: 'Rejection Failed', description: error.message })
    });

    const handleRecordAndApprove = () => {
        if (!paymentAmount || !paymentMethod || !selectedCourseCode) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Amount, method, and batch are required.' }); return;
        }
        if (!adminUser?.username) {
            toast({ variant: 'destructive', title: 'Authentication Error', description: 'Could not identify admin user.' }); return;
        }
        const studentId = enrollments?.[0]?.student_id;
        if (!studentId) {
            toast({ variant: 'destructive', title: 'Student ID Error', description: 'Could not determine student ID.' }); return;
        }

        const paymentPayload: CreatePaymentPayload = {
            course_code: selectedCourseCode, student_id: studentId, paid_amount: paymentAmount,
            discount_amount: discountAmount || '0', payment_status: 'Paid', payment_type: paymentMethod,
            paid_date: format(new Date(request!.paid_date), 'yyyy-MM-dd'), created_by: adminUser.username
        };
        recordAndApproveMutation.mutate(paymentPayload);
    }
    
    if (!isOpen || !request) return null;

    const isMutating = recordAndApproveMutation.isPending || rejectionMutation.isPending || markApprovedMutation.isPending;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className={cn("max-w-4xl p-0 flex flex-col", isMobileView ? "h-screen w-screen max-w-full rounded-none" : "h-[90vh]")}>
                <DialogHeader className="p-6 pb-2"><DialogTitle>Manage Payment Request</DialogTitle><DialogDescription>Review slip and approve/reject payment for #{request.unique_number}.</DialogDescription></DialogHeader>
                <div className="flex-1 overflow-y-auto px-6 pt-2 pb-6">
                    <div className="mt-4 space-y-4">
                        <DuplicateSlipCheck hashValue={request.hash_value} currentRequestId={request.id} />
                        {isMobileView ? (
                            <Tabs defaultValue="details" className="w-full"><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="details">Details</TabsTrigger><TabsTrigger value="slip">Slip</TabsTrigger></TabsList><TabsContent value="details" className="pt-4"><DetailsSection request={request} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} paymentAmount={paymentAmount} setPaymentAmount={setPaymentAmount} discountAmount={discountAmount} setDiscountAmount={setDiscountAmount} paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} selectedCourseCode={selectedCourseCode} setSelectedCourseCode={setSelectedCourseCode} isEnrollmentDialogOpen={isEnrollmentDialogOpen} setIsEnrollmentDialogOpen={setIsEnrollmentDialogOpen} enrollments={enrollments} isLoadingEnrollments={isLoadingEnrollments} courses={courses} /></TabsContent><TabsContent value="slip" className="pt-4"><SlipSection request={request} /></TabsContent></Tabs>
                        ) : (<div className="grid md:grid-cols-2 gap-x-8 gap-y-6"><DetailsSection request={request} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} paymentAmount={paymentAmount} setPaymentAmount={setPaymentAmount} discountAmount={discountAmount} setDiscountAmount={setDiscountAmount} paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} selectedCourseCode={selectedCourseCode} setSelectedCourseCode={setSelectedCourseCode} isEnrollmentDialogOpen={isEnrollmentDialogOpen} setIsEnrollmentDialogOpen={setIsEnrollmentDialogOpen} enrollments={enrollments} isLoadingEnrollments={isLoadingEnrollments} courses={courses} /><SlipSection request={request} /></div>)}
                    </div>
                </div>
                 <DialogFooter className="mt-auto p-6 bg-card border-t flex-shrink-0">
                    <div className="flex w-full flex-wrap items-center justify-end gap-2">
                         <Button variant="destructive" onClick={() => rejectionMutation.mutate(request)} disabled={isMutating} size="sm">{rejectionMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <X className="mr-2 h-4 w-4"/>}Reject</Button>
                        <Button variant="outline" onClick={() => markApprovedMutation.mutate(request)} disabled={isMutating} size="sm">{markApprovedMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4"/>}Mark as Approved</Button>
                        <Button variant="default" onClick={handleRecordAndApprove} disabled={isMutating || isLoadingEnrollments || !selectedCategory} size="sm">{(recordAndApproveMutation.isPending || isLoadingEnrollments) ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4"/>}Approve & Record</Button>
                    </div>
                </DialogFooter>
                 <ManageEnrollmentsDialog isOpen={isEnrollmentDialogOpen} onOpenChange={setIsEnrollmentDialogOpen} studentNumber={request.unique_number} allCourses={courses} currentEnrollments={enrollments || []} onEnrollmentsChange={() => refetchEnrollments()} />
            </DialogContent>
        </Dialog>
    );
}
