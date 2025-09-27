
"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Strikethrough, Pilcrow, Quote, Redo, Undo } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';

const TiptapToolbar = ({ editor }: { editor: any }) => {
    if (!editor) return null;

    return (
        <div className="flex flex-wrap items-center gap-1 border border-input rounded-t-md p-2 bg-transparent">
            <Toggle size="sm" pressed={editor.isActive('bold')} onPressedChange={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></Toggle>
            <Toggle size="sm" pressed={editor.isActive('italic')} onPressedChange={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Toggle>
            <Toggle size="sm" pressed={editor.isActive('underline')} onPressedChange={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="h-4 w-4" /></Toggle>
            <Toggle size="sm" pressed={editor.isActive('strike')} onPressedChange={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="h-4 w-4" /></Toggle>

            <Separator orientation="vertical" className="h-8 mx-1" />
            
            <Toggle size="sm" pressed={editor.isActive('heading', { level: 2 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</Toggle>
            <Toggle size="sm" pressed={editor.isActive('heading', { level: 3 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</Toggle>
            <Toggle size="sm" pressed={editor.isActive('paragraph')} onPressedChange={() => editor.chain().focus().setParagraph().run()}><Pilcrow className="h-4 w-4"/></Toggle>
            
            <Separator orientation="vertical" className="h-8 mx-1" />

            <Toggle size="sm" pressed={editor.isActive('bulletList')} onPressedChange={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></Toggle>
            <Toggle size="sm" pressed={editor.isActive('orderedList')} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Toggle>
            <Toggle size="sm" pressed={editor.isActive('blockquote')} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></Toggle>

            <Separator orientation="vertical" className="h-8 mx-1" />

            <Toggle size="sm" onPressedChange={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo className="h-4 w-4" /></Toggle>
            <Toggle size="sm" onPressedChange={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo className="h-4 w-4" /></Toggle>
        </div>
    );
};

export const TiptapEditor = ({ content, onChange }: { content: string, onChange: (richText: string) => void }) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                // You can configure the starter kit here if needed
            }),
            Underline,
        ],
        content: content,
        editorProps: {
            attributes: {
                class: 'prose prose-sm dark:prose-invert min-h-[150px] w-full rounded-b-md border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 border border-t-0',
            },
        },
        onUpdate({ editor }) {
            onChange(editor.getHTML());
        },
    });

    return (
        <div>
            <TiptapToolbar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
};
