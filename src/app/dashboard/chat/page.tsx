
"use client";

import { useState, useEffect } from "react";
import { ChatList } from "@/components/dashboard/ChatList";
import { ChatWindow } from "@/components/dashboard/ChatWindow";
import { dummyChats as initialChats } from "@/lib/dummy-data";
import type { Chat, Message } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ChatPage() {
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768); // md breakpoint
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    setChats(prevChats => 
      prevChats.map(c => 
        c.id === chatId ? { ...c, unreadCount: 0 } : c
      )
    );
  };

  const handleSendMessage = (chatId: string, messageText: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      from: "student",
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: chats.find(c => c.id === chatId)?.userAvatar
    };

    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.id === chatId) {
          const updatedMessages = [...chat.messages, newMessage];
          return {
            ...chat,
            messages: updatedMessages,
            lastMessagePreview: newMessage.text,
            lastMessageTime: newMessage.time,
          };
        }
        return chat;
      })
    );

    setTimeout(() => {
      const staffReply: Message = {
        id: `msg-${Date.now() + 1}`,
        from: "staff",
        text: "Thanks for your message! We'll get back to you shortly.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: "https://placehold.co/40x40.png"
      };
      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id === chatId) {
            const updatedMessages = [...chat.messages, staffReply];
            return {
              ...chat,
              messages: updatedMessages,
              lastMessagePreview: staffReply.text,
              lastMessageTime: staffReply.time,
            };
          }
          return chat;
        })
      );
    }, 1500);
  };

  const selectedChat = chats.find((chat) => chat.id === selectedChatId);

  if (isMobile) {
    return (
      <div className="h-full flex flex-col">
        {!selectedChatId ? (
          <ChatList chats={chats} selectedChatId={selectedChatId} onSelectChat={handleSelectChat} />
        ) : (
          <>
            {/* This local header is sticky *within* the ChatPage's scroll context, below the global MobileHeader */}
            <div className="p-2 border-b bg-card sticky top-0 z-20"> 
              <Button 
                variant="ghost"
                onClick={() => setSelectedChatId(null)} 
                className="text-sm w-full justify-start"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Chats
              </Button>
            </div>
            <ChatWindow chat={selectedChat} onSendMessage={handleSendMessage} />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="w-1/3 max-w-sm min-w-[300px] h-full">
        <ChatList chats={chats} selectedChatId={selectedChatId} onSelectChat={handleSelectChat} />
      </div>
      <div className="flex-1 h-full">
        <ChatWindow chat={selectedChat} onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
}
