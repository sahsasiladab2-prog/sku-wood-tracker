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
 * Wood Materials master table - stores all wood types and their current prices
 * This is the single source of truth for wood prices used in Calculator
 */
export const woodMaterials = mysqlTable("wood_materials", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  description: varchar("description", { length: 255 }).notNull(),
  unit: varchar("unit", { length: 32 }).notNull().default("ซม."),
  refQty: int("refQty").notNull().default(100),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  isActive: int("isActive").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WoodMaterial = typeof woodMaterials.$inferSelect;
export type InsertWoodMaterial = typeof woodMaterials.$inferInsert;

/**
 * Wood Price History table - records every price change for each wood material
 */
export const woodPriceHistory = mysqlTable("wood_price_history", {
  id: int("id").autoincrement().primaryKey(),
  woodCode: varchar("woodCode", { length: 64 }).notNull(),
  oldPrice: decimal("oldPrice", { precision: 10, scale: 2 }),
  newPrice: decimal("newPrice", { precision: 10, scale: 2 }).notNull(),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
  note: text("note"),
});

export type WoodPriceHistory = typeof woodPriceHistory.$inferSelect;
export type InsertWoodPriceHistory = typeof woodPriceHistory.$inferInsert;
