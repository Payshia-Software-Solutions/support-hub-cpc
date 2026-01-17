

// This file is intentionally left blank after refactoring.
// All API functions have been moved to the src/lib/actions/ directory.
import type { PaymentRequest, ConvocationRegistration, UpdateCertificateNamePayload, SendSmsPayload } from "./types";

const QA_API_BASE_URL = process.env.NEXT_PUBLIC_LMS_SERVER_URL || 'https://qa-api.pharmacollege.lk';

export const getPaymentRequestsByReference = async (reference: string): Promise<PaymentRequest[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/payment-portal-requests/by-reference/${reference}`);
    if (response.status === 404) {
        return [];
    }
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch payment requests by reference' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
};

export const getConvocationRegistrations = async (): Promise<ConvocationRegistration[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/convocations`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch convocation registrations' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
}

export const updateCertificateName = async (payload: UpdateCertificateNamePayload): Promise<any> => {
    const { student_number } = payload;
    const response = await fetch(`${QA_API_BASE_URL}/userFullDetails/update-certificate-name/${student_number}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Update failed. Status: ${response.status}` }));
        throw new Error(errorData.message || 'Update failed');
    }
    return response.json();
}

export const sendCertificateNameSms = async (payload: SendSmsPayload): Promise<any> => {
    const response = await fetch(`${QA_API_BASE_URL}/send-name-sms`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `SMS sending failed. Status: ${response.status}` }));
        throw new Error(errorData.message || 'SMS sending failed');
    }
    return response.json();
}

export { getCoursesForFilter, getFilteredConvocationRegistrations, getStudentFullInfo, updateConvocationCourses, getUserCertificatePrintStatus } from '@/lib/actions/certificates';
export { getStudentEnrollments, getAllStudents } from '@/lib/actions/users';
