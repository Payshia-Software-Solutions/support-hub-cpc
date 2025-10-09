
"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertTriangle, PlusCircle, Loader2, ArrowLeft, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deletePage, getPagesByBookChapterSection } from '@/lib/actions/books';
import type { PageContent } from '@/lib/types';
import { format } from 'date-fns';
import parse from 'html-react-parser';
import Link from 'next/link';
import Image from 'next/image';

const CONTENT_PROVIDER_URL = 'https://content-provider.pharmacollege.lk/books/';

export default function SectionPagesPage() {
    const params = useParams();
    const router = useRouter();
    const { bookId, chapterId, sectionId } = params as { bookId: string; chapterId: string; sectionId: string; };

    const [pageToDelete, setPageToDelete] = useState<PageContent | null>(null);
    const queryClient = useQueryClient();

    const { data: pages, isLoading, isError, error } = useQuery<PageContent[]>({
        queryKey: ['pages', bookId, chapterId, sectionId],
        queryFn: () => getPagesByBookChapterSection(bookId, chapterId, sectionId),
        enabled: !!bookId && !!chapterId && !!sectionId,
    });

    const deleteMutation = useMutation({
        mutationFn: (pageId: string) => deletePage(pageId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pages', bookId, chapterId, sectionId] });
            toast({ title: 'Success', description: 'Page deleted successfully.' });
        },
        onError: (error: Error) => toast({ variant: 'destructive', title: 'Error', description: error.message }),
        onSettled: () => setPageToDelete(null),
    });

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <AlertDialog open={!!pageToDelete} onOpenChange={() => setPageToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this page content. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(pageToDelete!.pege_entry_id)} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                     <Button variant="ghost" onClick={() => router.push(`/admin/manage/books/${bookId}/chapters/${chapterId}`)} className="-ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4"/> Back to Sections
                    </Button>
                    <h1 className="text-3xl font-headline font-semibold mt-2">Page Content</h1>
                </div>
                <Button asChild>
                    <Link href={`/admin/manage/books/${bookId}/chapters/${chapterId}/sections/${sectionId}/create`}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Page Content
                    </Link>
                </Button>
            </header>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Content Entries</CardTitle>
                    <CardDescription>All content entries for this section, sorted by order.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
                        </div>
                    ) : isError ? (
                        <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{(error as Error).message}</AlertDescription></Alert>
                    ) : pages && pages.length > 0 ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {pages.sort((a,b) => {
                                if (a.page_number === b.page_number) {
                                    return parseInt(a.content_order) - parseInt(b.content_order);
                                }
                                return parseInt(a.page_number) - parseInt(b.page_number);
                            }).map(page => (
                                <Card key={page.pege_entry_id} className="bg-muted/50 flex flex-col">
                                    <CardHeader className="flex flex-row justify-between items-start pb-2">
                                        <div>
                                            <CardTitle className="text-base">Page {page.page_number} - #{page.content_order}</CardTitle>
                                            <CardDescription className="text-xs">
                                                Updated: {format(new Date(page.updated_at), 'dd MMM, yyyy')}
                                            </CardDescription>
                                        </div>
                                         <div className="flex flex-col items-center">
                                            <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                                                <Link href={`/admin/manage/books/${bookId}/chapters/${chapterId}/sections/${sectionId}/edit/${page.pege_entry_id}`}>
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setPageToDelete(page)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-grow flex items-center justify-center p-2">
                                        {page.page_type === 'image' && page.page_content_text ? (
                                            <div className="relative h-40 w-full rounded-md overflow-hidden border bg-white">
                                                <Image src={`${CONTENT_PROVIDER_URL}${page.page_content_text}`} alt={`Content for page ${page.page_number}`} layout="fill" objectFit="contain"/>
                                            </div>
                                        ) : page.page_type === 'text' && page.page_content_text ? (
                                            <div className="h-40 w-full overflow-y-auto p-2 border rounded-md text-xs prose prose-sm dark:prose-invert">
                                                {parse(page.page_content_text)}
                                            </div>
                                        ) : (
                                            <div className="h-40 w-full flex items-center justify-center text-muted-foreground text-xs italic">
                                                No preview available
                                            </div>
                                        )}
                                    </CardContent>
                                     {page.keywords && (
                                        <div className="p-2 pt-0 text-xs text-muted-foreground truncate">
                                            <strong>Keywords:</strong> {page.keywords}
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-10">No page content found for this section yet.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
