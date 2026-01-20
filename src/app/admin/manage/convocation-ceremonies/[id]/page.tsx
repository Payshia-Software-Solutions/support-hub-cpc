
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';

// Shadcn & Lucide imports
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, PlusCircle, Edit, Trash2, Loader2, PackageCheck, GraduationCap, BookOpen, Check, ScrollText, Sparkles, Camera, Coffee, Award } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandInput, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';


// API and Type imports
import { getCeremonyById, getPackagesByCeremony, createPackage, updatePackage, deletePackage } from '@/lib/actions/certificates';
import { getParentCourseList } from '@/lib/actions/courses';
import type { ConvocationCeremony, ConvocationPackage, ParentCourse } from '@/lib/types';

const CONTENT_PROVIDER_URL = 'https://content-provider.pharmacollege.lk/content-provider/uploads/package-images/';

const packageFormSchema = z.object({
    package_name: z.string().min(3, "Package name is required."),
    description: z.string().optional(),
    price: z.coerce.number().min(0, "Price must be a positive number."),
    parent_seat_count: z.coerce.number().int().min(0, "Parent seat count cannot be negative."),
    vip_seat: z.coerce.number().int().min(0, "VIP seat count cannot be negative.").optional(),
    student_seat: z.boolean().default(true),
    garland: z.boolean().default(false),
    graduation_cloth: z.boolean().default(false),
    photo_package: z.boolean().default(false),
    scroll: z.boolean().default(false),
    certificate_file: z.boolean().default(false),
    video_360: z.boolean().default(false),
    refreshments: z.boolean().default(false),
    cover_image: z.any().optional(),
    courses: z.array(z.string()).optional(),
});

type PackageFormValues = z.infer<typeof packageFormSchema>;

const PackageForm = ({ pkg, onSave, onClose, isSaving }: { pkg: ConvocationPackage | null, onSave: (data: PackageFormValues) => void, onClose: () => void, isSaving: boolean }) => {
    const { data: parentCourses, isLoading: isLoadingCourses } = useQuery<ParentCourse[]>({
        queryKey: ['parentCourseList'],
        queryFn: getParentCourseList,
        staleTime: 1000 * 60 * 15, // Cache for 15 mins
    });
    
    const form = useForm<PackageFormValues>({
        resolver: zodResolver(packageFormSchema),
        defaultValues: {
            package_name: pkg?.package_name || '',
            description: pkg?.description || '',
            price: pkg ? parseFloat(pkg.price) : 0,
            parent_seat_count: pkg ? parseInt(pkg.parent_seat_count, 10) : 0,
            vip_seat: pkg ? parseInt(pkg.vip_seat, 10) : 0,
            student_seat: pkg ? pkg.student_seat === '1' : true,
            garland: pkg?.garland === '1',
            graduation_cloth: pkg?.graduation_cloth === '1',
            photo_package: pkg?.photo_package === '1',
            scroll: pkg?.scroll === '1',
            certificate_file: pkg?.certificate_file === '1',
            video_360: pkg?.video_360 === '1',
            refreshments: pkg?.refreshments === '1',
            cover_image: null,
            courses: pkg?.course_list ? pkg.course_list.split(',').map(s => s.trim()) : [],
        },
    });

    return (
        <form onSubmit={form.handleSubmit(onSave)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
             <div className="space-y-2">
                <Label htmlFor="package_name">Package Name</Label>
                <Input id="package_name" {...form.register('package_name')} />
                {form.formState.errors.package_name && <p className="text-sm text-destructive">{form.formState.errors.package_name.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...form.register('description')} rows={3}/>
            </div>
             <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="price">Price (LKR)</Label>
                    <Input id="price" type="number" {...form.register('price')} />
                    {form.formState.errors.price && <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="parent_seat_count">Parent Seats</Label>
                    <Input id="parent_seat_count" type="number" {...form.register('parent_seat_count')} />
                    {form.formState.errors.parent_seat_count && <p className="text-sm text-destructive">{form.formState.errors.parent_seat_count.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="vip_seat">VIP Seats</Label>
                    <Input id="vip_seat" type="number" {...form.register('vip_seat')} />
                    {form.formState.errors.vip_seat && <p className="text-sm text-destructive">{form.formState.errors.vip_seat.message}</p>}
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="courses">Eligible Courses</Label>
                 <Controller
                    name="courses"
                    control={form.control}
                    render={({ field }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start font-normal">
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    {field.value?.length > 0 ? `${field.value.length} course(s) selected` : "Select eligible courses"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search courses..." />
                                    <CommandList>
                                        <CommandEmpty>No courses found.</CommandEmpty>
                                        <CommandGroup>
                                            {isLoadingCourses ? <div className="p-2">Loading...</div> : parentCourses?.map(course => {
                                                const isSelected = field.value?.includes(course.id);
                                                return (
                                                    <CommandItem
                                                        key={course.id}
                                                        onSelect={() => {
                                                            const newValue = isSelected
                                                                ? field.value?.filter(id => id !== course.id) || []
                                                                : [...(field.value || []), course.id];
                                                            field.onChange(newValue);
                                                        }}
                                                    >
                                                        <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible")}>
                                                            <Check className={cn("h-4 w-4")} />
                                                        </div>
                                                        <span>{course.course_name} ({course.course_code})</span>
                                                    </CommandItem>
                                                )
                                            })}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    )}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="cover_image">Cover Image</Label>
                <Input id="cover_image" type="file" {...form.register('cover_image')} accept="image/*"/>
                {pkg?.cover_image && (
                    <p className="text-xs text-muted-foreground">
                        Current image: {pkg.cover_image}. Uploading a new file will replace it.
                    </p>
                )}
            </div>
            <div className="space-y-3 pt-4">
                <h4 className="font-medium text-sm">Package Inclusions</h4>
                <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                    <div className="flex items-center space-x-2"><Switch id="student_seat" checked={form.watch('student_seat')} onCheckedChange={(c) => form.setValue('student_seat', c)} /><Label htmlFor="student_seat">Student Seat</Label></div>
                    <div className="flex items-center space-x-2"><Switch id="graduation_cloth" checked={form.watch('graduation_cloth')} onCheckedChange={(c) => form.setValue('graduation_cloth', c)} /><Label htmlFor="graduation_cloth">Graduation Cloak</Label></div>
                    <div className="flex items-center space-x-2"><Switch id="garland" checked={form.watch('garland')} onCheckedChange={(c) => form.setValue('garland', c)} /><Label htmlFor="garland">Garland</Label></div>
                    <div className="flex items-center space-x-2"><Switch id="scroll" checked={form.watch('scroll')} onCheckedChange={(c) => form.setValue('scroll', c)} /><Label htmlFor="scroll">Scroll</Label></div>
                    <div className="flex items-center space-x-2"><Switch id="certificate_file" checked={form.watch('certificate_file')} onCheckedChange={(c) => form.setValue('certificate_file', c)} /><Label htmlFor="certificate_file">Certificate File</Label></div>
                    <div className="flex items-center space-x-2"><Switch id="photo_package" checked={form.watch('photo_package')} onCheckedChange={(c) => form.setValue('photo_package', c)} /><Label htmlFor="photo_package">Graduation Hat</Label></div>
                    <div className="flex items-center space-x-2"><Switch id="video_360" checked={form.watch('video_360')} onCheckedChange={(c) => form.setValue('video_360', c)} /><Label htmlFor="video_360">360 Video</Label></div>
                    <div className="flex items-center space-x-2"><Switch id="refreshments" checked={form.watch('refreshments')} onCheckedChange={(c) => form.setValue('refreshments', c)} /><Label htmlFor="refreshments">Refreshments</Label></div>
                </div>
            </div>
            <DialogFooter className="sticky bottom-0 bg-background pt-4">
                <DialogClose asChild><Button variant="outline" disabled={isSaving}>Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSaving}>
                     {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Package
                </Button>
            </DialogFooter>
        </form>
    );
};

export default function ManagePackagesPage() {
    const router = useRouter();
    const params = useParams();
    const ceremonyId = params.id as string;
    const queryClient = useQueryClient();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<ConvocationPackage | null>(null);
    const [packageToDelete, setPackageToDelete] = useState<ConvocationPackage | null>(null);

    const { data: ceremony, isLoading: isLoadingCeremony } = useQuery<ConvocationCeremony>({
        queryKey: ['ceremony', ceremonyId],
        queryFn: () => getCeremonyById(ceremonyId),
        enabled: !!ceremonyId,
    });
    
    const { data: packages, isLoading: isLoadingPackages } = useQuery<ConvocationPackage[]>({
        queryKey: ['packages', ceremonyId],
        queryFn: () => getPackagesByCeremony(ceremonyId),
        enabled: !!ceremonyId,
    });

    const mutation = useMutation({
        mutationFn: (data: { formData: FormData, pkg: ConvocationPackage | null }) => {
            if (data.pkg) {
                return updatePackage(data.pkg.package_id, data.formData);
            }
            return createPackage(data.formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['packages', ceremonyId] });
            toast({ title: 'Success', description: 'Package saved successfully.'});
            setIsFormOpen(false);
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Error', description: err.message }),
    });

    const deleteMutation = useMutation({
        mutationFn: deletePackage,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['packages', ceremonyId] });
            toast({ title: 'Package Deleted' });
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Error', description: err.message }),
        onSettled: () => setPackageToDelete(null),
    });

    const handleOpenForm = (pkg: ConvocationPackage | null = null) => {
        setSelectedPackage(pkg);
        setIsFormOpen(true);
    };

    const handleSave = (data: PackageFormValues) => {
        const formData = new FormData();
        formData.append('package_name', data.package_name);
        formData.append('description', data.description || '');
        formData.append('price', String(data.price));
        formData.append('parent_seat_count', String(data.parent_seat_count));
        formData.append('vip_seat', String(data.vip_seat || 0));
        formData.append('student_seat', data.student_seat ? '1' : '0');
        formData.append('garland', data.garland ? '1' : '0');
        formData.append('graduation_cloth', data.graduation_cloth ? '1' : '0');
        formData.append('photo_package', data.photo_package ? '1' : '0');
        formData.append('scroll', data.scroll ? '1' : '0');
        formData.append('certificate_file', data.certificate_file ? '1' : '0');
        formData.append('video_360', data.video_360 ? '1' : '0');
        formData.append('refreshments', data.refreshments ? '1' : '0');
        formData.append('is_active', '1');
        formData.append('convocation_id', ceremonyId);
        formData.append('course_list', (data.courses || []).join(','));

        if (data.cover_image && data.cover_image.length > 0) {
            formData.append('cover_image', data.cover_image[0]);
        }
        
        mutation.mutate({ formData, pkg: selectedPackage });
    };

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedPackage ? 'Edit' : 'Create'} Package</DialogTitle>
                        <DialogDescription>Define a package for the convocation ceremony.</DialogDescription>
                    </DialogHeader>
                    <PackageForm pkg={selectedPackage} onSave={handleSave} onClose={() => setIsFormOpen(false)} isSaving={mutation.isPending} />
                </DialogContent>
            </Dialog>
            <AlertDialog open={!!packageToDelete} onOpenChange={() => setPackageToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action will permanently delete the package "{packageToDelete?.package_name}".</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(packageToDelete!.package_id)} disabled={deleteMutation.isPending}>
                           {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                     <Button variant="ghost" onClick={() => router.push('/admin/manage/convocation-ceremonies')} className="-ml-4"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Ceremonies</Button>
                    <h1 className="text-3xl font-headline font-semibold mt-2">
                        {isLoadingCeremony ? <Skeleton className="h-8 w-64" /> : `Packages for ${ceremony?.convocation_name}`}
                    </h1>
                </div>
                <Button onClick={() => handleOpenForm()}><PlusCircle className="mr-2 h-4 w-4"/> Add New Package</Button>
            </header>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Package List</CardTitle>
                    <CardDescription>{isLoadingPackages ? "Loading..." : `${packages?.length || 0} packages found.`}</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingPackages ? <Skeleton className="h-48 w-full" /> : (
                        <div className="relative w-full overflow-auto border rounded-lg">
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Image</TableHead>
                                        <TableHead>Package Info</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Seats</TableHead>
                                        <TableHead className="text-center">Includes</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {packages && packages.length > 0 ? packages.map(pkg => (
                                        <TableRow key={pkg.package_id}>
                                            <TableCell>
                                                {pkg.cover_image ? (
                                                    <div className="relative h-10 w-10 rounded-md overflow-hidden bg-muted">
                                                        <Image src={`${CONTENT_PROVIDER_URL}${pkg.cover_image}`} alt={pkg.package_name} layout="fill" objectFit="cover" data-ai-hint="package photo" />
                                                    </div>
                                                ) : (
                                                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                                                        <PackageCheck className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <p className="font-medium">{pkg.package_name}</p>
                                                <p className="text-xs text-muted-foreground line-clamp-2">{pkg.description}</p>
                                            </TableCell>
                                            <TableCell>LKR {parseFloat(pkg.price).toFixed(2)}</TableCell>
                                            <TableCell>{pkg.parent_seat_count}P + {pkg.vip_seat}V</TableCell>
                                            <TableCell>
                                                <div className="flex justify-center gap-2">
                                                    {pkg.graduation_cloth === '1' && <Award className="h-5 w-5 text-blue-500" title="Graduation Cloak"/>}
                                                    {pkg.garland === '1' && <Sparkles className="h-5 w-5 text-pink-500" title="Garland" />}
                                                    {pkg.scroll === '1' && <ScrollText className="h-5 w-5 text-amber-600" title="Scroll"/>}
                                                    {pkg.photo_package === '1' && <GraduationCap className="h-5 w-5 text-purple-500" title="Graduation Hat"/>}
                                                    {pkg.refreshments === '1' && <Coffee className="h-5 w-5 text-orange-500" title="Refreshments"/>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right space-x-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenForm(pkg)}><Edit className="h-4 w-4"/></Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setPackageToDelete(pkg)}><Trash2 className="h-4 w-4"/></Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={6} className="text-center h-24">No packages created for this ceremony yet.</TableCell></TableRow>
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

    

    

    