
"use client";

import { usePathname } from "next/navigation";
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
              "flex flex-col flex-1 overflow-y-auto bg-background",
              // Apply pb-16 for bottom dock space only if mobile and not in detail view
              isMobile ? (isMobileDetailActive ? "" : "pb-16") : "",
              !hideFooter && "pb-6"
            )}
          >
            <SidebarInset className="flex-1">
              {children}
            </SidebarInset>
          </main>
          {!hideFooter && (
              <footer className="flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground p-2 gap-2 sm:gap-4 shrink-0 bg-background border-t">
                <p>&copy; 2025 Student Support Hub. All rights reserved.</p>
                <p>
                  Powered by <a href="https://payshia.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">Payshia Software Solutions</a>
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
        <AnnouncementsProvider>
          <SidebarProvider defaultOpen>
            <LayoutContent>{children}</LayoutContent>
          </SidebarProvider>
        </AnnouncementsProvider>
      </MobileDetailActiveProvider>
    </ProtectedRoute>
  );
}
