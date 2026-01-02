import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend, LineChart, Line } from "recharts";
import { Star, TrendingUp, Sparkles, TrendingDown, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AnalyticsPage() {
  const { menu, logs, totalRevenue, getDemandForecast } = useStore();

  const satisfactionData = menu.map(item => ({
    name: item.name,
    rating: item.rating,
    reviews: item.ratingCount
  })).sort((a, b) => b.rating - a.rating);

  const demandForecast = getDemandForecast();

  // Mock revenue data for the chart based on current logs + some history
  const revenueData = [
    { time: '10:00', amount: 120 },
    { time: '11:00', amount: 350 },
    { time: '12:00', amount: 890 },
    { time: '13:00', amount: 650 },
    { time: '14:00', amount: 420 },
    { time: 'Now', amount: totalRevenue },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics & Insights</h2>
        <p className="text-muted-foreground">Deep dive into satisfaction metrics and financial performance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* AI Insight Card */}
        <Card className="col-span-1 md:col-span-2 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Demand Forecasting & Insights
            </CardTitle>
            <CardDescription>Autonomous suggestions for profit maximization and stock efficiency.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {demandForecast.length > 0 ? (
                demandForecast.map(forecast => (
                  <div key={forecast.itemId} className="bg-card border border-white/5 p-4 rounded-xl flex items-start gap-3 shadow-lg">
                    <div className="bg-primary/20 p-2 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Increase Stock: {forecast.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1 mb-2">{forecast.reason}</p>
                      <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary">
                        Target: {forecast.suggestedStock} units
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-6 text-muted-foreground">
                  AI analysis indicates optimal stock levels currently. No immediate actions required.
                </div>
              )}
              
              <div className="bg-card border border-white/5 p-4 rounded-xl flex items-start gap-3 shadow-lg">
                 <div className="bg-yellow-500/20 p-2 rounded-lg">
                    <TrendingDown className="h-5 w-5 text-yellow-500" />
                 </div>
                 <div>
                    <h4 className="font-bold text-sm">Minimize Waste</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Prep items with &lt; 8 min prep time on-demand only.
                    </p>
                 </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Customer Satisfaction
            </CardTitle>
            <CardDescription>Average rating per menu item based on customer feedback.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={satisfactionData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 5]} hide />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }}
                />
                <Bar dataKey="rating" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Revenue Trend (Today)
            </CardTitle>
            <CardDescription>Hourly revenue accumulation.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }}
                />
                <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--background))", strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>End of Day Report Preview</CardTitle>
          <CardDescription>Generated summary for the Stock Manager.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-md font-mono text-sm space-y-2">
            <p>--- EOD REPORT: {new Date().toLocaleDateString()} ---</p>
            <p>TOTAL REVENUE:   ${totalRevenue.toFixed(2)}</p>
            <p>ITEMS SOLD:      {logs.filter(l => l.type === 'sale').length}</p>
            <p>WASTE EVENTS:    {logs.filter(l => l.type === 'waste').length}</p>
            <p>RESTOCKS:        {logs.filter(l => l.type === 'restock').length}</p>
            <p className="text-yellow-500">
              LOW STOCK WARNINGS: {menu.length > 0 ? 'Active' : 'None'}
            </p>
            <p>----------------------------------------</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
