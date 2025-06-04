
"use client";

import { useState, useRef, useEffect } from "react";
import type { Chat, Message } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import { Paperclip, SendHorizonal, Smile } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
  chat: Chat | null;
  onSendMessage: (chatId: string, messageText: string) => void;
}

export function ChatWindow({ chat, onSendMessage }: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      // @ts-ignore Accessing viewport directly from ScrollArea's structure
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [chat?.messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && chat) {
      onSendMessage(chat.id, newMessage.trim());
      setNewMessage("");
      inputRef.current?.focus();
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prevMessage) => prevMessage + emojiData.emoji);
    inputRef.current?.focus();
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
  
  const staffAvatar = "https://placehold.co/40x40.png";

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="p-4 border-b bg-card flex items-center gap-3 sticky top-0 z-10">
        <Avatar className="h-10 w-10">
          <AvatarImage src={chat.userAvatar} alt={chat.userName} data-ai-hint="avatar person" />
          <AvatarFallback>{chat.userName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-lg">{chat.userName}</h2>
          <p className="text-xs text-muted-foreground">Online</p> {/* Placeholder status */}
        </div>
      </header>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {chat.messages.map((message, index) => (
            <div
              key={message.id || index} 
              className={cn(
                "flex items-end gap-2 max-w-[75%]",
                message.from === "student" ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={message.from === 'student' ? chat.userAvatar : (message.avatar || staffAvatar) } 
                  alt={message.from} 
                  data-ai-hint="avatar person" 
                />
                <AvatarFallback>
                  {message.from === 'student' ? chat.userName.charAt(0).toUpperCase() : 'S'}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  "p-3 rounded-xl shadow-sm",
                  message.from === "student"
                    ? "bg-primary/90 text-primary-foreground rounded-br-none" 
                    : "bg-card border rounded-bl-none" 
                )}
              >
                <p className="text-sm">{message.text}</p>
                <p className="text-xs mt-1 text-right opacity-70">
                  {message.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <footer className="p-4 border-t bg-card sticky bottom-0 z-10">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-0 bg-transparent shadow-none">
              <EmojiPicker 
                onEmojiClick={handleEmojiClick}
                height={350}
                width="100%"
                lazyLoadEmojis={true}
              />
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1 rounded-full px-4 py-2 focus-visible:ring-primary"
          />
          <Button size="icon" onClick={handleSendMessage} className="rounded-full bg-primary hover:bg-primary/90">
            <SendHorizonal className="h-5 w-5" />
          </Button>
        </div>
      </footer>
    </div>
  );
}

// Placeholder Icon for empty state
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
