
export interface BnfPage {
  id: number;
  title: string;
  indexWords: string;
  leftContent: {
    heading: string;
    paragraphs: string[];
    subHeading?: string;
  };
  rightContent: {
    list: { bold: string; text: string }[];
    note?: string;
  };
}

export interface BnfChapter {
    id: number;
    title: string;
    pages: BnfPage[];
}

export const bnfChapters: BnfChapter[] = [
  {
    id: 1,
    title: 'Chapter 1: General Principles',
    pages: [
        {
            id: 1, title: '1.1 Introduction to Pharmacology', indexWords: 'Pharmacology',
            leftContent: { heading: '1.1 Introduction to Pharmacology', paragraphs: ['Pharmacology is the science of drugs and their effects on living systems. This includes the study of drug composition and properties, interactions, toxicology, therapy, and medical applications.'], subHeading: 'Key Concepts' },
            rightContent: { list: [{ bold: 'Pharmacokinetics:', text: 'What the body does to the drug.' }, { bold: 'Pharmacodynamics:', text: 'What the drug does to the body.' }], note: 'For actual medical information, always consult the official British National Formulary.' }
        },
        {
            id: 2, title: '1.2 Routes of Drug Administration', indexWords: 'Administration',
            leftContent: { heading: '1.2 Routes of Drug Administration', paragraphs: ['The route of administration is the path by which a drug, fluid, poison, or other substance is taken into the body.', 'Routes can be broadly divided into those for local and those for systemic effects.'], subHeading: 'Common Routes' },
            rightContent: { list: [{ bold: 'Enteral:', text: 'Oral, sublingual, rectal.' }, { bold: 'Parenteral:', text: 'Intravenous, intramuscular, subcutaneous.' }, { bold: 'Topical:', text: 'Applied directly to the skin.' }] }
        },
        {
            id: 3, title: '1.3 Drug Interactions', indexWords: 'Interactions',
            leftContent: { heading: '1.3 Drug Interactions', paragraphs: ['A drug interaction is a situation in which a substance affects the activity of a drug when both are administered together.', 'This can enhance or decrease the action of the drug or cause unexpected adverse effects.'], subHeading: 'Interaction Types' },
            rightContent: { list: [{ bold: 'Drug-Drug:', text: 'Interaction between two or more drugs.' }, { bold: 'Drug-Food:', text: 'Interaction between a drug and food.' }] }
        },
        {
            id: 4, title: '1.4 Adverse Drug Reactions (ADRs)', indexWords: 'ADRs',
            leftContent: { heading: '1.4 Adverse Drug Reactions', paragraphs: ['An adverse drug reaction is an injury caused by taking a medication.', 'ADRs may occur following a single dose or prolonged administration of a drug or result from the combination of two or more drugs.'], subHeading: 'Classification' },
            rightContent: { list: [{ bold: 'Type A:', text: 'Augmented - dose-related, predictable.' }, { bold: 'Type B:', text: 'Bizarre - non-dose-related, unpredictable.' }] }
        },
        {
            id: 5, title: '1.5 Pharmacokinetics', indexWords: 'Pharmacokinetics',
            leftContent: { heading: '1.5 Pharmacokinetics', paragraphs: ['Pharmacokinetics, sometimes described as what the body does to a drug, refers to the movement of drug into, through, and out of the body.'], subHeading: 'ADME' },
            rightContent: { list: [{ bold: 'Absorption:', text: 'Drug enters the body.' }, { bold: 'Distribution:', text: 'Drug moves around the body.' }, { bold: 'Metabolism:', text: 'Drug is modified by the body.' }, { bold: 'Excretion:', text: 'Drug is eliminated from the body.' }] }
        },
        {
            id: 6, title: '1.6 Pharmacodynamics', indexWords: 'Pharmacodynamics',
            leftContent: { heading: '1.6 Pharmacodynamics', paragraphs: ['Pharmacodynamics is the study of the biochemical and physiologic effects of drugs on the body and the mechanisms of their action.'], subHeading: 'Key Areas' },
            rightContent: { list: [{ bold: 'Receptor Binding:', text: 'How drugs bind to receptors.' }, { bold: 'Dose-Response:', text: 'The relationship between drug concentration and effect.' }] }
        },
    ]
  },
  {
    id: 2,
    title: 'Chapter 2: Cardiovascular System',
    pages: [
       {
            id: 7, title: '2.1 Hypertension', indexWords: 'Hypertension',
            leftContent: { heading: '2.1 Hypertension', paragraphs: ['Hypertension, also known as high blood pressure, is a long-term medical condition in which the blood pressure in the arteries is persistently elevated.'], subHeading: 'Drug Classes' },
            rightContent: { list: [{ bold: 'Diuretics:', text: 'Promote the removal of excess water and salt.' }, { bold: 'Beta-blockers:', text: 'Make the heart beat slower and with less force.' }] }
        },
    ]
  }
];

export const allPages: BnfPage[] = bnfChapters.flatMap(chapter => chapter.pages);

export interface BnfWordIndexEntry {
    word: string;
    page_id: number;
}

export const wordIndexData = [
  { word: "Absorption", page_id: 5 },
  { word: "Administration, routes of", page_id: 2 },
  { word: "Adverse Drug Reactions (ADRs)", page_id: 4 },
  { word: "Beta-blockers", page_id: 7 },
  { word: "Bizarre reactions (Type B)", page_id: 4 },
  { word: "Distribution", page_id: 5 },
  { word: "Diuretics", page_id: 7 },
  { word: "Dose-Response", page_id: 6 },
  { word: "Drug Interactions", page_id: 3 },
  { word: "Enteral", page_id: 2 },
  { word: "Excretion", page_id: 5 },
  { word: "Hypertension", page_id: 7 },
  { word: "Metabolism", page_id: 5 },
  { word: "Parenteral", page_id: 2 },
  { word: "Pharmacodynamics", page_id: 1 },
  { word: "Pharmacodynamics", page_id: 6 },
  { word: "Pharmacokinetics", page_id: 1 },
  { word: "Pharmacokinetics", page_id: 5 },
  { word: "Pharmacology", page_id: 1 },
  { word: "Receptor Binding", page_id: 6 },
  { word: "Topical", page_id: 2 },
].sort((a, b) => a.word.localeCompare(b.word));
