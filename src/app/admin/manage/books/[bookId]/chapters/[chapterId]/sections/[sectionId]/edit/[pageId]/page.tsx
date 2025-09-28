
"use client";

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { getPagesByBookChapterSection, updatePage } from '@/lib/actions/books';
import type { PageContent } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TiptapEditor } from '@/components/admin/TiptapEditor';
import { ArrowLeft, Loader2, Save, Image as ImageIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const pageFormSchema = z.object({
  page_number: z.string().min(1, "Page number is required."),
  content_order: z.string().min(1, "Content order is required."),
  page_type: z.enum(['text', 'image']),
  page_content_text: z.string().optional(),
  image_file: z.any().optional(),
  keywords: z.string().optional(),
}).refine(data => {
    if (data.page_type === 'text') return !!data.page_content_text && data.page_content_text.length > 0;
    return true;
}, {
    message: "Page content is required for text type.",
    path: ["page_content_text"],
});

type PageFormValues = z.infer<typeof pageFormSchema>;

export default function EditPageContentPage() {
    const router = useRouter();
    const params = useParams();
    const { bookId, chapterId, sectionId, pageId } = params as { bookId: string; chapterId: string; sectionId: string; pageId: string };
    const queryClient = useQueryClient();

    const { data: page, isLoading, isError, error } = useQuery<PageContent | undefined>({
        queryKey: ['page', pageId],
        queryFn: async () => {
            const pages = await getPagesByBookChapterSection(bookId, chapterId, sectionId);
            return pages.find(p => p.pege_entry_id === pageId);
        },
        enabled: !!bookId && !!chapterId && !!sectionId && !!pageId,
    });
    
    const form = useForm<PageFormValues>({
        resolver: zodResolver(pageFormSchema),
    });
    const pageType = form.watch('page_type');

    useEffect(() => {
        if (page) {
            form.reset({
                page_number: page.page_number,
                content_order: page.content_order,
                page_type: page.page_type,
                page_content_text: page.page_content_text || '',
                keywords: page.keywords,
            });
        }
    }, [page, form]);

    const mutation = useMutation({
        mutationFn: (formData: FormData) => updatePage(pageId, formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pages', bookId, chapterId, sectionId] });
            queryClient.invalidateQueries({ queryKey: ['page', pageId] });
            toast({ title: 'Success', description: 'Page content updated successfully.' });
            router.push(`/admin/manage/books/${bookId}/chapters/${chapterId}/sections/${sectionId}`);
        },
        onError: (error: Error) => toast({ variant: 'destructive', title: 'Error', description: error.message })
    });
    
    const onSubmit = (data: PageFormValues) => {
        const formData = new FormData();
        formData.append('book_id', bookId);
        formData.append('chapter_id', chapterId);
        formData.append('section_id', sectionId);
        formData.append('page_number', data.page_number);
        formData.append('content_order', data.content_order);
        formData.append('page_type', data.page_type);
        if (data.keywords) formData.append('keywords', data.keywords);

        if (data.page_type === 'text' && data.page_content_text) {
            formData.append('page_content_text', data.page_content_text);
        } else if (data.page_type === 'image' && data.image_file?.[0]) {
            formData.append('image_file', data.image_file[0]);
        }
        mutation.mutate(formData);
    };
    
    if (isLoading) {
        return (
             <div className="p-4 md:p-8 space-y-6">
                <Skeleton className="h-10 w-48" />
                <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent><CardFooter><Skeleton className="h-10 w-32" /></CardFooter></Card>
            </div>
        );
    }

    if (isError || !page) {
        return (
             <div className="p-4 md:p-8 space-y-6">
                 <Button variant="ghost" onClick={() => router.back()} className="-ml-4"><ArrowLeft className="mr-2 h-4 w-4"/> Back</Button>
                 <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Failed to load page content</AlertTitle><AlertDescription>{(error as Error)?.message || "The page content could not be found."}</AlertDescription></Alert>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <Button variant="ghost" onClick={() => router.back()} className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Section
                </Button>
                <h1 className="text-3xl font-headline font-semibold mt-2">Edit Page Content</h1>
                <p className="text-muted-foreground">Modify the details for this content entry.</p>
            </header>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card className="shadow-lg">
                    <CardHeader><CardTitle>Content Details</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="page_number">Page Number</Label><Input id="page_number" {...form.register('page_number')} />{form.formState.errors.page_number && <p className="text-sm text-destructive">{form.formState.errors.page_number.message}</p>}</div>
                            <div className="space-y-2"><Label htmlFor="content_order">Order</Label><Input id="content_order" {...form.register('content_order')} />{form.formState.errors.content_order && <p className="text-sm text-destructive">{form.formState.errors.content_order.message}</p>}</div>
                        </div>
                        <div className="space-y-2"><Label htmlFor="keywords">Keywords</Label><Input id="keywords" {...form.register('keywords')} placeholder="e.g. pharmacology, dosage"/>{form.formState.errors.keywords && <p className="text-sm text-destructive">{form.formState.errors.keywords.message}</p>}</div>
                        
                        <Controller
                            name="page_type"
                            control={form.control}
                            render={({ field }) => (
                                <div className="space-y-2">
                                    <Label>Content Type</Label>
                                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="text" id="type-text" /><Label htmlFor="type-text">Text</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="image" id="type-image" /><Label htmlFor="type-image">Image</Label></div>
                                    </RadioGroup>
                                </div>
                            )}
                        />

                        {pageType === 'text' ? (
                             <Controller
                                name="page_content_text"
                                control={form.control}
                                render={({ field }) => (
                                    <div className="space-y-2">
                                        <Label>Content</Label>
                                        <TiptapEditor 
                                            key={page.pege_entry_id}
                                            content={field.value || ''} 
                                            onChange={field.onChange} 
                                        />
                                        {form.formState.errors.page_content_text && <p className="text-sm text-destructive">{form.formState.errors.page_content_text.message}</p>}
                                    </div>
                                )}
                            />
                        ) : (
                             <div className="space-y-2">
                                <Label htmlFor="image_file">Upload New Image</Label>
                                 {page.image_url && <div className="relative h-48 w-full border rounded-md overflow-hidden bg-muted"><Image src={page.image_url} alt="Current image" layout="fill" objectFit="contain" /></div>}
                                <div className="flex items-center gap-2 p-2 border rounded-lg mt-2">
                                    <ImageIcon className="h-5 w-5 text-muted-foreground"/>
                                    <Input id="image_file" type="file" {...form.register('image_file')} className="border-0 shadow-none file:mr-2 file:rounded-full file:bg-primary/10 file:text-primary file:font-semibold file:border-0 file:px-2 file:py-1 file:text-xs"/>
                                </div>
                                <p className="text-xs text-muted-foreground">Uploading a new image will replace the existing one.</p>
                                {form.formState.errors.image_file && <p className="text-sm text-destructive">{(form.formState.errors.image_file as any).message}</p>}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" /> Save Changes
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
