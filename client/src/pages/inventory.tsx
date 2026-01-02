import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Search, AlertCircle, Zap, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { Label } from "@/components/ui/label";

export default function InventoryPage() {
  const { inventory, restockItem, operatingFunds, addFunds } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [restockAmount, setRestockAmount] = useState<number>(10);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [fundsOpen, setFundsOpen] = useState(false);
  const [fundsAmount, setFundsAmount] = useState(1000);
  const [aiTip, setAiTip] = useState("Monitoring supply levels... Type 'Analyze' for procurement strategy.");

  const analyzeStock = () => {
    const critical = inventory.filter(i => i.quantity <= i.threshold);
    if (critical.length > 0) {
      setAiTip(`URGENT: ${critical[0].name} is below safe threshold. I recommend restocking ${critical[0].threshold * 2} units to cover projected 48h demand.`);
    } else {
      setAiTip("Inventory health is 100%. All safety buffers are optimal for current sales velocity.");
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRestock = () => {
    if (selectedItem && restockAmount > 0) {
      restockItem(selectedItem, restockAmount);
      setOpen(false);
      setRestockAmount(10);
    }
  };

  const handleAddFunds = () => {
    addFunds(fundsAmount);
    setFundsOpen(false);
  };

  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent uppercase italic">Inventory Center</h2>
          <p className="text-muted-foreground font-medium">Real-time supply chain monitoring & replenishment.</p>
        </div>
        <div className="flex items-center gap-6">
          <Card className="bg-emerald-500/10 border-emerald-500/20 p-4 rounded-2xl flex items-center gap-4 max-w-sm">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <DollarSign className="text-emerald-500 h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Operating Budget</p>
              <p className="text-xl font-black text-emerald-500 leading-tight">${operatingFunds.toFixed(2)}</p>
            </div>
            <Dialog open={fundsOpen} onOpenChange={setFundsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-500">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Operating Funds</DialogTitle>
                  <DialogDescription>Inject capital into the operating budget for restocking.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label>Amount ($)</Label>
                  <Input 
                    type="number" 
                    value={fundsAmount} 
                    onChange={(e) => setFundsAmount(Number(e.target.value))} 
                    className="mt-2"
                  />
                </div>
                <DialogFooter>
                  <Button onClick={handleAddFunds}>Confirm Deposit</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Card>

          <Card className="bg-primary/5 border-primary/20 p-4 rounded-2xl flex items-center gap-4 max-w-sm">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <Zap className="text-primary h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">ShelfSense AI Agent</p>
              <p className="text-xs font-bold text-white leading-tight">{aiTip}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={analyzeStock} className="hover:bg-primary/20">Analyze</Button>
          </Card>
          
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Filter SKUs..."
              className="pl-10 w-[250px] rounded-2xl bg-white/5 border-white/10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </motion.div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px] font-mono">SKU</TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price/Unit</TableHead>
              <TableHead className="w-[200px]">Stock Level</TableHead>
              <TableHead className="text-right">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventory.map((item) => {
              const stockPercentage = Math.min(100, (item.quantity / (item.threshold * 4)) * 100);
              const isLow = item.quantity <= item.threshold;

              return (
                <TableRow key={item.id}>
                  <TableCell className="font-mono font-medium">{item.sku}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">{item.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">${item.pricePerUnit.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{item.quantity.toFixed(1)} {item.unit}</span>
                        <span className="text-muted-foreground">Threshold: {item.threshold}</span>
                      </div>
                      <Progress 
                        value={stockPercentage} 
                        className={`h-2 ${isLow ? 'bg-destructive/20 [&>div]:bg-destructive' : '[&>div]:bg-emerald-500'}`} 
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {isLow ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="h-3 w-3" /> Low Stock
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-emerald-500 text-emerald-500">
                        In Stock
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog open={open && selectedItem === item.id} onOpenChange={(isOpen) => {
                      setOpen(isOpen);
                      if (isOpen) setSelectedItem(item.id);
                      else setSelectedItem(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-1" /> Restock
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Restock {item.name}</DialogTitle>
                          <DialogDescription>
                            Enter the amount of {item.unit} received. This will update the inventory count and log the cost.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">
                              Amount ({item.unit})
                            </Label>
                            <Input
                              id="amount"
                              type="number"
                              value={restockAmount}
                              onChange={(e) => setRestockAmount(Number(e.target.value))}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Est. Cost</Label>
                            <div className="col-span-3 font-mono text-muted-foreground">
                              ${(restockAmount * item.pricePerUnit).toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleRestock}>Confirm Restock</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
