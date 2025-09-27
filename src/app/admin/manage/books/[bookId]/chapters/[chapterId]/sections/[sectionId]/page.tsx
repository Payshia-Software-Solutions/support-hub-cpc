
"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertTriangle, PlusCircle, Loader2, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deletePage, getPagesByBookChapterSection } from '@/lib/actions/books';
import type { PageContent } from '@/lib/types';
import { format } from 'date-fns';
import parse from 'html-react-parser';
import Link from 'next/link';

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
                <CardContent className="space-y-4">
                    {isLoading ? (
                        <div className="space-y-2">
                            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                        </div>
                    ) : isError ? (
                        <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{(error as Error).message}</AlertDescription></Alert>
                    ) : pages && pages.length > 0 ? (
                        pages.sort((a,b) => parseInt(a.content_order) - parseInt(b.content_order)).map(page => (
                            <Card key={page.pege_entry_id} className="bg-muted/50">
                                <CardHeader className="flex flex-row justify-between items-start">
                                    <div>
                                        <CardTitle className="text-base">Page {page.page_number} - Order {page.content_order}</CardTitle>
                                        <CardDescription className="text-xs">Last updated: {format(new Date(page.updated_at), 'PPP')}</CardDescription>
                                    </div>
                                    <div className="space-x-1">
                                        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                                            <Link href={`/admin/manage/books/${bookId}/chapters/${chapterId}/sections/${sectionId}/edit/${page.pege_entry_id}`}>
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setPageToDelete(page)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="prose prose-sm dark:prose-invert max-w-none">{parse(page.page_content_text)}</div>
                                    {page.keywords && (
                                        <div className="mt-2 text-xs text-muted-foreground">
                                            <strong>Keywords:</strong> {page.keywords}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground py-10">No page content found for this section yet.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
