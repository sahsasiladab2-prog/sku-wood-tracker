/**
 * Shared project statistics utility
 * Single source of truth for margin/profit calculations across Dashboard, Tracker, Calculator
 *
 * Formula:
 *   fee = Math.ceil(price * feePercent / 100)
 *   netProfit = price - totalCost - fee
 *   netMargin = (netProfit / price) * 100
 */

export interface ProjectStats {
  margin: number;
  profit: number;
  price: number;
  channelName: string;
  hasChannel: boolean;
}

export interface ProjectLike {
  id?: string;
  name: string;
  version: number;
  productionType?: string;
  totalCost?: number;
  sellingPrice?: number;
  channels?: Array<{ name: string; price: number; feePercent: number }>;
  materials?: Array<{ code: string; calculatedCost?: number }>;
  costs?: { carpenter?: number; painting?: number; packing?: number; waste?: number };
}

/**
 * Get margin/profit stats for a project.
 * @param project  The project to analyze
 * @param channelName  Optional channel name to filter. If omitted, returns the best channel (highest margin).
 */
export function getProjectStats(project: ProjectLike, channelName?: string): ProjectStats {
  const totalCost = project.totalCost || 0;

  // Specific channel requested
  if (channelName && channelName !== "all") {
    const targetChannel = project.channels?.find((c) => c.name === channelName);
    if (targetChannel) {
      const price = targetChannel.price || 0;
      const fee = Math.ceil(price * (targetChannel.feePercent / 100));
      const netProfit = price - totalCost - fee;
      const margin = price > 0 ? parseFloat(((netProfit / price) * 100).toFixed(1)) : 0;
      return { margin, profit: netProfit, price, channelName: targetChannel.name, hasChannel: true };
    }
    return { margin: 0, profit: 0, price: 0, channelName: "-", hasChannel: false };
  }

  // Best channel (highest net margin)
  if (project.channels && project.channels.length > 0) {
    const calculated = project.channels.map((c) => {
      const price = c.price || 0;
      const fee = Math.ceil(price * (c.feePercent / 100));
      const netProfit = price - totalCost - fee;
      const margin = price > 0 ? parseFloat(((netProfit / price) * 100).toFixed(1)) : 0;
      return { ...c, realMargin: margin, realProfit: netProfit };
    });
    const best = calculated.reduce((prev, cur) => (cur.realMargin > prev.realMargin ? cur : prev));
    return {
      margin: best.realMargin,
      profit: best.realProfit,
      price: best.price,
      channelName: best.name,
      hasChannel: true,
    };
  }

  // Legacy fallback (no channels)
  const price = project.sellingPrice || 0;
  const netProfit = price - totalCost;
  const margin = price > 0 ? parseFloat(((netProfit / price) * 100).toFixed(1)) : 0;
  return { margin, profit: netProfit, price, channelName: "Default", hasChannel: price > 0 };
}

/**
 * Get only the latest version of each SKU (grouped by name + productionType).
 */
export function getLatestProjects<T extends ProjectLike>(projects: T[]): T[] {
  const latestMap = new Map<string, T>();
  for (const p of projects) {
    const key = `${p.name}-${p.productionType || "Outsource"}`;
    const existing = latestMap.get(key);
    if (!existing || Number(p.version) > Number(existing.version)) {
      latestMap.set(key, p);
    }
  }
  return Array.from(latestMap.values());
}

/**
 * Classify margin health for traffic light system.
 */
export type MarginHealth = "healthy" | "warning" | "danger";

export function getMarginHealth(margin: number): MarginHealth {
  if (margin >= 25) return "healthy";
  if (margin >= 15) return "warning";
  return "danger";
}
