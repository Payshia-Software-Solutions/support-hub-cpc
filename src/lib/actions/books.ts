
"use server";

import type { Book, CreateBookPayload } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_BOOKS_API_URL;

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_BOOKS_API_URL is not set in the environment variables.");
  }

  try {
    const headers: HeadersInit = options.headers || {};
    
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const url = endpoint ? `${API_BASE_URL}${endpoint}` : API_BASE_URL;

    const response = await fetch(url, {
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
    
    const result = await response.json();
    return result.data as T;

  } catch (error) {
    if (error instanceof Error) {
        throw new Error(error.message || 'An unknown network error occurred.');
    }
    throw new Error('An unknown error occurred.');
  }
}

// --- Books API Functions ---
export async function getBooks(): Promise<Book[]> {
    return apiFetch('');
}

export async function createBook(payload: CreateBookPayload): Promise<Book> {
    return apiFetch('', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}
