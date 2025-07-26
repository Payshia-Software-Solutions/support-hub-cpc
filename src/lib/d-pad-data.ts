
export interface PrescriptionFormValues {
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
};

export interface PrescriptionDrug {
  id: string;
  lines: string[];
  correctAnswers: PrescriptionFormValues;
  acceptedFrequencyAnswers: string[];
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
  rightSideText?: string;
  drugs: PrescriptionDrug[];
}

export const prescriptions: Prescription[] = [
  {
    id: 'rx1',
    doctor: { name: 'Dr. A. B. C. Perera', specialty: 'MBBS, MD', regNo: '12345' },
    patient: { name: 'John Doe', age: '34 Years' },
    date: '2024-07-30',
    rightSideText: '4/52',
    drugs: [
      {
        id: '1',
        lines: ['Paracetamol 500mg', '1 tds', '5d'],
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
        id: '2',
        lines: ['Amoxicillin 250mg', '1 bd', '7d'],
        correctAnswers: {
          drugName: "Amoxicillin 250mg",
          dosage: "1",
          frequency: "bd",
          duration: "7d",
          quantity: 14,
        },
        acceptedFrequencyAnswers: ['bd', 'bid', 'twice a day'],
      }
    ],
  },
  {
    id: 'rx2',
    doctor: { name: 'Dr. S. Jayawardena', specialty: 'MBBS, DCH', regNo: '67890' },
    patient: { name: 'Jane Smith', age: '45 Years' },
    date: '2024-07-28',
    rightSideText: '8/52',
    drugs: [
      {
        id: '1',
        lines: ['Amoxicillin 250mg', '1 bd', '7d'],
        correctAnswers: {
          drugName: "Amoxicillin 250mg",
          dosage: "1",
          frequency: "bd",
          duration: "7d",
          quantity: 14,
        },
        acceptedFrequencyAnswers: ['bd', 'bid', 'twice a day'],
      }
    ]
  },
  {
    id: 'rx3',
    doctor: { name: 'Dr. M. Fernando', specialty: 'MBBS', regNo: '54321' },
    patient: { name: 'Peter Jones', age: '62 Years' },
    date: '2024-07-25',
    rightSideText: '1/52',
    drugs: [
      {
        id: '1',
        lines: ['Metformin 500mg', '1 mane', '30d'],
        correctAnswers: {
          drugName: "Metformin 500mg",
          dosage: "1",
          frequency: "mane",
          duration: "30d",
          quantity: 30,
        },
        acceptedFrequencyAnswers: ['mane', 'om', 'in the morning'],
      }
    ]
  }
];
