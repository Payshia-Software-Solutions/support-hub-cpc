
"use client";

import type { Chat } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search, PlusCircle } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

interface ChatListProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  isLoading: boolean;
}

const MAX_PREVIEW_LENGTH = 30;

function truncateText(text: string | undefined, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + "...";
}

export function ChatList({ chats, selectedChatId, onSelectChat, isLoading }: ChatListProps) {
  return (
    <div className="flex flex-col h-full bg-card">     
      <div className="p-4 border-b flex items-center gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search chats..." className="pl-10 rounded-full w-full" />
        </div>
        <Link href="/dashboard/create-ticket" passHref legacyBehavior>
          <Button asChild size="sm" variant="default" className="whitespace-nowrap shrink-0">
            <a>
              <PlusCircle className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">New Ticket</span>
            </a>
          </Button>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading && [...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center p-3 rounded-xl">
              <Skeleton className="h-10 w-10 rounded-full mr-3" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
          {!isLoading && chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`w-full flex items-center p-3 rounded-xl text-left transition-colors hover:bg-accent/50
                ${selectedChatId === chat.id ? "bg-accent text-accent-foreground" : ""}`}
            >
              <Avatar className="h-10 w-10 mr-3">
                <AvatarImage src={chat.userAvatar} alt={chat.userName || 'Chat User'} data-ai-hint="avatar person" />
                <AvatarFallback>{chat.userName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-sm truncate">{chat.userName || 'Unknown User'}</h3>
                  {chat.lastMessageTime && (
                    <p className="text-xs text-muted-foreground">{chat.lastMessageTime}</p>
                  )}
                </div>
                 <div className="flex justify-between items-start mt-1">
                    <div className="min-w-0">
                        {chat.studentNumber && (
                            <p className="text-xs font-medium text-muted-foreground truncate">{chat.studentNumber}</p>
                        )}
                        <p className="text-xs text-muted-foreground truncate">
                            {truncateText(chat.lastMessagePreview, MAX_PREVIEW_LENGTH)}
                        </p>
                    </div>
                  {chat.unreadCount && chat.unreadCount > 0 && (
                    <Badge variant="default" className="h-5 px-2 text-xs shrink-0 ml-2">
                      {chat.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          ))}
          {!isLoading && chats.length === 0 && (
             <p className="p-4 text-center text-sm text-muted-foreground">No chats found.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
