import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjects } from "@/contexts/ProjectContext";
import { getProjectStats, getLatestProjects, getMarginHealth } from "@/lib/projectStats";
import {
  Trophy,
  TrendingUp,
  Package,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Filter,
  History,
  DollarSign,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";
import { useState, useMemo } from "react";

// ── Traffic light badge ──────────────────────────────────────────────────────
function MarginBadge({ margin }: { margin: number }) {
  const health = getMarginHealth(margin);
  if (health === "healthy")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border bg-green-100 text-green-700 border-green-300">
        ✓ {margin}%
      </span>
    );
  if (health === "warning")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border bg-yellow-100 text-yellow-700 border-yellow-300">
        ⚠ {margin}%
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border bg-red-100 text-red-700 border-red-300">
      ✗ {margin}%
    </span>
  );
}

export default function Home() {
  const { projects } = useProjects();
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [selectedHistorySku, setSelectedHistorySku] = useState<string>("all");

  // ── Derived data ─────────────────────────────────────────────────────────
  const availableChannels = useMemo(() => {
    const channels = new Set<string>();
    projects.forEach((p) => p.channels?.forEach((c: any) => channels.add(c.name)));
    return Array.from(channels).sort();
  }, [projects]);

  const latestProjects = useMemo(() => getLatestProjects(projects), [projects]);

  const activeProjects = useMemo(
    () =>
      latestProjects
        .map((p) => ({ ...p, ...getProjectStats(p, selectedChannel === "all" ? undefined : selectedChannel) }))
        .filter((p) => p.hasChannel),
    [latestProjects, selectedChannel]
  );

  // KPI cards
  const activeSkus = activeProjects.length;
  const avgMargin = useMemo(
    () =>
      activeSkus > 0
        ? Math.round(activeProjects.reduce((s, p) => s + p.margin, 0) / activeSkus)
        : 0,
    [activeProjects, activeSkus]
  );
  const totalPotentialProfit = useMemo(
    () => activeProjects.reduce((s, p) => s + p.profit, 0),
    [activeProjects]
  );

  // Needs Attention (margin < 15%), sorted worst first
  const needsAttention = useMemo(
    () => [...activeProjects].filter((p) => p.margin < 15).sort((a, b) => a.margin - b.margin),
    [activeProjects]
  );

  // Top 5 performers (margin > 0), sorted best first
  const topProjects = useMemo(
    () =>
      [...activeProjects]
        .filter((p) => p.margin > 0)
        .sort((a, b) => b.margin - a.margin)
        .slice(0, 5),
    [activeProjects]
  );

  // Margin history chart
  const uniqueSkuNames = useMemo(
    () => Array.from(new Set(projects.map((p) => p.name))).sort(),
    [projects]
  );

  const historyChartData = useMemo(() => {
    if (selectedHistorySku === "all") return [];
    return projects
      .filter((p) => p.name === selectedHistorySku)
      .sort((a, b) => a.version - b.version)
      .map((v) => {
        const stats = getProjectStats(v, selectedChannel === "all" ? undefined : selectedChannel);
        return { version: `v.${v.version}`, margin: stats.margin, profit: stats.profit };
      });
  }, [projects, selectedHistorySku, selectedChannel]);

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold uppercase text-black drop-shadow-[2px_2px_0px_rgba(0,0,0,0.2)]">
            Command Center
          </h1>
          <p className="text-muted-foreground font-medium mt-1 text-sm">
            ภาพรวมผลกำไรและ SKU ทั้งหมด
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Select value={selectedChannel} onValueChange={setSelectedChannel}>
            <SelectTrigger className="h-11 border-2 border-black shadow-[2px_2px_0px_0px_#000000] font-bold w-full sm:w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <SelectValue placeholder="ทุก Channel" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุก Channel (Best)</SelectItem>
              {availableChannels.map((ch) => (
                <SelectItem key={ch} value={ch}>
                  {ch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Link href="/calculator">
            <Button className="neo-button bg-chart-3 text-white hover:bg-blue-700 h-11 px-6 w-full sm:w-auto">
              + New SKU <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ── KPI Cards (3 only) ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Active SKUs */}
        <Card className="neo-card bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-chart-1 border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_#000000] flex-shrink-0">
              <Package className="w-6 h-6 text-black" />
            </div>
            <div>
              <p className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Active SKUs</p>
              <h3 className="font-heading text-3xl font-bold">{activeSkus}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Avg Net Margin */}
        <Card className="neo-card bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div
              className={cn(
                "w-12 h-12 border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_#000000] flex-shrink-0",
                avgMargin >= 25 ? "bg-green-400" : avgMargin >= 15 ? "bg-yellow-400" : "bg-red-400"
              )}
            >
              <TrendingUp className="w-6 h-6 text-black" />
            </div>
            <div>
              <p className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Avg Net Margin</p>
              <h3
                className={cn(
                  "font-heading text-3xl font-bold",
                  avgMargin >= 25 ? "text-green-600" : avgMargin >= 15 ? "text-yellow-600" : "text-red-500"
                )}
              >
                {avgMargin}%
              </h3>
            </div>
          </CardContent>
        </Card>

        {/* Potential Profit */}
        <Card className="neo-card bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-chart-4 border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_#000000] flex-shrink-0">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Potential Profit</p>
              <h3 className="font-heading text-3xl font-bold">
                ฿{totalPotentialProfit >= 1000
                  ? `${(totalPotentialProfit / 1000).toFixed(1)}k`
                  : totalPotentialProfit.toLocaleString()}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Main Grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Needs Attention + Top Performers */}
        <div className="lg:col-span-2 space-y-6">

          {/* Needs Attention */}
          <Card className="neo-card bg-white">
            <CardHeader className="border-b-2 border-black bg-red-50 py-3">
              <CardTitle className="font-heading text-lg uppercase flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                ต้องดูแล — Margin ต่ำกว่า 15%
                {needsAttention.length > 0 && (
                  <Badge className="ml-auto bg-red-500 text-white border-0">
                    {needsAttention.length} SKU
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {needsAttention.length === 0 ? (
                <div className="p-8 flex flex-col items-center gap-2 text-center">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                  <p className="font-bold text-green-700">ทุก SKU มี Margin ดี!</p>
                  <p className="text-sm text-muted-foreground">ไม่มี SKU ที่ต้องแก้ไขตอนนี้</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {needsAttention.map((project) => (
                    <div
                      key={project.id}
                      className="p-4 flex items-center gap-3 hover:bg-red-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-base uppercase">{project.name}</h4>
                          {project.productionType === "In-House" && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded border font-bold uppercase bg-blue-50 text-blue-700 border-blue-200">
                              In-House
                            </span>
                          )}
                          <span className="font-mono text-xs text-muted-foreground">v.{project.version}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm flex-wrap">
                          <MarginBadge margin={project.margin} />
                          <span className="text-muted-foreground">
                            กำไร ฿{project.profit.toLocaleString()} · {project.channelName}
                          </span>
                        </div>
                      </div>
                      <Link href={`/calculator?id=${project.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-2 border-black shadow-[2px_2px_0px_0px_#000000] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000000] transition-all flex-shrink-0"
                        >
                          แก้ไข
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card className="neo-card bg-white">
            <CardHeader className="border-b-2 border-black bg-yellow-400 py-3">
              <CardTitle className="font-heading text-lg uppercase flex items-center gap-2 text-black">
                <Trophy className="w-5 h-5" /> Top 5 Net Margin
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {topProjects.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>ยังไม่มี SKU ที่คำนวณแล้ว</p>
                  <Link href="/calculator">
                    <Button className="mt-3 neo-button bg-chart-3 text-white">สร้าง SKU แรก</Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {topProjects.map((project, i) => (
                    <div
                      key={project.id}
                      className="p-4 flex items-center gap-3 hover:bg-yellow-50 transition-colors"
                    >
                      <div
                        className={cn(
                          "w-10 h-10 border-2 border-black flex items-center justify-center font-black text-lg shadow-[2px_2px_0px_0px_#000000] flex-shrink-0",
                          i === 0
                            ? "bg-yellow-300 text-black"
                            : i === 1
                            ? "bg-gray-300 text-black"
                            : i === 2
                            ? "bg-orange-300 text-black"
                            : "bg-white text-gray-400"
                        )}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-base uppercase truncate">{project.name}</h4>
                          {project.productionType === "In-House" && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded border font-bold uppercase bg-blue-50 text-blue-700 border-blue-200">
                              In-House
                            </span>
                          )}
                          <span className="font-mono text-xs text-muted-foreground">v.{project.version}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm flex-wrap">
                          <MarginBadge margin={project.margin} />
                          <span className="text-muted-foreground">
                            กำไร ฿{project.profit.toLocaleString()} · {project.channelName}
                          </span>
                        </div>
                      </div>
                      <Link href={`/calculator?id=${project.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-2 border-black shadow-[2px_2px_0px_0px_#000000] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000000] transition-all flex-shrink-0"
                        >
                          Analyze
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Margin History Chart */}
        <div className="lg:col-span-1">
          <Card className="neo-card bg-white h-full">
            <CardHeader className="border-b-2 border-black py-3">
              <CardTitle className="font-heading text-lg uppercase flex items-center gap-2">
                <History className="w-5 h-5" /> Margin History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <Select value={selectedHistorySku} onValueChange={setSelectedHistorySku}>
                <SelectTrigger className="h-9 border-2 border-black shadow-[2px_2px_0px_0px_#000000] font-bold text-xs">
                  <SelectValue placeholder="เลือก SKU..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">เลือก SKU...</SelectItem>
                  {uniqueSkuNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="h-[260px] w-full">
                {selectedHistorySku !== "all" && historyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="version" stroke="#000" fontSize={10} tickMargin={5} />
                      <YAxis
                        stroke="#000"
                        fontSize={10}
                        tickFormatter={(v) => `${v}%`}
                        domain={["auto", "auto"]}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          border: "2px solid black",
                          borderRadius: "0px",
                          boxShadow: "4px 4px 0px 0px rgba(0,0,0,0.1)",
                        }}
                        labelFormatter={(v) => `${selectedHistorySku} (${v})`}
                        formatter={(value: number, name: string) => [
                          name === "margin" ? `${value}%` : `฿${value.toLocaleString()}`,
                          name === "margin" ? "Net Margin" : "กำไร",
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="margin"
                        stroke="#16a34a"
                        strokeWidth={3}
                        dot={{ r: 5, fill: "#16a34a", stroke: "#000", strokeWidth: 2 }}
                        activeDot={{ r: 7, stroke: "#000", strokeWidth: 2 }}
                        name="margin"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                    <TrendingUp className="w-10 h-10 mb-2 opacity-20" />
                    <p className="text-sm font-medium">เลือก SKU เพื่อดู Margin Trend</p>
                    <p className="text-xs mt-1 opacity-60">เปรียบเทียบ margin แต่ละ version</p>
                  </div>
                )}
              </div>

              {/* Mini legend */}
              {selectedHistorySku !== "all" && historyChartData.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-4 h-0.5 bg-green-600 inline-block" />
                  <span>Net Margin (%) ต่อ version</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
