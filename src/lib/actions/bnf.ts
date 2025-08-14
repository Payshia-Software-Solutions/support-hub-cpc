
import type { BnfChapter, BnfPage, BnfWordIndexEntry } from '../types';

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
