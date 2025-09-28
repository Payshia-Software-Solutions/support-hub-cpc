
"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { getBookById, getBnfWordIndex } from '@/lib/actions/books';
import type { Book as BookType, BnfWordIndexEntry } from '@/lib/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function BnfIndexPage() {
    const router = useRouter();
    const params = useParams();
    const bookId = params.bookId as string;
    const [searchTerm, setSearchTerm] = useState('');

    const { data: selectedBook, isLoading: isLoadingBook } = useQuery<BookType>({
        queryKey: ['bookById', bookId],
        queryFn: () => getBookById(bookId),
        enabled: !!bookId,
    });

    const { data: wordIndex, isLoading: isLoadingIndex, isError, error } = useQuery<BnfWordIndexEntry[]>({
        queryKey: ['bnfWordIndex', bookId],
        queryFn: () => getBnfWordIndex(bookId),
        enabled: !!bookId,
    });

    const filteredWordIndex = useMemo(() => {
        if (!wordIndex) return [];
        if (!searchTerm) return wordIndex;
        return wordIndex.filter(entry => entry.keyword.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [wordIndex, searchTerm]);

    const isLoading = isLoadingBook || isLoadingIndex;

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <Button variant="ghost" onClick={() => router.push(`/dashboard/bnf/${bookId}`)} className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Reader
                </Button>
            </header>

            <Card>
                <CardHeader>
                    {isLoadingBook ? (
                        <div className="space-y-2"><Skeleton className="h-8 w-3/4"/><Skeleton className="h-4 w-1/2"/></div>
                    ) : (
                        <>
                            <CardTitle className="text-2xl font-headline flex items-center gap-2"><Search className="h-6 w-6"/>Keyword Index</CardTitle>
                            <CardDescription>Book: {selectedBook?.book_name}</CardDescription>
                        </>
                    )}
                     <div className="relative pt-4">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search keywords..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                         <div className="space-y-2">
                           <Skeleton className="h-8 w-full"/>
                           <Skeleton className="h-8 w-full"/>
                           <Skeleton className="h-8 w-full"/>
                        </div>
                    ) : isError ? (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error Loading Index</AlertTitle>
                            <AlertDescription>{(error as Error).message}</AlertDescription>
                        </Alert>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2 max-h-[60vh] overflow-y-auto">
                            {filteredWordIndex.map((entry, index) => (
                                <Link key={index} href={`/dashboard/bnf/${bookId}?page=${entry.page_number}`} className="text-sm p-1 rounded hover:bg-accent hover:underline">
                                    {entry.keyword} ({entry.page_number})
                                </Link>
                            ))}
                        </div>
                    )}
                    {!isLoading && !isError && filteredWordIndex.length === 0 && (
                        <p className="text-center text-muted-foreground py-10">No keywords found.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

