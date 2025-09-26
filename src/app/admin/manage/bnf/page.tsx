
"use client";

import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, BookOpen, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getBooks } from '@/lib/actions/books';
import type { Book } from '@/lib/types';
import { format } from 'date-fns';

export default function BooksManagementPage() {
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
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-headline font-semibold">Books Management</h1>
                    <p className="text-muted-foreground">View and manage the book index.</p>
                </div>
                <Button>
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
