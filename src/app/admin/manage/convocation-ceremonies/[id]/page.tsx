
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

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
import { ArrowLeft, PlusCircle, Edit, Trash2, Loader2, PackageCheck, GraduationCap } from 'lucide-react';

// API and Type imports
import { getCeremonyById, getPackagesByCeremony, createPackage, updatePackage, deletePackage } from '@/lib/actions/certificates';
import type { ConvocationCeremony, ConvocationPackage } from '@/lib/types';


const packageFormSchema = z.object({
    package_name: z.string().min(3, "Package name is required."),
    price: z.coerce.number().min(0, "Price must be a positive number."),
    parent_seat_count: z.coerce.number().int().min(0, "Seat count cannot be negative."),
    garland: z.boolean().default(false),
    graduation_cloth: z.boolean().default(false),
    photo_package: z.boolean().default(false),
    cover_image: z.any().optional(),
});

type PackageFormValues = z.infer<typeof packageFormSchema>;

const PackageForm = ({ pkg, onSave, onClose, isSaving }: { pkg: ConvocationPackage | null, onSave: (data: PackageFormValues) => void, onClose: () => void, isSaving: boolean }) => {
    const form = useForm<PackageFormValues>({
        resolver: zodResolver(packageFormSchema),
        defaultValues: {
            package_name: pkg?.package_name || '',
            price: pkg ? parseFloat(pkg.price) : 0,
            parent_seat_count: pkg ? parseInt(pkg.parent_seat_count, 10) : 0,
            garland: pkg?.garland === '1',
            graduation_cloth: pkg?.graduation_cloth === '1',
            photo_package: pkg?.photo_package === '1',
            cover_image: null,
        },
    });

    return (
        <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor="package_name">Package Name</Label>
                <Input id="package_name" {...form.register('package_name')} />
                {form.formState.errors.package_name && <p className="text-sm text-destructive">{form.formState.errors.package_name.message}</p>}
            </div>
             <div className="grid grid-cols-2 gap-4">
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
                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm"><Label htmlFor="garland">Garland Included</Label><Switch id="garland" checked={form.watch('garland')} onCheckedChange={(checked) => form.setValue('garland', checked)} /></div>
                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm"><Label htmlFor="graduation_cloth">Graduation Cloth Included</Label><Switch id="graduation_cloth" checked={form.watch('graduation_cloth')} onCheckedChange={(checked) => form.setValue('graduation_cloth', checked)} /></div>
                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm"><Label htmlFor="photo_package">Photo Package Included</Label><Switch id="photo_package" checked={form.watch('photo_package')} onCheckedChange={(checked) => form.setValue('photo_package', checked)} /></div>
            </div>
            <DialogFooter>
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
        formData.append('price', String(data.price));
        formData.append('parent_seat_count', String(data.parent_seat_count));
        formData.append('garland', data.garland ? '1' : '0');
        formData.append('graduation_cloth', data.graduation_cloth ? '1' : '0');
        formData.append('photo_package', data.photo_package ? '1' : '0');
        formData.append('is_active', '1');
        formData.append('convocation_id', ceremonyId);

        if (data.cover_image && data.cover_image.length > 0) {
            formData.append('cover_image', data.cover_image[0]);
        }
        
        mutation.mutate({ formData, pkg: selectedPackage });
    };

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
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
                                <TableHeader><TableRow><TableHead>Package Name</TableHead><TableHead>Price</TableHead><TableHead>Seats</TableHead><TableHead className="text-center">Includes</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {packages && packages.length > 0 ? packages.map(pkg => (
                                        <TableRow key={pkg.package_id}>
                                            <TableCell className="font-medium">{pkg.package_name}</TableCell>
                                            <TableCell>LKR {parseFloat(pkg.price).toFixed(2)}</TableCell>
                                            <TableCell>{pkg.parent_seat_count}</TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex justify-center gap-2">
                                                    {pkg.garland === '1' && <PackageCheck className="h-5 w-5 text-green-500" title="Garland" />}
                                                    {pkg.graduation_cloth === '1' && <GraduationCap className="h-5 w-5 text-blue-500" title="Graduation Cloth"/>}
                                                    {pkg.photo_package === '1' && <PackageCheck className="h-5 w-5 text-purple-500" title="Photo Package"/>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right space-x-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenForm(pkg)}><Edit className="h-4 w-4"/></Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setPackageToDelete(pkg)}><Trash2 className="h-4 w-4"/></Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={5} className="text-center h-24">No packages created for this ceremony yet.</TableCell></TableRow>
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
