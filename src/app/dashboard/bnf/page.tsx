
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, ListOrdered, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// --- Data Structure for BNF Pages ---

interface BnfPage {
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

interface BnfChapter {
    id: number;
    title: string;
    pages: BnfPage[];
}

const bnfChapters: BnfChapter[] = [
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

const allPages: BnfPage[] = bnfChapters.flatMap(chapter => chapter.pages);

const wordIndexData = [
  { word: "Absorption", page: 5 },
  { word: "Administration, routes of", page: 2 },
  { word: "Adverse Drug Reactions (ADRs)", page: 4 },
  { word: "Beta-blockers", page: 7 },
  { word: "Bizarre reactions (Type B)", page: 4 },
  { word: "Distribution", page: 5 },
  { word: "Diuretics", page: 7 },
  { word: "Dose-Response", page: 6 },
  { word: "Drug Interactions", page: 3 },
  { word: "Enteral", page: 2 },
  { word: "Excretion", page: 5 },
  { word: "Hypertension", page: 7 },
  { word: "Metabolism", page: 5 },
  { word: "Parenteral", page: 2 },
  { word: "Pharmacodynamics", page: 1 },
  { word: "Pharmacodynamics", page: 6 },
  { word: "Pharmacokinetics", page: 1 },
  { word: "Pharmacokinetics", page: 5 },
  { word: "Pharmacology", page: 1 },
  { word: "Receptor Binding", page: 6 },
  { word: "Topical", page: 2 },
].sort((a, b) => a.word.localeCompare(b.word));


export default function BnfPage() {
    const [view, setView] = useState<'contents' | 'page' | 'index'>('contents');
    const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState('');

    const handleNextPage = () => {
        if (selectedPageIndex < allPages.length - 1) {
            setSelectedPageIndex(prev => prev + 1);
        }
    };

    const handlePrevPage = () => {
        if (selectedPageIndex > 0) {
            setSelectedPageIndex(prev => prev - 1);
        }
    };
    
    const handleSelectPage = (pageId: number) => {
        const pageIndex = allPages.findIndex(p => p.id === pageId);
        if (pageIndex !== -1) {
            setSelectedPageIndex(pageIndex);
            setView('page');
        }
    }

    const handleBackToContents = () => {
        setView('contents');
    }
    
    const filteredChapters = bnfChapters.map(chapter => {
        const filteredPages = chapter.pages.filter(page => 
            page.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return { ...chapter, pages: filteredPages };
    }).filter(chapter => chapter.pages.length > 0);
    
    const filteredIndexWords = wordIndexData.filter(item => 
        item.word.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderView = () => {
        switch (view) {
            case 'page':
                const currentPageData = allPages[selectedPageIndex];
                return (
                    <article className="max-w-5xl mx-auto p-4 md:p-8 font-serif">
                        <header className="flex justify-between items-center mb-4 border-b-2 pb-2 shrink-0">
                            <Button variant="link" onClick={handleBackToContents} className="font-sans text-muted-foreground pl-0">
                                <ArrowLeft className="mr-2 h-4 w-4"/> Back to Contents
                            </Button>
                            <h3 className="text-sm font-sans font-semibold text-muted-foreground">{currentPageData.indexWords}</h3>
                        </header>

                        <div className="space-y-6">
                            <div>
                                <h1 className="text-4xl font-bold text-foreground leading-tight">
                                    {currentPageData.leftContent.heading}
                                </h1>
                            </div>
                            <div className="space-y-4 text-base leading-relaxed text-foreground/90">
                                {currentPageData.leftContent.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
                            </div>
                            {currentPageData.leftContent.subHeading && (
                                    <div>
                                    <h2 className="text-2xl font-bold text-foreground mt-8">
                                        {currentPageData.leftContent.subHeading}
                                    </h2>
                                </div>
                            )}
                            <ul className="space-y-5 text-base leading-relaxed text-foreground/90">
                                {currentPageData.rightContent.list.map((item, i) => (
                                    <li key={i}>
                                        <strong className="font-semibold">{item.bold}</strong> {item.text}
                                    </li>
                                ))}
                            </ul>
                            {currentPageData.rightContent.note && (
                                <p className="text-sm text-muted-foreground pt-8">
                                    {currentPageData.rightContent.note}
                                </p>
                            )}
                        </div>
                        
                        <footer className="flex justify-between items-center text-center mt-4 pt-4 border-t-2 text-sm text-muted-foreground font-sans shrink-0">
                            <Button variant="outline" onClick={handlePrevPage} disabled={selectedPageIndex === 0}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                            </Button>
                            <span>Page {currentPageData.id}</span>
                            <Button variant="outline" onClick={handleNextPage} disabled={selectedPageIndex === allPages.length - 1}>
                                Next <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </footer>
                    </article>
                );
            case 'index':
                 return (
                    <div className="p-4 md:p-8 space-y-6 pb-20 max-w-5xl mx-auto font-serif h-full flex flex-col">
                        <header className="flex justify-between items-center mb-4 border-b pb-2">
                             <div className="flex-1">
                                <h1 className="text-3xl font-bold">Word Index</h1>
                                <p className="text-sm text-muted-foreground mt-1">Alphabetical index of words found in the formulary.</p>
                            </div>
                            <Button variant="outline" onClick={handleBackToContents} className="font-sans ml-4 shrink-0">
                                <ArrowLeft className="mr-2 h-4 w-4"/> Back to Contents
                            </Button>
                        </header>
                         <div className="relative mb-6">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search Word Index..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-full font-sans"
                            />
                        </div>
                        <Card className="p-6 flex-1 overflow-y-auto">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2 text-sm font-sans">
                               {filteredIndexWords.map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSelectPage(item.page)}
                                        className="text-left hover:text-primary hover:underline flex justify-between"
                                    >
                                        <span>{item.word}</span>
                                        <span>{item.page}</span>
                                    </button>
                               ))}
                            </div>
                            {filteredIndexWords.length === 0 && (
                                <p className="text-center text-muted-foreground py-10 font-sans">No results found for "{searchTerm}".</p>
                            )}
                        </Card>
                    </div>
                );
            case 'contents':
            default:
                return (
                    <div className="p-4 md:p-8 space-y-8 pb-20 max-w-4xl mx-auto h-full flex flex-col">
                        <header className="text-center">
                            <h1 className="text-4xl font-serif font-bold text-foreground">Table of Contents</h1>
                        </header>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="relative flex-grow w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search Table of Contents by title..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 w-full"
                                />
                            </div>
                            <Button variant="outline" onClick={() => { setSearchTerm(''); setView('index'); }} className="w-full sm:w-auto">
                                <ListOrdered className="mr-2 h-4 w-4" /> Word Index
                            </Button>
                        </div>
                        <div className="space-y-6 font-serif flex-1 overflow-y-auto pr-4 -mr-4">
                            {filteredChapters.map(chapter => (
                                <div key={chapter.id}>
                                    <h2 className="font-bold text-xl mb-2 flex justify-between items-baseline text-foreground">
                                        <span>{chapter.title}</span>
                                        <span className="text-sm font-sans font-normal text-muted-foreground">Page {chapter.pages[0].id}</span>
                                    </h2>
                                    <ul className="space-y-1 border-l-2 pl-4 ml-2 border-border">
                                        {chapter.pages.map(page => (
                                            <li key={page.id}>
                                                <button
                                                    onClick={() => handleSelectPage(page.id)}
                                                    className="w-full text-left p-2 rounded-md hover:bg-accent/50 transition-colors flex justify-between items-baseline text-muted-foreground"
                                                >
                                                    <span>{page.title}</span>
                                                    <span className="text-sm font-sans text-muted-foreground">Page {page.id}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                             {filteredChapters.length === 0 && (
                                <p className="text-center text-muted-foreground py-10">No results found for "{searchTerm}".</p>
                            )}
                        </div>
                    </div>
                );
        }
    };


  return (
    <div className="h-full flex flex-col">
        {renderView()}
    </div>
  );
}
