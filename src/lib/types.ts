export interface Message {
  id: string;
  from: 'student' | 'staff';
  text: string;
  time: string;
  avatar?: string;
}

export interface Chat {
  id: string;
  userName: string;
  userAvatar: string;
  messages: Message[];
  lastMessagePreview?: string; // For ChatList display
  lastMessageTime?: string; // For ChatList display
  unreadCount?: number;
}

export type TicketStatus = 'Open' | 'In Progress' | 'Closed';
export type TicketPriority = 'Low' | 'Medium' | 'High';

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt?: string;
  studentName: string;
  studentAvatar: string;
  messages: Message[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string; // ISO string or human-readable
  author?: string;
  category?: 'General' | 'Academic' | 'Events' | 'Urgent';
  isNew?: boolean;
}
