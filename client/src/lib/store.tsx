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

    // Simulated email trigger
    if (type === 'email' || message.toLowerCase().includes('low stock') || message.toLowerCase().includes('depleted')) {
      toast({
        title: "Email Notification Sent",
        description: `Stock Manager notified: ${message}`,
      });
    }
  };

  const getLowStockItems = () => {
    return inventory.filter(item => item.quantity <= item.threshold);
  };

  // Automated detection of low stock - Check whenever inventory changes
  useEffect(() => {
    const lowStock = getLowStockItems();
    lowStock.forEach(item => {
      const isDepleted = item.quantity <= 0;
      const status = isDepleted ? 'DEPLETED' : 'LOW STOCK';
      
      // Prevent duplicate logs for the same state in a single session
      setLogs(currentLogs => {
        const hasRecentLog = currentLogs.slice(0, 5).some(l => 
          l.message.includes(item.name) && l.message.includes(status)
        );
        
        if (!hasRecentLog) {
          addLog('email', `ALERT: ${item.name} is ${status} (${item.quantity.toFixed(2)} ${item.unit} remaining)`);
        }
        return currentLogs;
      });
    });
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
    addLog('email', `RESTOCK NOTIFICATION: ${item.name} has been replenished by ${amount} ${item.unit}`);
    
    toast({
      title: "Stock Replenished",
      description: `Added ${amount}${item.unit} to ${item.name}. Register updated.`,
    });
  };

  const processSale = (menuItemId: string, modifications?: { remove: string[], add: string[] }): boolean => {
    const menuItem = menu.find(m => m.id === menuItemId);
    if (!menuItem) return false;

    // Check availability
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

    // Deduct stock (modified)
    setInventory(prev => prev.map(item => {
      const ing = menuItem.ingredients.find(i => i.id === item.id);
      if (!ing) return item;
      
      // If user removed this ingredient, don't deduct
      if (modifications?.remove.includes(item.name)) return item;
      
      return { ...item, quantity: Math.max(0, item.quantity - ing.quantity) };
    }));

    setTotalRevenue(prev => prev + menuItem.price);
    
    let modText = "";
    if (modifications && (modifications.remove.length > 0 || modifications.add.length > 0)) {
      modText = ` (Mods: -${modifications.remove.join(',')} +${modifications.add.join(',')})`;
    }
    
    addLog('sale', `Sold 1x ${menuItem.name}${modText}`, menuItem.price);
    
    toast({
      title: "Order Processed",
      description: `${menuItem.name}${modText} sent to kitchen.`,
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
    const menuItem = menu.find(m => m.id === menuItemId);
    if (!menuItem) return;

    setMenu(prev => prev.map(item => {
      if (item.id === menuItemId) {
        const newCount = item.ratingCount + 1;
        const newRating = ((item.rating * item.ratingCount) + rating) / newCount;
        return { ...item, rating: parseFloat(newRating.toFixed(1)), ratingCount: newCount };
      }
      return item;
    }));

    // Demand-based re-supply logic: Increase threshold if rating is high
    if (rating >= 4) {
      setInventory(prev => prev.map(invItem => {
        const isIngredient = menuItem.ingredients.some(ing => ing.inventoryId === invItem.id);
        if (isIngredient) {
          // Increase threshold to maintain higher buffer for high-demand items
          return { ...invItem, threshold: Math.ceil(invItem.threshold * 1.05) };
        }
        return invItem;
      }));
      addLog('system', `High rating (${rating}/5) for ${menuItem.name}. Adjusting ingredient safety thresholds for increased demand.`);
    }

    addLog('system', `New rating for ${menuItem.name} (Chef: ${menuItem.chef}): ${rating}/5`);
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
