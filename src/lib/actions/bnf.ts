

"use server";

import type { BnfChapter, BnfPage, BnfWordIndexEntry } from '../bnf-data';
import { bnfChapters, allPages, wordIndexData } from '../bnf-data';

// These functions simulate fetching data. In a real application, they would
// make API calls to your backend, similar to the other `actions` files.

export async function getBnfChapters(): Promise<BnfChapter[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return bnfChapters;
}

export async function getBnfPage(pageId: number): Promise<BnfPage | undefined> {
     // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return allPages.find(p => p.id === pageId);
}

export async function getBnfWordIndex(): Promise<BnfWordIndexEntry[]> {
     // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return wordIndexData;
}
