
"use client";

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Loader2, PlusCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getStudentsByBatch, createDeliveryOrderForStudent, getDeliveryOrdersForStudent } from '@/lib/api';
import type { StudentInBatch, DeliveryOrder, Course } from '@/lib/types';
import { dummyCourses } from '@/lib/dummy-data';

// --- Sub-components for actions ---

const CreateOrderDialog = ({ student, selectedBatch }: { student: StudentInBatch, selectedBatch: Course }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [deliveryTitle, setDeliveryTitle] = useState(`${selectedBatch.name} Study Pack`);
    const [deliveryNotes, setDeliveryNotes] = useState('');
    const queryClient = useQueryClient();

    const createOrderMutation = useMutation({
        mutationFn: createDeliveryOrderForStudent,
        onSuccess: () => {
            toast({
                title: 'Order Created!',
                description: `A new delivery order for ${student.full_name} has been created.`,
            });
            // Refetch the delivery orders for this student to update the UI
            queryClient.invalidateQueries({ queryKey: ['studentDeliveryOrders', student.username] });
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
        if (!deliveryTitle.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Delivery title is required.' });
            return;
        }

        createOrderMutation.mutate({
            studentNumber: student.username,
            courseCode: selectedBatch.courseCode,
            title: deliveryTitle,
            notes: deliveryNotes,
            // These would come from student details in a real scenario
            address: `${student.address_line_1 || ''}, ${student.city || ''}`,
            fullName: student.full_name,
            phone: student.telephone_1,
        });
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="default" size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Order
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New Delivery for {student.full_name}</DialogTitle>
                    <DialogDescription>
                        Confirm the details for this new delivery order. The address is pre-filled from the student's profile.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="delivery-title">Delivery Title</Label>
                        <Input id="delivery-title" value={deliveryTitle} onChange={(e) => setDeliveryTitle(e.target.value)} />
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
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleCreateOrder} disabled={createOrderMutation.isPending}>
                        {createOrderMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Order
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const OrderStatusCell = ({ student, selectedBatch }: { student: StudentInBatch, selectedBatch: Course }) => {
    const { data: deliveryOrders, isLoading, isError } = useQuery<DeliveryOrder[]>({
        queryKey: ['studentDeliveryOrders', student.username],
        queryFn: () => getDeliveryOrdersForStudent(student.username),
        staleTime: 5 * 60 * 1000,
    });
    
    // Check if there is an order for the selected batch's course code
    const orderForBatch = deliveryOrders?.find(order => order.course_code === selectedBatch.courseCode);

    if (isLoading) {
        return <Skeleton className="h-6 w-24" />;
    }

    if (isError) {
        return <Badge variant="destructive">Error</Badge>;
    }

    if (orderForBatch) {
        return (
            <div className="flex flex-col items-start gap-1">
                <span className="font-semibold">{orderForBatch.delivery_id}</span>
                <span className="text-xs text-muted-foreground">{orderForBatch.tracking_number}</span>
            </div>
        );
    }
    
    return <CreateOrderDialog student={student} selectedBatch={selectedBatch} />;
};


// --- Main Page Component ---
export default function BatchDeliveryOrdersPage() {
    const [selectedBatchId, setSelectedBatchId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');

    const { data: students, isLoading: isLoadingStudents, isError, error } = useQuery<StudentInBatch[]>({
        queryKey: ['studentsByBatch', selectedBatchId],
        queryFn: () => getStudentsByBatch(selectedBatchId),
        enabled: !!selectedBatchId,
    });

    const filteredStudents = useMemo(() => {
        if (!students) return [];
        const lowercasedFilter = searchTerm.toLowerCase();
        if (!lowercasedFilter) return students;
        return students.filter(student =>
            student.username.toLowerCase().includes(lowercasedFilter) ||
            student.full_name.toLowerCase().includes(lowercasedFilter)
        );
    }, [students, searchTerm]);
    
    const selectedBatch = dummyCourses.find(c => c.id === selectedBatchId);

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
                    <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                        <SelectTrigger className="w-full md:w-1/2">
                            <SelectValue placeholder="Choose a batch to load students..." />
                        </SelectTrigger>
                        <SelectContent>
                            {dummyCourses.map(course => (
                                <SelectItem key={course.id} value={course.id}>
                                    {course.name} ({course.courseCode})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {selectedBatch && (
                 <Card className="shadow-lg">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <div>
                                <CardTitle>Students in {selectedBatch.name}</CardTitle>
                                <CardDescription>
                                    Showing {filteredStudents.length} of {students?.length || 0} students.
                                </CardDescription>
                            </div>
                            <div className="relative w-full sm:w-auto sm:max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search student or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
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
                            <div className="relative w-full overflow-auto border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student ID</TableHead>
                                            <TableHead>Full Name</TableHead>
                                            <TableHead>Delivery Order Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredStudents.length > 0 ? filteredStudents.map(student => (
                                            <TableRow key={student.id}>
                                                <TableCell className="font-medium">{student.username}</TableCell>
                                                <TableCell>{student.full_name}</TableCell>
                                                <TableCell>
                                                    <OrderStatusCell student={student} selectedBatch={selectedBatch!} />
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center h-24">
                                                    No students found matching your search.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                 </Card>
            )}
        </div>
    );
}

