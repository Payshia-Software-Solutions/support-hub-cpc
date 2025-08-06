
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BookOpen, Search, Pill } from "lucide-react";
import { cn } from '@/lib/utils';

// Dummy data to simulate BNF drug list. In a real app, this would come from an API.
const bnfDrugs = [
  { id: '1', name: 'Abacavir', a_to_z_category: 'A' },
  { id: '2', name: 'Acalabrutinib', a_to_z_category: 'A' },
  { id: '3', name: 'Acamprosate calcium', a_to_z_category: 'A' },
  { id: '4', name: 'Acarbose', a_to_z_category: 'A' },
  { id: '5', name: 'Acebutolol', a_to_z_category: 'A' },
  { id: '6', name: 'Acetazolamide', a_to_z_category: 'A' },
  { id: '7', name: 'Acetylcysteine', a_to_z_category: 'A' },
  { id: '8', name: 'Aciclovir', a_to_z_category: 'A' },
  { id: '9', name: 'Adalimumab', a_to_z_category: 'A' },
  { id: '10', name: 'Bendroflumethiazide', a_to_z_category: 'B' },
  { id: '11', name: 'Benperidol', a_to_z_category: 'B' },
  { id: '12', name: 'Benzatropine mesilate', a_to_z_category: 'B' },
  { id: '13', name: 'Betahistine dihydrochloride', a_to_z_category: 'B' },
  { id: '14', name: 'Betamethasone', a_to_z_category: 'B' },
  { id: '15', name: 'Bisacodyl', a_to_z_category: 'B' },
  { id: '16', name: 'Bisoprolol fumarate', a_to_z_category: 'B' },
  { id: '17', name: 'Calcipotriol', a_to_z_category: 'C' },
  { id: '18', name: 'Calcium carbonate', a_to_z_category: 'C' },
  { id: '19', name: 'Candesartan cilexetil', a_to_z_category: 'C' },
  { id: '20', name: 'Carbamazepine', a_to_z_category: 'C' },
  { id: '21', name: 'Carbimazole', a_to_z_category: 'C' },
  { id: '22', name: 'Cetirizine hydrochloride', a_to_z_category: 'C' },
  { id: '23', name: 'Ciclosporin', a_to_z_category: 'C' },
  { id: '24', name: 'Cinnarizine', a_to_z_category: 'C' },
  { id: '25', name: 'Dapagliflozin', a_to_z_category: 'D' },
  { id: '26', name: 'Dexamethasone', a_to_z_category: 'D' },
  { id: '27', name: 'Diazepam', a_to_z_category: 'D' },
  { id: '28', name: 'Diclofenac sodium', a_to_z_category: 'D' },
  { id: '29', name: 'Digoxin', a_to_z_category: 'D' },
  { id: '30', name: 'Enalapril maleate', a_to_z_category: 'E' },
  { id: '31', name: 'Eplerenone', a_to_z_category: 'E' },
  { id: '32', name: 'Esomeprazole', a_to_z_category: 'E' },
  { id: '33', name: 'Ezetimibe', a_to_z_category: 'E' },
  { id: '34', name: 'Famotidine', a_to_z_category: 'F' },
  { id: '35', name: 'Ferrous fumarate', a_to_z_category: 'F' },
  { id: '36', name: 'Fexofenadine hydrochloride', a_to_z_category: 'F' },
  { id: '37', name: 'Finasteride', a_to_z_category: 'F' },
  { id: '38', name: 'Flucloxacillin', a_to_z_category: 'F' },
  { id: '39', name: 'Gabapentin', a_to_z_category: 'G' },
  { id: '40', name: 'Gliclazide', a_to_z_category: 'G' },
  { id: '41', name: 'Glyceryl trinitrate', a_to_z_category: 'G' },
  { id: '42', name: 'Haloperidol', a_to_z_category: 'H' },
  { id: '43', name: 'Hydrocortisone', a_to_z_category: 'H' },
  { id: '44', name: 'Hydroxychloroquine sulfate', a_to_z_category: 'H' },
  { id: '45', name: 'Hyoscine butylbromide', a_to_z_category: 'H' },
  { id: '46', name: 'Ibuprofen', a_to_z_category: 'I' },
  { id: '47', name: 'Irbesartan', a_to_z_category: 'I' },
  { id: '48', name: 'Isosorbide mononitrate', a_to_z_category: 'I' },
  { id: '49', name: 'Lansoprazole', a_to_z_category: 'L' },
  { id: '50', name: 'Levothyroxine sodium', a_to_z_category: 'L' },
  { id: '51', name: 'Lisinopril', a_to_z_category: 'L' },
  { id: '52', name: 'Loratadine', a_to_z_category: 'L' },
  { id: '53', name: 'Losartan potassium', a_to_z_category: 'L' },
  { id: '54', name: 'Metformin hydrochloride', a_to_z_category: 'M' },
  { id: '55', name: 'Methotrexate', a_to_z_category: 'M' },
  { id: '56', name: 'Metronidazole', a_to_z_category: 'M' },
  { id: '57', name: 'Naproxen', a_to_z_category: 'N' },
  { id: '58', name: 'Nifedipine', a_to_z_category: 'N' },
  { id: '59', name: 'Nitrofurantoin', a_to_z_category: 'N' },
  { id: '60', name: 'Omeprazole', a_to_z_category: 'O' },
  { id: '61', name: 'Ondansetron', a_to_z_category: 'O' },
  { id: '62', name: 'Paracetamol', a_to_z_category: 'P' },
  { id: '63', name: 'Phenytoin sodium', a_to_z_category: 'P' },
  { id: '64', name: 'Prednisolone', a_to_z_category: 'P' },
  { id: '65', name: 'Propranolol hydrochloride', a_to_z_category: 'P' },
  { id: '66', name: 'Ramipril', a_to_z_category: 'R' },
  { id: '67', name: 'Ranitidine', a_to_z_category: 'R' },
  { id: '68', name: 'Risperidone', a_to_z_category: 'R' },
  { id: '69', name: 'Rosuvastatin', a_to_z_category: 'R' },
  { id: '70', name: 'Salbutamol', a_to_z_category: 'S' },
  { id: '71', name: 'Sertraline', a_to_z_category: 'S' },
  { id: '72', name: 'Simvastatin', a_to_z_category: 'S' },
  { id: '73', name: 'Sodium valproate', a_to_z_category: 'S' },
  { id: '74', name: 'Spironolactone', a_to_z_category: 'S' },
  { id: '75', name: 'Sulfasalazine', a_to_z_category: 'S' },
  { id: '76', name: 'Tamsulosin hydrochloride', a_to_z_category: 'T' },
  { id: '77', name: 'Temazepam', a_to_z_category: 'T' },
  { id: '78', name: 'Tramadol hydrochloride', a_to_z_category: 'T' },
  { id: '79', name: 'Trimethoprim', a_to_z_category: 'T' },
  { id: '80', name: 'Warfarin sodium', a_to_z_category: 'W' },
  { id: '81', name: 'Zopiclone', a_to_z_category: 'Z' },
];

export default function BnfPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('A');

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

  const filteredDrugs = useMemo(() => {
    let drugs = bnfDrugs;
    if (searchTerm) {
      drugs = drugs.filter(drug => drug.name.toLowerCase().includes(searchTerm.toLowerCase()));
    } else if (selectedLetter) {
      drugs = drugs.filter(drug => drug.a_to_z_category === selectedLetter);
    }
    return drugs.sort((a,b) => a.name.localeCompare(b.name));
  }, [searchTerm, selectedLetter]);

  const handleLetterSelect = (letter: string) => {
    setSearchTerm(''); // Clear search when a letter is selected
    setSelectedLetter(letter);
  }

  return (
    <div className="p-4 md:p-8 space-y-8 pb-20">
      <header className="flex items-center gap-4">
        <div className="bg-primary/10 p-3 rounded-full">
           <BookOpen className="w-8 h-8 text-primary" />
        </div>
        <div>
           <h1 className="text-3xl font-headline font-semibold">Digital British National Formulary</h1>
           <p className="text-muted-foreground">Find drug monographs and information.</p>
        </div>
      </header>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Drug Index</CardTitle>
          <CardDescription>Search for a drug or select a letter to browse the index.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search drug name..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedLetter(''); // Clear letter selection when searching
                }}
              />
            </div>
            <div className="flex flex-wrap gap-1 justify-center">
              {alphabet.map(letter => (
                <Button
                  key={letter}
                  variant={selectedLetter === letter && !searchTerm ? 'default' : 'outline'}
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => handleLetterSelect(letter)}
                >
                  {letter}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">
              {searchTerm ? `Results for "${searchTerm}"` : `Drugs starting with "${selectedLetter}"`}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredDrugs.length > 0 ? (
                    filteredDrugs.map(drug => (
                        <div key={drug.id} className="p-3 border rounded-md hover:bg-muted/50 transition-colors">
                           <div className="flex items-center gap-2">
                                <Pill className="h-4 w-4 text-primary" />
                                <p className="font-medium text-sm">{drug.name}</p>
                           </div>
                        </div>
                    ))
                ) : (
                    <p className="text-muted-foreground col-span-full text-center py-8">
                        No drugs found matching your criteria.
                    </p>
                )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
