
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      await login(username, password);
      // On success, the auth context handles redirection.
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: (error as Error).message || "An unknown error occurred.",
      });
      setIsLoggingIn(false);
    }
  };
  
  return (
    <div className={cn("flex min-h-screen items-center justify-center p-4", "auth-background")}>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <Image src="https://content-provider.pharmacollege.lk/app-icon/android-chrome-192x192.png" alt="SOS App Logo" width={64} height={64} className="w-16 h-16" />
            </div>
          <CardTitle className="text-2xl font-headline">Welcome to SOS App</CardTitle>
          <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="e.g., PA0107 or staff@example.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder='Enter your password'
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoggingIn}>
              {isLoggingIn ? 'Logging In...' : 'Log In'}
            </Button>
          </form>
        </CardContent>
         <CardFooter className="text-center text-sm text-muted-foreground">
            <p className="w-full">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-primary font-semibold hover:underline">
                    Sign Up
                </Link>
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
