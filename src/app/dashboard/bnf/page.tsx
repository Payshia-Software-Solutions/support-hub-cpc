"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, ListOrdered, Search, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { getBnfChapters, getBnfWordIndex, getBnfPagesForChapter, getBnfPage } from '@/lib/api';
import type { BnfChapter, BnfPage, BnfWordIndexEntry } from '@/lib/types';
import { Alert } from '@/components/ui/alert';

export default function BnfPage() {
    const [view, setView] = useState<'contents' | 'page' | 'index'>('contents');
    const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const { data: bnfChapters, isLoading: isLoadingChapters, isError: isChaptersError, error: chaptersError } = useQuery({
        queryKey: ['bnfChapters'],
        queryFn: getBnfChapters,
        staleTime: 1000 * 60 * 5,
    });

    const { data: bnfPage, isLoading: isLoadingPage } = useQuery({
        queryKey: ['bnfPage', selectedPageId],
        queryFn: () => getBnfPage(selectedPageId!),
        enabled: !!selectedPageId,
        staleTime: 1000 * 60 * 5,
    });
    
    const { data: wordIndexData, isLoading: isLoadingIndex, isError: isIndexError, error: indexError } = useQuery({
        queryKey: ['bnfWordIndex'],
        queryFn: getBnfWordIndex,
        staleTime: 1000 * 60 * 5,
    });
    
    const handleSelectPage = (pageId: number) => {
        setSelectedPageId(pageId);
        setView('page');
    }

    const handleBackToContents = () => {
        setSelectedPageId(null);
        setView('contents');
    }
    
    const filteredChapters = useMemo(() => {
      if (!bnfChapters) return [];
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      if (!lowercasedSearchTerm) return bnfChapters;

      // This is a simplified search. A real implementation would fetch filtered results from the API.
      return bnfChapters.filter(chapter => 
          chapter.title.toLowerCase().includes(lowercasedSearchTerm)
      );
    }, [bnfChapters, searchTerm]);
    
    const filteredIndexWords = useMemo(() => {
      if (!wordIndexData) return [];
      return wordIndexData.filter(item => 
          item.word.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }, [wordIndexData, searchTerm]);
    
    const renderView = () => {
        const isLoading = isLoadingChapters || isLoadingIndex;
        const isError = isChaptersError || isIndexError;
        const error = chaptersError || indexError;

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
                        <CardDescription>{(error as Error).message}</CardDescription>
                    </Alert>
                </div>
            )
        }


        switch (view) {
            case 'page':
                if (isLoadingPage) {
                     return <div className="p-8"><Skeleton className="h-96 w-full" /></div>
                }
                if (!bnfPage) return <div className="p-8 text-center">Page not found.</div>;
                
                return (
                    <div className="p-4 md:p-8 font-serif h-full flex flex-col">
                        <header className="flex justify-between items-center mb-4 border-b-2 pb-2 shrink-0">
                            <Button variant="link" onClick={handleBackToContents} className="font-sans text-muted-foreground pl-0">
                                <ArrowLeft className="mr-2 h-4 w-4"/> Back to Contents
                            </Button>
                            <h3 className="text-sm font-sans font-semibold text-muted-foreground">{bnfPage.index_words}</h3>
                        </header>
                         <article className="space-y-6">
                            <div dangerouslySetInnerHTML={{ __html: bnfPage.left_content }} />
                            <div dangerouslySetInnerHTML={{ __html: bnfPage.right_content }} />
                         </article>
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
                                        onClick={() => handleSelectPage(item.page_id)}
                                        className="text-left hover:text-primary hover:underline flex justify-between"
                                    >
                                        <span>{item.word}</span>
                                        <span>{item.page_id}</span>
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
                                    </h2>
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