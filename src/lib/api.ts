// This file is being refactored.
// All API functions are being moved to the src/lib/actions/ directory.
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

// Re-exporting functions from their new locations for compatibility until all components are updated.
export { getCoursesForFilter, getFilteredConvocationRegistrations, getStudentFullInfo, updateConvocationCourses, getUserCertificatePrintStatus } from '@/lib/actions/certificates';
export { getStudentEnrollments, getAllStudents } from '@/lib/actions/users';
