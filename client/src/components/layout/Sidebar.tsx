import { Link, useLocation } from "wouter";
import { LayoutDashboard, ShoppingCart, UtensilsCrossed, ChefHat, BarChart3, Package } from "lucide-react";
import { useStore } from "@/lib/store";

export function Sidebar() {
  const [location] = useLocation();
  const { getLowStockItems } = useStore();
  const lowStockCount = getLowStockItems().length;

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/pos", label: "Point of Sale", icon: ShoppingCart },
    { href: "/kitchen", label: "Kitchen Display", icon: ChefHat },
    { href: "/inventory", label: "Inventory", icon: Package, badge: lowStockCount },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="w-64 border-r border-border bg-sidebar text-sidebar-foreground flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold font-mono tracking-tighter flex items-center gap-2">
          <span className="text-primary text-2xl">⚡</span>
          SHELF<span className="text-primary">SENSE</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1 font-mono">AGENT V1.0</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {links.map((link) => {
          const isActive = location === link.href;
          const Icon = link.icon;
          
          return (
            <Link key={link.href} href={link.href}>
              <a 
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all
                  ${isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                  }
                `}
              >
                <Icon size={18} />
                {link.label}
                {link.badge !== undefined && link.badge > 0 && (
                  <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                    {link.badge}
                  </span>
                )}
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-sidebar-accent/50 rounded-lg p-3">
          <div className="text-xs font-mono text-muted-foreground mb-2">SYSTEM STATUS</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-medium">Online • v1.0.4</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background font-sans pl-64">
      <Sidebar />
      <main className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
        {children}
      </main>
    </div>
  );
}
