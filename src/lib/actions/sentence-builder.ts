

"use server";

import type { GameLevel, Sentence, StudentAnswerPayload, StudentAnswer } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_LMS_SERVER_URL || 'https://qa-api.pharmacollege.lk';

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const headers: HeadersInit = options.headers || {};
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
      throw new Error(errorData.message || `An unknown error occurred.`);
    }

    if (response.status === 204) {
      return null as T;
    }
    
    return response.json();
  } catch (error) {
    if (error instanceof Error) {
        throw new Error(error.message);
    }
    throw new Error('An unknown error occurred.');
  }
}

// --- Level Management ---
export const getLevels = async (): Promise<GameLevel[]> => {
    const levelsWithoutSentences = await apiFetch<GameLevel[]>('/sentence-builder-levels/');
    
    // Fetch sentence count for each level
    const levelsWithSentenceCount = await Promise.all(
        levelsWithoutSentences.map(async (level) => {
            try {
                const sentences = await getSentencesByLevel(level.id);
                return { ...level, sentences: sentences || [] };
            } catch (error) {
                console.error(`Failed to fetch sentences for level ${level.id}`, error);
                return { ...level, sentences: [] }; // Return level with empty sentences on error
            }
        })
    );

    return levelsWithSentenceCount;
};

export const getLevelById = async (id: number): Promise<GameLevel> => {
    return apiFetch(`/sentence-builder-levels/${id}/`);
};

export const createLevel = async (data: { level_number: number; pattern: string }): Promise<GameLevel> => {
    return apiFetch('/sentence-builder-levels/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const updateLevel = async ({ id, ...data }: Partial<GameLevel>): Promise<GameLevel> => {
    return apiFetch(`/sentence-builder-levels/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
};

export const deleteLevel = async (id: number): Promise<void> => {
    await apiFetch<null>(`/sentence-builder-levels/${id}/`, {
        method: 'DELETE',
    });
};

// --- Sentence Management ---
export const getSentencesByLevel = async (levelId: number): Promise<Sentence[]> => {
    return apiFetch(`/sentence-builder-sentences/level/${levelId}/`);
};

export const createSentence = async (data: Omit<Sentence, 'id' | 'words'>): Promise<Sentence> => {
    return apiFetch('/sentence-builder-sentences/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const updateSentence = async ({ id, ...data }: Partial<Sentence>): Promise<Sentence> => {
    return apiFetch(`/sentence-builder-sentences/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
};

export const deleteSentence = async (id: number): Promise<void> => {
    await apiFetch<null>(`/sentence-builder-sentences/${id}/`, {
        method: 'DELETE',
    });
};


// --- Student Answer Management ---
export const saveStudentAnswer = async (payload: StudentAnswerPayload): Promise<any> => {
    return apiFetch('/sentence-builder-student-answers/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
};

export const getStudentSubmissions = async (studentNumber: string): Promise<StudentAnswer[]> => {
    if (!studentNumber) return [];
    return apiFetch(`/sentence-builder-student-answers/student/${studentNumber}/`);
};
