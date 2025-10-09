
"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Book, Search, Loader2, AlertTriangle, ArrowRight, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { getBooks } from '@/lib/actions/books';
import type { Book as BookType } from '@/lib/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

export default function BnfPage() {
    const [searchTerm, setSearchTerm] = useState('');

    const { data: books, isLoading: isLoadingBooks, isError: isBooksError, error: booksError } = useQuery<BookType[]>({
        queryKey: ['allBooks'],
        queryFn: getBooks,
        staleTime: 1000 * 60 * 10,
    });

    const filteredBooks = useMemo(() => {
        if (!books) return [];
        return books.filter(book => book.book_name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [books, searchTerm]);


    if (isLoadingBooks) {
        return (
            <div className="p-4 md:p-8 space-y-6">
                <header><Skeleton className="h-10 w-1/4" /><Skeleton className="h-4 w-1/2 mt-2" /></header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}</div>
            </div>
        );
    }
    
    if (isBooksError) {
         return (
            <div className="p-4 md:p-8">
                 <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error Loading Books</AlertTitle><AlertDescription>{(booksError as Error).message}</AlertDescription></Alert>
            </div>
         );
    }
    
    return (
        <div className="p-4 md:p-8 space-y-8 pb-20">
            <header>
                <h1 className="text-3xl font-headline font-semibold">Books Library</h1>
                <p className="text-muted-foreground">Browse the available medical and pharmaceutical texts.</p>
            </header>
            
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search books..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBooks.map(book => (
                     <Link key={book.book_id} href={`/dashboard/bnf/${book.book_id}`} className="group block h-full">
                        <Card className="shadow-lg hover:shadow-xl hover:border-primary transition-all flex flex-col h-full">
                            <CardHeader className="flex-row items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-lg"><BookOpen className="w-8 h-8 text-primary" /></div>
                                <div><CardTitle className="text-base group-hover:text-primary">{book.book_name}</CardTitle><CardDescription>{book.author}</CardDescription></div>
                            </CardHeader>
                            <CardContent className="flex-grow"></CardContent>
                            <CardFooter>
                                <Button variant="secondary" className="w-full">Read Book <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform"/></Button>
                            </CardFooter>
                        </Card>
                    </Link>
                ))}
            </div>
            
            {filteredBooks.length === 0 && (<div className="text-center py-16 text-muted-foreground"><p>No books found matching your search.</p></div>)}
        </div>
    );
}
