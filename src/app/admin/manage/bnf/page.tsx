
"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, BookOpen, PlusCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getBooks, createBook } from '@/lib/actions/books';
import type { Book, CreateBookPayload } from '@/lib/types';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';


const bookFormSchema = z.object({
  book_name: z.string().min(3, "Book name must be at least 3 characters."),
  author: z.string().min(3, "Author name must be at least 3 characters."),
});

type BookFormValues = z.infer<typeof bookFormSchema>;

const BookForm = ({ onClose }: { onClose: () => void; }) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const form = useForm<BookFormValues>({
        resolver: zodResolver(bookFormSchema),
        defaultValues: { book_name: '', author: '' }
    });

    const mutation = useMutation({
        mutationFn: (data: CreateBookPayload) => createBook(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
            toast({ title: 'Success', description: 'Book created successfully.' });
            onClose();
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    });

    const onSubmit = (data: BookFormValues) => {
        if (!user?.username) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
            return;
        }
        const payload: CreateBookPayload = {
            ...data,
            created_by: user.username,
            update_by: user.username,
        };
        mutation.mutate(payload);
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="book_name">Book Name</Label>
                <Input id="book_name" {...form.register('book_name')} />
                {form.formState.errors.book_name && <p className="text-sm text-destructive">{form.formState.errors.book_name.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input id="author" {...form.register('author')} />
                {form.formState.errors.author && <p className="text-sm text-destructive">{form.formState.errors.author.message}</p>}
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={mutation.isPending}>Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Book
                </Button>
            </DialogFooter>
        </form>
    )
}


export default function BooksManagementPage() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { data: books, isLoading, isError, error } = useQuery<Book[]>({
        queryKey: ['books'],
        queryFn: getBooks,
    });

    if (isError) {
        return (
            <div className="p-4 md:p-8">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error Loading Books</AlertTitle>
                    <AlertDescription>{(error as Error).message}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
             <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Book</DialogTitle>
                        <DialogDescription>Fill in the details for the new book.</DialogDescription>
                    </DialogHeader>
                    <BookForm onClose={() => setIsFormOpen(false)} />
                </DialogContent>
            </Dialog>

            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-headline font-semibold">Books Management</h1>
                    <p className="text-muted-foreground">View and manage the book index.</p>
                </div>
                <Button onClick={() => setIsFormOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Book
                </Button>
            </header>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Book Index</CardTitle>
                    <CardDescription>A list of all books in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Book ID</TableHead>
                                    <TableHead>Book Name</TableHead>
                                    <TableHead>Author</TableHead>
                                    <TableHead>Created At</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    [...Array(5)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : books && books.length > 0 ? (
                                    books.map(book => (
                                        <TableRow key={book.book_id}>
                                            <TableCell className="font-medium">{book.book_id}</TableCell>
                                            <TableCell>{book.book_name}</TableCell>
                                            <TableCell>{book.author}</TableCell>
                                            <TableCell>{format(new Date(book.created_at), 'PPP')}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24">
                                            No books found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
