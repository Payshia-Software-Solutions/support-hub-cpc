
"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Book, PlusCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getChaptersByBook, createChapter, getBookById } from '@/lib/actions/books';
import type { Chapter, CreateChapterPayload, Book } from '@/lib/types';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

const chapterFormSchema = z.object({
  chapter_number: z.string().min(1, "Chapter number is required."),
  chapter_title: z.string().min(3, "Chapter title must be at least 3 characters."),
});

type ChapterFormValues = z.infer<typeof chapterFormSchema>;

const ChapterForm = ({ bookId, onClose }: { bookId: string, onClose: () => void; }) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const form = useForm<ChapterFormValues>({
        resolver: zodResolver(chapterFormSchema),
        defaultValues: { chapter_number: '', chapter_title: '' }
    });

    const mutation = useMutation({
        mutationFn: (data: CreateChapterPayload) => createChapter(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chapters', bookId] });
            toast({ title: 'Success', description: 'Chapter created successfully.' });
            onClose();
        },
        onError: (error: Error) => toast({ variant: 'destructive', title: 'Error', description: error.message })
    });

    const onSubmit = (data: ChapterFormValues) => {
        if (!user?.username) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
            return;
        }
        const payload: CreateChapterPayload = {
            ...data,
            book_id: bookId,
            created_by: user.username,
            update_by: user.username,
        };
        mutation.mutate(payload);
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="chapter_number">Chapter Number</Label>
                <Input id="chapter_number" {...form.register('chapter_number')} />
                {form.formState.errors.chapter_number && <p className="text-sm text-destructive">{form.formState.errors.chapter_number.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="chapter_title">Chapter Title</Label>
                <Input id="chapter_title" {...form.register('chapter_title')} />
                {form.formState.errors.chapter_title && <p className="text-sm text-destructive">{form.formState.errors.chapter_title.message}</p>}
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" disabled={mutation.isPending}>Cancel</Button></DialogClose>
                <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Chapter
                </Button>
            </DialogFooter>
        </form>
    );
}

export default function BookChaptersPage() {
    const params = useParams();
    const router = useRouter();
    const bookId = params.bookId as string;
    const [isFormOpen, setIsFormOpen] = useState(false);

    const { data: book, isLoading: isLoadingBook } = useQuery<Book>({
        queryKey: ['book', bookId],
        queryFn: () => getBookById(bookId),
        enabled: !!bookId,
    });
    
    const { data: chapters, isLoading: isLoadingChapters, isError, error } = useQuery<Chapter[]>({
        queryKey: ['chapters', bookId],
        queryFn: () => getChaptersByBook(bookId),
        enabled: !!bookId,
    });

    const isLoading = isLoadingBook || isLoadingChapters;

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Chapter</DialogTitle>
                        <DialogDescription>Add a new chapter to "{book?.book_name}".</DialogDescription>
                    </DialogHeader>
                    <ChapterForm bookId={bookId} onClose={() => setIsFormOpen(false)} />
                </DialogContent>
            </Dialog>

            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                     <Button variant="ghost" onClick={() => router.push('/admin/manage/bnf')} className="-ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4"/> Back to Books
                    </Button>
                    <h1 className="text-3xl font-headline font-semibold mt-2">
                        {isLoadingBook ? <Skeleton className="h-8 w-64" /> : `Chapters for "${book?.book_name}"`}
                    </h1>
                </div>
                <Button onClick={() => setIsFormOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Chapter
                </Button>
            </header>

             <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Chapter Index</CardTitle>
                    <CardDescription>A list of all chapters in this book.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isError ? (
                         <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error Loading Chapters</AlertTitle>
                            <AlertDescription>{(error as Error).message}</AlertDescription>
                        </Alert>
                    ) : (
                    <div className="relative w-full overflow-auto border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Chapter #</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Created At</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    [...Array(3)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : chapters && chapters.length > 0 ? (
                                    chapters.map(chapter => (
                                        <TableRow key={chapter.chapter_id}>
                                            <TableCell className="font-medium">{chapter.chapter_number}</TableCell>
                                            <TableCell>{chapter.chapter_title}</TableCell>
                                            <TableCell>{format(new Date(chapter.created_at), 'PPP')}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24">
                                            No chapters found for this book yet.
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

