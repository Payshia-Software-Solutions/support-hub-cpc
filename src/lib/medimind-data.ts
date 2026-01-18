
export interface GameQuestion {
  id: string;
  text: string;
}

export type AnswerSet = Record<string, string[]>;

export interface MedicineModule {
  id: string;
  name: string;
  status: 'open' | 'completed';
  answers: Record<string, string>;
}

export interface GameLevel {
  id: string;
  title: string;
  items: string[]; // This will now be an array of medicine IDs
  questions: GameQuestion[];
}

export interface MediMindGameData {
  question_set: GameQuestion[];
  answer_sets: AnswerSet;
  medicine_data: MedicineModule[];
  levels: GameLevel[];
}

const allQuestions: GameQuestion[] = [
    { "id": "q1", "text": "What is its primary Drug Class?" },
    { "id": "q2", "text": "What is its primary Indication (use)?" },
    { "id": "q3", "text": "What is its Mechanism of Action?" },
    { "id": "q4", "text": "What is a Common Side Effect?" },
    { "id": "q5", "text": "What is a common Dosage Form?" },
    { "id": "q6", "text": "What is a key Contraindication?" }
];

const allAnswerSets: AnswerSet = {
    "q1": ["Analgesic", "Antibiotic", "Antihypertensive", "NSAID", "Beta-blocker", "Antiviral", "Antifungal", "Diuretic", "Antidepressant", "Anticoagulant", "Statin", "Proton Pump Inhibitor", "Antihistamine", "Corticosteroid", "Bronchodilator", "Biguanide", "Sulfonylurea", "Cardiac glycoside", "5-HT3 antagonist"],
    "q2": ["Pain and fever", "Bacterial infection", "High blood pressure", "Fungal infection", "Viral infection", "Inflammation", "Blood clots", "Depression", "Heart failure", "Allergies", "High cholesterol", "Acid reflux", "Asthma", "Nausea and vomiting", "Type 2 diabetes"],
    "q3": ["Inhibits COX enzymes", "Inhibits bacterial cell wall synthesis", "Blocks beta-receptors", "Inhibits viral replication", "Inhibits fungal ergosterol synthesis", "Blocks sodium channels", "Increases water excretion", "Inhibits HMG-CoA reductase", "Blocks H2 receptors", "Irreversibly inhibits H+/K+ ATPase", "Blocks H1 receptors", "Stimulates beta-2 adrenergic receptors", "Disrupts bacterial DNA", "Inhibits vitamin K-dependent clotting factors", "Decreases hepatic glucose production", "Stimulates insulin secretion", "Inhibits Na+/K+ ATPase pump", "Inhibits DNA gyrase", "Blocks serotonin receptors", "Modulates gene expression"],
    "q4": ["Liver damage (in overdose)", "Diarrhea", "Dizziness", "Stomach upset", "Rash", "Headache", "Fatigue", "Nausea", "Constipation", "Dry mouth", "Muscle pain", "Increased heart rate", "Bleeding", "Hypoglycemia", "Tendon rupture", "Arrhythmias", "Weight gain"],
    "q5": ["Tablet", "Capsule", "Syrup", "IV Injection", "Suppository", "Inhaler", "Topical Cream", "Transdermal Patch", "Nasal Spray", "Eye drops", "Oral suspension"],
    "q6": ["Severe liver disease", "Penicillin allergy", "Severe asthma", "Pregnancy", "Renal failure", "Bleeding disorders", "MAOI use", "Sulfa allergy", "Hypersensitivity to the drug", "Glaucoma", "Myasthenia gravis", "Systemic fungal infection", "Ventricular fibrillation"]
};

const allMedicines: MedicineModule[] = [
    { "id": "1", "name": "Paracetamol", "status": "open", "answers": { "q1": "Analgesic", "q2": "Pain and fever", "q3": "Inhibits COX enzymes", "q4": "Liver damage (in overdose)", "q5": "Tablet", "q6": "Severe liver disease" } },
    { "id": "2", "name": "Amoxicillin", "status": "open", "answers": { "q1": "Antibiotic", "q2": "Bacterial infection", "q3": "Inhibits bacterial cell wall synthesis", "q4": "Diarrhea", "q5": "Capsule", "q6": "Penicillin allergy" } },
    { "id": "3", "name": "Atenolol", "status": "open", "answers": { "q1": "Beta-blocker", "q2": "High blood pressure", "q3": "Blocks beta-receptors", "q4": "Fatigue", "q5": "Tablet", "q6": "Severe asthma" } },
    { "id": "4", "name": "Ibuprofen", "status": "open", "answers": { "q1": "NSAID", "q2": "Inflammation", "q3": "Inhibits COX enzymes", "q4": "Stomach upset", "q5": "Tablet", "q6": "Bleeding disorders" } },
    { "id": "5", "name": "Acyclovir", "status": "open", "answers": { "q1": "Antiviral", "q2": "Viral infection", "q3": "Inhibits viral replication", "q4": "Nausea", "q5": "Topical Cream", "q6": "Renal failure" } },
    { "id": "6", "name": "Fluconazole", "status": "open", "answers": { "q1": "Antifungal", "q2": "Fungal infection", "q3": "Inhibits fungal ergosterol synthesis", "q4": "Headache", "q5": "Capsule", "q6": "Pregnancy" } },
    { "id": "7", "name": "Furosemide", "status": "open", "answers": { "q1": "Diuretic", "q2": "Heart failure", "q3": "Increases water excretion", "q4": "Dizziness", "q5": "IV Injection", "q6": "Sulfa allergy" } },
    { "id": "8", "name": "Sertraline", "status": "open", "answers": { "q1": "Antidepressant", "q2": "Depression", "q3": "Inhibits serotonin reuptake", "q4": "Nausea", "q5": "Tablet", "q6": "MAOI use" } },
    { "id": "9", "name": "Warfarin", "status": "open", "answers": { "q1": "Anticoagulant", "q2": "Blood clots", "q3": "Inhibits vitamin K-dependent clotting factors", "q4": "Bleeding", "q5": "Tablet", "q6": "Bleeding disorders" } },
    { "id": "10", "name": "Atorvastatin", "status": "open", "answers": { "q1": "Statin", "q2": "High cholesterol", "q3": "Inhibits HMG-CoA reductase", "q4": "Muscle pain", "q5": "Tablet", "q6": "Severe liver disease" } },
    { "id": "11", "name": "Omeprazole", "status": "open", "answers": { "q1": "Proton Pump Inhibitor", "q2": "Acid reflux", "q3": "Irreversibly inhibits H+/K+ ATPase", "q4": "Headache", "q5": "Capsule", "q6": "Hypersensitivity to the drug" } },
    { "id": "12", "name": "Loratadine", "status": "open", "answers": { "q1": "Antihistamine", "q2": "Allergies", "q3": "Blocks H1 receptors", "q4": "Dry mouth", "q5": "Tablet", "q6": "Glaucoma" } },
    { "id": "13", "name": "Prednisolone", "status": "open", "answers": { "q1": "Corticosteroid", "q2": "Inflammation", "q3": "Modulates gene expression", "q4": "Weight gain", "q5": "Tablet", "q6": "Systemic fungal infection" } },
    { "id": "14", "name": "Salbutamol", "status": "open", "answers": { "q1": "Bronchodilator", "q2": "Asthma", "q3": "Stimulates beta-2 adrenergic receptors", "q4": "Increased heart rate", "q5": "Inhaler", "q6": "Hypersensitivity to the drug" } },
    { "id": "15", "name": "Metronidazole", "status": "open", "answers": { "q1": "Antibiotic", "q2": "Bacterial infection", "q3": "Disrupts bacterial DNA", "q4": "Nausea", "q5": "Tablet", "q6": "Pregnancy" } },
    { "id": "16", "name": "Ciprofloxacin", "status": "open", "answers": { "q1": "Antibiotic", "q2": "Bacterial infection", "q3": "Inhibits DNA gyrase", "q4": "Tendon rupture", "q5": "Tablet", "q6": "Myasthenia gravis" } },
    { "id": "17", "name": "Digoxin", "status": "open", "answers": { "q1": "Cardiac glycoside", "q2": "Heart failure", "q3": "Inhibits Na+/K+ ATPase pump", "q4": "Arrhythmias", "q5": "Tablet", "q6": "Ventricular fibrillation" } },
    { "id": "18", "name": "Metformin", "status": "open", "answers": { "q1": "Biguanide", "q2": "Type 2 diabetes", "q3": "Decreases hepatic glucose production", "q4": "Diarrhea", "q5": "Tablet", "q6": "Renal failure" } },
    { "id": "19", "name": "Gliclazide", "status": "open", "answers": { "q1": "Sulfonylurea", "q2": "Type 2 diabetes", "q3": "Stimulates insulin secretion", "q4": "Hypoglycemia", "q5": "Tablet", "q6": "Severe liver disease" } },
    { "id": "20", "name": "Ondansetron", "status": "open", "answers": { "q1": "5-HT3 antagonist", "q2": "Nausea and vomiting", "q3": "Blocks serotonin receptors", "q4": "Constipation", "q5": "IV Injection", "q6": "Hypersensitivity to the drug" } }
];

const allLevels: GameLevel[] = [
    {
        id: '1',
        title: 'Level 1: The Basics',
        items: ['1', '2'], // Paracetamol, Amoxicillin
        questions: [
            allQuestions.find(q => q.id === 'q1')!,
            allQuestions.find(q => q.id === 'q2')!,
            allQuestions.find(q => q.id === 'q5')!,
        ]
    },
    {
        id: '2',
        title: 'Level 2: Cardiovascular Care',
        items: ['3', '9', '10', '17'], // Atenolol, Warfarin, Atorvastatin, Digoxin
        questions: [
            allQuestions.find(q => q.id === 'q1')!,
            allQuestions.find(q => q.id === 'q2')!,
            allQuestions.find(q => q.id === 'q3')!,
            allQuestions.find(q => q.id === 'q4')!,
        ]
    },
    {
        id: '3',
        title: 'Level 3: Common Ailments',
        items: ['4', '12', '11', '14'], // Ibuprofen, Loratadine, Omeprazole, Salbutamol
        questions: allQuestions.slice(0, 5) // First 5 questions
    }
];

export const mediMindGameData: MediMindGameData = {
  question_set: allQuestions,
  answer_sets: allAnswerSets,
  medicine_data: allMedicines,
  levels: allLevels
};
