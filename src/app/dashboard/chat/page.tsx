
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

export default function ChatPage() {
  const [chats, setChats] = useState<Chat[]>(initialChats);
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
    setChats(prevChats => 
      prevChats.map(c => 
        c.id === chatId ? { ...c, unreadCount: 0 } : c
      )
    );
  };

  const handleSendMessage = (chatId: string, messageText: string, attachment?: Attachment) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      from: "student",
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: chats.find(c => c.id === chatId)?.userAvatar,
      attachment: attachment // Add attachment here
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
            lastMessagePreview: preview,
            lastMessageTime: newMessage.time,
          };
        }
        return chat;
      })
    );

    // Simulate staff reply (can be enhanced to acknowledge attachment)
    setTimeout(() => {
      let replyText = "Thanks for your message! We'll get back to you shortly.";
      if (attachment) {
        replyText = `Received your ${attachment.type === 'image' ? 'image' : 'document'} "${attachment.name}". Thanks! We'll review it and get back to you.`;
      }
      const staffReply: Message = {
        id: `msg-${Date.now() + 1}`,
        from: "staff",
        text: replyText,
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

  const chatWindowContainerDesktopClasses = `flex-1 h-full min-w-0 ${ // Added min-w-0
    isSidebarOpen
      ? 'w-[calc(100vw-16rem-400px)]' 
      : 'w-[calc(100vw-3rem-400px)]' 
  }`;
  
  if (isMobile) {
    return (
      <div className="h-full flex flex-col w-full p-0"> {/* Changed w-screen to w-full */}
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
    <div className="flex h-full w-full"> {/* Added w-full */}
      <div className="w-[400px] shrink-0 h-full border-r bg-card"> {/* Explicit width and ensure it doesn't shrink */}
        <ChatList chats={chats} selectedChatId={selectedChatId} onSelectChat={handleSelectChat} />
      </div>
      <div className={chatWindowContainerDesktopClasses}> 
        <ChatWindow chat={selectedChat} onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
}
