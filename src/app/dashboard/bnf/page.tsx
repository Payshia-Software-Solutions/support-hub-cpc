
"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Book, ChevronDown, ChevronRight, ListOrdered, Search, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { getBooks, getChaptersByBook, getSectionsByBook, getBnfPage } from '@/lib/actions/books';
import type { Book as BookType, Chapter, Section, PageContent } from '@/lib/types';
import { Alert, AlertTitle as ShadcnAlertTitle, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

// Simplified view state
type BnfView = 'books' | 'chapters' | 'page';

export default function BnfPage() {
    const [view, setView] = useState<BnfView>('books');
    const [selectedBook, setSelectedBook] = useState<BookType | null>(null);
    const [selectedPage, setSelectedPage] = useState<PageContent | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const { data: books, isLoading: isLoadingBooks, isError: isBooksError, error: booksError } = useQuery<BookType[]>({
        queryKey: ['allBooks'],
        queryFn: getBooks,
        staleTime: 1000 * 60 * 10, // 10 minutes
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

    const handleSelectBook = (book: BookType) => {
        setSelectedBook(book);
        setView('chapters');
    };

    const handleSelectPage = async (pageId: string) => {
        // This is a simplified fetch; in reality, you'd fetch page content by its ID
        // For now, we'll just simulate selecting a page.
        // const pageContent = await getBnfPage(pageId);
        // setSelectedPage(pageContent);
        setView('page');
    };

    const handleBackToBooks = () => {
        setSelectedBook(null);
        setView('books');
    };
    
    const handleBackToChapters = () => {
        setSelectedPage(null);
        setView('chapters');
    };

    const filteredBooks = useMemo(() => {
        if (!books) return [];
        return books.filter(book => book.book_name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [books, searchTerm]);
    
    const groupedContent = useMemo(() => {
        if (!chapters || !sections) return [];
        return chapters.map(chapter => ({
            ...chapter,
            sections: sections.filter(s => s.chapter_id === chapter.chapter_id).sort((a,b) => parseInt(a.section_order) - parseInt(b.section_order))
        })).sort((a,b) => parseInt(a.chapter_number) - parseInt(b.chapter_number));
    }, [chapters, sections]);


    if (isLoadingBooks) {
        return (
            <div className="p-4 md:p-8 space-y-6">
                <header>
                    <Skeleton className="h-10 w-1/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
                </div>
            </div>
        );
    }
    
    if (isBooksError) {
         return (
            <div className="p-4 md:p-8">
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <ShadcnAlertTitle>Error Loading Books</ShadcnAlertTitle>
                    <AlertDescription>{(booksError as Error).message}</AlertDescription>
                </Alert>
            </div>
         );
    }
    
    if (view === 'chapters' && selectedBook) {
        return (
             <div className="p-4 md:p-8 space-y-6 pb-20">
                <header>
                    <Button variant="ghost" onClick={handleBackToBooks} className="-ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Library
                    </Button>
                    <h1 className="text-3xl font-headline font-semibold mt-2">{selectedBook.book_name}</h1>
                    <p className="text-muted-foreground">Table of Contents</p>
                </header>
                
                 {isLoadingChapters || isLoadingSections ? (
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                 ) : (
                    <div className="space-y-2">
                        {groupedContent.map(chapter => (
                            <Collapsible key={chapter.chapter_id} className="p-3 border rounded-lg" defaultOpen>
                                <CollapsibleTrigger className="w-full">
                                    <div className="flex justify-between items-center w-full">
                                        <h3 className="text-lg font-semibold text-left">{chapter.chapter_number}. {chapter.chapter_title}</h3>
                                        <ChevronDown className="h-5 w-5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                    </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-2 pt-2 border-t">
                                     <div className="space-y-1 pl-4">
                                        {chapter.sections.map(section => (
                                             <button key={section.section_id} onClick={() => alert('Viewing page content is not yet implemented.')} className="flex items-center gap-2 w-full text-left p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors">
                                                <span>{chapter.chapter_number}.{section.section_order}</span>
                                                <span className="flex-1">{section.section_heading}</span>
                                                <ChevronRight className="h-4 w-4"/>
                                            </button>
                                        ))}
                                     </div>
                                </CollapsibleContent>
                            </Collapsible>
                        ))}
                    </div>
                 )}

            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-8 pb-20">
            <header>
                <h1 className="text-3xl font-headline font-semibold">Books Library</h1>
                <p className="text-muted-foreground">Browse the available medical and pharmaceutical texts.</p>
            </header>
            
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search books..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBooks.map(book => (
                     <Card key={book.book_id} className="shadow-lg hover:shadow-xl hover:border-primary transition-all flex flex-col group cursor-pointer" onClick={() => handleSelectBook(book)}>
                        <CardHeader className="flex-row items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <Book className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-base group-hover:text-primary">{book.book_name}</CardTitle>
                                <CardDescription>{book.author}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow"></CardContent>
                        <CardFooter>
                            <Button variant="secondary" className="w-full">
                                Open Book <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform"/>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
            
            {filteredBooks.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                    <p>No books found matching your search.</p>
                </div>
            )}
        </div>
    );
}

