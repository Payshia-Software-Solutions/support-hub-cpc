

"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Book, List, Search, Loader2, AlertTriangle, ArrowRight, BookOpen, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { getBooks, getChaptersByBook, getSectionsByBook, getPagesByBook } from '@/lib/actions/books';
import type { Book as BookType, Chapter, Section, PageContent } from '@/lib/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import parse from 'html-react-parser';
import Image from 'next/image';

const CONTENT_PROVIDER_URL = 'https://content-provider.pharmacollege.lk/books/';

// View states
type BnfView = 'books' | 'reader';

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

export default function BnfPage() {
    const [view, setView] = useState<BnfView>('books');
    const [selectedBook, setSelectedBook] = useState<BookType | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // --- Data Fetching ---
    const { data: books, isLoading: isLoadingBooks, isError: isBooksError, error: booksError } = useQuery<BookType[]>({
        queryKey: ['allBooks'],
        queryFn: getBooks,
        staleTime: 1000 * 60 * 10,
    });

    const { data: chapters, isLoading: isLoadingChapters } = useQuery<Chapter[]>({
        queryKey: ['chaptersByBook', selectedBook?.book_id],
        queryFn: () => getChaptersByBook(selectedBook!.book_id),
        enabled: !!selectedBook,
    });
    
    const { data: sections, isLoading: isLoadingSections } = useQuery<Section[]>({
        queryKey: ['sectionsByBook', selectedBook?.book_id],
        queryFn: () => getSectionsByBook(selectedBook!.book_id),
        enabled: !!selectedBook,
    });

    const { data: allPageContents, isLoading: isLoadingAllPages } = useQuery<PageContent[]>({
        queryKey: ['allPagesByBook', selectedBook?.book_id],
        queryFn: () => getPagesByBook(selectedBook!.book_id),
        enabled: !!selectedBook,
    });

    // --- Memoized Data processing ---
    const filteredBooks = useMemo(() => {
        if (!books) return [];
        return books.filter(book => book.book_name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [books, searchTerm]);
    
    const groupedToc = useMemo(() => {
        if (!chapters || !sections) return [];
        return chapters.map(chapter => ({
            ...chapter,
            sections: sections.filter(s => s.chapter_id === chapter.chapter_id).sort((a,b) => parseInt(a.section_order) - parseInt(b.section_order))
        })).sort((a,b) => parseInt(a.chapter_number) - parseInt(b.chapter_number));
    }, [chapters, sections]);
    
    const groupedPages = useMemo(() => {
        if (!allPageContents) return {};
        return groupPages(allPageContents);
    }, [allPageContents]);

    const pageNumbers = useMemo(() => {
        return Object.keys(groupedPages).map(Number).sort((a, b) => a - b);
    }, [groupedPages]);

    // --- Handlers ---
    const handleSelectBook = (book: BookType) => {
        setSelectedBook(book);
        setView('reader');
        setCurrentPage(1); // Reset to first page when a new book is opened
    };

    const handleBackToBooks = () => {
        setSelectedBook(null);
        setView('books');
    };

    const goToPage = (pageNumber: number) => {
        if (pageNumbers.includes(pageNumber)) {
            setCurrentPage(pageNumber);
        }
    };
    
    const handleGoToSection = (section: Section) => {
        const firstPageOfSection = allPageContents?.find(p => p.section_id === section.section_id);
        if (firstPageOfSection) {
            goToPage(parseInt(firstPageOfSection.page_number, 10));
        }
    };


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
    
    // --- Reader View ---
    if (view === 'reader' && selectedBook) {
        const pageContent = groupedPages[currentPage];

        return (
             <div className="p-4 md:p-8 space-y-6 pb-20">
                <header className="flex justify-between items-center">
                    <Button variant="ghost" onClick={handleBackToBooks} className="-ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Library
                    </Button>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline"><List className="mr-2 h-4 w-4" />Table of Contents</Button>
                        </SheetTrigger>
                        <SheetContent>
                            <CardHeader><CardTitle>{selectedBook.book_name}</CardTitle><CardDescription>Table of Contents</CardDescription></CardHeader>
                            <div className="h-[calc(100%-100px)] overflow-y-auto">
                                <CardContent>
                                    {isLoadingChapters || isLoadingSections ? <p>Loading...</p> : (
                                        <div className="space-y-1">
                                            {groupedToc.map(chapter => (
                                                <Collapsible key={chapter.chapter_id} className="p-2 border-b">
                                                    <CollapsibleTrigger className="w-full text-left font-semibold">{chapter.chapter_number}. {chapter.chapter_title}</CollapsibleTrigger>
                                                    <CollapsibleContent className="mt-2 pl-4">
                                                        <div className="space-y-1">
                                                            {chapter.sections.map(section => (
                                                                <button key={section.section_id} onClick={() => handleGoToSection(section)} className="block w-full text-left text-sm p-1 rounded hover:bg-accent">{chapter.chapter_number}.{section.section_order} {section.section_heading}</button>
                                                            ))}
                                                        </div>
                                                    </CollapsibleContent>
                                                </Collapsible>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </div>
                        </SheetContent>
                    </Sheet>
                </header>

                <Card>
                    <CardHeader>
                         <CardTitle className="text-2xl font-headline">{selectedBook.book_name}</CardTitle>
                         <CardDescription>Page {currentPage} of {pageNumbers.length}</CardDescription>
                    </CardHeader>
                    <CardContent className="min-h-[50vh]">
                        {isLoadingAllPages ? <Loader2 className="mx-auto h-8 w-8 animate-spin" /> : (
                            <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
                                {pageContent?.map(content => (
                                    <div key={content.pege_entry_id}>
                                        {content.page_type === 'image' && content.page_content_text ? (
                                            <div className="relative w-full h-auto">
                                                <Image 
                                                    src={`${CONTENT_PROVIDER_URL}${content.page_content_text}`} 
                                                    alt={`Content for page ${content.page_number}`} 
                                                    width={1200}
                                                    height={800}
                                                    className="rounded-md bg-white w-full h-auto"
                                                />
                                            </div>
                                        ) : content.page_content_text ? (
                                            parse(content.page_content_text)
                                        ) : null}
                                    </div>
                                ))}
                                {!pageContent && <p>No content for this page.</p>}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-between items-center">
                        <Button variant="outline" onClick={() => goToPage(1)} disabled={currentPage === 1}><ChevronsLeft className="h-4 w-4"/></Button>
                        <div className="flex items-center gap-2">
                             <Button variant="outline" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4"/> Prev</Button>
                             <span className="text-sm font-medium">Page {currentPage}</span>
                             <Button variant="outline" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === pageNumbers[pageNumbers.length - 1]}>Next <ChevronRight className="h-4 w-4"/></Button>
                        </div>
                        <Button variant="outline" onClick={() => goToPage(pageNumbers[pageNumbers.length - 1])} disabled={currentPage === pageNumbers[pageNumbers.length - 1]}><ChevronsRight className="h-4 w-4"/></Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    // --- Book List View (Default) ---
    return (
        <div className="p-4 md:p-8 space-y-8 pb-20">
            <header>
                <h1 className="text-3xl font-headline font-semibold">Books Library</h1>
                <p className="text-muted-foreground">Browse the available medical and pharmaceutical texts.</p>
            </header>
            
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search books..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBooks.map(book => (
                     <Card key={book.book_id} className="shadow-lg hover:shadow-xl hover:border-primary transition-all flex flex-col group cursor-pointer" onClick={() => handleSelectBook(book)}>
                        <CardHeader className="flex-row items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg"><BookOpen className="w-8 h-8 text-primary" /></div>
                            <div><CardTitle className="text-base group-hover:text-primary">{book.book_name}</CardTitle><CardDescription>{book.author}</CardDescription></div>
                        </CardHeader>
                        <CardContent className="flex-grow"></CardContent>
                        <CardFooter>
                            <Button variant="secondary" className="w-full">Read Book <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform"/></Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
            
            {filteredBooks.length === 0 && (<div className="text-center py-16 text-muted-foreground"><p>No books found matching your search.</p></div>)}
        </div>
    );
}
