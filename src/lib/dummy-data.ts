
import type { UserProfile, PaymentRecord, StaffMember } from './types';

// Note: Most dummy data is now obsolete and replaced by API calls.
// This file is kept for data that might not come from the API in the prototype,
// such as the list of staff members for the assignment dropdown.

export const dummyStaffMembers: StaffMember[] = [
  { id: 'staff1', name: 'Staff Jane', avatar: 'https://placehold.co/40x40.png?text=SJ' },
  { id: 'staff2', name: 'Staff John', avatar: 'https://placehold.co/40x40.png?text=SJn' },
  { id: 'staff3', name: 'Staff Alex', avatar: 'https://placehold.co/40x40.png?text=SAx' },
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
