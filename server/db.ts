import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, projects, InsertProject, Project, priceHistory, InsertPriceHistory, PriceHistory } from "../drizzle/schema";
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

// ============ Wood Materials Functions ============

import { woodMaterials, woodPriceHistory, InsertWoodMaterial, WoodMaterial, InsertWoodPriceHistory, WoodPriceHistory } from "../drizzle/schema";

export async function getAllWoodMaterials(): Promise<WoodMaterial[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(woodMaterials).where(eq(woodMaterials.isActive, 1)).orderBy(woodMaterials.code);
}

export async function getWoodMaterialByCode(code: string): Promise<WoodMaterial | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(woodMaterials).where(eq(woodMaterials.code, code)).limit(1);
  return result[0];
}

export async function upsertWoodMaterial(data: InsertWoodMaterial): Promise<WoodMaterial> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get old price for history
  const existing = await getWoodMaterialByCode(data.code);
  const oldPrice = existing ? existing.cost : null;

  // Upsert
  await db.insert(woodMaterials).values(data).onDuplicateKeyUpdate({
    set: { cost: data.cost, description: data.description, unit: data.unit, refQty: data.refQty, updatedAt: new Date() }
  });

  // Record price history if price changed
  if (oldPrice !== null && String(oldPrice) !== String(data.cost)) {
    await db.insert(woodPriceHistory).values({
      woodCode: data.code,
      oldPrice: String(oldPrice),
      newPrice: String(data.cost),
    });
  } else if (oldPrice === null) {
    // New material - record initial price
    await db.insert(woodPriceHistory).values({
      woodCode: data.code,
      oldPrice: null,
      newPrice: String(data.cost),
      note: "เพิ่มรายการใหม่",
    });
  }

  const result = await db.select().from(woodMaterials).where(eq(woodMaterials.code, data.code)).limit(1);
  return result[0];
}

export async function updateWoodMaterialPrice(code: string, newPrice: number, note?: string): Promise<WoodMaterial | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getWoodMaterialByCode(code);
  if (!existing) return undefined;

  const oldPrice = existing.cost;

  await db.update(woodMaterials).set({ cost: String(newPrice), updatedAt: new Date() }).where(eq(woodMaterials.code, code));

  // Record history
  if (String(oldPrice) !== String(newPrice)) {
    await db.insert(woodPriceHistory).values({
      woodCode: code,
      oldPrice: String(oldPrice),
      newPrice: String(newPrice),
      note: note ?? null,
    });
  }

  return getWoodMaterialByCode(code);
}

export async function getWoodPriceHistory(code?: string): Promise<WoodPriceHistory[]> {
  const db = await getDb();
  if (!db) return [];
  if (code) {
    return db.select().from(woodPriceHistory).where(eq(woodPriceHistory.woodCode, code)).orderBy(desc(woodPriceHistory.changedAt));
  }
  return db.select().from(woodPriceHistory).orderBy(desc(woodPriceHistory.changedAt));
}

export async function seedWoodMaterials(materials: InsertWoodMaterial[]): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let seeded = 0;
  for (const m of materials) {
    const existing = await getWoodMaterialByCode(m.code);
    if (!existing) {
      await db.insert(woodMaterials).values(m);
      await db.insert(woodPriceHistory).values({
        woodCode: m.code,
        oldPrice: null,
        newPrice: String(m.cost),
        note: "ราคาเริ่มต้น",
      });
      seeded++;
    }
  }
  return seeded;
}
