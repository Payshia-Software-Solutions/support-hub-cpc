
"use client";

import { useState, useEffect } from "react";
import { ChatList } from "@/components/dashboard/ChatList";
import { ChatWindow } from "@/components/dashboard/ChatWindow";
import { dummyChats as initialChats } from "@/lib/dummy-data";
import type { Chat, Message, Attachment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useMobileDetailActive } from '@/contexts/MobileDetailActiveContext';
import { useSidebar } from "@/components/ui/sidebar"; 

const STAFF_AVATAR = "https://placehold.co/40x40.png?text=Staff"; // Define staff avatar

export default function AdminChatPage() {
  const [chats, setChats] = useState<Chat[]>(initialChats); // Staff see all student chats
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { setIsMobileDetailActive } = useMobileDetailActive();
  const { open: isSidebarOpen } = useSidebar(); 

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768); 
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
    // Unread count logic might differ for admin, or not be relevant
    // For now, clearing unread for consistency if admin opens it
    setChats(prevChats => 
      prevChats.map(c => 
        c.id === chatId ? { ...c, unreadCount: 0 } : c
      )
    );
  };

  const handleSendMessage = (chatId: string, messageText: string, attachment?: Attachment) => {
    const targetChat = chats.find(c => c.id === chatId);
    if (!targetChat) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      from: "staff", // Message from staff
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: STAFF_AVATAR, // Staff avatar
      attachment: attachment
    };

    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.id === chatId) {
          const updatedMessages = [...chat.messages, newMessage];
          let preview = newMessage.text;
          if (newMessage.attachment) {
            preview = newMessage.attachment.type === 'image' ? `📷 Photo` : `📄 Document: ${newMessage.attachment.name}`;
            if (newMessage.text) preview = `${preview} - ${newMessage.text}`;
          }

          return {
            ...chat,
            messages: updatedMessages,
            lastMessagePreview: preview, // Staff's message becomes the preview
            lastMessageTime: newMessage.time,
          };
        }
        return chat;
      })
    );

    // No automatic student reply in admin context for now
  };

  const selectedChat = chats.find((chat) => chat.id === selectedChatId);

  const chatWindowContainerDesktopClasses = `flex-1 h-full min-w-0 ${
    isSidebarOpen
      ? 'w-[calc(100vw-16rem-400px)]' // Standard sidebar width
      : 'w-[calc(100vw-3rem-400px)]'  // Collapsed sidebar width (approx 3rem)
  }`;
  
  if (isMobile) {
    return (
      <div className="h-full flex flex-col w-full p-0">
        {!selectedChatId ? (
          // ChatList might need an admin variant if behavior differs greatly
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
            <ChatWindow 
              chat={selectedChat} 
              onSendMessage={handleSendMessage} 
              userRole="staff" // Specify role
              staffAvatar={STAFF_AVATAR} // Pass staff avatar
            />
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
        <ChatWindow 
          chat={selectedChat} 
          onSendMessage={handleSendMessage} 
          userRole="staff" // Specify role
          staffAvatar={STAFF_AVATAR} // Pass staff avatar
        />
      </div>
    </div>
  );
}
