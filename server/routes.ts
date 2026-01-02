import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GoogleGenAI, FunctionCallingConfigMode, Type } from "@google/genai";
import { initialInventory, initialMenu } from "../client/src/lib/mockData";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

// Function declarations for Gemini AI
const functions = [
  {
    name: "get_inventory_status",
    description: "Get current inventory levels and low stock items",
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: "restock_item",
    description: "Restock an inventory item with a specified quantity",
    parameters: {
      type: Type.OBJECT,
      properties: {
        itemId: { type: Type.STRING, description: "The inventory item ID" },
        quantity: { type: Type.NUMBER, description: "Quantity to add" },
      },
      required: ["itemId", "quantity"],
    },
  },
  {
    name: "get_menu_info",
    description: "Get menu items and their details",
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_menu_item_details",
    description: "Get detailed info about a specific menu item including ingredients, to help customer make allergy-aware choices",
    parameters: {
      type: Type.OBJECT,
      properties: {
        menuItemName: { type: Type.STRING, description: "The name of the menu item (partial match supported)" },
      },
      required: ["menuItemName"],
    },
  },
  {
    name: "process_order",
    description: "Process a complete order after confirming allergies and modifications with the customer",
    parameters: {
      type: Type.OBJECT,
      properties: {
        menuItemId: { type: Type.STRING, description: "The menu item ID to order" },
        customerName: { type: Type.STRING, description: "Customer's name (default: Walk-in)" },
        allergies: { type: Type.STRING, description: "Customer's allergies if any" },
        removedIngredients: { type: Type.STRING, description: "Comma-separated list of ingredients to remove" },
        specialInstructions: { type: Type.STRING, description: "Any special instructions for the order" },
        quantity: { type: Type.NUMBER, description: "Number of items (default: 1)" },
      },
      required: ["menuItemId"],
    },
  },
  {
    name: "get_recent_orders",
    description: "Get recent orders for the live feed and AI insights",
    parameters: {
      type: Type.OBJECT,
      properties: {
        limit: { type: Type.NUMBER, description: "Number of orders to retrieve (default: 10)" },
      },
      required: [],
    },
  },
  {
    name: "get_financial_status",
    description: "Get current operating funds, revenue, and costs",
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: "add_funds",
    description: "Add funds to the operating budget",
    parameters: {
      type: Type.OBJECT,
      properties: {
        amount: { type: Type.NUMBER, description: "Amount to add to budget" },
      },
      required: ["amount"],
    },
  },
  {
    name: "get_ai_insights",
    description: "Get AI-generated insights about sales and inventory",
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: [],
    },
  },
];

// Fallback function to format results nicely if AI fails
function formatFunctionResult(functionName: string, result: any): string {
  switch (functionName) {
    case "get_inventory_status":
      const lowItems = result.lowStockItems || [];
      if (lowItems.length === 0) {
        return `Great news! All inventory levels are healthy. You have ${result.totalItems} items with a total value of $${result.totalValue?.toFixed(2) || '0.00'}.`;
      }
      return `Inventory Alert!\n\nLow stock items:\n${lowItems.map((i: any) => `- ${i.name}: ${i.quantity} ${i.unit} (threshold: ${i.threshold})`).join('\n')}\n\nTotal inventory value: $${result.totalValue?.toFixed(2) || '0.00'}`;
    
    case "get_menu_info":
      const topItems = result.topRated || [];
      return `Menu Overview\n\nWe have ${result.totalItems} items across ${Object.keys(result.categories || {}).length} categories.\n\nTop Rated:\n${topItems.map((m: any) => `- ${m.name} - $${m.price} (${m.rating} stars)`).join('\n')}`;
    
    case "get_financial_status":
      const status = result.status === 'critical' ? 'Low funds - restock carefully!' : 'Healthy';
      return `Financial Summary\n\n- Operating Budget: $${result.operatingFunds?.toFixed(2) || '0.00'}\n- Total Revenue: $${result.totalRevenue?.toFixed(2) || '0.00'}\n- Total Costs: $${result.totalCost?.toFixed(2) || '0.00'}\n- Net Profit: $${result.netProfit?.toFixed(2) || '0.00'}\n\nStatus: ${status}`;
    
    case "restock_item":
      if (result.error) return `Error: ${result.error}`;
      return `Restocked successfully!\n\n- Item: ${result.item}\n- New Quantity: ${result.newQuantity}\n- Cost: $${result.cost?.toFixed(2)}\n- Remaining Budget: $${result.remainingFunds?.toFixed(2)}`;
    
    case "get_menu_item_details":
      if (result.error) return `Sorry, I couldn't find that menu item.`;
      const ingredients = result.ingredients?.join(', ') || 'No ingredients listed';
      return `**${result.name}** - $${result.price?.toFixed(2)}\n\n${result.description}\n\n**Ingredients:** ${ingredients}\n**Prep Time:** ${result.prepTime}\n\n💡 Before I place your order, do you have any allergies or would you like any ingredients removed?`;
    
    case "process_order":
      if (result.error) return `Could not process order: ${result.error}`;
      let orderSummary = `Order #${result.orderId} confirmed!\n\n`;
      orderSummary += `- Item: ${result.item}${result.quantity > 1 ? ` x${result.quantity}` : ''}\n`;
      orderSummary += `- Total: $${result.total?.toFixed(2)}\n`;
      if (result.removedIngredients) orderSummary += `- Removed: ${result.removedIngredients}\n`;
      if (result.specialInstructions) orderSummary += `- Notes: ${result.specialInstructions}\n`;
      if (result.allergies) orderSummary += `- Allergies noted: ${result.allergies}\n`;
      orderSummary += `\nYour order is being prepared. Thank you!`;
      return orderSummary;
    
    case "get_recent_orders":
      if (!result.orders || result.orders.length === 0) return "No recent orders found.";
      let orderList = `Recent Orders (${result.orders.length}):\n\n`;
      result.orders.forEach((o: any, i: number) => {
        orderList += `${i + 1}. Order #${o.id} - $${o.total?.toFixed(2)} (${o.status})\n`;
        o.items?.forEach((item: any) => {
          orderList += `   - ${item.menuItemName}${item.removedIngredients ? ` (no ${item.removedIngredients})` : ''}\n`;
        });
      });
      return orderList;
    
    case "add_funds":
      return `Funds added successfully!\n\n- Added: $${result.added?.toFixed(2)}\n- New Budget: $${result.newFunds?.toFixed(2)}`;
    
    case "get_ai_insights":
      return `Strategic Insights\n\n- Recent Orders: ${result.recentOrderCount}\n- Low Stock Items: ${result.lowStockCount}\n${result.lowStockItems?.length > 0 ? `- Items needing attention: ${result.lowStockItems.join(', ')}` : ''}\n- Top Sellers: ${result.topMenuItems?.join(', ') || 'N/A'}`;
    
    default:
      return "Action completed successfully.";
  }
}

// Function handlers
async function handleFunctionCall(functionName: string, args: any): Promise<any> {
  const inventory = await storage.getAllInventory();
  const menu = await storage.getAllMenu();
  
  switch (functionName) {
    case "get_inventory_status": {
      const lowStock = inventory.filter(item => item.quantity < item.threshold);
      return {
        totalItems: inventory.length,
        lowStockItems: lowStock.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          threshold: item.threshold,
        })),
        totalValue: inventory.reduce((acc, i) => acc + (i.quantity * i.pricePerUnit), 0),
      };
    }
    
    case "restock_item": {
      const item = await storage.getInventoryItem(args.itemId);
      if (!item) return { error: "Item not found" };
      
      const newQuantity = item.quantity + args.quantity;
      const cost = args.quantity * item.pricePerUnit;
      
      await storage.updateInventoryQuantity(args.itemId, newQuantity);
      
      const fundsStr = await storage.getSetting("operating_funds");
      const currentFunds = fundsStr ? parseFloat(fundsStr.value) : 5000;
      const newFunds = currentFunds - cost;
      await storage.updateSetting("operating_funds", newFunds.toString());
      
      await storage.createLog({
        id: `log-${Date.now()}`,
        type: "restock",
        message: `Restocked ${item.name}: +${args.quantity} ${item.unit}`,
        amount: -cost,
      });
      
      return {
        success: true,
        item: item.name,
        newQuantity,
        cost,
        remainingFunds: newFunds,
      };
    }
    
    case "get_menu_info": {
      return {
        totalItems: menu.length,
        categories: {
          main: menu.filter(m => m.category === "main").length,
          appetizer: menu.filter(m => m.category === "appetizer").length,
          dessert: menu.filter(m => m.category === "dessert").length,
          drink: menu.filter(m => m.category === "drink").length,
        },
        topRated: menu.sort((a, b) => b.rating - a.rating).slice(0, 3).map(m => ({
          name: m.name,
          rating: m.rating,
          price: m.price,
        })),
      };
    }
    
    case "get_menu_item_details": {
      const searchName = args.menuItemName.toLowerCase();
      const menuItem = menu.find(m => m.name.toLowerCase().includes(searchName));
      if (!menuItem) return { error: "Menu item not found" };
      
      const ingredientIds = menuItem.ingredients.map(ing => ing.inventoryId);
      const ingredientNames = await Promise.all(
        ingredientIds.map(async (id) => {
          const inv = await storage.getInventoryItem(id);
          return inv?.name || 'Unknown';
        })
      );
      
      return {
        id: menuItem.id,
        name: menuItem.name,
        description: menuItem.description,
        price: menuItem.price,
        prepTime: menuItem.prepTime,
        category: menuItem.category,
        ingredients: ingredientNames,
        rating: menuItem.rating,
      };
    }
    
    case "process_order": {
      const menuItem = await storage.getMenuItem(args.menuItemId);
      if (!menuItem) return { error: "Menu item not found" };
      
      const ingredients = await storage.getMenuIngredients(args.menuItemId);
      const quantity = args.quantity || 1;
      
      // Check stock (only for ingredients not being removed)
      const removedList = (args.removedIngredients || '').toLowerCase().split(',').map((s: string) => s.trim());
      
      for (const ing of ingredients) {
        const invItem = await storage.getInventoryItem(ing.inventoryId);
        if (!invItem) continue;
        
        // Skip removed ingredients
        const isRemoved = removedList.some((r: string) => invItem.name.toLowerCase().includes(r));
        if (isRemoved) continue;
        
        if (invItem.quantity < ing.quantity * quantity) {
          return { error: `Insufficient ${invItem.name}` };
        }
      }
      
      // Deduct inventory (skip removed ingredients)
      for (const ing of ingredients) {
        const invItem = await storage.getInventoryItem(ing.inventoryId);
        if (!invItem) continue;
        
        const isRemoved = removedList.some((r: string) => invItem.name.toLowerCase().includes(r));
        if (isRemoved) continue;
        
        await storage.updateInventoryQuantity(ing.inventoryId, invItem.quantity - (ing.quantity * quantity));
      }
      
      // Calculate total
      const total = menuItem.price * quantity;
      
      // Update funds
      const fundsStr = await storage.getSetting("operating_funds");
      const currentFunds = fundsStr ? parseFloat(fundsStr.value) : 5000;
      const newFunds = currentFunds + total;
      await storage.updateSetting("operating_funds", newFunds.toString());
      
      // Create order in database
      const order = await storage.createOrder(
        { 
          total, 
          customerName: args.customerName || "Walk-in",
          allergies: args.allergies || null,
          status: "pending"
        },
        [{
          menuItemId: args.menuItemId,
          menuItemName: menuItem.name,
          price: menuItem.price,
          quantity,
          removedIngredients: args.removedIngredients || null,
          specialInstructions: args.specialInstructions || null,
        }]
      );
      
      // Create log for live feed
      let logMessage = `Order #${order.id}: ${menuItem.name}`;
      if (quantity > 1) logMessage += ` x${quantity}`;
      if (args.removedIngredients) logMessage += ` (no ${args.removedIngredients})`;
      if (args.customerName && args.customerName !== "Walk-in") logMessage += ` for ${args.customerName}`;
      
      await storage.createLog({
        id: `log-${Date.now()}`,
        type: "sale",
        message: logMessage,
        amount: total,
      });
      
      return {
        success: true,
        orderId: order.id,
        item: menuItem.name,
        quantity,
        total,
        customerName: args.customerName || "Walk-in",
        allergies: args.allergies,
        removedIngredients: args.removedIngredients,
        specialInstructions: args.specialInstructions,
        newFunds,
      };
    }
    
    case "get_recent_orders": {
      const limit = args.limit || 10;
      const recentOrders = await storage.getRecentOrdersWithItems(limit);
      
      return {
        orders: recentOrders.map(o => ({
          id: o.id,
          total: o.total,
          customerName: o.customerName,
          allergies: o.allergies,
          status: o.status,
          createdAt: o.createdAt,
          items: o.items.map(item => ({
            menuItemName: item.menuItemName,
            price: item.price,
            quantity: item.quantity,
            removedIngredients: item.removedIngredients,
            specialInstructions: item.specialInstructions,
          })),
        })),
      };
    }
    
    case "get_financial_status": {
      const fundsStr = await storage.getSetting("operating_funds");
      const operatingFunds = fundsStr ? parseFloat(fundsStr.value) : 5000;
      const revenue = await storage.getTotalRevenue();
      const cost = await storage.getTotalCost();
      
      return {
        operatingFunds,
        totalRevenue: revenue,
        totalCost: cost,
        netProfit: revenue - cost,
        status: operatingFunds < 1000 ? "critical" : "stable",
      };
    }
    
    case "add_funds": {
      const fundsStr = await storage.getSetting("operating_funds");
      const currentFunds = fundsStr ? parseFloat(fundsStr.value) : 5000;
      const newFunds = currentFunds + args.amount;
      await storage.updateSetting("operating_funds", newFunds.toString());
      
      await storage.createLog({
        id: `log-${Date.now()}`,
        type: "system",
        message: `Funds Added: $${args.amount.toFixed(2)}`,
        amount: args.amount,
      });
      
      return {
        success: true,
        newFunds,
        added: args.amount,
      };
    }
    
    case "get_ai_insights": {
      const recentOrders = await storage.getRecentOrders(10);
      const lowStock = inventory.filter(item => item.quantity < item.threshold);
      
      return {
        recentOrderCount: recentOrders.length,
        lowStockCount: lowStock.length,
        lowStockItems: lowStock.map(i => i.name),
        topMenuItems: menu.sort((a, b) => b.ratingCount - a.ratingCount).slice(0, 3).map(m => m.name),
      };
    }
    
    default:
      return { error: "Unknown function" };
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Initialize database with mock data if empty
  app.post("/api/init", async (_req: Request, res: Response) => {
    try {
      const existingInventory = await storage.getAllInventory();
      if (existingInventory.length === 0) {
        // Convert date strings to proper format for database
        const inventoryWithoutTimestamp = initialInventory.map(({ lastRestocked, ...rest }) => rest);
        await storage.bulkCreateInventory(inventoryWithoutTimestamp);
        
        const menuIngredients: any[] = [];
        initialMenu.forEach((item: any) => {
          item.ingredients.forEach((ing: any) => {
            menuIngredients.push({
              menuItemId: item.id,
              inventoryId: ing.inventoryId,
              quantity: ing.quantity,
            });
          });
        });
        
        const menuWithoutIngredients = initialMenu.map(({ ingredients, ...item }: any) => item);
        await storage.bulkCreateMenu(menuWithoutIngredients, menuIngredients);
        
        await storage.updateSetting("operating_funds", "5000");
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('Init error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Inventory routes
  app.get("/api/inventory", async (_req: Request, res: Response) => {
    try {
      const items = await storage.getAllInventory();
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/inventory/:id/restock", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      
      const item = await storage.getInventoryItem(id);
      if (!item) return res.status(404).json({ error: "Item not found" });
      
      const newQuantity = item.quantity + quantity;
      const cost = quantity * item.pricePerUnit;
      
      await storage.updateInventoryQuantity(id, newQuantity);
      
      const fundsStr = await storage.getSetting("operating_funds");
      const currentFunds = fundsStr ? parseFloat(fundsStr.value) : 5000;
      const newFunds = currentFunds - cost;
      await storage.updateSetting("operating_funds", newFunds.toString());
      
      await storage.createLog({
        id: `log-${Date.now()}`,
        type: "restock",
        message: `Restocked ${item.name}: +${quantity} ${item.unit}`,
        amount: -cost,
      });
      
      res.json({ success: true, newQuantity, cost, remainingFunds: newFunds });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Menu routes
  app.get("/api/menu", async (_req: Request, res: Response) => {
    try {
      const items = await storage.getAllMenu();
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/menu/:id/rate", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { rating } = req.body;
      
      const updated = await storage.updateMenuRating(id, rating);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Sales routes
  app.post("/api/sales/checkout", async (req: Request, res: Response) => {
    try {
      const { items } = req.body; // array of { menuItemId, quantity, modifications }
      
      let totalPrice = 0;
      const results = [];
      
      for (const cartItem of items) {
        const menuItem = await storage.getMenuItem(cartItem.menuItemId);
        if (!menuItem) continue;
        
        const ingredients = await storage.getMenuIngredients(cartItem.menuItemId);
        
        // Check stock
        let canProcess = true;
        for (const ing of ingredients) {
          const invItem = await storage.getInventoryItem(ing.inventoryId);
          if (!invItem || invItem.quantity < ing.quantity * cartItem.quantity) {
            canProcess = false;
            break;
          }
        }
        
        if (!canProcess) {
          results.push({ menuItemId: cartItem.menuItemId, success: false });
          continue;
        }
        
        // Deduct inventory
        for (const ing of ingredients) {
          const invItem = await storage.getInventoryItem(ing.inventoryId);
          if (invItem) {
            await storage.updateInventoryQuantity(
              ing.inventoryId,
              invItem.quantity - ing.quantity * cartItem.quantity
            );
          }
        }
        
        totalPrice += menuItem.price * cartItem.quantity;
        results.push({ menuItemId: cartItem.menuItemId, success: true });
        
        await storage.createLog({
          id: `log-${Date.now()}-${Math.random()}`,
          type: "sale",
          message: `Sold ${menuItem.name} x${cartItem.quantity}`,
          amount: menuItem.price * cartItem.quantity,
        });
      }
      
      // Update funds
      const fundsStr = await storage.getSetting("operating_funds");
      const currentFunds = fundsStr ? parseFloat(fundsStr.value) : 5000;
      const newFunds = currentFunds + totalPrice;
      await storage.updateSetting("operating_funds", newFunds.toString());
      
      // Create order
      await storage.createOrder(
        { total: totalPrice },
        items.map((item: any) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          modifications: JSON.stringify(item.modifications || {}),
        }))
      );
      
      res.json({ success: true, results, total: totalPrice, newFunds });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Settings routes
  app.get("/api/settings/:key", async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const setting = await storage.getSetting(key);
      res.json(setting || { key, value: "0" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/settings/:key", async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      const setting = await storage.updateSetting(key, value);
      res.json(setting);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Logs routes
  app.get("/api/logs", async (_req: Request, res: Response) => {
    try {
      const logs = await storage.getAllLogs();
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Recent orders route for dashboard
  app.get("/api/orders/recent", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const orders = await storage.getRecentOrdersWithItems(limit);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stats routes
  app.get("/api/stats", async (_req: Request, res: Response) => {
    try {
      const fundsStr = await storage.getSetting("operating_funds");
      const operatingFunds = fundsStr ? parseFloat(fundsStr.value) : 5000;
      const revenue = await storage.getTotalRevenue();
      const cost = await storage.getTotalCost();
      const inventory = await storage.getAllInventory();
      const lowStock = inventory.filter(item => item.quantity < item.threshold);
      
      res.json({
        operatingFunds,
        totalRevenue: revenue,
        totalCost: cost,
        lowStockCount: lowStock.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add funds endpoint
  app.post("/api/funds/add", async (req: Request, res: Response) => {
    try {
      const { amount } = req.body;
      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      const fundsStr = await storage.getSetting("operating_funds");
      const currentFunds = fundsStr ? parseFloat(fundsStr.value) : 5000;
      const newFunds = currentFunds + amount;
      
      await storage.updateSetting("operating_funds", newFunds.toString());
      await storage.createLog({ id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, type: "system", message: `Funds Added: $${amount.toFixed(2)}`, amount: 0 });
      
      res.json({ success: true, newFunds });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Restock inventory endpoint
  app.post("/api/inventory/restock", async (req: Request, res: Response) => {
    try {
      const { itemId, quantity } = req.body;
      if (!itemId || typeof quantity !== 'number' || quantity <= 0) {
        return res.status(400).json({ message: "Invalid item or quantity" });
      }
      
      const item = await storage.getInventoryItem(itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      const cost = quantity * item.pricePerUnit;
      
      // Check funds
      const fundsStr = await storage.getSetting("operating_funds");
      const currentFunds = fundsStr ? parseFloat(fundsStr.value) : 5000;
      
      if (currentFunds < cost) {
        return res.status(400).json({ message: `Insufficient funds. Need $${cost.toFixed(2)} but only have $${currentFunds.toFixed(2)}.` });
      }
      
      // Deduct from funds
      await storage.updateSetting("operating_funds", (currentFunds - cost).toString());
      
      // Update inventory
      await storage.updateInventoryQuantity(itemId, item.quantity + quantity);
      
      // Log the restock
      await storage.createLog({ id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, type: "restock", message: `Replenished ${quantity}${item.unit} of ${item.name}`, amount: -cost });
      await storage.createLog({ id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, type: "email", message: `RESTOCK NOTIFICATION: ${item.name} has been replenished by ${quantity} ${item.unit}`, amount: 0 });
      
      res.json({ success: true, newQuantity: item.quantity + quantity, cost });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create order endpoint (for POS and API orders)
  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      const { menuItemId, customerName, allergies, removedIngredients, specialInstructions, quantity } = req.body;
      
      const menuItem = await storage.getMenuItem(menuItemId);
      if (!menuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      const qty = quantity || 1;
      const totalPrice = menuItem.price * qty;
      
      // Deduct inventory for this order
      const ingredients = await storage.getMenuIngredients(menuItemId);
      const removedList = (removedIngredients || '').split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);
      
      for (const ing of ingredients) {
        const invItem = await storage.getInventoryItem(ing.inventoryId);
        if (invItem) {
          const shouldSkip = removedList.some((r: string) => invItem.name.toLowerCase().includes(r));
          if (!shouldSkip) {
            const newQty = Math.max(0, invItem.quantity - (ing.quantity * qty));
            await storage.updateInventoryQuantity(ing.inventoryId, newQty);
          }
        }
      }
      
      // Update funds (revenue)
      const fundsStr = await storage.getSetting("operating_funds");
      const currentFunds = fundsStr ? parseFloat(fundsStr.value) : 5000;
      await storage.updateSetting("operating_funds", (currentFunds + totalPrice).toString());
      
      // Create order with items in database
      const orderItemsList = [{
        menuItemId,
        menuItemName: menuItem.name,
        quantity: qty,
        price: menuItem.price,
        removedIngredients: removedIngredients || null,
        specialInstructions: specialInstructions || null,
      }];
      
      const order = await storage.createOrder({
        total: totalPrice,
        status: "pending",
        customerName: customerName || "Walk-in",
        allergies: allergies || null,
      }, orderItemsList);
      
      // Log the sale
      const modText = removedIngredients ? ` (No: ${removedIngredients})` : '';
      await storage.createLog({ id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, type: "sale", message: `Order #${order.id}: ${qty}x ${menuItem.name}${modText} for ${customerName || 'Walk-in'}`, amount: totalPrice });
      
      res.json({ success: true, orderId: order.id, total: totalPrice });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // AI Chatbot with Function Calling
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const { message, conversationId } = req.body;
      
      let convId = conversationId;
      if (!convId) {
        const conv = await storage.createConversation("New Chat");
        convId = conv.id;
      }
      
      await storage.createMessage(convId, "user", message);
      
      const history = await storage.getMessagesByConversation(convId);
      const chatMessages = history.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }));
      
      // Get current system state for context
      const inventory = await storage.getAllInventory();
      const menu = await storage.getAllMenu();
      const fundsStr = await storage.getSetting("operating_funds");
      const operatingFunds = fundsStr ? parseFloat(fundsStr.value) : 5000;
      const lowStock = inventory.filter(item => item.quantity < item.threshold);
      
      const menuItemsForContext = menu.map(m => `${m.name} (ID: ${m.id})`).join(', ');
      
      const systemContext = `You are THALLIPOLI AI, a friendly and helpful assistant for a restaurant called THALLIPOLI. You speak in a warm, professional manner.

CURRENT RESTAURANT STATUS:
- Operating Budget: $${operatingFunds.toFixed(2)}
- Low Stock Alerts: ${lowStock.length > 0 ? lowStock.map(i => i.name).join(', ') : 'None - all stock levels healthy'}
- Active Menu Items: ${menu.length}
- Inventory Items: ${inventory.length}

AVAILABLE MENU ITEMS (use these exact IDs when processing orders):
${menuItemsForContext}

CAPABILITIES:
- Check inventory levels and low stock alerts
- Restock items (deducts from budget)
- Process orders with allergy checks
- Check financial status (budget, revenue, costs)
- Add funds to operating budget
- Provide strategic insights
- View recent orders

ORDER FLOW - VERY IMPORTANT:
When a customer wants to order something:
1. First, use get_menu_item_details to show them the item's ingredients
2. ASK the customer: "Do you have any allergies or would you like any ingredients removed?"
3. WAIT for their response before processing the order
4. Only after they confirm (even if they say "no allergies" or "none"), use process_order with their preferences
5. Create proper orders that show up in the live feed

EXAMPLE ORDER CONVERSATION:
Customer: "I want to order a burger"
You: [Call get_menu_item_details] "Great choice! Our Classic Cheeseburger ($12.99) contains:
- Beef patty, Cheese, Lettuce, Tomato, Onion, Special sauce, Sesame bun

Do you have any allergies or would you like any ingredients removed?"

Customer: "No onions please, and I'm allergic to dairy"
You: [Call process_order with removedIngredients: "onions" and allergies: "dairy"]
"Got it! I've placed your order:
- Classic Cheeseburger (no onions)
- Allergy note: dairy
Your order #1 is being prepared!"

RESPONSE FORMATTING RULES - VERY IMPORTANT:
1. NEVER return raw JSON or code to the user
2. Always format responses in a friendly, readable way
3. Use bullet points or numbered lists for multiple items
4. Include relevant emojis to make responses engaging (sparingly)
5. When reporting data, summarize it naturally in sentences
6. Keep responses concise but informative
7. If an action was completed, confirm it clearly

Always be helpful and suggest related actions the user might want to take.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: systemContext }] },
          ...chatMessages,
        ],
        config: {
          tools: [{ functionDeclarations: functions }],
          toolConfig: { functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO } },
        },
      });
      
      const candidate = response.candidates?.[0];
      let finalResponse = "";
      
      // Handle function calls
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.functionCall) {
            const functionResult = await handleFunctionCall(
              part.functionCall.name,
              part.functionCall.args
            );
            
            const formatInstruction = `Based on this function result, provide a clear, friendly response to the user. Format nicely with bullet points if listing items. NEVER show raw JSON - always convert data into natural language sentences.`;
            
            const followUp = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: [
                { role: "user", parts: [{ text: systemContext }] },
                ...chatMessages,
                { role: "model", parts: [{ functionCall: part.functionCall }] },
                {
                  role: "user",
                  parts: [{
                    functionResponse: {
                      name: part.functionCall.name,
                      response: functionResult,
                    },
                  }],
                },
                { role: "user", parts: [{ text: formatInstruction }] },
              ],
            });
            
            finalResponse = followUp.text || formatFunctionResult(part.functionCall.name, functionResult);
          } else if (part.text) {
            finalResponse += part.text;
          }
        }
      } else {
        finalResponse = response.text || "I apologize, but I couldn't process that request.";
      }
      
      await storage.createMessage(convId, "assistant", finalResponse);
      
      res.json({
        conversationId: convId,
        response: finalResponse,
      });
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Conversation management
  app.get("/api/conversations", async (_req: Request, res: Response) => {
    try {
      const conversations = await storage.getAllConversations();
      res.json(conversations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const messages = await storage.getMessagesByConversation(id);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
