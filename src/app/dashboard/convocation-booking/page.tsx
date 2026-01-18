
"use client";

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getConvocationRegistrations } from '@/lib/actions/certificates';
import { getParentCourses } from '@/lib/actions/courses';
import type { ConvocationRegistration, ParentCourse } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ListOrdered, PlusCircle, ArrowLeft, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
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

export default function ConvocationBookingHistoryPage() {
    const { user } = useAuth();
    const router = useRouter();

    const { data: allBookings, isLoading: isLoadingBookings, isError, error } = useQuery<ConvocationRegistration[]>({
        queryKey: ['allConvocationBookingsForStudent', user?.username],
        queryFn: () => getConvocationRegistrations(),
        enabled: !!user?.username,
    });

    const { data: allCourses, isLoading: isLoadingCourses } = useQuery<ParentCourse[]>({
        queryKey: ['parentCoursesForBookingHistory'],
        queryFn: getParentCourses,
        staleTime: Infinity,
    });

    const previousBookings = useMemo(() => {
        if (!allBookings || !user?.username) return [];
        return allBookings.filter(booking => booking.student_number === user.username);
    }, [allBookings, user?.username]);

    const courseNameMap = useMemo(() => {
        if (!allCourses) return new Map<string, string>();
        return new Map(allCourses.map(course => [course.id, course.course_name]));
    }, [allCourses]);

    const isLoading = isLoadingBookings || isLoadingCourses;
    
    return (
        <div className="p-4 md:p-8 space-y-8 pb-20">
            <header className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                <div>
                     <Button onClick={() => router.back()} className="mb-4 h-auto p-2 bg-card text-card-foreground shadow-md hover:bg-muted">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <h1 className="text-3xl font-headline font-semibold">Convocation Bookings</h1>
                    <p className="text-muted-foreground">View your booking history or create a new registration.</p>
                </div>
                <Button asChild className="mt-2">
                    <Link href="/dashboard/convocation-booking/create">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create New Booking
                    </Link>
                </Button>
            </header>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ListOrdered className="h-5 w-5 text-primary" /> 
                        Your Booking History
                    </CardTitle>
                    <CardDescription>
                        Here are all the convocation bookings you've made.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && (
                        <div className="space-y-4">
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                    )}
                    {isError && (
                         <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error Loading Bookings</AlertTitle>
                            <AlertDescription>{(error as Error).message}</AlertDescription>
                        </Alert>
                    )}
                    {!isLoading && !isError && previousBookings && previousBookings.length > 0 && (
                        <div className="space-y-4">
                            {previousBookings.map(booking => {
                                const courseNames = booking.course_id
                                    .split(',')
                                    .map(id => courseNameMap.get(id.trim()) || `Unknown Course (ID: ${id.trim()})`)
                                    .join(', ');

                                return (
                                <div key={booking.registration_id} className="p-4 border rounded-lg bg-muted/50">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                                        <p className="font-semibold text-card-foreground">Booking ID: {booking.reference_number}</p>
                                        <p className="text-sm text-muted-foreground">{format(new Date(booking.registered_at), 'PPP')}</p>
                                    </div>
                                    <div className="mt-2 pt-2 border-t">
                                        <p className="text-sm"><strong className="text-muted-foreground">Courses:</strong> {courseNames}</p>
                                        <p className="text-sm mt-1"><strong className="text-muted-foreground">Status:</strong> {getStatusBadge(booking.registration_status)}</p>
                                    </div>
                                </div>
                                )
                            })}
                        </div>
                    )}
                     {!isLoading && !isError && (!previousBookings || previousBookings.length === 0) && (
                        <div className="text-center py-10 text-muted-foreground flex flex-col items-center">
                            <GraduationCap className="w-12 h-12 mb-4" />
                            <h3 className="font-semibold text-lg">You haven't made any convocation bookings yet.</h3>
                        </div>
                     )}
                </CardContent>
            </Card>
        </div>
    );
}
