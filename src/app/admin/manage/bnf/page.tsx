"use client";

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlusCircle, Trash2, Edit, AlertTriangle, BookOpen, ChevronRight, ArrowLeft, Loader2 } from 'lucide-react';
import type { BnfChapter, BnfPage } from '@/lib/types';
import { getBnfChapters, getBnfPagesForChapter, createBnfChapter, updateBnfChapter, deleteBnfChapter, createBnfPage, updateBnfPage, deleteBnfPage } from '@/lib/api';

import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- SCHEMA DEFINITIONS ---
const chapterSchema = z.object({
    id: z.number().optional(),
    title: z.string().min(3, "Chapter title must be at least 3 characters long."),
});

const pageSchema = z.object({
    id: z.number().optional(),
    chapter_id: z.coerce.number({ required_error: "You must select a chapter." }),
    title: z.string().min(3, "Page title is required."),
    index_words: z.string().min(1, "At least one index word is required."),
    left_content: z.string().min(1, "Left content is required."),
    right_content: z.string().min(1, "Right content is required."),
});

// --- FORM COMPONENT ---
function BnfForm({ 
    mode, 
    type, 
    data, 
    allChapters = [], 
    onCancel 
}: { 
    mode: 'create' | 'edit';
    type: 'chapter' | 'page';
    data?: Partial<BnfChapter> | Partial<BnfPage>;
    allChapters?: BnfChapter[];
    onCancel: () => void;
}) {
    const queryClient = useQueryClient();
    const isPage = type === 'page';

    const formSchema = isPage ? pageSchema : chapterSchema;
    
    // Set default values carefully
    const defaultValues = useMemo(() => {
        if (data) return data;
        return isPage ? { chapter_id: allChapters[0]?.id } : { title: '' };
    }, [data, isPage, allChapters]);

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: defaultValues,
    });
    
    useEffect(() => {
       if (data) form.reset(data);
    }, [data, form, form.reset]);


    const chapterMutation = useMutation({
        mutationFn: (chapterData: BnfChapter) => {
            return mode === 'edit' ? updateBnfChapter(chapterData.id!, chapterData) : createBnfChapter(chapterData);
        },
        onSuccess: () => {
            toast({ title: "Success", description: `BNF chapter has been saved.` });
            queryClient.invalidateQueries({ queryKey: ['bnfChapters'] });
            onCancel();
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: `Error saving chapter`, description: error.message });
        },
    });

    const pageMutation = useMutation({
        mutationFn: (pageData: BnfPage) => {
            return mode === 'edit' ? updateBnfPage(pageData.id!, pageData) : createBnfPage(pageData);
        },
        onSuccess: (data) => {
            toast({ title: "Success", description: `BNF page has been saved.` });
            queryClient.invalidateQueries({ queryKey: ['bnfPages', data.chapter_id] });
            onCancel();
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: `Error saving page`, description: error.message });
        },
    });

    const mutation = isPage ? pageMutation : chapterMutation;

    const onSubmit = (formData: any) => {
        mutation.mutate(formData);
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>{mode === 'edit' ? 'Edit' : 'Create'} BNF {type}</CardTitle>
                    <CardDescription>Fill in the details for the BNF content.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isPage ? (
                        <div className="space-y-4">
                            <Controller
                                control={form.control}
                                name="chapter_id"
                                render={({ field }) => (
                                    <div className="space-y-2">
                                        <Label>Chapter</Label>
                                        <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={String(field.value)}>
                                            <SelectTrigger><SelectValue placeholder="Select a chapter" /></SelectTrigger>
                                            <SelectContent>
                                                {allChapters.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        {form.formState.errors.chapter_id && <p className="text-sm text-destructive">{form.formState.errors.chapter_id.message}</p>}
                                    </div>
                                )}
                            />
                            <div className="space-y-2"><Label>Page Title</Label><Input {...form.register('title')} />{form.formState.errors.title && <p className="text-sm text-destructive">{String(form.formState.errors.title.message)}</p>}</div>
                            <div className="space-y-2"><Label>Index Words (comma-separated)</Label><Input {...form.register('index_words')} />{form.formState.errors.index_words && <p className="text-sm text-destructive">{String(form.formState.errors.index_words.message)}</p>}</div>
                            
                            <h3 className="font-semibold text-lg pt-4 border-t">Content</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Left Column Content (HTML)</Label><Textarea {...form.register('left_content')} rows={10} /></div>
                                <div className="space-y-2"><Label>Right Column Content (HTML)</Label><Textarea {...form.register('right_content')} rows={10} /></div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2"><Label>Chapter Title</Label><Input {...form.register('title')} />{form.formState.errors.title && <p className="text-sm text-destructive">{String(form.formState.errors.title.message)}</p>}</div>
                    )}
                </CardContent>
                 <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}

// --- MAIN PAGE COMPONENT ---
export default function BnfManagementPage() {
    const queryClient = useQueryClient();
    const [view, setView] = useState<'listChapters' | 'listPages' | 'form'>('listChapters');
    const [selectedChapter, setSelectedChapter] = useState<BnfChapter | null>(null);
    const [formData, setFormData] = useState<{ mode: 'create' | 'edit'; type: 'chapter' | 'page'; data?: Partial<BnfChapter> | Partial<BnfPage>; } | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ type: 'chapter' | 'page'; id: number; name: string; chapterId?: number; } | null>(null);

    const { data: chapters, isLoading: isLoadingChapters, isError, error } = useQuery<BnfChapter[]>({
        queryKey: ['bnfChapters'],
        queryFn: getBnfChapters,
    });
    
    const { data: pages, isLoading: isLoadingPages } = useQuery<BnfPage[]>({
        queryKey: ['bnfPages', selectedChapter?.id],
        queryFn: () => getBnfPagesForChapter(selectedChapter!.id),
        enabled: !!selectedChapter,
    });

    const deleteChapterMutation = useMutation({
        mutationFn: deleteBnfChapter,
        onSuccess: () => {
            toast({ title: "Chapter Deleted", description: "The chapter and all its pages have been removed." });
            queryClient.invalidateQueries({ queryKey: ['bnfChapters'] });
            handleBackToChapters();
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: "Failed to Delete Chapter", description: err.message }),
        onSettled: () => setItemToDelete(null),
    });
    
     const deletePageMutation = useMutation({
        mutationFn: deleteBnfPage,
        onSuccess: (_, pageId) => {
            toast({ title: "Page Deleted", description: "The page has been removed." });
            queryClient.invalidateQueries({ queryKey: ['bnfPages', selectedChapter?.id] });
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: "Failed to Delete Page", description: err.message }),
        onSettled: () => setItemToDelete(null),
    });

    const handleSelectChapter = (chapter: BnfChapter) => {
        setSelectedChapter(chapter);
        setView('listPages');
    };

    const handleBackToChapters = () => {
        setSelectedChapter(null);
        setView('listChapters');
    };
    
    const handleOpenForm = (mode: 'create' | 'edit', type: 'chapter' | 'page', data?: Partial<BnfChapter> | Partial<BnfPage>) => {
        setFormData({ mode, type, data });
        setView('form');
    }
    
    const handleCancelForm = () => {
        setFormData(null);
        setView(selectedChapter ? 'listPages' : 'listChapters');
    }

    if (isLoadingChapters) {
        return <div className="p-4 md:p-8 space-y-6"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-8 w-2/3" /><div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div></div>
    }

    if (isError) {
        return <div className="p-4 md:p-8"><Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error Loading Data</AlertTitle><AlertDescription>{(error as Error).message}</AlertDescription></Alert></div>
    }

    const renderChapterList = () => (
        <Card className="shadow-lg">
            <CardHeader className="flex flex-row justify-between items-center">
                 <div><CardTitle>BNF Chapters</CardTitle><CardDescription>Select a chapter to view its pages or add a new one.</CardDescription></div>
                 <Button onClick={() => handleOpenForm('create', 'chapter')}><PlusCircle className="mr-2 h-4 w-4" /> Add New Chapter</Button>
            </CardHeader>
            <CardContent>
                {chapters && chapters.length > 0 ? (
                    <div className="space-y-2">
                        {chapters.map(chapter => (
                            <button key={chapter.id} onClick={() => handleSelectChapter(chapter)} className="w-full text-left p-4 border rounded-lg flex justify-between items-center hover:bg-muted/50 transition-colors">
                                <div><p className="font-semibold">{chapter.id}: {chapter.title}</p></div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-muted-foreground flex flex-col items-center"><BookOpen className="w-12 h-12 mb-4" /><h3 className="text-lg font-semibold">No Content Yet</h3><p>Click "Add New Chapter" to get started.</p></div>
                )}
            </CardContent>
        </Card>
    );
    
    const renderPageList = () => {
        if (!selectedChapter) return null;
        return (
             <Card className="shadow-lg">
                <CardHeader>
                    <Button variant="ghost" onClick={handleBackToChapters} className="h-auto p-1 -ml-2 mb-2 w-fit text-muted-foreground"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Chapters</Button>
                    <CardTitle>{selectedChapter.id}: {selectedChapter.title}</CardTitle>
                     <div className="flex items-center gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => handleOpenForm('create', 'page', { chapter_id: selectedChapter.id })}><PlusCircle className="mr-2 h-4 w-4" /> Add Page</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleOpenForm('edit', 'chapter', selectedChapter)}><Edit className="mr-2 h-4 w-4" /> Edit Chapter</Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setItemToDelete({ type: 'chapter', id: selectedChapter.id, name: selectedChapter.title })}><Trash2 className="mr-2 h-4 w-4" /> Delete Chapter</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoadingPages && <Skeleton className="h-40 w-full" />}
                    {!isLoadingPages && pages && pages.length > 0 ? (
                        <div className="space-y-2">
                        {pages.map(page => (
                            <div key={page.id} className="flex justify-between items-center p-2 rounded-md border hover:bg-muted/50">
                                <div><p className="font-medium">{page.id}: {page.title}</p><p className="text-sm text-muted-foreground">{page.index_words}</p></div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenForm('edit', 'page', page)}><Edit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setItemToDelete({type: 'page', id: page.id, name: page.title, chapterId: selectedChapter.id})}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        ))}
                        </div>
                    ) : ( !isLoadingPages && <p className="text-sm text-muted-foreground text-center py-4">No pages in this chapter yet.</p>)}
                </CardContent>
            </Card>
        );
    };
    
    const renderForm = () => {
        if (!formData) return null;
        return <BnfForm mode={formData.mode} type={formData.type} data={formData.data} allChapters={chapters} onCancel={handleCancelForm} />
    }

    const deleteMutation = itemToDelete?.type === 'chapter' ? deleteChapterMutation : deletePageMutation;

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div><h1 className="text-3xl font-headline font-semibold">BNF Management</h1><p className="text-muted-foreground">Add, edit, and manage chapters and pages of the BNF.</p></div>
            </header>
            {view === 'listChapters' && renderChapterList()}
            {view === 'listPages' && renderPageList()}
            {view === 'form' && renderForm()}
            <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the {itemToDelete?.type} "{itemToDelete?.name}". This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(itemToDelete!.id)} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? 'Deleting...' : 'Delete'}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}