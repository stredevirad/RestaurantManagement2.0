import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, TrendingUp, DollarSign, Package, Activity, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemAnim = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function DashboardPage() {
  const { inventory, logs, totalRevenue, totalCost, getLowStockItems } = useStore();
  
  const lowStockItems = getLowStockItems();
  const recentLogs = logs.slice(0, 5);
  const realProfit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? (realProfit / totalRevenue) * 100 : 0;

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-12 pb-20"
    >
      <motion.div variants={itemAnim} className="flex flex-col gap-2">
        <h2 className="text-5xl font-black tracking-tighter uppercase italic">
          System <span className="text-primary">Pulse</span>
        </h2>
        <p className="text-muted-foreground font-medium tracking-wide">AI-DRIVEN INVENTORY & REVENUE INTELLIGENCE</p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Revenue", val: `$${totalRevenue.toFixed(2)}`, desc: "Sales for today", icon: DollarSign, color: "text-primary" },
          { label: "Profit Margin", val: `${margin.toFixed(1)}%`, desc: `$${realProfit.toFixed(2)} net profit`, icon: TrendingUp, color: realProfit >= 0 ? "text-emerald-500" : "text-rose-500" },
          { label: "Alerts", val: lowStockItems.length, desc: "Items below threshold", icon: AlertTriangle, color: "text-primary" },
          { label: "Stock Value", val: `$${inventory.reduce((acc, item) => acc + (item.quantity * item.pricePerUnit), 0).toFixed(0)}`, desc: "Current assets", icon: Package, color: "text-white" },
        ].map((kpi, i) => (
          <motion.div key={i} variants={itemAnim}>
            <Card className="bg-card/40 backdrop-blur-xl border-white/5 rounded-[2rem] hover:border-primary/20 transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <kpi.icon size={80} />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black tracking-[0.2em] uppercase text-muted-foreground">{kpi.label}</CardTitle>
                <kpi.icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-black tracking-tight ${kpi.color}`}>{kpi.val}</div>
                <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-widest">
                  {kpi.desc}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <motion.div variants={itemAnim} className="col-span-4">
          <Card className="bg-card/40 backdrop-blur-xl border-white/5 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-destructive/10 rounded-2xl flex items-center justify-center">
                  <Zap className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black tracking-tight uppercase italic">Critical Alerts</CardTitle>
                  <CardDescription className="font-medium">SYSTEM IDENTIFIED RISKS</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              {lowStockItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-60 text-muted-foreground/30">
                  <Package className="h-12 w-12 mb-4 animate-float" />
                  <p className="text-xs font-black tracking-[0.3em] uppercase">Status: All Clear</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lowStockItems.map((item) => (
                    <motion.div 
                      key={item.id}
                      whileHover={{ x: 10 }}
                      className="p-6 rounded-3xl bg-destructive/5 border border-destructive/10 group relative overflow-hidden"
                    >
                      <div className="flex justify-between items-center relative z-10">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-destructive/60 tracking-widest uppercase">{item.sku}</p>
                          <h4 className="text-lg font-black text-white">{item.name}</h4>
                          <p className="text-xs font-medium text-muted-foreground">
                            {item.quantity.toFixed(1)} {item.unit} REMAINING
                          </p>
                        </div>
                        <Badge variant="destructive" className="rounded-xl px-4 py-1.5 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-destructive/20">
                          Restock
                        </Badge>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-destructive/0 via-destructive/5 to-destructive/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemAnim} className="col-span-3">
          <Card className="bg-card/40 backdrop-blur-xl border-white/5 rounded-[2.5rem] h-full">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black tracking-tight uppercase italic">Live Feed</CardTitle>
                  <CardDescription className="font-medium">REAL-TIME OPERATIONS</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <div className="space-y-6">
                {recentLogs.map((log, i) => (
                  <motion.div 
                    key={log.id} 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center group"
                  >
                    <div className={`
                      w-10 h-10 rounded-2xl flex items-center justify-center border-2 mr-4 transition-all group-hover:scale-110
                      ${log.type === 'sale' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : ''}
                      ${log.type === 'restock' ? 'bg-primary/10 border-primary/20 text-primary' : ''}
                      ${log.type === 'waste' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : ''}
                      ${log.type === 'system' ? 'bg-white/5 border-white/10 text-white' : ''}
                      ${log.type === 'email' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : ''}
                    `}>
                      <Zap size={14} className={log.type === 'sale' ? 'animate-pulse' : ''} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate group-hover:text-primary transition-colors">{log.message}</p>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">
                        {format(new Date(log.timestamp), 'HH:mm:ss')}
                      </p>
                    </div>
                    {log.amount !== 0 && (
                      <div className={`font-black text-xs tracking-tight ${log.amount! > 0 ? 'text-emerald-500' : 'text-white'}`}>
                        {log.amount! > 0 ? '+' : ''}{log.amount!.toFixed(2)}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
