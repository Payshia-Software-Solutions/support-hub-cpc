
'use client';

import type { UserProfile } from '@/lib/types';
import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { dummyUsers } from '@/lib/dummy-data'; // We'll use this for mock auth
import { Preloader } from '@/components/ui/preloader';

interface AuthContextType {
  user: UserProfile | null;
  login: (usernameOrEmail: string, password?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'auth_user';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (usernameOrEmail: string, password?: string) => {
    if (!password) {
      throw new Error("Password is required.");
    }

    try {
      const response = await fetch(`https://qa-api.pharmacollege.lk/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: usernameOrEmail,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Login failed with status: ${response.status}`);
      }

      if (data.user) {
        const apiUser = data.user;
        const userProfile: UserProfile = {
          id: apiUser.id,
          username: apiUser.username,
          name: `${apiUser.fname} ${apiUser.lname}`,
          email: apiUser.email,
          role: apiUser.userlevel === 'Student' ? 'student' : 'staff',
          avatar: `https://placehold.co/100x100.png?text=${apiUser.fname.charAt(0)}${apiUser.lname.charAt(0)}`,
          joinedDate: apiUser.created_at,
        };

        setUser(userProfile);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userProfile));

        if (userProfile.role === 'staff') {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
        return;
      } else {
        throw new Error("Login failed: User data not found in response.");
      }
    } catch (error) {
      console.error("Login failed:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unknown login error occurred.");
    }
  }, [router]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    router.push('/login');
  }, [router]);

  const value = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Component to protect routes
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return <Preloader message="Loading your dashboard..." />;
  }

  return <>{children}</>;
}
