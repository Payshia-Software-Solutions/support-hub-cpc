
"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { MobileHeader } from "@/components/dashboard/MobileHeader"; // Can be reused or a new AdminMobileHeader
import { MobileDetailActiveProvider, useMobileDetailActive } from '@/contexts/MobileDetailActiveContext';
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// We need a sub-component to access the context values for conditional styling
function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isMobileDetailActive } = useMobileDetailActive();
  const isMobile = useIsMobile();

  // For admin, we might not need a bottom dock, so padding adjustment might differ
  // For simplicity, using similar logic as dashboard for now.
  return (
    <div className="flex flex-col h-screen">
      <MobileHeader /> 
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebarNav />
        <SidebarInset 
          className={cn(
            "flex-1 overflow-y-auto bg-background",
            // Admin might not have a bottom dock, adjust padding if needed
            isMobile ? (isMobileDetailActive ? "pb-0" : "pb-0") : "pb-0", // Default to pb-0 for admin
            "md:pb-0"
          )}
        >
          {children}
        </SidebarInset>
      </div>
      {/* No BottomDock for admin in this version */}
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MobileDetailActiveProvider>
      {/* AnnouncementsProvider might not be relevant for admin */}
      {/* <AnnouncementsProvider> */}
        <SidebarProvider defaultOpen>
          <LayoutContent>{children}</LayoutContent>
        </SidebarProvider>
      {/* </AnnouncementsProvider> */}
    </MobileDetailActiveProvider>
  );
}
