
"use client";

import { useState, useEffect } from "react";
import { ChatList } from "@/components/dashboard/ChatList";
import { ChatWindow } from "@/components/dashboard/ChatWindow";
import { dummyChats as initialChats } from "@/lib/dummy-data";
import type { Chat, Message } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useMobileDetailActive } from '@/contexts/MobileDetailActiveContext';
import { useSidebar } from "@/components/ui/sidebar"; // Import useSidebar

export default function ChatPage() {
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { setIsMobileDetailActive } = useMobileDetailActive();
  const { open: isSidebarOpen } = useSidebar(); // Get sidebar state

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768); // md breakpoint
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsMobileDetailActive(!!selectedChatId);
    } else {
      setIsMobileDetailActive(false); 
    }
  }, [isMobile, selectedChatId, setIsMobileDetailActive]);

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

  const chatWindowContainerDesktopClasses = `h-full min-w-0 ${
    isSidebarOpen
      ? 'w-[calc(100vw-16rem-400px)]'
      : 'w-[calc(100vw-3rem-400px)]' 
  }`;
  // Note: Used 3rem for collapsed sidebar width (standard icon width) instead of 50px for better consistency.
  // And 400px for ChatList as per your example. If ChatList is 384px, adjust calc accordingly.

  if (isMobile) {
    return (
      <div className="h-full flex flex-col w-screen p-0">
        {!selectedChatId ? (
          <ChatList chats={chats} selectedChatId={selectedChatId} onSelectChat={handleSelectChat} />
        ) : (
          <>
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
    <div className="flex h-full w-full">
      <div className="w-[400px] shrink-0 h-full border-r bg-card">
        <ChatList chats={chats} selectedChatId={selectedChatId} onSelectChat={handleSelectChat} />
      </div>
      <div className={chatWindowContainerDesktopClasses}> 
        <ChatWindow chat={selectedChat} onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
}
