
import type { Ticket, Chat, Message, Attachment, CreateTicketMessageClientPayload, UpdateTicketPayload, CreateChatMessageClientPayload, TicketStatus } from '../types';

const API_BASE_URL = (process.env.NEXT_PUBLIC_CHAT_SERVER_URL || 'https://chat-server.pharmacollege.lk') + '/api';
const CONTENT_PROVIDER_URL = 'https://content-provider.pharmacollege.lk';

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const headers: HeadersInit = options.headers || {};
    
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

    if (apiMsg.img_url) {
        attachments.push({
            type: 'image',
            url: `${CONTENT_PROVIDER_URL}${apiMsg.img_url}`,
            name: apiMsg.img_url.split('/').pop() || 'image.jpg',
        });
    }

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
        studentNumber: apiTicket.student_number || apiTicket.student_name,
        studentName: apiTicket.student_name, 
        studentAvatar: apiTicket.student_avatar,
        assignedTo: apiTicket.assigned_to,
        assigneeAvatar: apiTicket.assignee_avatar,
        isLocked: apiTicket.is_locked == 1,
        lockedByStaffId: apiTicket.locked_by_staff_id,
        attachments: attachments,
        lastMessagePreview: apiTicket.last_message_preview,
        rating: apiTicket.rating_value || apiTicket.rating,
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
    
    if (ticketData.attachments && ticketData.attachments.length > 0) {
      apiPayload.attachments = JSON.stringify(ticketData.attachments.map(att => ({
        type: att.type,
        name: att.name,
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

export const updateTicketRating = async (ticketId: string, rating: number): Promise<{ message: string, ticket: { id: string } }> => {
    const response = await apiFetch<{ message: string; ticket: { id: string } }>(`/tickets/update-rating/${ticketId}`, {
        method: 'POST',
        body: JSON.stringify({ rating_value: rating }),
    });
    return response;
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
            body: JSON.stringify({ read_status: "Read" })
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
        method: 'POST',
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

// Chats
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
