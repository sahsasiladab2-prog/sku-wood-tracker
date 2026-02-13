import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Projects table for storing SKU cost calculations
 * Each project represents a version of a product's cost breakdown
 */
export const projects = mysqlTable("projects", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  version: int("version").notNull().default(1),
  productionType: mysqlEnum("productionType", ["Outsource", "In-House"]).default("Outsource").notNull(),
  note: text("note"),
  
  // Materials stored as JSON array
  materials: json("materials").$type<Array<{
    code: string;
    description: string;
    usage: string;
    usedLength: number;
    refQty: number;
    cost: number;
    quantity: number;
    calculatedCost: number;
    unit?: string;
    isCustom?: boolean;
  }>>(),
  
  // Costs breakdown
  carpenterCost: decimal("carpenterCost", { precision: 10, scale: 2 }).default("0"),
  paintingCost: decimal("paintingCost", { precision: 10, scale: 2 }).default("0"),
  packingCost: decimal("packingCost", { precision: 10, scale: 2 }).default("0"),
  wasteCost: decimal("wasteCost", { precision: 10, scale: 2 }).default("0"),
  
  // Sales channels stored as JSON array
  channels: json("channels").$type<Array<{
    name: string;
    price: number;
    feePercent: number;
  }>>(),
  
  // Calculated totals
  totalCost: decimal("totalCost", { precision: 10, scale: 2 }).default("0"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Price History table for tracking all price changes
 * Records every change made via Manage Prices
 */
export const priceHistory = mysqlTable("price_history", {
  id: int("id").autoincrement().primaryKey(),
  projectId: varchar("projectId", { length: 64 }).notNull(),
  userId: int("userId").notNull(),
  channelName: varchar("channelName", { length: 255 }).notNull(),
  oldPrice: decimal("oldPrice", { precision: 10, scale: 2 }),
  newPrice: decimal("newPrice", { precision: 10, scale: 2 }).notNull(),
  oldFeePercent: decimal("oldFeePercent", { precision: 5, scale: 2 }),
  newFeePercent: decimal("newFeePercent", { precision: 5, scale: 2 }).notNull(),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
});

export type PriceHistory = typeof priceHistory.$inferSelect;
export type InsertPriceHistory = typeof priceHistory.$inferInsert;

/**
 * Production Orders table for tracking manufacturing orders
 * Each order represents a batch of products to be manufactured
 */
export const productionOrders = mysqlTable("production_orders", {
  id: int("id").autoincrement().primaryKey(),
  projectId: varchar("projectId", { length: 64 }).notNull(),
  orderNumber: varchar("orderNumber", { length: 64 }).notNull(),
  quantity: int("quantity").notNull().default(1),
  completedQty: int("completedQty").notNull().default(0),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"]).default("normal").notNull(),
  deadline: timestamp("deadline"),
  assignedWorkers: json("assignedWorkers").$type<number[]>(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductionOrder = typeof productionOrders.$inferSelect;
export type InsertProductionOrder = typeof productionOrders.$inferInsert;

/**
 * Inventory table for tracking raw material stock levels
 */
export const inventory = mysqlTable("inventory", {
  id: int("id").autoincrement().primaryKey(),
  materialCode: varchar("materialCode", { length: 64 }).notNull(),
  materialName: varchar("materialName", { length: 255 }).notNull(),
  currentStock: decimal("currentStock", { precision: 10, scale: 2 }).notNull().default("0"),
  unit: varchar("unit", { length: 32 }).notNull().default("ซม."),
  minStock: decimal("minStock", { precision: 10, scale: 2 }).notNull().default("0"),
  costPerUnit: decimal("costPerUnit", { precision: 10, scale: 2 }).notNull().default("0"),
  lastRestocked: timestamp("lastRestocked"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = typeof inventory.$inferInsert;

/**
 * Inventory Transactions table for tracking stock in/out movements
 */
export const inventoryTransactions = mysqlTable("inventory_transactions", {
  id: int("id").autoincrement().primaryKey(),
  inventoryId: int("inventoryId").notNull(),
  type: mysqlEnum("type", ["in", "out", "adjustment"]).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type InsertInventoryTransaction = typeof inventoryTransactions.$inferInsert;

/**
 * Workers table for tracking factory workers
 */
export const workers = mysqlTable("workers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["carpenter", "painter", "packer", "supervisor", "general"]).default("general").notNull(),
  phone: varchar("phone", { length: 20 }),
  dailyWage: decimal("dailyWage", { precision: 10, scale: 2 }).notNull().default("0"),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Worker = typeof workers.$inferSelect;
export type InsertWorker = typeof workers.$inferInsert;
