
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertTriangle, PlusCircle, Loader2, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getPagesByBookChapterSection, createPage, updatePage, deletePage } from '@/lib/actions/books';
import type { PageContent, CreatePagePayload, UpdatePagePayload } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

const pageFormSchema = z.object({
  page_number: z.string().min(1, "Page number is required."),
  content_order: z.string().min(1, "Content order is required."),
  page_content_text: z.string().min(1, "Page content is required."),
});

type PageFormValues = z.infer<typeof pageFormSchema>;

const PageForm = ({ bookId, chapterId, sectionId, page, onClose }: { bookId: string, chapterId: string, sectionId: string, page?: PageContent | null, onClose: () => void; }) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    
    const form = useForm<PageFormValues>({
        resolver: zodResolver(pageFormSchema),
        defaultValues: {
            page_number: page?.page_number || '',
            content_order: page?.content_order || '',
            page_content_text: page?.page_content_text || '',
        }
    });

    useEffect(() => {
        form.reset({
            page_number: page?.page_number || '',
            content_order: page?.content_order || '',
            page_content_text: page?.page_content_text || '',
        });
    }, [page, form]);

    const mutation = useMutation({
        mutationFn: (data: PageFormValues) => {
            if (!user?.username) throw new Error('You must be logged in.');
            
            if (page) {
                 const payload: UpdatePagePayload = { ...data };
                 return updatePage(page.pege_entry_id, payload);
            } else {
                 const payload: CreatePagePayload = { ...data, book_id: bookId, chapter_id: chapterId, section_id: sectionId, created_by: user.username };
                 return createPage(payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pages', bookId, chapterId, sectionId] });
            toast({ title: 'Success', description: `Page content ${page ? 'updated' : 'created'} successfully.` });
            onClose();
        },
        onError: (error: Error) => toast({ variant: 'destructive', title: 'Error', description: error.message })
    });

    return (
        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="page_number">Page Number</Label><Input id="page_number" {...form.register('page_number')} />{form.formState.errors.page_number && <p className="text-sm text-destructive">{form.formState.errors.page_number.message}</p>}</div>
                <div className="space-y-2"><Label htmlFor="content_order">Order</Label><Input id="content_order" {...form.register('content_order')} />{form.formState.errors.content_order && <p className="text-sm text-destructive">{form.formState.errors.content_order.message}</p>}</div>
            </div>
            <div className="space-y-2"><Label htmlFor="page_content_text">Content</Label><Textarea id="page_content_text" {...form.register('page_content_text')} rows={8} />{form.formState.errors.page_content_text && <p className="text-sm text-destructive">{form.formState.errors.page_content_text.message}</p>}</div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" disabled={mutation.isPending}>Cancel</Button></DialogClose>
                <Button type="submit" disabled={mutation.isPending}>{mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{page ? "Save Changes" : "Create Page"}</Button>
            </DialogFooter>
        </form>
    );
}


export default function SectionPagesPage() {
    const params = useParams();
    const router = useRouter();
    const { bookId, chapterId, sectionId } = params as { bookId: string; chapterId: string; sectionId: string; };

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedPage, setSelectedPage] = useState<PageContent | null>(null);
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

    const handleCreate = () => { setSelectedPage(null); setIsFormOpen(true); }
    const handleEdit = (page: PageContent) => { setSelectedPage(page); setIsFormOpen(true); }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedPage ? "Edit" : "Add New"} Page Content</DialogTitle>
                        <DialogDescription>Manage the content for this section.</DialogDescription>
                    </DialogHeader>
                    <PageForm bookId={bookId} chapterId={chapterId} sectionId={sectionId} page={selectedPage} onClose={() => setIsFormOpen(false)} />
                </DialogContent>
            </Dialog>

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
                <Button onClick={handleCreate}><PlusCircle className="mr-2 h-4 w-4" /> Add Page Content</Button>
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
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(page)}><Edit className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setPageToDelete(page)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{page.page_content_text}</div>
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
