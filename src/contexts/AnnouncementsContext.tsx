
'use client';

import type { Announcement } from '@/lib/types';
import { dummyAnnouncements as initialAnnouncementsData } from '@/lib/dummy-data';
import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AnnouncementsContextType {
  announcements: Announcement[];
  unreadCount: number;
  markAnnouncementsAsRead: () => void;
}

const AnnouncementsContext = createContext<AnnouncementsContextType | undefined>(undefined);

export const AnnouncementsProvider = ({ children }: { children: ReactNode }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    // Ensure a deep copy and that isNew is explicitly handled if not present
    return JSON.parse(JSON.stringify(
      initialAnnouncementsData.map(a => ({ ...a, isNew: typeof a.isNew === 'boolean' ? a.isNew : false }))
    ));
  });
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const count = announcements.filter(a => a.isNew).length;
    setUnreadCount(count);
  }, [announcements]);

  const markAnnouncementsAsRead = useCallback(() => {
    setAnnouncements(prev => prev.map(ann => ({ ...ann, isNew: false })));
  }, []);

  return (
    <AnnouncementsContext.Provider value={{ announcements, unreadCount, markAnnouncementsAsRead }}>
      {children}
    </AnnouncementsContext.Provider>
  );
};

export const useAnnouncements = () => {
  const context = useContext(AnnouncementsContext);
  if (context === undefined) {
    throw new Error('useAnnouncements must be used within an AnnouncementsProvider');
  }
  return context;
};
