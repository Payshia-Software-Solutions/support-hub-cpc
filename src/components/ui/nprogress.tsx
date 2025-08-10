
"use client";

import { useEffect } from 'react';
import NProgress from 'nprogress';
import { usePathname, useSearchParams } from 'next/navigation';

export function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.configure({ showSpinner: false });

    const handleStart = () => NProgress.start();
    const handleStop = () => NProgress.done();

    // We manually trigger the progress bar on route changes.
    // The previous implementation using router.events is deprecated in App Router.
    // This effect will run every time the pathname or search params change.
    handleStop(); // Stop any previous progress bar
    handleStart(); // Start a new one for the current navigation

    // A slight delay to ensure the progress bar is visible before completing.
    const timer = setTimeout(() => {
        handleStop();
    }, 500);

    return () => {
        clearTimeout(timer);
        handleStop(); // Ensure it stops if the component unmounts.
    };
  }, [pathname, searchParams]);

  return null; // This component doesn't render anything itself.
}
