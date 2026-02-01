import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  getProjectsByUserId: vi.fn(),
  getProjectById: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  bulkCreateProjects: vi.fn(),
}));

import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("project.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns projects for authenticated user", async () => {
    const mockProjects = [
      {
        id: "TEST123",
        userId: 1,
        name: "Test Project",
        version: 1,
        productionType: "Outsource",
        note: "Test note",
        materials: [],
        carpenterCost: "100",
        paintingCost: "50",
        packingCost: "30",
        wasteCost: "20",
        channels: [],
        totalCost: "200",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(db.getProjectsByUserId).mockResolvedValue(mockProjects as any);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.project.list();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Test Project");
    expect(result[0].carpenterCost).toBe(100); // Should be converted to number
    expect(db.getProjectsByUserId).toHaveBeenCalledWith(1);
  });

  it("throws unauthorized for unauthenticated user", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.project.list()).rejects.toThrow();
  });
});

describe("project.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new project for authenticated user", async () => {
    const mockCreatedProject = {
      id: "NEW123",
      userId: 1,
      name: "New Project",
      version: 1,
      productionType: "Outsource",
      note: null,
      materials: null,
      carpenterCost: "150",
      paintingCost: "75",
      packingCost: "50",
      wasteCost: "25",
      channels: null,
      totalCost: "300",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.createProject).mockResolvedValue(mockCreatedProject as any);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.project.create({
      name: "New Project",
      version: 1,
      productionType: "Outsource",
      carpenterCost: 150,
      paintingCost: 75,
      packingCost: 50,
      wasteCost: 25,
      totalCost: 300,
    });

    expect(result.name).toBe("New Project");
    expect(result.carpenterCost).toBe(150);
    expect(db.createProject).toHaveBeenCalled();
  });
});

describe("project.delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes a project for authenticated user", async () => {
    vi.mocked(db.deleteProject).mockResolvedValue(true);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.project.delete({ id: "TEST123" });

    expect(result.success).toBe(true);
    expect(db.deleteProject).toHaveBeenCalledWith("TEST123", 1);
  });
});

describe("project.bulkImport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("imports multiple projects for authenticated user", async () => {
    vi.mocked(db.bulkCreateProjects).mockResolvedValue(2);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.project.bulkImport({
      projects: [
        {
          id: "IMPORT1",
          name: "Imported Project 1",
          version: 1,
          productionType: "Outsource",
          carpenterCost: 100,
          paintingCost: 50,
          packingCost: 30,
          wasteCost: 20,
          totalCost: 200,
        },
        {
          id: "IMPORT2",
          name: "Imported Project 2",
          version: 1,
          productionType: "In-House",
          carpenterCost: 80,
          paintingCost: 40,
          packingCost: 25,
          wasteCost: 15,
          totalCost: 160,
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
    expect(db.bulkCreateProjects).toHaveBeenCalled();
  });
});
