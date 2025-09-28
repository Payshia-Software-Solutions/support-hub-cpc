
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Book, List, Search, Loader2, AlertTriangle, ArrowRight, BookOpen, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, BookText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { getBookById, getChaptersByBook, getSectionsByBook, getPagesByBook } from '@/lib/actions/books';
import type { Book as BookType, Chapter, Section, PageContent } from '@/lib/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import parse from 'html-react-parser';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';
import { useRouter, useParams } from 'next/navigation';

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
    const [rotation, setRotation] = useState(0);

    return (
        <div className="not-prose space-y-2 my-4">
            <div className="flex items-center gap-2 justify-center">
                <Button variant="outline" size="icon" onClick={() => setRotation(r => r + 90)}><RotateCw className="h-4 w-4" /></Button>
            </div>
            <div className="w-full overflow-auto border rounded-md bg-muted p-2">
                 <div
                    className="flex justify-center items-center transition-transform duration-200"
                    style={{ transform: `rotate(${rotation}deg)`}}
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
    const bookId = params.bookId as string;

    const [currentPage, setCurrentPage] = useState(1);
    const [jumpToPageInput, setJumpToPageInput] = useState('');


    // --- Data Fetching ---
    const { data: selectedBook, isLoading: isLoadingBook, isError: isBookError, error: bookError } = useQuery<BookType>({
        queryKey: ['bookById', bookId],
        queryFn: () => getBookById(bookId),
        enabled: !!bookId,
    });

    const { data: chapters, isLoading: isLoadingChapters } = useQuery<Chapter[]>({
        queryKey: ['chaptersByBook', bookId],
        queryFn: () => getChaptersByBook(bookId),
        enabled: !!bookId,
    });
    
    const { data: sections, isLoading: isLoadingSections } = useQuery<Section[]>({
        queryKey: ['sectionsByBook', bookId],
        queryFn: () => getSectionsByBook(bookId),
        enabled: !!bookId,
    });

    const { data: allPageContents, isLoading: isLoadingAllPages } = useQuery<PageContent[]>({
        queryKey: ['allPagesByBook', bookId],
        queryFn: () => getPagesByBook(bookId),
        enabled: !!bookId,
    });

    // --- Memoized Data processing ---
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
    const goToPage = (pageNumber: number) => {
        if (pageNumbers.includes(pageNumber)) {
            setCurrentPage(pageNumber);
        } else {
            toast({
                variant: 'destructive',
                description: `Page ${pageNumber} does not exist in this book.`
            });
        }
    };
    
    const handleGoToSection = (section: Section) => {
        const firstPageOfSection = allPageContents?.find(p => p.section_id === section.section_id);
        if (firstPageOfSection) {
            goToPage(parseInt(firstPageOfSection.page_number, 10));
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
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline"><List className="mr-2 h-4 w-4" />Contents</Button>
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
            </div>
        </header>

        <Card>
            <CardHeader>
                    <CardTitle className="text-2xl font-headline">{selectedBook.book_name}</CardTitle>
                    <CardDescription>Page {currentPage} of {pageNumbers[pageNumbers.length - 1] || 1}</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[50vh]">
                {isLoadingAllPages ? <Loader2 className="mx-auto h-8 w-8 animate-spin" /> : (
                    <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
                        {pageContent?.map(content => (
                            <div key={content.pege_entry_id}>
                                {content.page_type === 'image' && content.image_url ? (
                                    <ImageViewer 
                                        src={`${CONTENT_PROVIDER_URL}${content.image_url}`}
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
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => goToPage(1)} disabled={currentPage === 1}><ChevronsLeft className="h-4 w-4"/></Button>
                    <Button variant="outline" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4"/> Prev</Button>
                </div>
                <div className="flex items-center gap-2">
                        <Input 
                        type="number" 
                        placeholder={`Page...`} 
                        className="w-20 h-9 text-center"
                        value={jumpToPageInput}
                        onChange={(e) => setJumpToPageInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleJumpToPage()}
                        />
                        <Button size="sm" onClick={handleJumpToPage}>Go</Button>
                </div>
                <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === pageNumbers[pageNumbers.length - 1]}>Next <ChevronRight className="h-4 w-4"/></Button>
                        <Button variant="outline" size="icon" onClick={() => goToPage(pageNumbers[pageNumbers.length - 1])} disabled={currentPage === pageNumbers[pageNumbers.length - 1]}><ChevronsRight className="h-4 w-4"/></Button>
                </div>
            </CardFooter>
        </Card>
    </div>
    )
}
