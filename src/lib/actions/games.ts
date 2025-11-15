
"use server";

import type { GamePrescription, PrescriptionDetail } from '../types';

const QA_API_BASE_URL = process.env.NEXT_PUBLIC_LMS_SERVER_URL || 'https://qa-api.pharmacollege.lk';

export const getCeylonPharmacyPrescriptions = async (): Promise<GamePrescription[]> => {
    // In a real app, you might pass a course code or other filter
    const response = await fetch(`${QA_API_BASE_URL}/care-center-courses/course/CPCC19`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch game prescriptions' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    const data = await response.json();
    // The API returns an object with prescription IDs as keys, so we convert it to an array
    return Object.values(data);
};

export const getPrescriptionDetails = async (prescriptionId: string): Promise<PrescriptionDetail[]> => {
    if (!prescriptionId) return [];
    const response = await fetch(`${QA_API_BASE_URL}/care-content/pres-code/${prescriptionId}/`);
     if (response.status === 404) {
        return []; // No details found is a valid state.
    }
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch prescription details' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
}
