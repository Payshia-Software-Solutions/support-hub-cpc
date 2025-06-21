
'use client';

import type { Announcement } from '@/lib/types';
import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAnnouncements } from '@/lib/api';

const READ_ANNOUNCEMENTS_KEY = 'readAnnouncements';

interface AnnouncementsContextType {
  announcements: Announcement[];
  unreadCount: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  markAnnouncementsAsRead: () => void;
}

const AnnouncementsContext = createContext<AnnouncementsContextType | undefined>(undefined);

export const AnnouncementsProvider = ({ children }: { children: ReactNode }) => {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const storedIds = localStorage.getItem(READ_ANNOUNCEMENTS_KEY);
      if (storedIds) {
        setReadIds(new Set(JSON.parse(storedIds)));
      }
    } catch (error) {
      console.error("Failed to load read announcements from localStorage", error);
    }
  }, []);

  const { data, isLoading, isError, error } = useQuery<Announcement[], Error>({
    queryKey: ['announcements'],
    queryFn: getAnnouncements
  });

  const announcementsWithNewFlag = (data || []).map(ann => ({
    ...ann,
    isNew: !readIds.has(ann.id)
  }));

  const unreadCount = announcementsWithNewFlag.filter(a => a.isNew).length;

  const markAnnouncementsAsRead = useCallback(() => {
    if (data && data.length > 0) {
      const allIds = new Set(data.map(a => a.id));
      setReadIds(allIds);
      try {
        localStorage.setItem(READ_ANNOUNCEMENTS_KEY, JSON.stringify(Array.from(allIds)));
      } catch (error) {
        console.error("Failed to save read announcements to localStorage", error);
      }
    }
  }, [data]);

  return (
    <AnnouncementsContext.Provider value={{ 
      announcements: announcementsWithNewFlag, 
      unreadCount, 
      isLoading,
      isError,
      error,
      markAnnouncementsAsRead 
    }}>
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
