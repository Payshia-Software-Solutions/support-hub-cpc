
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Book, List, Search, Loader2, AlertTriangle, ArrowRight, BookOpen, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, BookText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { getBooks, getChaptersByBook, getSectionsByBook, getPagesByBook, getBnfWordIndex } from '@/lib/actions/books';
import type { Book as BookType, Chapter, Section, PageContent, BnfWordIndexEntry } from '@/lib/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import parse from 'html-react-parser';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';

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

const ImageViewer = ({ src, alt }: { src: string; alt: string }) => {
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);

    return (
        <div className="not-prose space-y-2 my-4">
            <div className="flex items-center gap-2 justify-center">
                <Button variant="outline" size="icon" onClick={() => setScale(s => s + 0.2)}><ZoomIn className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" onClick={() => setScale(s => Math.max(0.2, s - 0.2))}><ZoomOut className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" onClick={() => setRotation(r => r + 90)}><RotateCw className="h-4 w-4" /></Button>
            </div>
            <div className="w-full overflow-auto border rounded-md bg-muted p-2">
                 <div
                    className="flex justify-center items-center transition-transform duration-200"
                    style={{ transform: `scale(${scale}) rotate(${rotation}deg)`}}
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


export default function BnfPage() {
    const [view, setView] = useState<BnfView>('books');
    const [selectedBook, setSelectedBook] = useState<BookType | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [indexSearchTerm, setIndexSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpToPageInput, setJumpToPageInput] = useState('');


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

    const { data: wordIndex, isLoading: isLoadingWordIndex } = useQuery<BnfWordIndexEntry[]>({
        queryKey: ['bnfWordIndex', selectedBook?.book_id],
        queryFn: getBnfWordIndex,
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

    const filteredWordIndex = useMemo(() => {
        if (!wordIndex) return [];
        return wordIndex.filter(entry => entry.word.toLowerCase().includes(indexSearchTerm.toLowerCase()));
    }, [wordIndex, indexSearchTerm]);

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
                <header className="flex justify-between items-center gap-2">
                    <Button variant="ghost" onClick={handleBackToBooks} className="-ml-4">
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
                         <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline"><BookText className="mr-2 h-4 w-4" />Index</Button>
                            </SheetTrigger>
                            <SheetContent>
                                <CardHeader>
                                    <CardTitle>Keyword Index</CardTitle>
                                    <CardDescription>
                                         <div className="relative pt-2">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                placeholder="Search index..." 
                                                className="pl-10 h-9" 
                                                value={indexSearchTerm}
                                                onChange={(e) => setIndexSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </CardDescription>
                                </CardHeader>
                                <div className="h-[calc(100%-140px)] overflow-y-auto">
                                    <CardContent>
                                        {isLoadingWordIndex ? <p>Loading...</p> : (
                                            <div className="flex flex-col gap-1 text-sm">
                                                {filteredWordIndex.map((entry, i) => (
                                                    <button key={i} onClick={() => goToPage(entry.page_id)} className="flex justify-between items-center p-2 rounded hover:bg-accent">
                                                        <span>{entry.word}</span>
                                                        <span className="text-muted-foreground">{entry.page_id}</span>
                                                    </button>
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



    
