"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { createParentCourse } from '@/lib/api';
import type { ParentCourse } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const courseFormSchema = z.object({
  course_name: z.string().min(3, "Course name is required"),
  course_code: z.string().min(1, "Course code is required"),
  instructor_id: z.string().optional(),
  course_duration: z.string().optional(),
  course_fee: z.coerce.number().min(0).optional(),
  registration_fee: z.coerce.number().min(0).optional(),
  course_img: z.string().optional(),
  mini_description: z.string().optional(),
  course_description: z.string().optional(),
  certification: z.string().optional(),
  lecture_count: z.coerce.number().min(0).optional(),
  hours_per_lecture: z.coerce.number().min(0).optional(),
  assessments: z.coerce.number().min(0).optional(),
  language: z.string().optional(),
  quizzes: z.coerce.number().min(0).optional(),
  skill_level: z.string().optional(),
  head_count: z.coerce.number().min(0).optional(),
  course_mode: z.string().optional(),
  slug: z.string().optional(),
  criteria_list: z.string().optional(),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

interface CourseFormProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CourseForm({ isOpen, onOpenChange }: CourseFormProps) {
    const queryClient = useQueryClient();

    const form = useForm<CourseFormValues>({
        resolver: zodResolver(courseFormSchema),
        defaultValues: {
            course_name: '',
            course_code: '',
            instructor_id: '',
            course_duration: '',
            course_fee: 0,
            registration_fee: 0,
            course_img: '',
            mini_description: '',
            course_description: '',
            certification: '',
            lecture_count: 0,
            hours_per_lecture: 0,
            assessments: 0,
            language: '',
            quizzes: 0,
            skill_level: '',
            head_count: 0,
            course_mode: '',
            slug: '',
            criteria_list: '',
        },
    });

     const courseMutation = useMutation({
        mutationFn: (data: CourseFormValues) => {
            const apiData = {
                ...data,
                course_fee: String(data.course_fee),
                registration_fee: String(data.registration_fee),
                lecture_count: String(data.lecture_count),
                hours_per_lecture: String(data.hours_per_lecture),
                assessments: String(data.assessments),
                quizzes: String(data.quizzes),
                head_count: String(data.head_count),
            };
            return createParentCourse(apiData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['parentCourses'] });
            toast({ title: 'Success', description: 'Course created successfully.' });
            onOpenChange(false);
            form.reset();
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    });

    const onSubmit = (data: CourseFormValues) => {
        courseMutation.mutate(data);
    };

    return (
         <Dialog open={isOpen} onOpenChange={(open) => {
             if (!open) form.reset();
             onOpenChange(open);
         }}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Create New Course</DialogTitle>
                    <DialogDescription>
                        Fill in the details for a new parent course.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="pr-6 -mr-6">
                    <form id="course-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2"><Label>Course Name*</Label><Input {...form.register('course_name')} />{form.formState.errors.course_name && <p className="text-sm text-destructive">{form.formState.errors.course_name.message}</p>}</div>
                            <div className="space-y-2"><Label>Course Code*</Label><Input {...form.register('course_code')} />{form.formState.errors.course_code && <p className="text-sm text-destructive">{form.formState.errors.course_code.message}</p>}</div>
                            <div className="space-y-2"><Label>Instructor ID</Label><Input {...form.register('instructor_id')} /></div>
                            <div className="space-y-2"><Label>Duration</Label><Input {...form.register('course_duration')} /></div>
                            <div className="space-y-2"><Label>Course Fee (LKR)</Label><Input type="number" {...form.register('course_fee')} /></div>
                            <div className="space-y-2"><Label>Registration Fee (LKR)</Label><Input type="number" {...form.register('registration_fee')} /></div>
                             <div className="space-y-2 md:col-span-2 lg:col-span-3"><Label>Course Image Filename</Label><Input {...form.register('course_img')} placeholder="e.g., image.jpg"/></div>
                            <div className="space-y-2"><Label>Lecture Count</Label><Input type="number" {...form.register('lecture_count')} /></div>
                            <div className="space-y-2"><Label>Hours Per Lecture</Label><Input type="number" {...form.register('hours_per_lecture')} /></div>
                            <div className="space-y-2"><Label>Assessments</Label><Input type="number" {...form.register('assessments')} /></div>
                            <div className="space-y-2"><Label>Language</Label><Input {...form.register('language')} /></div>
                            <div className="space-y-2"><Label>Quizzes</Label><Input type="number" {...form.register('quizzes')} /></div>
                            <div className="space-y-2"><Label>Skill Level</Label><Input {...form.register('skill_level')} placeholder="e.g. Beginner"/></div>
                            <div className="space-y-2"><Label>Max Head Count</Label><Input type="number" {...form.register('head_count')} /></div>
                            <div className="space-y-2"><Label>Course Mode</Label><Input {...form.register('course_mode')} placeholder="e.g. Free, Paid"/></div>
                            <div className="space-y-2"><Label>Slug</Label><Input {...form.register('slug')} placeholder="e.g. certificate-course"/></div>
                            <div className="space-y-2"><Label>Criteria List (CSV)</Label><Input {...form.register('criteria_list')} placeholder="e.g. 1,2,3"/></div>
                        </div>
                        <div className="space-y-2"><Label>Mini Description</Label><Textarea rows={3} {...form.register('mini_description')} /></div>
                        <div className="space-y-2"><Label>Full Description (HTML)</Label><Textarea rows={8} {...form.register('course_description')} /></div>
                        <div className="space-y-2"><Label>Certification Details</Label><Textarea rows={2} {...form.register('certification')} /></div>
                    </form>
                </ScrollArea>
                 <DialogFooter className="pt-4 border-t">
                    <DialogClose asChild><Button type="button" variant="outline" disabled={courseMutation.isPending}>Cancel</Button></DialogClose>
                    <Button type="submit" form="course-form" disabled={courseMutation.isPending}>
                        {courseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Course
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
