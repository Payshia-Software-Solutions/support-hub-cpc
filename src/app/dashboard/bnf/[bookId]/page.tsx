"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Book, List, Search, Loader2, AlertTriangle, ArrowRight, BookOpen, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, RotateCw, BookText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { getBookById, getPagesByBook } from '@/lib/actions/books';
import type { Book as BookType, PageContent } from '@/lib/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import parse from 'html-react-parser';
import Image from 'next/image';
import Link from 'next/link';
import { Label } from '@/components/ui/label';

const CONTENT_PROVIDER_URL = 'https://content-provider.pharmacollege.lk/books/';

// Group pages by page number
const groupPages = (pages: PageContent[]) => {
    return pages.reduce((acc, page) => {
        const pageNum = parseInt(page.page_number, 10);
        if (!acc[pageNum]) {
            acc[pageNum] = [];
        }
        acc[pageNum].push(page);
        acc[pageNum].sort((a, b) => parseInt(a.content_order, 10) - parseInt(b.content_order, 10));
        return acc;
    }, {} as Record<number, PageContent[]>);
};

const ImageViewer = ({ src, alt }: { src: string; alt: string }) => {
    return (
        <div className="not-prose my-4">
            <div className="w-full overflow-auto border rounded-md bg-muted p-2">
                 <div
                    className="flex justify-center items-center"
                >
                    <Image 
                        src={src} 
                        alt={alt} 
                        width={1200} 
                        height={800} 
                        className="max-w-none w-full h-auto"
                    />
                </div>
            </div>
        </div>
    );
};


export default function BnfReaderPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const bookId = params.bookId as string;

    const initialPage = parseInt(searchParams.get('page') || '1', 10);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [jumpToPageInput, setJumpToPageInput] = useState('');


    // --- Data Fetching ---
    const { data: selectedBook, isLoading: isLoadingBook, isError: isBookError, error: bookError } = useQuery<BookType>({
        queryKey: ['bookById', bookId],
        queryFn: () => getBookById(bookId),
        enabled: !!bookId,
    });
    
    const { data: allPageContents, isLoading: isLoadingAllPages } = useQuery<PageContent[]>({
        queryKey: ['allPagesByBook', bookId],
        queryFn: () => getPagesByBook(bookId),
        enabled: !!bookId,
    });

    // --- Memoized Data processing ---
    const groupedPages = useMemo(() => {
        if (!allPageContents) return {};
        return groupPages(allPageContents);
    }, [allPageContents]);

    const pageNumbers = useMemo(() => {
        return Object.keys(groupedPages).map(Number).sort((a, b) => a - b);
    }, [groupedPages]);

    // --- Handlers ---
    const goToPage = (pageNumber: number) => {
        if (pageNumbers.includes(pageNumber)) {
            setCurrentPage(pageNumber);
            // Update URL without full navigation
            router.push(`/dashboard/bnf/${bookId}?page=${pageNumber}`, { scroll: false });
        } else {
            toast({
                variant: 'destructive',
                description: `Page ${pageNumber} does not exist in this book.`
            });
        }
    };
    
    const handleJumpToPage = () => {
        const pageNum = parseInt(jumpToPageInput, 10);
        if (isNaN(pageNum)) {
            toast({ variant: 'destructive', description: 'Please enter a valid number.' });
            return;
        }
        goToPage(pageNum);
        setJumpToPageInput('');
    };

    if (isLoadingBook) {
        return <div className="p-8"><Skeleton className="h-screen w-full" /></div>
    }

    if (isBookError || !selectedBook) {
        return (
            <div className="p-4 md:p-8">
                <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error Loading Book</AlertTitle><AlertDescription>{(bookError as Error)?.message || "The book could not be loaded."}</AlertDescription></Alert>
            </div>
        )
    }

    const pageContent = groupedPages[currentPage];

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header className="flex justify-between items-center gap-2">
                <Button variant="ghost" onClick={() => router.push('/dashboard/bnf')} className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Library
                </Button>
                <div className="flex items-center gap-2">
                     <Button variant="outline" asChild>
                        <Link href={`/dashboard/bnf/${bookId}/contents`}>
                            <List className="mr-2 h-4 w-4" />Contents
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href={`/dashboard/bnf/${bookId}/index`}>
                            <Search className="mr-2 h-4 w-4" />Index
                        </Link>
                    </Button>
                </div>
            </header>

            <div>
                <div className="mb-4">
                    <h1 className="text-2xl font-headline font-semibold">{selectedBook.book_name}</h1>
                    <p className="text-sm text-muted-foreground">Page {currentPage} of {pageNumbers[pageNumbers.length - 1] || 1}</p>
                </div>
                <div className="min-h-[50vh]">
                    {isLoadingAllPages ? <Loader2 className="mx-auto h-8 w-8 animate-spin" /> : (
                        <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
                            {pageContent?.map(content => (
                                <div key={content.pege_entry_id}>
                                    {content.page_type === 'image' && content.page_content_text ? (
                                        <ImageViewer 
                                            src={`${CONTENT_PROVIDER_URL}${content.page_content_text}`}
                                            alt={`Content for page ${content.page_number}`}
                                        />
                                    ) : content.page_content_text ? (
                                        parse(content.page_content_text)
                                    ) : null}
                                </div>
                            ))}
                            {!pageContent && <p>No content for this page.</p>}
                        </div>
                    )}
                </div>
                 <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border rounded-lg bg-card">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => goToPage(1)} disabled={currentPage === 1} aria-label="Go to first page">
                            <ChevronsLeft className="h-4 w-4"/>
                        </Button>
                        <Button variant="outline" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                            <ChevronLeft className="h-4 w-4 mr-2"/>
                            Prev
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="jump-to-page" className="text-sm text-muted-foreground whitespace-nowrap">Page</Label>
                        <Input 
                        id="jump-to-page"
                        type="number" 
                        className="w-20 h-9 text-center"
                        value={jumpToPageInput}
                        onChange={(e) => setJumpToPageInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleJumpToPage()}
                        placeholder={`${currentPage}`}
                        />
                        <Button size="sm" onClick={handleJumpToPage}>Go</Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === pageNumbers[pageNumbers.length - 1]}>
                            Next
                            <ChevronRight className="h-4 w-4 ml-2"/>
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => goToPage(pageNumbers[pageNumbers.length - 1])} disabled={currentPage === pageNumbers[pageNumbers.length - 1]} aria-label="Go to last page">
                            <ChevronsRight className="h-4 w-4"/>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
