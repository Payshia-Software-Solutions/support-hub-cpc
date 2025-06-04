'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/chat');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p>Redirecting to dashboard...</p>
    </div>
  );
}
