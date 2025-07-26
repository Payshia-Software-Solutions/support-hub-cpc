
import type { Prescription } from './d-pad-data';

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
          correctAnswers: {
            date: '2024-08-01',
            patientName: "Nimal Silva",
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
          correctAnswers: {
            date: '2024-08-01',
            patientName: "Saman Kumara",
            drugName: "Amoxicillin 250mg/5ml",
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
          correctAnswers: {
             date: '2024-08-01',
            patientName: "Fathima Rizvi",
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
        },
        {
          id: 'drug-cp3-2',
          lines: ['Atorvastatin 20mg', '1 nocte', '30d'],
          correctAnswers: {
            date: '2024-08-01',
            patientName: "Fathima Rizvi",
            drugName: "Atorvastatin 20mg",
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
        }
      ]
    }
  }
];
