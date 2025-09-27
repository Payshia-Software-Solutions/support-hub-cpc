

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
import { AlertTriangle, Book, PlusCircle, Loader2, ArrowLeft, Edit, Trash2, Library } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSectionsByBook, createSection, updateSection, deleteSection, getBookById } from '@/lib/actions/books';
import type { Section, CreateSectionPayload, UpdateSectionPayload, Book, Chapter } from '@/lib/types';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

const sectionFormSchema = z.object({
  section_order: z.string().min(1, "Section order is required."),
  section_heading: z.string().min(3, "Section heading is required."),
});

type SectionFormValues = z.infer<typeof sectionFormSchema>;

const SectionForm = ({ chapterId, section, onClose }: { chapterId: string, section?: Section | null, onClose: () => void; }) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    
    const form = useForm<SectionFormValues>({
        resolver: zodResolver(sectionFormSchema),
        defaultValues: {
            section_order: section?.section_order || '',
            section_heading: section?.section_heading || '',
        }
    });

    useEffect(() => {
        if(section) {
            form.reset({
                section_order: section.section_order,
                section_heading: section.section_heading,
            });
        } else {
             form.reset({
                section_order: '',
                section_heading: '',
            });
        }
    }, [section, form]);

    const mutation = useMutation({
        mutationFn: (data: SectionFormValues) => {
            if (!user?.username) {
                throw new Error('You must be logged in.');
            }
            if (section) {
                 const payload: UpdateSectionPayload = { ...data, chapter_id: chapterId, update_by: user.username };
                 return updateSection(section.section_id, payload);
            } else {
                 const payload: CreateSectionPayload = { ...data, chapter_id: chapterId, created_by: user.username, update_by: user.username };
                 return createSection(payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sections'] });
            toast({ title: 'Success', description: `Section ${section ? 'updated' : 'created'} successfully.` });
            onClose();
        },
        onError: (error: Error) => toast({ variant: 'destructive', title: 'Error', description: error.message })
    });

    const onSubmit = (data: SectionFormValues) => {
        mutation.mutate(data);
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="section_order">Section Order</Label>
                <Input id="section_order" {...form.register('section_order')} />
                {form.formState.errors.section_order && <p className="text-sm text-destructive">{form.formState.errors.section_order.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="section_heading">Section Heading</Label>
                <Input id="section_heading" {...form.register('section_heading')} />
                {form.formState.errors.section_heading && <p className="text-sm text-destructive">{form.formState.errors.section_heading.message}</p>}
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" disabled={mutation.isPending}>Cancel</Button></DialogClose>
                <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {section ? "Save Changes" : "Create Section"}
                </Button>
            </DialogFooter>
        </form>
    );
}

export default function ChapterSectionsPage() {
    const params = useParams();
    const router = useRouter();
    const bookId = params.bookId as string;
    const chapterId = params.chapterId as string;
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedSection, setSelectedSection] = useState<Section | null>(null);
    const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);
    const queryClient = useQueryClient();

     const { data: book, isLoading: isLoadingBook } = useQuery<Book>({
        queryKey: ['book', bookId],
        queryFn: () => getBookById(bookId),
        enabled: !!bookId,
    });
    
    const { data: sections, isLoading: isLoadingSections, isError, error } = useQuery<Section[]>({
        queryKey: ['sections', bookId],
        queryFn: () => getSectionsByBook(bookId),
        enabled: !!bookId,
    });

    const chapterSections = sections?.filter(s => s.chapter_id === chapterId) || [];

    const deleteMutation = useMutation({
        mutationFn: (sectionId: string) => deleteSection(sectionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sections', bookId] });
            toast({ title: 'Success', description: 'Section deleted successfully.' });
        },
        onError: (error: Error) => toast({ variant: 'destructive', title: 'Error', description: error.message }),
        onSettled: () => setSectionToDelete(null),
    });

    const handleCreate = () => {
        setSelectedSection(null);
        setIsFormOpen(true);
    }
    
    const handleEdit = (section: Section) => {
        setSelectedSection(section);
        setIsFormOpen(true);
    }
    
    const handleRowClick = (sectionId: string) => {
        router.push(`/admin/manage/books/${bookId}/chapters/${chapterId}/sections/${sectionId}`);
    };

    const isLoading = isLoadingSections || isLoadingBook;

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedSection ? "Edit" : "Add New"} Section</DialogTitle>
                        <DialogDescription>
                          {selectedSection ? `Editing section in chapter ${chapterId}` : `Add a new section to chapter ${chapterId}`}.
                        </DialogDescription>
                    </DialogHeader>
                    <SectionForm chapterId={chapterId} section={selectedSection} onClose={() => setIsFormOpen(false)} />
                </DialogContent>
            </Dialog>

             <AlertDialog open={!!sectionToDelete} onOpenChange={() => setSectionToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the section "{sectionToDelete?.section_heading}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(sectionToDelete!.section_id)} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                     <Button variant="ghost" onClick={() => router.push(`/admin/manage/books/${bookId}`)} className="-ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4"/> Back to Chapters
                    </Button>
                    <h1 className="text-3xl font-headline font-semibold mt-2">
                        {isLoading ? <Skeleton className="h-8 w-64" /> : `Sections for Chapter ${chapterId} in "${book?.book_name}"`}
                    </h1>
                </div>
                <Button onClick={handleCreate}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Section
                </Button>
            </header>

             <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Section Index</CardTitle>
                    <CardDescription>A list of all sections in this chapter.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isError ? (
                         <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error Loading Sections</AlertTitle>
                            <AlertDescription>{(error as Error).message}</AlertDescription>
                        </Alert>
                    ) : (
                    <div className="relative w-full overflow-auto border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order</TableHead>
                                    <TableHead>Heading</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    [...Array(3)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : chapterSections && chapterSections.length > 0 ? (
                                    chapterSections.sort((a, b) => parseInt(a.section_order) - parseInt(b.section_order)).map(section => (
                                        <TableRow key={section.section_id} onClick={() => handleRowClick(section.section_id)} className="cursor-pointer">
                                            <TableCell className="font-medium">{section.section_order}</TableCell>
                                            <TableCell>{section.section_heading}</TableCell>
                                            <TableCell>{format(new Date(section.created_at), 'PPP')}</TableCell>
                                            <TableCell className="text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(section)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setSectionToDelete(section)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24">
                                            No sections found for this chapter yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
