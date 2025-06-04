
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { MobileHeader } from "@/components/dashboard/MobileHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex flex-col h-screen">
        <MobileHeader />
        <div className="flex flex-1 overflow-hidden">
          <SidebarNav />
          <SidebarInset className="flex-1 overflow-y-auto bg-background">
            {children}
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
