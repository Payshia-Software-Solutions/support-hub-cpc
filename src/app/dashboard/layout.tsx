
"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { MobileHeader } from "@/components/dashboard/MobileHeader";
import { BottomDock } from "@/components/dashboard/BottomDock";
import { AnnouncementsProvider } from "@/contexts/AnnouncementsContext";
import { MobileDetailActiveProvider, useMobileDetailActive } from '@/contexts/MobileDetailActiveContext';
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ProtectedRoute } from "@/contexts/AuthContext";

// We need a sub-component to access the context values for conditional styling
function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isMobileDetailActive } = useMobileDetailActive();
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col h-screen">
      <MobileHeader />
      <div className="flex flex-1 overflow-hidden w-screen">
        <SidebarNav />
        <SidebarInset 
          className={cn(
            "flex-1 overflow-y-auto bg-background",
            // Apply pb-16 for bottom dock space only if mobile and not in detail view
            // Otherwise, pb-0 for mobile detail view or desktop
            isMobile ? (isMobileDetailActive ? "pb-0" : "pb-16") : "pb-0",
            "md:pb-0" // Ensure desktop has no bottom padding from this rule
          )}
        >
          {children}
        </SidebarInset>
      </div>
      <BottomDock />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <MobileDetailActiveProvider>
        <AnnouncementsProvider>
          <SidebarProvider defaultOpen>
            <LayoutContent>{children}</LayoutContent>
          </SidebarProvider>
        </AnnouncementsProvider>
      </MobileDetailActiveProvider>
    </ProtectedRoute>
  );
}
