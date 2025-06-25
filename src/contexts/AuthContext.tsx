
'use client';

import type { UserProfile } from '@/lib/types';
import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { dummyUsers } from '@/lib/dummy-data'; // We'll use this for mock auth
import { Skeleton } from '@/components/ui/skeleton';

interface AuthContextType {
  user: UserProfile | null;
  login: (usernameOrEmail: string) => Promise<void>; // Updated to handle username or email
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

  const login = useCallback(async (usernameOrEmail: string) => {
    // First, try to log in as a student via API.
    try {
        const response = await fetch(`https://qa-api.pharmacollege.lk/users/username/${usernameOrEmail.toUpperCase()}`);
        if (response.ok) {
            const apiUser = await response.json();
            if (apiUser && apiUser.id) {
                const userProfile: UserProfile = {
                    id: apiUser.id,
                    name: `${apiUser.fname} ${apiUser.lname}`,
                    email: apiUser.email,
                    role: apiUser.userlevel === 'Student' ? 'student' : 'staff', // Assuming 'Student' or other
                    avatar: `https://placehold.co/100x100.png?text=${apiUser.fname.charAt(0)}${apiUser.lname.charAt(0)}`,
                    joinedDate: apiUser.created_at,
                };

                setUser(userProfile);
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userProfile));
                router.push('/dashboard/chat');
                return;
            }
        }
    } catch (error) {
        // Network error or other issues, fall through to check mock staff.
        console.error("Student API login failed, falling back to mock users:", error);
    }

    // If API login fails, fall back to mock staff login by email
    const foundStaff = dummyUsers.find(u => u.role === 'staff' && u.email.toLowerCase() === usernameOrEmail.toLowerCase());
    if (foundStaff) {
      setUser(foundStaff);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(foundStaff));
      router.push('/admin/dashboard');
      return;
    }

    // If everything fails
    throw new Error("Invalid username or password");
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
    return (
        <div className="flex h-screen w-screen items-center justify-center">
            <div className="w-full max-w-md p-8 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-10 w-full mt-4" />
            </div>
        </div>
    );
  }

  return <>{children}</>;
}
