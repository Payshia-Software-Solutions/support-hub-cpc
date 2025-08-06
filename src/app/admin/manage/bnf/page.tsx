
"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { PlusCircle, Trash2, Edit, AlertTriangle, BookOpen, ChevronRight, ArrowLeft } from 'lucide-react';
import { BnfPageForm } from './BnfPageForm';
import type { BnfChapter, BnfPage } from '@/lib/bnf-data';
import type { BnfData } from '@/lib/types';


async function fetchBnfData(): Promise<BnfData> {
    const res = await fetch('/api/bnf');
    if (!res.ok) throw new Error('Failed to fetch BNF data');
    return res.json();
}

async function deleteBnfItem({ type, id, chapterId }: { type: 'chapter' | 'page', id: number, chapterId?: number }) {
    const url = `/api/bnf?type=${type}&id=${id}` + (chapterId ? `&chapterId=${chapterId}` : '');
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Failed to delete ${type}`);
    return true;
}

export default function BnfManagementPage() {
    const queryClient = useQueryClient();
    const [selectedChapter, setSelectedChapter] = useState<BnfChapter | null>(null);

    const { data: bnfData, isLoading, isError, error } = useQuery<BnfData>({
        queryKey: ['bnfDataAdmin'],
        queryFn: fetchBnfData
    });
    
    const [dialogState, setDialogState] = useState<{
        isOpen: boolean;
        mode: 'create' | 'edit';
        type: 'chapter' | 'page';
        data?: BnfChapter | BnfPage;
        chapterId?: number;
    }>({ isOpen: false, mode: 'create', type: 'chapter' });

    const [itemToDelete, setItemToDelete] = useState<{
        type: 'chapter' | 'page',
        id: number,
        name: string,
        chapterId?: number
    } | null>(null);

    const deleteMutation = useMutation({
        mutationFn: deleteBnfItem,
        onSuccess: (_, variables) => {
            toast({ title: `${variables.type.charAt(0).toUpperCase() + variables.type.slice(1)} Deleted`, description: 'The item has been removed.' });
            queryClient.invalidateQueries({ queryKey: ['bnfDataAdmin'] });
            if (variables.type === 'chapter') {
                setSelectedChapter(null); // Deselect if the current chapter is deleted
            } else if (selectedChapter) {
                 // Refresh selected chapter data
                const updatedChapter = bnfData?.chapters.find(c => c.id === selectedChapter.id);
                if (updatedChapter) {
                    const pageExists = updatedChapter.pages.some(p => p.id === variables.id);
                    if (!pageExists) {
                        const refreshedChapter = { ...updatedChapter, pages: updatedChapter.pages.filter(p => p.id !== variables.id) };
                        setSelectedChapter(refreshedChapter);
                    }
                }
            }
        },
        onError: (err: Error, variables) => {
            toast({ variant: 'destructive', title: `Failed to Delete ${variables.type}`, description: err.message });
        },
        onSettled: () => setItemToDelete(null),
    });

    const handleFormSave = () => {
        setDialogState({ isOpen: false, mode: 'create', type: 'chapter' });
        queryClient.invalidateQueries({ queryKey: ['bnfDataAdmin'] }).then(() => {
            if (selectedChapter) {
                // This is a bit of a trick to refresh the selected chapter data after a save
                // A more robust solution might involve optimistic updates or more granular query invalidation
                const potentiallyUpdatedChapter = queryClient.getQueryData<BnfData>(['bnfDataAdmin'])?.chapters.find(c => c.id === selectedChapter.id);
                 if(potentiallyUpdatedChapter) setSelectedChapter(potentiallyUpdatedChapter);
            }
        });
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
            <CardHeader>
                <CardTitle>BNF Chapters</CardTitle>
                <CardDescription>Select a chapter to view its pages or add a new one.</CardDescription>
            </CardHeader>
            <CardContent>
                {bnfData?.chapters && bnfData.chapters.length > 0 ? (
                    <div className="space-y-2">
                        {bnfData.chapters.map(chapter => (
                            <button key={chapter.id} onClick={() => setSelectedChapter(chapter)} className="w-full text-left p-4 border rounded-lg flex justify-between items-center hover:bg-muted/50 transition-colors">
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

    const renderChapterDetails = (chapter: BnfChapter) => (
         <Card className="shadow-lg">
            <CardHeader>
                <Button variant="ghost" onClick={() => setSelectedChapter(null)} className="h-auto p-1 -ml-2 mb-2 w-fit text-muted-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4"/> Back to Chapters
                </Button>
                <CardTitle>{chapter.id}: {chapter.title}</CardTitle>
                 <div className="flex items-center gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => setDialogState({ isOpen: true, mode: 'create', type: 'page', chapterId: chapter.id })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Page
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDialogState({ isOpen: true, mode: 'edit', type: 'chapter', data: chapter })}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Chapter
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setItemToDelete({ type: 'chapter', id: chapter.id, name: chapter.title })}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Chapter
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {chapter.pages.length > 0 ? (
                    <div className="space-y-2">
                    {chapter.pages.map(page => (
                        <div key={page.id} className="flex justify-between items-center p-2 rounded-md border hover:bg-muted/50">
                            <div>
                                <p className="font-medium">{page.id}: {page.title}</p>
                                <p className="text-sm text-muted-foreground">{page.indexWords}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDialogState({isOpen: true, mode: 'edit', type: 'page', data: page, chapterId: chapter.id})}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setItemToDelete({type: 'page', id: page.id, name: page.title, chapterId: chapter.id})}>
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

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <BnfPageForm {...dialogState} onOpenChange={(isOpen) => setDialogState(prev => ({ ...prev, isOpen }))} onSave={handleFormSave} allChapters={bnfData?.chapters} />
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

            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-headline font-semibold">BNF Management</h1>
                    <p className="text-muted-foreground">Add, edit, and manage chapters and pages of the BNF.</p>
                </div>
                <Button onClick={() => setDialogState({ isOpen: true, mode: 'create', type: 'chapter' })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Chapter
                </Button>
            </header>

            {selectedChapter ? renderChapterDetails(selectedChapter) : renderChapterList()}
        </div>
    )
}
