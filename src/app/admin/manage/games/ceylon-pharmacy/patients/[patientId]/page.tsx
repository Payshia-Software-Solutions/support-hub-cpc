
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, PlusCircle, Edit, Trash2, MessageSquare } from "lucide-react";
import { ceylonPharmacyPatients, generalStoreItems, allInstructions as mockAllInstructions, type Patient, type PrescriptionDrug, type PrescriptionFormValues } from '@/lib/ceylon-pharmacy-data';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';


// --- Prescription Drug Form Dialog ---
const PrescriptionDrugFormDialog = ({
  isOpen,
  onOpenChange,
  onSave,
  drug,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (drugData: PrescriptionDrug) => void;
  drug: PrescriptionDrug | null;
}) => {
  const [formData, setFormData] = useState<PrescriptionDrug>(
    drug || {
      id: `new-${Date.now()}`,
      lines: [],
      price: 0,
      correctInstructionIds: [],
      acceptedFrequencyAnswers: [],
      correctAnswers: {
        drugName: '',
        genericName: '',
        dosage: '',
        frequency: '',
        duration: '',
        quantity: 0,
      } as PrescriptionFormValues,
    }
  );

  useEffect(() => {
    if (drug) {
      setFormData(drug);
    } else {
      // Reset for new drug
      setFormData({
        id: `new-${Date.now()}`,
        lines: [],
        price: 0,
        correctInstructionIds: [],
        acceptedFrequencyAnswers: [],
        correctAnswers: {
            drugName: '',
            genericName: '',
            dosage: '',
            frequency: '',
            duration: '',
            quantity: 0,
        } as PrescriptionFormValues,
      });
    }
  }, [drug]);

  const handleChange = (field: keyof PrescriptionFormValues, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      correctAnswers: { ...prev.correctAnswers, [field]: value },
    }));
  };
  
  const handleLinesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const lines = e.target.value.split('\n');
      setFormData(prev => ({...prev, lines}));
  }

  const handleInstructionToggle = (instructionId: string) => {
    setFormData(prev => {
      const newIds = new Set(prev.correctInstructionIds);
      if (newIds.has(instructionId)) {
        newIds.delete(instructionId);
      } else {
        newIds.add(instructionId);
      }
      return { ...prev, correctInstructionIds: Array.from(newIds) };
    });
  };

  const handleSaveChanges = () => {
    // Basic validation
    if (!formData.correctAnswers.drugName || !formData.correctAnswers.quantity) {
        toast({ variant: 'destructive', title: 'Missing required fields', description: 'Drug Name and Quantity are required.' });
        return;
    }
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{drug ? 'Edit' : 'Add'} Prescription Drug</DialogTitle>
          <DialogDescription>Fill in the details for this medication.</DialogDescription>
        </DialogHeader>
        <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Drug Name</Label>
                <Input value={formData.correctAnswers.drugName} onChange={(e) => handleChange('drugName', e.target.value)} />
            </div>
             <div className="space-y-2">
                <Label>Generic Name</Label>
                <Input value={formData.correctAnswers.genericName} onChange={(e) => handleChange('genericName', e.target.value)} />
            </div>
             <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" value={formData.correctAnswers.quantity} onChange={(e) => handleChange('quantity', Number(e.target.value))} />
            </div>
             <div className="space-y-2">
                <Label>Price (per unit)</Label>
                <Input type="number" value={formData.price} onChange={(e) => setFormData(p => ({...p, price: Number(e.target.value)}))} />
            </div>
            <div className="space-y-2 md:col-span-2">
                <Label>Prescription Lines (one per line)</Label>
                <Textarea value={formData.lines.join('\n')} onChange={handleLinesChange} rows={3}/>
            </div>
             <div className="space-y-2 md:col-span-2">
                <Label>Correct Counselling Instructions</Label>
                <div className="p-3 border rounded-md max-h-48 overflow-y-auto space-y-2">
                    {mockAllInstructions.map(inst => (
                        <div key={inst.id} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`inst-${inst.id}`} 
                                checked={formData.correctInstructionIds.includes(inst.id)}
                                onCheckedChange={() => handleInstructionToggle(inst.id)}
                            />
                            <Label htmlFor={`inst-${inst.id}`} className="text-sm font-normal">{inst.text}</Label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSaveChanges}>Save Drug</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


// This would be a form in a real application
const PrescriptionItem = ({ drug, onEdit, onDelete }: { drug: PrescriptionDrug; onEdit: () => void; onDelete: () => void; }) => {
    const correctInstructions = mockAllInstructions.filter(inst => drug.correctInstructionIds.includes(inst.id));

    return (
        <div className="p-3 border rounded-lg bg-muted/50">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-semibold">{drug.correctAnswers.drugName}</p>
                    <div className="text-xs text-muted-foreground space-x-2">
                        <span>Qty: {drug.correctAnswers.quantity}</span>
                        <span>|</span>
                        <span>Price: LKR {drug.price.toFixed(2)}</span>
                    </div>
                </div>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
                </div>
            </div>
             <div className="mt-2 pt-2 border-t">
                <h4 className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5"/>Correct Instructions</h4>
                 <div className="flex flex-wrap gap-1">
                    {correctInstructions.length > 0 ? (
                        correctInstructions.map(inst => (
                            <Badge key={inst.id} variant="secondary">{inst.text}</Badge>
                        ))
                    ) : (
                        <Badge variant="outline">No specific instructions</Badge>
                    )}
                </div>
            </div>
        </div>
    );
};



export default function PatientDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const patientId = params.patientId as string;

    const [patient, setPatient] = useState<Patient | null>(null);
    const [isDrugFormOpen, setIsDrugFormOpen] = useState(false);
    const [selectedDrug, setSelectedDrug] = useState<PrescriptionDrug | null>(null);

    useEffect(() => {
        const foundPatient = ceylonPharmacyPatients.find(p => p.id === patientId);
        if (foundPatient) {
            setPatient(JSON.parse(JSON.stringify(foundPatient))); // Deep copy to allow editing
        } else {
            toast({ variant: 'destructive', title: 'Patient not found' });
            router.push('/admin/manage/games/ceylon-pharmacy/patients');
        }
    }, [patientId, router]);
    
    const handlePatientDetailChange = (field: keyof Patient, value: string | number) => {
        if (!patient) return;
        setPatient(prev => prev ? { ...prev, [field]: value } : null);
    }
    
    const handleSavePatientDetails = () => {
        // In a real app, this would be a mutation to an API
        console.log("Saving patient details:", patient);
        toast({ title: 'Patient details saved!' });
    };

    const handleOpenDrugDialog = (drug: PrescriptionDrug | null) => {
        setSelectedDrug(drug);
        setIsDrugFormOpen(true);
    };
    
    const handleSaveDrug = (drugData: PrescriptionDrug) => {
        if (!patient) return;

        setPatient(prev => {
            if (!prev) return null;
            
            const existingIndex = prev.prescription.drugs.findIndex(d => d.id === drugData.id);
            const newDrugs = [...prev.prescription.drugs];

            if (existingIndex > -1) {
                newDrugs[existingIndex] = drugData; // Update
            } else {
                newDrugs.push(drugData); // Add
            }

            return { ...prev, prescription: { ...prev.prescription, drugs: newDrugs } };
        });
        
        toast({ title: drugData.id.startsWith('new-') ? 'Drug Added' : 'Drug Updated' });
    }

    const handleDeleteDrug = (drugId: string) => {
        if (!patient) return;
        
        setPatient(prev => {
            if (!prev) return null;
            const newDrugs = prev.prescription.drugs.filter(d => d.id !== drugId);
            return { ...prev, prescription: { ...prev.prescription, drugs: newDrugs } };
        });
        
        toast({ title: 'Drug removed' });
    };

    if (!patient) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
             <PrescriptionDrugFormDialog 
                isOpen={isDrugFormOpen}
                onOpenChange={setIsDrugFormOpen}
                drug={selectedDrug}
                onSave={handleSaveDrug}
             />
             <header>
                <Button variant="ghost" onClick={() => router.push('/admin/manage/games/ceylon-pharmacy/patients')} className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patient List
                </Button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <Card className="shadow-lg lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Patient Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="patient-name">Name</Label>
                            <Input id="patient-name" value={patient.name} onChange={(e) => handlePatientDetailChange('name', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="patient-age">Age</Label>
                            <Input id="patient-age" value={patient.age} onChange={(e) => handlePatientDetailChange('age', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="patient-time">Initial Time (seconds)</Label>
                            <Input id="patient-time" type="number" value={patient.initialTime} onChange={(e) => handlePatientDetailChange('initialTime', Number(e.target.value))} />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSavePatientDetails}>Save Patient Details</Button>
                    </CardFooter>
                </Card>

                <Card className="shadow-lg lg:col-span-2">
                    <CardHeader className="flex flex-row justify-between items-center">
                        <div>
                            <CardTitle>Prescription Management</CardTitle>
                            <CardDescription>Drugs prescribed to {patient.name}.</CardDescription>
                        </div>
                        <Button variant="outline" onClick={() => handleOpenDrugDialog(null)}>
                            <PlusCircle className="mr-2 h-4 w-4"/> Add Drug
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {patient.prescription.drugs.map(drug => (
                            <PrescriptionItem 
                                key={drug.id} 
                                drug={drug} 
                                onEdit={() => handleOpenDrugDialog(drug)}
                                onDelete={() => handleDeleteDrug(drug.id)}
                            />
                        ))}
                         {patient.prescription.drugs.length === 0 && (
                            <p className="text-center text-muted-foreground py-8">No drugs in this prescription yet.</p>
                         )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
