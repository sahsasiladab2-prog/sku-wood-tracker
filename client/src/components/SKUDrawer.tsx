/**
 * SKUDrawer — slide-in panel for quick SKU analysis without leaving the Dashboard.
 *
 * Shows:
 *  1. Header: SKU name, version, production type, overall margin badge
 *  2. Channel Comparison Table: every channel side-by-side with fee, cost, profit, margin
 *  3. Profit Waterfall Bar: proportional breakdown of selling price → wood / labour / waste / other / profit
 *     - Each segment shows % of selling price
 *     - Tooltip shows ฿ value and "ถ้าลด X% จะได้กำไรเพิ่ม ฿Y"
 *     - Threshold line at 25% margin target
 *     - Profit bar color: red < 15%, yellow 15–25%, green > 25%
 *  4. Action Buttons: "แก้ไขต้นทุน" (→ Calculator) | "อัปเดตราคาขาย" (inline modal)
 */

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getMarginHealth } from "@/lib/projectStats";
import { useProjects, type Project } from "@/contexts/ProjectContext";
import { Edit3, X, TrendingUp } from "lucide-react";
import { useState, useMemo, useRef } from "react";
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

// ── Profit Waterfall Bar ──────────────────────────────────────────────────────

interface WaterfallProps {
  totalCost: number;
  woodCost: number;
  labourCost: number;
  wasteCost: number;
  bestProfit: number;
  bestPrice: number;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  content: React.ReactNode;
}

function CostWaterfall({ totalCost, woodCost, labourCost, wasteCost, bestProfit, bestPrice }: WaterfallProps) {
  const otherCost = Math.max(0, totalCost - woodCost - labourCost - wasteCost);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, content: null });
  const barRef = useRef<HTMLDivElement>(null);

  // Use bestPrice as the 100% base; if no price, fall back to totalCost
  const base = bestPrice > 0 ? bestPrice : totalCost;

  const profitColor =
    bestPrice > 0
      ? bestProfit / bestPrice >= 0.25
        ? "bg-green-500"
        : bestProfit / bestPrice >= 0.15
        ? "bg-yellow-400"
        : "bg-red-400"
      : "bg-gray-300";

  const segments = [
    {
      label: "ค่าไม้",
      value: woodCost,
      color: "bg-amber-400",
      hoverColor: "hover:bg-amber-500",
      tip: (pct: number) => (
        <div>
          <div className="font-bold text-amber-800">ค่าไม้ {pct}% ของราคาขาย</div>
          <div className="text-gray-700">฿{woodCost.toLocaleString()}</div>
          {bestPrice > 0 && (
            <div className="text-green-700 text-xs mt-1">
              ถ้าลด 5% → กำไรเพิ่ม ฿{Math.ceil(woodCost * 0.05).toLocaleString()}
            </div>
          )}
        </div>
      ),
    },
    {
      label: "แรงงาน",
      value: labourCost,
      color: "bg-blue-400",
      hoverColor: "hover:bg-blue-500",
      tip: (pct: number) => (
        <div>
          <div className="font-bold text-blue-800">แรงงาน {pct}% ของราคาขาย</div>
          <div className="text-gray-700">฿{labourCost.toLocaleString()}</div>
          {bestPrice > 0 && (
            <div className="text-green-700 text-xs mt-1">
              ถ้าลด 5% → กำไรเพิ่ม ฿{Math.ceil(labourCost * 0.05).toLocaleString()}
            </div>
          )}
        </div>
      ),
    },
    {
      label: "ของเสีย",
      value: wasteCost,
      color: "bg-red-300",
      hoverColor: "hover:bg-red-400",
      tip: (pct: number) => (
        <div>
          <div className="font-bold text-red-800">ของเสีย {pct}% ของราคาขาย</div>
          <div className="text-gray-700">฿{wasteCost.toLocaleString()}</div>
          {bestPrice > 0 && (
            <div className="text-green-700 text-xs mt-1">
              ถ้าลด 5% → กำไรเพิ่ม ฿{Math.ceil(wasteCost * 0.05).toLocaleString()}
            </div>
          )}
        </div>
      ),
    },
    {
      label: "อื่นๆ",
      value: otherCost,
      color: "bg-gray-300",
      hoverColor: "hover:bg-gray-400",
      tip: (pct: number) => (
        <div>
          <div className="font-bold text-gray-700">ต้นทุนอื่นๆ {pct}% ของราคาขาย</div>
          <div className="text-gray-700">฿{otherCost.toLocaleString()}</div>
        </div>
      ),
    },
    {
      label: "กำไร",
      value: bestProfit > 0 ? bestProfit : 0,
      color: profitColor,
      hoverColor: "",
      tip: (pct: number) => (
        <div>
          <div className={cn("font-bold", pct >= 25 ? "text-green-700" : pct >= 15 ? "text-yellow-700" : "text-red-700")}>
            กำไรสุทธิ {pct}% ของราคาขาย
          </div>
          <div className="text-gray-700">฿{(bestProfit > 0 ? bestProfit : 0).toLocaleString()}</div>
          {pct < 25 && (
            <div className="text-orange-600 text-xs mt-1">
              เป้า 25% → ต้องเพิ่มกำไร ฿{Math.ceil(bestPrice * 0.25 - (bestProfit > 0 ? bestProfit : 0)).toLocaleString()}
            </div>
          )}
        </div>
      ),
    },
  ].filter((s) => s.value > 0);

  if (base <= 0) return null;

  // 25% threshold position (from left) — only show if we have a price
  const thresholdPct = bestPrice > 0 ? ((totalCost / bestPrice) * 100) : null; // cost boundary = where profit starts
  const targetMarginLeft = bestPrice > 0 ? ((1 - 0.25) * 100) : null; // 75% from left = 25% profit zone

  function handleMouseEnter(e: React.MouseEvent, seg: typeof segments[0]) {
    const pct = Math.round((seg.value / base) * 100);
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({
      visible: true,
      x: e.clientX - rect.left,
      y: -10,
      content: seg.tip(pct),
    });
  }

  function handleMouseLeave() {
    setTooltip((t) => ({ ...t, visible: false }));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">สัดส่วนของราคาขาย 100%</p>
        {bestPrice > 0 && (
          <p className="text-xs text-muted-foreground">ราคาขาย ฿{bestPrice.toLocaleString()}</p>
        )}
      </div>

      {/* Bar with threshold line */}
      <div className="relative" ref={barRef}>
        <div className="flex h-8 w-full overflow-hidden rounded border-2 border-black shadow-[2px_2px_0px_0px_#000000]">
          {segments.map((seg) => {
            const pct = (seg.value / base) * 100;
            return (
              <div
                key={seg.label}
                className={cn(
                  "flex items-center justify-center text-[10px] font-bold overflow-hidden transition-colors cursor-default",
                  seg.color,
                  seg.hoverColor
                )}
                style={{ width: `${pct}%` }}
                onMouseEnter={(e) => handleMouseEnter(e, seg)}
                onMouseLeave={handleMouseLeave}
              >
                {pct > 8 ? `${Math.round(pct)}%` : ""}
              </div>
            );
          })}
        </div>

        {/* 25% target margin threshold line */}
        {targetMarginLeft !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-black/60 z-10"
            style={{ left: `${targetMarginLeft}%` }}
            title="เป้า Margin 25%"
          >
            <div className="absolute -top-5 -translate-x-1/2 text-[9px] font-bold text-gray-600 whitespace-nowrap bg-white px-1 border border-gray-300 rounded">
              เป้า 25%
            </div>
          </div>
        )}

        {/* Tooltip */}
        {tooltip.visible && (
          <div
            className="absolute z-20 bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000000] rounded p-2 text-xs pointer-events-none min-w-[160px]"
            style={{
              left: Math.min(tooltip.x, (barRef.current?.offsetWidth || 300) - 170),
              bottom: "calc(100% + 8px)",
            }}
          >
            {tooltip.content}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
        {segments.map((seg) => {
          const pct = Math.round((seg.value / base) * 100);
          return (
            <div key={seg.label} className="flex items-center gap-1 text-xs">
              <span className={cn("w-3 h-3 rounded-sm border border-black/20 flex-shrink-0", seg.color)} />
              <span className="font-medium">{seg.label}</span>
              <span className="text-muted-foreground">฿{seg.value.toLocaleString()}</span>
              <span className="text-muted-foreground">({pct}%)</span>
            </div>
          );
        })}
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
              <div className="text-sm text-muted-foreground">ยังไม่มี Channel — ไปเพิ่มใน Calculator</div>
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
                        <td className="p-2 text-right font-mono text-red-600">฿{ch.fee.toLocaleString()}</td>
                        <td className={cn("p-2 text-right font-mono font-bold", ch.netProfit >= 0 ? "text-green-700" : "text-red-600")}>
                          ฿{ch.netProfit.toLocaleString()}
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

          {/* ── Profit Waterfall Bar ──────────────────────────────────── */}
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
                navigate(`/calculator?edit=${project.id}`);
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
