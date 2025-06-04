
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { MobileHeader } from "@/components/dashboard/MobileHeader";
import { BottomDock } from "@/components/dashboard/BottomDock";
import { AnnouncementsProvider } from "@/contexts/AnnouncementsContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AnnouncementsProvider>
      <SidebarProvider defaultOpen>
        <div className="flex flex-col h-screen"> 
          <MobileHeader />
          <div className="flex flex-1 overflow-hidden">
            <SidebarNav />
            <SidebarInset className="flex-1 overflow-y-auto bg-background pb-16 md:pb-0">           
              {children}
            </SidebarInset>
          </div>
          <BottomDock />
        </div>
      </SidebarProvider>
    </AnnouncementsProvider>
  );
}
