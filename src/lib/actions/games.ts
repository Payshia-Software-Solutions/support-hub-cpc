

"use client";

import type { GamePatient, PrescriptionDetail, DispensingAnswer, FormSelectionData, TreatmentStartRecord, ValidateAnswerPayload, ValidateAnswerResponse, Instruction, SaveCounselingAnswerPayload, DispensingSubmissionStatus, MasterProduct, POSCorrectAnswer, POSSubmissionPayload, POSSubmissionStatus, RecoveryRecord } from '../types';

const QA_API_BASE_URL = process.env.NEXT_PUBLIC_LMS_SERVER_URL || 'https://qa-api.pharmacollege.lk';
const POS_IMAGE_BASE_URL = 'https://pos.payshia.com/uploads/product_images/';

export const getMasterProducts = async (): Promise<MasterProduct[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/master-products/`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch master products' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
};

export const updateMasterProduct = async ({ productId, name, price }: { productId: string, name: string, price: string }): Promise<MasterProduct> => {
    const response = await fetch(`${QA_API_BASE_URL}/master-products/${productId}/update-name-and-price/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, price }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update product' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    return response.json();
};


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

export const validateDispensingAnswer = async (payload: ValidateAnswerPayload): Promise<ValidateAnswerResponse> => {
    const response = await fetch(`${QA_API_BASE_URL}/care-answer-submits/validate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
     if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to submit answers for validation' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
}

export const getDispensingSubmissionStatus = async (studentNumber: string, presCode: string, coverId: string): Promise<DispensingSubmissionStatus> => {
    const response = await fetch(`${QA_API_BASE_URL}/care-answer-submits/check/${studentNumber}/${presCode}/${coverId}/`);
    if (!response.ok) {
         if(response.status === 404) {
            const errorData = await response.json();
            return { answer_id: null, error: errorData.error };
        }
        const errorData = await response.json().catch(() => ({ message: 'Failed to check submission status' }));
        throw new Error(errorData.message || 'API Error');
    }
    return response.json();
};

export const getCounsellingSubmissionStatus = async (studentNumber: string, presCode: string, coverId: string): Promise<any[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/care-ins-answers/check/${studentNumber}/${presCode}/${coverId}/`);
    if (response.status === 404) {
        return [];
    }
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to check counselling submission status' }));
        throw new Error(errorData.message || 'API Error');
    }
    const data = await response.json();
    // The API returns an error object if no submission is found, but a successful response is an array.
    if(data.error) {
        return [];
    }
    return Array.isArray(data) ? data : [];
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
    const now = new Date();
    const srilankanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Colombo' }));

    const year = srilankanTime.getFullYear();
    const month = String(srilankanTime.getMonth() + 1).padStart(2, '0');
    const day = String(srilankanTime.getDate()).padStart(2, '0');
    const hours = String(srilankanTime.getHours()).padStart(2, '0');
    const minutes = String(srilankanTime.getMinutes()).padStart(2, '0');
    const seconds = String(srilankanTime.getSeconds()).padStart(2, '0');

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

export const recoverPatient = async (studentNumber: string, patientId: string): Promise<any> => {
    const payload = {
        student_number: studentNumber,
        patient_id: patientId,
    };
    const response = await fetch(`${QA_API_BASE_URL}/care-center-recoveries/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to recover patient.' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    return response.json();
};

export const getRecoveredCount = async (studentNumber: string): Promise<RecoveryRecord[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/care-center-recoveries/student/${studentNumber}/`);
    if (response.status === 404) {
        return [];
    }
    if (!response.ok) {
        throw new Error('Failed to fetch recovery data');
    }
    return response.json();
};


export const updatePatientStatus = async (startDataId: string): Promise<any> => {
    const response = await fetch(`${QA_API_BASE_URL}/care-starts/${startDataId}/patient-status`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ patient_status: "Recovered" }),
    });
     if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update patient status' }));
        throw new Error(errorData.message || 'API error');
    }
    return response.json();
};


export const getShuffledInstructions = async (presCode: string, coverId: string): Promise<Instruction[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/care-instructions/shuffled/pres-code/${presCode}/cover-id/${coverId}/`);
    if (response.status === 404) {
        return [];
    }
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch shuffled instructions' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
};

export const getCorrectInstructions = async (presCode: string, coverId: string): Promise<Instruction[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/care-instructions/pres-code/${presCode}/cover-id/${coverId}/`);
    if (response.status === 404) {
        return [];
    }
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch correct instructions' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
};

export const getAllCareInstructions = async (): Promise<Instruction[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/updated-care-instructions/`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch all instructions' }));
        throw new Error(errorData.message || 'Failed to fetch all instructions');
    }
    return response.json();
};

export const saveCounsellingAnswer = async (payload: SaveCounselingAnswerPayload): Promise<any> => {
    const response = await fetch(`${QA_API_BASE_URL}/care-ins-answers/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save counselling answer.' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
};

export const getPOSCorrectAmount = async (presCode: string): Promise<POSCorrectAnswer> => {
    const response = await fetch(`${QA_API_BASE_URL}/care-payments/last/${presCode}`);
    if (response.status === 404) {
        throw new Error(`No POS payment information found for prescription code: ${presCode}`);
    }
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch correct POS amount.' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
};

export const submitPOSAnswer = async (payload: POSSubmissionPayload): Promise<any> => {
    const response = await fetch(`${QA_API_BASE_URL}/care-payment-answers/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to submit POS answer.' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
};

export const getPOSSubmissionStatus = async (presCode: string, studentId: string): Promise<POSSubmissionStatus[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/care-payment-answers/correct/${presCode}/${studentId}`);
    if (response.status === 404) {
        return [];
    }
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to check POS submission status' }));
        throw new Error(errorData.message || 'API Error');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
};
    