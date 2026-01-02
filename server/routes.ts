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
    name: "process_sale",
    description: "Process a sale for a menu item",
    parameters: {
      type: Type.OBJECT,
      properties: {
        menuItemId: { type: Type.STRING, description: "The menu item ID to sell" },
      },
      required: ["menuItemId"],
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
    
    case "process_sale": {
      const menuItem = await storage.getMenuItem(args.menuItemId);
      if (!menuItem) return { error: "Menu item not found" };
      
      const ingredients = await storage.getMenuIngredients(args.menuItemId);
      
      // Check stock
      for (const ing of ingredients) {
        const invItem = await storage.getInventoryItem(ing.inventoryId);
        if (!invItem || invItem.quantity < ing.quantity) {
          return { error: `Insufficient ${invItem?.name || 'ingredient'}` };
        }
      }
      
      // Deduct inventory
      for (const ing of ingredients) {
        const invItem = await storage.getInventoryItem(ing.inventoryId);
        if (invItem) {
          await storage.updateInventoryQuantity(ing.inventoryId, invItem.quantity - ing.quantity);
        }
      }
      
      // Update funds
      const fundsStr = await storage.getSetting("operating_funds");
      const currentFunds = fundsStr ? parseFloat(fundsStr.value) : 5000;
      const newFunds = currentFunds + menuItem.price;
      await storage.updateSetting("operating_funds", newFunds.toString());
      
      // Create log
      await storage.createLog({
        id: `log-${Date.now()}`,
        type: "sale",
        message: `Sold ${menuItem.name}`,
        amount: menuItem.price,
      });
      
      return {
        success: true,
        item: menuItem.name,
        price: menuItem.price,
        newFunds,
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
      
      const systemContext = `You are THALLIPOLI AI, an intelligent assistant for a restaurant management system. 
Current Status:
- Operating Funds: $${operatingFunds.toFixed(2)}
- Low Stock Items: ${lowStock.length} (${lowStock.map(i => i.name).join(', ')})
- Menu Items: ${menu.length}
- Total Inventory Items: ${inventory.length}

You can help with inventory management, sales processing, financial tracking, and strategic insights. Use the available functions to interact with the system.`;
      
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
              ],
            });
            
            finalResponse = followUp.text || JSON.stringify(functionResult);
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
