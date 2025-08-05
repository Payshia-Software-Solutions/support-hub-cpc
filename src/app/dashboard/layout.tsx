
"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { MobileHeader } from "@/components/dashboard/MobileHeader";
import { BottomDock } from "@/components/dashboard/BottomDock";
import { MobileDetailActiveProvider, useMobileDetailActive } from '@/contexts/MobileDetailActiveContext';
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ProtectedRoute, useAuth } from "@/contexts/AuthContext";
import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";


// We need a sub-component to access the context values for conditional styling
function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isMobileDetailActive } = useMobileDetailActive();
  const isMobile = useIsMobile();
  const pathname = usePathname();

  // Hide footer on specific pages
  const hideFooter = pathname === '/dashboard/chat' || pathname.startsWith('/dashboard/tickets');

  return (
    <div className="flex flex-col h-screen">
      <MobileHeader />
      <div className="flex flex-1 overflow-hidden w-screen">
        <SidebarNav />
        <div className="flex flex-1 flex-col overflow-hidden">
          <main 
            className={cn(
              "flex flex-col flex-1 overflow-y-auto bg-background animate-in fade-in-50 slide-in-from-bottom-4 duration-500",
              // Apply pb-16 for bottom dock space only if mobile and not in detail view
              isMobile ? (isMobileDetailActive ? "" : "pb-16") : "",
            )}
          >
            <SidebarInset className="flex-1">
              {children}
            </SidebarInset>
          </main>
          {!hideFooter && isMobile && (
              <footer className="flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground p-2 gap-2 sm:gap-4 shrink-0 bg-background border-t">
                <p>&copy; 2025 SOS App. All rights reserved.</p>
                <p>
                  Powered by <a href="https://pharmacollege.lk" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">Ceylon Pharma College</a>
                </p>
              </footer>
          )}
        </div>
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
          <SidebarProvider defaultOpen>
            <LayoutContent>{children}</LayoutContent>
          </SidebarProvider>
      </MobileDetailActiveProvider>
    </ProtectedRoute>
  );
}
