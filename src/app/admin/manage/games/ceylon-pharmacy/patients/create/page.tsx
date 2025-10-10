
"use client";

import { useRouter } from 'next/navigation';

export default function CreatePatientPage() {
    const router = useRouter();
    // This page is no longer used for the form. The creation logic is now a dialog on the patient list page.
    // We redirect back to the main patients page.
    if (typeof window !== 'undefined') {
        router.replace('/admin/manage/games/ceylon-pharmacy/patients');
    }

    return (
        <div className="p-8">
            <p>Redirecting...</p>
        </div>
    );
}
