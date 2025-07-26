
import type { UserProfile, PaymentRecord, StaffMember, Course, Recording } from './types';

// Note: Most dummy data is now obsolete and replaced by API calls.
// This file is kept for data that might not come from the API in the prototype,
// such as the list of staff members for the assignment dropdown.

export const dummyStaffMembers: StaffMember[] = [
  { id: 'staff1', name: 'Staff Jane', username: 'jane.staff@example.com', avatar: 'https://placehold.co/40x40.png?text=SJ', email: 'jane.staff@example.com' },
  { id: 'staff2', name: 'Staff John', username: 'john.staff@example.com', avatar: 'https://placehold.co/40x40.png?text=SJn', email: 'john.staff@example.com' },
  { id: 'staff3', name: 'Staff Alex', username: 'alex.staff@example.com', avatar: 'https://placehold.co/40x40.png?text=SAx', email: 'alex.staff@example.com' },
];

export const dummyUsers: UserProfile[] = [
  { id: 'user1', name: 'Student Alice', email: 'alice@example.com', role: 'student', avatar: 'https://placehold.co/100x100.png?text=SA', joinedDate: '2023-09-01', lastLogin: '2024-07-28T10:00:00Z' },
  { id: 'user2', name: 'Student Bob', email: 'bob@example.com', role: 'student', avatar: 'https://placehold.co/100x100.png?text=SB', joinedDate: '2023-09-05', lastLogin: '2024-07-27T11:30:00Z' },
  { id: 'user3', name: 'Staff Jane', email: 'jane.staff@example.com', role: 'staff', avatar: 'https://placehold.co/100x100.png?text=SJ', joinedDate: '2022-01-15', lastLogin: '2024-07-28T14:00:00Z', username: 'jane.staff@example.com' },
  { id: 'user4', name: 'Staff John', email: 'john.staff@example.com', role: 'staff', avatar: 'https://placehold.co/100x100.png?text=SJn', joinedDate: '2021-05-20', lastLogin: '2024-07-28T09:15:00Z', username: 'john.staff@example.com' },
];

export const dummyPayments: PaymentRecord[] = [
  { id: 'payment1', userId: 'user1', userName: 'Student Alice', amount: 500, currency: 'USD', date: '2024-07-01', status: 'Completed', description: 'Fall Semester Tuition Fee' },
  { id: 'payment2', userId: 'user2', userName: 'Student Bob', amount: 75, currency: 'USD', date: '2024-07-10', status: 'Completed', description: 'Library Fine' },
  { id: 'payment3', userId: 'user1', userName: 'Student Alice', amount: 30, currency: 'USD', date: '2024-07-15', status: 'Pending', description: 'Parking Permit' },
  { id: 'payment4', userId: 'user2', userName: 'Student Bob', amount: 500, currency: 'USD', date: '2024-06-20', status: 'Failed', description: 'Spring Semester Resit Fee' },
];

export const dummyCourses: Course[] = [
  { id: 'course1', courseCode: 'CPCC15', name: 'Certificate Course in Pharmacy Practice' },
  { id: 'course2', courseCode: 'CPCC16', name: 'Advanced Course in Pharmacy Practice' },
  { id: 'course3', courseCode: 'NUTR01', name: 'Diploma in Nutrition' },
  { id: 'course4', courseCode: 'COUNS01', name: 'Advanced Certificate in Counseling' },
];

export const dummyRecordings: Recording[] = [
  { id: 'rec1', courseId: 'course1', title: 'Introduction to Pharmacy', description: 'Session 1: A basic overview of the field.', youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnailUrl: 'https://placehold.co/600x400.png', dataAiHint: "lecture presentation", attachmentUrl: "#", attachmentName: "Session_1_Slides.pdf" },
  { id: 'rec2', courseId: 'course1', title: 'Pharmacokinetics', description: 'Session 2: Understanding how drugs move through the body.', youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnailUrl: 'https://placehold.co/600x400.png', dataAiHint: "science lesson" },
  { id: 'rec3', courseId: 'course2', title: 'Advanced Compounding', description: 'Session 1: Techniques for complex preparations.', youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnailUrl: 'https://placehold.co/600x400.png', dataAiHint: "lab work", attachmentUrl: "#", attachmentName: "Compounding_Worksheet.docx" },
];
