"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent,SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, PlusCircle, Edit, Trash2, Loader2, Layers, ArrowRight, AlertTriangle, Calendar, Filter } from "lucide-react";
import Link from 'next/link';
import { getWinPharmaLevelsByCourse, createWinPharmaLevel, updateWinPharmaLevel, deleteWinPharmaLevel } from '@/lib/actions/games';
import { getCourses } from '@/lib/actions/courses';
import type { WinPharmaLevel, Course } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

// --- Form Schema ---
const levelFormSchema = z.object({
  course_code: z.string().min(1, 'Please select a course.'),
  level_name: z.string().min(3, 'Level name must be at least 3 characters.'),
  is_active: z.number(),
});

type LevelFormValues = z.infer<typeof levelFormSchema>;

// --- Form Component ---
const LevelForm = ({ level, courses, onSave, onClose, isSaving }: { level?: WinPharmaLevel | null; courses: Course[]; onSave: (data: LevelFormValues) => void; onClose: () => void; isSaving: boolean }) => {
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<LevelFormValues>({
        resolver: zodResolver(levelFormSchema),
        defaultValues: {
            course_code: level?.course_code || '',
            level_name: level?.level_name || '',
            is_active: level ? Number(level.is_active) : 1,
        }
    });

    const selectedCourseCode = watch('course_code');
    const isActiveValue = watch('is_active');

    const onError = (errors: any) => {
        console.error('Form Validation Errors:', errors);
        toast({ 
            variant: 'destructive', 
            title: 'Validation Failed', 
            description: 'Please correct the errors before saving.' 
        });
    };

    return (
        <form onSubmit={handleSubmit(onSave, onError)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="course_code">Associated Course</Label>
                <Select onValueChange={(val) => setValue('course_code', val)} defaultValue={selectedCourseCode}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                        {courses.map(course => (
                            <SelectItem key={course.courseCode} value={course.courseCode}>
                                {course.name} ({course.courseCode})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.course_code && <p className="text-sm text-destructive">{errors.course_code.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="level_name">Level Name</Label>
                <Input id="level_name" {...register('level_name')} placeholder="e.g. Level 1" />
                {errors.level_name && <p className="text-sm text-destructive">{errors.level_name.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="is_active">Status</Label>
                <Select onValueChange={(val) => setValue('is_active', parseInt(val))} defaultValue={isActiveValue.toString()}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">Active</SelectItem>
                        <SelectItem value="0">Inactive</SelectItem>
                    </SelectContent>
                </Select>
                {errors.is_active && <p className="text-sm text-destructive">{errors.is_active.message}</p>}
            </div>

            <DialogFooter className="pt-4">
                <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {level ? 'Save Changes' : 'Create Level'}
                </Button>
            </DialogFooter>
        </form>
    );
};

// --- Main Page Component ---
export default function ManageWinPharmaLevelsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    
    const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState<WinPharmaLevel | null>(null);
    const [levelToDelete, setLevelToDelete] = useState<WinPharmaLevel | null>(null);

    const { data: courses = [], isLoading: isLoadingCourses } = useQuery<Course[]>({
        queryKey: ['courses'],
        queryFn: getCourses,
    });

    const { data: levels = [], isLoading, isError, error } = useQuery<WinPharmaLevel[]>({
        queryKey: ['winPharmaLevels', selectedCourseFilter],
        queryFn: () => getWinPharmaLevelsByCourse(selectedCourseFilter),
        enabled: selectedCourseFilter !== 'all',
    });

    const createMutation = useMutation({
        mutationFn: createWinPharmaLevel,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['winPharmaLevels'] });
            toast({ title: "Level Created", description: "The new level has been added to WinPharma." });
            setIsFormOpen(false);
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Create Failed', description: err.message }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: LevelFormValues & { created_at?: string; created_by?: string } }) => updateWinPharmaLevel(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['winPharmaLevels'] });
            toast({ title: "Level Updated", description: "The level details have been updated." });
            setIsFormOpen(false);
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Update Failed', description: err.message }),
    });


    const deleteMutation = useMutation({
        mutationFn: deleteWinPharmaLevel,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['winPharmaLevels'] });
            toast({ title: "Level Deleted" });
            setLevelToDelete(null);
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Delete Failed', description: err.message }),
    });

    const handleCreate = () => {
        setSelectedLevel(null);
        setIsFormOpen(true);
    };

    const handleEdit = (level: WinPharmaLevel) => {
        setSelectedLevel(level);
        setIsFormOpen(true);
    };

    const handleSave = (data: LevelFormValues) => {
        const now = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
        if (selectedLevel) {
            const id = selectedLevel.id || selectedLevel.level_id;
            if (!id) {
                toast({ variant: 'destructive', title: 'Update Error', description: 'Could not find level ID.' });
                return;
            }
            updateMutation.mutate({ 
                id, 
                data: {
                    ...data,
                    created_at: selectedLevel.created_at,
                    created_by: selectedLevel.created_by
                } 
            });
        } else {
            createMutation.mutate({ 
                ...data,
                created_at: now,
                created_by: user?.username || 'admin_user' 
            });
        }
    };


    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedLevel ? 'Edit' : 'Create'} WinPharma Level</DialogTitle>
                        <DialogDescription>
                            Define a new level associated with a specific course.
                        </DialogDescription>
                    </DialogHeader>
                    <LevelForm 
                        level={selectedLevel} 
                        courses={courses}
                        onClose={() => setIsFormOpen(false)} 
                        onSave={handleSave} 
                        isSaving={createMutation.isPending || updateMutation.isPending} 
                    />
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!levelToDelete} onOpenChange={() => setLevelToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the level "{levelToDelete?.level_name}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => deleteMutation.mutate(levelToDelete!.id || levelToDelete!.level_id!)} 
                            disabled={deleteMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                             {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <Button variant="ghost" onClick={() => router.push('/admin/manage/games/winpharma')} className="-ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to WinPharma Setup
                    </Button>
                    <h1 className="text-3xl font-headline font-semibold mt-2">Manage WinPharma Levels</h1>
                    <p className="text-muted-foreground">Define and organize game levels by course.</p>
                </div>
                 <Button onClick={handleCreate}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Level
                </Button>
            </header>

            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <CardTitle>Level List</CardTitle>
                            <CardDescription>
                                {selectedCourseFilter === 'all' 
                                    ? "Please select a course to view its levels." 
                                    : isLoading ? "Loading levels..." : `${levels.length} levels found for this course.`}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 min-w-[200px]">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <Select onValueChange={setSelectedCourseFilter} value={selectedCourseFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by Course" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Select a course...</SelectItem>
                                    {courses.map(course => (
                                        <SelectItem key={course.courseCode} value={course.courseCode}>
                                            {course.name} ({course.courseCode})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {selectedCourseFilter === 'all' ? (
                        <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                            <Filter className="mx-auto h-12 w-12 opacity-20" />
                            <h3 className="mt-4 text-lg font-semibold">Select a Course</h3>
                            <p>Choose a course from the filter above to view and manage its levels.</p>
                        </div>
                    ) : isLoading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse bg-muted/50">
                                <Skeleton className="h-5 w-48" />
                                <div className="flex gap-2"><Skeleton className="h-8 w-24" /><Skeleton className="h-8 w-8" /></div>
                            </div>
                        ))
                    ) : isError ? (
                        <div className="p-8 text-center text-destructive flex flex-col items-center">
                            <AlertTriangle className="h-10 w-10 mb-2" />
                            <p className="font-semibold">Error Loading Levels</p>
                            <p className="text-sm">{(error as Error).message}</p>
                        </div>
                    ) : levels.length > 0 ? (
                        levels.map(level => {
                        const id = level.id || level.level_id;
                        return (
                         <div key={id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-md bg-primary/10">
                                    <Layers className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-card-foreground">{level.level_name}</p>
                                        {Number(level.is_active) === 1 ? (
                                            <span className="px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-medium uppercase">Active</span>
                                        ) : (
                                            <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium uppercase">Inactive</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Course: {level.course_code}</p>
                                        <span className="text-[10px] text-muted-foreground">•</span>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Author: {level.created_by}</p>
                                        <span className="text-[10px] text-muted-foreground">•</span>
                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-2.5 w-2.5" />
                                            {level.created_at ? format(new Date(level.created_at), 'MMM d, yyyy') : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(level)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/admin/manage/games/winpharma/levels/${id}`}>
                                        Configure Tasks <ArrowRight className="ml-2 h-4 w-4"/>
                                    </Link>
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setLevelToDelete(level)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </div>
                        )})
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            <Layers className="mx-auto h-12 w-12 opacity-20" />
                            <h3 className="mt-4 text-lg font-semibold">No Levels Found</h3>
                            <p>Click "Add New Level" to create the first one for this course.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
