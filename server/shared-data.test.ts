import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

/**
 * Test that project routes are accessible without authentication (shared workspace).
 * All project routes should use publicProcedure so any visitor can see and edit data.
 */
describe("Shared Data Access (Public Procedures)", () => {
  // Create a caller without authentication (simulating unauthenticated visitor)
  const caller = appRouter.createCaller({
    user: null,
    req: {} as any,
    res: {
      clearCookie: () => {},
    } as any,
  });

  it("should list all projects without authentication", async () => {
    const projects = await caller.project.list();
    expect(Array.isArray(projects)).toBe(true);
    // Should return projects regardless of userId
  });

  it("should get a project by ID without authentication", async () => {
    // Even if project doesn't exist, it should not throw auth error
    const project = await caller.project.get({ id: "NONEXIST" });
    expect(project).toBeNull();
  });

  it("should get price history without authentication", async () => {
    const history = await caller.project.getPriceHistory({ projectId: "NONEXIST" });
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBe(0);
  });

  it("should create a project without authentication", async () => {
    const project = await caller.project.create({
      name: "Test Shared Project",
      version: 1,
      productionType: "Outsource",
      carpenterCost: 100,
      paintingCost: 50,
      packingCost: 30,
      wasteCost: 20,
      totalCost: 200,
      channels: [{ name: "Shopee", price: 500, feePercent: 5 }],
    });
    expect(project).toBeDefined();
    expect(project.name).toBe("Test Shared Project");
    expect(project.id).toBeTruthy();

    // Clean up - delete should also work without auth
    const result = await caller.project.delete({ id: project.id });
    expect(result.success).toBe(true);
  });

  it("should update a project without authentication", async () => {
    // Create first
    const project = await caller.project.create({
      name: "Test Update Shared",
      version: 1,
      productionType: "In-House",
      carpenterCost: 0,
      paintingCost: 0,
      packingCost: 0,
      wasteCost: 0,
      totalCost: 0,
    });

    // Update without auth
    const updated = await caller.project.update({
      id: project.id,
      data: { name: "Updated Name" },
    });
    expect(updated).toBeDefined();
    expect(updated!.name).toBe("Updated Name");

    // Clean up
    await caller.project.delete({ id: project.id });
  });

  it("should delete a project without authentication", async () => {
    const project = await caller.project.create({
      name: "Test Delete Shared",
      version: 1,
      productionType: "Outsource",
      carpenterCost: 0,
      paintingCost: 0,
      packingCost: 0,
      wasteCost: 0,
      totalCost: 0,
    });

    const result = await caller.project.delete({ id: project.id });
    expect(result.success).toBe(true);

    // Verify deleted
    const check = await caller.project.get({ id: project.id });
    expect(check).toBeNull();
  });
});
