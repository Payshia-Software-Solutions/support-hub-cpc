
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Loader2, PlusCircle, Search, Package, ThumbsUp, Truck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getStudentsByCourseCode, createDeliveryOrderForStudent, getDeliveryOrdersForStudent, getCourses, getDeliverySettingsForCourse, updateDeliveryOrderStatus } from '@/lib/api';
import type { StudentInBatch, DeliveryOrder, Course, DeliverySetting } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const ITEMS_PER_PAGE = 25;
const LOCAL_STORAGE_KEY = 'deliveryOrderDefaults';

// --- Sub-components for actions ---

const CreateOrderDialog = ({ student, selectedBatch }: { student: StudentInBatch, selectedBatch: Course }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedDeliverySettingId, setSelectedDeliverySettingId] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [deliveryNotes, setDeliveryNotes] = useState('');
    const [currentStatus, setCurrentStatus] = useState('1'); // Default to '1' (Processing)
    const [rememberSettings, setRememberSettings] = useState(false);
    const queryClient = useQueryClient();

    // Load saved settings from localStorage when the dialog is opened
    useEffect(() => {
        if (isDialogOpen) {
            try {
                const savedDefaults = localStorage.getItem(LOCAL_STORAGE_KEY);
                if (savedDefaults) {
                    const { deliverySettingId, status, remember, tracking } = JSON.parse(savedDefaults);
                    if (remember) {
                        setSelectedDeliverySettingId(deliverySettingId || '');
                        setCurrentStatus(status || '1');
                        setTrackingNumber(tracking || '');
                        setRememberSettings(true);
                    }
                }
            } catch (error) {
                console.error("Failed to load saved settings:", error);
            }
        }
    }, [isDialogOpen]);

    const { data: deliverySettings, isLoading: isLoadingSettings } = useQuery<DeliverySetting[]>({
        queryKey: ['deliverySettings', selectedBatch.courseCode],
        queryFn: () => getDeliverySettingsForCourse(selectedBatch.courseCode),
        enabled: isDialogOpen, // Only fetch when the dialog is open
    });
    
    // Effect to default to the first delivery setting if available and none is selected
    useEffect(() => {
        if (!isLoadingSettings && deliverySettings && deliverySettings.length > 0 && !selectedDeliverySettingId) {
            const savedDefaults = localStorage.getItem(LOCAL_STORAGE_KEY);
            if(savedDefaults) {
                const { deliverySettingId, remember } = JSON.parse(savedDefaults);
                if(remember && deliverySettingId) {
                     setSelectedDeliverySettingId(deliverySettingId);
                     return;
                }
            }
            setSelectedDeliverySettingId(deliverySettings[0].id);
        }
    }, [isLoadingSettings, deliverySettings, selectedDeliverySettingId]);


    const createOrderMutation = useMutation({
        mutationFn: createDeliveryOrderForStudent,
        onSuccess: () => {
            toast({
                title: 'Order Created!',
                description: `A new delivery order for ${student.full_name} has been created.`,
            });
            queryClient.invalidateQueries({ queryKey: ['studentDeliveryOrders', student.username] });

            // Save settings if checked
            if (rememberSettings) {
                try {
                    const defaults = {
                        deliverySettingId: selectedDeliverySettingId,
                        status: currentStatus,
                        tracking: trackingNumber,
                        remember: true,
                    };
                    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaults));
                } catch (error) {
                    console.error("Failed to save settings:", error);
                }
            } else {
                // Clear saved settings if unchecked
                localStorage.removeItem(LOCAL_STORAGE_KEY);
            }

            // Reset for next entry only if not remembering settings
            if (!rememberSettings) {
                setSelectedDeliverySettingId(deliverySettings?.[0]?.id || '');
                setCurrentStatus('1');
                setTrackingNumber('');
            }
            setDeliveryNotes(''); // Always clear notes
            setIsDialogOpen(false);
        },
        onError: (error: Error) => {
            toast({
                variant: 'destructive',
                title: 'Failed to create order',
                description: error.message,
            });
        },
    });

    const handleCreateOrder = () => {
        const selectedSetting = deliverySettings?.find(s => s.id === selectedDeliverySettingId);
        if (!selectedSetting) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a delivery pack.' });
            return;
        }

        createOrderMutation.mutate({
            studentNumber: student.username,
            courseCode: selectedBatch.courseCode,
            deliverySetting: selectedSetting,
            notes: deliveryNotes,
            address: `${student.address_line_1 || ''}, ${student.city || ''}`,
            fullName: student.full_name,
            phone: student.telephone_1,
            currentStatus: currentStatus,
            trackingNumber: trackingNumber || 'PENDING',
        });
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="default" size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Order
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>New Delivery for {student.full_name}</DialogTitle>
                    <DialogDescription>
                        Select a delivery pack and confirm the details for this order.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="delivery-pack">Delivery Pack</Label>
                        {isLoadingSettings ? (
                            <Skeleton className="h-10 w-full" />
                        ) : (
                            <Select value={selectedDeliverySettingId} onValueChange={setSelectedDeliverySettingId}>
                                <SelectTrigger id="delivery-pack">
                                    <SelectValue placeholder="Select a delivery pack..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {deliverySettings?.map(setting => (
                                        <SelectItem key={setting.id} value={setting.id}>
                                            {setting.delivery_title} (LKR {setting.value})
                                        </SelectItem>
                                    ))}
                                    {deliverySettings?.length === 0 && <p className="p-4 text-sm text-muted-foreground">No settings found.</p>}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="tracking-number">Tracking Number (Optional)</Label>
                        <Input id="tracking-number" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Enter tracking number..."/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="order-status">Status</Label>
                        <Select value={currentStatus} onValueChange={setCurrentStatus}>
                            <SelectTrigger id="order-status">
                                <SelectValue placeholder="Set initial status..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">Processing</SelectItem>
                                <SelectItem value="2">Packed</SelectItem>
                                <SelectItem value="3">Dispatched</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label>Student Address</Label>
                        <p className="text-sm p-3 rounded-md bg-muted text-muted-foreground">
                            {`${student.address_line_1 || 'N/A'}, ${student.address_line_2 || ''}, ${student.city || ''}`}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="delivery-notes">Notes (Optional)</Label>
                        <Textarea id="delivery-notes" value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} placeholder="Special instructions..."/>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox 
                            id="remember-settings" 
                            checked={rememberSettings}
                            onCheckedChange={(checked) => setRememberSettings(Boolean(checked))}
                        />
                        <Label htmlFor="remember-settings" className="text-sm font-normal text-muted-foreground">
                            Remember my selections for next entry.
                        </Label>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleCreateOrder} disabled={createOrderMutation.isPending || isLoadingSettings}>
                        {createOrderMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Order
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// Maps numeric status codes to text and color
const getStatusInfo = (status: string | null | undefined): { text: string; variant: "default" | "secondary" | "destructive" } => {
    // This mapping handles the dispatch status.
    // Based on user feedback, these are the only relevant statuses here.
    switch (status) {
        case '1': return { text: 'Processing', variant: 'secondary' };
        case '2': return { text: 'Packed', variant: 'default' };
        case '3': return { text: 'Dispatched', variant: 'default' };
        default: return { text: 'Unknown', variant: 'secondary' };
    }
};

const OrderStatusCell = ({ student, selectedBatch }: { student: StudentInBatch, selectedBatch: Course }) => {
    const { data: deliveryOrders, isLoading, isError } = useQuery<DeliveryOrder[]>({
        queryKey: ['studentDeliveryOrders', student.username],
        queryFn: () => getDeliveryOrdersForStudent(student.username),
        staleTime: 5 * 60 * 1000,
    });
    
    const orderForBatch = useMemo(() => {
        if (!deliveryOrders) return undefined;
        return deliveryOrders.find(order => order.course_code === selectedBatch.courseCode);
    }, [deliveryOrders, selectedBatch.courseCode]);

    if (isLoading) {
        return <Skeleton className="h-6 w-24" />;
    }

    if (isError) {
        return <Badge variant="destructive">Error</Badge>;
    }
    
    if (orderForBatch) {
        const currentStatusInfo = getStatusInfo(orderForBatch.current_status);
        return (
            <div className="flex flex-col items-start gap-1">
                <Badge variant={currentStatusInfo.variant} className={cn(currentStatusInfo.variant === 'default' && 'bg-blue-500 text-white')}>
                    {currentStatusInfo.text}
                </Badge>
                <span className="text-xs text-muted-foreground">{orderForBatch.tracking_number}</span>
            </div>
        );
    }
    
    return <CreateOrderDialog student={student} selectedBatch={selectedBatch} />;
};


const ReceivedStatusCell = ({ student, selectedBatch }: { student: StudentInBatch, selectedBatch: Course }) => {
    const queryClient = useQueryClient();
    
    const { data: deliveryOrders, isLoading, isError } = useQuery<DeliveryOrder[]>({
        queryKey: ['studentDeliveryOrders', student.username],
        queryFn: () => getDeliveryOrdersForStudent(student.username),
        staleTime: 5 * 60 * 1000,
    });
    
    const orderForBatch = useMemo(() => {
        if (!deliveryOrders) return undefined;
        return deliveryOrders.find(order => order.course_code === selectedBatch.courseCode);
    }, [deliveryOrders, selectedBatch.courseCode]);

    const updateStatusMutation = useMutation({
        mutationFn: ({ orderId, status }: { orderId: string, status: "Received" | "Not Received" }) => updateDeliveryOrderStatus(orderId, status),
        onSuccess: (data, variables) => {
            toast({ title: 'Status Updated', description: `Order for ${student.full_name} marked as ${variables.status}.` });
            queryClient.invalidateQueries({ queryKey: ['studentDeliveryOrders', student.username] });
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        }
    });

    if (isLoading || !orderForBatch) {
        return <span className="text-xs text-muted-foreground">--</span>;
    }
    
    if (isError) {
        return <Badge variant="outline">Error</Badge>;
    }

    if (orderForBatch.order_recived_status !== "Not Received") {
        return (
            <div className="flex flex-col items-start gap-2">
                <Badge variant="default" className="bg-green-500 text-white">
                    {orderForBatch.order_recived_status}
                </Badge>
                {orderForBatch.received_date && (
                    <span className="text-xs text-muted-foreground">{format(new Date(orderForBatch.received_date), 'yyyy-MM-dd')}</span>
                )}
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button size="xs" variant="ghost" className="h-auto p-1 text-xs text-muted-foreground" disabled={updateStatusMutation.isPending}>
                            Revert
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Revert Status?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to change the status for {student.full_name} back to "Not Received"?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => updateStatusMutation.mutate({ orderId: orderForBatch.id, status: 'Not Received' })}>
                                Confirm Revert
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        );
    }

    return (
         <div className="flex flex-col items-start gap-2">
            <Badge variant="secondary">{orderForBatch.order_recived_status || "Not yet received"}</Badge>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" disabled={updateStatusMutation.isPending}>
                        Mark as Received
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Reception</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to mark this order for {student.full_name} as "Received"? This action can be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => updateStatusMutation.mutate({ orderId: orderForBatch.id, status: 'Received' })}>
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};


// --- Main Page Component ---
export default function BatchDeliveryOrdersPage() {
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [dispatchStatusFilter, setDispatchStatusFilter] = useState('all');
    const [receivedStatusFilter, setReceivedStatusFilter] = useState('all');
    const [ordersData, setOrdersData] = useState<Record<string, DeliveryOrder | null>>({});

    const { data: courses, isLoading: isLoadingCourses } = useQuery<Course[]>({
        queryKey: ['allCourses'],
        queryFn: getCourses,
        staleTime: Infinity,
    });

    const selectedCourse = useMemo(() => {
        return courses?.find(c => c.id === selectedCourseId);
    }, [courses, selectedCourseId]);

    const { data: students, isLoading: isLoadingStudents, isError, error } = useQuery<StudentInBatch[]>({
        queryKey: ['studentsByCourse', selectedCourse?.courseCode],
        queryFn: () => getStudentsByCourseCode(selectedCourse!.courseCode),
        enabled: !!selectedCourse?.courseCode,
    });
    
    // Fetch all orders for the students in the current batch
    useEffect(() => {
        if (students) {
            const studentUsernames = students.map(s => s.username);
            studentUsernames.forEach(username => {
                getDeliveryOrdersForStudent(username).then(orders => {
                    const orderForBatch = orders.find(o => o.course_code === selectedCourse?.courseCode);
                    setOrdersData(prev => ({ ...prev, [username]: orderForBatch || null }));
                });
            });
        }
    }, [students, selectedCourse?.courseCode]);


    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCourseId, searchTerm, dispatchStatusFilter, receivedStatusFilter]);
    
    const { filteredStudents, counts } = useMemo(() => {
        if (!students) return { filteredStudents: [], counts: { processing: 0, packed: 0, dispatched: 0, received: 0, notReceived: 0, noOrder: 0 }};

        let processing = 0, packed = 0, dispatched = 0, received = 0, notReceived = 0, noOrder = 0;

        students.forEach(student => {
            const order = ordersData[student.username];
            if (order) {
                if (order.current_status === '1') processing++;
                if (order.current_status === '2') packed++;
                if (order.current_status === '3') dispatched++;
                if (order.order_recived_status === 'Received') received++;
                else notReceived++;
            } else {
                noOrder++;
            }
        });

        const filterLogic = (student: StudentInBatch) => {
            const lowercasedFilter = searchTerm.toLowerCase();
            const order = ordersData[student.username];

            const matchesSearch = !searchTerm ||
                (student.username?.toLowerCase() || '').includes(lowercasedFilter) ||
                (student.full_name?.toLowerCase() || '').includes(lowercasedFilter);

            const matchesDispatchStatus = dispatchStatusFilter === 'all' ||
                (dispatchStatusFilter === 'no_order' && !order) ||
                (order && order.current_status === dispatchStatusFilter);

            const matchesReceivedStatus = receivedStatusFilter === 'all' ||
                (receivedStatusFilter === 'Received' && order?.order_recived_status === 'Received') ||
                (receivedStatusFilter === 'Not Received' && (!order || order.order_recived_status !== 'Received'));

            return matchesSearch && matchesDispatchStatus && matchesReceivedStatus;
        };
        
        const filtered = students.filter(filterLogic);

        return {
            filteredStudents: filtered,
            counts: { processing, packed, dispatched, received, notReceived, noOrder }
        };

    }, [students, searchTerm, dispatchStatusFilter, receivedStatusFilter, ordersData]);

    const totalPages = Math.ceil((filteredStudents?.length || 0) / ITEMS_PER_PAGE);
    const paginatedStudents = useMemo(() => {
        if (!filteredStudents) return [];
        return filteredStudents.slice(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE
        );
    }, [filteredStudents, currentPage]);
    
    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <h1 className="text-3xl font-headline font-semibold">Batch Delivery Orders</h1>
                <p className="text-muted-foreground">Select a batch to view student delivery status.</p>
            </header>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Select Batch</CardTitle>
                </CardHeader>
                <CardContent>
                    <Select value={selectedCourseId} onValueChange={setSelectedCourseId} disabled={isLoadingCourses}>
                        <SelectTrigger className="w-full md:w-1/2">
                            <SelectValue placeholder={isLoadingCourses ? "Loading batches..." : "Choose a batch to load students..."} />
                        </SelectTrigger>
                        <SelectContent>
                            {courses?.map(course => (
                                <SelectItem key={course.id} value={course.id}>
                                    {course.name} ({course.courseCode})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {selectedCourse && (
                <>
                 <Card>
                    <CardHeader><CardTitle>Batch Overview</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <Card><CardHeader className="pb-2"><CardDescription>Processing</CardDescription></CardHeader><CardContent><p className="text-2xl font-bold flex items-center gap-2"><Package className="h-6 w-6 text-muted-foreground"/> {counts.processing}</p></CardContent></Card>
                        <Card><CardHeader className="pb-2"><CardDescription>Packed</CardDescription></CardHeader><CardContent><p className="text-2xl font-bold flex items-center gap-2"><Package className="h-6 w-6 text-muted-foreground"/> {counts.packed}</p></CardContent></Card>
                        <Card><CardHeader className="pb-2"><CardDescription>Dispatched</CardDescription></CardHeader><CardContent><p className="text-2xl font-bold flex items-center gap-2"><Truck className="h-6 w-6 text-muted-foreground"/> {counts.dispatched}</p></CardContent></Card>
                        <Card><CardHeader className="pb-2"><CardDescription>Received</CardDescription></CardHeader><CardContent><p className="text-2xl font-bold flex items-center gap-2"><ThumbsUp className="h-6 w-6 text-muted-foreground"/> {counts.received}</p></CardContent></Card>
                        <Card><CardHeader className="pb-2"><CardDescription>No Order</CardDescription></CardHeader><CardContent><p className="text-2xl font-bold flex items-center gap-2"><PlusCircle className="h-6 w-6 text-muted-foreground"/> {counts.noOrder}</p></CardContent></Card>
                    </CardContent>
                 </Card>

                 <Card className="shadow-lg">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <div>
                                <CardTitle>Students in {selectedCourse.name}</CardTitle>
                                <CardDescription>
                                     {isLoadingStudents ? "Loading..." : `Showing ${paginatedStudents.length} of ${filteredStudents.length} students.`}
                                </CardDescription>
                            </div>
                            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                                <div className="relative w-full md:w-auto flex-grow">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search student or ID..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 w-full"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                     <Select value={dispatchStatusFilter} onValueChange={setDispatchStatusFilter}>
                                        <SelectTrigger><SelectValue placeholder="Filter by dispatch status" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Dispatch Statuses</SelectItem>
                                            <SelectItem value="1">Processing</SelectItem>
                                            <SelectItem value="2">Packed</SelectItem>
                                            <SelectItem value="3">Dispatched</SelectItem>
                                            <SelectItem value="no_order">No Order</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={receivedStatusFilter} onValueChange={setReceivedStatusFilter}>
                                        <SelectTrigger><SelectValue placeholder="Filter by received status" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Received Statuses</SelectItem>
                                            <SelectItem value="Received">Received</SelectItem>
                                            <SelectItem value="Not Received">Not Received</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoadingStudents && (
                            <div className="space-y-2">
                                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                            </div>
                        )}
                        {isError && (
                             <Card className="border-destructive">
                                <CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle /> Error Loading Students</CardTitle></CardHeader>
                                <CardContent><p>{error?.message}</p></CardContent>
                            </Card>
                        )}
                        {!isLoadingStudents && !isError && (
                            <>
                                {/* Desktop Table */}
                                <div className="relative w-full overflow-auto border rounded-lg hidden md:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Student ID</TableHead>
                                                <TableHead>Full Name</TableHead>
                                                <TableHead>Dispatch Status</TableHead>
                                                <TableHead>Received Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedStudents.length > 0 ? paginatedStudents.map(student => (
                                                <TableRow key={student.student_course_id}>
                                                    <TableCell className="font-medium">{student.username}</TableCell>
                                                    <TableCell>{student.full_name}</TableCell>
                                                    <TableCell>
                                                        <OrderStatusCell 
                                                            student={student} 
                                                            selectedBatch={selectedCourse!} 
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <ReceivedStatusCell
                                                            student={student}
                                                            selectedBatch={selectedCourse!}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center h-24">
                                                        No students found matching your search.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                
                                {/* Mobile List */}
                                <div className="md:hidden space-y-4">
                                    {paginatedStudents.length > 0 ? paginatedStudents.map(student => (
                                        <div key={student.student_course_id} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                                            <div>
                                                <p className="font-bold">{student.full_name}</p>
                                                <p className="text-sm text-muted-foreground">{student.username}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                                                <div>
                                                    <p className="text-xs font-semibold text-muted-foreground mb-1">Dispatch Status</p>
                                                    <OrderStatusCell 
                                                        student={student} 
                                                        selectedBatch={selectedCourse!} 
                                                    />
                                                </div>
                                                <div>
                                                     <p className="text-xs font-semibold text-muted-foreground mb-1">Received Status</p>
                                                    <ReceivedStatusCell
                                                        student={student}
                                                        selectedBatch={selectedCourse!}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center h-24 flex items-center justify-center">
                                            <p>No students found matching your search.</p>
                                        </div>
                                    )}
                                </div>
                            </>
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
                </>
            )}
        </div>
    );
}

