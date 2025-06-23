"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, AlertTriangle, User, Mail, Phone, Truck, Package, CalendarDays, MapPin } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

// Using types from quick-links for consistency
interface StudentInfo {
    id: string;
    student_id: string;
    full_name: string;
    e_mail: string;
    telephone_1: string;
    nic: string;
}
interface DeliveryOrder {
    id: string;
    delivery_id: string;
    tracking_number: string;
    order_date: string;
    current_status: string;
    delivery_title: string;
    active_status: string;
}
interface StudentEnrollment {
    id: string;
    course_code: string;
    parent_course_name: string;
    deliveryOrders: DeliveryOrder[];
}
interface FullStudentData {
    studentInfo: StudentInfo;
    studentEnrollments: Record<string, StudentEnrollment>;
}

export default function DeliveryOrdersPage() {
    const [studentId, setStudentId] = useState('');
    const [studentData, setStudentData] = useState<FullStudentData | null>(null);
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
        try {
            const response = await fetch(`https://qa-api.pharmacollege.lk/get-student-full-info?loggedUser=${studentId.trim().toUpperCase()}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Student not found or server error. Status: ${response.status}` }));
                throw new Error(errorData.message || 'Student data is invalid or not found.');
            }
            const data = await response.json();
            if (data && data.studentInfo && data.studentEnrollments) {
                setStudentData(data);
            } else {
                 throw new Error('Student data is incomplete in the API response.');
            }
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
            toast({ variant: 'destructive', title: 'Search Failed', description: err.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const enrollmentsArray = studentData ? Object.values(studentData.studentEnrollments) : [];
    const allDeliveryOrders = enrollmentsArray.flatMap(e => e.deliveryOrders);

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20 max-w-4xl mx-auto">
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
                                        <p className="flex items-center justify-center sm:justify-start gap-2"><User className="h-4 w-4 shrink-0" /> {studentData.studentInfo.nic}</p>
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
                           {allDeliveryOrders.length > 0 ? (
                                <div className="space-y-4">
                                    {allDeliveryOrders.map(order => (
                                        <div key={order.id} className="border p-4 rounded-lg space-y-3">
                                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                                <h3 className="font-semibold text-lg flex items-center gap-2"><Package className="h-5 w-5 text-primary"/>{order.delivery_title}</h3>
                                                <Badge variant={order.active_status === 'Delivered' ? 'default' : 'secondary'}>{order.active_status}</Badge>
                                            </div>
                                            <div className="text-sm text-muted-foreground grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                                                <p className="flex items-center gap-2"><Truck className="h-4 w-4"/><strong>Tracking #:</strong> {order.tracking_number}</p>
                                                <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4"/><strong>Ordered:</strong> {new Date(order.order_date).toLocaleDateString()}</p>
                                                <p className="flex items-center gap-2 sm:col-span-2"><MapPin className="h-4 w-4"/><strong>Status:</strong> {order.current_status}</p>
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