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
  addToCart: (menuItemId: string, modifications: { remove: string[], add: string[] }) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  checkout: () => void;
  cart: CartItem[];

  restockItem: (id: string, amount: number) => void;
  processSale: (menuItemId: string, modifications?: { remove: string[], add: string[] }) => boolean;
  recordWaste: (menuItemId: string, reason: string) => void;
  submitRating: (menuItemId: string, rating: number) => void;
  getLowStockItems: () => InventoryItem[];
  getDemandForecast: () => { itemId: string, name: string, suggestedStock: number, reason: string }[];
  getChefPerformance: () => { name: string, rating: number, sales: number, raiseSuggested: boolean }[];
  addFunds: (amount: number) => void;
  operatingFunds: number;
  realtimeInsights: string[];
}

export interface CartItem {
  id: string;
  menuItemId: string;
  quantity: number;
  modifications: { remove: string[], add: string[] };
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [menu, setMenu] = useState<MenuItem[]>(initialMenu);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [operatingFunds, setOperatingFunds] = useState(5000); // Initial budget
  const [cart, setCart] = useState<CartItem[]>([]);
  const [realtimeInsights, setRealtimeInsights] = useState<string[]>([]);
  const [orderBuffer, setOrderBuffer] = useState<{items: string[], total: number}[]>([]);
  const { toast } = useToast();

  const addToCart = (menuItemId: string, modifications: { remove: string[], add: string[] }) => {
    const newItem: CartItem = {
      id: Math.random().toString(36).substr(2, 9),
      menuItemId,
      quantity: 1,
      modifications
    };
    setCart(prev => [...prev, newItem]);
    toast({
      title: "Added to Cart",
      description: "Item added to your current order.",
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const checkout = () => {
    if (cart.length === 0) return;
    
    let successCount = 0;
    cart.forEach(item => {
      const success = processSale(item.menuItemId, item.modifications);
      if (success) successCount++;
    });

    if (successCount > 0) {
      setCart([]);
      
      // Add current order to buffer for analysis
      const orderTotal = cart.reduce((sum, item) => {
        const m = menu.find(i => i.id === item.menuItemId);
        return sum + (m?.price || 0) * item.quantity;
      }, 0);
      
      const orderItems = cart.map(item => {
         const m = menu.find(i => i.id === item.menuItemId);
         return m?.name || 'Unknown';
      });

      setOrderBuffer(prev => {
        const newBuffer = [...prev, { items: orderItems, total: orderTotal }];
        
        if (newBuffer.length >= 10) {
           // ANALYZE BATCH
           const totalSales = newBuffer.reduce((sum, o) => sum + o.total, 0);
           const avgOrder = totalSales / newBuffer.length;
           
           // Find top selling item
           const itemCounts: Record<string, number> = {};
           newBuffer.flatMap(o => o.items).forEach(item => {
             itemCounts[item] = (itemCounts[item] || 0) + 1;
           });
           const topItem = Object.entries(itemCounts).sort((a,b) => b[1] - a[1])[0];
           
           // Generate detailed insight
           const insight = `BATCH ANALYSIS (Last 10 Orders): Avg Order Value: $${avgOrder.toFixed(2)}. Top Seller: ${topItem ? topItem[0] : 'None'} (${topItem ? topItem[1] : 0} sold). Restock priority: ${topItem ? topItem[0] : 'None'} ingredients.`;
           
           setRealtimeInsights(prevInsights => [insight, ...prevInsights].slice(0, 5));
           return []; // Clear buffer
        }
        return newBuffer;
      });

      // Generate AI Real-time Insight (Keep random one for immediate feedback too, or remove if too noisy)
      const randomInsight = [
        "Insight: High demand for burgers detected. Prepare more patties.",
        "Insight: Salad orders increasing. Ensure lettuce is prepped.",
        "Insight: Dessert sales peaking. Check chocolate stock.",
        "Insight: Lunch rush velocity suggests opening another register.",
        "Insight: Drink attach rate is low. Suggest upselling shakes."
      ][Math.floor(Math.random() * 5)];
      
      // Check Funds
      if (operatingFunds < 1000) {
         setRealtimeInsights(prev => ["CRITICAL: Operating funds low (<$1000). Restock carefully.", ...prev].slice(0, 5));
      }

      setRealtimeInsights(prev => [randomInsight, ...prev].slice(0, 5));

      toast({
        title: "Order Placed",
        description: `Successfully processed ${successCount} items.`,
      });
    }
  };

  const getDemandForecast = () => {
    // Simple mock logic: recommend stocking up on ingredients used in high-rating/high-sale items
    const forecast: { itemId: string, name: string, suggestedStock: number, reason: string }[] = [];
    
    // Find popular items (rating > 4.5 OR high rating count)
    const popularDishes = menu.filter(m => m.rating >= 4.5 || m.ratingCount > 100);
    
    popularDishes.forEach(dish => {
      dish.ingredients.forEach(ing => {
        const invItem = inventory.find(i => i.id === ing.inventoryId);
        if (invItem) {
          if (!forecast.find(f => f.itemId === invItem.id)) {
            forecast.push({
              itemId: invItem.id,
              name: invItem.name,
              suggestedStock: Math.ceil(invItem.threshold * 2.5),
              reason: `High demand for ${dish.name} (${dish.rating}★)`
            });
          }
        }
      });
    });
    
    return forecast;
  };

  const getChefPerformance = () => {
    // Group by chef
    const chefStats: Record<string, { ratingSum: number, count: number, sales: number }> = {};
    
    menu.forEach(item => {
      if (!item.chef) return;
      if (!chefStats[item.chef]) {
        chefStats[item.chef] = { ratingSum: 0, count: 0, sales: 0 };
      }
      chefStats[item.chef].ratingSum += (item.rating * item.ratingCount);
      chefStats[item.chef].count += item.ratingCount;
      // Mock sales calculation based on rating count as a proxy for popularity
      chefStats[item.chef].sales += (item.ratingCount * item.price);
    });

    return Object.entries(chefStats).map(([name, stats]) => {
      const avgRating = stats.ratingSum / stats.count;
      return {
        name,
        rating: avgRating,
        sales: stats.sales,
        raiseSuggested: avgRating > 4.6 && stats.sales > 2000 // Simple logic for raise
      };
    });
  };

  const addFunds = (amount: number) => {
    setOperatingFunds(prev => prev + amount);
    addLog('system', `Funds Added: $${amount.toFixed(2)}`);
    toast({
      title: "Funds Added",
      description: `$${amount.toFixed(2)} added to operating budget.`,
    });
  };

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
    
    if (operatingFunds < cost) {
      toast({
        variant: "destructive",
        title: "Insufficient Funds",
        description: `Need $${cost.toFixed(2)} but only have $${operatingFunds.toFixed(2)}.`,
      });
      return;
    }

    setOperatingFunds(prev => prev - cost);
    
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
      const ing = menuItem.ingredients.find(i => i.inventoryId === item.id);
      if (!ing) return item;
      
      // If user removed this ingredient, don't deduct
      if (modifications?.remove.includes(item.name)) return item;
      
      return { ...item, quantity: Math.max(0, item.quantity - ing.quantity) };
    }));

    setTotalRevenue(prev => prev + menuItem.price);
    setOperatingFunds(prev => prev + menuItem.price); // Revenue goes back to funds
    
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
      
      const wasteInsight = `LOSS ALERT: Waste recorded for ${menuItem.name}. Reason: ${reason}. Ingredients re-allocated. Cost Impact: Negligible (Stock available).`;
      setRealtimeInsights(prev => [wasteInsight, ...prev].slice(0, 5));

      addLog('waste', `Chef reported failure on ${menuItem.name}: ${reason}. Ingredients re-allocated for remake.`, 0);
      toast({
        variant: "destructive",
        title: "Dish Failed - Remaking",
        description: `Ingredients for ${menuItem.name} deducted again. Reason: ${reason}`,
      });
    } else {
      const missingText = missingIngredients.length > 0 ? ` Missing: ${missingIngredients.join(', ')}` : '';
      const wasteInsight = `LOSS ALERT: Waste recorded for ${menuItem.name}. Reason: ${reason}.${missingText} Revenue Opportunity Lost: $${menuItem.price.toFixed(2)}`;
      
      setRealtimeInsights(prev => [wasteInsight, ...prev].slice(0, 5));

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
      getLowStockItems,
      cart,
      addToCart,
      removeFromCart,
      clearCart,
      checkout,
      getDemandForecast,
      getChefPerformance,
      addFunds,
      operatingFunds,
      realtimeInsights
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
