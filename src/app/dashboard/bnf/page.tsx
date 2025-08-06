
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

// --- Data Structure for BNF Pages ---
const bnfPages = [
  {
    id: 1,
    title: '1.1 Introduction to Pharmacology',
    indexWords: 'Pharmacology',
    leftContent: {
      heading: '1.1 Introduction to Pharmacology',
      paragraphs: [
        'Pharmacology is the science of drugs and their effects on living systems. This includes the study of drug composition and properties, interactions, toxicology, therapy, and medical applications.',
      ],
      subHeading: 'Key Concepts',
    },
    rightContent: {
      list: [
        { bold: 'Pharmacokinetics:', text: 'What the body does to the drug (absorption, distribution, metabolism, excretion).' },
        { bold: 'Pharmacodynamics:', text: 'What the drug does to the body (mechanism of action, therapeutic effects, adverse effects).' },
      ],
      note: 'This dummy page provides a brief overview. For actual medical information, always consult the official British National Formulary.'
    }
  },
  {
    id: 2,
    title: '1.2 Drug Absorption',
    indexWords: 'Absorption',
    leftContent: {
      heading: '1.2 Drug Absorption',
      paragraphs: [
        'Drug absorption is the movement of a drug into the bloodstream from the site of administration.',
        'The rate and extent of absorption depend on various factors, including the route of administration, the formulation of the drug, and the physicochemical properties of the drug.',
      ],
      subHeading: 'Primary Routes of Administration',
    },
    rightContent: {
      list: [
        { bold: 'Enteral:', text: 'Oral, sublingual, rectal. The most common route.' },
        { bold: 'Parenteral:', text: 'Intravenous, intramuscular, subcutaneous. Bypasses the gastrointestinal tract.' },
        { bold: 'Topical:', text: 'Applied directly to the skin or mucous membranes.' },
      ],
      note: 'Intravenous administration results in 100% bioavailability as the drug directly enters systemic circulation.'
    }
  },
];


export default function BnfPage() {
    const [currentPageIndex, setCurrentPageIndex] = useState(0);

    const handleNextPage = () => {
        setCurrentPageIndex(prev => Math.min(prev + 1, bnfPages.length - 1));
    };

    const handlePrevPage = () => {
        setCurrentPageIndex(prev => Math.max(prev - 1, 0));
    };

    const currentPageData = bnfPages[currentPageIndex];

  return (
    <div className="bg-white min-h-full">
        <article className="max-w-5xl mx-auto p-8 md:p-12 font-serif text-gray-800">
            {/* Header with Word Index */}
            <header className="flex justify-between items-center mb-8 border-b-2 pb-2">
                <h3 className="text-sm font-sans font-semibold text-gray-600">{currentPageData.indexWords}</h3>
                <h3 className="text-sm font-sans font-semibold text-gray-600">Page {currentPageData.id}</h3>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-16 gap-y-8">
                {/* Left Column */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                            {currentPageData.leftContent.heading}
                        </h1>
                    </div>
                    <div className="space-y-4 text-base leading-relaxed">
                        {currentPageData.leftContent.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8">
                            {currentPageData.leftContent.subHeading}
                        </h2>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                     <ul className="space-y-5 text-base leading-relaxed">
                        {currentPageData.rightContent.list.map((item, i) => (
                             <li key={i}>
                                <span className="font-bold">{item.bold}</span> {item.text}
                            </li>
                        ))}
                    </ul>
                     <p className="text-sm text-gray-600 pt-8">
                        {currentPageData.rightContent.note}
                    </p>
                </div>
            </div>
            
            <footer className="flex justify-between items-center text-center mt-16 pt-4 border-t-2 text-sm text-gray-500 font-sans">
                <Button variant="outline" onClick={handlePrevPage} disabled={currentPageIndex === 0}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                <span>Page {currentPageData.id} of {bnfPages.length}</span>
                <Button variant="outline" onClick={handleNextPage} disabled={currentPageIndex === bnfPages.length - 1}>
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </footer>
        </article>
    </div>
  );
}
