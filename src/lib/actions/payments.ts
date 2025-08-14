
import type { PaymentRequest, CreatePaymentPayload } from '../types';

const PAYMENT_API_BASE_URL = process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'https://api.pharmacollege.lk';
const QA_API_BASE_URL = process.env.NEXT_PUBLIC_LMS_SERVER_URL || 'https://qa-api.pharmacollege.lk';

// Payment Requests
export const getPaymentRequests = async (): Promise<PaymentRequest[]> => {
    const response = await fetch(`${PAYMENT_API_BASE_URL}/payment-portal-requests`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch payment requests' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
};

export const checkDuplicateSlips = async (hashValue: string): Promise<PaymentRequest[]> => {
    if (!hashValue) return [];
    const response = await fetch(`${PAYMENT_API_BASE_URL}/payment-portal-requests/check-hash?hashValue=${hashValue}`);
     if (response.status === 404) {
        return []; 
    }
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to check for duplicate slips' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
};

export const createStudentPayment = async (payload: CreatePaymentPayload): Promise<any> => {
    const response = await fetch(`${QA_API_BASE_URL}/student-payments-new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create student payment record.' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
};

export const updatePaymentRequestStatus = async (request: PaymentRequest, status: 'Approved' | 'Rejected'): Promise<any> => {
    const response = await fetch(`${PAYMENT_API_BASE_URL}/payment-portal-requests/update-status/${request.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: status })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update payment request status.' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
};
