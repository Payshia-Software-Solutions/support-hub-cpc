
"use client";

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Search, PlusCircle, Edit, Trash2, BookOpen, AlertTriangle, Loader2 } from 'lucide-react';
import { getBatches, createBatch, updateBatch, deleteBatch, getParentCourseList } from '@/lib/api';
import type { Batch, ParentCourse } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useSearchParams } from 'next/navigation';


const batchFormSchema = z.object({
    name: z.string().min(3, "Batch name must be at least 3 characters."),
    parent_course_id: z.string().min(1, "Parent course is required."),
    courseCode: z.string().min(1, "Batch code is required."),
    fee: z.coerce.number().min(0, "Fee must be a positive number."),
    registration_fee: z.coerce.number().min(0, "Registration fee must be a positive number."),
    duration: z.string().min(1, "Duration is required."),
    enroll_key: z.string().optional(),
    description: z.string().optional(),
    mini_description: z.string().optional(),
    certification: z.string().optional(),
    course_img: z.string().optional(),
});

type BatchFormValues = z.infer<typeof batchFormSchema>;

const BatchForm = ({ batch, onClose }: { batch?: Batch | null; onClose: () => void; }) => {
    const queryClient = useQueryClient();
    const { data: parentCourses, isLoading: isLoadingParentCourses } = useQuery<ParentCourse[]>({
        queryKey: ['parentCourseList'],
        queryFn: getParentCourseList,
    });

    const form = useForm<BatchFormValues>({
        resolver: zodResolver(batchFormSchema),
        defaultValues: {
            name: batch?.name || '',
            parent_course_id: batch?.parent_course_id || '',
            courseCode: batch?.courseCode || '',
            fee: batch ? parseFloat(batch.fee) : 0,
            registration_fee: batch ? parseFloat(batch.registration_fee) : 0,
            duration: batch?.duration || '',
            enroll_key: batch?.enroll_key || '',
            description: batch?.description || '',
            mini_description: batch?.mini_description || '',
            certification: batch?.certification || '',
            course_img: batch?.course_img || '',
        }
    });
    
    useEffect(() => {
        if(batch) {
            form.reset({
                ...batch,
                fee: parseFloat(batch.fee),
                registration_fee: parseFloat(batch.registration_fee),
            });
        } else {
             form.reset({
                name: '',
                parent_course_id: '',
                courseCode: '',
                fee: 0,
                registration_fee: 0,
                duration: '',
                enroll_key: '',
                description: '',
                mini_description: '',
                certification: '',
                course_img: '',
            });
        }
    }, [batch, form]);

    const batchMutation = useMutation({
        mutationFn: (data: BatchFormValues) => {
            const apiData = {
                ...data,
                fee: String(data.fee),
                registration_fee: String(data.registration_fee)
            };
            if (batch?.id) {
                return updateBatch(batch.id, apiData);
            }
            return createBatch(apiData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allBatches'] });
            toast({ title: 'Success', description: `Batch ${batch ? 'updated' : 'created'} successfully.` });
            onClose();
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    });
    
    const onSubmit = (data: BatchFormValues) => {
        batchMutation.mutate(data);
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto p-1 pr-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Batch Name</Label>
                    <Input id="name" {...form.register('name')} />
                    {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="parent_course_id">Parent Course</Label>
                    <Controller
                        name="parent_course_id"
                        control={form.control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingParentCourses}>
                                <SelectTrigger><SelectValue placeholder="Select a parent course..."/></SelectTrigger>
                                <SelectContent>
                                    {parentCourses?.map(pc => <SelectItem key={pc.id} value={pc.id}>{pc.course_name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {form.formState.errors.parent_course_id && <p className="text-sm text-destructive">{form.formState.errors.parent_course_id.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="courseCode">Batch Code</Label>
                    <Input id="courseCode" {...form.register('courseCode')} />
                    {form.formState.errors.courseCode && <p className="text-sm text-destructive">{form.formState.errors.courseCode.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Input id="duration" {...form.register('duration')} />
                    {form.formState.errors.duration && <p className="text-sm text-destructive">{form.formState.errors.duration.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="fee">Batch Fee (LKR)</Label>
                    <Input id="fee" type="number" step="0.01" {...form.register('fee')} />
                    {form.formState.errors.fee && <p className="text-sm text-destructive">{form.formState.errors.fee.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="registration_fee">Registration Fee (LKR)</Label>
                    <Input id="registration_fee" type="number" step="0.01" {...form.register('registration_fee')} />
                    {form.formState.errors.registration_fee && <p className="text-sm text-destructive">{form.formState.errors.registration_fee.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="enroll_key">Enrollment Key</Label>
                    <Input id="enroll_key" {...form.register('enroll_key')} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="course_img">Course Image Filename</Label>
                    <Input id="course_img" {...form.register('course_img')} placeholder="e.g., image.jpg" />
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="description">Full Description</Label>
                <Textarea id="description" {...form.register('description')} rows={5} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="mini_description">Mini Description</Label>
                <Textarea id="mini_description" {...form.register('mini_description')} rows={2} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="certification">Certification Details</Label>
                <Textarea id="certification" {...form.register('certification')} rows={2} />
            </div>
            <DialogFooter className="sticky bottom-0 bg-background pt-4">
                <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={batchMutation.isPending}>Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={batchMutation.isPending}>
                    {batchMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {batch ? "Save Changes" : "Create Batch"}
                </Button>
            </DialogFooter>
        </form>
    );
};


function ManageBatchesPageComponent() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
    const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null);
    
    const searchParams = useSearchParams();
    const courseIdFilter = searchParams.get('courseId');

    const { data: batches, isLoading, isError, error } = useQuery<Batch[]>({
        queryKey: ['allBatches'],
        queryFn: getBatches,
        staleTime: 1000 * 60 * 5,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteBatch,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allBatches'] });
            toast({ title: 'Success', description: 'Batch deleted successfully.' });
            setBatchToDelete(null);
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
            setBatchToDelete(null);
        }
    });

    const handleCreate = () => {
        setSelectedBatch(null);
        setIsFormOpen(true);
    };

    const handleEdit = (batch: Batch) => {
        setSelectedBatch(batch);
        setIsFormOpen(true);
    };

    const filteredBatches = useMemo(() => {
        if (!batches) return [];
        let filtered = batches;

        if (courseIdFilter) {
            filtered = filtered.filter(batch => batch.parent_course_id === courseIdFilter);
        }

        const lowercasedFilter = searchTerm.toLowerCase();
        if (!lowercasedFilter) return filtered;
        
        return filtered.filter(batch =>
            batch.name.toLowerCase().includes(lowercasedFilter) ||
            batch.courseCode.toLowerCase().includes(lowercasedFilter)
        );
    }, [batches, searchTerm, courseIdFilter]);

    if (isError) {
        return (
            <div className="p-4 md:p-8">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>An Error Occurred</AlertTitle>
                    <AlertDescription>{error?.message}</AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
             <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{selectedBatch ? "Edit" : "Create"} Batch</DialogTitle>
                        <DialogDescription>
                           {selectedBatch ? "Modify the existing batch details." : "Fill in the details for a new batch."}
                        </DialogDescription>
                    </DialogHeader>
                    <BatchForm batch={selectedBatch} onClose={() => setIsFormOpen(false)} />
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!batchToDelete} onOpenChange={() => setBatchToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the batch "{batchToDelete?.name}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(batchToDelete!.id)} disabled={deleteMutation.isPending}>
                             {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>


            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-headline font-semibold">Manage Batches</h1>
                    <p className="text-muted-foreground">View, add, and edit batch information.</p>
                </div>
                <Button onClick={handleCreate}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Batch
                </Button>
            </header>
            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <CardTitle>All Batches</CardTitle>
                             <CardDescription>
                                {isLoading ? "Loading..." : `${filteredBatches.length} batches found.`}
                            </CardDescription>
                        </div>
                         <div className="relative w-full md:w-auto md:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                           <Skeleton className="h-12 w-full" />
                           <Skeleton className="h-12 w-full" />
                           <Skeleton className="h-12 w-full" />
                        </div>
                    ) : (
                        <div className="relative w-full overflow-auto border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Batch Name</TableHead>
                                        <TableHead>Batch Code</TableHead>
                                        <TableHead>Batch Fee (LKR)</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredBatches.length > 0 ? filteredBatches.map((batch) => (
                                        <TableRow key={batch.id}>
                                            <TableCell className="font-medium">{batch.name}</TableCell>
                                            <TableCell>{batch.courseCode}</TableCell>
                                            <TableCell>{parseFloat(batch.fee).toFixed(2)}</TableCell>
                                            <TableCell className="text-right">
                                               <Button variant="ghost" size="icon" onClick={() => handleEdit(batch)}><Edit className="h-4 w-4"/></Button>
                                               <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setBatchToDelete(batch)}><Trash2 className="h-4 w-4"/></Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24">
                                                No batches found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}


export default function ManageBatchesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ManageBatchesPageComponent />
        </Suspense>
    );
}
