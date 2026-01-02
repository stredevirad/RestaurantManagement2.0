import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, TrendingUp, DollarSign, Package, Activity } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { inventory, logs, totalRevenue, totalCost, getLowStockItems } = useStore();
  
  const lowStockItems = getLowStockItems();
  const recentLogs = logs.slice(0, 5);
  const profit = totalRevenue + totalCost; // totalCost is negative in logs but positive in state tracking for simplicity? wait, let's check store.tsx
  // In store.tsx: setTotalCost(prev => prev + cost). cost is positive amount.
  // Real profit = Revenue - Cost.
  const realProfit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? (realProfit / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Overview of restaurant performance and inventory health.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Sales for today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${realProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {margin.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              ${realProfit.toFixed(2)} net profit
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Items below threshold
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${inventory.reduce((acc, item) => acc + (item.quantity * item.pricePerUnit), 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Current stock assets
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Low Stock Alerts */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Critical Stock Alerts</CardTitle>
            <CardDescription>
              Items that need immediate replenishment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Package className="h-8 w-8 mb-2 opacity-50" />
                <p>All stock levels healthy.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {lowStockItems.map((item) => (
                  <Alert key={item.id} variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive-foreground">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="font-mono">{item.sku} - {item.name}</AlertTitle>
                    <AlertDescription className="flex justify-between items-center mt-2">
                      <span>Remaining: {item.quantity.toFixed(1)} {item.unit} (Threshold: {item.threshold})</span>
                      <Badge variant="outline" className="border-destructive/50">Restock Needed</Badge>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest transactions and logs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-center">
                  <div className={`
                    w-9 h-9 rounded-full flex items-center justify-center border mr-4
                    ${log.type === 'sale' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : ''}
                    ${log.type === 'restock' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : ''}
                    ${log.type === 'waste' ? 'bg-red-500/10 border-red-500/20 text-red-500' : ''}
                    ${log.type === 'system' ? 'bg-slate-500/10 border-slate-500/20 text-slate-500' : ''}
                  `}>
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{log.message}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {format(new Date(log.timestamp), 'HH:mm:ss')}
                    </p>
                  </div>
                  {log.amount !== 0 && (
                    <div className={`ml-auto font-mono text-sm font-medium ${log.amount! > 0 ? 'text-emerald-500' : 'text-foreground'}`}>
                      {log.amount! > 0 ? '+' : ''}{log.amount!.toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
