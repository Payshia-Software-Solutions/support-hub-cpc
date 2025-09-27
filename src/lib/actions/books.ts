

"use server";

import type { Book, CreateBookPayload, Chapter, CreateChapterPayload, UpdateChapterPayload, Section, CreateSectionPayload, UpdateSectionPayload, PageContent, CreatePagePayload, UpdatePagePayload } from '../types';

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
        errorData = { message: `Request failed. Server returned status: ${response.status}` };
      }
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
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
    const response = await apiFetch<{ data: Book }>('/books', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return response.data;
}


// --- Chapters API Functions ---
export async function getChaptersByBook(bookId: string): Promise<Chapter[]> {
    return apiFetch(`/chapters/by-book/${bookId}`);
}

export async function createChapter(payload: CreateChapterPayload): Promise<Chapter> {
    const response = await apiFetch<{data: Chapter}>('/chapters', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return response.data;
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

// --- Sections API Functions ---
export async function getSectionsByBook(bookId: string): Promise<Section[]> {
    return apiFetch(`/sections/by-book/${bookId}`);
}

export async function createSection(payload: CreateSectionPayload): Promise<Section> {
    return apiFetch('/sections', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function updateSection(sectionId: string, payload: UpdateSectionPayload): Promise<Section> {
    return apiFetch(`/sections/${sectionId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

export async function deleteSection(sectionId: string): Promise<void> {
    await apiFetch<null>(`/sections/${sectionId}`, {
        method: 'DELETE',
    });
}

// --- Page Content API Functions ---
export async function getPagesByBookChapterSection(bookId: string, chapterId: string, sectionId: string): Promise<PageContent[]> {
    return apiFetch(`/pages/by-book-section-chapter/${bookId}/${sectionId}/${chapterId}`);
}

export async function createPage(payload: CreatePagePayload): Promise<PageContent> {
    return apiFetch('/pages', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function updatePage(pageId: string, payload: UpdatePagePayload): Promise<PageContent> {
    return apiFetch(`/pages/${pageId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

export async function deletePage(pageId: string): Promise<void> {
    await apiFetch<null>(`/pages/${pageId}`, {
        method: 'DELETE',
    });
}
