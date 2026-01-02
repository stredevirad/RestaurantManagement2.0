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
import { Plus, Search, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Label } from "@/components/ui/label";

export default function InventoryPage() {
  const { inventory, restockItem } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [restockAmount, setRestockAmount] = useState<number>(10);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
          <p className="text-muted-foreground">Monitor stock levels and replenish supplies.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search SKUs..."
              className="pl-8 w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

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
