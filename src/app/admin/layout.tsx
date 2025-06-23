
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

// We need a sub-component to access the context values for conditional styling
function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isMobileDetailActive } = useMobileDetailActive();
  const isMobile = useIsMobile();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user?.role !== 'staff') {
      router.replace('/dashboard/chat'); // Redirect non-staff users away
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'staff') {
    return (
        <div className="flex h-screen w-screen items-center justify-center">
            <p>Access Denied. Redirecting...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <MobileHeader /> 
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebarNav />
        <SidebarInset 
          className={cn(
            "flex-1 overflow-y-auto bg-background",
            // Apply pb-16 for bottom dock space only if mobile and not in detail view
            isMobile ? (isMobileDetailActive ? "pb-0" : "pb-16") : "pb-0",
            "md:pb-0"
          )}
        >
          {children}
        </SidebarInset>
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
        {/* AnnouncementsProvider might not be relevant for admin */}
        {/* <AnnouncementsProvider> */}
          <SidebarProvider defaultOpen>
            <LayoutContent>{children}</LayoutContent>
          </SidebarProvider>
        {/* </AnnouncementsProvider> */}
      </MobileDetailActiveProvider>
    </ProtectedRoute>
  );
}
