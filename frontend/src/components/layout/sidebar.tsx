import { Building2, CalendarClock, ClipboardList, Home, LogOut, Package } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "../ui/button";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: Home, roles: ["ADMIN", "PORTEIRO", "MORADOR"] },
  { to: "/packages", label: "Encomendas", icon: Package, roles: ["ADMIN", "PORTEIRO", "MORADOR"] },
  { to: "/residents", label: "Moradores", icon: Building2, roles: ["ADMIN", "PORTEIRO"] },
  { to: "/visitors", label: "Visitantes", icon: ClipboardList, roles: ["ADMIN", "PORTEIRO"] },
  { to: "/events", label: "Eventos", icon: CalendarClock, roles: ["ADMIN", "PORTEIRO", "MORADOR"] },
];

interface SidebarProps {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}

export const Sidebar = ({ variant = "desktop", onNavigate }: SidebarProps) => {
  const { user, logout } = useAuth();

  return (
    <aside
      className={cn(
        "w-64 flex-col border-r bg-card/50 p-4",
        variant === "desktop" ? "hidden lg:flex" : "flex",
      )}
    >
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold">
          CG
        </div>
        <div>
          <p className="text-lg font-semibold">Condo Guardian</p>
          <p className="text-xs text-muted-foreground">Gestão completa da portaria</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.filter((item) => (user ? item.roles.includes(user.role) : false)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )
            }
            onClick={() => onNavigate?.()}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <Button variant="ghost" className="mt-6 justify-start gap-2" onClick={logout}>
        <LogOut className="h-4 w-4" /> Sair
      </Button>
    </aside>
  );
};
