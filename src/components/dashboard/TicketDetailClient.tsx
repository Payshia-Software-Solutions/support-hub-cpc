
"use client";

import { useState, useRef, useEffect } from "react";
import type { Ticket, Message, TicketStatus } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Paperclip, SendHorizonal, CalendarDays, User, ShieldCheck, MessageSquare } from "lucide-react"; 
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; 
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface TicketDetailClientProps {
  initialTicket: Ticket;
  onUpdateTicket: (updatedTicket: Ticket) => void;
  userRole: 'student' | 'staff'; // New prop
  staffAvatar?: string; // New prop for staff avatar
}

const priorityColors: Record<Ticket["priority"], string> = {
  High: "bg-red-500 hover:bg-red-600 text-white",
  Medium: "bg-yellow-500 hover:bg-yellow-600 text-white",
  Low: "bg-green-500 hover:bg-green-600 text-white",
};

const defaultStaffAvatar = "https://placehold.co/40x40.png?text=S";

export function TicketDetailClient({ initialTicket, onUpdateTicket, userRole, staffAvatar = defaultStaffAvatar }: TicketDetailClientProps) {
  const [ticket, setTicket] = useState<Ticket>(initialTicket);
  const [newMessage, setNewMessage] = useState("");
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [activeMobileTab, setActiveMobileTab] = useState<'info' | 'discussion'>('info');

  useEffect(() => {
    setTicket(initialTicket); 
  }, [initialTicket]);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
      // @ts-ignore
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [ticket.messages, activeMobileTab]);

  const handleStatusChange = (newStatus: TicketStatus) => {
    const updatedTicket = { ...ticket, status: newStatus, updatedAt: new Date().toISOString() };
    setTicket(updatedTicket);
    onUpdateTicket(updatedTicket); 
    toast({
      title: "Ticket Status Updated",
      description: `Ticket "${ticket.subject}" is now ${newStatus}.`,
    });
  };

  const handleSendMessage = () => {
    if (newMessage.trim() === "") return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      from: userRole, // Use userRole prop
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      avatar: userRole === "student" ? ticket.studentAvatar : staffAvatar,
    };
    
    const updatedTicket = { 
      ...ticket, 
      messages: [...ticket.messages, message],
      updatedAt: new Date().toISOString(),
    };
    setTicket(updatedTicket);
    onUpdateTicket(updatedTicket); 
    setNewMessage("");
    toast({
      title: userRole === 'staff' ? "Reply Sent" : "Message Sent",
      description: "Your reply has been added to the ticket.",
    });
  };
  
  const TicketInfoContent = () => (
    <>
      <CardHeader className="px-0 pt-0 pb-4">
        <CardTitle className="text-xl md:text-2xl font-headline">{ticket.subject}</CardTitle>
        <CardDescription>Ticket ID: {ticket.id}</CardDescription>
      </CardHeader>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-1">Status</h4>
          <Select 
            value={ticket.status} 
            onValueChange={(value: TicketStatus) => handleStatusChange(value)}
            disabled={userRole === 'student' && ticket.status === 'Closed'} // Student cannot reopen closed ticket
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Change status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-1">Priority</h4>
          <Badge className={cn("text-sm", priorityColors[ticket.priority])}>{ticket.priority}</Badge>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">Student:</span>
          <span>{ticket.studentName}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">Created:</span>
          <span>{new Date(ticket.createdAt).toLocaleString()}</span>
        </div>
        {ticket.updatedAt && (
          <div className="flex items-center gap-2 text-sm">
            <ShieldCheck className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">Last Updated:</span>
            <span>{new Date(ticket.updatedAt).toLocaleString()}</span>
          </div>
        )}
        <div>
          <h4 className="text-sm font-medium mb-1">Description</h4>
          <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-md whitespace-pre-line">{ticket.description}</p>
        </div>
      </div>
    </>
  );

  const TicketDiscussionContent = ({ isMobileContext = false }: { isMobileContext?: boolean }) => (
    <>
      <header 
          className={cn(
              "px-4 py-3 border-b bg-card flex items-center gap-3",
              !isMobileContext && "sticky top-0 z-10" 
          )}
      >
        <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-primary" />
        <h2 className="font-semibold text-md md:text-lg">Ticket Discussion</h2>
      </header>
      
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollAreaRef}>
        <div className="space-y-6">
          {ticket.messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-end gap-2 max-w-[85%] sm:max-w-[75%]", 
                message.from === userRole ? "ml-auto flex-row-reverse" : "mr-auto" // Adjusted for current user based on role
              )}
            >
              <Avatar className="h-8 w-8">
                 <AvatarImage 
                  src={message.from === 'student' ? ticket.studentAvatar : (message.avatar || staffAvatar)} 
                  alt={message.from} 
                  data-ai-hint="avatar person"
                />
                <AvatarFallback>
                  {message.from === 'student' ? ticket.studentName.charAt(0).toUpperCase() : 'S'}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  "p-3 rounded-xl shadow-sm",
                  message.from === userRole // Adjusted for current user based on role
                    ? "bg-primary/90 text-primary-foreground rounded-br-none"
                    : "bg-card border rounded-bl-none"
                )}
              >
                <p className="text-sm">{message.text}</p>
                <p className="text-xs mt-1 opacity-70">
                  {message.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <footer className="px-4 py-3 border-t bg-card sticky bottom-0 z-10">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Textarea
            placeholder="Type your reply..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1 rounded-lg px-4 py-2 focus-visible:ring-primary min-h-[40px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button size="icon" onClick={handleSendMessage} className="rounded-full bg-primary hover:bg-primary/90 self-end">
            <SendHorizonal className="h-5 w-5" />
          </Button>
        </div>
      </footer>
    </>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col h-full w-full">
        <div className="p-2 border-b bg-card sticky top-0 z-10">
          <div className="flex w-full">
            <Button
              variant={activeMobileTab === 'info' ? 'default' : 'outline'}
              onClick={() => setActiveMobileTab('info')}
              className="flex-1 rounded-r-none"
            >
              Info
            </Button>
            <Button
              variant={activeMobileTab === 'discussion' ? 'default' : 'outline'}
              onClick={() => setActiveMobileTab('discussion')}
              className="flex-1 rounded-l-none border-l-0"
            >
              Discussion
            </Button>
          </div>
        </div>

        {activeMobileTab === 'info' && (
          <ScrollArea className="flex-1 bg-card">
            <div className="p-4">
              <TicketInfoContent />
            </div>
          </ScrollArea>
        )}

        {activeMobileTab === 'discussion' && (
          <div className="flex-1 flex flex-col bg-background overflow-hidden">
            <TicketDiscussionContent isMobileContext={true} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full max-h-screen overflow-hidden">
      <div className="lg:w-1/3 lg:max-w-md xl:max-w-lg lg:border-r bg-card overflow-y-auto p-4 md:p-6">
        <TicketInfoContent />
      </div>
      <div className="flex-1 flex flex-col bg-background overflow-hidden">
        <TicketDiscussionContent />
      </div>
    </div>
  );
}
