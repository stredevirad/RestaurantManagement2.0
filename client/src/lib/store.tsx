import React, { createContext, useContext, useState, useEffect } from 'react';
import { InventoryItem, MenuItem, LogEntry, initialInventory, initialMenu } from './mockData';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface StoreContextType {
  inventory: InventoryItem[];
  menu: MenuItem[];
  logs: LogEntry[];
  totalRevenue: number;
  totalCost: number;
  
  // Actions
  restockItem: (id: string, amount: number) => void;
  processSale: (menuItemId: string) => boolean;
  recordWaste: (menuItemId: string, reason: string) => void;
  submitRating: (menuItemId: string, rating: number) => void;
  getLowStockItems: () => InventoryItem[];
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [menu, setMenu] = useState<MenuItem[]>(initialMenu);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const { toast } = useToast();

  const addLog = (type: LogEntry['type'], message: string, amount: number = 0) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      type,
      message,
      amount
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const getLowStockItems = () => {
    return inventory.filter(item => item.quantity <= item.threshold);
  };

  // Automated detection of low stock - Check whenever inventory changes
  useEffect(() => {
    const lowStock = getLowStockItems();
    if (lowStock.length > 0) {
      // In a real app, this would debounce or check if alert already sent today
      // For demo, we just log it conceptually or show a toast if it's a new critical low
    }
  }, [inventory]);

  const restockItem = (id: string, amount: number) => {
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    const cost = amount * item.pricePerUnit;
    
    setInventory(prev => prev.map(i => 
      i.id === id ? { ...i, quantity: i.quantity + amount, lastRestocked: new Date().toISOString() } : i
    ));
    
    setTotalCost(prev => prev + cost);
    addLog('restock', `Replenished ${amount}${item.unit} of ${item.name}`, -cost);
    
    toast({
      title: "Stock Replenished",
      description: `Added ${amount}${item.unit} to ${item.name}. Register updated.`,
    });
  };

  const processSale = (menuItemId: string): boolean => {
    const menuItem = menu.find(m => m.id === menuItemId);
    if (!menuItem) return false;

    // Check availability first
    const canMake = menuItem.ingredients.every(ing => {
      const invItem = inventory.find(i => i.id === ing.inventoryId);
      return invItem && invItem.quantity >= ing.quantity;
    });

    if (!canMake) {
      toast({
        variant: "destructive",
        title: "Out of Stock",
        description: `Cannot make ${menuItem.name}. Missing ingredients.`,
      });
      return false;
    }

    // Deduct stock
    setInventory(prev => prev.map(item => {
      const ing = menuItem.ingredients.find(i => i.inventoryId === item.id);
      return ing ? { ...item, quantity: Math.max(0, item.quantity - ing.quantity) } : item;
    }));

    setTotalRevenue(prev => prev + menuItem.price);
    addLog('sale', `Sold 1x ${menuItem.name}`, menuItem.price);
    
    toast({
      title: "Order Processed",
      description: `${menuItem.name} sent to kitchen. Inventory updated.`,
    });

    return true;
  };

  const recordWaste = (menuItemId: string, reason: string) => {
    const menuItem = menu.find(m => m.id === menuItemId);
    if (!menuItem) return;

    // Deduct ingredients again (since the first set was wasted)
    // AND trigger auto-restock logic simulation (Chef hit fail button)
    
    let canRestock = true;
    const missingIngredients: string[] = [];

    // Check if we have enough to remake immediately
    menuItem.ingredients.forEach(ing => {
      const invItem = inventory.find(i => i.id === ing.inventoryId);
      if (!invItem || invItem.quantity < ing.quantity) {
        canRestock = false;
        if (invItem) missingIngredients.push(invItem.name);
      }
    });

    if (canRestock) {
      setInventory(prev => prev.map(item => {
        const ing = menuItem.ingredients.find(i => i.inventoryId === item.id);
        return ing ? { ...item, quantity: Math.max(0, item.quantity - ing.quantity) } : item;
      }));
      addLog('waste', `Chef reported failure on ${menuItem.name}: ${reason}. Ingredients re-allocated for remake.`, 0);
      toast({
        variant: "destructive",
        title: "Dish Failed - Remaking",
        description: `Ingredients for ${menuItem.name} deducted again. Reason: ${reason}`,
      });
    } else {
      addLog('waste', `Chef reported failure on ${menuItem.name}, but insufficient stock to remake! Missing: ${missingIngredients.join(', ')}`, 0);
       toast({
        variant: "destructive",
        title: "CRITICAL: Cannot Remake",
        description: `Not enough stock to remake ${menuItem.name}. Missing: ${missingIngredients.join(', ')}`,
      });
    }
  };

  const submitRating = (menuItemId: string, rating: number) => {
    setMenu(prev => prev.map(item => {
      if (item.id === menuItemId) {
        const newCount = item.ratingCount + 1;
        const newRating = ((item.rating * item.ratingCount) + rating) / newCount;
        return { ...item, rating: parseFloat(newRating.toFixed(1)), ratingCount: newCount };
      }
      return item;
    }));
    addLog('system', `New rating for ${menu.find(m => m.id === menuItemId)?.name}: ${rating}/5`);
  };

  return (
    <StoreContext.Provider value={{
      inventory,
      menu,
      logs,
      totalRevenue,
      totalCost,
      restockItem,
      processSale,
      recordWaste,
      submitRating,
      getLowStockItems
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
