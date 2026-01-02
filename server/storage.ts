import { db } from "./db";
import {
  inventoryItems,
  menuItems,
  menuIngredients,
  logs,
  settings,
  orders,
  orderItems,
  conversations,
  messages,
  type InventoryItem,
  type MenuItem,
  type MenuIngredient,
  type Log,
  type Setting,
  type Order,
  type OrderItem,
  type InsertInventoryItem,
  type InsertMenuItem,
  type InsertMenuIngredient,
  type InsertLog,
  type InsertSetting,
  type InsertOrder,
  type InsertOrderItem,
  type Conversation,
  type Message,
  type InsertConversation,
  type InsertMessage,
} from "@shared/schema";
import { eq, desc, sql, and } from "drizzle-orm";

export interface IStorage {
  // Inventory
  getAllInventory(): Promise<InventoryItem[]>;
  getInventoryItem(id: string): Promise<InventoryItem | undefined>;
  updateInventoryQuantity(id: string, quantity: number): Promise<InventoryItem | undefined>;
  bulkCreateInventory(items: InsertInventoryItem[]): Promise<InventoryItem[]>;
  
  // Menu
  getAllMenu(): Promise<(MenuItem & { ingredients: MenuIngredient[] })[]>;
  getMenuItem(id: string): Promise<MenuItem | undefined>;
  getMenuIngredients(menuItemId: string): Promise<MenuIngredient[]>;
  bulkCreateMenu(items: InsertMenuItem[], ingredients: InsertMenuIngredient[]): Promise<void>;
  updateMenuRating(id: string, rating: number): Promise<MenuItem | undefined>;
  
  // Logs
  getAllLogs(): Promise<Log[]>;
  createLog(log: InsertLog): Promise<Log>;
  
  // Settings
  getSetting(key: string): Promise<Setting | undefined>;
  updateSetting(key: string, value: string): Promise<Setting>;
  
  // Orders
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  getAllOrders(): Promise<Order[]>;
  getRecentOrders(limit: number): Promise<Order[]>;
  getRecentOrdersWithItems(limit: number): Promise<(Order & { items: OrderItem[] })[]>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  updateOrderStatus(orderId: number, status: string): Promise<Order | undefined>;
  
  // Stats
  getTotalRevenue(): Promise<number>;
  getTotalCost(): Promise<number>;
  
  // AI Chat
  getAllConversations(): Promise<Conversation[]>;
  getConversation(id: number): Promise<Conversation | undefined>;
  createConversation(title: string): Promise<Conversation>;
  deleteConversation(id: number): Promise<void>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(conversationId: number, role: string, content: string): Promise<Message>;
}

class DatabaseStorage implements IStorage {
  // Inventory
  async getAllInventory(): Promise<InventoryItem[]> {
    return db.select().from(inventoryItems).orderBy(inventoryItems.name);
  }

  async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id));
    return item;
  }

  async updateInventoryQuantity(id: string, quantity: number): Promise<InventoryItem | undefined> {
    const [updated] = await db
      .update(inventoryItems)
      .set({ 
        quantity,
        lastRestocked: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(inventoryItems.id, id))
      .returning();
    return updated;
  }

  async bulkCreateInventory(items: InsertInventoryItem[]): Promise<InventoryItem[]> {
    if (items.length === 0) return [];
    return db.insert(inventoryItems).values(items).returning();
  }

  // Menu
  async getAllMenu(): Promise<(MenuItem & { ingredients: MenuIngredient[] })[]> {
    const allMenuItems = await db.select().from(menuItems).orderBy(menuItems.category, menuItems.name);
    
    const menuWithIngredients = await Promise.all(
      allMenuItems.map(async (item) => {
        const ingredients = await this.getMenuIngredients(item.id);
        return { ...item, ingredients };
      })
    );
    
    return menuWithIngredients;
  }

  async getMenuItem(id: string): Promise<MenuItem | undefined> {
    const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    return item;
  }

  async getMenuIngredients(menuItemId: string): Promise<MenuIngredient[]> {
    return db.select().from(menuIngredients).where(eq(menuIngredients.menuItemId, menuItemId));
  }

  async bulkCreateMenu(items: InsertMenuItem[], ingredients: InsertMenuIngredient[]): Promise<void> {
    if (items.length > 0) {
      await db.insert(menuItems).values(items);
    }
    if (ingredients.length > 0) {
      await db.insert(menuIngredients).values(ingredients);
    }
  }

  async updateMenuRating(id: string, rating: number): Promise<MenuItem | undefined> {
    const item = await this.getMenuItem(id);
    if (!item) return undefined;
    
    const newCount = item.ratingCount + 1;
    const newRating = ((item.rating * item.ratingCount) + rating) / newCount;
    
    const [updated] = await db
      .update(menuItems)
      .set({ 
        rating: newRating,
        ratingCount: newCount
      })
      .where(eq(menuItems.id, id))
      .returning();
    return updated;
  }

  // Logs
  async getAllLogs(): Promise<Log[]> {
    return db.select().from(logs).orderBy(desc(logs.timestamp)).limit(500);
  }

  async createLog(log: InsertLog): Promise<Log> {
    const [created] = await db.insert(logs).values(log).returning();
    return created;
  }

  // Settings
  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting;
  }

  async updateSetting(key: string, value: string): Promise<Setting> {
    const existing = await this.getSetting(key);
    
    if (existing) {
      const [updated] = await db
        .update(settings)
        .set({ value, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(settings.key, key))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(settings).values({ key, value }).returning();
      return created;
    }
  }

  // Orders
  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const [created] = await db.insert(orders).values(order).returning();
    
    if (items.length > 0) {
      const orderItemsWithId = items.map(item => ({ ...item, orderId: created.id }));
      await db.insert(orderItems).values(orderItemsWithId);
    }
    
    return created;
  }

  async getAllOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getRecentOrders(limit: number): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit);
  }

  async getRecentOrdersWithItems(limit: number): Promise<(Order & { items: OrderItem[] })[]> {
    const recentOrders = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit);
    
    const ordersWithItems = await Promise.all(
      recentOrders.map(async (order) => {
        const items = await this.getOrderItems(order.id);
        return { ...order, items };
      })
    );
    
    return ordersWithItems;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async updateOrderStatus(orderId: number, status: string): Promise<Order | undefined> {
    const [updated] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, orderId))
      .returning();
    return updated;
  }

  // Stats
  async getTotalRevenue(): Promise<number> {
    const result = await db
      .select({ total: sql<number>`COALESCE(SUM(${logs.amount}), 0)` })
      .from(logs)
      .where(eq(logs.type, 'sale'));
    return result[0]?.total || 0;
  }

  async getTotalCost(): Promise<number> {
    const result = await db
      .select({ total: sql<number>`COALESCE(SUM(ABS(${logs.amount})), 0)` })
      .from(logs)
      .where(sql`${logs.type} IN ('restock', 'waste')`);
    return result[0]?.total || 0;
  }

  // AI Chat
  async getAllConversations(): Promise<Conversation[]> {
    return db.select().from(conversations).orderBy(desc(conversations.createdAt));
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }

  async createConversation(title: string): Promise<Conversation> {
    const [conversation] = await db.insert(conversations).values({ title }).returning();
    return conversation;
  }

  async deleteConversation(id: number): Promise<void> {
    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  }

  async createMessage(conversationId: number, role: string, content: string): Promise<Message> {
    const [message] = await db.insert(messages).values({ conversationId, role, content }).returning();
    return message;
  }
}

export const storage = new DatabaseStorage();
