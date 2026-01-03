import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (keeping existing structure)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Inventory Items
export const inventoryItems = pgTable("inventory_items", {
  id: varchar("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  quantity: real("quantity").notNull().default(0),
  unit: text("unit").notNull(),
  threshold: real("threshold").notNull(),
  pricePerUnit: real("price_per_unit").notNull(),
  category: text("category").notNull(), // 'produce' | 'meat' | 'dairy' | 'pantry' | 'beverage'
  lastRestocked: timestamp("last_restocked").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Menu Items
export const menuItems = pgTable("menu_items", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  prepTime: text("prep_time").notNull(),
  category: text("category").notNull(), // 'main' | 'appetizer' | 'dessert' | 'drink'
  rating: real("rating").notNull().default(0),
  ratingCount: integer("rating_count").notNull().default(0),
  chef: text("chef"),
});

// Menu Item Ingredients (junction table)
export const menuIngredients = pgTable("menu_ingredients", {
  id: serial("id").primaryKey(),
  menuItemId: varchar("menu_item_id").notNull().references(() => menuItems.id, { onDelete: "cascade" }),
  inventoryId: varchar("inventory_id").notNull().references(() => inventoryItems.id),
  quantity: real("quantity").notNull(),
});

// Activity Logs
export const logs = pgTable("logs", {
  id: varchar("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull().default(sql`CURRENT_TIMESTAMP`),
  type: text("type").notNull(), // 'sale' | 'restock' | 'waste' | 'system' | 'email'
  message: text("message").notNull(),
  amount: real("amount").default(0),
});

// System Settings (for operating funds, etc.)
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  total: real("total").notNull(),
  customerName: text("customer_name").default("Walk-in"),
  allergies: text("allergies"),
  status: text("status").notNull().default("pending"), // pending, preparing, completed, cancelled
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Order Items
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  menuItemId: varchar("menu_item_id").notNull().references(() => menuItems.id),
  menuItemName: text("menu_item_name").notNull(),
  price: real("price").notNull(),
  quantity: integer("quantity").notNull().default(1),
  removedIngredients: text("removed_ingredients"), // comma-separated list
  specialInstructions: text("special_instructions"),
});

// AI Conversations
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// AI Messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
  lastRestocked: true,
});

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({
  rating: true,
  ratingCount: true,
});

export const insertMenuIngredientSchema = createInsertSchema(menuIngredients).omit({
  id: true,
});

export const insertLogSchema = createInsertSchema(logs).omit({
  timestamp: true,
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  orderId: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

export type MenuIngredient = typeof menuIngredients.$inferSelect;
export type InsertMenuIngredient = z.infer<typeof insertMenuIngredientSchema>;

export type Log = typeof logs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
