
"use client";

import type { GamePatient, PrescriptionDetail, DispensingAnswer, FormSelectionData, TreatmentStartRecord } from '../types';

const QA_API_BASE_URL = process.env.NEXT_PUBLIC_LMS_SERVER_URL || 'https://qa-api.pharmacollege.lk';

export const getCeylonPharmacyPrescriptions = async (studentId: string, courseCode: string): Promise<GamePatient[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/care-center-courses/student/${studentId}/course/${courseCode}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch game prescriptions' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    const data = await response.json();
    
    // The API returns an object with prescription IDs as keys. We need to convert it to an array.
    return Object.values(data).map((item: any) => ({
        ...item.patient, // Spread the patient details
        start_data: item.start_data // Add the start_data object
    }));
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
    // Get current date and time
    const now = new Date();

    // Format parts for the payload
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const date = `${year}-${month}-${day}`;
    const time = `${hours}:${minutes}:${seconds}`;
    const dateTime = `${date} ${time}`;

    const payload = {
        student_id: studentId,
        PresCode: presCode,
        time: time,
        created_at: dateTime,
        patient_status: "Pending"
    };
    
    const response = await fetch(`${QA_API_BASE_URL}/care-starts/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to start treatment' }));
        throw new Error(errorData.message || 'API error');
    }
    return response.json();
};
