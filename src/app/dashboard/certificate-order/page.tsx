
"use client";

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getCertificateOrdersByStudent } from '@/lib/api';
import type { CertificateOrder } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ListOrdered, PlusCircle, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
        case 'pending': return <Badge variant="secondary">Pending</Badge>;
        case 'printed': return <Badge variant="default" className="bg-blue-500">Printed</Badge>;
        case 'delivered': return <Badge variant="default" className="bg-green-600">Delivered</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
}

export default function CertificateOrderHistoryPage() {
    const { user } = useAuth();
    const router = useRouter();

    const { data: previousOrders, isLoading, isError, error } = useQuery<CertificateOrder[]>({
        queryKey: ['previousCertificateOrders', user?.username],
        queryFn: () => getCertificateOrdersByStudent(user!.username!),
        enabled: !!user?.username,
    });
    
    return (
        <div className="p-4 md:p-8 space-y-8 pb-20">
            <header className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                <div>
                     <Button onClick={() => router.back()} className="mb-4 h-auto p-2 bg-card text-card-foreground shadow-md hover:bg-muted">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <h1 className="text-3xl font-headline font-semibold">Certificate Orders</h1>
                    <p className="text-muted-foreground">View your order history or create a new request.</p>
                </div>
                <Button asChild className="mt-2">
                    <Link href="/dashboard/certificate-order/create">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create New Order
                    </Link>
                </Button>
            </header>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ListOrdered className="h-5 w-5 text-primary" /> 
                        Your Order History
                    </CardTitle>
                    <CardDescription>
                        Here are all the certificate requests you've made.
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
                            <AlertTitle>Error Loading Orders</AlertTitle>
                            <AlertDescription>{error.message}</AlertDescription>
                        </Alert>
                    )}
                    {!isLoading && !isError && previousOrders && previousOrders.length > 0 && (
                        <div className="space-y-4">
                            {previousOrders.map(order => (
                                <div key={order.id} className="p-4 border rounded-lg bg-muted/50">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                                        <p className="font-semibold text-card-foreground">Order ID: {order.id}</p>
                                        <p className="text-sm text-muted-foreground">{format(new Date(order.created_at), 'PPP')}</p>
                                    </div>
                                    <div className="mt-2 pt-2 border-t">
                                        <p className="text-sm"><strong className="text-muted-foreground">Courses:</strong> {order.course_code}</p>
                                        <p className="text-sm mt-1"><strong className="text-muted-foreground">Status:</strong> {getStatusBadge(order.certificate_status)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                     {!isLoading && !isError && (!previousOrders || previousOrders.length === 0) && (
                        <div className="text-center py-10 text-muted-foreground">
                            <p>You haven't made any certificate orders yet.</p>
                        </div>
                     )}
                </CardContent>
            </Card>
        </div>
    );
}
