
"use client";

import { useState, useRef, useEffect } from "react";
import type { Chat, Message, Attachment } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import { Paperclip, SendHorizonal, Smile, FileText, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

interface ChatWindowProps {
  chat: Chat | null;
  onSendMessage: (chatId: string, messageText: string, attachment?: Attachment) => void;
  userRole: 'student' | 'staff'; // New prop
  staffAvatar?: string; // New prop for staff's own avatar when userRole is 'staff'
}

const defaultStaffMessageAvatar = "https://placehold.co/40x40.png"; // Generic staff avatar for incoming messages

export function ChatWindow({ chat, onSendMessage, userRole, staffAvatar }: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState("");
  const [stagedAttachment, setStagedAttachment] = useState<Attachment | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      // @ts-ignore
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [chat?.messages]);

  useEffect(() => {
    setStagedAttachment(null);
    setNewMessage("");
  }, [chat?.id]);

  const handleSendMessageLocal = () => {
    if ((newMessage.trim() || stagedAttachment) && chat) {
      // The `from` and `avatar` for the new message will be determined by the `onSendMessage`
      // callback in the parent component (`ChatPage` or `AdminChatPage`)
      // This component just passes the text and attachment.
      onSendMessage(chat.id, newMessage.trim(), stagedAttachment || undefined);
      setNewMessage("");
      setStagedAttachment(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      inputRef.current?.focus();
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prevMessage) => prevMessage + emojiData.emoji);
    inputRef.current?.focus();
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileName = file.name;
      const fileType = file.type;

      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please select a file smaller than 5MB.",
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      if (fileType.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setStagedAttachment({
            type: "image",
            url: reader.result as string,
            name: fileName,
            file: file,
          });
        };
        reader.readAsDataURL(file);
      } else {
        setStagedAttachment({
          type: "document",
          url: "", 
          name: fileName,
          file: file,
        });
      }
    }
  };

  const removeStagedAttachment = () => {
    setStagedAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!chat) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-background text-muted-foreground p-4">
        <MessageSquareDashedIcon className="w-24 h-24 mb-4" />
        <p className="text-lg">Select a chat to start messaging</p>
        <p className="text-sm">Or start a new conversation from your contacts.</p>
      </div>
    );
  }
  
  // Determine avatar for "other" party in chat
  const otherPartyAvatar = userRole === 'student' ? defaultStaffMessageAvatar : chat.userAvatar;
  const otherPartyFallback = userRole === 'student' ? 'S' : chat.userName.charAt(0).toUpperCase();

  // Determine avatar for "current user" based on role
  const currentUserAvatar = userRole === 'student' ? chat.userAvatar : staffAvatar;
  const currentUserFallback = userRole === 'student' ? chat.userName.charAt(0).toUpperCase() : 'S';


  return (
    <div className="flex flex-col h-full bg-background">
      <header className="p-4 border-b bg-card flex items-center gap-3 sticky top-0 z-10">
        <Avatar className="h-10 w-10">
          {/* Header always shows the student's avatar and name */}
          <AvatarImage src={chat.userAvatar} alt={chat.userName} data-ai-hint="avatar person" />
          <AvatarFallback>{chat.userName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-lg">{chat.userName}</h2>
          {/* Status might differ based on context or could be dynamic */}
          <p className="text-xs text-muted-foreground">
            {userRole === 'staff' ? `Chatting with ${chat.userName}` : 'Online'}
          </p>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {chat.messages.map((message, index) => (
            <div
              key={message.id || index} 
              className={cn(
                "flex items-end gap-2 max-w-[75%]",
                // Message is from the current user if message.from matches userRole
                message.from === userRole ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={message.from === userRole ? currentUserAvatar : (message.avatar || otherPartyAvatar)}
                  alt={message.from} 
                  data-ai-hint="avatar person" 
                />
                <AvatarFallback>
                  {message.from === userRole ? currentUserFallback : otherPartyFallback}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  "p-3 rounded-xl shadow-sm",
                  message.from === userRole
                    ? "bg-primary/90 text-primary-foreground rounded-br-none" 
                    : "bg-card border rounded-bl-none" 
                )}
              >
                {message.attachment?.type === 'image' && message.attachment.url && (
                  <div className="mb-2">
                    <Image 
                      src={message.attachment.url} 
                      alt={message.attachment.name} 
                      width={200} 
                      height={200} 
                      className="rounded-md object-cover"
                      data-ai-hint="attached image"
                    />
                  </div>
                )}
                {message.attachment?.type === 'document' && (
                  <div className="mb-2 p-2 bg-secondary rounded-md flex items-center gap-2">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm text-secondary-foreground truncate">{message.attachment.name}</span>
                  </div>
                )}
                {message.text && <p className="text-sm">{message.text}</p>}
                <p className="text-xs mt-1 text-right opacity-70">
                  {message.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <footer className="p-4 border-t bg-card sticky bottom-0 z-10">
        {stagedAttachment && (
          <div className="mb-2 p-2 border rounded-md flex items-center justify-between bg-muted/50">
            <div className="flex items-center gap-2 truncate">
              {stagedAttachment.type === 'image' ? (
                <Image src={stagedAttachment.url} alt={stagedAttachment.name} width={32} height={32} className="rounded object-cover" data-ai-hint="image preview"/>
              ) : (
                <FileText className="h-6 w-6 text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground truncate">{stagedAttachment.name}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={removeStagedAttachment} className="text-destructive hover:text-destructive">
              <XCircle className="h-5 w-5" />
            </Button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-0 bg-transparent shadow-none mb-2">
              <EmojiPicker 
                onEmojiClick={handleEmojiClick}
                height={350}
                width="100%"
                lazyLoadEmojis={true}
              />
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={handleAttachmentClick}>
            <Paperclip className="h-5 w-5" />
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden"
          />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessageLocal()}
            className="flex-1 rounded-full px-4 py-2 focus-visible:ring-primary"
            disabled={!!stagedAttachment && stagedAttachment.type === 'image' && !newMessage}
          />
          <Button size="icon" onClick={handleSendMessageLocal} className="rounded-full bg-primary hover:bg-primary/90">
            <SendHorizonal className="h-5 w-5" />
          </Button>
        </div>
      </footer>
    </div>
  );
}

function MessageSquareDashedIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 15V9a2 2 0 0 1 2-2h1.5" />
      <path d="M14 2h1.5a2 2 0 0 1 2 2v1.5" />
      <path d="M20 10.5V9" />
      <path d="M4 20.5V15" />
      <path d="M14 22h-1.5a2 2 0 0 1-2-2v-1.5" />
      <path d="M20 15v-1.5" />
    </svg>
  )
}
