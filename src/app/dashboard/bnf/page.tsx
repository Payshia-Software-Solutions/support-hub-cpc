
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, ListOrdered, Search, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import type { BnfChapter, BnfPage } from '@/lib/bnf-data';

// --- API Fetching ---
const fetchBnfData = async (): Promise<{ chapters: BnfChapter[], pages: BnfPage[], index: { word: string; page: number }[] }> => {
    const response = await fetch('/api/bnf');
    if (!response.ok) {
        throw new Error('Failed to fetch BNF data');
    }
    return response.json();
};


export default function BnfPage() {
    const [view, setView] = useState<'contents' | 'page' | 'index'>('contents');
    const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState('');

    const { data: bnfData, isLoading, isError, error } = useQuery({
      queryKey: ['bnfData'],
      queryFn: fetchBnfData,
      staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });

    const bnfChapters = bnfData?.chapters || [];
    const allPages = bnfData?.pages || [];
    const wordIndexData = bnfData?.index || [];

    const handleNextPage = () => {
        if (selectedPageIndex < allPages.length - 1) {
            setSelectedPageIndex(prev => prev + 1);
        }
    };

    const handlePrevPage = () => {
        if (selectedPageIndex > 0) {
            setSelectedPageIndex(prev => prev - 1);
        }
    };
    
    const handleSelectPage = (pageId: number) => {
        const pageIndex = allPages.findIndex(p => p.id === pageId);
        if (pageIndex !== -1) {
            setSelectedPageIndex(pageIndex);
            setView('page');
        }
    }

    const handleBackToContents = () => {
        setView('contents');
    }
    
    const filteredChapters = useMemo(() => {
      if (!bnfChapters) return [];
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      if (!lowercasedSearchTerm) return bnfChapters;

      return bnfChapters.map(chapter => {
          const filteredPages = chapter.pages.filter(page => 
              page.title.toLowerCase().includes(lowercasedSearchTerm)
          );
          return { ...chapter, pages: filteredPages };
      }).filter(chapter => 
          chapter.title.toLowerCase().includes(lowercasedSearchTerm) || chapter.pages.length > 0
      );
    }, [bnfChapters, searchTerm]);
    
    const filteredIndexWords = useMemo(() => {
      if (!wordIndexData) return [];
      return wordIndexData.filter(item => 
          item.word.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }, [wordIndexData, searchTerm]);

    const renderView = () => {
        if (isLoading) {
            return (
                 <div className="p-4 md:p-8 space-y-6 pb-20 h-full flex flex-col">
                    <header className="flex justify-between items-center mb-4 border-b pb-2">
                        <Skeleton className="h-10 w-1/3" />
                        <Skeleton className="h-10 w-24" />
                    </header>
                    <Skeleton className="h-10 w-full mb-6" />
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                </div>
            );
        }

        if (isError) {
            return (
                 <div className="p-4 md:p-8 space-y-6 pb-20">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <CardTitle>Error Loading Data</CardTitle>
                        <CardDescription>{error instanceof Error ? error.message : 'An unknown error occurred'}</CardDescription>
                    </Alert>
                </div>
            )
        }


        switch (view) {
            case 'page':
                const currentPageData = allPages[selectedPageIndex];
                if (!currentPageData) return null;
                return (
                    <div className="p-4 md:p-8 font-serif h-full flex flex-col">
                        <header className="flex justify-between items-center mb-4 border-b-2 pb-2 shrink-0">
                            <Button variant="link" onClick={handleBackToContents} className="font-sans text-muted-foreground pl-0">
                                <ArrowLeft className="mr-2 h-4 w-4"/> Back to Contents
                            </Button>
                            <h3 className="text-sm font-sans font-semibold text-muted-foreground">{currentPageData.indexWords}</h3>
                        </header>

                        <article className="space-y-6">
                             <div>
                                <h1 className="text-4xl font-bold text-foreground leading-tight">
                                    {currentPageData.leftContent.heading}
                                </h1>
                            </div>
                             <div className="space-y-4 text-base leading-relaxed text-foreground/90">
                                {currentPageData.leftContent.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
                            </div>
                            {currentPageData.leftContent.subHeading && (
                                    <div>
                                    <h2 className="text-2xl font-bold text-foreground mt-8">
                                        {currentPageData.leftContent.subHeading}
                                    </h2>
                                </div>
                            )}
                             <ul className="space-y-5 text-base leading-relaxed text-foreground/90">
                                {currentPageData.rightContent.list.map((item, i) => (
                                    <li key={i}>
                                        <strong className="font-semibold">{item.bold}</strong> {item.text}
                                    </li>
                                ))}
                            </ul>
                            {currentPageData.rightContent.note && (
                                <p className="text-sm text-muted-foreground pt-8">
                                    {currentPageData.rightContent.note}
                                </p>
                            )}
                        </article>
                        
                        <footer className="flex justify-between items-center text-center mt-auto pt-4 border-t-2 text-sm text-muted-foreground font-sans shrink-0">
                            <Button variant="outline" onClick={handlePrevPage} disabled={selectedPageIndex === 0}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                            </Button>
                            <span>Page {currentPageData.id}</span>
                            <Button variant="outline" onClick={handleNextPage} disabled={selectedPageIndex === allPages.length - 1}>
                                Next <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </footer>
                    </div>
                );
            case 'index':
                 return (
                    <div className="p-4 md:p-8 space-y-6 pb-20 font-serif h-full flex flex-col">
                        <header className="flex justify-between items-center mb-4 border-b pb-2">
                             <div className="flex-1">
                                <h1 className="text-3xl font-bold">Word Index</h1>
                                <p className="text-sm text-muted-foreground mt-1">Alphabetical index of words found in the formulary.</p>
                            </div>
                            <Button variant="outline" onClick={handleBackToContents} className="font-sans ml-4 shrink-0">
                                <ArrowLeft className="mr-2 h-4 w-4"/> Back to Contents
                            </Button>
                        </header>
                         <div className="relative mb-6">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search Word Index..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-full font-sans"
                            />
                        </div>
                        <Card className="p-6 flex-1 overflow-y-auto">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2 text-sm font-sans">
                               {filteredIndexWords.map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSelectPage(item.page)}
                                        className="text-left hover:text-primary hover:underline flex justify-between"
                                    >
                                        <span>{item.word}</span>
                                        <span>{item.page}</span>
                                    </button>
                               ))}
                            </div>
                            {filteredIndexWords.length === 0 && (
                                <p className="text-center text-muted-foreground py-10 font-sans">No results found for "{searchTerm}".</p>
                            )}
                        </Card>
                    </div>
                );
            case 'contents':
            default:
                return (
                    <div className="p-4 md:p-8 space-y-8 pb-20 h-full flex flex-col">
                        <header className="text-center">
                            <h1 className="text-4xl font-serif font-bold text-foreground">Table of Contents</h1>
                        </header>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="relative flex-grow w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search Table of Contents by title..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 w-full"
                                />
                            </div>
                            <Button variant="outline" onClick={() => { setSearchTerm(''); setView('index'); }} className="w-full sm:w-auto">
                                <ListOrdered className="mr-2 h-4 w-4" /> Word Index
                            </Button>
                        </div>
                        <div className="space-y-6 font-serif flex-1 overflow-y-auto pr-4 -mr-4">
                            {filteredChapters.map(chapter => (
                                <div key={chapter.id}>
                                    <h2 className="font-bold text-xl mb-2 flex justify-between items-baseline text-foreground">
                                        <span>{chapter.title}</span>
                                        <span className="text-sm font-sans font-normal text-muted-foreground">Page {chapter.pages[0]?.id}</span>
                                    </h2>
                                    <ul className="space-y-1 border-l-2 pl-4 ml-2 border-border">
                                        {chapter.pages.map(page => (
                                            <li key={page.id}>
                                                <button
                                                    onClick={() => handleSelectPage(page.id)}
                                                    className="w-full text-left p-2 rounded-md hover:bg-accent/50 transition-colors flex justify-between items-baseline text-muted-foreground"
                                                >
                                                    <span>{page.title}</span>
                                                    <span className="text-sm font-sans text-muted-foreground">Page {page.id}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                             {filteredChapters.length === 0 && (
                                <p className="text-center text-muted-foreground py-10">No results found for "{searchTerm}".</p>
                            )}
                        </div>
                    </div>
                );
        }
    };


  return (
    <div className="h-full flex flex-col">
        {renderView()}
    </div>
  );
}
