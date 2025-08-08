

import type { Ticket, Chat, Message, Attachment, CreateTicketMessageClientPayload, CreateTicketPayload, UpdateTicketPayload, CreateChatMessageClientPayload, TicketStatus, StudentSearchResult, UserFullDetails, UpdateCertificateNamePayload, ConvocationRegistration, CertificateOrder, SendSmsPayload, ConvocationCourse, FilteredConvocationRegistration, FullStudentData, UpdateConvocationCoursesPayload, UserCertificatePrintStatus, UpdateCertificateOrderCoursesPayload, GenerateCertificatePayload, DeliveryOrder, StudentInBatch, CreateDeliveryOrderPayload, Course, ApiCourseResponse, DeliverySetting, PaymentRequest, StudentEnrollmentInfo, CreatePaymentPayload, TempUser, StudentBalanceData, CreateCertificateOrderPayload, ApiStaffMember, StaffMember, Announcement, BnfChapter, BnfPage, BnfWordIndexEntry, ParentCourse, ApiCourse, Batch } from './types';

// In a real app, you would move this to a .env file
const API_BASE_URL = (process.env.NEXT_PUBLIC_CHAT_SERVER_URL || 'https://chat-server.pharmacollege.lk') + '/api';
const QA_API_BASE_URL = process.env.NEXT_PUBLIC_LMS_SERVER_URL || 'https://qa-api.pharmacollege.lk';
const PAYMENT_API_BASE_URL = process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'https://api.pharmacollege.lk';
const CONTENT_PROVIDER_URL = 'https://content-provider.pharmacollege.lk';


async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const headers: HeadersInit = options.headers || {};
    
    // Do not set Content-Type for FormData, the browser does it
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'omit',
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: response.statusText };
      }
      throw new Error(errorData.message ? `${errorData.message} (Status: ${response.status})` : `Request failed with status ${response.status}`);
    }

    if (response.status === 204) {
      return null as T;
    }
    
    return response.json();
  } catch (error) {
    if (error instanceof Error) {
        throw new Error(error.message || 'An unknown network error occurred.');
    }
    throw new Error('An unknown error occurred.');
  }
}

interface ApiMessage {
  id: string;
  ticket_id?: string; 
  from_role: 'student' | 'staff'; 
  text: string;
  time: string;
  avatar?: string;
  attachments?: Attachment[];
  img_url?: string;
  read_status?: 'Read' | 'Unread';
}

function mapApiMessageToMessage(apiMsg: ApiMessage): Message {
    let attachments: Attachment[] = [];

    // Handle new `img_url` field
    if (apiMsg.img_url) {
        attachments.push({
            type: 'image',
            url: `${CONTENT_PROVIDER_URL}${apiMsg.img_url}`,
            name: apiMsg.img_url.split('/').pop() || 'image.jpg',
        });
    }

    // Handle new, array-based attachments format (if it ever co-exists)
    if (Array.isArray(apiMsg.attachments)) {
        attachments = [...attachments, ...apiMsg.attachments];
    }

    return {
        id: String(apiMsg.id),
        from: apiMsg.from_role,
        text: apiMsg.text,
        time: apiMsg.time,
        avatar: apiMsg.avatar,
        attachments: attachments,
        readStatus: apiMsg.read_status,
    };
}

interface ApiChat {
    id: string;
    user_name: string;
    user_avatar: string;
    student_number?: string;
    last_message_preview?: string;
    last_message_time?: string;
    unread_count?: number | string;
}

function mapApiChatToChat(apiChat: ApiChat): Chat {
    return {
        id: apiChat.id,
        userName: apiChat.user_name,
        userAvatar: apiChat.user_avatar,
        studentNumber: apiChat.student_number,
        lastMessagePreview: apiChat.last_message_preview,
        lastMessageTime: apiChat.last_message_time,
        unreadCount: typeof apiChat.unread_count === 'string' 
            ? parseInt(apiChat.unread_count, 10) 
            : apiChat.unread_count,
    };
}

function mapApiTicketToTicket(apiTicket: any): Ticket {
    let attachments: Attachment[] = [];
    if (typeof apiTicket.attachments === 'string' && apiTicket.attachments) {
        const attachmentUrls = apiTicket.attachments.split(',');
        attachments = attachmentUrls.map((url: string) => {
            const trimmedUrl = url.trim();
            if (!trimmedUrl) return null;
            return {
                type: 'image',
                url: `${CONTENT_PROVIDER_URL}${trimmedUrl}`,
                name: trimmedUrl.split('/').pop() || 'attachment.jpg'
            };
        }).filter(Boolean) as Attachment[];
    } else if (Array.isArray(apiTicket.attachments)) {
        attachments = apiTicket.attachments;
    }

    return {
        id: apiTicket.id,
        subject: apiTicket.subject,
        description: apiTicket.description,
        priority: apiTicket.priority,
        category: apiTicket.category || 'Other',
        status: apiTicket.status,
        createdAt: apiTicket.created_at,
        updatedAt: apiTicket.updated_at,
        studentNumber: apiTicket.student_name, 
        studentName: apiTicket.student_name, 
        studentAvatar: apiTicket.student_avatar,
        assignedTo: apiTicket.assigned_to,
        assigneeAvatar: apiTicket.assignee_avatar,
        isLocked: apiTicket.is_locked == 1,
        lockedByStaffId: apiTicket.locked_by_staff_id,
        attachments: attachments,
        lastMessagePreview: apiTicket.last_message_preview,
    };
}

function mapTicketToApiPayload(ticketData: Partial<Ticket>): any {
    const apiPayload: { [key: string]: any } = {};
    if (ticketData.subject !== undefined) apiPayload.subject = ticketData.subject;
    if (ticketData.description !== undefined) apiPayload.description = ticketData.description;
    if (ticketData.priority !== undefined) apiPayload.priority = ticketData.priority;
    if (ticketData.category !== undefined) apiPayload.category = ticketData.category;
    if (ticketData.status !== undefined) apiPayload.status = ticketData.status;
    if (ticketData.studentNumber !== undefined) apiPayload.student_number = ticketData.studentNumber;
    if (ticketData.studentName !== undefined) apiPayload.student_name = ticketData.studentName;
    if (ticketData.studentAvatar !== undefined) apiPayload.student_avatar = ticketData.studentAvatar;
    if (ticketData.assignedTo !== undefined) apiPayload.assigned_to = ticketData.assignedTo;
    if (ticketData.assigneeAvatar !== undefined) apiPayload.assignee_avatar = ticketData.assigneeAvatar;
    if (ticketData.isLocked !== undefined) apiPayload.is_locked = ticketData.isLocked ? 1 : 0;
    if (ticketData.lockedByStaffId !== undefined) apiPayload.locked_by_staff_id = ticketData.lockedByStaffId;
    
    // The backend should expect a JSON stringified array of attachment metadata
    if (ticketData.attachments && ticketData.attachments.length > 0) {
      apiPayload.attachments = JSON.stringify(ticketData.attachments.map(att => ({
        type: att.type,
        name: att.name,
        // The URL is for client-side preview, the data URI is sent for upload
        url: att.url,
      })));
    }

    return apiPayload;
}


// Tickets
export const getTickets = async (studentNumber: string): Promise<Ticket[]> => {
    const endpoint = `/tickets/username/${studentNumber}`;
    const apiResult = await apiFetch<any>(endpoint);
    if (!apiResult) return [];

    const apiTickets = Array.isArray(apiResult) ? apiResult : [apiResult];
    
    return apiTickets.map(mapApiTicketToTicket);
};
export const getAdminTickets = async (): Promise<Ticket[]> => {
    const endpoint = `/tickets`;
    const apiTickets = await apiFetch<any[]>(endpoint);
    if (!apiTickets) return [];
    return apiTickets.map(mapApiTicketToTicket);
}
export const getTicket = async (id: string): Promise<Ticket> => {
    const apiTicket = await apiFetch<any>(`/tickets/${id}`);
    return mapApiTicketToTicket(apiTicket);
};
export const getTicketMessages = async (ticketId: string): Promise<Message[]> => {
    const apiMessages = await apiFetch<ApiMessage[]>(`/ticket-messages/by-ticket/${ticketId}`);
    if (!apiMessages) return [];
    return apiMessages.map(mapApiMessageToMessage);
};

export const createTicket = async (ticketFormData: FormData): Promise<Ticket> => {
    const response = await apiFetch<{ message: string, ticket: any }>('/tickets', {
        method: 'POST',
        body: ticketFormData
    });
    return mapApiTicketToTicket(response.ticket);
};

export const updateTicket = async (ticketData: UpdateTicketPayload): Promise<Ticket> => {
    const apiPayload = mapTicketToApiPayload(ticketData);
    const updatedApiTicket = await apiFetch<any>(`/tickets/${ticketData.id}`, { method: 'POST', body: JSON.stringify(apiPayload) });
    return mapApiTicketToTicket(updatedApiTicket);
};
export const assignTicket = async (ticketId: string, assignedTo: string, assigneeAvatar: string, lockedByStaffId: string): Promise<Ticket> => {
  const apiPayload = {
    assigned_to: assignedTo,
    assignee_avatar: assigneeAvatar,
    is_locked: 1, 
    locked_by_staff_id: lockedByStaffId,
  };
  const updatedApiTicket = await apiFetch<any>(`/tickets/${ticketId}/assign`, {
    method: 'POST',
    body: JSON.stringify(apiPayload),
  });
  return mapApiTicketToTicket(updatedApiTicket);
};


export const updateTicketStatus = async (ticketId: string, newStatus: TicketStatus): Promise<Ticket> => {
    const response = await apiFetch<{ message: string; ticket: any }>(`/tickets/${ticketId}/status/`, {
        method: 'POST',
        body: JSON.stringify({ newStatus: newStatus }),
    });
    return mapApiTicketToTicket(response.ticket);
}

export const markTicketMessagesAsRead = async (messageIds: string[]): Promise<any> => {
    if (messageIds.length === 0) {
        return Promise.resolve({ success: true, message: 'No messages to mark as read.' });
    }
    const promises = messageIds.map(id => 
        apiFetch(`/ticket-messages/update-read-status/${id}/`, { 
            method: 'PUT',
            body: JSON.stringify({ read_status: "Read" }) // Send body with new status
        })
    );
    return Promise.all(promises);
};

export const getUnreadMessageCount = async (ticketId: string, fromRole: 'student' | 'staff'): Promise<number> => {
    const payload = {
        read_status: 'Unread',
        from_role: fromRole,
    };
    const response = await apiFetch<ApiMessage[]>(`/ticket-messages/get-unread-messages/${ticketId}`, {
        method: 'POST', // Assuming POST based on PHP code analysis
        body: JSON.stringify(payload),
    });
    return response.length;
};


export const createTicketMessage = async (messageData: CreateTicketMessageClientPayload, ticketId: string): Promise<Message> => {
  const formData = new FormData();
  formData.append('ticket_id', ticketId);
  formData.append('from_role', messageData.from);
  formData.append('text', messageData.text);
  formData.append('time', new Date().toISOString());
  formData.append('created_by', messageData.createdBy);

  if (messageData.attachments && messageData.attachments.length > 0) {
    const attachmentMetadata = messageData.attachments.map(att => ({
        type: att.type,
        name: att.name,
    }));
    formData.append('attachments_meta', JSON.stringify(attachmentMetadata));

    messageData.attachments.forEach(att => {
        if (att.file) {
            formData.append('attachments[]', att.file, att.name);
        }
    });
  }

  const newApiMessage = await apiFetch<ApiMessage>(`/ticket-messages`, { 
    method: 'POST', 
    body: formData 
  });
  
  return mapApiMessageToMessage(newApiMessage);
};


// Chats (for student)
export const getChats = async (studentNumber: string): Promise<Chat[]> => {
    const endpoint = `/chats/username/${studentNumber}`;
    try {
        const apiResult = await apiFetch<ApiChat[] | ApiChat>(endpoint);
        if (!apiResult) {
            return [];
        }
        const apiChats = Array.isArray(apiResult) ? apiResult : [apiResult];
        
        const studentChat = apiChats.filter(chat => chat.student_number === studentNumber || chat.user_name === studentNumber);
        return studentChat.map(mapApiChatToChat);

    } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
            return [];
        }
        throw error;
    }
};

// Admin Chats
export const getAdminChats = async (): Promise<Chat[]> => {
    const endpoint = '/chats';
    const apiChats = await apiFetch<ApiChat[]>(endpoint);
    if (!apiChats) return [];
    return apiChats.map(mapApiChatToChat);
};

export const getChat = async (id: string): Promise<Chat> => {
    const apiChat = await apiFetch<ApiChat>(`/chats/${id}`);
    return mapApiChatToChat(apiChat);
};

export const createChat = async (studentInfo: { studentNumber: string, studentAvatar: string }): Promise<Chat> => {
    const apiPayload = {
        student_number: studentInfo.studentNumber,
        user_name: studentInfo.studentNumber,
        user_avatar: studentInfo.studentAvatar
    };
    const apiChat = await apiFetch<ApiChat>('/chats', { 
        method: 'POST',
        body: JSON.stringify(apiPayload),
    });
    return mapApiChatToChat(apiChat);
};

export const getChatMessages = async (chatId: string): Promise<Message[]> => {
    const apiMessages = await apiFetch<ApiMessage[]>(`/chat-messages/by-chat/${chatId}`);
    if (!apiMessages) return [];
    return apiMessages.map(mapApiMessageToMessage);
};

export const createChatMessage = (messageData: CreateChatMessageClientPayload): Promise<Message> => {
  const apiPayload = {
    chat_id: messageData.chatId,
    from_role: messageData.from,
    text: messageData.text,
    time: new Date().toISOString(),
    attachment_type: messageData.attachments?.[0]?.type || null,
    attachment_name: messageData.attachments?.[0]?.name || null,
    attachment_url: null, 
  };
  return apiFetch('/chat-messages', { method: 'POST', body: JSON.stringify(apiPayload) });
};

export const unlockTicket = async (ticketId: string): Promise<Ticket> => {
    const updatedApiTicket = await apiFetch<any>(`/tickets/${ticketId}/unlock`, {
        method: 'POST',
    });
    return mapApiTicketToTicket(updatedApiTicket);
}

// Student Search
export const searchStudents = async (query: string): Promise<StudentSearchResult[]> => {
    if (!query) return Promise.resolve([]);
    const response = await fetch(`${QA_API_BASE_URL}/student-search-new/${encodeURIComponent(query)}`);
    if (!response.ok) {
        throw new Error('Failed to search students');
    }
    return response.json();
};

export const getAllUserFullDetails = async (): Promise<UserFullDetails[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/userFullDetails`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch user details' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
}

export const getAllStudents = async (): Promise<ApiStaffMember[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/users`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch students' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    const users = await response.json();
    return users.filter((user: any) => user.userlevel === 'Student');
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
    return response.json();
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

export const getStudentFullInfo = async (studentNumber: string): Promise<FullStudentData> => {
    const response = await fetch(`${QA_API_BASE_URL}/get-student-full-info?loggedUser=${studentNumber.trim().toUpperCase()}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Student full info not found for ${studentNumber}` }));
        throw new Error(errorData.message || 'Failed to fetch student full info');
    }
    const data = await response.json();
    if (!data.studentInfo || !data.studentEnrollments || !data.studentBalance) {
        throw new Error('Incomplete student data received from API');
    }
    return data as FullStudentData;
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
export const getUserCertificatePrintStatus = async (studentNumber: string): Promise<UserCertificatePrintStatus[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/user_certificate_print_status?studentNumber=${studentNumber}`);
    
    if (response.status === 404) {
        return [];
    }
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Failed to fetch certificate status. Status: ${response.status}` }));
        throw new Error(errorData.error || 'Failed to fetch certificate status');
    }
    const data = await response.json();
    return data.certificateStatus || []; 
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


export const createDeliveryOrderForStudent = async (payload: CreateDeliveryOrderPayload): Promise<any> => {
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

export const getStudentEnrollments = async (studentNumber: string): Promise<StudentEnrollmentInfo[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/student-courses-new/student-number/${studentNumber}`);
    if (response.status === 404) {
        return [];
    }
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to fetch enrollments for ${studentNumber}`}));
        throw new Error(errorData.message || 'Failed to fetch enrollments');
    }
    return response.json();
};

export const addStudentEnrollment = async (data: { student_id: string; course_code: string }): Promise<any> => {
    const payload = {
        student_id: data.student_id,
        course_code: data.course_code,
        enrollment_key: 'ForceAdmin',
        created_at: new Date().toISOString(),
    };
    const response = await fetch(`${QA_API_BASE_URL}/student-courses-new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to add enrollment' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
};

export const removeStudentEnrollment = async (studentCourseId: string): Promise<any> => {
    const response = await fetch(`${QA_API_BASE_URL}/student-courses-new/${studentCourseId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to remove enrollment' }));
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

export const getStudentDetailsByUsername = async (username: string): Promise<UserFullDetails> => {
    const response = await fetch(`${QA_API_BASE_URL}/userFullDetails/username/${username}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to fetch student details for ${username}` }));
        throw new Error(errorData.message || 'Failed to fetch student details');
    }
    return response.json();
};

export const getTempUserDetailsById = async (id: string): Promise<TempUser> => {
    const response = await fetch(`${QA_API_BASE_URL}/temp-users/${id}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to fetch temp user details for ID ${id}` }));
        throw new Error(errorData.message || 'Failed to fetch temp user details');
    }
    return response.json();
};

export const getStudentBalance = async (studentNumber: string): Promise<StudentBalanceData> => {
    const response = await fetch(`${QA_API_BASE_URL}/get-student-balance?loggedUser=${studentNumber}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to fetch student balance for ${studentNumber}`}));
        throw new Error(errorData.message || 'Failed to fetch student balance');
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

const mapApiStaffToStaffMember = (apiStaff: ApiStaffMember): StaffMember => ({
  id: apiStaff.id,
  name: `${apiStaff.fname} ${apiStaff.lname}`,
  username: apiStaff.username,
  email: apiStaff.email,
  avatar: `https://placehold.co/40x40.png?text=${apiStaff.fname[0]}${apiStaff.lname[0]}`,
});

export const getStaffMembers = async (): Promise<StaffMember[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/users/staff/`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch staff members' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    const apiStaffList: ApiStaffMember[] = await response.json();
    return apiStaffList.map(mapApiStaffToStaffMember);
};

// Announcements
export const getAnnouncements = async (): Promise<Announcement[]> => {
    return apiFetch<Announcement[]>('/announcements');
};

export const createAnnouncement = async (data: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement> => {
    return apiFetch<Announcement>('/announcements', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const updateAnnouncement = async (id: string, data: Partial<Omit<Announcement, 'id' | 'createdAt'>>): Promise<Announcement> => {
    return apiFetch<Announcement>(`/announcements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
    await apiFetch<null>(`/announcements/${id}`, {
        method: 'DELETE',
    });
};

// --- BNF API Functions ---
export const getBnfChapters = (): Promise<BnfChapter[]> => apiFetch('/bnf/chapters/');
export const getBnfPage = (id: number): Promise<BnfPage> => apiFetch(`/bnf/pages/${id}/`);
export const getBnfPagesForChapter = (chapterId: number): Promise<BnfPage[]> => apiFetch(`/bnf/pages/chapter/${chapterId}/`);
export const getBnfWordIndex = (): Promise<BnfWordIndexEntry[]> => apiFetch('/bnf/word-index/');

export const createBnfChapter = (data: Partial<BnfChapter>): Promise<BnfChapter> => apiFetch('/bnf/chapters/', { method: 'POST', body: JSON.stringify(data) });
export const updateBnfChapter = (id: number, data: Partial<BnfChapter>): Promise<BnfChapter> => {
    const { id: chapterId, ...payload } = data;
    return apiFetch(`/bnf/chapters/${id}/`, { method: 'PUT', body: JSON.stringify(payload) });
};
export const deleteBnfChapter = (id: number): Promise<void> => apiFetch(`/bnf/chapters/${id}/`, { method: 'DELETE' });

export const createBnfPage = (data: Partial<BnfPage>): Promise<BnfPage> => apiFetch('/bnf/pages/', { method: 'POST', body: JSON.stringify(data) });
export const updateBnfPage = (id: number, data: Partial<BnfPage>): Promise<BnfPage> => {
    const { id: pageId, ...payload } = data;
    return apiFetch(`/bnf/pages/${id}/`, { method: 'PUT', body: JSON.stringify(payload) });
};
export const deleteBnfPage = (id: number): Promise<void> => apiFetch(`/bnf/pages/${id}/`, { method: 'DELETE' });

interface Location {
  id: string;
  name_en: string;
}

// Location APIs
export const getAllCities = async (): Promise<Location[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/cities`);
    if (!response.ok) {
        throw new Error('Failed to fetch cities');
    }
    const data = await response.json();
    // The API returns an object, so we convert it to an array
    return Object.values(data);
};

export const getAllDistricts = async (): Promise<Location[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/districts`);
    if (!response.ok) {
        throw new Error('Failed to fetch districts');
    }
     const data = await response.json();
    // The API returns an object, so we convert it to an array
    return Object.values(data);
};

export const getBatches = async (): Promise<Batch[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/course`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch courses' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    const apiResponse: ApiCourseResponse = await response.json();

    return Object.values(apiResponse).map(courseDetails => ({
        id: courseDetails.id,
        name: courseDetails.course_name,
        parent_course_id: courseDetails.parent_course_id,
        courseCode: courseDetails.course_code,
        description: courseDetails.course_description,
        duration: courseDetails.course_duration,
        fee: courseDetails.course_fee,
        registration_fee: courseDetails.registration_fee,
        enroll_key: courseDetails.enroll_key,
        course_img: courseDetails.course_img,
        certification: courseDetails.certification,
        mini_description: courseDetails.mini_description,
    }));
};

export const getParentCourses = async (): Promise<ParentCourse[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/parent-main-course`);
     if (!response.ok) {
        throw new Error('Failed to fetch parent courses');
    }
    return response.json();
}

export const createBatch = async (batchData: Omit<Batch, 'id'>): Promise<Batch> => {
     const payload = {
        course_name: batchData.name,
        parent_course_id: batchData.parent_course_id,
        course_code: batchData.courseCode,
        course_description: batchData.description,
        course_duration: batchData.duration,
        course_fee: batchData.fee,
        registration_fee: batchData.registration_fee,
        enroll_key: batchData.enroll_key,
        course_img: batchData.course_img,
        certification: batchData.certification,
        mini_description: batchData.mini_description,
    };
    const response = await fetch(`${QA_API_BASE_URL}/course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to create batch');
    return response.json();
};

export const updateBatch = async (id: string, batchData: Partial<Omit<Batch, 'id'>>): Promise<Batch> => {
    const payload = {
        course_name: batchData.name,
        parent_course_id: batchData.parent_course_id,
        course_code: batchData.courseCode,
        course_description: batchData.description,
        course_duration: batchData.duration,
        course_fee: batchData.fee,
        registration_fee: batchData.registration_fee,
        enroll_key: batchData.enroll_key,
        course_img: batchData.course_img,
        certification: batchData.certification,
        mini_description: batchData.mini_description,
    };
    const response = await fetch(`${QA_API_BASE_URL}/course/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to update batch');
    return response.json();
};

export const deleteBatch = async (id: string): Promise<void> => {
    const response = await fetch(`${QA_API_BASE_URL}/course/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete batch');
};


// Parent Course API functions
export const getParentCourseList = async (): Promise<ParentCourse[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/parent-main-course`);
    if (!response.ok) throw new Error('Failed to fetch parent course list');
    return response.json();
};

export const createParentCourse = async (courseData: Omit<ParentCourse, 'id'>): Promise<ParentCourse> => {
    const response = await fetch(`${QA_API_BASE_URL}/parent-main-course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create parent course.' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
};

export const updateParentCourse = async (id: string, courseData: Partial<Omit<ParentCourse, 'id'>>): Promise<ParentCourse> => {
    const response = await fetch(`${QA_API_BASE_URL}/parent-main-course/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData),
    });
     if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update parent course.' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
};

export const deleteParentCourse = async (id: string): Promise<void> => {
    const response = await fetch(`${QA_API_BASE_URL}/parent-main-course/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete parent course.' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
};
