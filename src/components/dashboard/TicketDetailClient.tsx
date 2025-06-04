
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
import { Paperclip, SendHorizonal, CalendarDays, User, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface TicketDetailClientProps {
  initialTicket: Ticket;
  onUpdateTicket: (updatedTicket: Ticket) => void; // Callback to update parent state
}

const priorityColors: Record<Ticket["priority"], string> = {
  High: "bg-red-500 hover:bg-red-600 text-white",
  Medium: "bg-yellow-500 hover:bg-yellow-600 text-white",
  Low: "bg-green-500 hover:bg-green-600 text-white",
};

const statusColors: Record<Ticket["status"], string> = {
  Open: "bg-blue-500 hover:bg-blue-600 text-white",
  "In Progress": "bg-purple-500 hover:bg-purple-600 text-white",
  Closed: "bg-gray-500 hover:bg-gray-600 text-white",
};

export function TicketDetailClient({ initialTicket, onUpdateTicket }: TicketDetailClientProps) {
  const [ticket, setTicket] = useState<Ticket>(initialTicket);
  const [newMessage, setNewMessage] = useState("");
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTicket(initialTicket); // Sync with initialTicket prop if it changes
  }, [initialTicket]);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
      // @ts-ignore
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [ticket.messages]);

  const handleStatusChange = (newStatus: TicketStatus) => {
    const updatedTicket = { ...ticket, status: newStatus, updatedAt: new Date().toISOString() };
    setTicket(updatedTicket);
    onUpdateTicket(updatedTicket); // Notify parent
    toast({
      title: "Ticket Status Updated",
      description: `Ticket "${ticket.subject}" is now ${newStatus}.`,
    });
    console.log(`Ticket ${ticket.id} status changed to ${newStatus}`);
  };

  const handleSendMessage = () => {
    if (newMessage.trim() === "") return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      from: "student", // Assuming student is replying, can be dynamic
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      avatar: ticket.studentAvatar,
    };
    
    const updatedTicket = { 
      ...ticket, 
      messages: [...ticket.messages, message],
      updatedAt: new Date().toISOString(),
    };
    setTicket(updatedTicket);
    onUpdateTicket(updatedTicket); // Notify parent
    setNewMessage("");
    toast({
      title: "Message Sent",
      description: "Your reply has been added to the ticket.",
    });
    console.log(`Message sent for ticket ${ticket.id}: ${newMessage}`);
  };
  
  const staffAvatar = "https://placehold.co/40x40.png";

  return (
    <div className="flex flex-col lg:flex-row h-full max-h-screen overflow-hidden">
      {/* Ticket Info Panel */}
      <div className="lg:w-1/3 lg:border-r bg-card overflow-y-auto p-4">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-2xl font-headline">{ticket.subject}</CardTitle>
          <CardDescription>Ticket ID: {ticket.id}</CardDescription>
        </CardHeader>
        
        <div className="space-y-4 mt-4">
          <div>
            <h4 className="text-sm font-medium mb-1">Status</h4>
            <Select value={ticket.status} onValueChange={(value: TicketStatus) => handleStatusChange(value)}>
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
            <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-md">{ticket.description}</p>
          </div>
        </div>
      </div>

      {/* Chat/Messages Panel */}
      <div className="flex-1 flex flex-col bg-background overflow-hidden">
        <header className="px-4 py-3 border-b bg-card flex items-center gap-3 sticky top-0 z-10">
          <MessageSquareIcon className="w-6 h-6 text-primary" />
          <h2 className="font-semibold text-lg">Ticket Discussion</h2>
        </header>
        
        <ScrollArea className="flex-1 px-4 py-4" ref={scrollAreaRef}>
          <div className="space-y-6">
            {ticket.messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-end gap-2 max-w-[75%]",
                  message.from === "student" ? "ml-auto flex-row-reverse" : "mr-auto"
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
                    message.from === "student"
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
      </div>
    </div>
  );
}

function MessageSquareIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

