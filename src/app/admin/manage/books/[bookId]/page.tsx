

"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertTriangle, Book, PlusCircle, Loader2, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getChaptersByBook, createChapter, updateChapter, deleteChapter, getBookById } from '@/lib/actions/books';
import type { Chapter, CreateChapterPayload, Book, UpdateChapterPayload } from '@/lib/types';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

const chapterFormSchema = z.object({
  chapter_number: z.string().min(1, "Chapter number is required."),
  chapter_title: z.string().min(3, "Chapter title must be at least 3 characters."),
});

type ChapterFormValues = z.infer<typeof chapterFormSchema>;

const ChapterForm = ({ bookId, chapter, onClose }: { bookId: string, chapter?: Chapter | null, onClose: () => void; }) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    
    const form = useForm<ChapterFormValues>({
        resolver: zodResolver(chapterFormSchema),
        defaultValues: {
            chapter_number: chapter?.chapter_number || '',
            chapter_title: chapter?.chapter_title || '',
        }
    });

    useEffect(() => {
        if(chapter) {
            form.reset({
                chapter_number: chapter.chapter_number,
                chapter_title: chapter.chapter_title,
            });
        } else {
             form.reset({
                chapter_number: '',
                chapter_title: '',
            });
        }
    }, [chapter, form]);

    const mutation = useMutation({
        mutationFn: (data: ChapterFormValues) => {
            if (!user?.username) {
                throw new Error('You must be logged in.');
            }
            if (chapter) {
                 const payload: UpdateChapterPayload = { ...data, update_by: user.username };
                 return updateChapter(chapter.chapter_id, payload);
            } else {
                 const payload: CreateChapterPayload = { ...data, book_id: bookId, created_by: user.username, update_by: user.username };
                 return createChapter(payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chapters', bookId] });
            toast({ title: 'Success', description: `Chapter ${chapter ? 'updated' : 'created'} successfully.` });
            onClose();
        },
        onError: (error: Error) => toast({ variant: 'destructive', title: 'Error', description: error.message })
    });

    const onSubmit = (data: ChapterFormValues) => {
        mutation.mutate(data);
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
                    {chapter ? "Save Changes" : "Create Chapter"}
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
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
    const [chapterToDelete, setChapterToDelete] = useState<Chapter | null>(null);
    const queryClient = useQueryClient();

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

    const deleteMutation = useMutation({
        mutationFn: (chapterId: string) => deleteChapter(chapterId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chapters', bookId] });
            toast({ title: 'Success', description: 'Chapter deleted successfully.' });
        },
        onError: (error: Error) => toast({ variant: 'destructive', title: 'Error', description: error.message }),
        onSettled: () => setChapterToDelete(null),
    });

    const handleCreate = () => {
        setSelectedChapter(null);
        setIsFormOpen(true);
    }
    
    const handleEdit = (chapter: Chapter) => {
        setSelectedChapter(chapter);
        setIsFormOpen(true);
    }

    const isLoading = isLoadingBook || isLoadingChapters;

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedChapter ? "Edit" : "Add New"} Chapter</DialogTitle>
                        <DialogDescription>
                          {selectedChapter ? `Editing chapter for "${book?.book_name}"` : `Add a new chapter to "${book?.book_name}"`}.
                        </DialogDescription>
                    </DialogHeader>
                    <ChapterForm bookId={bookId} chapter={selectedChapter} onClose={() => setIsFormOpen(false)} />
                </DialogContent>
            </Dialog>

             <AlertDialog open={!!chapterToDelete} onOpenChange={() => setChapterToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the chapter "{chapterToDelete?.chapter_title}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(chapterToDelete!.chapter_id)} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>


            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                     <Button variant="ghost" onClick={() => router.push('/admin/manage/bnf')} className="-ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4"/> Back to Books
                    </Button>
                    <h1 className="text-3xl font-headline font-semibold mt-2">
                        {isLoadingBook ? <Skeleton className="h-8 w-64" /> : `Chapters for "${book?.book_name}"`}
                    </h1>
                </div>
                <Button onClick={handleCreate}>
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
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    [...Array(3)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : chapters && chapters.length > 0 ? (
                                    chapters.map(chapter => (
                                        <TableRow key={chapter.chapter_id}>
                                            <TableCell className="font-medium">{chapter.chapter_number}</TableCell>
                                            <TableCell>{chapter.chapter_title}</TableCell>
                                            <TableCell>{format(new Date(chapter.created_at), 'PPP')}</TableCell>
                                            <TableCell className="text-right space-x-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(chapter)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setChapterToDelete(chapter)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24">
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

