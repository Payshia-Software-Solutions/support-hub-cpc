
import { NextResponse } from 'next/server';
import { bnfChapters as initialBnfChapters } from '@/lib/bnf-data';
import type { BnfChapter, BnfPage } from '@/lib/bnf-data';

// In-memory store for BNF data. In a real app, this would be a database.
let bnfData: BnfChapter[] = JSON.parse(JSON.stringify(initialBnfChapters));
let nextChapterId = bnfData.reduce((max, c) => Math.max(max, c.id), 0) + 1;
let nextPageId = bnfData.flatMap(c => c.pages).reduce((max, p) => Math.max(max, p.id), 0) + 1;


function reindexWordIndex() {
    const words: { word: string; page: number; }[] = [];
    bnfData.forEach(chapter => {
        chapter.pages.forEach(page => {
            page.indexWords.split(',').forEach(word => {
                const trimmedWord = word.trim();
                if (trimmedWord) {
                    words.push({ word: trimmedWord, page: page.id });
                }
            });
        });
    });
    return words.sort((a, b) => a.word.localeCompare(b.word));
}

// GET all BNF data
export async function GET() {
  const allPages = bnfData.flatMap(chapter => chapter.pages);
  const wordIndexData = reindexWordIndex();
  
  return NextResponse.json({
    chapters: bnfData,
    pages: allPages,
    index: wordIndexData,
  });
}

// POST to create a new chapter or page
export async function POST(request: Request) {
    const { type, payload } = await request.json();

    if (type === 'chapter') {
        const newChapter: BnfChapter = {
            id: nextChapterId++,
            title: payload.title,
            pages: [],
        };
        bnfData.push(newChapter);
        return NextResponse.json(newChapter, { status: 201 });
    }

    if (type === 'page') {
        const { chapterId, ...pageData } = payload;
        const chapter = bnfData.find(c => c.id === chapterId);
        if (!chapter) {
            return NextResponse.json({ message: 'Chapter not found' }, { status: 404 });
        }
        const newPage: BnfPage = {
            id: nextPageId++,
            ...pageData
        };
        chapter.pages.push(newPage);
        return NextResponse.json(newPage, { status: 201 });
    }

    return NextResponse.json({ message: 'Invalid request type' }, { status: 400 });
}

// PUT to update a chapter or page
export async function PUT(request: Request) {
    const { type, payload } = await request.json();

    if (type === 'chapter') {
        const { id, ...data } = payload;
        const chapterIndex = bnfData.findIndex(c => c.id === id);
        if (chapterIndex === -1) {
            return NextResponse.json({ message: 'Chapter not found' }, { status: 404 });
        }
        bnfData[chapterIndex] = { ...bnfData[chapterIndex], ...data };
        return NextResponse.json(bnfData[chapterIndex]);
    }

    if (type === 'page') {
        const { id, chapterId, ...data } = payload;
        const chapter = bnfData.find(c => c.id === chapterId);
        if (!chapter) {
            return NextResponse.json({ message: 'Chapter not found' }, { status: 404 });
        }
        const pageIndex = chapter.pages.findIndex(p => p.id === id);
        if (pageIndex === -1) {
            return NextResponse.json({ message: 'Page not found in chapter' }, { status: 404 });
        }
        chapter.pages[pageIndex] = { ...chapter.pages[pageIndex], ...data };
        return NextResponse.json(chapter.pages[pageIndex]);
    }
    
    return NextResponse.json({ message: 'Invalid request type' }, { status: 400 });
}

// DELETE a chapter or page
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = Number(searchParams.get('id'));
    const chapterId = Number(searchParams.get('chapterId'));

    if (type === 'chapter') {
        const initialLength = bnfData.length;
        bnfData = bnfData.filter(c => c.id !== id);
        if (bnfData.length === initialLength) {
             return NextResponse.json({ message: 'Chapter not found' }, { status: 404 });
        }
        return new NextResponse(null, { status: 204 });
    }

    if (type === 'page') {
        const chapter = bnfData.find(c => c.id === chapterId);
        if (!chapter) {
             return NextResponse.json({ message: 'Chapter not found' }, { status: 404 });
        }
        const initialLength = chapter.pages.length;
        chapter.pages = chapter.pages.filter(p => p.id !== id);
        if (chapter.pages.length === initialLength) {
            return NextResponse.json({ message: 'Page not found' }, { status: 404 });
        }
        return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json({ message: 'Invalid request type' }, { status: 400 });
}
