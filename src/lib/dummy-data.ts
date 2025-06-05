import type { Chat, Ticket, Announcement, UserProfile, PaymentRecord, StaffMember } from './types';

export const dummyChats: Chat[] = [
  {
    id: 'chat1',
    userName: 'Student Alice',
    userAvatar: 'https://images.unsplash.com/photo-1740989475605-355ada18c3fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxhdmF0YXIlMjBwZXJzb258ZW58MHx8fHwxNzQ5MDU0Mzg0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    messages: [
      { id: 'm1-1', from: 'student', text: 'Hi there! I need some help with my account.', time: '10:00 AM', avatar: 'https://placehold.co/40x40.png' },
      { id: 'm1-2', from: 'staff', text: 'Hello Alice! I can help with that. What seems to be the problem?', time: '10:01 AM', avatar: 'https://placehold.co/40x40.png?text=Staff' },
      { id: 'm1-3', from: 'student', text: 'I can\'t seem to update my profile picture.', time: '10:02 AM', avatar: 'https://placehold.co/40x40.png' },
    ],
    lastMessagePreview: 'I can\'t seem to update my profile picture.',
    lastMessageTime: '10:02 AM',
    unreadCount: 1,
  },
  {
    id: 'chat2',
    userName: 'Student Bob',
    userAvatar: 'https://images.unsplash.com/photo-1621398945253-00498f153e4b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxhdmF0YXIlMjBwZXJzb258ZW58MHx8fHwxNzQ5MDU0Mzg0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    messages: [
      { id: 'm2-1', from: 'student', text: 'Good morning, I have a question about the library hours.', time: '11:30 AM', avatar: 'https://placehold.co/40x40.png' },
      { id: 'm2-2', from: 'staff', text: 'Hi Bob, the library is open from 9 AM to 8 PM on weekdays.', time: '11:31 AM', avatar: 'https://placehold.co/40x40.png?text=Staff' },
    ],
    lastMessagePreview: 'Hi Bob, the library is open from 9 AM to 8 PM on weekdays.',
    lastMessageTime: '11:31 AM',
  },
  {
    id: 'chat3',
    userName: 'Student Carol',
    userAvatar: 'https://images.unsplash.com/photo-1621398945253-00498f153e4b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxhdmF0YXIlMjBwZXJzb258ZW58MHx8fHwxNzQ5MDU0Mzg0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    messages: [
      { id: 'm3-1', from: 'student', text: 'Is the deadline for the MATH101 assignment extended?', time: 'Yesterday', avatar: 'https://placehold.co/40x40.png' },
    ],
    lastMessagePreview: 'Is the deadline for the MATH101 assignment extended?',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
  },
];

export const dummyTickets: Ticket[] = [
  {
    id: 'ticket1',
    subject: 'Login Issue with Portal',
    description: 'I am unable to log in to the student portal. It keeps saying "Invalid credentials" even though I am sure my password is correct. I have tried resetting it, but the issue persists. This has been happening since yesterday morning.',
    priority: 'High',
    status: 'Open',
    createdAt: '2024-07-15',
    updatedAt: '2024-07-15',
    studentName: 'Student David',
    studentAvatar: 'https://placehold.co/100x100.png?text=SD',
    messages: [
      { id: 't1-m1', from: 'student', text: 'I can’t log in to the portal. It says invalid credentials.', time: '09:00 AM', avatar: 'https://placehold.co/40x40.png?text=SD' },
      { id: 't1-m2', from: 'staff', text: 'Hi David, sorry to hear that. Could you please try clearing your browser cache and cookies and try again?', time: '09:05 AM', avatar: 'https://placehold.co/40x40.png?text=Staff' },
      { id: 't1-m3', from: 'student', text: 'I tried that, but it still doesn\'t work.', time: '09:15 AM', avatar: 'https://placehold.co/40x40.png?text=SD' },
    ],
    assignedTo: 'Staff Jane',
    assigneeAvatar: 'https://placehold.co/40x40.png?text=SJ',
    isLocked: false,
    lockedByStaffId: undefined,
  },
  {
    id: 'ticket2',
    subject: 'Password Reset Request',
    description: 'I have forgotten my password and the automated reset system is not sending me the email. I need to access my account to submit an assignment.',
    priority: 'Medium',
    status: 'In Progress',
    createdAt: '2024-07-14',
    updatedAt: '2024-07-15',
    studentName: 'Student Eve',
    studentAvatar: 'https://placehold.co/100x100.png?text=SE',
    messages: [
      { id: 't2-m1', from: 'student', text: 'I need to reset my password, but the email isn\'t arriving.', time: '02:30 PM', avatar: 'https://placehold.co/40x40.png?text=SE' },
      { id: 't2-m2', from: 'staff', text: 'Thanks for reaching out, Eve. We are looking into this and will manually reset it for you. Please allow some time.', time: '02:35 PM', avatar: 'https://placehold.co/40x40.png?text=Staff' },
    ],
    isLocked: false,
    lockedByStaffId: undefined,
  },
  {
    id: 'ticket3',
    subject: 'Unable to Access Course Materials for CS101',
    description: 'I enrolled in CS101, but the course materials section is empty. My classmates can see them. Can you please check?',
    priority: 'Low',
    status: 'Closed',
    createdAt: '2024-07-12',
    updatedAt: '2024-07-13',
    studentName: 'Student Frank',
    studentAvatar: 'https://placehold.co/100x100.png?text=SF',
    messages: [
      { id: 't3-m1', from: 'student', text: 'The CS101 materials are not showing up for me.', time: '10:00 AM', avatar: 'https://placehold.co/40x40.png?text=SF' },
      { id: 't3-m2', from: 'staff', text: 'Hi Frank, we\'ve checked your enrollment and it seems there was a sync issue. It should be resolved now. Please check again.', time: '11:15 AM', avatar: 'https://placehold.co/40x40.png?text=Staff' },
      { id: 't3-m3', from: 'student', text: 'Yes, it works now! Thank you so much.', time: '11:20 AM', avatar: 'https://placehold.co/40x40.png?text=SF' },
      { id: 't3-m4', from: 'staff', text: 'You\'re welcome! Glad we could help.', time: '11:21 AM', avatar: 'https://placehold.co/40x40.png?text=Staff' },
    ],
    assignedTo: 'Staff John',
    assigneeAvatar: 'https://placehold.co/40x40.png?text=SJn',
    isLocked: false,
    lockedByStaffId: undefined,
  },
];

export const dummyAnnouncements: Announcement[] = [
  {
    id: 'anno1',
    title: 'Upcoming System Maintenance',
    content: 'Please be advised that there will be a system maintenance on July 30th, from 2 AM to 4 AM. Access to the portal might be intermittent during this period. We apologize for any inconvenience.',
    date: '2024-07-28',
    author: 'IT Department',
    category: 'Urgent',
    isNew: true,
  },
  {
    id: 'anno2',
    title: 'New Library Study Rooms Available',
    content: 'We are pleased to announce the opening of 5 new group study rooms on the 3rd floor of the main library. Rooms can be booked online via the library portal.',
    date: '2024-07-27',
    author: 'Library Services',
    category: 'General',
    isNew: true,
  },
  {
    id: 'anno3',
    title: 'Guest Lecture: AI in Modern Science',
    content: 'Join us for an exciting guest lecture by Dr. Evelyn Reed on "The Impact of Artificial Intelligence in Modern Scientific Research". Event will be held on August 5th at 3 PM in the Grand Auditorium. Seats are limited.',
    date: '2024-07-25',
    author: 'Faculty of Science',
    category: 'Events',
    isNew: false,
  },
  {
    id: 'anno4',
    title: 'Reminder: Course Add/Drop Deadline',
    content: 'This is a friendly reminder that the deadline to add or drop courses for the current semester is July 31st. Please make any necessary changes to your schedule before this date.',
    date: '2024-07-24',
    author: 'Registrar\'s Office',
    category: 'Academic',
    isNew: false,
  },
];


export const dummyUsers: UserProfile[] = [
  { id: 'user1', name: 'Student Alice', email: 'alice@example.com', role: 'student', avatar: 'https://placehold.co/100x100.png?text=SA', joinedDate: '2023-09-01', lastLogin: '2024-07-28T10:00:00Z' },
  { id: 'user2', name: 'Student Bob', email: 'bob@example.com', role: 'student', avatar: 'https://placehold.co/100x100.png?text=SB', joinedDate: '2023-09-05', lastLogin: '2024-07-27T11:30:00Z' },
  { id: 'user3', name: 'Staff Jane', email: 'jane.staff@example.com', role: 'staff', avatar: 'https://placehold.co/100x100.png?text=SJ', joinedDate: '2022-01-15', lastLogin: '2024-07-28T14:00:00Z' },
  { id: 'user4', name: 'Staff John', email: 'john.staff@example.com', role: 'staff', avatar: 'https://placehold.co/100x100.png?text=SJn', joinedDate: '2021-05-20', lastLogin: '2024-07-28T09:15:00Z' },
];

export const dummyPayments: PaymentRecord[] = [
  { id: 'payment1', userId: 'user1', userName: 'Student Alice', amount: 500, currency: 'USD', date: '2024-07-01', status: 'Completed', description: 'Fall Semester Tuition Fee' },
  { id: 'payment2', userId: 'user2', userName: 'Student Bob', amount: 75, currency: 'USD', date: '2024-07-10', status: 'Completed', description: 'Library Fine' },
  { id: 'payment3', userId: 'user1', userName: 'Student Alice', amount: 30, currency: 'USD', date: '2024-07-15', status: 'Pending', description: 'Parking Permit' },
  { id: 'payment4', userId: 'user2', userName: 'Student Bob', amount: 500, currency: 'USD', date: '2024-06-20', status: 'Failed', description: 'Spring Semester Resit Fee' },
];

export const dummyStaffMembers: StaffMember[] = [
  { id: 'staff1', name: 'Staff Jane', avatar: 'https://placehold.co/40x40.png?text=SJ' },
  { id: 'staff2', name: 'Staff John', avatar: 'https://placehold.co/40x40.png?text=SJn' },
  { id: 'staff3', name: 'Staff Alex', avatar: 'https://placehold.co/40x40.png?text=SAx' },
];
