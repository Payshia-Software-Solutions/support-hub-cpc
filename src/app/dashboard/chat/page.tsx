
"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChatWindow } from "@/components/dashboard/ChatWindow";
import type { Chat, Message, Attachment } from "@/lib/types";
import { getChats, createChatMessage, createChat } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquarePlus, ArrowLeft } from "lucide-react";
import { useMobileDetailActive } from '@/contexts/MobileDetailActiveContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { TypingIndicator } from "@/components/ui/typing-indicator";


export default function ChatPage() {
  const queryClient = useQueryClient();
  const { setIsMobileDetailActive } = useMobileDetailActive();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const router = useRouter();

  const { data: chats, isLoading, isError, error } = useQuery<Chat[]>({
    queryKey: ['chats', user?.username],
    queryFn: () => getChats(user!.username!),
    enabled: !!user?.username,
    retry: (failureCount, err: any) => {
      // Do not retry on 404s, as it means no chat exists
      if (err.message.includes('404')) {
        return false;
      }
      // Retry for other errors
      return failureCount < 3;
    },
  });

  const studentChat = chats?.[0];

  useEffect(() => {
    // On mobile, this page acts as a detail view, so we hide the main bottom dock.
    if (isMobile) {
        setIsMobileDetailActive(true);
        // Cleanup on unmount to reset the state for other pages
        return () => setIsMobileDetailActive(false);
    }
  }, [isMobile, setIsMobileDetailActive]);

  const createChatMutation = useMutation({
    mutationFn: (studentInfo: { studentNumber: string, studentAvatar: string }) => createChat(studentInfo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats', user?.username] });
      toast({
        title: "Chat Created!",
        description: "You can now start messaging with support staff.",
      });
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to create chat",
        description: err.message,
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: createChatMessage,
    onMutate: async (newMessagePayload) => {
        const { chatId, text, from, attachment } = newMessagePayload;
        
        await queryClient.cancelQueries({ queryKey: ['chatMessages', chatId] });
        await queryClient.cancelQueries({ queryKey: ['chats', user?.username] });

        const previousMessages = queryClient.getQueryData<Message[]>(['chatMessages', chatId]);
        const previousChats = queryClient.getQueryData<Chat[]>(['chats', user?.username]);

        const studentAvatar = studentChat?.userAvatar;
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

        queryClient.setQueryData<Chat[]>(['chats', user?.username], (oldChats) => {
          if (!oldChats) return [];
          const updatedChat = oldChats.find(c => c.id === chatId);
          if (!updatedChat) return oldChats;
          
          const newChat = {
                ...updatedChat,
                lastMessagePreview: text,
                lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(' ', ''),
            };

          return [newChat, ...oldChats.filter(c => c.id !== chatId)];
        });

        return { previousMessages, previousChats, chatId };
    },
    onError: (err: Error, variables, context) => {
        if (context?.previousMessages) {
            queryClient.setQueryData(['chatMessages', context.chatId], context.previousMessages);
        }
        if (context?.previousChats) {
            queryClient.setQueryData(['chats', user?.username], context.previousChats);
        }
        toast({
            variant: "destructive",
            title: "Failed to send message",
            description: err.message,
        });
    },
    onSettled: (data, error, variables) => {
        queryClient.invalidateQueries({ queryKey: ['chatMessages', variables.chatId] });
        queryClient.invalidateQueries({ queryKey: ['chats', user?.username] });
    },
  });

  const handleSendMessage = (chatId: string, messageText: string, attachment?: Attachment) => {
    sendMessageMutation.mutate({
      chatId,
      from: "student" as const,
      text: messageText,
      attachment,
    });
  };

  if (isLoading) {
      return (
          <div className="flex flex-col h-full">
              <div className="p-4 border-b bg-card flex items-center gap-3 shrink-0">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-16" />
                  </div>
              </div>
              <div className="flex-1 p-4 space-y-4 overflow-hidden">
                <div className="flex items-end gap-2 max-w-[75%] mr-auto">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="p-1 rounded-xl shadow-sm bg-card border rounded-bl-none">
                    <TypingIndicator />
                  </div>
                </div>
              </div>
              <div className="p-4 border-t bg-card shrink-0">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-10 flex-1 rounded-full" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </div>
              </div>
          </div>
      )
  }

  if (isError) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-background text-destructive p-4">
         <p className="text-lg font-semibold">Could not load chat</p>
         <p className="text-sm">{error?.message || "An unknown error occurred."}</p>
      </div>
    );
  }

  if (!studentChat) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-background text-center p-8">
        <MessageSquarePlus className="w-24 h-24 mb-6 text-muted-foreground" />
        <h2 className="text-2xl font-bold font-headline mb-2">Start a Conversation</h2>
        <p className="text-muted-foreground mb-8 max-w-sm">
          Have a question or need help? Click the button below to start a new chat with our support staff.
        </p>
        <Button 
          onClick={() => {
            if (user && user.username) {
              createChatMutation.mutate({
                studentNumber: user.username,
                studentAvatar: user.avatar,
              })
            }
          }}
          disabled={createChatMutation.isPending || !user}
          size="lg"
        >
          {createChatMutation.isPending ? 'Starting...' : 'Start New Chat'}
        </Button>
      </div>
    );
  }

  const chatWindowComponent = (
     <ChatWindow 
        key={studentChat?.id}
        chat={studentChat} 
        onSendMessage={handleSendMessage} 
        userRole="student"
      />
  );
  
  if (isMobile) {
    return (
      <div className="h-full flex flex-col w-full p-0">
        <div className="p-2 border-b bg-card shrink-0"> 
          <Button 
            variant="ghost"
            onClick={() => router.push('/dashboard/tickets')} 
            className="text-sm w-full justify-start"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          {chatWindowComponent}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
        {chatWindowComponent}
    </div>
  );
}
