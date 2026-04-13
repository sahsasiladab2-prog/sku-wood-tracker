import { describe, it, expect } from "vitest";
import { getProjectStats, getLatestProjects, getMarginHealth } from "./projectStats";

const mockProject = {
  id: "test1",
  name: "Test SKU",
  version: 1,
  totalCost: 100,
  channels: [
    { name: "Shopee", price: 200, feePercent: 5 },
    { name: "Lazada", price: 180, feePercent: 3 },
  ],
};

describe("getProjectStats", () => {
  it("returns best channel (Shopee) when no channel specified", () => {
    const stats = getProjectStats(mockProject);
    // Shopee: fee=10, profit=90, margin=45%
    // Lazada: fee=6, profit=74, margin=41.1%
    expect(stats.channelName).toBe("Shopee");
    expect(stats.margin).toBe(45);
    expect(stats.profit).toBe(90);
  });

  it("returns specific channel when specified", () => {
    const stats = getProjectStats(mockProject, "Lazada");
    expect(stats.channelName).toBe("Lazada");
    expect(stats.margin).toBe(41.1);
    expect(stats.profit).toBe(74);
  });

  it("returns hasChannel=false when channel not found", () => {
    const stats = getProjectStats(mockProject, "TikTok");
    expect(stats.hasChannel).toBe(false);
  });

  it("handles project with no channels via legacy fallback", () => {
    const p = { name: "X", version: 1, totalCost: 50, sellingPrice: 100 };
    const stats = getProjectStats(p);
    expect(stats.margin).toBe(50);
    expect(stats.profit).toBe(50);
  });
});

describe("getLatestProjects", () => {
  it("returns only the latest version per name+productionType", () => {
    const projects = [
      { name: "A", version: 1, productionType: "Outsource" },
      { name: "A", version: 2, productionType: "Outsource" },
      { name: "A", version: 1, productionType: "In-House" },
    ];
    const latest = getLatestProjects(projects as any);
    expect(latest).toHaveLength(2);
    const outsource = latest.find(p => p.productionType === "Outsource");
    expect(outsource?.version).toBe(2);
  });
});

describe("getMarginHealth", () => {
  it("returns healthy for margin >= 25", () => expect(getMarginHealth(30)).toBe("healthy"));
  it("returns warning for 15 <= margin < 25", () => expect(getMarginHealth(20)).toBe("warning"));
  it("returns danger for margin < 15", () => expect(getMarginHealth(10)).toBe("danger"));
});
