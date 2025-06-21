
import type { Ticket, Announcement, Chat, Message } from './types';

// In a real app, you would move this to a .env file
const API_BASE_URL = 'https://chat-server.pharmacollege.lk/api';

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
type CreateTicketMessagePayload = { ticketId: string } & Omit<Message, 'id' | 'time'>;

export const getTickets = (): Promise<Ticket[]> => apiFetch('/tickets');
export const getTicket = (id: string): Promise<Ticket> => apiFetch(`/tickets/${id}`);
export const getTicketMessages = (ticketId: string): Promise<Message[]> => apiFetch(`/ticket-messages/by-ticket/${ticketId}`);
export const createTicket = (ticketData: CreateTicketPayload): Promise<Ticket> => apiFetch('/tickets', { method: 'POST', body: JSON.stringify(ticketData) });
export const updateTicket = (ticketData: UpdateTicketPayload): Promise<Ticket> => apiFetch(`/tickets/${ticketData.id}`, { method: 'POST', body: JSON.stringify(ticketData) }); // Assuming POST for update as per dummy API
export const createTicketMessage = (messageData: CreateTicketMessagePayload): Promise<Message> => apiFetch('/ticket-messages', { method: 'POST', body: JSON.stringify(messageData) });

// Chats
type CreateChatMessagePayload = { chatId: string } & Omit<Message, 'id' | 'time'>;

export const getChats = (): Promise<Chat[]> => apiFetch('/chats');
export const getChat = (id: string): Promise<Chat> => apiFetch(`/chats/${id}`);
export const getChatMessages = (chatId: string): Promise<Message[]> => apiFetch(`/chat-messages/by-chat/${chatId}`);
export const createChatMessage = (messageData: CreateChatMessagePayload): Promise<Message> => apiFetch('/chat-messages', { method: 'POST', body: JSON.stringify(messageData) });
