import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "sonner";

export default function MainLayout({ children, toasterProps = {} }) {
    return (
        <SidebarProvider style={{ "--sidebar-width": "252px" }}>
            <Toaster richColors {...toasterProps} />
            <AppSidebar />
            <SidebarInset className="min-w-0 overflow-x-hidden bg-slate-50">
                <main className="min-w-0 overflow-x-hidden bg-gray-100">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
