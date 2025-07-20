
"use client";

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { dummyCourses } from '@/lib/dummy-data';

const recordingSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long."),
  description: z.string().min(10, "Description must be at least 10 characters long."),
  courseId: z.string({ required_error: "Please select a course." }),
  youtubeUrl: z.string().url("Please enter a valid YouTube URL."),
  thumbnailUrl: z.string().url("Please enter a valid image URL for the thumbnail."),
});

export default function CreateRecordingPage() {
  const router = useRouter();

  const form = useForm<z.infer<typeof recordingSchema>>({
    resolver: zodResolver(recordingSchema),
    defaultValues: {
      title: '',
      description: '',
      youtubeUrl: '',
      thumbnailUrl: '',
    },
  });

  const onSubmit = (data: z.infer<typeof recordingSchema>) => {
    // In a real app, this would be a useMutation call
    console.log("Creating new recording:", data);
    toast({
      title: 'Success!',
      description: 'The new recording has been added.',
    });
    router.push('/admin/recordings');
  };

  return (
    <div className="p-4 md:p-8 space-y-6 pb-20">
      <header>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4 -ml-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Recordings
        </Button>
        <h1 className="text-3xl font-headline font-semibold">Add New Recording</h1>
        <p className="text-muted-foreground">Fill in the details for the new video recording.</p>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="shadow-lg">
             <CardHeader>
                <CardTitle>Recording Details</CardTitle>
             </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Video Title</FormLabel>
                    <FormControl><Input placeholder="e.g., Session 1: Introduction to..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {dummyCourses.map(course => (
                           <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="youtubeUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>YouTube URL</FormLabel>
                    <FormControl><Input placeholder="https://www.youtube.com/watch?v=..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="thumbnailUrl"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Thumbnail Image URL</FormLabel>
                    <FormControl><Input placeholder="https://placehold.co/600x400.png" {...field} /></FormControl>
                     <FormDescription>Use a service like Placehold.co or an image hosting link.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea placeholder="A brief summary of the video content..." className="min-h-[150px]" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit">
                Add Recording
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
