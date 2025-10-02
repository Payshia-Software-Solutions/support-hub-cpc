
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
  price: number;
  correctAnswers: PrescriptionFormValues;
  acceptedFrequencyAnswers: string[];
  correctInstructionIds: string[]; // <-- ADDED THIS FIELD
}

export interface GeneralStoreItem {
    id: string;
    name: string;
    price: number;
    category: 'Vitamins' | 'First-Aid' | 'Personal Care';
}

export interface Prescription {
  id: string;
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
  drugs: PrescriptionDrug[];
}

export interface Patient {
  id: string;
  name: string;
  age: string;
  status: 'waiting' | 'recovered' | 'dead';
  initialTime: number; // in seconds
  prescription: Prescription;
}

export const ceylonPharmacyPatients: Patient[] = [
  {
    id: 'patient1',
    name: 'Nimal Silva',
    age: '45 Years',
    status: 'waiting',
    initialTime: 300, // 5 minutes
    prescription: {
      id: 'rx-cp1',
      doctor: { name: 'Dr. S. Perera', specialty: 'General Physician', regNo: '11223' },
      patient: { name: 'Nimal Silva', age: '45' },
      date: '2024-08-01',
      drugs: [
        {
          id: 'drug-cp1-1',
          lines: ['Metformin 500mg', '1 bd', '30d'],
          price: 15.50,
          correctAnswers: {
            date: '2024-08-01',
            patientName: "Nimal Silva",
            drugName: "Metformin 500mg",
            genericName: "Metformin Hydrochloride",
            dosage: "1",
            frequency: "bd",
            duration: "30d",
            quantity: 60,
            dosageForm: "Tablet",
            morningQty: "1",
            afternoonQty: "-",
            eveningQty: "1",
            nightQty: "-",
            mealType: "With Meal",
            usingFrequency: "Daily",
            bagin: "1",
            payaWarak: "-",
            additionalInstruction: "Monitor blood sugar levels."
          },
          acceptedFrequencyAnswers: ['bd', 'bid', 'twice a day'],
          correctInstructionIds: ['2'], // Complete the full course
        }
      ]
    }
  },
  {
    id: 'patient2',
    name: 'Saman Kumara',
    age: '32 Years',
    status: 'waiting',
    initialTime: 240, // 4 minutes
    prescription: {
      id: 'rx-cp2',
      doctor: { name: 'Dr. K. Fernando', specialty: 'Pediatrician', regNo: '44556' },
      patient: { name: 'Saman Kumara', age: '32' },
      date: '2024-08-01',
      drugs: [
        {
          id: 'drug-cp2-1',
          lines: ['Amoxicillin 250mg/5ml', '5ml tds', '7d'],
          price: 250.00,
          correctAnswers: {
            date: '2024-08-01',
            patientName: "Saman Kumara",
            drugName: "Amoxicillin 250mg/5ml",
            genericName: "Amoxicillin Trihydrate",
            dosage: "5ml",
            frequency: "tds",
            duration: "7d",
            quantity: 1, // 1 bottle
            dosageForm: "Syrup",
            morningQty: "5ml",
            afternoonQty: "5ml",
            eveningQty: "5ml",
            nightQty: "-",
            mealType: "After Meal",
            usingFrequency: "Daily",
            bagin: "5ml",
            payaWarak: "8",
            additionalInstruction: "Shake well before use."
          },
          acceptedFrequencyAnswers: ['tds', 'tid', 'three times a day'],
          correctInstructionIds: ['2', '6'], // Complete the course, Finish all medication
        }
      ]
    }
  },
  {
    id: 'patient3',
    name: 'Fathima Rizvi',
    age: '55 Years',
    status: 'waiting',
    initialTime: 360, // 6 minutes
    prescription: {
      id: 'rx-cp3',
      doctor: { name: 'Dr. T. Rajapakse', specialty: 'Cardiologist', regNo: '77889' },
      patient: { name: 'Fathima Rizvi', age: '55' },
      date: '2024-08-01',
      drugs: [
        {
          id: 'drug-cp3-1',
          lines: ['Aspirin 75mg', '1 mane', '30d'],
          price: 5.25,
          correctAnswers: {
             date: '2024-08-01',
            patientName: "Fathima Rizvi",
            drugName: "Aspirin 75mg",
            genericName: "Acetylsalicylic Acid",
            dosage: "1",
            frequency: "mane",
            duration: "30d",
            quantity: 30,
            dosageForm: "Tablet",
            morningQty: "1",
            afternoonQty: "-",
            eveningQty: "-",
            nightQty: "-",
            mealType: "After Meal",
            usingFrequency: "Daily",
            bagin: "1",
            payaWarak: "-",
            additionalInstruction: "Take with plenty of water."
          },
          acceptedFrequencyAnswers: ['mane', 'om', 'in the morning'],
          correctInstructionIds: ['1'], // Take with a full glass of water
        },
        {
          id: 'drug-cp3-2',
          lines: ['Atorvastatin 20mg', '1 nocte', '30d'],
          price: 30.00,
          correctAnswers: {
            date: '2024-08-01',
            patientName: "Fathima Rizvi",
            drugName: "Atorvastatin 20mg",
            genericName: "Atorvastatin Calcium",
            dosage: "1",
            frequency: "nocte",
            duration: "30d",
            quantity: 30,
            dosageForm: "Tablet",
            morningQty: "-",
            afternoonQty: "-",
            eveningQty: "-",
            nightQty: "1",
            mealType: "After Meal",
            usingFrequency: "Daily",
            bagin: "1",
            payaWarak: "-",
            additionalInstruction: "Avoid grapefruit juice."
          },
          acceptedFrequencyAnswers: ['nocte', 'on', 'at night'],
          correctInstructionIds: ['7'], // None
        }
      ]
    }
  }
];

export const generalStoreItems: GeneralStoreItem[] = [
    { id: 'gen-1', name: 'Vitamin C 500mg (30 tabs)', price: 450.00, category: 'Vitamins' },
    { id: 'gen-2', name: 'Multivitamin Syrup', price: 600.00, category: 'Vitamins' },
    { id: 'gen-3', name: 'Band-Aid (20 strips)', price: 150.00, category: 'First-Aid' },
    { id: 'gen-4', name: 'Antiseptic Cream', price: 220.00, category: 'First-Aid' },
    { id: 'gen-5', name: 'Digital Thermometer', price: 800.00, category: 'First-Aid' },
    { id: 'gen-6', name: 'Herbal Toothpaste', price: 350.00, category: 'Personal Care' },
    { id: 'gen-7', name: 'Sunscreen SPF 50', price: 1200.00, category: 'Personal Care' },
];
