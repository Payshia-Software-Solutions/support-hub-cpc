
import type { Ticket, Announcement, Chat, Message, Attachment } from './types';

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

// Announcements
export const getAnnouncements = (): Promise<Announcement[]> => apiFetch('/announcements');

// Tickets
type CreateTicketPayload = Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateTicketPayload = Partial<Ticket> & { id: string };

// This is the data the CLIENT will provide
type CreateTicketMessageClientPayload = { 
  ticketId: string;
  from: 'student' | 'staff';
  text: string;
};


export const getTickets = (): Promise<Ticket[]> => apiFetch('/tickets');
export const getTicket = (id: string): Promise<Ticket> => apiFetch(`/tickets/${id}`);
export const getTicketMessages = (ticketId: string): Promise<Message[]> => apiFetch(`/ticket-messages/by-ticket/${ticketId}`);
export const createTicket = (ticketData: CreateTicketPayload): Promise<Ticket> => apiFetch('/tickets', { method: 'POST', body: JSON.stringify(ticketData) });
export const updateTicket = (ticketData: UpdateTicketPayload): Promise<Ticket> => apiFetch(`/tickets/${ticketData.id}`, { method: 'POST', body: JSON.stringify(ticketData) });

export const createTicketMessage = (messageData: CreateTicketMessageClientPayload): Promise<Message> => {
  const apiPayload = {
    ticket_id: messageData.ticketId,
    from_role: messageData.from,
    text: messageData.text,
    time: new Date().toISOString(),
  };
  return apiFetch('/ticket-messages', { method: 'POST', body: JSON.stringify(apiPayload) });
};


// Chats
// This is the data the CLIENT will provide
type CreateChatMessageClientPayload = {
  chatId: string;
  from: 'student' | 'staff';
  text: string;
  attachment?: Attachment;
};

export const getChats = (): Promise<Chat[]> => apiFetch('/chats');
export const getChat = (id: string): Promise<Chat> => apiFetch(`/chats/${id}`);
export const getChatMessages = (chatId: string): Promise<Message[]> => apiFetch(`/chat-messages/by-chat/${chatId}`);

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
