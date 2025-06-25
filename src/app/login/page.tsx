
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

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
  
  // Example users to guide the user
  const studentExample = "PA0107";
  const adminExample = "jane.staff@example.com";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-primary">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                </svg>
            </div>
          <CardTitle className="text-2xl font-headline">Welcome to Support Hub</CardTitle>
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
            <div className="mt-6 text-center text-sm text-muted-foreground">
                <p className="font-semibold">Demo Users:</p>
                <p>Student: <button onClick={() => setUsername(studentExample)} className="text-primary hover:underline">{studentExample}</button></p>
                <p>Admin: <button onClick={() => setUsername(adminExample)} className="text-primary hover:underline">{adminExample}</button></p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
