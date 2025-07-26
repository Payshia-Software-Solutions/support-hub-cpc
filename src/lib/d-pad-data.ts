
export interface PrescriptionFormValues {
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
};

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
  lines: string[];
  rightSideText?: string;
  correctAnswers: PrescriptionFormValues;
  acceptedFrequencyAnswers: string[];
}

export const prescriptions: Prescription[] = [
  {
    id: 'rx1',
    doctor: { name: 'Dr. A. B. C. Perera', specialty: 'MBBS, MD', regNo: '12345' },
    patient: { name: 'John Doe', age: '34 Years' },
    date: '2024-07-30',
    lines: ['Paracetamol 500mg', '1 tds', '5d'],
    rightSideText: '4/52',
    correctAnswers: {
      drugName: "Paracetamol 500mg",
      dosage: "1",
      frequency: "tds",
      duration: "5d",
      quantity: 15,
    },
    acceptedFrequencyAnswers: ['tds', 'tid', 'three times a day'],
  },
  {
    id: 'rx2',
    doctor: { name: 'Dr. S. Jayawardena', specialty: 'MBBS, DCH', regNo: '67890' },
    patient: { name: 'Jane Smith', age: '45 Years' },
    date: '2024-07-28',
    lines: ['Amoxicillin 250mg', '1 bd', '7d'],
    rightSideText: '8/52',
    correctAnswers: {
      drugName: "Amoxicillin 250mg",
      dosage: "1",
      frequency: "bd",
      duration: "7d",
      quantity: 14,
    },
    acceptedFrequencyAnswers: ['bd', 'bid', 'twice a day'],
  },
  {
    id: 'rx3',
    doctor: { name: 'Dr. M. Fernando', specialty: 'MBBS', regNo: '54321' },
    patient: { name: 'Peter Jones', age: '62 Years' },
    date: '2024-07-25',
    lines: ['Metformin 500mg', '1 mane', '30d'],
    rightSideText: '1/52',
    correctAnswers: {
      drugName: "Metformin 500mg",
      dosage: "1",
      frequency: "mane",
      duration: "30d",
      quantity: 30,
    },
    acceptedFrequencyAnswers: ['mane', 'om', 'in the morning'],
  }
];
