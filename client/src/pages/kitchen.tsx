import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, ChefHat, RefreshCcw } from "lucide-react";
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
import { useState } from "react";

export default function KitchenPage() {
  const { menu, recordWaste } = useStore();
  const [failReason, setFailReason] = useState("");
  const [selectedDish, setSelectedDish] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

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
          <CardHeader>
            <CardTitle>Active Orders</CardTitle>
            <CardDescription>Live feed from POS</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-40 text-muted-foreground italic">
              No active orders pending...
            </div>
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
