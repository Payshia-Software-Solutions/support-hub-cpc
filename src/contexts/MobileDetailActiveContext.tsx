
'use client';
import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useState } from 'react';

interface MobileDetailActiveContextType {
  isMobileDetailActive: boolean;
  setIsMobileDetailActive: Dispatch<SetStateAction<boolean>>;
}

const MobileDetailActiveContext = createContext<MobileDetailActiveContextType | undefined>(undefined);

export const MobileDetailActiveProvider = ({ children }: { children: ReactNode }) => {
  const [isMobileDetailActive, setIsMobileDetailActive] = useState(false);
  return (
    <MobileDetailActiveContext.Provider value={{ isMobileDetailActive, setIsMobileDetailActive }}>
      {children}
    </MobileDetailActiveContext.Provider>
  );
};

export const useMobileDetailActive = () => {
  const context = useContext(MobileDetailActiveContext);
  if (context === undefined) {
    throw new Error('useMobileDetailActive must be used within a MobileDetailActiveProvider');
  }
  return context;
};
