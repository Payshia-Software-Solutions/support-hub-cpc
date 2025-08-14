
import type { DeliveryOrder, StudentInBatch, CreateDeliveryOrderPayload, DeliverySetting } from '../types';

const QA_API_BASE_URL = process.env.NEXT_PUBLIC_LMS_SERVER_URL || 'https://qa-api.pharmacollege.lk';

export const getDeliveryOrdersForStudent = async (studentNumber: string): Promise<DeliveryOrder[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/delivery_orders?indexNumber=${studentNumber.trim().toUpperCase()}`);
    if (response.status === 404) {
        return []; 
    }
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch delivery orders' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
};

// Batch-based student fetching
export const getStudentsByCourseCode = async (courseCode: string): Promise<StudentInBatch[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/student-courses-new/course-code/${courseCode}/`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch students for batch' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
};

// Create delivery order
export const createDeliveryOrder = async (payload: DeliveryOrderPayload): Promise<any> => {
    const { delivery_title, notes, ...apiPayload } = payload;
    
    const response = await fetch(`${QA_API_BASE_URL}/delivery_orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload)
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create delivery order' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
};

export const createDeliveryOrderForStudent = async (payload: any): Promise<any> => {
    const { studentNumber, courseCode, deliverySetting, notes, address, fullName, phone, currentStatus, trackingNumber } = payload;
    
    const fullPayload: Omit<DeliveryOrderPayload, 'delivery_title' | 'notes'> = {
        delivery_id: deliverySetting.id,
        tracking_number: trackingNumber || 'PENDING',
        index_number: studentNumber,
        order_date: new Date().toISOString(),
        packed_date: null,
        send_date: null,
        removed_date: null,
        current_status: currentStatus,
        delivery_partner: '0',
        value: deliverySetting.value,
        payment_method: '0',
        course_code: courseCode,
        estimate_delivery: null,
        full_name: fullName,
        street_address: address,
        city: '', 
        district: '', 
        phone_1: phone,
        phone_2: '',
        is_active: '1',
        received_date: null,
        cod_amount: deliverySetting.value,
        package_weight: '0.000',
    };

    const response = await fetch(`${QA_API_BASE_URL}/delivery_orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullPayload)
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create delivery order' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
};

export const getDeliverySettingsForCourse = async (courseCode: string): Promise<DeliverySetting[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/delivery-settings/by-course/${courseCode}`);
    if (response.status === 404) {
        return []; 
    }
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch delivery settings' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
}

export const updateDeliveryOrderStatus = async (orderId: string, status: "Received" | "Not Received"): Promise<any> => {
    const response = await fetch(`${QA_API_BASE_URL}/delivery_orders/update-status/${orderId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: orderId,
            OrderStatus: status
        })
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update delivery status' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
}
