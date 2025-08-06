
"use client";

import { useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import type { BnfChapter, BnfPage } from '@/lib/bnf-data';

const chapterSchema = z.object({
    title: z.string().min(3, "Chapter title must be at least 3 characters long."),
});

const pageSchema = z.object({
    chapterId: z.number({ required_error: "You must select a chapter." }),
    title: z.string().min(3, "Page title is required."),
    indexWords: z.string().min(1, "At least one index word is required."),
    leftContent: z.object({
        heading: z.string().min(1, "Heading is required."),
        paragraphs: z.array(z.object({ value: z.string().min(1, "Paragraph cannot be empty.") })),
        subHeading: z.string().optional(),
    }),
    rightContent: z.object({
        list: z.array(z.object({
            bold: z.string().min(1, "Bold text is required."),
            text: z.string().min(1, "List item text is required.")
        })),
        note: z.string().optional(),
    }),
});

type FormValues = z.infer<typeof chapterSchema> | z.infer<typeof pageSchema>;

interface BnfPageFormProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSave: () => void;
    mode: 'create' | 'edit';
    type: 'chapter' | 'page';
    data?: BnfChapter | BnfPage;
    chapterId?: number;
    allChapters?: BnfChapter[];
}

async function saveBnfData(data: { type: 'chapter' | 'page', payload: any }) {
    const isEdit = 'id' in data.payload;
    const res = await fetch('/api/bnf', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || `Failed to ${isEdit ? 'update' : 'create'} ${data.type}`);
    }
    return res.json();
}

export function BnfPageForm({ isOpen, onOpenChange, onSave, mode, type, data, chapterId, allChapters = [] }: BnfPageFormProps) {
    const isPage = type === 'page';
    const form = useForm({
        resolver: zodResolver(isPage ? pageSchema : chapterSchema),
    });

    const { fields: paragraphFields, append: appendParagraph, remove: removeParagraph } = useFieldArray({
        control: form.control,
        name: "leftContent.paragraphs",
    });

    const { fields: listFields, append: appendListItem, remove: removeListItem } = useFieldArray({
        control: form.control,
        name: "rightContent.list",
    });

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && data) {
                form.reset(data);
            } else {
                form.reset(isPage ? { 
                    chapterId: chapterId,
                    leftContent: { paragraphs: [{ value: '' }] },
                    rightContent: { list: [{ bold: '', text: '' }] }
                } : {});
            }
        }
    }, [isOpen, mode, data, form, isPage, chapterId]);

    const mutation = useMutation({
        mutationFn: saveBnfData,
        onSuccess: () => {
            toast({ title: "Success", description: `BNF ${type} has been saved.` });
            onSave();
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: `Error saving ${type}`, description: error.message });
        },
    });

    const onSubmit = (formData: any) => {
        const payload = mode === 'edit' ? { ...data, ...formData } : formData;
        mutation.mutate({ type, payload });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{mode === 'edit' ? 'Edit' : 'Create'} BNF {type}</DialogTitle>
                    <DialogDescription>Fill in the details for the BNF content.</DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto pr-6 pl-2 -mr-6 -ml-2 space-y-6">
                    {isPage ? (
                        <div className="space-y-4">
                            <Controller
                                control={form.control}
                                name="chapterId"
                                render={({ field }) => (
                                    <div className="space-y-2">
                                        <Label>Chapter</Label>
                                        <Select onValueChange={(val) => field.onChange(Number(val))} value={String(field.value)}>
                                            <SelectTrigger><SelectValue placeholder="Select a chapter" /></SelectTrigger>
                                            <SelectContent>
                                                {allChapters.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        {form.formState.errors.chapterId && <p className="text-sm text-destructive">{form.formState.errors.chapterId.message}</p>}
                                    </div>
                                )}
                            />
                            <div className="space-y-2"><Label>Page Title</Label><Input {...form.register('title')} />{form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message?.toString()}</p>}</div>
                            <div className="space-y-2"><Label>Index Words (comma-separated)</Label><Input {...form.register('indexWords')} />{form.formState.errors.indexWords && <p className="text-sm text-destructive">{form.formState.errors.indexWords.message?.toString()}</p>}</div>
                            
                            <h3 className="font-semibold text-lg pt-4 border-t">Left Column Content</h3>
                            <div className="space-y-2"><Label>Main Heading</Label><Input {...form.register('leftContent.heading')} /></div>
                            <div className="space-y-2"><Label>Paragraphs</Label>
                                {paragraphFields.map((field, index) => (
                                    <div key={field.id} className="flex items-center gap-2"><Textarea {...form.register(`leftContent.paragraphs.${index}.value`)} /><Button type="button" variant="ghost" size="icon" onClick={() => removeParagraph(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button></div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => appendParagraph({ value: '' })}><PlusCircle className="mr-2 h-4 w-4"/>Add Paragraph</Button>
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
                        <div className="space-y-2"><Label>Chapter Title</Label><Input {...form.register('title')} />{form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message?.toString()}</p>}</div>
                    )}
                </form>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={form.handleSubmit(onSubmit)} disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
