

// This file contains static mock data for the Ceylon Pharmacy game.
// Much of this is now being replaced by live API calls.

import type { GeneralStoreItem } from './types';

export interface PrescriptionFormValues {
  date: string;
  patientName: string;
  drugName: string;
  genericName?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  quantity: number;
  dosageForm: string;
  morningQty: string;
  afternoonQty: string;
  eveningQty: string;
  nightQty: string;
  mealType: string;
  usingFrequency: string;
  bagin?: string; // Sinhala "බැගින්"
  payaWarak?: string; // Sinhala "පැය __ වරක්"
  additionalInstruction?: string;
};

export interface PrescriptionDrug {
  id: string;
  lines: string[];
  correctAnswers: PrescriptionFormValues; // This might become deprecated
  acceptedFrequencyAnswers: string[];
  correctInstructionIds: string[];
}

export interface MasterProduct {
    product_id: string;
    product_code: string;
    ProductName: string;
    DisplayName: string;
    PrintName: string;
    SellingPrice: string;
    [key: string]: any; // Allow other properties
}

export interface Prescription {
  id: string;
  name: string; // prescription_name
  status: string; // prescription_status
  doctor: {
    name: string;
    specialty: string;
    regNo: string;
  };
  patient: {
    name: string;
    age: string;
  };
  date: string;
  method: string; // Pres_Method
  notes?: string;
  drugs: PrescriptionDrug[];
  totalBillValue: number;
}


export const allInstructions = [
  { id: '1', text: 'Take with a full glass of water.' },
  { id: '2', text: 'Complete the full course of medication.' },
  { id: '3', text: 'May cause drowsiness. Do not operate heavy machinery.' },
  { id: '4', text: 'Avoid direct sunlight.' },
  { id: '5', text: 'Take 30 minutes before food.' },
  { id: '6', text: 'Finish all medication even if you feel better.' },
  { id: '7', text: 'None' },
];

export const generalStoreItems: GeneralStoreItem[] = [
  { id: 'item1', name: 'Vitamin C 500mg', price: 150.00, category: 'Vitamins' },
  { id: 'item2', name: 'Band-Aids (Box of 20)', price: 80.00, category: 'First-Aid' },
  { id: 'item3', name: 'Antiseptic Wipes', price: 120.00, category: 'First-Aid' },
  { id: 'item4', name: 'Sunscreen SPF 50', price: 450.00, category: 'Personal Care' },
  { id: 'item5', name: 'Multivitamin Tablets', price: 300.00, category: 'Vitamins' },
];

// This is now effectively a fallback and will be replaced by API data
export const ceylonPharmacyPatients: any[] = []; 
