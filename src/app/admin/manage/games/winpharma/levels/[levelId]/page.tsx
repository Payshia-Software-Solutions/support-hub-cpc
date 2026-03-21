"use client";

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent,SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, PlusCircle, Edit, Trash2, Loader2, AlertTriangle, Search, ImageIcon, Layout, Code } from "lucide-react";
import Image from 'next/image';
import { getWinPharmaTasks, createWinPharmaTask, updateWinPharmaTask, deleteWinPharmaTask, getWinPharmaLevelById } from '@/lib/actions/games';
import type { WinPharmaTask, WinPharmaLevel } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const CONTENT_PROVIDER_BASE_URL = 'https://content-provider.pharmacollege.lk';

const taskFormSchema = z.object({
  resource_title: z.string().min(3, 'Title must be at least 3 characters.'),
  task_cover: z.any().optional(),
  resource_data: z.string().min(1, 'Resource data (Content/HTML) is required.'),
  is_active: z.number(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

const TaskForm = ({ task, onSave, onClose, isSaving }: { task?: WinPharmaTask | null; onSave: (data: TaskFormValues) => void; onClose: () => void; isSaving: boolean }) => {
    
    const form = useForm<TaskFormValues>({
        resolver: zodResolver(taskFormSchema),
        defaultValues: {
            resource_title: task?.resource_title || '',
            task_cover: null,
            resource_data: task?.resource_data || '',
            is_active: task ? Number(task.is_active) : 1,
        }
    });

    const isActiveValue = form.watch('is_active');

    const onSubmit = (data: TaskFormValues) => {
        onSave(data);
    };

    const onError = (errors: any) => {
        console.error('Task Validation Errors:', errors);
        toast({ variant: 'destructive', title: 'Validation Failed', description: 'Please check the fields.' });
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="resource_title">Resource Title</Label>
                <Input id="resource_title" {...form.register('resource_title')} placeholder="e.g. Introduction to Pharmacology" />
                {form.formState.errors.resource_title && <p className="text-sm text-destructive">{form.formState.errors.resource_title.message}</p>}
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="task_cover">Cover Image (Task Cover)</Label>
                <Input id="task_cover" type="file" {...form.register('task_cover')} accept="image/*" />
                {task?.task_cover && (
                    <div className="mt-1 text-[10px] text-muted-foreground flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        Current: <a href={`${CONTENT_PROVIDER_BASE_URL}/${task.task_cover}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[200px]">{task.task_cover}</a>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="resource_data">Resource Data (HTML / Video Embed / Content)</Label>
                <Textarea 
                    id="resource_data" 
                    {...form.register('resource_data')} 
                    placeholder="Paste HTML, Iframe, or content here..." 
                    className="font-mono text-xs min-h-[150px]"
                />
                {form.formState.errors.resource_data && <p className="text-sm text-destructive">{form.formState.errors.resource_data.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="is_active">Status</Label>
                <Select onValueChange={(val) => form.setValue('is_active', parseInt(val))} defaultValue={isActiveValue.toString()}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">Active</SelectItem>
                        <SelectItem value="0">Inactive</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <DialogFooter className="pt-4">
                <DialogClose asChild><Button variant="outline" disabled={isSaving}>Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {task ? 'Save Changes' : 'Create Resource'}
                </Button>
            </DialogFooter>
        </form>
    );
};

export default function ManageWinPharmaLevelTasksPage() {
    const router = useRouter();
    const params = useParams();
    const levelId = params.levelId as string;
    const queryClient = useQueryClient();
    const { user } = useAuth();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<WinPharmaTask | null>(null);
    const [taskToDelete, setTaskToDelete] = useState<WinPharmaTask | null>(null);

    const { data: level } = useQuery<WinPharmaLevel>({
        queryKey: ['winPharmaLevel', levelId],
        queryFn: () => getWinPharmaLevelById(levelId),
        enabled: !!levelId,
    });

    const { data: tasks = [], isLoading, isError, error } = useQuery<WinPharmaTask[]>({
        queryKey: ['winPharmaTasks', levelId],
        queryFn: () => getWinPharmaTasks(levelId),
        enabled: !!levelId,
    });

    const createMutation = useMutation({
        mutationFn: createWinPharmaTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['winPharmaTasks', levelId] });
            toast({ title: "Resource Created", description: "The new resource has been added to this level." });
            setIsFormOpen(false);
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Create Failed', description: err.message }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, formData }: { id: string, formData: FormData }) => updateWinPharmaTask(id, formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['winPharmaTasks', levelId] });
            toast({ title: "Resource Updated", description: "The resource details have been updated." });
            setIsFormOpen(false);
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Update Failed', description: err.message }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteWinPharmaTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['winPharmaTasks', levelId] });
            toast({ title: 'Resource Deleted' });
            setTaskToDelete(null);
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Delete Failed', description: err.message }),
    });
    
    const filteredTasks = useMemo(() => {
        if (!tasks) return [];
        return tasks.filter(task => task.resource_title.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [tasks, searchTerm]);

    const handleCreate = () => {
        setSelectedTask(null);
        setIsFormOpen(true);
    };

    const handleEdit = (task: WinPharmaTask) => {
        setSelectedTask(task);
        setIsFormOpen(true);
    };

    const handleSave = (data: TaskFormValues) => {
        if (!user?.username) return;

        const formData = new FormData();
        formData.append('level_id', levelId);
        formData.append('resource_title', data.resource_title);
        formData.append('resource_data', data.resource_data);
        formData.append('created_by', user.username);
        formData.append('is_active', data.is_active.toString());
        
        if (data.task_cover?.[0]) {
            formData.append('task_cover', data.task_cover[0]);
        }

        if (selectedTask) {
            const id = selectedTask.resource_id || selectedTask.id;
            updateMutation.mutate({ id: id!, formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedTask ? 'Edit' : 'Create'} WinPharma Resource</DialogTitle>
                        <DialogDescription>
                            Configure the resource details for {level?.level_name || 'this level'}.
                        </DialogDescription>
                    </DialogHeader>
                    <TaskForm 
                        task={selectedTask} 
                        onClose={() => setIsFormOpen(false)} 
                        onSave={handleSave} 
                        isSaving={isMutating} 
                    />
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete "{taskToDelete?.resource_title}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isMutating}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(taskToDelete!.resource_id || taskToDelete!.id!)} disabled={isMutating}>
                             {isMutating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <Button variant="ghost" onClick={() => router.push('/admin/manage/games/winpharma/levels')} className="-ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Levels
                    </Button>
                    <h1 className="text-3xl font-headline font-semibold mt-2">
                        {level ? `${level.level_name}: Resources` : 'Manage Level Resources'}
                    </h1>
                    <p className="text-muted-foreground">Add and configure resources for this specific game level.</p>
                </div>
                <Button onClick={handleCreate}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Resource
                </Button>
            </header>

            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <CardTitle>Resources List</CardTitle>
                        <div className="relative w-full md:max-w-xs">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                           <Input 
                                placeholder="Search resources..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                           />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
                        </div>
                    ) : isError ? (
                        <div className="text-center py-10 text-destructive">
                            <AlertTriangle className="h-10 w-10 mx-auto mb-4" />
                            <p>Error loading resources: {error.message}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredTasks.length > 0 ? filteredTasks.map(task => {
                                const id = task.resource_id || task.id;
                                return (
                                <Card key={id} className="flex flex-col overflow-hidden group hover:border-primary transition-all">
                                    <div className="relative w-full h-40 bg-muted flex items-center justify-center overflow-hidden">
                                        {task.task_cover ? (
                                            <Image 
                                                src={`${CONTENT_PROVIDER_BASE_URL}/${task.task_cover}`} 
                                                alt={task.resource_title} 
                                                layout="fill" 
                                                objectFit="cover" 
                                                className="group-hover:scale-105 transition-transform"
                                            />
                                        ) : (
                                            <div className="text-center">
                                                <ImageIcon className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                                                <p className="text-[10px] text-muted-foreground mt-1">No Cover Image</p>
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/50 text-white text-[10px] backdrop-blur-sm">
                                            ID: {id}
                                        </div>
                                        <div className="absolute bottom-2 left-2">
                                            {Number(task.is_active) === 1 ? (
                                                <span className="px-1.5 py-0.5 rounded bg-green-500/80 text-white text-[9px] font-bold uppercase backdrop-blur-sm">Active</span>
                                            ) : (
                                                <span className="px-1.5 py-0.5 rounded bg-gray-500/80 text-white text-[9px] font-bold uppercase backdrop-blur-sm">Inactive</span>
                                            )}
                                        </div>
                                    </div>
                                    <CardHeader className="p-4">
                                        <CardTitle className="text-base line-clamp-1">{task.resource_title}</CardTitle>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <Code className="h-3 w-3 text-muted-foreground" />
                                            <CardDescription className="text-[10px] line-clamp-1">HTML Content: {task.resource_data ? 'Present' : 'Empty'}</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardFooter className="p-4 border-t mt-auto">
                                        <div className="flex justify-end w-full gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(task)}><Edit className="h-4 w-4"/></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setTaskToDelete(task)}><Trash2 className="h-4 w-4"/></Button>
                                        </div>
                                    </CardFooter>
                                </Card>
                            )}) : (
                                <div className="col-span-full text-center py-10 text-muted-foreground">
                                    <Layout className="mx-auto h-12 w-12 opacity-20" />
                                    <h3 className="mt-4 text-lg font-semibold">No Resources Found</h3>
                                    <p>Click "Add New Resource" to create the first one for this level.</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
