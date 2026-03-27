import type { UpdateCertificateNamePayload, ConvocationRegistration, CertificateOrder, SendSmsPayload, ConvocationCourse, FilteredConvocationRegistration, UpdateConvocationCoursesPayload, UserCertificatePrintStatus, UpdateCertificateOrderCoursesPayload, GenerateCertificatePayload, CreateCertificateOrderPayload, ConvocationCeremony, ConvocationPackage, ParentCourse, SessionCount, TcPaymentRecord, GeneratedCertificateBatchInfo } from '../types';

const QA_API_BASE_URL = process.env.NEXT_PUBLIC_LMS_SERVER_URL || 'https://qa-api.pharmacollege.lk';


// Helper type for form values passed from the component
type CeremonyFormData = {
    convocation_name: string;
    held_on: string;
    session_count: number;
    parent_seats: number;
    student_seats: number;
    session_2: number;
    accept_booking: boolean;
    created_by: string;
};


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

// Convocation Registrations
export const getConvocationRegistrations = async (ceremonyId?: string): Promise<ConvocationRegistration[]> => {
    const endpoint = ceremonyId 
        ? `${QA_API_BASE_URL}/convocation-registrations/convocation/${ceremonyId}`
        : `${QA_API_BASE_URL}/convocation-registrations`;

    const response = await fetch(endpoint);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch convocation registrations' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
}

export const getConvocationRegistrationsByStudent = async (studentNumber: string): Promise<ConvocationRegistration[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/convocation-registrations/get-records-student-number/${studentNumber}`);
    if (response.status === 404) {
        return []; // No bookings found is a valid state
    }
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to fetch bookings for student ${studentNumber}` }));
        throw new Error(errorData.message || 'Request failed');
    }
    const data = await response.json();
    // The API might return a single object or an array of objects.
    if (!data) return [];
    return Array.isArray(data) ? data : [data];
}


export const createConvocationRegistration = async (payload: FormData): Promise<any> => {
    const response = await fetch(`${QA_API_BASE_URL}/convocation-registrations`, {
        method: 'POST',
        body: payload,
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Convocation registration failed. Status: ${response.status}` }));
        throw new Error(errorData.error || errorData.message || 'Convocation registration failed');
    }
    return response.json();
};

export const updateConvocationBooking = async (id: string, payload: any): Promise<any> => {
    const response = await fetch(`${QA_API_BASE_URL}/convocation-registrations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update booking' }));
        throw new Error(errorData.message || 'Failed to update booking');
    }
    return response.json();
};

export const updateConvocationPayment = async (registrationId: string, payload: { payment_status: string; payment_amount: number; created_by: string }): Promise<any> => {
    const response = await fetch(`${QA_API_BASE_URL}/convocation-registrations/payment/${registrationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update payment' }));
        throw new Error(errorData.message || 'Failed to update payment');
    }
    return response.json();
};

export const updateConvocationPackage = async (registrationId: string, packageId: string): Promise<any> => {
    const params = new URLSearchParams();
    params.append('package_id', packageId);

    const response = await fetch(`${QA_API_BASE_URL}/convocation-registrations/${registrationId}/update-package/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update package' }));
        throw new Error(errorData.message || 'Failed to update package');
    }
    return response.json();
};

export const updateCeremonyNumber = async (registrationId: string, ceremonyNumber: string): Promise<any> => {
    const response = await fetch(`${QA_API_BASE_URL}/convocation-registrations/ceremony-number/${registrationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ceremony_number: ceremonyNumber })
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update ceremony number' }));
        throw new Error(errorData.message || 'Failed to update ceremony number');
    }
    return response.json();
};


// Convocation Ceremonies
export const getConvocationCeremonies = async (): Promise<ConvocationCeremony[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/convocations`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch convocation ceremonies' }));
        throw new Error(errorData.message || 'Request failed');
    }
    return response.json();
};

export const getCeremonyById = async (id: string): Promise<ConvocationCeremony> => {
    const response = await fetch(`${QA_API_BASE_URL}/convocations/${id}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to fetch ceremony with id ${id}`}));
        throw new Error(errorData.message || 'Failed to fetch ceremony details');
    }
    return response.json();
};


export const createConvocationCeremony = async (data: CeremonyFormData): Promise<ConvocationCeremony> => {
    const payload = {
        convocation_name: data.convocation_name,
        held_on: `${data.held_on} 00:00:00`,
        session_count: String(data.session_count),
        parent_seats: String(data.parent_seats),
        student_seats: String(data.student_seats),
        session_2: String(data.session_2),
        created_by: data.created_by,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        accept_booking: data.accept_booking ? '1' : '0',
    };
    
    const response = await fetch(`${QA_API_BASE_URL}/convocations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create ceremony' }));
        throw new Error(errorData.message || 'Request failed');
    }
    return response.json();
};

export const updateConvocationCeremony = async (id: string, data: CeremonyFormData): Promise<ConvocationCeremony> => {
     const payload = {
        convocation_name: data.convocation_name,
        held_on: `${data.held_on} 00:00:00`,
        session_count: String(data.session_count),
        parent_seats: String(data.parent_seats),
        student_seats: String(data.student_seats),
        session_2: String(data.session_2),
        created_by: data.created_by,
        accept_booking: data.accept_booking ? '1' : '0',
    };
    
    const response = await fetch(`${QA_API_BASE_URL}/convocations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update ceremony' }));
        throw new Error(errorData.message || 'Request failed');
    }
    return response.json();
};

export const deleteConvocationCeremony = async (id: string): Promise<void> => {
    const response = await fetch(`${QA_API_BASE_URL}/convocations/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete ceremony' }));
        throw new Error(errorData.message || 'Request failed');
    }
};

export const getConvocationSessionCounts = async (ceremonyId: string): Promise<SessionCount[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/convocation-registrations/get-counts-by-sessions/${ceremonyId}`);
    if (response.status === 404) {
        return [];
    }
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to fetch session counts for ceremony ${ceremonyId}` }));
        throw new Error(errorData.message || 'Request failed');
    }
    return response.json();
};

// Convocation Packages
export const getPackagesByCeremony = async (ceremonyId: string): Promise<ConvocationPackage[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/packages`);
    if (response.status === 404) return [];
    if (!response.ok) throw new Error('Failed to fetch packages');
    const allPackages: ConvocationPackage[] = await response.json();
    if (!ceremonyId) {
        return allPackages;
    }
    return allPackages.filter(pkg => pkg.convocation_id === ceremonyId);
};

export const createPackage = async (data: FormData): Promise<ConvocationPackage> => {
    const response = await fetch(`${QA_API_BASE_URL}/packages`, {
        method: 'POST',
        body: data,
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to create package' }));
        throw new Error(error.message);
    }
    return response.json();
};

export const updatePackage = async (packageId: string, data: FormData): Promise<ConvocationPackage> => {
    // Note: API seems to use POST for updates with FormData
    const response = await fetch(`${QA_API_BASE_URL}/packages/${packageId}`, {
        method: 'POST',
        body: data,
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to update package' }));
        throw new Error(error.message);
    }
    return response.json();
};

export const deletePackage = async (packageId: string): Promise<void> => {
    const response = await fetch(`${QA_API_BASE_URL}/packages/${packageId}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to delete package' }));
        throw new Error(error.message);
    }
};


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
    return response.json();
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

export const generateAllCertificatesForBooking = async (bookingId: string): Promise<any> => {
    const response = await fetch(`${QA_API_BASE_URL}/booking-updates/generate-certificate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ booking_id: bookingId })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Bulk generation failed' }));
        throw new Error(errorData.message || 'Bulk generation failed');
    }
    return response.json();
};

export const getTcPayments = async (studentNumber: string): Promise<TcPaymentRecord[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/tc-payments?student_number=${studentNumber}`);
    if (response.status === 404) return [];
    if (!response.ok) throw new Error('Failed to fetch payment records');
    return response.json();
};

export const submitSecondPayment = async (payload: FormData): Promise<any> => {
    const response = await fetch(`${QA_API_BASE_URL}/payment-portal-requests`, {
        method: 'POST',
        body: payload,
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Payment submission failed. Status: ${response.status}` }));
        throw new Error(errorData.message || 'Payment submission failed');
    }
    return response.json();
};

export const deleteConvocationPayment = async (registrationId: string, paymentId: string): Promise<void> => {
    const response = await fetch(`${QA_API_BASE_URL}/convocation-registrations/${registrationId}/payment/${paymentId}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete payment record' }));
        throw new Error(errorData.message || 'Failed to delete payment record');
    }
};

export const getGeneratedCertificatesByBatch = async (courseCode: string): Promise<GeneratedCertificateBatchInfo[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/certificate-print-status/course/${courseCode}`);
    if (response.status === 404) return [];
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch generated certificates' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
};
export const uploadConvocationStudentCsv = async (convocationId: string, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('convocation_id', convocationId);
    formData.append('file', file);

    const response = await fetch(`${QA_API_BASE_URL}/convocation-student-info/upload-csv/`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to upload CSV' }));
        throw new Error(errorData.message || 'Failed to upload CSV');
    }
    return response.json();
};

export const getConvocationStudentCeremonyNumber = async (studentNumber: string, convocationId: string): Promise<string | null> => {
    try {
        const response = await fetch(`${QA_API_BASE_URL}/convocation-student-info/student/${studentNumber}/convocation/${convocationId}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.ceremony_number || null;
    } catch {
        return null;
    }
};
