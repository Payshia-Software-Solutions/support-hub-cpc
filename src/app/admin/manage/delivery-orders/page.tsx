
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, AlertTriangle, User, Mail, Phone, Truck, Package, CalendarDays, MapPin } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getStudentFullInfo, getDeliveryOrdersForStudent } from '@/lib/api';
import type { FullStudentData, DeliveryOrder } from '@/lib/types';


// Mapping for delivery status based on common courier stages
const getStatusBadgeVariant = (status: string) => {
    switch (status) {
        case 'Delivered':
            return 'default'; // Green
        case 'Out for Delivery':
        case 'In Transit':
            return 'secondary'; // Purple-ish
        case 'Packed':
        case 'Pending':
            return 'outline'; // Yellow-ish
        case 'Cancelled':
            return 'destructive'; // Red
        default:
            return 'secondary';
    }
};


export default function DeliveryOrdersPage() {
    const [studentId, setStudentId] = useState('');
    const [studentData, setStudentData] = useState<FullStudentData | null>(null);
    const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentId.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a student ID.' });
            return;
        }

        setIsLoading(true);
        setError(null);
        setStudentData(null);
        setDeliveryOrders([]);

        try {
            const studentInfo = await getStudentFullInfo(studentId);
            setStudentData(studentInfo);

            const orders = await getDeliveryOrdersForStudent(studentId);
            setDeliveryOrders(orders);

        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
            toast({ variant: 'destructive', title: 'Search Failed', description: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <h1 className="text-3xl font-headline font-semibold">Delivery Orders</h1>
                <p className="text-muted-foreground">Search for a student to view their delivery history.</p>
            </header>

            <Card className="shadow-lg">
                <CardContent className="p-6">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                        <Input 
                            placeholder="Enter Student ID (e.g., PA16642)" 
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            className="flex-grow"
                        />
                        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                            Search
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {isLoading && (
                <div className="space-y-6">
                    <Skeleton className="h-[170px] w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            )}

            {error && !isLoading && (
                <Card className="border-destructive">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle /> An Error Occurred</CardTitle></CardHeader>
                    <CardContent><p>{error}</p></CardContent>
                </Card>
            )}

            {studentData && (
                <div className="space-y-6">
                    <Card className="shadow-lg">
                        <CardContent className="p-4 md:p-6">
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6">
                                <Avatar className="w-24 h-24 text-4xl border-2 border-primary" data-ai-hint="student avatar">
                                    <AvatarImage src={`https://placehold.co/150x150.png`} alt={studentData.studentInfo.full_name} />
                                    <AvatarFallback>{studentData.studentInfo.full_name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 text-center sm:text-left">
                                    <h2 className="text-2xl font-bold font-headline">{studentData.studentInfo.full_name}</h2>
                                    <p className="text-muted-foreground">{studentData.studentInfo.student_id}</p>
                                    <div className="mt-2 text-sm text-muted-foreground space-y-1 break-all">
                                        <p className="flex items-center justify-center sm:justify-start gap-2"><Mail className="h-4 w-4 shrink-0" /> {studentData.studentInfo.e_mail}</p>
                                        <p className="flex items-center justify-center sm:justify-start gap-2"><Phone className="h-4 w-4 shrink-0" /> {studentData.studentInfo.telephone_1}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Delivery History</CardTitle>
                            <CardDescription>All tracked deliveries for this student.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           {deliveryOrders.length > 0 ? (
                                <div className="space-y-4">
                                    {deliveryOrders.map(order => (
                                        <div key={order.id} className="border p-4 rounded-lg space-y-3">
                                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                                <h3 className="font-semibold text-lg flex items-center gap-2"><Package className="h-5 w-5 text-primary"/>{order.course_code} Study Pack</h3>
                                                <Badge variant={getStatusBadgeVariant(order.order_recived_status)}>{order.order_recived_status}</Badge>
                                            </div>
                                            <div className="text-sm text-muted-foreground grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                                                <p className="flex items-center gap-2"><Truck className="h-4 w-4"/><strong>Tracking #:</strong> {order.tracking_number}</p>
                                                <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4"/><strong>Ordered:</strong> {new Date(order.order_date).toLocaleDateString()}</p>
                                                <p className="flex items-center gap-2 sm:col-span-2"><MapPin className="h-4 w-4"/><strong>Address:</strong> {order.street_address}, {order.city}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground py-10">
                                    <p>No delivery orders found for this student.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
