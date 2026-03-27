
"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getConvocationRegistrationsByStudent, getPackagesByCeremony, submitSecondPayment, getConvocationStudentCeremonyNumber } from '@/lib/actions/certificates';
import { getParentCourses } from '@/lib/actions/courses';
import { getPaymentRequestsByReference } from '@/lib/api';
import type { ConvocationRegistration, ParentCourse, ConvocationPackage, PaymentRequest } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, ListOrdered, PlusCircle, ArrowLeft, GraduationCap, Banknote, Calendar, Users, Wallet, Upload, CheckCircle, Award, Sparkles, ScrollText, FileText, Video, Coffee, Loader2, ExternalLink, Paperclip, Hourglass } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Image from 'next/image';

const CONTENT_PROVIDER_URL = 'https://content-provider.pharmacollege.lk';
const PARENT_SEAT_RATE = 750;

const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'pending': return <Badge variant="secondary">Pending</Badge>;
        case 'paid':
        case 'confirmed': 
            return <Badge variant="default" className="bg-green-600">Confirmed</Badge>;
        case 'rejected':
        case 'canceled':
            return <Badge variant="destructive">Rejected</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
}

const ViewSlipDialog = ({ slipPath, title, trigger }: { slipPath: string | null; title: string; trigger: React.ReactNode }) => {
    if (!slipPath) return null;

    const fullSlipUrl = slipPath.startsWith('http') ? slipPath : `${CONTENT_PROVIDER_URL}${slipPath}`;
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(slipPath);

    return (
        <Dialog>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="mt-4 max-h-[70vh] overflow-auto border rounded-lg p-2 bg-muted flex items-center justify-center">
                    {isImage ? (
                        <div className="relative w-full aspect-[3/4]">
                            <Image src={fullSlipUrl} alt={title} layout="fill" objectFit="contain" data-ai-hint="payment slip" />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-center bg-background w-full rounded-md">
                            <FileText className="w-16 h-16 text-muted-foreground mb-4"/>
                            <p className="mb-4 text-sm text-muted-foreground">This file is not an image (e.g. PDF). Open it in a new tab to view.</p>
                            <a href={fullSlipUrl} target="_blank" rel="noopener noreferrer">
                                <Button>
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Open Document
                                </Button>
                            </a>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

const ConvocationPass = ({ booking, courseNameMap, allPackages }: { booking: ConvocationRegistration, courseNameMap: Map<string, string>, allPackages: ConvocationPackage[] }) => {
    const { user } = useAuth();
    const { data: ceremonyNumber, isLoading } = useQuery({
        queryKey: ['ceremonyNumber', booking.student_number, booking.convocation_id],
        queryFn: () => getConvocationStudentCeremonyNumber(booking.student_number, booking.convocation_id),
        enabled: !!(booking.student_number && booking.convocation_id),
    });

    // Only show pass if there is a ceremony number from the API
    if (isLoading || !ceremonyNumber || ceremonyNumber === '0') {
        return null;
    }

    const courseList = booking.course_id
        .split(',')
        .map(id => id.trim())
        .filter(Boolean)
        .map(id => courseNameMap.get(id) || `Course (ID: ${id})`);
        
    const pkg = allPackages.find(p => p.package_id === booking.package_id);

    return (
        <div className="w-full relative overflow-hidden rounded-2xl shadow-xl border border-primary/20 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground mb-6 transition-all hover:shadow-2xl hover:scale-[1.01] duration-300 animate-in fade-in slide-in-from-bottom-4">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row relative z-10 w-full min-h-[220px]">
                {/* Visual Strip */}
                <div className="sm:w-3 bg-yellow-400 h-2 sm:h-auto" />
                
                {/* Main Pass Content */}
                <div className="p-6 sm:p-8 flex-grow flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-6 opacity-90">
                                <Award className="h-6 w-6 text-yellow-300" />
                                <h3 className="font-headline font-bold text-xl tracking-widest uppercase text-yellow-300">Convocation Pass</h3>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <p className="text-primary-foreground/70 text-xs font-bold uppercase tracking-wider mb-1">Student</p>
                                    <p className="text-2xl font-bold leading-none">{booking.name_on_certificate || user?.name || booking.student_number || 'N/A'}</p>
                                    <p className="text-sm font-mono text-primary-foreground/80 mt-1">{booking.student_number}</p>
                                </div>
                                
                                <div>
                                    <p className="text-primary-foreground/70 text-[10px] font-bold uppercase tracking-wider mb-1 mt-4">Programme(s)</p>
                                    <div className="space-y-1">
                                        {courseList.map((name, idx) => (
                                            <p key={idx} className="text-[15px] font-medium leading-tight">{name}</p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Desktop QR Code -> Top Right */}
                        <div className="shrink-0 bg-white p-2.5 rounded-xl shadow-inner hidden sm:block mt-8">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(booking.reference_number)}`} 
                                alt="Booking QR Code" 
                                className="w-24 h-24 object-contain"
                            />
                        </div>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-primary-foreground/20 flex flex-wrap gap-x-10 gap-y-6 items-center">
                        <div className="pr-4 border-r border-primary-foreground/20">
                            <p className="text-primary-foreground/80 text-xs uppercase font-bold tracking-[0.2em] mb-1">Session</p>
                            <p className="font-black text-4xl text-yellow-300 drop-shadow-sm">{booking.session || 'TBA'}</p>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <p className="text-primary-foreground/70 text-[10px] uppercase font-bold tracking-wider mb-1">Package</p>
                            <p className="font-semibold text-md leading-tight">{pkg?.package_name || 'Standard'}</p>
                        </div>
                        {parseInt(booking.additional_seats || '0', 10) > 0 && (
                            <div>
                                <p className="text-primary-foreground/70 text-[10px] uppercase font-bold tracking-wider mb-1">Guest Seats</p>
                                <p className="font-semibold text-lg">{booking.additional_seats}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-primary-foreground/70 text-[10px] uppercase font-bold tracking-wider mb-1">Date</p>
                            <p className="font-semibold text-md">{format(new Date(booking.registered_at), 'MMM d, yyyy')}</p>
                        </div>

                        {/* Mobile QR Code -> Bottom Center */}
                        <div className="w-full sm:hidden flex justify-center mt-2">
                            <div className="bg-white p-2.5 rounded-xl shadow-inner">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(booking.reference_number)}`} 
                                    alt="Booking QR Code" 
                                    className="w-20 h-20 object-contain"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                
                {/* Right side Ceremony Number */}
                <div className="sm:w-64 bg-black/20 p-6 sm:p-8 flex flex-col items-center justify-center border-t sm:border-t-0 sm:border-l border-primary-foreground/10 relative overflow-hidden backdrop-blur-sm">
                    {/* Tick cutouts for pass look */}
                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-background rounded-full hidden sm:block" />
                    
                    <p className="text-primary-foreground/80 text-xs uppercase font-bold tracking-[0.2em] mb-3 text-center">Ceremony No.</p>
                    
                    <div className="bg-white/10 rounded-2xl p-6 border border-white/20 shadow-inner w-full flex items-center justify-center min-h-[120px]">
                        <span className="font-mono text-7xl font-black text-yellow-300 tracking-tighter drop-shadow-md">
                            {ceremonyNumber}
                        </span>
                    </div>
                    
                    <div className="mt-6 text-center">
                        <p className="text-[10px] text-primary-foreground/50 uppercase tracking-widest font-mono">Reference Number</p>
                        <p className="text-sm font-mono font-medium text-primary-foreground/70 tracking-widest mt-1">{booking.reference_number}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const BookingDetailCard = ({ booking, courseNameMap, allPackages }: { booking: ConvocationRegistration, courseNameMap: Map<string, string>, allPackages: ConvocationPackage[] }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [bank, setBank] = useState('');
    const [branch, setBranch] = useState('');
    const [slip, setSlip] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: banks } = useQuery<{ id: string; bank_name: string }[]>({
        queryKey: ['banks'],
        queryFn: async () => {
            const res = await fetch('https://qa-api.pharmacollege.lk/banks');
            if (!res.ok) return [];
            return res.json();
        }
    });

    const { data: portalPayments, isLoading: isLoadingSlips } = useQuery<PaymentRequest[]>({
        queryKey: ['paymentRequests', booking.student_number],
        queryFn: () => getPaymentRequestsByReference(booking.student_number),
        enabled: !!booking.student_number,
    });

    const balanceSlips = useMemo(() => {
        if (!portalPayments) return [];
        const reasonKey = `convocation2nd-${booking.convocation_id}`;
        return portalPayments.filter(p => p.payment_reson === reasonKey);
    }, [portalPayments, booking.convocation_id]);

    const hasPendingSlip = useMemo(() => {
        return balanceSlips.some(p => p.payment_status === 'Pending');
    }, [balanceSlips]);

    const courseList = useMemo(() => {
        return booking.course_id
            .split(',')
            .map(id => id.trim())
            .filter(Boolean)
            .map(id => courseNameMap.get(id) || `Course (ID: ${id})`);
    }, [booking.course_id, courseNameMap]);

    const pkg = allPackages.find(p => p.package_id === booking.package_id);
    
    const totalPayable = useMemo(() => {
        const pkgPrice = pkg ? parseFloat(pkg.price) : 0;
        const seatPrice = (parseInt(booking.additional_seats, 10) || 0) * PARENT_SEAT_RATE;
        return pkgPrice + seatPrice;
    }, [pkg, booking.additional_seats]);

    const alreadyPaid = parseFloat(booking.payment_amount) || 0;
    const dueBalance = Math.max(0, totalPayable - alreadyPaid);

    const secondPaymentMutation = useMutation({
        mutationFn: submitSecondPayment,
        onSuccess: () => {
            toast({ title: 'Payment Submitted', description: 'Your balance payment slip has been uploaded for verification.' });
            queryClient.invalidateQueries({ queryKey: ['studentConvocationBookings'] });
            queryClient.invalidateQueries({ queryKey: ['paymentRequests', booking.student_number] });
            setBank('');
            setBranch('');
            setSlip(null);
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Upload Failed', description: err.message })
    });

    const handleUpload = () => {
        if (!bank || !slip || !user?.username) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select a bank and upload the payment slip.' });
            return;
        }

        const formData = new FormData();
        formData.append("studentNumber", user.username);
        formData.append("paymentReason", `convocation2nd-${booking.convocation_id}`);
        formData.append("number_type", "student_number");
        formData.append("amount", String(dueBalance));
        formData.append("reference", booking.reference_number);
        formData.append("bank", bank);
        formData.append("branch", branch);
        formData.append("slip", slip);

        setIsSubmitting(true);
        secondPaymentMutation.mutate(formData, { onSettled: () => setIsSubmitting(false) });
    };

    return (
        <Card className="shadow-lg border-primary/10 overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                        <CardTitle className="text-lg">Booking ID: {booking.reference_number}</CardTitle>
                        <CardDescription className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" /> {format(new Date(booking.registered_at), 'PPP')}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {getStatusBadge(booking.registration_status)}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Enrolled Course(s)</Label>
                                <div className="space-y-1 mt-1">
                                    {courseList.map((name, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm font-medium leading-relaxed">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                            {name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Session</Label>
                                    <p className="text-sm font-semibold">Session {booking.session}</p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Guest Seats</Label>
                                    <p className="text-sm font-semibold">{booking.additional_seats}</p>
                                </div>
                            </div>

                            {pkg && (
                                <div className="space-y-2 pt-2 border-t">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Package Inclusions: {pkg.package_name}</Label>
                                    <div className="flex flex-wrap gap-3">
                                        {pkg.graduation_cloth === '1' && <Badge variant="outline" className="gap-1.5"><Award className="h-3 w-3 text-primary" /> Cloak</Badge>}
                                        {pkg.garland === '1' && <Badge variant="outline" className="gap-1.5"><Sparkles className="h-3 w-3 text-primary" /> Garland</Badge>}
                                        {pkg.scroll === '1' && <Badge variant="outline" className="gap-1.5"><ScrollText className="h-3 w-3 text-primary" /> Scroll</Badge>}
                                        {pkg.photo_package === '1' && <Badge variant="outline" className="gap-1.5"><GraduationCap className="h-3 w-3 text-primary" /> Hat</Badge>}
                                        {pkg.refreshments === '1' && <Badge variant="outline" className="gap-1.5"><Coffee className="h-3 w-3 text-primary" /> Food</Badge>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Slips Section */}
                        <div className="space-y-3 pt-4 border-t">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                                <Paperclip className="h-3 w-3" /> Submitted Payment Documents
                            </Label>
                            <div className="grid grid-cols-1 gap-2">
                                {/* Initial Slip */}
                                {booking.image_path && (
                                    <ViewSlipDialog 
                                        title="Initial Payment Slip"
                                        slipPath={booking.image_path}
                                        trigger={
                                            <Button variant="outline" size="sm" className="justify-start h-auto py-2.5 px-3">
                                                <FileText className="h-4 w-4 mr-3 text-primary" />
                                                <div className="text-left">
                                                    <p className="text-xs font-semibold">Initial Booking Slip</p>
                                                    <p className="text-[10px] text-muted-foreground">Uploaded on registration</p>
                                                </div>
                                            </Button>
                                        }
                                    />
                                )}

                                {/* Balance Slips */}
                                {isLoadingSlips ? (
                                    <Skeleton className="h-10 w-full" />
                                ) : balanceSlips.map((p, idx) => (
                                    <ViewSlipDialog 
                                        key={p.id}
                                        title={`Balance Payment Slip #${idx + 1}`}
                                        slipPath={p.slip_path}
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
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 p-4 rounded-xl bg-muted/20 border border-muted-foreground/10">
                        <h4 className="font-bold text-sm flex items-center gap-2"><Banknote className="h-4 w-4" /> Financial Summary</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Required:</span>
                                <span className="font-mono">LKR {totalPayable.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-green-600 font-medium">
                                <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5" /> Already Paid:</span>
                                <span className="font-mono">- LKR {alreadyPaid.toLocaleString()}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-lg font-bold">
                                <span>Due Balance:</span>
                                <span className={cn(dueBalance > 0 ? "text-destructive" : "text-green-600")}>LKR {dueBalance.toLocaleString()}</span>
                            </div>
                        </div>

                        {dueBalance > 0 && (
                            <div className="pt-4 border-t border-dashed mt-4 space-y-4">
                                <h5 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                    <Upload className="h-3.5 w-3.5" /> Balance Payment
                                </h5>
                                
                                {hasPendingSlip ? (
                                    <Alert variant="default" className="bg-orange-50 border-orange-200 text-orange-800">
                                        <Hourglass className="h-4 w-4 !text-orange-800" />
                                        <AlertTitle className="text-xs font-bold">Payment Under Review</AlertTitle>
                                        <AlertDescription className="text-[10px] leading-tight">
                                            You have already submitted a balance payment slip. Please wait for the administration to verify it before submitting another.
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3 animate-in fade-in-50">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Paid Bank</Label>
                                            <Select value={bank} onValueChange={setBank}>
                                                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select bank..." /></SelectTrigger>
                                                <SelectContent>
                                                    {banks?.map(b => <SelectItem key={b.id} value={b.id} className="text-xs">{b.bank_name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Branch (Optional)</Label>
                                            <Input value={branch} onChange={e => setBranch(e.target.value)} className="h-8 text-xs" placeholder="Branch name..." />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Payment Slip</Label>
                                            <Input type="file" onChange={e => setSlip(e.target.files ? e.target.files[0] : null)} className="h-8 text-xs pt-1 file:h-6 file:text-[10px]" />
                                        </div>
                                        <Button onClick={handleUpload} size="sm" disabled={isSubmitting} className="w-full mt-2">
                                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                            Submit Payment
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default function ConvocationBookingHistoryPage() {
    const { user } = useAuth();
    const router = useRouter();

    const { data: previousBookings, isLoading: isLoadingBookings, isError, error } = useQuery<ConvocationRegistration[]>({
        queryKey: ['studentConvocationBookings', user?.username],
        queryFn: () => getConvocationRegistrationsByStudent(user!.username!),
        enabled: !!user?.username,
    });

    const { data: allCourses, isLoading: isLoadingCourses } = useQuery<ParentCourse[]>({
        queryKey: ['parentCoursesForBookingHistory'],
        queryFn: getParentCourses,
        staleTime: Infinity,
    });

    const { data: allPackages, isLoading: isLoadingPackages } = useQuery<ConvocationPackage[]>({
        queryKey: ['allConvocationPackages'],
        queryFn: () => getPackagesByCeremony(''),
        staleTime: 1000 * 60 * 10,
    });

    const courseNameMap = useMemo(() => {
        if (!allCourses) return new Map<string, string>();
        return new Map(allCourses.map(course => [course.id, course.course_name]));
    }, [allCourses]);

    const isLoading = isLoadingBookings || isLoadingCourses || isLoadingPackages;
    
    return (
        <div className="p-4 md:p-8 space-y-8 pb-20">
            <header className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                <div>
                     <Button onClick={() => router.back()} className="mb-4 h-auto p-2 bg-card text-card-foreground shadow-md hover:bg-muted">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <h1 className="text-3xl font-headline font-semibold">Convocation Bookings</h1>
                    <p className="text-muted-foreground">View your detailed booking history and manage balance payments.</p>
                </div>
                <Button asChild className="mt-2">
                    <Link href="/dashboard/convocation-booking/create">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create New Booking
                    </Link>
                </Button>
            </header>

            <div className="space-y-6">
                {isLoading && (
                    <div className="space-y-4">
                        <Skeleton className="h-[220px] w-full rounded-2xl" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                )}
                {isError && (
                     <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error Loading Bookings</AlertTitle>
                        <AlertDescription>{error.message}</AlertDescription>
                    </Alert>
                )}
                {!isLoading && !isError && previousBookings && previousBookings.length > 0 && (
                    <div className="space-y-8">
                        <div className="space-y-6">
                            {previousBookings.map(booking => (
                                <ConvocationPass 
                                    key={`pass-${booking.registration_id}`} 
                                    booking={booking} 
                                    courseNameMap={courseNameMap} 
                                    allPackages={allPackages || []} 
                                />
                            ))}
                        </div>
                        <div className="space-y-6">
                            {previousBookings.map(booking => (
                                <BookingDetailCard 
                                    key={`detail-${booking.registration_id}`} 
                                    booking={booking} 
                                    courseNameMap={courseNameMap} 
                                    allPackages={allPackages || []} 
                                />
                            ))}
                        </div>
                    </div>
                )}
                 {!isLoading && !isError && (!previousBookings || previousBookings.length === 0) && (
                    <div className="text-center py-20 text-muted-foreground flex flex-col items-center border rounded-xl bg-muted/10">
                        <GraduationCap className="w-16 h-16 mb-4 opacity-50" />
                        <h3 className="font-semibold text-lg">You haven't made any convocation bookings yet.</h3>
                        <p className="text-sm mt-1">When you book for a ceremony, it will appear here.</p>
                    </div>
                 )}
            </div>
        </div>
    );
}
