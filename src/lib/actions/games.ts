
"use client";

import type { GamePatient, PrescriptionDetail, DispensingAnswer, FormSelectionData, TreatmentStartRecord, ValidateAnswerPayload, ValidateAnswerResponse, Instruction, SaveCounselingAnswerPayload, DispensingSubmissionStatus, MasterProduct, POSCorrectAnswer, POSSubmissionPayload, POSSubmissionStatus, RecoveryRecord, PrescriptionSubmissionPayload } from '../types';

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

export const createMasterProduct = async (data: { name: string; price: string }): Promise<{ message: string, id: string }> => {
    const numericPrice = parseFloat(data.price);
    if (isNaN(numericPrice)) {
        throw new Error("Invalid price provided.");
    }
    
    const payload = {
        product_code: `P${Date.now()}`,
        ProductName: data.name,
        DisplayName: data.name,
        PrintName: data.name,
        SectionID: 1,
        DepartmentID: 10,
        CategoryID: 10,
        BrandId: 1,
        UOMeasurement: "1",
        ReOderLevel: 0,
        LeadDays: 0,
        CostPrice: numericPrice,
        SellingPrice: numericPrice,
        MinimumPrice: numericPrice,
        WholesalePrice: numericPrice,
        ItemType: "Raw",
        ItemLocation: "4",
        ImagePath: "no-image.png",
        CreatedBy: "Admin",
        CreatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        active_status: "1",
        GenericID: 0,
    };

    const response = await fetch(`${QA_API_BASE_URL}/master-products/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create product' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
};


export const updateMasterProduct = async ({ productId, name, price }: { productId: string, name: string, price: string }): Promise<{ message: string }> => {
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

export const deleteMasterProduct = async (productId: string): Promise<void> => {
    const response = await fetch(`${QA_API_BASE_URL}/master-products/${productId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete product' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
};


export const getCeylonPharmacyPrescriptions = async (studentId: string, courseCode: string): Promise<GamePatient[]> => {
    // If the admin user is passed, fetch all patients from the dedicated admin endpoint.
    if (studentId === 'admin-user') {
        const response = await fetch(`${QA_API_BASE_URL}/care-patients`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to fetch all game patients' }));
            throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }
        return response.json();
    }

    // Otherwise, fetch per student for the student dashboard.
    const response = await fetch(`${QA_API_BASE_URL}/care-center-courses/student/${studentId}/course/${courseCode}`);
    if (response.status === 404) {
        return []; // No patients found for this course, return empty array
    }
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch game prescriptions' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    const data = await response.json();
    
    if (typeof data === 'object' && data !== null && !data.error) {
        return Object.values(data).map((item: any) => ({
            ...item.patient,
            start_data: item.start_data 
        }));
    }
    
    return [];
};

export const getPatient = async (studentId: string, courseCode: string, patientId: string): Promise<GamePatient> => {
    const response = await fetch(`${QA_API_BASE_URL}/care-center-courses/student/${studentId}/course/${courseCode}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch game prescriptions' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    const data = await response.json();
    
    const patientDataEntry = Object.values(data).find((item: any) => item.patient?.prescription_id === patientId);

    if (!patientDataEntry || !(patientDataEntry as any).patient) {
        throw new Error("Patient not found in the response for the specified course and ID.");
    }
    
    const patientData = {
        ...(patientDataEntry as any).patient,
        start_data: (patientDataEntry as any).start_data,
    };
    
    return patientData;
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
    const data: Omit<PrescriptionDetail, 'pres_code'>[] = await response.json();
    // Manually add the pres_code to each item as the API doesn't include it in the array items
    return data.map(item => ({ ...item, pres_code: prescriptionId }));
}

export const getDispensingAnswers = async (prescriptionId: string, coverId: string): Promise<DispensingAnswer | null> => {
    if (!prescriptionId || !coverId) {
        throw new Error("Prescription ID and Cover ID are required.");
    }
    const response = await fetch(`${QA_API_BASE_URL}/care-answers/pres-id/${prescriptionId}/cover-id/${coverId}/`);
    
    if (response.status === 404) {
        const errorData = await response.json().catch(() => null);
        if (errorData?.error === "Answer not found") {
            return null; // This is a valid case where answers haven't been submitted yet.
        }
    }
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch dispensing answers' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    const data = await response.json();
    // The API returns an array with a single object
    if (Array.isArray(data) && data.length > 0) {
        return data[0];
    }
    if (Array.isArray(data) && data.length === 0) {
        return null; // Treat empty array as not found
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


export const updatePatientStatus = async (studentNumber: string, presCode: string): Promise<any> => {
    const response = await fetch(`${QA_API_BASE_URL}/care-starts/student/${studentNumber}/patient/${presCode}/patient-status/`, {
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


export const getAllCareInstructions = async (): Promise<Instruction[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/care-instructions-pre`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch all instructions' }));
        throw new Error(errorData.message || 'Failed to fetch all instructions');
    }
    return response.json();
};

export const createCareInstruction = async (payload: { instruction: string; created_by: string; }): Promise<Instruction> => {
    const fullPayload = {
        ...payload,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };
    
    const response = await fetch(`${QA_API_BASE_URL}/care-instructions-pre/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullPayload),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create instruction' }));
        throw new Error(errorData.message || 'API Error');
    }
    return response.json();
};

export const updateCareInstruction = async (payload: { id: string; instruction: string; created_by: string; }): Promise<Instruction> => {
    const response = await fetch(`${QA_API_BASE_URL}/care-instructions-pre/${payload.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            instruction: payload.instruction,
            created_by: payload.created_by, // Send created_by as it might be needed for validation
        }),
    });
     if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update instruction' }));
        throw new Error(errorData.message || 'API Error');
    }
    return response.json();
};

export const deleteCareInstruction = async (id: string): Promise<void> => {
    const response = await fetch(`${QA_API_BASE_URL}/care-instructions-pre/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
         const errorData = await response.json().catch(() => ({ message: 'Failed to delete instruction' }));
        throw new Error(errorData.message || 'API Error');
    }
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


export const saveCounsellingInstructionsForDrug = async (payload: { pres_code: string; cover_id: string; instructions: number[] }): Promise<Instruction[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/care-instructions/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save counselling instructions.' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
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

export const getPOSCorrectAmount = async (presCode: string): Promise<POSCorrectAnswer | null> => {
    const response = await fetch(`${QA_API_BASE_URL}/care-payments/last/${presCode}`);
    if (response.status === 404) {
        return null;
    }
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch correct POS amount.' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
};

export const saveCorrectBillValue = async (payload: { PresCode: string, value: string }): Promise<any> => {
    const response = await fetch(`${QA_API_BASE_URL}/care-payments/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...payload,
            created_at: new Date().toISOString(),
        }),
    });
     if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save bill value.' }));
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

export const savePrescriptionContent = async (payload: { pres_code: string; cover_id: string; content: string }): Promise<any> => {
    const response = await fetch(`${QA_API_BASE_URL}/care-content/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save prescription content.' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
};

export const saveOrUpdateDispensingAnswer = async (payload: Omit<DispensingAnswer, 'id' | 'created_at'> & { answer_id?: string }): Promise<any> => {
    const endpoint = `${QA_API_BASE_URL}/care-answers/`;
    const method = 'POST';

    const response = await fetch(endpoint, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to save or update dispensing answer.` }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    return response.json();
};


export const savePrescription = async (prescriptionPayload: PrescriptionSubmissionPayload, drugs: any[], prescriptionId?: string): Promise<any> => {
    
    let presCode = prescriptionId;
    let method = prescriptionId ? 'PUT' : 'POST';
    let endpoint = prescriptionId ? `${QA_API_BASE_URL}/care-patients/${prescriptionId}` : `${QA_API_BASE_URL}/care-patients`;
    
    const presResponse = await fetch(endpoint, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(prescriptionPayload),
    });

    if (!presResponse.ok) {
        const errorData = await presResponse.json().catch(() => ({ message: 'Failed to save prescription.' }));
        throw new Error(errorData.message || `Request failed with status ${presResponse.status}`);
    }
    
    const presData = await presResponse.json();
    if (!presCode) {
        presCode = presData?.prescription?.prescription_id;
        if (!presCode) {
            throw new Error("Failed to get new prescription ID from the response.");
        }
    }

    if (drugs && drugs.length > 0) {
      const drugPromises = drugs.map(drug => {
          // Step 2: Save Content
          const contentPayload = {
              pres_code: presCode!,
              cover_id: drug.coverId,
              content: drug.content
          };
          const contentPromise = savePrescriptionContent(contentPayload);

          // Step 3: Save Answers
          const answerPayload = {
              pres_id: presCode!,
              cover_id: drug.coverId,
              name: prescriptionPayload.Pres_Name,
              drug_name: drug.correctDrugName,
              drug_type: drug.dosageForm,
              drug_qty: String(drug.quantity),
              morning_qty: drug.morningQty,
              afternoon_qty: drug.afternoonQty,
              evening_qty: drug.eveningQty,
              night_qty: drug.nightQty,
              meal_type: drug.mealType,
              using_type: drug.usingFrequency,
              at_a_time: drug.at_a_time,
              hour_qty: drug.hour_qty,
              additional_description: drug.additionalInstruction,
              created_by: prescriptionPayload.created_by
          };
          const answerPromise = saveOrUpdateDispensingAnswer(answerPayload);
          
          return Promise.all([contentPromise, answerPromise]);
      });

      const results = await Promise.allSettled(drugPromises);
      
      const failedSaves = results.filter(r => r.status === 'rejected');
      if (failedSaves.length > 0) {
          console.error('Some drug contents or answers failed to save:', failedSaves);
          throw new Error(`${failedSaves.length} drug(s) failed to save properly.`);
      }
    }


    return presData;
};

export const updatePrescriptionContent = async (payload: { pres_code: string; cover_id: string; content: string }): Promise<PrescriptionDetail> => {
    const response = await fetch(`${QA_API_BASE_URL}/care-content/${payload.pres_code}/${payload.cover_id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: payload.content }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update prescription content.' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    return response.json();
};

    

    











