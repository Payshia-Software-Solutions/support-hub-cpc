
"use client";

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { createPage } from '@/lib/actions/books';
import type { CreatePagePayload } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TiptapEditor } from '@/components/admin/TiptapEditor';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

const pageFormSchema = z.object({
  page_number: z.string().min(1, "Page number is required."),
  content_order: z.string().min(1, "Content order is required."),
  page_content_text: z.string().min(1, "Page content is required."),
  keywords: z.string().optional(),
});

type PageFormValues = z.infer<typeof pageFormSchema>;

export default function CreatePageContentPage() {
    const router = useRouter();
    const params = useParams();
    const { bookId, chapterId, sectionId } = params as { bookId: string; chapterId: string; sectionId: string; };
    const queryClient = useQueryClient();
    const { user } = useAuth();
    
    const form = useForm<PageFormValues>({
        resolver: zodResolver(pageFormSchema),
        defaultValues: { page_number: '', content_order: '', page_content_text: '', keywords: '' }
    });

    const mutation = useMutation({
        mutationFn: (data: PageFormValues) => {
            if (!user?.username) throw new Error('You must be logged in.');
            const payload: CreatePagePayload = { 
                ...data, 
                book_id: bookId, 
                chapter_id: chapterId, 
                section_id: sectionId, 
                created_by: user.username 
            };
            return createPage(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pages', bookId, chapterId, sectionId] });
            toast({ title: 'Success', description: 'Page content created successfully.' });
            router.push(`/admin/manage/books/${bookId}/chapters/${chapterId}/sections/${sectionId}`);
        },
        onError: (error: Error) => toast({ variant: 'destructive', title: 'Error', description: error.message })
    });

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <Button variant="ghost" onClick={() => router.back()} className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Section
                </Button>
                <h1 className="text-3xl font-headline font-semibold mt-2">Add New Page Content</h1>
                <p className="text-muted-foreground">Fill in the details for the new content entry.</p>
            </header>
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
                <Card className="shadow-lg">
                    <CardHeader><CardTitle>Content Details</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="page_number">Page Number</Label><Input id="page_number" {...form.register('page_number')} />{form.formState.errors.page_number && <p className="text-sm text-destructive">{form.formState.errors.page_number.message}</p>}</div>
                            <div className="space-y-2"><Label htmlFor="content_order">Order</Label><Input id="content_order" {...form.register('content_order')} />{form.formState.errors.content_order && <p className="text-sm text-destructive">{form.formState.errors.content_order.message}</p>}</div>
                        </div>
                        <div className="space-y-2"><Label htmlFor="keywords">Keywords</Label><Input id="keywords" {...form.register('keywords')} placeholder="e.g. pharmacology, dosage"/>{form.formState.errors.keywords && <p className="text-sm text-destructive">{form.formState.errors.keywords.message}</p>}</div>
                        <Controller
                            name="page_content_text"
                            control={form.control}
                            render={({ field }) => (
                                <div className="space-y-2">
                                    <Label>Content</Label>
                                    <TiptapEditor content={field.value} onChange={field.onChange} />
                                    {form.formState.errors.page_content_text && <p className="text-sm text-destructive">{form.formState.errors.page_content_text.message}</p>}
                                </div>
                            )}
                        />
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" /> Create Page Content
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
