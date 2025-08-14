
import type { Announcement } from '../types';

// In a real app, you would move this to a .env file
const API_BASE_URL = (process.env.NEXT_PUBLIC_CHAT_SERVER_URL || 'https://chat-server.pharmacollege.lk') + '/api';

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
