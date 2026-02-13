import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, projects, InsertProject, Project, priceHistory, InsertPriceHistory, PriceHistory,
  productionOrders, InsertProductionOrder, ProductionOrder,
  inventory, InsertInventory, Inventory,
  inventoryTransactions, InsertInventoryTransaction, InventoryTransaction,
  workers, InsertWorker, Worker,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ Project Functions ============

export async function getProjectsByUserId(userId: number): Promise<Project[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get projects: database not available");
    return [];
  }

  const result = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.createdAt));

  return result;
}

// Get all projects globally (shared workspace)
export async function getAllProjectsShared(): Promise<Project[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get projects: database not available");
    return [];
  }

  const result = await db
    .select()
    .from(projects)
    .orderBy(desc(projects.createdAt));

  return result;
}

export async function getProjectById(id: string, userId?: number): Promise<Project | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get project: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createProject(project: InsertProject): Promise<Project> {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot create project: database not available");
  }

  await db.insert(projects).values(project);
  
  const result = await db
    .select()
    .from(projects)
    .where(eq(projects.id, project.id))
    .limit(1);

  return result[0];
}

export async function updateProject(id: string, userId: number, data: Partial<InsertProject>): Promise<Project | undefined> {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot update project: database not available");
  }

  await db
    .update(projects)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(projects.id, id));

  return getProjectById(id);
}

export async function deleteProject(id: string, userId?: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot delete project: database not available");
  }

  await db
    .delete(projects)
    .where(eq(projects.id, id));

  return true;
}

export async function bulkCreateProjects(projectList: InsertProject[]): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot bulk create projects: database not available");
  }

  if (projectList.length === 0) return 0;

  await db.insert(projects).values(projectList);
  
  return projectList.length;
}

// Get all projects (for admin backup)
export async function getAllProjects(): Promise<Project[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get all projects: database not available");
    return [];
  }

  const result = await db
    .select()
    .from(projects)
    .orderBy(desc(projects.createdAt));

  return result;
}

// ============ Price History Functions ============

export async function createPriceHistory(history: InsertPriceHistory): Promise<PriceHistory> {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot create price history: database not available");
  }

  const result = await db.insert(priceHistory).values(history);
  
  // Get the inserted record
  const inserted = await db
    .select()
    .from(priceHistory)
    .where(eq(priceHistory.id, Number(result[0].insertId)))
    .limit(1);

  return inserted[0];
}

export async function getPriceHistoryByProjectId(projectId: string): Promise<PriceHistory[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get price history: database not available");
    return [];
  }

  const result = await db
    .select()
    .from(priceHistory)
    .where(eq(priceHistory.projectId, projectId))
    .orderBy(desc(priceHistory.changedAt));

  return result;
}

export async function bulkCreatePriceHistory(historyList: InsertPriceHistory[]): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot bulk create price history: database not available");
  }

  if (historyList.length === 0) return 0;

  await db.insert(priceHistory).values(historyList);

  return historyList.length;
}

// ============ Production Order Functions ============

export async function getAllProductionOrders(): Promise<ProductionOrder[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productionOrders).orderBy(desc(productionOrders.createdAt));
}

export async function getProductionOrderById(id: number): Promise<ProductionOrder | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(productionOrders).where(eq(productionOrders.id, id)).limit(1);
  return result[0];
}

export async function createProductionOrder(order: InsertProductionOrder): Promise<ProductionOrder> {
  const db = await getDb();
  if (!db) throw new Error("[Database] Cannot create production order: database not available");
  const result = await db.insert(productionOrders).values(order);
  const inserted = await db.select().from(productionOrders).where(eq(productionOrders.id, Number(result[0].insertId))).limit(1);
  return inserted[0];
}

export async function updateProductionOrder(id: number, data: Partial<InsertProductionOrder>): Promise<ProductionOrder | undefined> {
  const db = await getDb();
  if (!db) throw new Error("[Database] Cannot update production order: database not available");
  await db.update(productionOrders).set({ ...data, updatedAt: new Date() }).where(eq(productionOrders.id, id));
  return getProductionOrderById(id);
}

export async function deleteProductionOrder(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("[Database] Cannot delete production order: database not available");
  await db.delete(productionOrders).where(eq(productionOrders.id, id));
  return true;
}

// ============ Inventory Functions ============

export async function getAllInventory(): Promise<Inventory[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inventory).orderBy(desc(inventory.updatedAt));
}

export async function getInventoryById(id: number): Promise<Inventory | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(inventory).where(eq(inventory.id, id)).limit(1);
  return result[0];
}

export async function createInventoryItem(item: InsertInventory): Promise<Inventory> {
  const db = await getDb();
  if (!db) throw new Error("[Database] Cannot create inventory item: database not available");
  const result = await db.insert(inventory).values(item);
  const inserted = await db.select().from(inventory).where(eq(inventory.id, Number(result[0].insertId))).limit(1);
  return inserted[0];
}

export async function updateInventoryItem(id: number, data: Partial<InsertInventory>): Promise<Inventory | undefined> {
  const db = await getDb();
  if (!db) throw new Error("[Database] Cannot update inventory item: database not available");
  await db.update(inventory).set({ ...data, updatedAt: new Date() }).where(eq(inventory.id, id));
  return getInventoryById(id);
}

export async function deleteInventoryItem(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("[Database] Cannot delete inventory item: database not available");
  await db.delete(inventory).where(eq(inventory.id, id));
  return true;
}

export async function createInventoryTransaction(tx: InsertInventoryTransaction): Promise<InventoryTransaction> {
  const db = await getDb();
  if (!db) throw new Error("[Database] Cannot create inventory transaction: database not available");
  const result = await db.insert(inventoryTransactions).values(tx);
  const inserted = await db.select().from(inventoryTransactions).where(eq(inventoryTransactions.id, Number(result[0].insertId))).limit(1);
  return inserted[0];
}

export async function getInventoryTransactions(inventoryId: number): Promise<InventoryTransaction[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inventoryTransactions).where(eq(inventoryTransactions.inventoryId, inventoryId)).orderBy(desc(inventoryTransactions.createdAt));
}

// ============ Worker Functions ============

export async function getAllWorkers(): Promise<Worker[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(workers).orderBy(desc(workers.createdAt));
}

export async function getWorkerById(id: number): Promise<Worker | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(workers).where(eq(workers.id, id)).limit(1);
  return result[0];
}

export async function createWorker(worker: InsertWorker): Promise<Worker> {
  const db = await getDb();
  if (!db) throw new Error("[Database] Cannot create worker: database not available");
  const result = await db.insert(workers).values(worker);
  const inserted = await db.select().from(workers).where(eq(workers.id, Number(result[0].insertId))).limit(1);
  return inserted[0];
}

export async function updateWorker(id: number, data: Partial<InsertWorker>): Promise<Worker | undefined> {
  const db = await getDb();
  if (!db) throw new Error("[Database] Cannot update worker: database not available");
  await db.update(workers).set({ ...data, updatedAt: new Date() }).where(eq(workers.id, id));
  return getWorkerById(id);
}

export async function deleteWorker(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("[Database] Cannot delete worker: database not available");
  await db.delete(workers).where(eq(workers.id, id));
  return true;
}
