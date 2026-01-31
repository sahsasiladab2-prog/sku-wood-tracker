import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjects } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, Package, ArrowRight, Star, Target, AlertTriangle, DollarSign, PieChart as PieIcon, Filter } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";

export default function Home() {
  const { projects } = useProjects();
  const [selectedChannel, setSelectedChannel] = useState<string>("all");

  // Extract all unique channel names from all projects
  const availableChannels = useMemo(() => {
    const channels = new Set<string>();
    projects.forEach(p => {
      if (p.channels) {
        p.channels.forEach((c: any) => channels.add(c.name));
      }
    });
    return Array.from(channels).sort();
  }, [projects]);

  // Helper to get stats based on selected channel
  const getProjectStats = (project: any) => {
    // If a specific channel is selected
    if (selectedChannel !== "all") {
      const targetChannel = project.channels?.find((c: any) => c.name === selectedChannel);
      if (targetChannel) {
        return {
          margin: targetChannel.marginPercent,
          profit: targetChannel.profit,
          price: targetChannel.price,
          channelName: targetChannel.name,
          hasChannel: true
        };
      }
      // If project doesn't have this channel, return null stats
      return {
        margin: 0,
        profit: 0,
        price: 0,
        channelName: '-',
        hasChannel: false
      };
    }

    // Default behavior: Best channel
    if (project.channels && project.channels.length > 0) {
      const bestChannel = project.channels.reduce((prev: any, current: any) => 
        (current.marginPercent > prev.marginPercent) ? current : prev
      );
      return {
        margin: bestChannel.marginPercent,
        profit: bestChannel.profit,
        price: bestChannel.price,
        channelName: bestChannel.name,
        hasChannel: true
      };
    }
    
    // Fallback to legacy fields
    return {
      margin: project.margin || 0,
      profit: (project.sellingPrice || 0) - (project.totalCost || 0),
      price: project.sellingPrice || 0,
      channelName: 'Default',
      hasChannel: true
    };
  };

  // Filter projects based on channel availability
  const activeProjects = projects.map(p => ({ ...p, ...getProjectStats(p) }))
    .filter(p => p.hasChannel);

  // Calculate stats
  const activeSkus = activeProjects.length;
  
  const avgMargin = activeSkus > 0 
    ? Math.round(activeProjects.reduce((sum, p) => sum + p.margin, 0) / activeSkus) 
    : 0;
  
  // Financial Overview
  const totalPotentialRevenue = activeProjects.reduce((sum, p) => sum + p.price, 0);
  const totalPotentialProfit = activeProjects.reduce((sum, p) => sum + p.profit, 0);
  
  // Gamification Stats (Global)
  const totalXp = projects.reduce((sum, p) => sum + (p.totalCost > 5000 ? 1000 : 500), 0);
  const level = Math.floor(totalXp / 1000) + 1;

  // Get top projects by margin (Top 5)
  const topProjects = [...activeProjects]
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 5);

  // Identify Low Margin Projects (< 15%)
  const lowMarginProjects = activeProjects.filter(p => p.margin < 15);

  // Cost Structure Analysis
  const totalWoodCost = projects.reduce((sum, p) => {
    const woodCost = p.materials?.reduce((wSum, m) => wSum + (m.calculatedCost || 0), 0) || 0;
    return sum + woodCost;
  }, 0);
  
  const totalLaborCost = projects.reduce((sum, p) => {
    const labor = (p.costs?.carpenter || 0) + (p.costs?.painting || 0) + (p.costs?.packing || 0);
    return sum + labor;
  }, 0);

  const totalWasteCost = projects.reduce((sum, p) => sum + (p.costs?.waste || 0), 0);

  const costData = [
    { name: 'Wood Material', value: totalWoodCost, color: '#FFC107' }, // Amber
    { name: 'Labor & Ops', value: totalLaborCost, color: '#2196F3' }, // Blue
    { name: 'Waste', value: totalWasteCost, color: '#F44336' }, // Red
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6 md:space-y-8 pb-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold uppercase text-black drop-shadow-[2px_2px_0px_rgba(0,0,0,0.2)]">
            Executive Command Center
          </h1>
          <p className="text-muted-foreground font-medium mt-1 text-sm md:text-base">
            Overview of your wood empire's performance and profitability.
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
          <div className="w-full md:w-[200px]">
            <Select value={selectedChannel} onValueChange={setSelectedChannel}>
              <SelectTrigger className="h-12 border-2 border-black shadow-[2px_2px_0px_0px_#000000] font-bold">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <SelectValue placeholder="Filter Channel" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Best Channels</SelectItem>
                {availableChannels.map(channel => (
                  <SelectItem key={channel} value={channel}>{channel}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Link href="/calculator" className="w-full md:w-auto">
            <Button className="w-full md:w-auto neo-button bg-chart-3 text-white hover:bg-blue-700 h-12 px-6 text-lg">
              New Project <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <Card className="neo-card bg-white">
          <CardContent className="p-4 md:p-6 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-chart-1 border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_#000000]">
              <Package className="w-5 h-5 md:w-6 md:h-6 text-black" />
            </div>
            <h3 className="font-heading text-2xl md:text-3xl font-bold mt-1 md:mt-2">{activeSkus}</h3>
            <p className="font-bold uppercase text-[10px] md:text-xs tracking-widest text-muted-foreground">Active SKUs</p>
          </CardContent>
        </Card>

        <Card className="neo-card bg-white">
          <CardContent className="p-4 md:p-6 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-chart-2 border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_#000000]">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <h3 className={cn("font-heading text-2xl md:text-3xl font-bold mt-1 md:mt-2", avgMargin < 15 ? "text-red-500" : "text-green-600")}>
              {avgMargin}%
            </h3>
            <p className="font-bold uppercase text-[10px] md:text-xs tracking-widest text-muted-foreground">Avg. Net Margin</p>
          </CardContent>
        </Card>

        <Card className="neo-card bg-white">
          <CardContent className="p-4 md:p-6 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-chart-4 border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_#000000]">
              <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <h3 className="font-heading text-2xl md:text-3xl font-bold mt-1 md:mt-2">฿{(totalPotentialProfit / 1000).toFixed(1)}k</h3>
            <p className="font-bold uppercase text-[10px] md:text-xs tracking-widest text-muted-foreground">Potential Profit</p>
          </CardContent>
        </Card>

        <Card className="neo-card bg-white">
          <CardContent className="p-4 md:p-6 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-chart-5 border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_#000000]">
              <Star className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <h3 className="font-heading text-2xl md:text-3xl font-bold mt-1 md:mt-2">Lv.{level}</h3>
            <p className="font-bold uppercase text-[10px] md:text-xs tracking-widest text-muted-foreground">Wood Master</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Top Performers Leaderboard */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="neo-card bg-white h-full">
            <CardHeader className="border-b-2 border-black bg-yellow-400 text-black py-3 md:py-4">
              <CardTitle className="font-heading text-lg md:text-xl uppercase flex items-center gap-2">
                <Trophy className="w-6 h-6" /> Top Net Margin Performers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {topProjects.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No projects calculated yet.</div>
              ) : (
                <div className="divide-y-2 divide-black/10">
                  {topProjects.map((project, i) => (
                    <div key={project.id} className="p-4 flex items-center gap-4 hover:bg-yellow-50 transition-colors">
                      <div className={cn(
                        "w-10 h-10 md:w-12 md:h-12 border-2 border-black flex items-center justify-center font-black text-xl shadow-[2px_2px_0px_0px_#000000] flex-shrink-0",
                        i === 0 ? "bg-yellow-300 text-black" : 
                        i === 1 ? "bg-gray-300 text-black" : 
                        i === 2 ? "bg-orange-300 text-black" : "bg-white text-gray-500"
                      )}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h4 className="font-bold text-lg md:text-xl uppercase truncate">{project.name}</h4>
                          <span className="font-mono text-xs text-muted-foreground">v.{project.version}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded border border-green-200">
                            Net Margin: {project.margin}%
                          </span>
                          <span className="text-muted-foreground font-medium">
                            Profit: ฿{project.profit.toLocaleString()}
                          </span>
                          {project.channelName !== 'Default' && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                              via {project.channelName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="hidden md:block text-right">
                        <Link href={`/calculator?edit=${project.id}`}>
                          <Button size="sm" variant="outline" className="border-black hover:bg-black hover:text-white">
                            Analyze
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Margin Alerts */}
          {lowMarginProjects.length > 0 && (
            <Card className="neo-card bg-red-50 border-red-500">
              <CardHeader className="border-b-2 border-red-200 py-3">
                <CardTitle className="font-heading text-base md:text-lg uppercase flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" /> Low Net Margin Alerts ({lowMarginProjects.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  {lowMarginProjects.map(p => (
                    <Link key={p.id} href={`/calculator?edit=${p.id}`}>
                      <div className="bg-white border border-red-200 px-3 py-1 rounded-full text-sm font-bold text-red-600 hover:bg-red-100 cursor-pointer flex items-center gap-2">
                        {p.name} <span className="bg-red-100 px-1.5 rounded text-xs">{p.margin}%</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Cost Structure Analysis */}
        <div className="lg:col-span-1">
          <Card className="neo-card bg-white h-full">
            <CardHeader className="border-b-2 border-black py-3 md:py-4">
              <CardTitle className="font-heading text-lg md:text-xl uppercase flex items-center gap-2">
                <PieIcon className="w-5 h-5" /> Cost Structure
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col items-center justify-center min-h-[300px]">
              {costData.length > 0 ? (
                <div className="w-full h-[250px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={costData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="#000"
                        strokeWidth={2}
                      >
                        {costData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '2px solid #000', 
                          borderRadius: '0px',
                          boxShadow: '4px 4px 0px 0px #000000',
                          fontWeight: 'bold'
                        }} 
                        formatter={(value: number) => `฿${value.toLocaleString()}`}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <div className="text-xs font-bold text-muted-foreground uppercase">Total Cost</div>
                    <div className="text-lg font-black">฿{(totalWoodCost + totalLaborCost + totalWasteCost).toLocaleString()}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  No cost data available.
                </div>
              )}
              <div className="mt-4 text-xs text-center text-muted-foreground">
                Breakdown of costs across all active projects.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
