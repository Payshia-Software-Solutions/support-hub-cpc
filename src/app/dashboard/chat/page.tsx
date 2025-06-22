
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
import { getChats, createChatMessage, getChatMessages } from "@/lib/api";
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

  const selectedChat = chats?.find((chat) => chat.id === selectedChatId);

  // Fetch messages for the currently selected chat
  const { data: selectedChatMessages } = useQuery<Message[]>({
    queryKey: ['chatMessages', selectedChatId],
    queryFn: () => getChatMessages(selectedChatId!),
    enabled: !!selectedChatId, // Only run this query when a chat is selected
  });


  const sendMessageMutation = useMutation({
    mutationFn: createChatMessage,
    onMutate: async (newMessagePayload) => {
        const { chatId, text, from, attachment } = newMessagePayload;
        
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        await queryClient.cancelQueries({ queryKey: ['chatMessages', chatId] });
        await queryClient.cancelQueries({ queryKey: ['chats'] });

        // Snapshot the previous value
        const previousMessages = queryClient.getQueryData<Message[]>(['chatMessages', chatId]);
        const previousChats = queryClient.getQueryData<Chat[]>(['chats']);

        // Optimistically update to the new message
        const studentAvatar = selectedChat?.userAvatar;
        const optimisticMessage: Message = {
            id: `optimistic-${Date.now()}`,
            from: from,
            text: text,
            time: new Date().toISOString(),
            avatar: studentAvatar,
            attachment: attachment,
        };
        queryClient.setQueryData<Message[]>(['chatMessages', chatId], (old) => 
            old ? [...old, optimisticMessage] : [optimisticMessage]
        );

        // Optimistically update the chat list
        queryClient.setQueryData<Chat[]>(['chats'], (oldChats) => {
          if (!oldChats) return [];
          const newChats = oldChats.map(chat => {
              if (chat.id === chatId) {
                  return {
                      ...chat,
                      lastMessagePreview: text,
                      lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(' ', ''),
                  };
              }
              return chat;
          });
          // Move the updated chat to the top
          const updatedChat = newChats.find(c => c.id === chatId);
          const otherChats = newChats.filter(c => c.id !== chatId);
          return updatedChat ? [updatedChat, ...otherChats] : newChats;
        });

        return { previousMessages, previousChats, chatId };
    },
    onError: (err: Error, variables, context) => {
        // Rollback on failure
        if (context?.previousMessages) {
            queryClient.setQueryData(['chatMessages', context.chatId], context.previousMessages);
        }
        if (context?.previousChats) {
            queryClient.setQueryData(['chats'], context.previousChats);
        }
        toast({
            variant: "destructive",
            title: "Failed to send message",
            description: err.message,
        });
    },
    onSettled: (data, error, variables) => {
        // Invalidate both queries to refetch from server and sync state
        queryClient.invalidateQueries({ queryKey: ['chatMessages', variables.chatId] });
        queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
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

    const newMessagePayload = {
      chatId,
      from: "student" as const,
      text: messageText,
      attachment, // Pass the attachment object
    };

    sendMessageMutation.mutate(newMessagePayload);
  };

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
            <div className="p-2 border-b bg-card shrink-0"> 
              <Button 
                variant="ghost"
                onClick={() => setSelectedChatId(null)} 
                className="text-sm w-full justify-start"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Chats
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatWindow 
                key={selectedChat?.id}
                chat={selectedChat} 
                onSendMessage={handleSendMessage} 
                userRole="student"
              />
            </div>
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
            key={selectedChat?.id}
            chat={selectedChat} 
            onSendMessage={handleSendMessage} 
            userRole="student"
          />
        )}
      </div>
    </div>
  );
}
