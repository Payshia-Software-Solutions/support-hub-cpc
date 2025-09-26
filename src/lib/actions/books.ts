

"use server";

import type { Book, CreateBookPayload, Chapter, CreateChapterPayload, UpdateChapterPayload } from '../types';

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
    
    const baseUrl = new URL(API_BASE_URL);
    const url = endpoint ? `${baseUrl.origin}${endpoint}` : API_BASE_URL;

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

export async function getBookById(bookId: string): Promise<Book> {
    const books = await getBooks();
    const book = books.find(b => b.book_id === bookId);
    if (!book) {
        throw new Error(`Book with ID ${bookId} not found.`);
    }
    return book;
}

export async function createBook(payload: CreateBookPayload): Promise<Book> {
    return apiFetch('', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}


// --- Chapters API Functions ---
export async function getChaptersByBook(bookId: string): Promise<Chapter[]> {
    return apiFetch(`/chapters/by-book/${bookId}`);
}

export async function createChapter(payload: CreateChapterPayload): Promise<Chapter> {
    return apiFetch('/chapters', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function updateChapter(chapterId: string, payload: UpdateChapterPayload): Promise<Chapter> {
    return apiFetch(`/chapters/${chapterId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

export async function deleteChapter(chapterId: string): Promise<void> {
    await apiFetch<null>(`/chapters/${chapterId}`, {
        method: 'DELETE',
    });
}

