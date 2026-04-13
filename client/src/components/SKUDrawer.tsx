/**
 * SKUDrawer — slide-in panel for quick SKU analysis without leaving the Dashboard.
 *
 * Shows:
 *  1. Header: SKU name, version, production type, overall margin badge
 *  2. Channel Comparison Table: every channel side-by-side with fee, cost, profit, margin
 *  3. Cost Waterfall Bar: proportional breakdown of wood / labour / waste / profit
 *  4. Action Buttons: "แก้ไขต้นทุน" (→ Calculator) | "อัปเดตราคาขาย" (inline modal)
 */

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getMarginHealth } from "@/lib/projectStats";
import { useProjects, type Project } from "@/contexts/ProjectContext";
import { Edit3, ExternalLink, X, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

// ── helpers ──────────────────────────────────────────────────────────────────

function calcChannel(ch: { price: number; feePercent: number }, totalCost: number) {
  const price = ch.price || 0;
  const fee = Math.ceil(price * (ch.feePercent / 100));
  const netProfit = price - totalCost - fee;
  const margin = price > 0 ? parseFloat(((netProfit / price) * 100).toFixed(1)) : 0;
  return { price, fee, netProfit, margin };
}

function MarginPill({ margin }: { margin: number }) {
  const h = getMarginHealth(margin);
  const base = "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border";
  if (h === "healthy") return <span className={cn(base, "bg-green-100 text-green-700 border-green-300")}>✓ {margin}%</span>;
  if (h === "warning") return <span className={cn(base, "bg-yellow-100 text-yellow-700 border-yellow-300")}>⚠ {margin}%</span>;
  return <span className={cn(base, "bg-red-100 text-red-700 border-red-300")}>✗ {margin}%</span>;
}

// ── Cost Waterfall Bar ────────────────────────────────────────────────────────

interface WaterfallProps {
  totalCost: number;
  woodCost: number;
  labourCost: number;
  wasteCost: number;
  bestProfit: number;
  bestPrice: number;
}

function CostWaterfall({ totalCost, woodCost, labourCost, wasteCost, bestProfit, bestPrice }: WaterfallProps) {
  const otherCost = totalCost - woodCost - labourCost - wasteCost;
  const segments = [
    { label: "ไม้", value: woodCost, color: "bg-amber-400", textColor: "text-amber-800" },
    { label: "แรงงาน", value: labourCost, color: "bg-blue-400", textColor: "text-blue-800" },
    { label: "ของเสีย", value: wasteCost, color: "bg-red-300", textColor: "text-red-700" },
    { label: "อื่นๆ", value: otherCost > 0 ? otherCost : 0, color: "bg-gray-300", textColor: "text-gray-600" },
    { label: "กำไร", value: bestProfit > 0 ? bestProfit : 0, color: "bg-green-400", textColor: "text-green-800" },
  ].filter((s) => s.value > 0);

  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total <= 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">สัดส่วนต้นทุน + กำไร</p>
      {/* Bar */}
      <div className="flex h-7 w-full overflow-hidden rounded border-2 border-black shadow-[2px_2px_0px_0px_#000000]">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className={cn("flex items-center justify-center text-[10px] font-bold overflow-hidden transition-all", seg.color)}
            style={{ width: `${(seg.value / total) * 100}%` }}
            title={`${seg.label}: ฿${seg.value.toLocaleString()}`}
          >
            {(seg.value / total) > 0.08 ? `${Math.round((seg.value / total) * 100)}%` : ""}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1 text-xs">
            <span className={cn("w-3 h-3 rounded-sm border border-black/20 flex-shrink-0", seg.color)} />
            <span className="font-medium">{seg.label}</span>
            <span className="text-muted-foreground">฿{seg.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Inline price update modal ─────────────────────────────────────────────────

interface PriceEditProps {
  project: Project;
  onClose: () => void;
}

function PriceEditPanel({ project, onClose }: PriceEditProps) {
  const { updateProject } = useProjects();
  const [prices, setPrices] = useState<Record<string, { price: string; feePercent: string }>>(
    () =>
      Object.fromEntries(
        (project.channels || []).map((ch) => [ch.name, { price: String(ch.price), feePercent: String(ch.feePercent) }])
      )
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const newChannels = (project.channels || []).map((ch) => ({
      ...ch,
      price: parseFloat(prices[ch.name]?.price || String(ch.price)) || ch.price,
      feePercent: parseFloat(prices[ch.name]?.feePercent || String(ch.feePercent)) || ch.feePercent,
    }));
    await updateProject(project.id, { channels: newChannels });
    toast.success("อัปเดตราคาขายเรียบร้อย");
    setSaving(false);
    onClose();
  }

  return (
    <div className="border-2 border-black bg-blue-50 rounded p-4 space-y-3 shadow-[2px_2px_0px_0px_#000000]">
      <div className="flex items-center justify-between">
        <p className="font-bold text-sm uppercase">อัปเดตราคาขาย</p>
        <button onClick={onClose} className="text-muted-foreground hover:text-black">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2">
        {(project.channels || []).map((ch) => (
          <div key={ch.name} className="grid grid-cols-3 gap-2 items-end">
            <div>
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">{ch.name}</Label>
              <div className="flex items-center border-2 border-black bg-white h-8 px-2 text-sm font-bold shadow-[1px_1px_0px_0px_#000000]">
                <span className="text-muted-foreground mr-1">฿</span>
                <Input
                  className="border-0 p-0 h-auto text-sm font-bold focus-visible:ring-0 bg-transparent"
                  value={prices[ch.name]?.price ?? ""}
                  onChange={(e) => setPrices((prev) => ({ ...prev, [ch.name]: { ...prev[ch.name], price: e.target.value } }))}
                />
              </div>
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">ค่าธรรมเนียม %</Label>
              <div className="flex items-center border-2 border-black bg-white h-8 px-2 text-sm font-bold shadow-[1px_1px_0px_0px_#000000]">
                <Input
                  className="border-0 p-0 h-auto text-sm font-bold focus-visible:ring-0 bg-transparent"
                  value={prices[ch.name]?.feePercent ?? ""}
                  onChange={(e) => setPrices((prev) => ({ ...prev, [ch.name]: { ...prev[ch.name], feePercent: e.target.value } }))}
                />
                <span className="text-muted-foreground ml-1">%</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground pb-1">
              {(() => {
                const p = parseFloat(prices[ch.name]?.price || "0") || 0;
                const f = parseFloat(prices[ch.name]?.feePercent || "0") || 0;
                const fee = Math.ceil(p * f / 100);
                const profit = p - (project.totalCost || 0) - fee;
                const margin = p > 0 ? ((profit / p) * 100).toFixed(1) : "0";
                return <span className={cn("font-bold", parseFloat(margin) >= 25 ? "text-green-600" : parseFloat(margin) >= 15 ? "text-yellow-600" : "text-red-500")}>{margin}%</span>;
              })()}
            </div>
          </div>
        ))}
      </div>
      <Button
        className="w-full neo-button bg-chart-3 text-white hover:bg-blue-700 h-9"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "กำลังบันทึก..." : "บันทึกราคา"}
      </Button>
    </div>
  );
}

// ── Main Drawer ───────────────────────────────────────────────────────────────

interface SKUDrawerProps {
  project: (Project & { margin: number; profit: number; price: number; channelName: string }) | null;
  onClose: () => void;
}

export function SKUDrawer({ project, onClose }: SKUDrawerProps) {
  const [, navigate] = useLocation();
  const [showPriceEdit, setShowPriceEdit] = useState(false);

  const channels = useMemo(() => {
    if (!project) return [];
    return (project.channels || []).map((ch) => {
      const calc = calcChannel(ch, project.totalCost || 0);
      return { ...ch, ...calc, isBest: false };
    });
  }, [project]);

  // Mark best channel
  const channelsWithBest = useMemo(() => {
    if (channels.length === 0) return channels;
    const maxMargin = Math.max(...channels.map((c) => c.margin));
    return channels.map((c) => ({ ...c, isBest: c.margin === maxMargin }));
  }, [channels]);

  const woodCost = useMemo(
    () => (project?.materials || []).reduce((s: number, m: any) => s + (m.calculatedCost || 0), 0),
    [project]
  );
  const labourCost = useMemo(
    () => (project?.costs?.carpenter || 0) + (project?.costs?.painting || 0) + (project?.costs?.packing || 0),
    [project]
  );
  const wasteCost = project?.costs?.waste || 0;
  const bestProfit = project?.profit || 0;
  const bestPrice = project?.price || 0;

  if (!project) return null;

  return (
    <Sheet open={!!project} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:w-[480px] p-0 border-l-2 border-black overflow-y-auto"
        style={{ boxShadow: "-4px 0 0 0 rgba(0,0,0,0.08)" }}
      >
        {/* Header */}
        <SheetHeader className="p-5 border-b-2 border-black bg-white sticky top-0 z-10">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <SheetTitle className="font-heading text-xl uppercase font-black leading-tight truncate">
                {project.name}
              </SheetTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="font-mono text-xs text-muted-foreground">v.{project.version}</span>
                {project.productionType === "In-House" ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded border font-bold uppercase bg-blue-50 text-blue-700 border-blue-200">
                    In-House
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded border font-bold uppercase bg-orange-50 text-orange-700 border-orange-200">
                    Outsource
                  </span>
                )}
                <MarginPill margin={project.margin} />
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="p-5 space-y-6">
          {/* ── Channel Comparison Table ──────────────────────────────── */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">เปรียบเทียบ Channel</p>
            {channelsWithBest.length === 0 ? (
              <div className="text-sm text-muted-foreground border-2 border-dashed border-gray-200 rounded p-4 text-center">
                ยังไม่มี Channel — ไปเพิ่มใน Calculator
              </div>
            ) : (
              <div className="border-2 border-black overflow-hidden shadow-[2px_2px_0px_0px_#000000]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-black">
                      <th className="text-left p-2 font-bold uppercase">Channel</th>
                      <th className="text-right p-2 font-bold uppercase">ราคาขาย</th>
                      <th className="text-right p-2 font-bold uppercase">ค่าธรรมเนียม</th>
                      <th className="text-right p-2 font-bold uppercase">กำไร</th>
                      <th className="text-right p-2 font-bold uppercase">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channelsWithBest.map((ch, i) => (
                      <tr
                        key={ch.name}
                        className={cn(
                          "border-b border-gray-100 last:border-0",
                          ch.isBest ? "bg-green-50" : i % 2 === 0 ? "bg-white" : "bg-gray-50"
                        )}
                      >
                        <td className="p-2 font-bold">
                          <div className="flex items-center gap-1">
                            {ch.name}
                            {ch.isBest && (
                              <span className="text-[9px] px-1 py-0.5 bg-green-200 text-green-800 rounded font-bold border border-green-300">
                                BEST
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-2 text-right font-mono">฿{ch.price.toLocaleString()}</td>
                        <td className="p-2 text-right font-mono text-red-600">-฿{ch.fee.toLocaleString()}</td>
                        <td className={cn("p-2 text-right font-mono font-bold", ch.netProfit >= 0 ? "text-green-700" : "text-red-600")}>
                          {ch.netProfit >= 0 ? "+" : ""}฿{ch.netProfit.toLocaleString()}
                        </td>
                        <td className="p-2 text-right">
                          <MarginPill margin={ch.margin} />
                        </td>
                      </tr>
                    ))}
                    {/* Cost row */}
                    <tr className="bg-gray-100 border-t-2 border-black">
                      <td colSpan={3} className="p-2 font-bold text-muted-foreground uppercase text-[10px]">
                        ต้นทุนรวม
                      </td>
                      <td colSpan={2} className="p-2 text-right font-mono font-bold">
                        ฿{(project.totalCost || 0).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Cost Waterfall ────────────────────────────────────────── */}
          <CostWaterfall
            totalCost={project.totalCost || 0}
            woodCost={woodCost}
            labourCost={labourCost}
            wasteCost={wasteCost}
            bestProfit={bestProfit}
            bestPrice={bestPrice}
          />

          {/* ── Note ─────────────────────────────────────────────────── */}
          {project.note && (
            <div className="border-l-4 border-yellow-400 bg-yellow-50 pl-3 py-2 text-sm">
              <p className="text-[10px] font-bold uppercase text-yellow-700 mb-0.5">หมายเหตุ</p>
              <p className="text-gray-700">{project.note}</p>
            </div>
          )}

          {/* ── Inline Price Edit ─────────────────────────────────────── */}
          {showPriceEdit && (
            <PriceEditPanel project={project} onClose={() => setShowPriceEdit(false)} />
          )}

          {/* ── Action Buttons ────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t-2 border-black">
            <Button
              variant="outline"
              className="border-2 border-black shadow-[2px_2px_0px_0px_#000000] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000000] transition-all h-11 font-bold text-sm"
              onClick={() => {
                onClose();
                navigate(`/calculator?id=${project.id}`);
              }}
            >
              <Edit3 className="w-4 h-4 mr-2" />
              แก้ไขต้นทุน
            </Button>
            <Button
              className="neo-button bg-chart-3 text-white hover:bg-blue-700 h-11 font-bold text-sm"
              onClick={() => setShowPriceEdit((v) => !v)}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              อัปเดตราคาขาย
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
