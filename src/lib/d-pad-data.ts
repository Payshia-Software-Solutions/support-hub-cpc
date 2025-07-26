

export interface PrescriptionFormValues {
  drugName: string;
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
          dosageForm: "Tablet",
          morningQty: "1",
          afternoonQty: "1",
          eveningQty: "1",
          nightQty: "-",
          mealType: "After Meal",
          usingFrequency: "Daily",
          bagin: "1",
          payaWarak: "-",
          additionalInstruction: "If fever persists, see a doctor."
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
          dosageForm: "Capsule",
          morningQty: "1",
          afternoonQty: "-",
          eveningQty: "-",
          nightQty: "1",
          mealType: "Before Meal",
          usingFrequency: "Daily",
          bagin: "1",
          payaWarak: "12",
          additionalInstruction: "Complete the full course."
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
        lines: ['Omeprazole 20mg', '1 mane', '1m'],
        correctAnswers: {
          drugName: "Omeprazole 20mg",
          dosage: "1",
          frequency: "mane",
          duration: "1m",
          quantity: 30,
          dosageForm: "Capsule",
          morningQty: "1",
          afternoonQty: "-",
          eveningQty: "-",
          nightQty: "-",
          mealType: "Before Meal",
          usingFrequency: "Daily",
          bagin: "1",
          payaWarak: "-",
          additionalInstruction: "Take 30 mins before breakfast."
        },
        acceptedFrequencyAnswers: ['mane', 'om', 'in the morning'],
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
        lines: ['Metformin 500mg', '1 bd', '30d'],
        correctAnswers: {
          drugName: "Metformin 500mg",
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
      }
    ]
  },
  {
    id: 'rx4',
    doctor: { name: 'Dr. N. Silva', specialty: 'MBBS, FCCP', regNo: '24680' },
    patient: { name: 'Emily Carter', age: '28 Years' },
    date: '2024-07-22',
    rightSideText: '3/52',
    drugs: [
      {
        id: '1',
        lines: ['Cefixime 200mg', '1 bd', '5d'],
        correctAnswers: {
          drugName: "Cefixime 200mg",
          dosage: "1",
          frequency: "bd",
          duration: "5d",
          quantity: 10,
          dosageForm: "Tablet",
          morningQty: "1",
          afternoonQty: "-",
          eveningQty: "-",
          nightQty: "1",
          mealType: "After Meal",
          usingFrequency: "Daily",
          bagin: "1",
          payaWarak: "-",
          additionalInstruction: "Drink plenty of water."
        },
        acceptedFrequencyAnswers: ['bd', 'bid', 'twice a day'],
      },
      {
        id: '2',
        lines: ['Ibuprofen 400mg', '1 tds', '3d'],
        correctAnswers: {
          drugName: "Ibuprofen 400mg",
          dosage: "1",
          frequency: "tds",
          duration: "3d",
          quantity: 9,
          dosageForm: "Tablet",
          morningQty: "1",
          afternoonQty: "1",
          eveningQty: "1",
          nightQty: "-",
          mealType: "With Meal",
          usingFrequency: "Daily",
          bagin: "1",
          payaWarak: "-",
          additionalInstruction: "Take if required for pain."
        },
        acceptedFrequencyAnswers: ['tds', 'tid', 'three times a day'],
      },
      {
        id: '3',
        lines: ['Salbutamol Inhaler', '2 puffs sos'],
        correctAnswers: {
          drugName: "Salbutamol Inhaler",
          dosage: "2 puffs",
          frequency: "sos",
          duration: "N/A",
          quantity: 1,
          dosageForm: "Inhaler",
          morningQty: "-",
          afternoonQty: "-",
          eveningQty: "-",
          nightQty: "-",
          mealType: "N/A",
          usingFrequency: "As needed",
          bagin: "-",
          payaWarak: "-",
          additionalInstruction: "For shortness of breath."
        },
        acceptedFrequencyAnswers: ['sos', 'prn', 'when required'],
      }
    ]
  },
   {
    id: 'rx5',
    doctor: { name: 'Dr. L. Jayasinghe', specialty: 'Cardiologist', regNo: '13579' },
    patient: { name: 'Michael Chen', age: '58 Years' },
    date: '2024-07-20',
    rightSideText: '12/52',
    drugs: [
      {
        id: '1',
        lines: ['Atorvastatin 20mg', '1 nocte', '1m'],
        correctAnswers: {
          drugName: "Atorvastatin 20mg",
          dosage: "1",
          frequency: "nocte",
          duration: "1m",
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
      },
      {
        id: '2',
        lines: ['Aspirin 75mg', '1 mane', '30d'],
        correctAnswers: {
          drugName: "Aspirin 75mg",
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
      }
    ]
  }
];
