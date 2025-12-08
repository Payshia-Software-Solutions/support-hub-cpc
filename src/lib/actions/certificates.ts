

import type { UpdateCertificateNamePayload, ConvocationRegistration, CertificateOrder, SendSmsPayload, ConvocationCourse, FilteredConvocationRegistration, UpdateConvocationCoursesPayload, UserCertificatePrintStatus, UpdateCertificateOrderCoursesPayload, GenerateCertificatePayload, CreateCertificateOrderPayload } from '../types';

const QA_API_BASE_URL = process.env.NEXT_PUBLIC_LMS_SERVER_URL || 'https://qa-api.pharmacollege.lk';


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

// Convocation
export const getConvocationRegistrations = async (): Promise<ConvocationRegistration[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/convocation-registrations`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch convocation registrations' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
}

// Certificate Orders
export const getCertificateOrders = async (): Promise<CertificateOrder[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/certificate-orders`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch certificate orders' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
};

export const getCertificateOrdersByStudent = async (studentNumber: string): Promise<CertificateOrder[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/certificate-orders/student/${studentNumber}`);
    if (response.status === 404) {
        return []; // No orders found is not an error
    }
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to fetch certificate orders for ${studentNumber}` }));
        throw new Error(errorData.message || `Request failed`);
    }
    return response.json();
}

export const createCertificateOrder = async (payload: FormData): Promise<{ reference_number: string; id: string; }> => {
    const response = await fetch(`${QA_API_BASE_URL}/certificate-orders/`, {
        method: 'POST',
        body: payload,
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Certificate order creation failed. Status: ${response.status}` }));
        throw new Error(errorData.error || errorData.message || 'Certificate order creation failed');
    }
    const responseText = await response.text();
    try {
        return JSON.parse(responseText);
    } catch (e) {
        throw new Error(`Failed to parse server response: ${responseText}`);
    }
};

export const deleteCertificateOrder = async (orderId: string): Promise<void> => {
    const response = await fetch(`${QA_API_BASE_URL}/certificate-orders/${orderId}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to delete order. Status: ${response.status}` }));
        throw new Error(errorData.message || 'Failed to delete certificate order');
    }
};

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

// Filtered Convocation Data
export const getCoursesForFilter = async (): Promise<ConvocationCourse[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/parent-main-course`);
    if (!response.ok) {
        throw new Error('Failed to fetch courses');
    }
    return response.json();
};

export const getFilteredConvocationRegistrations = async (courseCode: string, session: string): Promise<FilteredConvocationRegistration[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/convocation-registrations-certificate?courseCode=${courseCode}&viewSession=${session}`);
    if (!response.ok) {
        throw new Error('Failed to fetch filtered convocation registrations');
    }
    return response.json();
};

export const updateConvocationCourses = async (payload: UpdateConvocationCoursesPayload): Promise<{ status: string; message: string; registration_id: string; }> => {
    const { registrationId, courseIds } = payload;
    const response = await fetch(`${QA_API_BASE_URL}/convocation-registrations/update-courses/${registrationId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ course_id: courseIds })
    });

    if (!response.ok) {
       const errorData = await response.json().catch(() => ({ error: `Failed to update courses. Status: ${response.status}` }));
       throw new Error(errorData.error || 'Failed to update courses');
    }
    return response.json();
};

export const updateCertificateOrderCourses = async (payload: UpdateCertificateOrderCoursesPayload): Promise<{ status: string; message: string; id: string; }> => {
    const { orderId, courseCodes } = payload;
    const response = await fetch(`${QA_API_BASE_URL}/certificate-orders/update-courses/${orderId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ course_code: courseCodes })
    });

    if (!response.ok) {
       const errorData = await response.json().catch(() => ({ error: `Failed to update courses for order. Status: ${response.status}` }));
       throw new Error(errorData.error || 'Failed to update courses for order');
    }
    return response.json();
};

// User Certificate Print Status
export const getUserCertificatePrintStatus = async (studentNumber: string, courseCode?: string): Promise<{ certificateStatus: UserCertificatePrintStatus[] }> => {
    let url = `${QA_API_BASE_URL}/user_certificate_print_status?studentNumber=${studentNumber}`;
    if (courseCode) {
        url += `&courseCode=${courseCode}`;
    }
    const response = await fetch(url);
    
    if (response.status === 404) {
        return { certificateStatus: [] };
    }
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Failed to fetch certificate status. Status: ${response.status}` }));
        throw new Error(errorData.error || 'Failed to fetch certificate status');
    }
    
    const data = await response.json();
    return Array.isArray(data) ? { certificateStatus: data } : data;
};

export const getCertificatePrintStatusById = async (certificateId: string): Promise<UserCertificatePrintStatus | null> => {
    const response = await fetch(`${QA_API_BASE_URL}/certificate-print-status/by-certificate_id/${certificateId}`);
    if (response.status === 404) {
        return null;
    }
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to fetch certificate status for ID ${certificateId}` }));
        throw new Error(errorData.message || 'Failed to fetch certificate status');
    }
    return response.json();
};


export const generateCertificate = async (payload: GenerateCertificatePayload): Promise<any> => {
    const response = await fetch(`${QA_API_BASE_URL}/certificate-print-status`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Certificate generation failed. Status: ${response.status}` }));
        throw new Error(errorData.message || 'Certificate generation failed');
    }
    return response.json();
};
