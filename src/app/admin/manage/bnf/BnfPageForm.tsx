"use client";

import { useState, useMemo } from 'react';
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
import type { BnfChapter, BnfPage } from '@/lib/bnf-data';
import type { BnfData } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- SCHEMA DEFINITIONS ---
const chapterSchema = z.object({
    title: z.string().min(3, "Chapter title must be at least 3 characters long."),
});

const pageSchema = z.object({
    chapterId: z.coerce.number({ required_error: "You must select a chapter." }),
    title: z.string().min(3, "Page title is required."),
    indexWords: z.string().min(1, "At least one index word is required."),
    leftContent: z.object({
        heading: z.string().min(1, "Heading is required."),
        paragraphs: z.array(z.string().min(1, "Paragraph cannot be empty.")).min(1, "At least one paragraph is required."),
        subHeading: z.string().optional(),
    }),
    rightContent: z.object({
        list: z.array(z.object({
            bold: z.string().min(1, "Bold text is required."),
            text: z.string().min(1, "List item text is required.")
        })).min(1, "At least one list item is required."),
        note: z.string().optional(),
    }),
});

// --- API FUNCTIONS ---
async function fetchBnfData(): Promise<BnfData> {
    const res = await fetch('/api/bnf');
    if (!res.ok) throw new Error('Failed to fetch BNF data');
    return res.json();
}

async function saveBnfData(data: { type: 'chapter' | 'page'; payload: any; mode: 'create' | 'edit' }) {
    const isEdit = data.mode === 'edit';
    const res = await fetch('/api/bnf', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: data.type, payload: data.payload }),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || `Failed to ${isEdit ? 'update' : 'create'} ${data.type}`);
    }
    return res.json();
}


async function deleteBnfItem({ type, id, chapterId }: { type: 'chapter' | 'page', id: number, chapterId?: number }) {
    const url = `/api/bnf?type=${type}&id=${id}` + (chapterId ? `&chapterId=${chapterId}` : '');
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Failed to delete ${type}`);
    return true;
}

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
    data?: BnfChapter | BnfPage;
    allChapters?: BnfChapter[];
    onCancel: () => void;
}) {
    const queryClient = useQueryClient();
    const isPage = type === 'page';

    const formSchema = isPage ? pageSchema : chapterSchema;
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: useMemo(() => {
            if (data) {
                return data;
            }
            return isPage ? {
                chapterId: allChapters[0]?.id,
                leftContent: { paragraphs: [''] },
                rightContent: { list: [{ bold: '', text: '' }] }
            } : { title: '' };
        }, [data, isPage, allChapters]),
    });
    
    const { fields: paragraphFields, append: appendParagraph, remove: removeParagraph } = useFieldArray({
        control: form.control, name: "leftContent.paragraphs",
    });

    const { fields: listFields, append: appendListItem, remove: removeListItem } = useFieldArray({
        control: form.control, name: "rightContent.list",
    });
    
    useEffect(() => {
       if (data) form.reset(data);
    }, [data, form]);


    const mutation = useMutation({
        mutationFn: saveBnfData,
        onSuccess: () => {
            toast({ title: "Success", description: `BNF ${type} has been saved.` });
            queryClient.invalidateQueries({ queryKey: ['bnfDataAdmin'] });
            onCancel(); // Go back to the list view
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: `Error saving ${type}`, description: error.message });
        },
    });

    const onSubmit = (formData: any) => {
        const payload = mode === 'edit' && data ? { ...data, ...formData } : formData;
        mutation.mutate({ type, payload, mode });
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
                                name="chapterId"
                                render={({ field }) => (
                                    <div className="space-y-2">
                                        <Label>Chapter</Label>
                                        <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={String(field.value)}>
                                            <SelectTrigger><SelectValue placeholder="Select a chapter" /></SelectTrigger>
                                            <SelectContent>
                                                {allChapters.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        {form.formState.errors.chapterId && <p className="text-sm text-destructive">{form.formState.errors.chapterId.message}</p>}
                                    </div>
                                )}
                            />
                            <div className="space-y-2"><Label>Page Title</Label><Input {...form.register('title')} />{form.formState.errors.title && <p className="text-sm text-destructive">{String(form.formState.errors.title.message)}</p>}</div>
                            <div className="space-y-2"><Label>Index Words (comma-separated)</Label><Input {...form.register('indexWords')} />{form.formState.errors.indexWords && <p className="text-sm text-destructive">{String(form.formState.errors.indexWords.message)}</p>}</div>
                            
                            <h3 className="font-semibold text-lg pt-4 border-t">Left Column Content</h3>
                            <div className="space-y-2"><Label>Main Heading</Label><Input {...form.register('leftContent.heading')} /></div>
                            <div className="space-y-2"><Label>Paragraphs</Label>
                                {paragraphFields.map((field, index) => (
                                    <div key={field.id} className="flex items-center gap-2"><Textarea {...form.register(`leftContent.paragraphs.${index}` as const)} /><Button type="button" variant="ghost" size="icon" onClick={() => removeParagraph(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button></div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => appendParagraph('')}><PlusCircle className="mr-2 h-4 w-4"/>Add Paragraph</Button>
                            </div>
                            <div className="space-y-2"><Label>Sub Heading (Optional)</Label><Input {...form.register('leftContent.subHeading')} /></div>

                            <h3 className="font-semibold text-lg pt-4 border-t">Right Column Content</h3>
                            <div className="space-y-2"><Label>List Items</Label>
                                {listFields.map((field, index) => (
                                     <div key={field.id} className="p-2 border rounded-md space-y-2 relative">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div><Label>Bold Text</Label><Input {...form.register(`rightContent.list.${index}.bold`)} /></div>
                                            <div><Label>Regular Text</Label><Input {...form.register(`rightContent.list.${index}.text`)} /></div>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" className="absolute -top-1 -right-1 h-7 w-7" onClick={() => removeListItem(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => appendListItem({ bold: '', text: '' })}><PlusCircle className="mr-2 h-4 w-4"/>Add List Item</Button>
                            </div>
                             <div className="space-y-2"><Label>Note (Optional)</Label><Textarea {...form.register('rightContent.note')} /></div>
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
    const [formData, setFormData] = useState<{ mode: 'create' | 'edit'; type: 'chapter' | 'page'; data?: BnfChapter | BnfPage; } | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ type: 'chapter' | 'page'; id: number; name: string; chapterId?: number; } | null>(null);

    const { data: bnfData, isLoading, isError, error } = useQuery<BnfData>({
        queryKey: ['bnfDataAdmin'],
        queryFn: fetchBnfData
    });
    
    const chapters = bnfData?.chapters || [];

    const deleteMutation = useMutation({
        mutationFn: deleteBnfItem,
        onSuccess: (_, variables) => {
            toast({ title: `${variables.type.charAt(0).toUpperCase() + variables.type.slice(1)} Deleted`, description: 'The item has been removed.' });
            queryClient.invalidateQueries({ queryKey: ['bnfDataAdmin'] });
            if (variables.type === 'chapter') {
                setView('listChapters');
                setSelectedChapter(null);
            }
        },
        onError: (err: Error, variables) => {
            toast({ variant: 'destructive', title: `Failed to Delete ${variables.type}`, description: err.message });
        },
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
    
    const handleOpenForm = (mode: 'create' | 'edit', type: 'chapter' | 'page', data?: BnfChapter | BnfPage) => {
        setFormData({ mode, type, data });
        setView('form');
    }
    
    const handleCancelForm = () => {
        setFormData(null);
        setView(selectedChapter ? 'listPages' : 'listChapters');
    }

    if (isLoading) {
        return (
            <div className="p-4 md:p-8 space-y-6">
                 <Skeleton className="h-10 w-1/3" />
                 <Skeleton className="h-8 w-2/3" />
                 <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                 </div>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="p-4 md:p-8">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error Loading Data</AlertTitle>
                    <AlertDescription>{error.message}</AlertDescription>
                </Alert>
            </div>
        )
    }

    const renderChapterList = () => (
        <Card className="shadow-lg">
            <CardHeader className="flex flex-row justify-between items-center">
                 <div>
                    <CardTitle>BNF Chapters</CardTitle>
                    <CardDescription>Select a chapter to view its pages or add a new one.</CardDescription>
                </div>
                 <Button onClick={() => handleOpenForm('create', 'chapter')}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Chapter
                </Button>
            </CardHeader>
            <CardContent>
                {chapters.length > 0 ? (
                    <div className="space-y-2">
                        {chapters.map(chapter => (
                            <button key={chapter.id} onClick={() => handleSelectChapter(chapter)} className="w-full text-left p-4 border rounded-lg flex justify-between items-center hover:bg-muted/50 transition-colors">
                                <div>
                                    <p className="font-semibold">{chapter.id}: {chapter.title}</p>
                                    <p className="text-sm text-muted-foreground">{chapter.pages.length} page(s)</p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-muted-foreground flex flex-col items-center">
                        <BookOpen className="w-12 h-12 mb-4" />
                        <h3 className="text-lg font-semibold">No Content Yet</h3>
                        <p>Click "Add New Chapter" to get started.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
    
    const renderPageList = () => {
        if (!selectedChapter) return null;
        const chapterWithPages = chapters.find(c => c.id === selectedChapter.id);
        const pages = chapterWithPages?.pages || [];
        
        return (
             <Card className="shadow-lg">
                <CardHeader>
                    <Button variant="ghost" onClick={handleBackToChapters} className="h-auto p-1 -ml-2 mb-2 w-fit text-muted-foreground">
                        <ArrowLeft className="mr-2 h-4 w-4"/> Back to Chapters
                    </Button>
                    <CardTitle>{selectedChapter.id}: {selectedChapter.title}</CardTitle>
                     <div className="flex items-center gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => handleOpenForm('create', 'page', { chapterId: selectedChapter.id } as any)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Page
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleOpenForm('edit', 'chapter', selectedChapter)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Chapter
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setItemToDelete({ type: 'chapter', id: selectedChapter.id, name: selectedChapter.title })}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Chapter
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {pages.length > 0 ? (
                        <div className="space-y-2">
                        {pages.map(page => (
                            <div key={page.id} className="flex justify-between items-center p-2 rounded-md border hover:bg-muted/50">
                                <div>
                                    <p className="font-medium">{page.id}: {page.title}</p>
                                    <p className="text-sm text-muted-foreground">{page.indexWords}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenForm('edit', 'page', {...page, chapterId: selectedChapter.id })}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setItemToDelete({type: 'page', id: page.id, name: page.title, chapterId: selectedChapter.id})}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No pages in this chapter yet.</p>
                    )}
                </CardContent>
            </Card>
        );
    };
    
    const renderForm = () => {
        if (!formData) return null;
        return (
            <BnfForm 
                mode={formData.mode}
                type={formData.type}
                data={formData.data}
                allChapters={chapters}
                onCancel={handleCancelForm}
            />
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-headline font-semibold">BNF Management</h1>
                    <p className="text-muted-foreground">Add, edit, and manage chapters and pages of the BNF.</p>
                </div>
            </header>

            {view === 'listChapters' && renderChapterList()}
            {view === 'listPages' && renderPageList()}
            {view === 'form' && renderForm()}

            <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the {itemToDelete?.type} "{itemToDelete?.name}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(itemToDelete!)} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}