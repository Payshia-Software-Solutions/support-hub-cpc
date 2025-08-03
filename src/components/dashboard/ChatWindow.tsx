
"use client";

import { useState, useRef, useEffect } from "react";
import type { Chat, Message, Attachment } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import { Paperclip, SendHorizonal, Smile, FileText, XCircle, MessageSquareDashed } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { getChatMessages } from "@/lib/api";
import { TypingIndicator } from "@/components/ui/typing-indicator";
import { Skeleton } from "../ui/skeleton";

interface ChatWindowProps {
  chat: Chat | null | undefined;
  onSendMessage: (chatId: string, messageText: string, attachment?: Attachment) => void;
  userRole: 'student' | 'staff'; 
  staffAvatar?: string; 
}

const defaultStaffMessageAvatar = "https://placehold.co/40x40.png?text=S";

function ChatMessages({ chat, userRole, staffAvatar }: Pick<ChatWindowProps, 'chat' | 'userRole' | 'staffAvatar'>) {
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { data: messages, isLoading, isError } = useQuery<Message[]>({
        queryKey: ['chatMessages', chat?.id],
        queryFn: () => getChatMessages(chat!.id),
        enabled: !!chat, // Only fetch if a chat is selected
    });

    useEffect(() => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    }, [messages]);

    const studentAvatar = chat?.userAvatar;
    const studentFallback = chat?.userName?.charAt(0).toUpperCase() || 'U';
    const staffMessageAvatar = staffAvatar || defaultStaffMessageAvatar;
    const staffFallback = 'S';

    if (isLoading) {
        return (
            <ScrollArea className="flex-1 p-4">
                <div className="flex items-end gap-2 max-w-[75%] mr-auto">
                    <Avatar className="h-8 w-8">
                        <AvatarImage
                            src={userRole === 'student' ? staffMessageAvatar : studentAvatar}
                            alt="Typing..."
                            data-ai-hint="avatar person"
                        />
                        <AvatarFallback>
                            {userRole === 'student' ? staffFallback : studentFallback}
                        </AvatarFallback>
                    </Avatar>
                    <div className={cn("p-1 rounded-xl shadow-sm", "bg-card border rounded-bl-none")}>
                        <TypingIndicator />
                    </div>
                </div>
            </ScrollArea>
        );
    }
    

    return (
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
                {isError && <p className="text-center text-destructive">Failed to load messages.</p>}
                {!isLoading && messages?.map((message, index) => {
                    const isCurrentUserMessage = (message.from === 'student' && userRole === 'student') || (message.from === 'staff' && userRole === 'staff');
                    const hasText = message.text && message.text.trim().length > 0;
                    const hasAttachment = message.attachment?.url;

                    if (!hasText && !hasAttachment) {
                        return null;
                    }
                    
                    return (
                        <div
                            key={message.id || index}
                            className={cn(
                                "flex items-end gap-2 max-w-[75%]",
                                isCurrentUserMessage ? "ml-auto flex-row-reverse" : "mr-auto"
                            )}
                        >
                            <Avatar className="h-8 w-8">
                                <AvatarImage
                                    src={message.from === 'student' ? studentAvatar : (message.avatar || staffMessageAvatar)}
                                    alt={message.from}
                                    data-ai-hint="avatar person"
                                />
                                <AvatarFallback>
                                    {message.from === 'student' ? studentFallback : staffFallback}
                                </AvatarFallback>
                            </Avatar>
                            <div
                                className={cn(
                                    "rounded-xl shadow-sm",
                                    isCurrentUserMessage
                                        ? "bg-primary/90 text-primary-foreground rounded-br-none"
                                        : "bg-card border rounded-bl-none",
                                    !hasText && hasAttachment && 'p-1.5'
                                )}
                            >
                                {message.attachment?.type === 'image' && message.attachment.url && (
                                    <div className={cn("mb-2", !hasText && "mb-0")}>
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
                                {hasText && <p className="text-sm p-3 pt-2 pb-1">{message.text}</p>}
                                <p className={cn("text-xs mt-1 text-right opacity-70", hasText ? "pr-3 pb-2" : "p-0")}>
                                    {new Date(message.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </ScrollArea>
    );
}


export function ChatWindow({ chat, onSendMessage, userRole, staffAvatar }: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState("");
  const [stagedAttachment, setStagedAttachment] = useState<Attachment | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setStagedAttachment(null);
    setNewMessage("");
  }, [chat?.id]);

  const handleSendMessageLocal = () => {
    if ((newMessage.trim() || stagedAttachment) && chat) {
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
        <MessageSquareDashed className="w-24 h-24 mb-4" />
        <p className="text-lg">Select a chat to start messaging</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full bg-background">
      <header className="p-4 border-b bg-card flex items-center gap-3 shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={chat.userAvatar} alt={chat.userName || 'Chat User'} data-ai-hint="avatar person" />
          <AvatarFallback>{chat.userName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-lg">{chat.userName || 'Unknown User'}</h2>
          <p className="text-xs text-muted-foreground">
            {userRole === 'staff' ? `Chatting with ${chat.userName || 'user'}` : 'Online'}
          </p>
        </div>
      </header>

      <ChatMessages chat={chat} userRole={userRole} staffAvatar={staffAvatar} />

      <footer className="p-4 border-t bg-card shrink-0">
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
