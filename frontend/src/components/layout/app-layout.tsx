import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="w-64 bg-card p-4 shadow-xl">
            <Sidebar variant="mobile" onNavigate={() => setSidebarOpen(false)} />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setSidebarOpen(false)} />
        </div>
      )}
      <div className="flex flex-1 flex-col">
        <Topbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <main className="flex-1 bg-muted/20 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
};
