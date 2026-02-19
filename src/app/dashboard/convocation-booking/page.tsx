
"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getConvocationRegistrationsByStudent, getPackagesByCeremony, submitSecondPayment } from '@/lib/actions/certificates';
import { getParentCourses } from '@/lib/actions/courses';
import type { ConvocationRegistration, ParentCourse, ConvocationPackage } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ListOrdered, PlusCircle, ArrowLeft, GraduationCap, Banknote, Calendar, Users, Wallet, Upload, CheckCircle, Award, Sparkles, ScrollText, FileText, Video, Coffee, Loader2, Info } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

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

    const courseNames = booking.course_id
        .split(',')
        .map(id => courseNameMap.get(id.trim()) || `Course (ID: ${id.trim()})`)
        .join(', ');

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
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Enrolled Courses</Label>
                            <p className="text-sm font-medium leading-relaxed">{courseNames}</p>
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
                                    <Upload className="h-3.5 w-3.5" /> Upload Balance Payment Slip
                                </h5>
                                <div className="grid grid-cols-1 gap-3">
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
                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                        Submit Payment
                                    </Button>
                                </div>
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
                        <Skeleton className="h-48 w-full" />
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
                    <div className="space-y-6">
                        {previousBookings.map(booking => (
                            <BookingDetailCard 
                                key={booking.registration_id} 
                                booking={booking} 
                                courseNameMap={courseNameMap} 
                                allPackages={allPackages || []} 
                            />
                        ))}
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
