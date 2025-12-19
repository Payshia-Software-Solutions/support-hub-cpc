

// This file is intentionally left blank after refactoring.
// All API functions have been moved to the src/lib/actions/ directory.
import type { PaymentRequest } from "./types";

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
