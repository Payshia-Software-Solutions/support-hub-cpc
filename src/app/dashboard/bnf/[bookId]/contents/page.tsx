
"use client";

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { getBookById, getChaptersByBook, getSectionsByBook, getPagesByBook } from '@/lib/actions/books';
import type { Book as BookType, Chapter, Section, PageContent } from '@/lib/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function BnfContentsPage() {
    const router = useRouter();
    const params = useParams();
    const bookId = params.bookId as string;

    // --- Data Fetching ---
    const { data: selectedBook, isLoading: isLoadingBook } = useQuery<BookType>({
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

    const { data: allPageContents } = useQuery<PageContent[]>({
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

    const getFirstPageOfSection = (sectionId: string): number => {
        const firstPage = allPageContents?.find(p => p.section_id === sectionId);
        return firstPage ? parseInt(firstPage.page_number, 10) : 1;
    };

    const isLoading = isLoadingBook || isLoadingChapters || isLoadingSections;

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
                            <CardTitle className="text-2xl font-headline flex items-center gap-2"><BookOpen className="h-6 w-6"/>Table of Contents</CardTitle>
                            <CardDescription>Book: {selectedBook?.book_name}</CardDescription>
                        </>
                    )}
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                           <Skeleton className="h-12 w-full"/>
                           <Skeleton className="h-12 w-full"/>
                           <Skeleton className="h-12 w-full"/>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {groupedToc.map(chapter => (
                                <Collapsible key={chapter.chapter_id} className="p-2 border-b">
                                    <CollapsibleTrigger className="w-full text-left font-semibold py-2 text-lg">{chapter.chapter_number}. {chapter.chapter_title}</CollapsibleTrigger>
                                    <CollapsibleContent className="mt-2 pl-4 space-y-1">
                                        {chapter.sections.map(section => (
                                            <Link 
                                                key={section.section_id} 
                                                href={`/dashboard/bnf/${bookId}?page=${getFirstPageOfSection(section.section_id)}`}
                                                className="block text-sm p-2 rounded hover:bg-accent"
                                            >
                                                {chapter.chapter_number}.{section.section_order} {section.section_heading}
                                            </Link>
                                        ))}
                                    </CollapsibleContent>
                                </Collapsible>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
