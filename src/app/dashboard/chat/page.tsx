
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChatList } from "@/components/dashboard/ChatList";
import { ChatWindow } from "@/components/dashboard/ChatWindow";
import type { Chat, Message, Attachment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useMobileDetailActive } from '@/contexts/MobileDetailActiveContext';
import { useSidebar } from "@/components/ui/sidebar"; 
import { getChats, createChatMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export default function ChatPage() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { setIsMobileDetailActive } = useMobileDetailActive();
  const { open: isSidebarOpen } = useSidebar(); 
  const queryClient = useQueryClient();

  const { data: chats, isLoading, isError, error } = useQuery<Chat[]>({
    queryKey: ['chats'],
    queryFn: getChats,
  });

  const sendMessageMutation = useMutation({
    mutationFn: createChatMessage,
    onSuccess: (data, variables) => {
      // Invalidate queries to refetch chat messages and the chat list
      queryClient.invalidateQueries({ queryKey: ['chatMessages', variables.chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] }); // To update last message preview
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: err.message,
      });
    }
  });

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
  };

  const handleSendMessage = (chatId: string, messageText: string, attachment?: Attachment) => {
    const currentChat = chats?.find(c => c.id === chatId);
    if (!currentChat) return;

    // We send the new message payload to the API
    // The API is responsible for creating the message with ID, timestamp, etc.
    const newMessagePayload = {
      chatId,
      from: "student",
      text: messageText,
      // Attachment handling would need API support for file uploads.
      // We are not sending the file itself here.
    };

    sendMessageMutation.mutate(newMessagePayload, {
      onSuccess: () => {
        // Simulate a staff reply after a short delay
        setTimeout(() => {
          const staffReplyPayload = {
            chatId,
            from: "staff",
            text: "Thanks for your message! We'll get back to you shortly.",
          };
          sendMessageMutation.mutate(staffReplyPayload);
        }, 1500);
      }
    });
  };

  const selectedChat = chats?.find((chat) => chat.id === selectedChatId);

  const chatWindowContainerDesktopClasses = `flex-1 h-full min-w-0 ${
    isSidebarOpen
      ? 'w-[calc(100vw-16rem-400px)]'
      : 'w-[calc(100vw-3rem-400px)]' 
  }`;
  
  if (isMobile) {
    return (
      <div className="h-full flex flex-col w-full p-0">
        {!selectedChatId ? (
          <ChatList 
            chats={chats || []} 
            selectedChatId={selectedChatId} 
            onSelectChat={handleSelectChat}
            isLoading={isLoading} 
          />
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
              userRole="student"
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full w-full">
      <div className="w-[400px] shrink-0 h-full border-r bg-card">
        <ChatList 
          chats={chats || []} 
          selectedChatId={selectedChatId} 
          onSelectChat={handleSelectChat} 
          isLoading={isLoading}
        />
      </div>
      <div className={chatWindowContainerDesktopClasses}> 
         {isError && (
          <div className="flex flex-col h-full items-center justify-center bg-background text-destructive p-4">
             <p>Error: {error.message}</p>
          </div>
        )}
        {!isError && (
          <ChatWindow 
            chat={selectedChat} 
            onSendMessage={handleSendMessage} 
            userRole="student"
          />
        )}
      </div>
    </div>
  );
}
