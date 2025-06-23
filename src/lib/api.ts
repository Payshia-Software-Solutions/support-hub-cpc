
import type { Ticket, Announcement, Chat, Message, Attachment, CreateTicketMessageClientPayload, CreateTicketPayload, UpdateTicketPayload, CreateChatMessageClientPayload, TicketStatus } from './types';

// In a real app, you would move this to a .env file
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://chat-server.pharmacollege.lk/api';

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      // Try to parse error response, but fallback to status text
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: response.statusText };
      }
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    // Handle cases with no content in response
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

// Define the shape of the message object from the API
interface ApiMessage {
  id: string;
  ticket_id?: string; // Add ticket_id for ticket messages
  from_role: 'student' | 'staff'; // This is the key from the API
  text: string;
  time: string;
  avatar?: string;
  attachment_type?: 'image' | 'document' | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
}

// Mapper function to transform API message to internal message format
function mapApiMessageToMessage(apiMsg: ApiMessage): Message {
  return {
    id: apiMsg.id,
    from: apiMsg.from_role, // Map from_role to from
    text: apiMsg.text,
    time: apiMsg.time,
    avatar: apiMsg.avatar,
    attachment: (apiMsg.attachment_type && apiMsg.attachment_url && apiMsg.attachment_name)
      ? {
          type: apiMsg.attachment_type,
          url: apiMsg.attachment_url,
          name: apiMsg.attachment_name,
        }
      : undefined,
  };
}

// Define the shape of the chat object from the API
interface ApiChat {
    id: string;
    user_name: string;
    user_avatar: string;
    student_number?: string;
    last_message_preview?: string;
    last_message_time?: string;
    unread_count?: number | string;
}

// Mapper function to transform API chat to internal chat format
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

// Mapper for Ticket response (API -> App)
function mapApiTicketToTicket(apiTicket: any): Ticket {
    return {
        id: apiTicket.id,
        subject: apiTicket.subject,
        description: apiTicket.description,
        priority: apiTicket.priority,
        status: apiTicket.status,
        createdAt: apiTicket.created_at,
        updatedAt: apiTicket.updated_at,
        studentName: apiTicket.student_name,
        studentAvatar: apiTicket.student_avatar,
        assignedTo: apiTicket.assigned_to,
        assigneeAvatar: apiTicket.assignee_avatar,
        isLocked: apiTicket.is_locked == 1, // Fix: Convert "0" or "1" from API to a boolean
        lockedByStaffId: apiTicket.locked_by_staff_id,
    };
}

// Mapper for Ticket request (App -> API)
// This handles both creation and updates.
function mapTicketToApiPayload(ticketData: Partial<Ticket>): any {
    const apiPayload: { [key: string]: any } = {};
    if (ticketData.subject !== undefined) apiPayload.subject = ticketData.subject;
    if (ticketData.description !== undefined) apiPayload.description = ticketData.description;
    if (ticketData.priority !== undefined) apiPayload.priority = ticketData.priority;
    if (ticketData.status !== undefined) apiPayload.status = ticketData.status;
    if (ticketData.studentName !== undefined) apiPayload.student_name = ticketData.studentName;
    if (ticketData.studentAvatar !== undefined) apiPayload.student_avatar = ticketData.studentAvatar;
    if (ticketData.assignedTo !== undefined) apiPayload.assigned_to = ticketData.assignedTo;
    if (ticketData.assigneeAvatar !== undefined) apiPayload.assignee_avatar = ticketData.assigneeAvatar;
    // Fix: Send 1 or 0 to the API instead of true/false
    if (ticketData.isLocked !== undefined) apiPayload.is_locked = ticketData.isLocked ? 1 : 0;
    if (ticketData.lockedByStaffId !== undefined) apiPayload.locked_by_staff_id = ticketData.lockedByStaffId;
    return apiPayload;
}


// Announcements
export const getAnnouncements = (): Promise<Announcement[]> => apiFetch('/announcements');

// Tickets
export const getTickets = async (): Promise<Ticket[]> => {
    const apiTickets = await apiFetch<any[]>('/tickets');
    if (!apiTickets) return [];
    return apiTickets.map(mapApiTicketToTicket);
};
export const getTicket = async (id: string): Promise<Ticket> => {
    const apiTicket = await apiFetch<any>(`/tickets/${id}`);
    return mapApiTicketToTicket(apiTicket);
};
export const getTicketMessages = async (ticketId: string): Promise<Message[]> => {
    const apiMessages = await apiFetch<ApiMessage[]>(`/ticket-messages/by-ticket/${ticketId}`);
    if (!apiMessages) return [];
    return apiMessages.map(mapApiMessageToMessage);
};
export const createTicket = async (ticketData: CreateTicketPayload): Promise<Ticket> => {
    const apiPayload = mapTicketToApiPayload(ticketData);
    const newApiTicket = await apiFetch<any>('/tickets', { method: 'POST', body: JSON.stringify(apiPayload) });
    return mapApiTicketToTicket(newApiTicket);
};
export const updateTicket = async (ticketData: UpdateTicketPayload): Promise<Ticket> => {
    const apiPayload = mapTicketToApiPayload(ticketData);
    const updatedApiTicket = await apiFetch<any>(`/tickets/${ticketData.id}`, { method: 'POST', body: JSON.stringify(apiPayload) });
    return mapApiTicketToTicket(updatedApiTicket);
};

export const updateTicketStatus = async (ticketId: string, newStatus: TicketStatus): Promise<Ticket> => {
    const updatedApiTicket = await apiFetch<any>(`/tickets/${ticketId}/status/`, {
        method: 'POST',
        body: JSON.stringify({ newStatus: newStatus }),
    });
    return mapApiTicketToTicket(updatedApiTicket);
}

export const createTicketMessage = async (messageData: CreateTicketMessageClientPayload): Promise<Message> => {
  const apiPayload = {
    ticket_id: messageData.ticketId,
    from_role: messageData.from,
    text: messageData.text,
    time: new Date().toISOString(),
  };
  const newApiMessage = await apiFetch<ApiMessage>(`/ticket-messages`, { method: 'POST', body: JSON.stringify(apiPayload) });
  return mapApiMessageToMessage(newApiMessage);
};


// Chats
export const getChats = async (): Promise<Chat[]> => {
    const apiChats = await apiFetch<ApiChat[]>('/chats');
    if (!apiChats) return [];
    return apiChats.map(mapApiChatToChat);
};
export const getChat = async (id: string): Promise<Chat> => {
    const apiChat = await apiFetch<ApiChat>(`/chats/${id}`);
    return mapApiChatToChat(apiChat);
};
export const getChatMessages = async (chatId: string): Promise<Message[]> => {
    const apiMessages = await apiFetch<ApiMessage[]>(`/chat-messages/by-chat/${chatId}`);
    if (!apiMessages) return [];
    return apiMessages.map(mapApiMessageToMessage);
};

export const createChatMessage = (messageData: CreateChatMessageClientPayload): Promise<Message> => {
  // We transform the client-side payload to match the API's expected format
  const apiPayload = {
    chat_id: messageData.chatId,
    from_role: messageData.from,
    text: messageData.text,
    time: new Date().toISOString(),
    attachment_type: messageData.attachment?.type || null,
    attachment_name: messageData.attachment?.name || null,
    // The API should handle file uploads and URL generation, so we send null.
    // The API should also handle timestamping and associating the user's avatar.
    attachment_url: null, 
  };
  return apiFetch('/chat-messages', { method: 'POST', body: JSON.stringify(apiPayload) });
};
