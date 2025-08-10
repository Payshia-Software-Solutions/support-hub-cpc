
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Percent, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface Commission {
    id: string;
    task: string;
    rate: number;
}

const CommissionForm = ({
  commission,
  onSave,
  onClose,
}: {
  commission: Commission | null;
  onSave: (commission: Commission) => void;
  onClose: () => void;
}) => {
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
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  );
};


export default function ManageCommissionsPage() {
    // In a real app, this would come from an API via useQuery
    const [commissions, setCommissions] = useState<Commission[]>([
        { id: '1', task: 'Student Registration', rate: 500.00 },
        { id: '2', task: 'Ticket Solve (Level 1)', rate: 50.00 },
        { id: '3', task: 'Ticket Solve (Level 2)', rate: 100.00 },
    ]);
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
            // Update existing
            setCommissions(prev => prev.map(c => c.id === commissionData.id ? commissionData : c));
            toast({ title: "Commission Updated", description: `The rate for "${commissionData.task}" has been updated.` });
        } else {
            // Add new
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


  return (
    <div className="p-4 md:p-8 space-y-6 pb-20">
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCommission ? "Edit" : "Create"} Commission</DialogTitle>
            <DialogDescription>
              {selectedCommission ? "Modify the existing commission task." : "Define a new commissionable task and its rate."}
            </DialogDescription>
          </DialogHeader>
          <CommissionForm
            commission={selectedCommission}
            onSave={handleSave}
            onClose={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!commissionToDelete} onOpenChange={() => setCommissionToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the commission for "{commissionToDelete?.task}". This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(commissionToDelete!.id)}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

      <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-semibold">Staff Commissions</h1>
          <p className="text-muted-foreground">Manage commission rates for various staff tasks.</p>
        </div>
        <Button onClick={handleCreate}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Commission
        </Button>
      </header>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>Commission Rates</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="relative w-full overflow-auto border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Task Name</TableHead>
                            <TableHead>Commission Rate (LKR)</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {commissions.length > 0 ? commissions.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.task}</TableCell>
                                <TableCell>{item.rate.toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Edit className="h-4 w-4"/></Button>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setCommissionToDelete(item)}><Trash2 className="h-4 w-4"/></Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24">
                                    No commission rates defined yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
