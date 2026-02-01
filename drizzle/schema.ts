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
