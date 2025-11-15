

export interface PrescriptionFormValues {
  date: string;
  patientName: string;
  drugName: string;
  genericName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  dosageForm: string;
  morningQty: string;
  afternoonQty: string;
  eveningQty: string;
  nightQty: string;
  mealType: string;
  usingFrequency: string;
  bagin: string; // Sinhala "බැගින්"
  payaWarak: string; // Sinhala "පැය __ වරක්"
  additionalInstruction: string;
};

export interface PrescriptionDrug {
  id: string;
  lines: string[];
  correctAnswers: PrescriptionFormValues;
  acceptedFrequencyAnswers: string[];
  correctInstructionIds: string[];
}

export interface GeneralStoreItem {
    id: string;
    name: string;
    price: number;
    category: 'Vitamins' | 'First-Aid' | 'Personal Care';
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

export interface Patient {
  id: string;
  name: string;
  age: string;
  status: 'waiting' | 'recovered' | 'dead';
  initialTime: number; // in seconds
  description?: string; // patient_description
  address?: string;
  createdBy?: string;
  createdAt?: string;
  prescription: Prescription;
  notes?: string;
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

// This is now effectively a fallback and will be replaced by API data
export const ceylonPharmacyPatients: Patient[] = []; 

export const generalStoreItems: GeneralStoreItem[] = [
    { id: 'gen-1', name: 'Vitamin C 500mg (30 tabs)', price: 450.00, category: 'Vitamins' },
    { id: 'gen-2', name: 'Multivitamin Syrup', price: 600.00, category: 'Vitamins' },
    { id: 'gen-3', name: 'Band-Aid (20 strips)', price: 150.00, category: 'First-Aid' },
    { id: 'gen-4', name: 'Antiseptic Cream', price: 220.00, category: 'First-Aid' },
    { id: 'gen-5', name: 'Digital Thermometer', price: 800.00, category: 'First-Aid' },
    { id: 'gen-6', name: 'Herbal Toothpaste', price: 350.00, category: 'Personal Care' },
    { id: 'gen-7', name: 'Sunscreen SPF 50', price: 1200.00, category: 'Personal Care' },
];
