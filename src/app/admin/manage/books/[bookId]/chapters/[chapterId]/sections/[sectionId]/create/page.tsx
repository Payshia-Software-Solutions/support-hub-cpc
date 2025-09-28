
"use client";

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import type { CreatePagePayload } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TiptapEditor } from '@/components/admin/TiptapEditor';
import { ArrowLeft, Loader2, Save, Image as ImageIcon } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const pageFormSchema = z.object({
  page_number: z.string().min(1, "Page number is required."),
  content_order: z.string().min(1, "Content order is required."),
  page_type: z.enum(['text', 'image'], { required_error: 'You must select a content type.' }),
  page_content_text: z.string().optional(),
  image_file: z.any().optional(),
  keywords: z.string().optional(),
}).refine(data => {
    if (data.page_type === 'text') return !!data.page_content_text && data.page_content_text.length > 0;
    return true;
}, {
    message: "Page content is required for text type.",
    path: ["page_content_text"],
}).refine(data => {
    if (data.page_type === 'image') return !!data.image_file && data.image_file.length > 0;
    return true;
}, {
    message: "An image file is required for image type.",
    path: ["image_file"],
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
        defaultValues: { page_number: '', content_order: '', page_type: 'text', page_content_text: '', keywords: '' }
    });
    const pageType = form.watch('page_type');

    const mutation = useMutation({
        mutationFn: async (formData: FormData) => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BOOKS_API_URL}pages`, {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to create page content.' }));
                throw new Error(errorData.message || 'Page creation failed.');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pages', bookId, chapterId, sectionId] });
            toast({ title: 'Success', description: 'Page content created successfully.' });
            router.push(`/admin/manage/books/${bookId}/chapters/${chapterId}/sections/${sectionId}`);
        },
        onError: (error: Error) => toast({ variant: 'destructive', title: 'Error', description: error.message })
    });

    const onSubmit = (data: PageFormValues) => {
        if (!user?.username) { toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.'}); return; }

        const formData = new FormData();
        formData.append('book_id', bookId);
        formData.append('chapter_id', chapterId);
        formData.append('section_id', sectionId);
        formData.append('page_number', data.page_number);
        formData.append('content_order', data.content_order);
        formData.append('page_type', data.page_type);
        formData.append('created_by', user.username);
        if (data.keywords) formData.append('keywords', data.keywords);

        if (data.page_type === 'text' && data.page_content_text) {
            formData.append('page_content_text', data.page_content_text);
        } else if (data.page_type === 'image' && data.image_file?.[0]) {
            formData.append('image_file', data.image_file[0]);
        }
        
        mutation.mutate(formData);
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <Button variant="ghost" onClick={() => router.back()} className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Section
                </Button>
                <h1 className="text-3xl font-headline font-semibold mt-2">Add New Page Content</h1>
                <p className="text-muted-foreground">Fill in the details for the new content entry.</p>
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
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="text" id="type-text" /><Label htmlFor="type-text">Text</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="image" id="type-image" /><Label htmlFor="type-image">Image</Label></div>
                                    </RadioGroup>
                                    {form.formState.errors.page_type && <p className="text-sm text-destructive">{form.formState.errors.page_type.message}</p>}
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
                                        <TiptapEditor content={field.value || ''} onChange={field.onChange} />
                                        {form.formState.errors.page_content_text && <p className="text-sm text-destructive">{form.formState.errors.page_content_text.message}</p>}
                                    </div>
                                )}
                            />
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="image_file">Upload Image</Label>
                                <div className="flex items-center gap-2 p-2 border rounded-lg">
                                    <ImageIcon className="h-5 w-5 text-muted-foreground"/>
                                    <Input id="image_file" type="file" {...form.register('image_file')} className="border-0 shadow-none file:mr-2 file:rounded-full file:bg-primary/10 file:text-primary file:font-semibold file:border-0 file:px-2 file:py-1 file:text-xs"/>
                                </div>
                                {form.formState.errors.image_file && <p className="text-sm text-destructive">{(form.formState.errors.image_file as any).message}</p>}
                            </div>
                        )}
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
