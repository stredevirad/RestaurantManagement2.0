import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend, LineChart, Line } from "recharts";
import { Star, TrendingUp, Sparkles, TrendingDown, Package, UserCheck, DollarSign, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AnalyticsPage() {
  const { menu, logs, totalRevenue, getDemandForecast, getChefPerformance, realtimeInsights } = useStore();

  const satisfactionData = menu.map(item => ({
    name: item.name,
    rating: item.rating,
    reviews: item.ratingCount
  })).sort((a, b) => b.rating - a.rating);

  const demandForecast = getDemandForecast();
  const chefPerformance = getChefPerformance();

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
        {/* Real-time Insights Feed */}
        <Card className="col-span-1 md:col-span-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <CardHeader>
             <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500 animate-pulse" />
              Live AI Strategy Feed
            </CardTitle>
            <CardDescription>Real-time tactical suggestions based on incoming sales flow.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[100px] w-full rounded-md border bg-black/20 p-4">
              <div className="space-y-2">
                {realtimeInsights.length > 0 ? (
                  realtimeInsights.map((insight, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm font-mono text-blue-200">
                      <span className="text-blue-500">[{new Date().toLocaleTimeString()}]</span>
                      {insight}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm italic">Waiting for new sales data to generate insights...</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

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

        {/* Chef Performance */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-purple-500" />
              Chef Performance & Raise Suggestions
            </CardTitle>
            <CardDescription>AI-evaluated metrics based on dish ratings and sales volume.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {chefPerformance.map(chef => (
                <div key={chef.name} className="bg-card border p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold">{chef.name}</h4>
                      <p className="text-xs text-muted-foreground">Rating: {chef.rating.toFixed(2)}/5.0</p>
                    </div>
                    {chef.raiseSuggested && (
                      <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30 border-green-500/50">
                        <DollarSign className="h-3 w-3 mr-1" /> Raise Eligible
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm font-mono text-muted-foreground">
                    Sales Est: ${chef.sales.toFixed(0)}
                  </div>
                  {chef.raiseSuggested ? (
                    <p className="text-xs text-green-400 font-medium">
                      AI Recommendation: Top performer. Suggest 5% raise.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground/60">
                      Performance solid. Monitor for next quarter.
                    </p>
                  )}
                </div>
              ))}
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

        {/* Chef Performance */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-purple-500" />
              Chef Performance & Raise Suggestions
            </CardTitle>
            <CardDescription>AI-evaluated metrics based on dish ratings and sales volume.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {chefPerformance.map(chef => (
                <div key={chef.name} className="bg-card border p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold">{chef.name}</h4>
                      <p className="text-xs text-muted-foreground">Rating: {chef.rating.toFixed(2)}/5.0</p>
                    </div>
                    {chef.raiseSuggested && (
                      <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30 border-green-500/50">
                        <DollarSign className="h-3 w-3 mr-1" /> Raise Eligible
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm font-mono text-muted-foreground">
                    Sales Est: ${chef.sales.toFixed(0)}
                  </div>
                  {chef.raiseSuggested ? (
                    <p className="text-xs text-green-400 font-medium">
                      AI Recommendation: Top performer. Suggest 5% raise.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground/60">
                      Performance solid. Monitor for next quarter.
                    </p>
                  )}
                </div>
              ))}
            </div>
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
