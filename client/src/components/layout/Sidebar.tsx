import { Link, useLocation } from "wouter";
import { LayoutDashboard, ShoppingCart, UtensilsCrossed, ChefHat, BarChart3, Package } from "lucide-react";
import { useStore } from "@/lib/store";
import { motion } from "framer-motion";

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
    <div className="w-64 border-r border-white/5 bg-[#050505] text-sidebar-foreground flex flex-col h-screen fixed left-0 top-0 z-50 shadow-[20px_0_40px_-20px_rgba(0,0,0,0.5)]">
      <div className="p-8">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 animate-float">
            <span className="text-black font-black text-xl">⚡</span>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter leading-none">
              SHELF<span className="text-primary">SENSE</span>
            </h1>
            <p className="text-[10px] text-muted-foreground font-bold tracking-[0.2em] mt-1">AGENT V1.0</p>
          </div>
        </motion.div>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 mt-4">
        {links.map((link, index) => {
          const isActive = location === link.href;
          const Icon = link.icon;
          
          return (
            <Link key={link.href} href={link.href}>
              <motion.a 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold tracking-widest uppercase transition-all duration-300 group
                  ${isActive 
                    ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                  }
                `}
              >
                <Icon size={16} className={`${isActive ? "text-primary-foreground" : "group-hover:text-primary transition-colors"}`} />
                {link.label}
                {link.badge !== undefined && link.badge > 0 && (
                  <span className={`ml-auto text-[10px] font-black px-2 py-0.5 rounded-full min-w-[1.25rem] text-center ${isActive ? "bg-black/20 text-black" : "bg-destructive text-white"}`}>
                    {link.badge}
                  </span>
                )}
              </motion.a>
            </Link>
          );
        })}
      </nav>

      <div className="p-6">
        <div className="bg-white/5 border border-white/5 rounded-[2rem] p-4 backdrop-blur-md">
          <div className="text-[10px] font-black text-muted-foreground mb-3 tracking-widest uppercase">KITCHEN AI</div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-75"></div>
            </div>
            <span className="text-[10px] font-black text-white tracking-widest uppercase">System Online</span>
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

