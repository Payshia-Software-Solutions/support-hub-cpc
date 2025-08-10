
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getStaffMembers } from '@/lib/api';
import type { StaffMember } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

interface Commission {
    id: string;
    task: string;
    rate: number;
}

// MOCK DATA: In a real app, this would be fetched from an API per staff member
const staffCommissionData: Record<string, Commission[]> = {
    'staff1': [
        { id: '1', task: 'Student Registration', rate: 500.00 },
        { id: '2', task: 'Ticket Solve (Level 1)', rate: 50.00 },
    ],
    'staff2': [
        { id: '3', task: 'Student Registration', rate: 450.00 },
        { id: '4', task: 'Ticket Solve (Level 2)', rate: 100.00 },
    ],
    'staff3': [],
};

const CommissionForm = ({ commission, onSave, onClose }: { commission: Commission | null; onSave: (commission: Commission) => void; onClose: () => void; }) => {
    const [task, setTask] = useState(commission?.task || '');
    const [rate, setRate] = useState<number | string>(commission?.rate || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericRate = parseFloat(String(rate));
        if (!task || isNaN(numericRate) || numericRate < 0) {
            toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please provide a valid task name and a positive rate.' });
            return;
        }
        onSave({ id: commission?.id || `new-${Date.now()}`, task, rate: numericRate });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="task-name">Task Name</Label>
                <Input id="task-name" value={task} onChange={(e) => setTask(e.target.value)} placeholder="e.g., Student Registration" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="task-rate">Commission Rate (LKR)</Label>
                <Input id="task-rate" type="number" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="e.g., 500.00" step="0.01" />
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit">Save</Button>
            </DialogFooter>
        </form>
    );
};

export default function StaffCommissionDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const staffId = params.staffId as string;

    const { data: staffMembers, isLoading: isLoadingStaff } = useQuery<StaffMember[]>({
        queryKey: ['staffMembersForCommissions'],
        queryFn: getStaffMembers,
    });

    const staffMember = staffMembers?.find(s => s.id === staffId);
    
    // MOCK: In a real app, this would be a `useQuery` to fetch commissions for `staffId`
    const [commissions, setCommissions] = useState<Commission[]>([]);
    useEffect(() => {
        if(staffId) {
             setCommissions(staffCommissionData[staffId] || []);
        }
    }, [staffId]);


    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
    const [commissionToDelete, setCommissionToDelete] = useState<Commission | null>(null);

    const handleCreate = () => {
        setSelectedCommission(null);
        setIsFormOpen(true);
    };

    const handleEdit = (commission: Commission) => {
        setSelectedCommission(commission);
        setIsFormOpen(true);
    };
    
    const handleSave = (commissionData: Commission) => {
        if (selectedCommission) {
            setCommissions(prev => prev.map(c => c.id === commissionData.id ? commissionData : c));
            toast({ title: "Commission Updated", description: `The rate for "${commissionData.task}" has been updated.` });
        } else {
            setCommissions(prev => [...prev, commissionData]);
            toast({ title: "Commission Added", description: `A new commission for "${commissionData.task}" has been added.` });
        }
        setIsFormOpen(false);
    }
    
    const handleDelete = (id: string) => {
        setCommissions(prev => prev.filter(c => c.id !== id));
        toast({ title: "Commission Deleted" });
        setCommissionToDelete(null);
    }

    if(isLoadingStaff) {
        return <div className="p-8"><Skeleton className="h-64 w-full" /></div>
    }

    if(!staffMember) {
        return <div className="p-8 text-center">Staff member not found.</div>
    }


  return (
    <div className="p-4 md:p-8 space-y-6 pb-20">
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent><DialogHeader><DialogTitle>{selectedCommission ? "Edit" : "Create"} Commission</DialogTitle><DialogDescription>Define a commissionable task and its rate for {staffMember.name}.</DialogDescription></DialogHeader><CommissionForm commission={selectedCommission} onSave={handleSave} onClose={() => setIsFormOpen(false)} /></DialogContent>
      </Dialog>
      <AlertDialog open={!!commissionToDelete} onOpenChange={() => setCommissionToDelete(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the commission for "{commissionToDelete?.task}".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(commissionToDelete!.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>

      <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
           <Button variant="ghost" onClick={() => router.push('/admin/manage/commissions')} className="-ml-4"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Staff List</Button>
           <h1 className="text-3xl font-headline font-semibold mt-2">Individual Staff Commissions</h1>
           <p className="text-muted-foreground">Set and adjust task-based commissions for {staffMember.name}.</p>
        </div>
        <Button onClick={handleCreate}><PlusCircle className="mr-2 h-4 w-4" /> Add New Rate</Button>
      </header>

      <Card className="shadow-lg">
        <CardHeader><CardTitle>Commission Rates for {staffMember.name}</CardTitle></CardHeader>
        <CardContent>
            <div className="relative w-full overflow-auto border rounded-lg">
                <Table>
                    <TableHeader><TableRow><TableHead>Task Name</TableHead><TableHead>Commission Rate (LKR)</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {commissions.length > 0 ? commissions.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.task}</TableCell>
                                <TableCell>{item.rate.toFixed(2)}</TableCell>
                                <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Edit className="h-4 w-4"/></Button><Button variant="ghost" size="icon" className="text-destructive" onClick={() => setCommissionToDelete(item)}><Trash2 className="h-4 w-4"/></Button></TableCell>
                            </TableRow>
                        )) : (
                            <TableRow><TableCell colSpan={3} className="text-center h-24">No commission rates defined for this staff member yet.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
