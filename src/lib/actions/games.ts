

"use server";

import type { GamePrescription, PrescriptionDetail, DispensingAnswer, FormSelectionData, TreatmentStartRecord } from '../types';

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

export const getDispensingAnswers = async (prescriptionId: string, coverId: string): Promise<DispensingAnswer> => {
    if (!prescriptionId || !coverId) {
        throw new Error("Prescription ID and Cover ID are required.");
    }
    const response = await fetch(`${QA_API_BASE_URL}/care-answers/pres-id/${prescriptionId}/cover-id/${coverId}/`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch dispensing answers' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    const data = await response.json();
    // The API returns an array with a single object
    if (Array.isArray(data) && data.length > 0) {
        return data[0];
    }
    throw new Error("Invalid answer data format received from API.");
};

export const getFormSelectionData = async (): Promise<FormSelectionData> => {
    const response = await fetch(`${QA_API_BASE_URL}/care-answers/form-selection-data/`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch form selection data' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
};


export const getTreatmentStartTime = async (studentId: string, presCode: string): Promise<TreatmentStartRecord | null> => {
    const response = await fetch(`${QA_API_BASE_URL}/care-starts/student/${studentId}/pres-code/${presCode}/`);
    if (response.status === 404) {
        return null; // Not an error, just means treatment hasn't started
    }
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch treatment start time' }));
        throw new Error(errorData.message || 'API error');
    }
    return response.json();
}

export const createTreatmentStartRecord = async (studentId: string, presCode: string): Promise<TreatmentStartRecord> => {
    const response = await fetch(`${QA_API_BASE_URL}/care-starts/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            student_id: studentId,
            PresCode: presCode,
            patient_status: "Pending"
        }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to start treatment' }));
        throw new Error(errorData.message || 'API error');
    }
    return response.json();
}
