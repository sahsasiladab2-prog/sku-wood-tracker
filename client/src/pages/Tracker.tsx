/**
 * Tracker — Management Analysis Hub
 *
 * Tab 1: SKU Portfolio   — "Which SKUs are worth keeping? Which need attention?"
 * Tab 2: Version Timeline — "How has each SKU improved over time?"
 * Tab 3: Cost Sensitivity — "What happens to margin if wood prices change?"
 *
 * Design: clean table-first, no gamification, lean but effective.
 */

import { useState, useMemo } from "react";
import { useProjects } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getProjectStats, getLatestProjects, getMarginHealth } from "@/lib/projectStats";
import { Link, useLocation } from "wouter";
import {
  Search, Plus, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus,
  ArrowRight, AlertTriangle, CheckCircle, Edit3, BarChart3, History, Zap
} from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { SKUDrawer } from "@/components/SKUDrawer";

// ── Shared helpers ────────────────────────────────────────────────────────────

function MarginBadge({ margin }: { margin: number }) {
  const h = getMarginHealth(margin);
  if (h === "healthy")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-300">{margin.toFixed(1)}%</span>;
  if (h === "warning")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-300">{margin.toFixed(1)}%</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300">{margin.toFixed(1)}%</span>;
}

function StatusBadge({ margin }: { margin: number }) {
  if (margin >= 25)
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-300"><CheckCircle className="w-3 h-3" />Keep</span>;
  if (margin >= 15)
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-300"><AlertTriangle className="w-3 h-3" />Optimize</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300"><AlertTriangle className="w-3 h-3" />Review</span>;
}

// ── Tab 1: SKU Portfolio ──────────────────────────────────────────────────────

type SortKey = "name" | "margin" | "cost" | "profit" | "versions";
type SortDir = "asc" | "desc";

function PortfolioTab() {
  const { projects } = useProjects();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "keep" | "optimize" | "review">("all");
  const [sortKey, setSortKey] = useState<SortKey>("margin");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [drawerProject, setDrawerProject] = useState<any>(null);
  const [, navigate] = useLocation();

  const latestProjects = useMemo(() => getLatestProjects(projects), [projects]);

  const rows = useMemo(() => {
    return latestProjects.map((p) => {
      const stats = getProjectStats(p);
      const health = getMarginHealth(stats.margin);
      const versionCount = projects.filter(
        (x) => x.name === p.name && (x.productionType || "Outsource") === (p.productionType || "Outsource")
      ).length;
      const woodCost = (p.materials || []).reduce((s: number, m: any) => s + (m.calculatedCost || 0), 0);
      const woodPct = p.totalCost && p.totalCost > 0 ? Math.round((woodCost / p.totalCost) * 100) : 0;
      return { ...p, ...stats, health, versionCount, woodCost, woodPct };
    });
  }, [latestProjects, projects]);

  const filtered = useMemo(() => {
    let r = rows;
    if (search) r = r.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    if (filter === "keep") r = r.filter((p) => p.health === "healthy");
    if (filter === "optimize") r = r.filter((p) => p.health === "warning");
    if (filter === "review") r = r.filter((p) => p.health === "danger");
    return [...r].sort((a, b) => {
      let va: number | string = 0, vb: number | string = 0;
      if (sortKey === "name") { va = a.name; vb = b.name; }
      else if (sortKey === "margin") { va = a.margin; vb = b.margin; }
      else if (sortKey === "cost") { va = a.totalCost || 0; vb = b.totalCost || 0; }
      else if (sortKey === "profit") { va = a.profit; vb = b.profit; }
      else if (sortKey === "versions") { va = a.versionCount; vb = b.versionCount; }
      if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      return sortDir === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
  }, [rows, search, filter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="text-gray-300 ml-1">↕</span>;
    return sortDir === "desc" ? <ChevronDown className="w-3 h-3 inline ml-1" /> : <ChevronUp className="w-3 h-3 inline ml-1" />;
  }

  const keepCount = rows.filter((r) => r.health === "healthy").length;
  const optimizeCount = rows.filter((r) => r.health === "warning").length;
  const reviewCount = rows.filter((r) => r.health === "danger").length;

  const drawerData = drawerProject
    ? { ...drawerProject, margin: drawerProject.margin, profit: drawerProject.profit, price: drawerProject.price, channelName: drawerProject.channelName }
    : null;

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setFilter(filter === "keep" ? "all" : "keep")}
          className={cn("p-3 rounded border-2 text-left transition-all", filter === "keep" ? "border-green-500 bg-green-50" : "border-gray-200 bg-white hover:border-green-300")}
        >
          <div className="text-2xl font-black text-green-600">{keepCount}</div>
          <div className="text-xs font-bold text-green-700 uppercase">Keep (&gt;25%)</div>
        </button>
        <button
          onClick={() => setFilter(filter === "optimize" ? "all" : "optimize")}
          className={cn("p-3 rounded border-2 text-left transition-all", filter === "optimize" ? "border-yellow-500 bg-yellow-50" : "border-gray-200 bg-white hover:border-yellow-300")}
        >
          <div className="text-2xl font-black text-yellow-600">{optimizeCount}</div>
          <div className="text-xs font-bold text-yellow-700 uppercase">Optimize (15–25%)</div>
        </button>
        <button
          onClick={() => setFilter(filter === "review" ? "all" : "review")}
          className={cn("p-3 rounded border-2 text-left transition-all", filter === "review" ? "border-red-500 bg-red-50" : "border-gray-200 bg-white hover:border-red-300")}
        >
          <div className="text-2xl font-black text-red-600">{reviewCount}</div>
          <div className="text-xs font-bold text-red-700 uppercase">Review (&lt;15%)</div>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="ค้นหา SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 border-2 border-gray-200 focus:border-black"
        />
      </div>

      {/* Table */}
      <div className="border-2 border-black overflow-hidden shadow-[2px_2px_0px_0px_#000000]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="text-left p-3 font-bold cursor-pointer select-none" onClick={() => toggleSort("name")}>
                  SKU Name <SortIcon k="name" />
                </th>
                <th className="text-center p-3 font-bold">Type</th>
                <th className="text-right p-3 font-bold cursor-pointer select-none" onClick={() => toggleSort("cost")}>
                  ต้นทุน <SortIcon k="cost" />
                </th>
                <th className="text-right p-3 font-bold">ราคาขาย (Best)</th>
                <th className="text-right p-3 font-bold cursor-pointer select-none" onClick={() => toggleSort("profit")}>
                  กำไรสุทธิ <SortIcon k="profit" />
                </th>
                <th className="text-right p-3 font-bold cursor-pointer select-none" onClick={() => toggleSort("margin")}>
                  Net Margin <SortIcon k="margin" />
                </th>
                <th className="text-center p-3 font-bold">ไม้/ต้นทุน%</th>
                <th className="text-center p-3 font-bold cursor-pointer select-none" onClick={() => toggleSort("versions")}>
                  Versions <SortIcon k="versions" />
                </th>
                <th className="text-center p-3 font-bold">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-muted-foreground">
                    ไม่พบ SKU — <Link href="/calculator" className="text-blue-600 underline">สร้าง SKU ใหม่</Link>
                  </td>
                </tr>
              )}
              {filtered.map((row, i) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-gray-100 last:border-0 cursor-pointer transition-colors",
                    i % 2 === 0 ? "bg-white" : "bg-gray-50",
                    "hover:bg-blue-50"
                  )}
                  onClick={() => setDrawerProject(row)}
                >
                  <td className="p-3 font-bold">{row.name}</td>
                  <td className="p-3 text-center">
                    {row.productionType === "In-House"
                      ? <span className="text-[10px] px-1.5 py-0.5 rounded border font-bold bg-blue-50 text-blue-700 border-blue-200">In-House</span>
                      : <span className="text-[10px] px-1.5 py-0.5 rounded border font-bold bg-orange-50 text-orange-700 border-orange-200">Outsource</span>
                    }
                  </td>
                  <td className="p-3 text-right font-mono">
                    <div>{(row.totalCost || 0).toLocaleString()}</div>
                    {row.price > 0 && <div className="text-[10px] text-muted-foreground">{Math.round(((row.totalCost || 0) / row.price) * 100)}% ของราคาขาย</div>}
                  </td>
                  <td className="p-3 text-right font-mono">
                    <div>{row.price.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground">({Math.round(((row.totalCost || 0) / row.price) * 100)}%) {row.channelName}</div>
                  </td>
                  <td className={cn("p-3 text-right font-mono font-bold", row.profit >= 0 ? "text-green-700" : "text-red-600")}>
                    {row.profit.toLocaleString()}
                  </td>
                  <td className="p-3 text-right">
                    <MarginBadge margin={row.margin} />
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className="h-2 bg-amber-400 rounded-sm" style={{ width: `${Math.min(row.woodPct, 100) * 0.4}rem` }} />
                      <span className="text-xs text-muted-foreground">{row.woodPct}%</span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded border">{row.versionCount}</span>
                  </td>
                  <td className="p-3 text-center">
                    <StatusBadge margin={row.margin} />
                  </td>
                  <td className="p-3 text-center">
                    <button
                      className="text-gray-400 hover:text-black transition-colors"
                      onClick={(e) => { e.stopPropagation(); navigate(`/calculator?edit=${row.id}`); }}
                      title="แก้ไขต้นทุน"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      <SKUDrawer project={drawerData} onClose={() => setDrawerProject(null)} />
    </div>
  );
}

// ── Tab 2: Version Timeline ───────────────────────────────────────────────────

function VersionTimelineTab() {
  const { projects } = useProjects();
  const [selectedSku, setSelectedSku] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("all");

  // Get unique SKU names
  const skuNames = useMemo(() => {
    return Array.from(new Set(projects.map((p) => p.name))).sort();
  }, [projects]);

  // Get production types for selected SKU
  const productionTypes = useMemo(() => {
    if (!selectedSku) return [];
    return Array.from(new Set(projects.filter((p) => p.name === selectedSku).map((p) => p.productionType || "Outsource")));
  }, [projects, selectedSku]);

  // Get versions for selected SKU + type
  const versions = useMemo(() => {
    if (!selectedSku) return [];
    let filtered = projects.filter((p) => p.name === selectedSku);
    if (selectedType !== "all") filtered = filtered.filter((p) => (p.productionType || "Outsource") === selectedType);
    return [...filtered].sort((a, b) => Number(a.version) - Number(b.version));
  }, [projects, selectedSku, selectedType]);

  // Compute stats per version
  const versionRows = useMemo(() => {
    return versions.map((v, i) => {
      const stats = getProjectStats(v);
      const prev = i > 0 ? getProjectStats(versions[i - 1]) : null;
      const costDelta = prev ? (v.totalCost || 0) - (versions[i - 1].totalCost || 0) : null;
      const marginDelta = prev ? stats.margin - prev.margin : null;
      const woodCost = (v.materials || []).reduce((s: number, m: any) => s + (m.calculatedCost || 0), 0);
      return { ...v, stats, costDelta, marginDelta, woodCost };
    });
  }, [versions]);

  const firstVersion = versionRows[0];
  const lastVersion = versionRows[versionRows.length - 1];
  const totalCostReduction = firstVersion && lastVersion
    ? (firstVersion.totalCost || 0) - (lastVersion.totalCost || 0)
    : null;
  const totalMarginGain = firstVersion && lastVersion
    ? lastVersion.stats.margin - firstVersion.stats.margin
    : null;

  return (
    <div className="space-y-4">
      {/* SKU Selector */}
      <div className="flex gap-3 flex-wrap">
        <Select value={selectedSku} onValueChange={(v) => { setSelectedSku(v); setSelectedType("all"); }}>
          <SelectTrigger className="w-64 border-2 border-black h-10 font-bold">
            <SelectValue placeholder="เลือก SKU..." />
          </SelectTrigger>
          <SelectContent>
            {skuNames.map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {productionTypes.length > 1 && (
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-40 border-2 border-black h-10 font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุก Type</SelectItem>
              {productionTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {!selectedSku && (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-gray-200 rounded">
          <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">เลือก SKU เพื่อดูประวัติการปรับปรุง</p>
        </div>
      )}

      {selectedSku && versionRows.length === 0 && (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-gray-200 rounded">
          ไม่พบข้อมูล version สำหรับ SKU นี้
        </div>
      )}

      {selectedSku && versionRows.length > 0 && (
        <>
          {/* Summary */}
          {versionRows.length >= 2 && (
            <div className="grid grid-cols-2 gap-3">
              <div className={cn("p-4 rounded border-2", totalCostReduction && totalCostReduction > 0 ? "border-green-300 bg-green-50" : "border-gray-200 bg-gray-50")}>
                <div className="text-xs font-bold uppercase text-muted-foreground mb-1">ลดต้นทุนได้รวม</div>
                <div className={cn("text-2xl font-black", totalCostReduction && totalCostReduction > 0 ? "text-green-600" : "text-gray-500")}>
                  {totalCostReduction !== null ? (totalCostReduction > 0 ? `-${totalCostReduction.toLocaleString()}` : `${Math.abs(totalCostReduction).toLocaleString()}`) : "-"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">v.1 → v.{lastVersion.version}</div>
              </div>
              <div className={cn("p-4 rounded border-2", totalMarginGain && totalMarginGain > 0 ? "border-green-300 bg-green-50" : "border-gray-200 bg-gray-50")}>
                <div className="text-xs font-bold uppercase text-muted-foreground mb-1">Margin เพิ่มขึ้น</div>
                <div className={cn("text-2xl font-black", totalMarginGain && totalMarginGain > 0 ? "text-green-600" : totalMarginGain && totalMarginGain < 0 ? "text-red-600" : "text-gray-500")}>
                  {totalMarginGain !== null ? `${totalMarginGain.toFixed(1)}%` : "-"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">v.1 → v.{lastVersion.version}</div>
              </div>
            </div>
          )}

          {/* Version table */}
          <div className="border-2 border-black overflow-hidden shadow-[2px_2px_0px_0px_#000000]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="text-left p-3 font-bold">Version</th>
                  <th className="text-right p-3 font-bold">ต้นทุนรวม</th>
                  <th className="text-right p-3 font-bold">ค่าไม้</th>
                  <th className="text-right p-3 font-bold">ราคาขาย (Best)</th>
                  <th className="text-right p-3 font-bold">Net Margin</th>
                  <th className="text-right p-3 font-bold">เทียบ v.ก่อน</th>
                  <th className="text-left p-3 font-bold">หมายเหตุ</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {versionRows.map((row, i) => (
                  <tr key={row.id} className={cn("border-b border-gray-100 last:border-0", i === versionRows.length - 1 ? "bg-blue-50 font-semibold" : i % 2 === 0 ? "bg-white" : "bg-gray-50")}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm bg-gray-100 px-2 py-0.5 rounded border">v.{row.version}</span>
                        {i === versionRows.length - 1 && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 rounded font-bold">ล่าสุด</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono">{(row.totalCost || 0).toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-amber-700">{row.woodCost.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono">
                      <div>{row.stats.price.toLocaleString()}</div>
                      <div className="text-[10px] text-muted-foreground">({row.stats.price > 0 ? Math.round(((row.totalCost || 0) / row.stats.price) * 100) : 0}%) {row.stats.channelName}</div>
                    </td>
                    <td className="p-3 text-right">
                      <MarginBadge margin={row.stats.margin} />
                    </td>
                    <td className="p-3 text-right">
                      {row.costDelta !== null && (
                        <div className="space-y-0.5">
                          <div className={cn("text-xs font-bold flex items-center justify-end gap-1", row.costDelta < 0 ? "text-green-600" : row.costDelta > 0 ? "text-red-600" : "text-gray-400")}>
                            {row.costDelta < 0 ? <TrendingDown className="w-3 h-3" /> : row.costDelta > 0 ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                            {row.costDelta < 0 ? `-${Math.abs(row.costDelta).toLocaleString()}` : row.costDelta > 0 ? `${row.costDelta.toLocaleString()}` : "—"}
                          </div>
                          {row.marginDelta !== null && (
                            <div className={cn("text-[10px] text-right", row.marginDelta > 0 ? "text-green-600" : row.marginDelta < 0 ? "text-red-600" : "text-gray-400")}>
                              margin {row.marginDelta.toFixed(1)}%
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground max-w-[160px] truncate">{row.note || "—"}</td>
                    <td className="p-3 text-center">
                      <Link href={`/calculator?edit=${row.id}`}>
                        <button className="text-gray-400 hover:text-black transition-colors" title="แก้ไข">
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ── Tab 3: Cost Sensitivity ───────────────────────────────────────────────────

function CostSensitivityTab() {
  const { projects } = useProjects();
  const [woodChangePct, setWoodChangePct] = useState<number>(10); // default +10%
  const [targetMargin, setTargetMargin] = useState<number>(30);
  const [inputVal, setInputVal] = useState("10");
  const [targetVal, setTargetVal] = useState("30");

  const latestProjects = useMemo(() => getLatestProjects(projects), [projects]);

  // Impact analysis: how does wood price change affect each SKU?
  const impactRows = useMemo(() => {
    return latestProjects.map((p) => {
      const woodCost = (p.materials || []).reduce((s: number, m: any) => s + (m.calculatedCost || 0), 0);
      const newWoodCost = woodCost * (1 + woodChangePct / 100);
      const woodDelta = newWoodCost - woodCost;
      const newTotalCost = (p.totalCost || 0) + woodDelta;

      // Recalculate best channel with new cost
      const currentStats = getProjectStats(p);
      const newProjectLike = { ...p, totalCost: newTotalCost };
      const newStats = getProjectStats(newProjectLike);

      const marginDelta = newStats.margin - currentStats.margin;
      const crossesBreakeven = currentStats.margin >= 0 && newStats.margin < 0;
      const crossesDanger = currentStats.margin >= 15 && newStats.margin < 15;

      // Backsolve: how much to reduce cost to hit targetMargin at current best price?
      const bestPrice = currentStats.price;
      const bestFee = bestPrice > 0 ? Math.ceil(bestPrice * ((p.channels?.find(c => c.name === currentStats.channelName)?.feePercent || 0) / 100)) : 0;
      const requiredCost = bestPrice > 0 ? bestPrice - bestFee - (bestPrice * targetMargin / 100) : null;
      const costGap = requiredCost !== null ? (p.totalCost || 0) - requiredCost : null;

      return {
        ...p,
        currentStats,
        newStats,
        woodCost,
        woodDelta,
        marginDelta,
        crossesBreakeven,
        crossesDanger,
        requiredCost,
        costGap,
      };
    }).sort((a, b) => a.marginDelta - b.marginDelta); // worst impact first
  }, [latestProjects, woodChangePct, targetMargin]);

  const affectedCount = impactRows.filter((r) => r.crossesDanger || r.crossesBreakeven).length;

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Wood price change */}
        <div className="border-2 border-black p-4 rounded shadow-[2px_2px_0px_0px_#000000] bg-white">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-sm uppercase">ถ้าราคาไม้เปลี่ยน</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex border-2 border-black overflow-hidden">
              <button
                className={cn("px-3 py-1.5 text-sm font-bold border-r-2 border-black transition-colors", woodChangePct < 0 ? "bg-red-500 text-white" : "bg-white hover:bg-gray-100")}
                onClick={() => { const v = -Math.abs(woodChangePct || 10); setWoodChangePct(v); setInputVal(String(Math.abs(v))); }}
              >
                ลด
              </button>
              <button
                className={cn("px-3 py-1.5 text-sm font-bold transition-colors", woodChangePct >= 0 ? "bg-amber-400 text-black" : "bg-white hover:bg-gray-100")}
                onClick={() => { const v = Math.abs(woodChangePct || 10); setWoodChangePct(v); setInputVal(String(v)); }}
              >
                เพิ่ม
              </button>
            </div>
            <Input
              type="number"
              min={0}
              max={100}
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                const n = parseFloat(e.target.value);
                if (!isNaN(n) && n >= 0) setWoodChangePct(woodChangePct < 0 ? -n : n);
              }}
              className="w-20 h-9 border-2 border-black font-bold text-center"
            />
            <span className="font-bold text-lg">%</span>
          </div>
          {affectedCount > 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-600 font-bold">
              <AlertTriangle className="w-4 h-4" />
              {affectedCount} SKU จะ margin ต่ำกว่า 15%
            </div>
          )}
        </div>

        {/* Target margin backsolve */}
        <div className="border-2 border-black p-4 rounded shadow-[2px_2px_0px_0px_#000000] bg-white">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <span className="font-bold text-sm uppercase">ต้องการ Margin</span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={100}
              value={targetVal}
              onChange={(e) => {
                setTargetVal(e.target.value);
                const n = parseFloat(e.target.value);
                if (!isNaN(n)) setTargetMargin(n);
              }}
              className="w-20 h-9 border-2 border-black font-bold text-center"
            />
            <span className="font-bold text-lg">%</span>
            <span className="text-sm text-muted-foreground">→ ต้องลดต้นทุนอีกเท่าไหร่?</span>
          </div>
        </div>
      </div>

      {/* Impact table */}
      <div className="border-2 border-black overflow-hidden shadow-[2px_2px_0px_0px_#000000]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="text-left p-3 font-bold">SKU</th>
                <th className="text-right p-3 font-bold">Margin ปัจจุบัน</th>
                <th className="text-right p-3 font-bold">Margin หลังเปลี่ยน</th>
                <th className="text-right p-3 font-bold">ผลกระทบ</th>
                <th className="text-right p-3 font-bold">ต้นทุนไม้เพิ่ม</th>
                <th className="text-right p-3 font-bold">ต้องลดต้นทุนอีก (เพื่อ {targetMargin}%)</th>
                <th className="text-center p-3 font-bold">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {impactRows.map((row, i) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-gray-100 last:border-0",
                    row.crossesBreakeven ? "bg-red-50" : row.crossesDanger ? "bg-orange-50" : i % 2 === 0 ? "bg-white" : "bg-gray-50"
                  )}
                >
                  <td className="p-3 font-bold">
                    <div>{row.name}</div>
                    {row.productionType && (
                      <div className="text-[10px] text-muted-foreground">{row.productionType}</div>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <MarginBadge margin={row.currentStats.margin} />
                  </td>
                  <td className="p-3 text-right">
                    <MarginBadge margin={row.newStats.margin} />
                  </td>
                  <td className={cn("p-3 text-right font-bold font-mono", row.marginDelta < 0 ? "text-red-600" : "text-green-600")}>
                    {row.marginDelta.toFixed(1)}%
                  </td>
                  <td className={cn("p-3 text-right font-mono", woodChangePct > 0 ? "text-red-600" : "text-green-600")}>
                    {woodChangePct !== 0 ? `${Math.abs(row.woodDelta).toLocaleString()}` : "—"}
                  </td>
                  <td className="p-3 text-right">
                    {row.costGap !== null && row.costGap > 0 ? (
                      <span className="font-mono font-bold text-red-600">-{row.costGap.toLocaleString()}</span>
                    ) : row.costGap !== null && row.costGap <= 0 ? (
                      <span className="font-mono text-green-600">✓ ถึงแล้ว</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {row.crossesBreakeven ? (
                      <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 border border-red-300 rounded font-bold">ขาดทุน!</span>
                    ) : row.crossesDanger ? (
                      <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 border border-orange-300 rounded font-bold">⚠ ต่ำกว่า 15%</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 border border-green-300 rounded font-bold">ปลอดภัย</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Main Tracker Page ─────────────────────────────────────────────────────────

export default function Tracker() {
  const { projects } = useProjects();
  const latestProjects = useMemo(() => getLatestProjects(projects), [projects]);

  return (
    <div className="space-y-5 pb-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">SKU Analysis</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {latestProjects.length} SKU ทั้งหมด — วิเคราะห์ต้นทุน margin และวางแผนเพิ่มกำไร
          </p>
        </div>
        <Link href="/calculator">
          <Button className="neo-button bg-gray-900 text-white hover:bg-gray-700 h-10 px-5 font-bold">
            <Plus className="w-4 h-4 mr-2" /> New SKU
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="portfolio">
        <TabsList className="border-2 border-black bg-white h-10 p-0.5 gap-0.5">
          <TabsTrigger
            value="portfolio"
            className="h-9 px-4 font-bold text-sm data-[state=active]:bg-gray-900 data-[state=active]:text-white rounded-sm"
          >
            <BarChart3 className="w-4 h-4 mr-1.5" />
            Portfolio
          </TabsTrigger>
          <TabsTrigger
            value="timeline"
            className="h-9 px-4 font-bold text-sm data-[state=active]:bg-gray-900 data-[state=active]:text-white rounded-sm"
          >
            <History className="w-4 h-4 mr-1.5" />
            Version History
          </TabsTrigger>
          <TabsTrigger
            value="sensitivity"
            className="h-9 px-4 font-bold text-sm data-[state=active]:bg-gray-900 data-[state=active]:text-white rounded-sm"
          >
            <Zap className="w-4 h-4 mr-1.5" />
            Cost Sensitivity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="mt-4">
          <PortfolioTab />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <VersionTimelineTab />
        </TabsContent>

        <TabsContent value="sensitivity" className="mt-4">
          <CostSensitivityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
