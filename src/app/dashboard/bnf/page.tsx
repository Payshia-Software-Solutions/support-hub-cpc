
"use client";

// This component is designed to look like a page from a book,
// similar to the British National Formulary (BNF).

export default function BnfPage() {
  return (
    <div className="bg-white min-h-full">
        <article className="max-w-5xl mx-auto p-8 md:p-12 font-serif text-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-16 gap-y-8">
                {/* Left Column */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                            <span className="text-gray-600 font-normal">1.1</span> Introduction to Pharmacology
                        </h1>
                    </div>
                    <div className="space-y-4 text-base leading-relaxed">
                        <p>
                            Pharmacology is the science of drugs and their effects on living systems. This includes the study of drug composition and properties, interactions, toxicology, therapy, and medical applications.
                        </p>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8">
                            Key Concepts
                        </h2>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                     <ul className="space-y-5 text-base leading-relaxed">
                        <li>
                            <span className="font-bold">Pharmacokinetics:</span> What the body does to the drug (absorption, distribution, metabolism, excretion).
                        </li>
                         <li>
                            <span className="font-bold">Pharmacodynamics:</span> What the drug does to the body (mechanism of action, therapeutic effects, adverse effects).
                        </li>
                    </ul>
                     <p className="text-sm text-gray-600 pt-8">
                        This dummy page provides a brief overview. For actual medical information, always consult the official British National Formulary.
                    </p>
                </div>
            </div>
            
            <footer className="text-center mt-16 text-sm text-gray-500">
                <p>Page 1</p>
            </footer>
        </article>
    </div>
  );
}
