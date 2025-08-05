

"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { MobileHeader } from "@/components/dashboard/MobileHeader"; // Can be reused or a new AdminMobileHeader
import { MobileDetailActiveProvider, useMobileDetailActive } from '@/contexts/MobileDetailActiveContext';
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ProtectedRoute } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminBottomDock } from "@/components/admin/AdminBottomDock";
import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";


// We need a sub-component to access the context values for conditional styling
function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isMobileDetailActive } = useMobileDetailActive();
  const isMobile = useIsMobile();
  const { user, isLoading, isImpersonating, stopImpersonating } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user?.role !== 'staff') {
      // If the user is impersonating, they can be a 'student'. We don't want to redirect them.
      if (!isImpersonating) {
         router.replace('/dashboard'); // Redirect non-staff users away
      }
    }
  }, [user, isLoading, router, isImpersonating]);

  if (isLoading) {
    return (
        <div className="flex h-screen w-screen items-center justify-center">
            <p>Loading Admin Dashboard...</p>
        </div>
    );
  }

  // A non-staff user who is not impersonating should not see the admin layout.
  if (user?.role !== 'staff' && !isImpersonating) {
     return (
        <div className="flex h-screen w-screen items-center justify-center">
            <p>Access Denied. Redirecting...</p>
        </div>
    );
  }


  return (
    <div className="flex flex-col h-screen" style={{'--header-height': '3.5rem'} as React.CSSProperties}>
      <MobileHeader /> 
      <div className="flex flex-1 overflow-hidden w-screen">
        <AdminSidebarNav />
        <main 
          className={cn(
            "flex-1 flex flex-col bg-background animate-in fade-in-50 slide-in-from-bottom-4 duration-500"
          )}
        >
          <div className="flex-1 flex flex-col overflow-y-auto">
            <SidebarInset 
                className={cn(
                  "flex-1 flex flex-col",
                  isMobile ? (isMobileDetailActive ? "pb-0" : "pb-16") : "pb-0"
                )}
            >
              {children}
            </SidebarInset>
          </div>
        </main>
      </div>
      <AdminBottomDock />
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <MobileDetailActiveProvider>
        <SidebarProvider defaultOpen>
          <LayoutContent>{children}</LayoutContent>
        </SidebarProvider>
      </MobileDetailActiveProvider>
    </ProtectedRoute>
  );
}
