import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, ChefHat, RefreshCcw, Clock, Check, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

interface OrderItem {
  id: number;
  menuItemName: string;
  price: number;
  quantity: number;
  removedIngredients: string | null;
  specialInstructions: string | null;
}

interface Order {
  id: number;
  total: number;
  customerName: string | null;
  allergies: string | null;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

export default function KitchenPage() {
  const { menu, recordWaste } = useStore();
  const [failReason, setFailReason] = useState("");
  const [selectedDish, setSelectedDish] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const { data: recentOrders = [], refetch } = useQuery<Order[]>({
    queryKey: ["/api/orders/recent"],
    queryFn: async () => {
      const res = await fetch("/api/orders/recent?limit=10");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const pendingOrders = recentOrders.filter(o => o.status === "pending");

  const handleFailReport = () => {
    if (selectedDish && failReason) {
      recordWaste(selectedDish, failReason);
      setOpen(false);
      setFailReason("");
      setSelectedDish(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-destructive flex items-center gap-2">
          <ChefHat className="h-8 w-8" />
          Kitchen Display System
        </h2>
        <p className="text-muted-foreground">Manage active orders and report preparation failures.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-l-4 border-l-emerald-500 bg-emerald-500/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Orders</CardTitle>
              <CardDescription>Live feed from AI Chatbot & POS</CardDescription>
            </div>
            <Badge variant={pendingOrders.length > 0 ? "default" : "secondary"} data-testid="badge-pending-count">
              {pendingOrders.length} pending
            </Badge>
          </CardHeader>
          <CardContent>
            {pendingOrders.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground italic">
                No active orders pending...
              </div>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {pendingOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="p-4 rounded-xl bg-card border border-emerald-500/20"
                    data-testid={`card-order-${order.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-emerald-500" />
                        <span className="font-bold text-emerald-500">Order #{order.id}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(order.createdAt), 'HH:mm')}
                      </span>
                    </div>
                    {order.customerName && order.customerName !== "Walk-in" && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <User className="h-3 w-3" />
                        {order.customerName}
                      </div>
                    )}
                    <div className="space-y-1">
                      {order.items.map((item) => (
                        <div key={item.id} className="text-sm">
                          <span className="font-medium">{item.menuItemName}</span>
                          {item.quantity > 1 && <span> x{item.quantity}</span>}
                          {item.removedIngredients && (
                            <span className="text-yellow-500 text-xs ml-2">
                              (no {item.removedIngredients})
                            </span>
                          )}
                          {item.specialInstructions && (
                            <span className="text-blue-400 text-xs block ml-4">
                              Note: {item.specialInstructions}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    {order.allergies && (
                      <div className="mt-2 text-xs text-destructive font-bold flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        ALLERGY: {order.allergies}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-2 border-l-4 border-l-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Dish Failure Reporting</CardTitle>
            <CardDescription>
              Report messed up dishes to automatically trigger ingredient restock/deduction logic.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {menu.map((item) => (
                <Dialog key={item.id} open={open && selectedDish === item.id} onOpenChange={(isOpen) => {
                  setOpen(isOpen);
                  if (isOpen) setSelectedDish(item.id);
                }}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 flex flex-col gap-2 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                    >
                      <AlertTriangle className="h-6 w-6 mb-1" />
                      <span className="text-center text-wrap leading-tight">{item.name}</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-destructive/50">
                    <DialogHeader>
                      <DialogTitle className="text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Report Failed Dish: {item.name}
                      </DialogTitle>
                      <DialogDescription>
                        This will deduct ingredients for a RE-MAKE. Please specify the reason for the log.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="reason">Reason for Failure</Label>
                        <Textarea
                          id="reason"
                          placeholder="e.g., Burned patty, dropped on floor, wrong toppings..."
                          value={failReason}
                          onChange={(e) => setFailReason(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="destructive" onClick={handleFailReport}>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Log Fail & Re-Make
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
