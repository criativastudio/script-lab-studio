import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { LayoutDashboard, Users, BarChart3, Send, Shield, LogOut, Sparkles, Target, Sun, Moon, Menu, LayoutList, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePlanLimits } from "@/hooks/usePlanLimits";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/crm", label: "Clientes", icon: Users },
  { href: "/gerador", label: "Gerador IA", icon: Sparkles },
  { href: "/analise-estrategica", label: "Análise Estratégica", icon: Target },
  { href: "/carrossel", label: "Carrossel", icon: LayoutList },
  { href: "/diagnostico", label: "Diagnóstico", icon: Target },
  { href: "/metrics", label: "Análises", icon: BarChart3 },
  { href: "/whatsapp", label: "Distribuição", icon: Send },
];

const adminItems = [
  { href: "/admin", label: "Admin", icon: Shield },
];

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { plan } = usePlanLimits();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const scaleItems = plan === "scale_studio" ? [{ href: "/pdf-settings", label: "Personalizar PDF", icon: FileText }] : [];
  const allItems = [...navItems, ...scaleItems, ...(isAdmin ? adminItems : [])];

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-sidebar-border">
        <h1 className="text-lg font-bold text-sidebar-primary-foreground">ScriptLab Studio</h1>
        <p className="text-xs text-sidebar-foreground/60">Produção Audiovisual</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {allItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => isMobile && setMobileMenuOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
              location.pathname === item.href
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-medium">
            {profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile?.full_name || user?.email}</p>
            <p className="text-xs text-sidebar-foreground/50">{isAdmin ? "Admin" : "Produtor"}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
          {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Mobile top bar */}
      {isMobile && (
        <header className="sticky top-0 z-40 flex items-center gap-3 px-4 h-14 bg-sidebar text-sidebar-foreground border-b border-sidebar-border">
          <Button variant="ghost" size="icon" className="text-sidebar-foreground" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-base font-bold text-sidebar-primary-foreground">ScriptLab Studio</h1>
        </header>
      )}

      {/* Mobile sheet sidebar */}
      {isMobile && (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar text-sidebar-foreground">
            <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
            <div className="flex flex-col h-full">
              {sidebarContent}
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border sticky top-0 h-screen">
          {sidebarContent}
        </aside>
      )}

      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};
